import { useState } from "react";
import { View } from "react-native";
import { TextInput, Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";
import MentionInput from "./MentionInput";

interface FamilyMember {
  id: string;
  displayName: string;
}

interface MetadataInputProps {
  onSave: (title?: string, caption?: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
  familyMembers?: FamilyMember[];
  currentUserId?: string;
}

export default function MetadataInputComponent({
  onSave,
  onCancel,
  isUploading = false,
  familyMembers = [],
  currentUserId,
}: MetadataInputProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");

  const handleSubmit = () => {
    onSave(title.trim() || undefined, caption.trim() || undefined);
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
        Agrega un título y descripción (opcional)
      </Text>

      <TextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        style={{ marginBottom: 12 }}
        mode="outlined"
        outlineColor={COLORS.border}
        activeOutlineColor={COLORS.primary}
        placeholder="Ej: Día en la playa"
        disabled={isUploading}
      />

      <MentionInput
        label="Descripción"
        value={caption}
        onChangeText={setCaption}
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
        <CancelButton onPress={onCancel} disabled={isUploading} />
        <CancelButton
          onPress={handleSubmit}
          text={isUploading ? "Subiendo..." : "Guardar"}
          disabled={isUploading}
        />
      </View>
    </View>
  );
}
