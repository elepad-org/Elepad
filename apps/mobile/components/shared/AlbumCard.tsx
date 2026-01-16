import { useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { Text, Card, Portal, Dialog, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS, STYLES } from "@/styles/base";

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
  const [detailsVisible, setDetailsVisible] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };

  return (
    <>
      <Card
        style={styles.card}
        onPress={() => setDetailsVisible(true)}
        elevation={2}
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          {coverImageUrl ? (
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={36}
                color={COLORS.primary}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </Card>

      {/* Dialog */}
      <Portal>
        <Dialog
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={STYLES.heading}>
            {title}
          </Dialog.Title>

          <Dialog.Content>
            {description && (
              <View style={{ marginBottom: 16 }}>
                <Text style={STYLES.subheading}>Descripción</Text>
                <Text style={styles.secondaryText}>{description}</Text>
              </View>
            )}

            <Text style={STYLES.subheading}>Información</Text>
            <Text style={styles.secondaryText}>
              Creado: {formatDate(createdAt)}
            </Text>

            {totalPages !== undefined && (
              <Text style={styles.secondaryText}>
                Páginas: {totalPages}
              </Text>
            )}
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button
              mode="outlined"
              onPress={() => setDetailsVisible(false)}
            >
              Cerrar
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setDetailsVisible(false);
                onPress();
              }}
            >
              Ver Álbum
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    ...SHADOWS.light,
  },

  imageWrapper: {
  width: "100%",
  aspectRatio: 1,
  backgroundColor: COLORS.backgroundSecondary,
  alignItems: "center",
  justifyContent: "center",

  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
    justifyContent: "center",
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },

  dialog: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    width: "92%",
    alignSelf: "center",
  },

  dialogActions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },

  secondaryText: {
    ...STYLES.paragraphText,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
