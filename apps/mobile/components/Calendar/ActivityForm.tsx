import { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
} from "react-native";
import { TextInput, Button, Text, Menu, Dialog } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { Activity } from "@elepad/api-client";
import { useGetFrequencies } from "@elepad/api-client";
import { COLORS, STYLES } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

type Frequency = {
  id: string;
  label: string;
  rrule: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Activity>) => Promise<void>;
  initial?: Partial<Activity> | null;
};

export default function ActivityForm({
  visible,
  onClose,
  onSave,
  initial,
}: Props) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
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
  const [titleSelection, setTitleSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const titleInputRef = useRef<RNTextInput>(null);

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
      setError(null);
    }
  }, [visible, initial]);

  const handleSave = async () => {
    setError(null);
    const finalTitle =
      title.trim() || (initial ? "Evento sin título" : "Nuevo evento");

    if (!startsAtDate) {
      setError("La fecha de inicio es obligatoria.");
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
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
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
      <View style={{ paddingTop: 8, paddingBottom: 0, paddingHorizontal: 24 }}>
        <TextInput
          ref={titleInputRef}
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setTitleSelection(undefined);
          }}
          onFocus={() => {
            setTitleSelection({ start: title.length, end: title.length });
          }}
          selection={titleSelection}
          style={styles.titleInput}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          textColor={COLORS.text}
          placeholder={initial ? "Editar evento" : "Nuevo evento"}
          placeholderTextColor={COLORS.text}
          theme={{
            colors: {
              primary: "transparent",
              background: "transparent",
            },
          }}
        />
      </View>
      <Dialog.Content style={{ paddingBottom: 15 }}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder="Descripción (opcional)"
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            mode="flat"
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            theme={{
              colors: {
                background: "transparent",
              },
            }}
          />
        </View>

        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Button
              mode="outlined"
              onPress={() => setShowStartPicker(true)}
              style={styles.pickerButton}
              icon="calendar"
              contentStyle={{ paddingVertical: 4 }}
            >
              Inicio 2
            </Button>
            <Text style={styles.dateText}>{formatDateTime(startsAtDate)}</Text>
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
              {endsAtDate ? formatDateTime(endsAtDate) : "No definido"}
            </Text>
          </View>
        </View>

        <Menu
          visible={showFrequencyMenu}
          onDismiss={() => setShowFrequencyMenu(false)}
          contentStyle={{
            backgroundColor: COLORS.background,
            borderRadius: 12,
          }}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowFrequencyMenu(true)}
              style={styles.pickerButton}
              icon="repeat"
            >
              Frecuencia 2: {frequencyLabel}
            </Button>
          }
        >
          <ScrollView style={{ maxHeight: 300 }}>
            <Menu.Item
              onPress={() => {
                setFrequencyId(undefined);
                setShowFrequencyMenu(false);
              }}
              title="Una vez"
            />
            {frequencies.map((freq: Frequency) => (
              <Menu.Item
                key={freq.id}
                onPress={() => {
                  setFrequencyId(freq.id);
                  setShowFrequencyMenu(false);
                }}
                title={freq.label}
              />
            ))}
          </ScrollView>
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
          paddingBottom: 20,
          paddingHorizontal: 20,
          justifyContent: "space-between",
        }}
      >
        <CancelButton onPress={onClose} />
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !startsAtDate}
          style={styles.saveButton}
          buttonColor={COLORS.primary}
        >
          Guardar
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
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
    paddingHorizontal: 24,
    elevation: 0,
  },
});
