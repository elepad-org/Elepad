import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";

interface TextNoteProps {
  onSaveText: (title: string, content: string) => void;
  onCancel: () => void;
}

export default function TextNoteComponent({
  onSaveText,
  onCancel,
}: TextNoteProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setTitleError("El título es obligatorio");
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSaveText(title, content);
    }
  };

  return (
    <View style={STYLES.contentContainer}>
      <Text style={STYLES.heading}>Nuevo recuerdo de texto</Text>

      <TextInput
        label="Título"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setTitleError("");
        }}
        style={STYLES.input}
        error={!!titleError}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />
      {titleError ? (
        <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 4 }}>
          {titleError}
        </Text>
      ) : null}

      <TextInput
        label="Contenido"
        value={content}
        onChangeText={setContent}
        style={[STYLES.input, { height: 120 }]}
        multiline={true}
        numberOfLines={6}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={STYLES.buttonPrimary}
        disabled={!title.trim()}
      >
        Guardar
      </Button>

      <Button mode="outlined" onPress={onCancel} style={STYLES.buttonSecondary}>
        Cancelar
      </Button>
    </View>
  );
}
