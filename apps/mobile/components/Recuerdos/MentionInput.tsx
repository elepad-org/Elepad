import { useState, useRef } from "react";
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { TextInput, Text, Portal, Surface } from "react-native-paper";
import { COLORS } from "@/styles/base";

interface FamilyMember {
  id: string;
  displayName: string;
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
    (member) => member.id !== currentUserId
  );

  const handleTextChange = (text: string) => {
    onChangeText(text);

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
  };

  const handleMentionSelect = (member: FamilyMember) => {
    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(
      mentionStartPos + mentionSearch.length + 1
    );
    const newValue = `${beforeMention}@${member.displayName} ${afterMention}`;

    onChangeText(newValue);
    setShowMentionMenu(false);
    setMentionSearch("");

    // Devolver el foco al input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const filteredMembers = availableMembers.filter((member) =>
    member.displayName.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <View style={{ position: "relative", ...style }}>
      <TextInput
        ref={inputRef}
        label={label}
        value={value}
        onChangeText={handleTextChange}
        mode={mode}
        outlineColor={outlineColor}
        activeOutlineColor={activeOutlineColor}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        disabled={disabled}
      />

      {showMentionMenu && filteredMembers.length > 0 && (
        <Portal>
          <View
            style={{
              position: "absolute",
              top: "50%",
              left: "10%",
              right: "10%",
              transform: [{ translateY: -100 }],
              zIndex: 9999,
            }}
          >
            <Surface
              style={{
                backgroundColor: COLORS.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                maxHeight: 200,
                elevation: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <ScrollView style={{ maxHeight: 200 }}>
                <View style={{ padding: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontWeight: "600",
                    }}
                  >
                    Mencionar a:
                  </Text>
                  {filteredMembers.map((member, index) => (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleMentionSelect(member)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 8,
                        backgroundColor:
                          index % 2 === 0
                            ? "transparent"
                            : COLORS.backgroundSecondary,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: COLORS.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: COLORS.white,
                              fontSize: 14,
                              fontWeight: "600",
                            }}
                          >
                            {member.displayName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 16,
                            color: COLORS.text,
                            fontWeight: "500",
                          }}
                        >
                          {member.displayName}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Surface>
          </View>
        </Portal>
      )}
    </View>
  );
}
