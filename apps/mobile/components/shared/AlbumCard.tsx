import { useState } from "react";
import { View, StyleSheet, Linking, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import {
  Text,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { usePostAlbumIdExportPdf, useDeleteAlbumId } from "@elepad/api-client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, STYLES, SHADOWS, FONT } from "@/styles/base";
import { useToast } from "@/components/shared/Toast";
import { usePdfDownload } from "@/hooks/usePdfDownload";
import { useQueryClient } from "@tanstack/react-query";
import AlbumCover from "@/components/Recuerdos/AlbumCover";

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
    const datePart = date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} · ${timePart} hs`;
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
          showToast({ message: "Álbum eliminado correctamente", type: "success" });
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
      }
    );
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => setDetailsVisible(true)}
      >
        <View style={styles.coverWrapper}>
          <AlbumCover title={title} coverImageUrl={coverImageUrl} />
        </View>
      </Pressable>

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
            {coverImageUrl && (
              <View style={{ marginBottom: 16, alignItems: "center" }}>
                <Image
                  source={{ uri: coverImageUrl }}
                  style={{ width: 200, height: 200, borderRadius: 8 }}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            )}

            {description && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ 
                  fontSize: 16, 
                  color: COLORS.primary, 
                  fontFamily: FONT.medium,
                  lineHeight: 22 
                }}>
                  {description}
                </Text>
              </View>
            )}

            <Text style={{ 
              fontSize: 13, 
              color: COLORS.textSecondary,
              fontFamily: FONT.regular 
            }}>
              {formatDate(createdAt)}
            </Text>

            {totalPages !== undefined && (
              <Text style={{ 
                fontSize: 13, 
                color: COLORS.textSecondary,
                fontFamily: FONT.regular,
                marginTop: 4
              }}>
                Páginas: {totalPages}
              </Text>
            )}
          </Dialog.Content>

          <Dialog.Actions style={[styles.dialogActions, { justifyContent: "flex-start" }]}>
            {pdfUrl ? (
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flex: 1 }}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setDetailsVisible(false);
                    onPress();
                  }}
                  style={{ flex: 1 }}
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
                    accessibilityLabel={actionsOpen ? "Cerrar acciones" : "Abrir acciones"}
                  >
                    <MaterialCommunityIcons name={actionsOpen ? "minus" : "plus"} size={20} color={COLORS.white} />
                  </Pressable>

                  {actionsOpen && (
                    <View style={[styles.dropdownItems, { right: 0 }]}>
                      <Pressable
                        onPress={() => {
                          handleViewPdf();
                          setDetailsVisible(false);
                          setActionsOpen(false);
                        }}
                        style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}
                        accessibilityLabel="Ver PDF"
                      >
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color={COLORS.primary} />
                      </Pressable>

                      <Pressable
                        onPress={async () => {
                          await handleDownloadAndSharePdf();
                          setActionsOpen(false);
                        }}
                        style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}
                        accessibilityLabel="Compartir PDF"
                      >
                        {isDownloading ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : (
                          <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primary} style={{left: -5}} />
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setActionsOpen(false);
                          setDeleteConfirmVisible(true);
                        }}
                        style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}
                        accessibilityLabel="Eliminar álbum"
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={COLORS.primary}
                        />
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                <Button
                  mode="contained"
                  onPress={() => {
                    setDetailsVisible(false);
                    onPress();
                  }}
                  style={{ flex: 1 }}
                >
                  Ver Álbum
                </Button>
                <Button
                  mode="outlined"
                  loading={exportPdfMutation.isPending}
                  onPress={handleExportPdf}
                >
                  PDF
                </Button>
                
                <View style={styles.actionsDropdown}>
                  <Pressable
                    onPress={() => setActionsOpen((v) => !v)}
                    style={({ pressed }) => [
                      styles.plusButton,
                      pressed && { opacity: 0.65 },
                    ]}
                  >
                    <MaterialCommunityIcons name={actionsOpen ? "minus" : "plus"} size={20} color={COLORS.white} />
                  </Pressable>

                  {actionsOpen && (
                    <View style={[styles.dropdownItems, { right: 0 }]}>
                      <Pressable
                        onPress={() => {
                          setActionsOpen(false);
                          setDeleteConfirmVisible(true);
                        }}
                        style={({ pressed }) => [styles.iconAction, pressed && { opacity: 0.7 }]}
                      >
                        <MaterialCommunityIcons
                          name="delete"
                          size={20}
                          color={COLORS.primary}
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
              ¿Estás seguro de que deseas eliminar el álbum {title}? Esta acción no se puede deshacer.
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
    overflow: "hidden",
    marginBottom: 0,
    borderRadius: 8,
  },

  coverWrapper: {
    width: "100%",
    //height: "60%",
    aspectRatio: 1.5,
    //backgroundColor: COLORS.backgroundSecondary,
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
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    ...SHADOWS.medium,
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

  deleteButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
