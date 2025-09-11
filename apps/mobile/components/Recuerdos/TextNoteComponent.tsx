import React, { useState } from "react";
import { View } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

interface TextNoteProps {
  onSaveText: (title: string, content: string) => void;
  onCancel: () => void;
}

export default function TextNoteComponent({
  onSaveText,
  onCancel,
}: TextNoteProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onSaveText("Nueva nota", content);
    }
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
      }}
    >
      <Text style={STYLES.heading}>Nueva nota</Text>
      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        Escribe tu nota o recordatorio:
      </Text>

      <TextInput
        value={content}
        onChangeText={setContent}
        style={{ marginBottom: 20, height: 120 }}
        multiline={true}
        numberOfLines={6}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Escribe aquí tu nota..."
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={{ ...STYLES.buttonPrimary, marginBottom: 12 }}
        disabled={!content.trim()}
      >
        Guardar nota
      </Button>

      <CancelButton onPress={onCancel} />
    </View>
  );
}
