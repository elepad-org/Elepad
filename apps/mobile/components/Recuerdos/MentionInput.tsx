import { useState, useRef } from "react";
import { View, TextInput as RNTextInput } from "react-native";
import { TextInput } from "react-native-paper";
import { COLORS } from "@/styles/base";
import PickerModal from "@/components/shared/PickerModal";

interface FamilyMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  activeFrameUrl?: string | null;
}

interface MentionInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  familyMembers: FamilyMember[];
  currentUserId?: string;
  mode?: "outlined" | "flat";
  outlineColor?: string;
  activeOutlineColor?: string;
  style?: object;
}

export default function MentionInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  familyMembers = [],
  currentUserId,
  mode = "outlined",
  outlineColor = COLORS.border,
  activeOutlineColor = COLORS.primary,
  style = {},
}: MentionInputProps) {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const inputRef = useRef<RNTextInput>(null);

  // Filtrar al usuario actual de las opciones
  const availableMembers = familyMembers.filter(
    (member) => member.id !== currentUserId,
  );

  // Convertir formato interno <@user_id> a formato de display @nombre
  const toDisplayValue = (internalValue: string): string => {
    if (!internalValue) return "";
    let result = internalValue;
    availableMembers.forEach((member) => {
      const internalMention = `<@${member.id}>`;
      // Eliminar espacios del nombre para facilitar el parsing
      const displayName = member.displayName.replace(/\s+/g, "");
      result = result.split(internalMention).join(`@${displayName}`);
    });
    return result;
  };

  // Convertir formato de display @nombre a formato interno <@user_id>
  const toInternalValue = (displayValue: string): string => {
    if (!displayValue) return "";
    let result = displayValue;
    availableMembers.forEach((member) => {
      // Eliminar espacios del nombre para facilitar el parsing
      const displayName = member.displayName.replace(/\s+/g, "");
      const displayMention = `@${displayName}`;
      result = result.split(displayMention).join(`<@${member.id}>`);
    });
    return result;
  };

  const displayValue = toDisplayValue(value);

  const handleTextChange = (text: string) => {
    // Detectar si se escribió @ y activar el menú de menciones
    const lastAtSymbol = text.lastIndexOf("@");

    if (lastAtSymbol !== -1) {
      const textAfterAt = text.substring(lastAtSymbol + 1);

      // Solo mostrar el menú si @ está al principio o precedido por espacio
      const charBeforeAt = lastAtSymbol > 0 ? text[lastAtSymbol - 1] : " ";
      const isAtStart =
        lastAtSymbol === 0 || charBeforeAt === " " || charBeforeAt === "\n";

      // Y no hay espacios después del @
      const hasSpaceAfter =
        textAfterAt.includes(" ") || textAfterAt.includes("\n");

      if (isAtStart && !hasSpaceAfter && availableMembers.length > 0) {
        setShowMentionMenu(true);
        setMentionSearch(textAfterAt);
        setMentionStartPos(lastAtSymbol);
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }

    // Convertir a formato interno antes de guardar
    const internalText = toInternalValue(text);
    onChangeText(internalText);
  };

  const handleMentionSelect = (member: FamilyMember) => {
    const displayName = member.displayName.replace(/\s+/g, "");
    const beforeMention = displayValue.substring(0, mentionStartPos);
    const afterMention = displayValue.substring(
      mentionStartPos + mentionSearch.length + 1,
    );

    // Crear el nuevo valor en formato display
    const newDisplayValue = `${beforeMention}@${displayName} ${afterMention}`;

    // Convertir a formato interno para guardar
    const newInternalValue = toInternalValue(newDisplayValue);

    onChangeText(newInternalValue);
    setShowMentionMenu(false);
    setMentionSearch("");

    // Devolver el foco al input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const filteredMembers = availableMembers.filter((member) => {
    const searchName = member.displayName.replace(/\s+/g, "").toLowerCase();
    return searchName.includes(mentionSearch.toLowerCase());
  });

  return (
    <View style={{ position: "relative", ...style }}>
      <TextInput
        ref={inputRef}
        label={label}
        value={displayValue}
        onChangeText={handleTextChange}
        mode={mode}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        selectionColor={COLORS.primary + "40"}
      />

      <PickerModal
        visible={showMentionMenu}
        title="Mencionar a:"
        options={filteredMembers.map((member) => ({
          id: member.id,
          label: member.displayName,
          avatarUrl: member.avatarUrl,
          frameUrl: member.activeFrameUrl,
        }))}
        onSelect={(option) => {
          const member = filteredMembers.find((m) => m.id === option.id);
          if (member) handleMentionSelect(member);
        }}
      />
    </View>
  );
}
