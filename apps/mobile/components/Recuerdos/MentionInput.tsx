import { useState, useRef, useMemo, useCallback, useEffect } from "react";
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
  inputStyle?: object;
}

const MENTION_INPUT_THEME = {
  colors: {
    primary: COLORS.primary,
    background: "transparent",
    onSurfaceVariant: COLORS.primary,
    placeholder: COLORS.textSecondary,
  },
};

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
  inputStyle = {},
}: MentionInputProps) {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const inputRef = useRef<RNTextInput>(null);

  // Filtrar al usuario actual de las opciones y memoizar
  const availableMembers = useMemo(
    () => familyMembers.filter((member) => member.id !== currentUserId),
    [familyMembers, currentUserId],
  );

  // Helpers de conversión memoizados
  const toDisplayValue = useCallback(
    (internalValue: string): string => {
      if (!internalValue) return "";
      let result = internalValue;
      availableMembers.forEach((member) => {
        const internalMention = `<@${member.id}>`;
        const displayName = member.displayName.replace(/\s+/g, "");
        result = result.split(internalMention).join(`@${displayName}`);
      });
      return result;
    },
    [availableMembers],
  );

  const toInternalValue = useCallback(
    (displayValue: string): string => {
      if (!displayValue) return "";
      let result = displayValue;
      availableMembers.forEach((member) => {
        const displayName = member.displayName.replace(/\s+/g, "");
        const displayMention = `@${displayName}`;
        result = result.split(displayMention).join(`<@${member.id}>`);
      });
      return result;
    },
    [availableMembers],
  );

  // LOCAL STATE para el input
  // Inicializamos con el valor prop convertido a display
  const [localText, setLocalText] = useState(() => toDisplayValue(value));

  // Sync effect: Solo actualizar localText si el valor externo (prop) difiere semánticamente
  // de lo que nuestro localText produce. Esto rompe el ciclo de re-render y evita el salto de cursor.
  useEffect(() => {
    const currentInternal = toInternalValue(localText);
    const incomingDisplay = toDisplayValue(value);

    // Si nuestro texto local convertido a interno NO coincide con el prop value,
    // significa que el cambio vino de afuera (o hubo una corrección de formato).
    // En ese caso, sincronizamos.
    // Si coinciden, NO tocamos localText para no molestar al cursor.
    if (currentInternal !== value) {
      setLocalText(incomingDisplay);
    }
  }, [value, toInternalValue, toDisplayValue]); // Quitamos localText de deps para evitar loop, usamos state functional update si fuera necesario, pero aquí leemos en render phase logic pattern or simple check.
  // Wait, reading localText in useEffect dep works fine.

  const handleTextChange = useCallback(
    (text: string) => {
      // 1. Actualizar estado local INMEDIATAMENTE (feedback visual rápido)
      setLocalText(text);

      // 2. Lógica de menciones
      const lastAtSymbol = text.lastIndexOf("@");
      if (lastAtSymbol !== -1) {
        const textAfterAt = text.substring(lastAtSymbol + 1);
        const charBeforeAt = lastAtSymbol > 0 ? text[lastAtSymbol - 1] : " ";
        const isAtStart =
          lastAtSymbol === 0 || charBeforeAt === " " || charBeforeAt === "\n";
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

      // 3. Emitir cambio al padre (conversión a interno)
      const internalText = toInternalValue(text);
      onChangeText(internalText);
    },
    [availableMembers, toInternalValue, onChangeText],
  );

  const handleMentionSelect = useCallback(
    (member: FamilyMember) => {
      const displayName = member.displayName.replace(/\s+/g, "");
      const beforeMention = localText.substring(0, mentionStartPos);
      // Usamos mentionSearch 'actual' del render, o derivamos? Estado mentionSearch es fiable.
      const afterMention = localText.substring(
        mentionStartPos + mentionSearch.length + 1,
      );

      // Nuevo valor display
      const newDisplayValue = `${beforeMention}@${displayName} ${afterMention}`;

      // Actualizar local y prop
      setLocalText(newDisplayValue);
      const newInternalValue = toInternalValue(newDisplayValue);
      onChangeText(newInternalValue);

      setShowMentionMenu(false);
      setMentionSearch("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [localText, mentionStartPos, mentionSearch, toInternalValue, onChangeText],
  );

  const filteredMembers = useMemo(() => {
    const searchLow = mentionSearch.toLowerCase();
    return availableMembers.filter((member) =>
      member.displayName.replace(/\s+/g, "").toLowerCase().includes(searchLow),
    );
  }, [availableMembers, mentionSearch]);

  return (
    <View style={{ position: "relative", ...style }}>
      <TextInput
        ref={inputRef}
        label={label}
        value={localText}
        onChangeText={handleTextChange}
        mode={mode}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
        selectionColor={COLORS.primary}
        cursorColor={COLORS.primary}
        theme={MENTION_INPUT_THEME}
        style={[{ backgroundColor: "transparent" }, inputStyle]}
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
