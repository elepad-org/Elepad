import { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Animated, Platform } from "react-native";
import { useRef } from "react";
import {
  TextInput,
  Button,
  Text,
  Menu,
  Dialog,
  Portal,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  DatePickerInput,
  TimePickerModal,
  registerTranslation,
  es,
} from "react-native-paper-dates";
import type { Activity } from "@elepad/api-client";
import { useGetFrequencies } from "@elepad/api-client";
import { COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";
import SaveButton from "../shared/SaveButton";
import MentionInput from "../Recuerdos/MentionInput";
import DropdownSelect from "../shared/DropdownSelect";
import { useAuth } from "@/hooks/useAuth";
import { formatInUserTimezone } from "@/lib/timezoneHelpers";

// Register locale for paper-dates
registerTranslation("es", es);

type Frequency = {
  id: string;
  label: string;
  rrule: string | null;
};

type FamilyMember = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  elder?: boolean;
  activeFrameUrl?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Activity>) => Promise<void>;
  initial?: Partial<Activity> | null;
  familyMembers?: FamilyMember[];
  currentUserId?: string;
  preSelectedElderId?: string | null;
};

// Componente helper para input de fecha y hora en Web usando react-native-paper-dates
const PaperDateTimeWeb = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) => {
  // Manejo del TimePicker
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  const onConfirmTime = useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setTimePickerVisible(false);
      // Si no hay fecha seleccionada, usamos hoy
      const baseDate = value ? new Date(value) : new Date();
      baseDate.setHours(hours);
      baseDate.setMinutes(minutes);
      // Asegurar que seconds/ms estén en 0 para limpieza
      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);
      onChange(baseDate);
    },
    [value, onChange],
  );

  return (
    <View style={{ flex: 1, flexDirection: "row", gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
            marginBottom: 4,
          }}
        >
          {label} - Fecha
        </Text>
        <DatePickerInput
          locale="es"
          label={label}
          value={value}
          onChange={(d) => {
            if (d) {
              const newDate = new Date(d);
              if (value) {
                newDate.setHours(value.getHours());
                newDate.setMinutes(value.getMinutes());
              } else {
                const now = new Date();
                newDate.setHours(now.getHours());
                newDate.setMinutes(now.getMinutes());
              }
              onChange(newDate);
            } else {
              onChange(undefined);
            }
          }}
          inputMode="start"
          style={{
            backgroundColor: COLORS.backgroundSecondary,
            fontSize: 14,
            height: 50,
            borderRadius: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
          mode="flat"
          outlineColor="transparent"
          activeOutlineColor="transparent"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            color: COLORS.textSecondary,
            marginBottom: 4,
          }}
        >
          {label} - Hora
        </Text>
        <Button
          mode="outlined"
          onPress={() => setTimePickerVisible(true)}
          style={{
            borderColor: "transparent",
            backgroundColor: COLORS.backgroundSecondary,
            borderRadius: 16,
          }}
          contentStyle={{ height: 50 }}
          labelStyle={{
            fontSize: 14,
            color: "#535353ff",
            fontWeight: "normal",
          }}
        >
          {value
            ? value.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "--:--"}
        </Button>
      </View>

      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={() => setTimePickerVisible(false)}
        onConfirm={onConfirmTime}
        hours={value ? value.getHours() : 12}
        minutes={value ? value.getMinutes() : 0}
        locale="es"
        label="Seleccionar hora"
        cancelLabel="Cancelar"
        confirmLabel="Confirmar"
      />
    </View>
  );
};

export default function ActivityForm({
  visible,
  onClose,
  onSave,
  initial,
  familyMembers = [],
  currentUserId,
  preSelectedElderId,
}: Props) {
  const { userElepad } = useAuth();
  const isElder = userElepad?.elder ?? false;

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [assignedTo, setAssignedTo] = useState<string | null>(
    initial?.assignedTo || null,
  );
  const [startsAtDate, setStartsAtDate] = useState<Date>(
    initial?.startsAt ? new Date(initial.startsAt) : new Date(),
  );
  const [endsAtDate, setEndsAtDate] = useState<Date | undefined>(
    initial?.endsAt ? new Date(initial.endsAt) : undefined,
  );
  const [frequencyId, setFrequencyId] = useState<string | undefined>(
    initial?.frequencyId || undefined,
  );
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  // Filtrar solo adultos mayores (elders) para el selector
  const elders = familyMembers.filter((member) => member.elder === true);

  // Fetch available frequencies
  const frequenciesQuery = useGetFrequencies();

  // Extract frequencies from response
  const frequencies: Frequency[] = (() => {
    if (!frequenciesQuery.data) return [];
    const data = frequenciesQuery.data as { data?: Frequency[] } | Frequency[];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  })();

  const selectedFrequency = frequencies.find(
    (f: Frequency) => f.id === frequencyId,
  );
  const frequencyLabel = selectedFrequency?.label || "Una vez";

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setStartsAtDate(
        initial?.startsAt ? new Date(initial.startsAt) : new Date(),
      );
      setEndsAtDate(initial?.endsAt ? new Date(initial.endsAt) : undefined);
      setFrequencyId(initial?.frequencyId || undefined);

      // Si es un elder, assignedTo siempre es él mismo
      // Si es familiar y está editando, mantener el assignedTo existente
      // Si es familiar y está creando nueva actividad:
      //   - Si hay un elder pre-seleccionado desde el filtro, usarlo
      //   - Si no, requiere seleccionar destinatario manualmente
      if (isElder) {
        setAssignedTo(currentUserId || null);
      } else {
        setAssignedTo(initial?.assignedTo || preSelectedElderId || null);
      }

      setError(null);
    }
  }, [visible, initial, isElder, currentUserId, preSelectedElderId]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleSave = async () => {
    setError(null);
    
    // Validar que el título no esté vacío
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    const finalTitle = title.trim();

    if (!startsAtDate) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }

    // Validar que se haya seleccionado un destinatario
    if (!assignedTo) {
      setError(
        isElder
          ? "Error: No se pudo determinar el destinatario."
          : "Debes seleccionar un destinatario para la actividad.",
      );
      return;
    }

    setSaving(true);
    try {
      // Timeout de 10 segundos para la petición
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout: La petición tardó demasiado")),
          10000,
        ),
      );

      await Promise.race([
        onSave({
          title: finalTitle,
          description,
          startsAt: startsAtDate.toISOString(),
          endsAt: endsAtDate ? endsAtDate.toISOString() : undefined,
          completed: initial?.completed ?? false,
          frequencyId: frequencyId || null,
          assignedTo: assignedTo,
        }),
        timeoutPromise,
      ]);

      // Solo cerramos si fue exitoso (onSave no lanzó error)
      onClose();
    } catch (error) {
      // Capturamos el error y lo mostramos en el formulario
      // NO cerramos el modal para que el usuario no pierda los datos
      console.error("Error al guardar:", error);

      const errorMessage =
        error instanceof Error && error.message.includes("Timeout")
          ? "La petición está tardando mucho. Por favor, verifica tu conexión e inténtalo de nuevo."
          : "No se pudo guardar la actividad. Por favor, verifica tu conexión e inténtalo de nuevo.";

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (d?: Date) => {
    if (!d) return "No definido";
    return formatInUserTimezone(d, "dd/MM/yyyy HH:mm", userElepad?.timezone);
  };

  return (
    <>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={onClose}
          style={{
            backgroundColor: COLORS.background,
            width: "92%",
            alignSelf: "center",
            borderRadius: 20,
            maxHeight: "100%",
          }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Dialog.Content style={{ paddingBottom: 15 }}>
              <View style={styles.inputWrapper}>
                <TextInput
                  label="Título"
                  value={title}
                  onChangeText={setTitle}
                  placeholder={initial ? "Agregar evento" : "Nuevo evento"}
                  mode="flat"
                  outlineColor="transparent"
                  activeOutlineColor="transparent"
                  style={{ backgroundColor: "transparent" }}
                  autoFocus={!initial}
                />
              </View>

              {/* Selector de destinatario - solo visible para familiares (no elders) */}
              {!isElder && elders.length > 0 && (
                <View style={styles.destinatarioWrapper}>
                  <Text style={styles.destinatarioLabel}>
                    Para (destinatario)
                  </Text>
                  <DropdownSelect
                    label="Para (destinatario)"
                    value={assignedTo || ""}
                    options={elders.map((elder) => ({
                      key: elder.id,
                      label: elder.displayName,
                      avatarUrl: elder.avatarUrl || null,
                      frameUrl: elder.activeFrameUrl || null,
                    }))}
                    onSelect={(value) => setAssignedTo(value)}
                    placeholder="Seleccionar adulto mayor"
                    showLabel={false}
                    buttonStyle={{
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                      borderRadius: 0,
                    }}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <MentionInput
                  label="Descripción"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Descripción (opcional)"
                  multiline
                  numberOfLines={3}
                  familyMembers={familyMembers}
                  currentUserId={currentUserId}
                  mode="flat"
                  outlineColor="transparent"
                  activeOutlineColor="transparent"
                  style={{ backgroundColor: "transparent" }}
                />
              </View>

              <View style={styles.dateRow}>
                {Platform.OS === "web" ? (
                  <>
                    <PaperDateTimeWeb
                      label="Inicio"
                      value={startsAtDate}
                      onChange={(d: Date | undefined) =>
                        setStartsAtDate(d || new Date())
                      }
                    />
                    <PaperDateTimeWeb
                      label="Fin"
                      value={endsAtDate}
                      onChange={(d: Date | undefined) => setEndsAtDate(d)}
                    />
                  </>
                ) : (
                  <>
                    <View style={styles.dateColumn}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowStartPicker(true)}
                        style={styles.pickerButton}
                        icon="calendar"
                        contentStyle={{ paddingVertical: 4 }}
                      >
                        Inicio
                      </Button>
                      <Text style={styles.dateText}>
                        {formatDateTime(startsAtDate)}
                      </Text>
                    </View>

                    <View style={styles.dateColumn}>
                      <Button
                        mode="outlined"
                        onPress={() => setShowEndPicker(true)}
                        style={styles.pickerButton}
                        icon="calendar"
                        contentStyle={{ paddingVertical: 4 }}
                      >
                        Fin
                      </Button>
                      <Text style={styles.dateText}>
                        {endsAtDate
                          ? formatDateTime(endsAtDate)
                          : "No definido"}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              <Menu
                visible={showFrequencyMenu}
                onDismiss={() => setShowFrequencyMenu((prev) => !prev)}
                contentStyle={{
                  backgroundColor: COLORS.background,
                  borderRadius: 12,
                  maxHeight: 300,
                }}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowFrequencyModal(true)}
                    icon="repeat"
                  >
                    Frecuencia: {frequencyLabel}
                  </Button>
                }
              >
                {frequencies.map((freq: Frequency) => (
                  <Menu.Item
                    key={freq.id}
                    onPress={() => {
                      setFrequencyId(freq.id);
                      setShowFrequencyMenu((prev) => !prev);
                    }}
                    title={freq.label}
                  />
                ))}
              </Menu>

              <DateTimePickerModal
                isVisible={showStartPicker}
                date={startsAtDate}
                mode="datetime"
                onConfirm={(date) => {
                  setShowStartPicker(false);
                  setStartsAtDate(date);
                }}
                onCancel={() => setShowStartPicker(false)}
              />
              <DateTimePickerModal
                isVisible={showEndPicker}
                date={endsAtDate ?? new Date()}
                mode="datetime"
                onConfirm={(date) => {
                  setShowEndPicker(false);
                  setEndsAtDate(date);
                }}
                onCancel={() => setShowEndPicker(false)}
              />

              {error && <Text style={styles.error}>{error}</Text>}
            </Dialog.Content>
            <Dialog.Actions
              style={{
                paddingBottom: 30,
                paddingHorizontal: 24,
                paddingTop: 10,
                justifyContent: "space-between",
              }}
            >
              <View style={{ width: 120 }}>
                <CancelButton onPress={onClose} />
              </View>
              <View style={{ width: 120 }}>
                <SaveButton
                  onPress={handleSave}
                  disabled={
                    saving || !title.trim() || !startsAtDate || (!isElder && !assignedTo)
                  }
                  loading={saving}
                />
              </View>
            </Dialog.Actions>
          </Animated.View>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={showFrequencyModal}
          onDismiss={() => setShowFrequencyModal(false)}
          style={{
            backgroundColor: COLORS.background,
            width: "92%",
            alignSelf: "center",
            borderRadius: 20,
          }}
        >
          <Dialog.Title
            style={{
              textAlign: "center",
              color: COLORS.primary,
              fontWeight: "bold",
              fontSize: 20,
            }}
          >
            Seleccionar frecuencia
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 310 }}>
              {frequencies.map((freq) => (
                <Button
                  key={freq.id}
                  mode="outlined"
                  onPress={() => {
                    setFrequencyId(freq.id);
                    setShowFrequencyModal(false);
                  }}
                  style={{
                    marginBottom: 8,
                    borderRadius: 12,
                    borderColor:
                      frequencyId === freq.id ? COLORS.primary : COLORS.border,
                    backgroundColor:
                      frequencyId === freq.id
                        ? `${COLORS.primary}15`
                        : COLORS.backgroundSecondary,
                  }}
                  textColor={
                    frequencyId === freq.id
                      ? COLORS.primary
                      : COLORS.textSecondary
                  }
                >
                  {freq.label}
                </Button>
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  destinatarioWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    marginBottom: 16,
  },
  destinatarioLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
    minHeight: 80,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateColumn: {
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
  pickerButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    marginBottom: 16,
  },
  error: {
    color: COLORS.error,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 12,
    flex: 1,
  },
});
