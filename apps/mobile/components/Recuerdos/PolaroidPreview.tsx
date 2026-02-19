import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "react-native-paper";
import { COLORS, FONT, STYLES } from "@/styles/base";
import HighlightedMentionText from "./HighlightedMentionText";

const screenWidth = Dimensions.get("window").width;

interface PolaroidPreviewProps {
  memory: {
    id: string;
    title: string | null;
    description?: string | null;
    mediaUrl: string | null;
    mimeType?: string | null;
    autorNombre?: string | null;
    fecha?: Date | string | null;
    reactions?: Array<unknown>; // Support for future expansion
  };
  familyMembers?: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
}

export default function PolaroidPreview({ memory, familyMembers = [] }: PolaroidPreviewProps) {
  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })} · ${d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const renderInfoHeader = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      {memory.title ? (
        <Text
          style={{
            ...STYLES.heading,
            color: "#000000",
            textAlign: "left",
            flex: 1,
            paddingRight: 8,
          }}
        >
          {memory.title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </View>
  );

  return (
    <View style={styles.cardContainer}>
      <View style={{ padding: 14, paddingBottom: 0 }}>
        {memory.mediaUrl && (
          <Image
            source={{ uri: memory.mediaUrl }}
            style={{
              width: "100%",
              height: screenWidth * 0.84, // Matching RecuerdoDetailDialog aspect
              borderRadius: 0,
            }}
            contentFit="cover"
          />
        )}
      </View>

      <View style={{ padding: 20, paddingTop: 16 }}>
        {renderInfoHeader()}

        {memory.description && (
          <HighlightedMentionText
            text={memory.description}
            familyMembers={familyMembers}
            style={{
              ...STYLES.subheading,
              marginTop: 8,
              textAlign: "left",
            }}
          />
        )}

        <Text
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            marginTop: 8,
            fontFamily: FONT.regular,
          }}
        >
          Subido por: {memory.autorNombre || "Desconocido"}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            marginTop: 8,
            fontFamily: FONT.regular,
          }}
        >
          {formatDate(memory.fecha)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: screenWidth * 0.92,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
