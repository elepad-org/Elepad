import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Modal, TextInput, Button, Text, Checkbox } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import type { Activity } from "@elepad/api-client";

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
  const [saving, setSaving] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title || "");
      setDescription(initial?.description || "");
      setStartsAtDate(
        initial?.startsAt ? new Date(initial.startsAt) : new Date(),
      );
      setEndsAtDate(initial?.endsAt ? new Date(initial.endsAt) : undefined);
      setCompleted(initial?.completed ?? false);
      setError(null);
    }
  }, [visible, initial]);

  const handleSave = async () => {
    setError(null);
    if (!startsAtDate) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        startsAt: startsAtDate.toISOString(),
        endsAt: endsAtDate ? endsAtDate.toISOString() : undefined,
        completed,
      });
      onClose();
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

      {/* Pickers */}
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
        <Button
          mode="outlined"
          onPress={onClose}
          disabled={saving}
          style={styles.actionBtn}
        >
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
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
