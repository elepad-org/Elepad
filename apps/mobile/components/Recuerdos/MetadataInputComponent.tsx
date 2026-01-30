import { useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import CancelButton from "../shared/CancelButton";
import SaveButton from "../shared/SaveButton";
import MentionInput from "./MentionInput";
import { StyledTextInput } from "../shared";

interface FamilyMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  activeFrameUrl?: string | null;
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

      <StyledTextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        placeholder="Ej: Día en la playa"
        disabled={isUploading}
        marginBottom={12}
      />

      <View
        style={{
          backgroundColor: COLORS.backgroundSecondary,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 20,
        }}
      >
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
          mode="flat"
          outlineColor="transparent"
          activeOutlineColor="transparent"
          inputStyle={{ backgroundColor: "transparent" }}
        />
      </View>

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
            text={isUploading ? "Subiendo..." : "Guardar"}
            disabled={isUploading}
            loading={isUploading}
          />
        </View>
      </View>
    </View>
  );
}
