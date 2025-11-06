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
      <Text style={STYLES.heading}>Detalles del recuerdo</Text>
      <Text style={{ ...STYLES.subheading, marginBottom: 16 }}>
        Agrega un título y descripción
      </Text>

      <TextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        style={{ marginBottom: 12 }}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Ej: Recordatorio importante"
        disabled={isUploading}
      />

      <TextInput
        label="Descripción"
        value={content}
        onChangeText={setContent}
        style={{ marginBottom: 20 }}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Describe tu recuerdo..."
        multiline={true}
        numberOfLines={3}
        disabled={isUploading}
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
          text={isUploading ? "Guardando..." : "Guardar"}
          disabled={!title.trim() || !content.trim() || isUploading}
        />
      </View>
    </View>
  );
}
