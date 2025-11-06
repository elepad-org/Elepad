import { useState } from "react";
import { View } from "react-native";
import { TextInput, Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";

interface TextNoteProps {
  onSaveText: (title: string, content: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function TextNoteComponent({
  onSaveText,
  onCancel,
  isUploading = false,
}: TextNoteProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      onSaveText(title, content);
    }
  };

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
        borderRadius: 20,
      }}
    >
      <Text style={STYLES.heading}>Nueva nota</Text>
      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        Escribe tu nota o recordatorio
      </Text>

      <TextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        style={{ marginBottom: 12 }}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Título de la nota..."
      />

      <TextInput
        label="Contenido"
        value={content}
        onChangeText={setContent}
        style={{ marginBottom: 20, height: 120, borderRadius: 20 }}
        multiline={true}
        numberOfLines={6}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Escribe aquí tu nota..."
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <CancelButton onPress={onCancel} disabled={isUploading} />
        <CancelButton
          onPress={handleSubmit}
          text={isUploading ? "Guardando..." : "Aceptar"}
          disabled={!title.trim() || !content.trim() || isUploading}
        />
      </View>
    </View>
  );
}
