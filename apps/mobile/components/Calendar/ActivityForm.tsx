import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Modal,
  TextInput,
  Button,
  Text,
  Checkbox,
  Menu,
} from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { Activity } from "@elepad/api-client";
import { useGetFrequencies } from "@elepad/api-client";

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
      setCompleted(initial?.completed ?? false);
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
          completed,
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
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={styles.modal}
      theme={{ colors: { backdrop: "rgba(255, 255, 255, 0.82)" } }}
    >
      <ScrollView>
        <Text variant="titleLarge" style={styles.heading}>
          {initial ? "Editar evento" : "Nuevo evento"}
        </Text>

        <TextInput
          label="Título"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
        />

        <View style={styles.pickerRow}>
          <Button
            mode="outlined"
            onPress={() => setShowStartPicker(true)}
            style={styles.pickerButton}
          >
            Inicio: {formatDateTime(startsAtDate)}
          </Button>
        </View>

        <View style={styles.pickerRow}>
          <Button
            mode="outlined"
            onPress={() => setShowEndPicker(true)}
            style={styles.pickerButton}
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

        <View style={styles.row}>
          <Checkbox
            status={completed ? "checked" : "unchecked"}
            onPress={() => setCompleted(!completed)}
          />
          <Text
            onPress={() => setCompleted(!completed)}
            style={styles.checkboxLabel}
          >
            Completado
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Button mode="outlined" onPress={onClose} style={styles.actionBtn}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || !startsAtDate}
            style={styles.actionBtn}
          >
            Guardar
          </Button>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    marginTop: "-40%",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
    elevation: 1,
  },
  heading: {
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  pickerRow: {
    marginBottom: 12,
  },
  pickerButton: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 4,
  },
  error: { color: "red", marginTop: 8, marginBottom: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
});
