import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Modal, TextInput, Button, Text, Checkbox } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { STYLES as baseStyles } from "@/styles/base";
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

  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      contentContainerStyle={[styles.modal, baseStyles.card]}
    >
      <Text variant="titleMedium" style={styles.heading}>
        Evento
      </Text>
      <TextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        style={[styles.input, baseStyles.input]}
      />
      <TextInput
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, baseStyles.input]}
      />

      <View style={styles.pickerRow}>
        <Button
          mode="outlined"
          onPress={() => setShowStartPicker(true)}
          style={styles.pickerButton}
        >
          Inicio: {startsAtDate ? startsAtDate.toLocaleString() : "No definido"}
        </Button>
        <Button
          mode="outlined"
          onPress={() => setShowEndPicker(true)}
          style={styles.pickerButton}
        >
          Fin: {endsAtDate ? endsAtDate.toLocaleString() : "No definido"}
        </Button>
      </View>

      {/* DatePicker para fecha de inicio */}
      <DateTimePickerModal
        isVisible={showStartPicker}
        date={startsAtDate}
        mode="datetime"
        onConfirm={(date) => {
          setShowStartPicker(false);
          setStartsAtDate(date);
        }}
        onCancel={() => setShowStartPicker(false)}
        title="Selecciona la fecha de inicio"
      />

      {/* DatePicker para fecha de fin */}
      <DateTimePickerModal
        isVisible={showEndPicker}
        date={endsAtDate ?? new Date()}
        mode="datetime"
        onConfirm={(date) => {
          setShowEndPicker(false);
          setEndsAtDate(date);
        }}
        onCancel={() => setShowEndPicker(false)}
        title="Selecciona la fecha de fin"
      />

      <View style={styles.row}>
        <Checkbox
          status={completed ? "checked" : "unchecked"}
          onPress={() => setCompleted(!completed)}
        />
        <Text style={{ marginTop: 8 }}>Completado</Text>
      </View>

      {error && (
        <Text style={{ color: "red", marginTop: 8, marginBottom: 4 }}>
          {error}
        </Text>
      )}

      <View style={[styles.actions, { justifyContent: "space-between" }]}>
        <Button onPress={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !startsAtDate}
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
    borderRadius: 12,
    padding: 16,
  },
  heading: { marginBottom: 12 },
  input: { marginBottom: 8 },
  actions: { flexDirection: "row", marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  pickerRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  pickerButton: { flex: 1, marginRight: 8 },
});
