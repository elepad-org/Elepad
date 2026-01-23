import { useState } from "react";
import { View } from "react-native";
import { TextInput, Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";
import SaveButton from "../shared/SaveButton";
import MentionInput from "./MentionInput";

interface FamilyMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  activeFrameUrl?: string | null;
}

interface TextNoteProps {
  onSaveText: (title: string, content: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
  familyMembers?: FamilyMember[];
  currentUserId?: string;
}

export default function TextNoteComponent({
  onSaveText,
  onCancel,
  isUploading = false,
  familyMembers = [],
  currentUserId,
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

      <MentionInput
        label="Descripción"
        value={content}
        onChangeText={setContent}
        placeholder="Describe tu recuerdo... Usa @ para mencionar"
        multiline
        numberOfLines={3}
        disabled={isUploading}
        familyMembers={familyMembers}
        currentUserId={currentUserId}
        style={{ marginBottom: 20 }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ width: 120 }}>
          <CancelButton onPress={onCancel} disabled={isUploading} />
        </View>
        <View style={{ width: 120 }}>
          <SaveButton
            onPress={handleSubmit}
            text={isUploading ? "Guardando..." : "Guardar"}
            disabled={!title.trim() || !content.trim() || isUploading}
            loading={isUploading}
          />
        </View>
      </View>
    </View>
  );
}
