import { Text as RNText} from "react-native";
import { COLORS } from "@/styles/base";

interface FamilyMember {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface HighlightedMentionTextProps {
  text: string;
  familyMembers?: FamilyMember[];
  groupMembers?: FamilyMember[];
  style?: object;
  numberOfLines?: number;
}

export default function HighlightedMentionText({ 
  text, 
  familyMembers = [],
  groupMembers = [],
  style = {},
  numberOfLines
}: HighlightedMentionTextProps) {
  // Use groupMembers if provided, otherwise fallback to familyMembers
  const members = groupMembers.length > 0 ? groupMembers : familyMembers;
  
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
    const member = members.find((m) => m.id === userId);
    const displayName = member?.displayName || "Usuario desconocido";
    
    // Texto antes de la mención
    if (match.index > lastIndex) {
      parts.push(
        <RNText key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </RNText>
      );
    }

    // Mención resaltada
    parts.push(
      <RNText
        key={`mention-${match.index}`}
        style={{
          backgroundColor: COLORS.primary + "20",
          color: COLORS.primary,
          fontWeight: "600",
          paddingHorizontal: 4,
        }}
      >
        {" " + displayName + " "}
      </RNText>
    );

    lastIndex = match.index + match[0].length;
  }

  // Texto después de la última mención
  if (lastIndex < text.length) {
    parts.push(
      <RNText key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </RNText>
    );
  }

  // Si no hay partes (no hay menciones), retornar el texto simple
  if (parts.length === 0) {
    return (
      <RNText style={style} numberOfLines={numberOfLines}>
        {text}
      </RNText>
    );
  }

  return (
    <RNText style={style} numberOfLines={numberOfLines}>
      {parts}
    </RNText>
  );
}
