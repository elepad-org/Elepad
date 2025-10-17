import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  TextInput,
  Button,
  Text,
  Checkbox,
  Menu,
  Dialog,
  IconButton,
  Divider,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { Activity } from "@elepad/api-client";
import { useGetFrequencies } from "@elepad/api-client";
import { COLORS, STYLES } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

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
  const [completed, setCompleted] = useState(initial?.completed ?? false);
  const [frequencyId, setFrequencyId] = useState<string | undefined>(
    initial?.frequencyId || undefined,
  );
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available frequencies
  const frequenciesQuery = useGetFrequencies();

  // Extract frequencies from response
  const frequencies = (() => {
    if (!frequenciesQuery.data) return [];
    const data = frequenciesQuery.data as any;
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  })();

  const selectedFrequency = frequencies.find((f: any) => f.id === frequencyId);
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
    if (!title.trim()) {
      setError("El título es obligatorio.");
      return;
    }
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
          title,
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
        width: "90%",
        alignSelf: "center",
        borderRadius: 16,
        paddingVertical: 14,
      }}
    >
      <Dialog.Title
        style={{ ...STYLES.heading, paddingTop: 8, marginBottom: 0 }}
      >
        {initial ? "Editar evento" : "Nuevo evento"}
      </Dialog.Title>
      <Dialog.Content style={{ paddingBottom: 8, paddingTop: 4 }}>
        <Text style={{ ...STYLES.subheading, marginBottom: 16, marginTop: 0 }}>
          {initial
            ? "Edita los detalles del evento"
            : "Completa los detalles del nuevo evento"}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TextInput
            label="Título"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.pickerRow}>
            <Button
              mode="outlined"
              onPress={() => setShowStartPicker(true)}
              style={styles.pickerButton}
              icon="calendar"
            >
              Inicio: {formatDateTime(startsAtDate)}
            </Button>
          </View>

          <View style={styles.pickerRow}>
            <Button
              mode="outlined"
              onPress={() => setShowEndPicker(true)}
              style={styles.pickerButton}
              icon="calendar"
            >
              Fin: {formatDateTime(endsAtDate)}
            </Button>
          </View>

          <View style={styles.pickerRow}>
            <Menu
              visible={showFrequencyMenu}
              onDismiss={() => setShowFrequencyMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setShowFrequencyMenu(true)}
                  style={styles.pickerButton}
                  icon="repeat"
                >
                  Frecuencia: {frequencyLabel}
                </Button>
              }
            >
              {frequencies.map((freq: any) => (
                <Menu.Item
                  key={freq.id}
                  onPress={() => {
                    setFrequencyId(freq.id);
                    setShowFrequencyMenu(false);
                  }}
                  title={freq.label}
                />
              ))}
            </Menu>
          </View>

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
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions
        style={{
          paddingBottom: 12,
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
  input: {
    marginBottom: 14,
    backgroundColor: "transparent",
  },
  pickerRow: {
    marginBottom: 14,
  },
  pickerButton: {
    borderRadius: 12,
    borderColor: COLORS.border,
  },
  error: {
    color: COLORS.error,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  saveButton: {
    borderRadius: 20,
    paddingHorizontal: 24,
  },
});
