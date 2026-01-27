import { useState } from "react";
import { View, Image, StyleSheet, Linking } from "react-native";
import { Text, Card, Portal, Dialog, Button } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { usePostAlbumIdExportPdf } from "@elepad/api-client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import { usePdfDownload } from "@/hooks/usePdfDownload";

interface AlbumCardProps {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  totalPages?: number;
  onPress: () => void;
}

export default function AlbumCard({
  id,
  title,
  description,
  coverImageUrl,
  pdfUrl,
  createdAt,
  totalPages,
  onPress,
}: AlbumCardProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const { userElepad } = useAuth();
  const { showToast } = useToast();
  const { sharePdf, viewLocalPdf, isDownloading } = usePdfDownload();

  const exportPdfMutation = usePostAlbumIdExportPdf();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR");
  };

  const handleExportPdf = () => {
    const albumId = id;
    const userId = userElepad?.id;

    if (!userId) {
      console.warn("User not available for PDF export");
      return;
    }

    showToast({
      message: "Generando PDF... recibirás una notificación cuando esté listo",
      type: "success",
    });

    setDetailsVisible(false);

    exportPdfMutation.mutate(
      { id: albumId },
      {
        onSuccess: (res) => {
          console.log(
            "Export PDF response:",
            res,
            "userId:",
            userId,
            "albumId:",
            albumId,
          );
        },
        onError: (err) => {
          console.error("Export PDF error:", err);
          showToast({
            message: "Error generando el PDF. Intenta nuevamente",
            type: "error",
          });
        },
      },
    );
  };

  const handleViewPdf = async () => {
    if (pdfUrl) {
      try {
        // First, try to find a saved local copy
        await viewLocalPdf(pdfUrl);
      } catch (err) {
        try {
          console.error(err)
          await Linking.openURL(pdfUrl);
        } catch (error) {
          console.error("Error opening PDF:", error);
          showToast({
            message: "No se pudo abrir el PDF",
            type: "error",
          });
        }
      }
    }
  };

  const handleDownloadAndSharePdf = async () => {
    if (pdfUrl) {
      await sharePdf(pdfUrl, title);
    }
  };

  return (
    <View>
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
          <Dialog.Title style={{ fontWeight: "bold", color: COLORS.text }}>
            {title}
          </Dialog.Title>

          <Dialog.Content>
            {description && (
              <View style={{ marginBottom: 16 }}>
                <Text style={STYLES.paragraphText}>{description}</Text>
              </View>
            )}

            <Text style={STYLES.paragraphText}>
              Creado el: {formatDate(createdAt)}
            </Text>

            {totalPages !== undefined && (
              <Text style={STYLES.paragraphText}>Páginas: {totalPages}</Text>
            )}
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button mode="outlined" onPress={() => setDetailsVisible(false)}>
              Cerrar
            </Button>

            {pdfUrl ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="outlined"
                  icon="file-pdf-box"
                  onPress={() => {
                    handleViewPdf();
                    setDetailsVisible(false);
                  }}
                >
                  Ver PDF
                </Button>
                <Button
                  mode="contained"
                  icon="share-variant"
                  loading={isDownloading}
                  disabled={isDownloading}
                  onPress={handleDownloadAndSharePdf}
                >
                  Compartir
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
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  mode="outlined"
                  loading={exportPdfMutation.isPending}
                  onPress={handleExportPdf}
                >
                  Exportar PDF
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
              </View>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    ...SHADOWS.card,
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
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
});
