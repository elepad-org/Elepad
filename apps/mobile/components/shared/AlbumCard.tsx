import { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Linking,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Text, Card, Portal, Dialog, Button } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { usePostAlbumIdExportPdf, useDeleteAlbumId } from "@elepad/api-client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { useQueryClient } from "@tanstack/react-query";

interface AlbumCardProps {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  totalPages?: number;
  onPress: () => void;
  onDelete?: () => void;
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
  onDelete,
}: AlbumCardProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const { userElepad } = useAuth();
  const { showToast } = useToast();
  const { sharePdf, viewLocalPdf, isDownloading } = usePdfDownload();
  const [actionsOpen, setActionsOpen] = useState(false);
  const queryClient = useQueryClient();

  const exportPdfMutation = usePostAlbumIdExportPdf();
  const deleteAlbumMutation = useDeleteAlbumId({}, queryClient);

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
          console.error(err);
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

  const handleDeleteAlbum = () => {
    deleteAlbumMutation.mutate(
      { id },
      {
        onSuccess: () => {
          showToast({
            message: "Álbum eliminado correctamente",
            type: "success",
          });
          setDeleteConfirmVisible(false);
          setDetailsVisible(false);
          // Invalidar la query de álbumes para refrescar la lista
          queryClient.invalidateQueries({ queryKey: ["getAlbum"] });
          onDelete?.();
        },
        onError: (error) => {
          console.error("Error deleting album:", error);
          showToast({ message: "Error al eliminar el álbum", type: "error" });
          setDeleteConfirmVisible(false);
        },
      },
    );
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
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Button
                  mode="contained"
                  onPress={() => {
                    setDetailsVisible(false);
                    onPress();
                  }}
                >
                  Ver Álbum
                </Button>
                <View style={styles.actionsDropdown}>
                  <Pressable
                    onPress={() => setActionsOpen((v) => !v)}
                    style={({ pressed }) => [
                      styles.plusButton,
                      pressed && { opacity: 0.65 },
                    ]}
                    accessibilityLabel={
                      actionsOpen ? "Cerrar acciones" : "Abrir acciones"
                    }
                  >
                    <MaterialCommunityIcons
                      name={actionsOpen ? "minus" : "plus"}
                      size={20}
                      color={COLORS.white}
                    />
                  </Pressable>

                  {actionsOpen && (
                    <View style={styles.dropdownItems}>
                      <Pressable
                        onPress={() => {
                          handleViewPdf();
                          setDetailsVisible(false);
                          setActionsOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.iconAction,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityLabel="Ver PDF"
                      >
                        <MaterialCommunityIcons
                          name="file-pdf-box"
                          size={20}
                          color={COLORS.primary}
                        />
                      </Pressable>

                      <Pressable
                        onPress={async () => {
                          await handleDownloadAndSharePdf();
                          setActionsOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.iconAction,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityLabel="Compartir PDF"
                      >
                        {isDownloading ? (
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name="share-variant"
                            size={20}
                            color={COLORS.primary}
                            style={{ left: -2 }}
                          />
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setActionsOpen(false);
                          setDeleteConfirmVisible(true);
                        }}
                        style={({ pressed }) => [
                          styles.iconAction,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityLabel="Eliminar álbum"
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={COLORS.error}
                          style={{ left: -5 }}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
              >
                <Button
                  mode="outlined"
                  loading={exportPdfMutation.isPending}
                  onPress={handleExportPdf}
                >
                  PDF
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

                <View style={styles.actionsDropdown}>
                  <Pressable
                    onPress={() => setActionsOpen((v) => !v)}
                    style={({ pressed }) => [
                      styles.plusButton,
                      pressed && { opacity: 0.65 },
                    ]}
                    accessibilityLabel={
                      actionsOpen ? "Cerrar acciones" : "Abrir acciones"
                    }
                  >
                    <MaterialCommunityIcons
                      name={actionsOpen ? "minus" : "plus"}
                      size={20}
                      color={COLORS.white}
                    />
                  </Pressable>

                  {actionsOpen && (
                    <View style={styles.dropdownItemDelete}>
                      <Pressable
                        onPress={() => {
                          setActionsOpen(false);
                          setDeleteConfirmVisible(true);
                        }}
                        style={({ pressed }) => [
                          styles.iconAction,
                          pressed && { opacity: 0.7 },
                        ]}
                        accessibilityLabel="Eliminar álbum"
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={COLORS.error}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={deleteConfirmVisible}
          onDismiss={() => setDeleteConfirmVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={{ fontWeight: "bold", color: COLORS.text }}>
            ¿Eliminar álbum?
          </Dialog.Title>

          <Dialog.Content>
            <Text style={STYLES.paragraphText}>
              ¿Estás seguro de que deseas eliminar el álbum {title}? Esta acción
              no se puede deshacer.
            </Text>
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button
              mode="outlined"
              onPress={() => setDeleteConfirmVisible(false)}
              disabled={deleteAlbumMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleDeleteAlbum}
              loading={deleteAlbumMutation.isPending}
              buttonColor={COLORS.error}
            >
              Eliminar
            </Button>
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

  actionsDropdown: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  plusButton: {
    backgroundColor: COLORS.primary,
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  dropdownItems: {
    position: "absolute",
    top: -56,
    left: -60,
    borderRadius: 8,
    borderColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    flexDirection: "row",
    //gap: 4,
  },
  dropdownItemDelete: {
    position: "absolute",
    top: -56,
    borderRadius: 8,
    borderColor: COLORS.backgroundSecondary,
    borderWidth: 2,
    flexDirection: "row",
  },

  iconAction: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
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
