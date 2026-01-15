import { View, Image, Pressable, StyleSheet } from "react-native";
import { Text, Card } from "react-native-paper";
import { COLORS, SHADOWS } from "@/styles/base";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AlbumCardProps {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  createdAt: string;
  totalPages?: number;
  onPress: () => void;
}

export default function AlbumCard({
  title,
  description,
  coverImageUrl,
  createdAt,
  totalPages,
  onPress,
}: AlbumCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Card style={styles.card} elevation={2}>
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          {coverImageUrl ? (
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={60}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <Card.Content style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={styles.date}>{formatDate(createdAt)}</Text>
            {totalPages !== undefined && (
              <View style={styles.pagesContainer}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.pages}>{totalPages} páginas</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    overflow: "hidden",
    ...SHADOWS.light,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.border,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSecondary,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pages: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
