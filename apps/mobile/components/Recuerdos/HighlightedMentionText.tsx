import { Text as RNText, View } from "react-native";
import { COLORS } from "@/styles/base";

interface FamilyMember {
  id: string;
  displayName: string;
}

interface HighlightedMentionTextProps {
  text: string;
  familyMembers?: FamilyMember[];
  style?: object;
}

export default function HighlightedMentionText({ 
  text, 
  familyMembers = [],
  style = {} 
}: HighlightedMentionTextProps) {
  if (!text) return null;

  // Detectar menciones en formato <@user_id> estilo Discord
  const mentionRegex = /<@([^>]+)>/g;
  const parts: React.ReactElement[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  mentionRegex.lastIndex = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    const userId = match[1];
    const member = familyMembers.find((m) => m.id === userId);
    const displayName = member?.displayName || "Usuario desconocido";
    
    // Texto antes de la mención
    if (match.index > lastIndex) {
      parts.push(
        <RNText key={`text-${lastIndex}`} style={{ ...style, flexShrink: 1 }}>
          {text.substring(lastIndex, match.index)}
        </RNText>
      );
    }

    // Mención resaltada
    parts.push(
      <View
        key={`mention-${match.index}`}
        style={{
          backgroundColor: COLORS.primary + "15",
          borderRadius: 8,
          paddingHorizontal: 6,
          paddingVertical: 2,
        }}
      >
        <RNText
          style={{
            color: COLORS.primary,
            fontWeight: "600",
          }}
        >
          {displayName}
        </RNText>
      </View>
    );

    lastIndex = match.index + match[0].length;
  }

  // Texto después de la última mención
  if (lastIndex < text.length) {
    parts.push(
      <RNText key={`text-${lastIndex}`} style={{ ...style, flexShrink: 1 }}>
        {text.substring(lastIndex)}
      </RNText>
    );
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
      {parts}
    </View>
  );
}
