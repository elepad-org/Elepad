import { useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  Text,
  Checkbox,
  ActivityIndicator,
  Snackbar,
  Divider,
} from "react-native-paper";
import { Memory } from "@elepad/api-client";
import { COLORS, STYLES } from "@/styles/base";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import SaveButton from "../shared/SaveButton";
import CancelButton from "../shared/CancelButton";
// import DraggableFlatList, {
//   RenderItemParams,
//   ScaleDecorator,
// } from "react-native-draggable-flatlist";
// import { GestureHandlerRootView } from "react-native-gesture-handler";

interface CreateAlbumDialogProps {
  visible: boolean;
  onDismiss: () => void;
  memories: Memory[];
}

interface SelectedMemory {
  id: string;
  title: string | null;
  mediaUrl: string | null;
  order: number;
}

export default function CreateAlbumDialog({
  visible,
  onDismiss,
  memories,
}: CreateAlbumDialogProps) {
  const { createAlbum, isCreating, error, dismissProcessingDialog, processingAlbumTitle } = useAlbumCreation();

  const [step, setStep] = useState<"form" | "select" | "reorder">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemories, setSelectedMemories] = useState<SelectedMemory[]>(
    []
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Filter only image memories
  const imageMemories = memories.filter(
    (m) => m.mimeType && m.mimeType.startsWith("image/")
  );

  const handleReset = () => {
    setStep("form");
    setTitle("");
    setDescription("");
    setSelectedMemories([]);
    setSnackbarVisible(false);
  };

  const handleDismiss = () => {
    handleReset();
    onDismiss();
  };

  const handleToggleMemory = (memory: Memory) => {
    const isSelected = selectedMemories.some((m) => m.id === memory.id);

    if (isSelected) {
      setSelectedMemories((prev) =>
        prev.filter((m) => m.id !== memory.id).map((m, idx) => ({ ...m, order: idx }))
      );
    } else {
      setSelectedMemories((prev) => [
        ...prev,
        {
          id: memory.id,
          title: memory.title,
          mediaUrl: memory.mediaUrl,
          order: prev.length,
        },
      ]);
    }
  };

  const handleCreateAlbum = async () => {
    if (!title.trim()) {
      return;
    }

    if (selectedMemories.length === 0) {
      return;
    }

    try {
      const orderedMemoryIds = selectedMemories
        .sort((a, b) => a.order - b.order)
        .map((m) => m.id);

      await createAlbum({
        title: title.trim(),
        description: description.trim() || undefined,
        memoryIds: orderedMemoryIds,
      });

      handleDismiss();
    } catch (err) {
      console.error("Error en handleCreateAlbum:", err);
    }
  };

  /* const renderDraggableItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<SelectedMemory>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.draggableItem,
            isActive && styles.draggableItemActive,
          ]}
        >
          {item.mediaUrl && (
            <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} />
          )}
          <View style={styles.draggableContent}>
            <Text numberOfLines={2} style={styles.memoryTitle}>
              {item.title || "Sin título"}
            </Text>
            <Text style={styles.orderBadge}>#{item.order + 1}</Text>
          </View>
          <IconButton icon="drag-horizontal" size={24} />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }; */

  // Mostrar snackbar si hay error, falta implementar
  /* const showError = () => {
    if (error) {
      setSnackbarVisible(true);
    }
  }; */

  return (
    <>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={handleDismiss}
          style={{
            backgroundColor: COLORS.background,
            width: "92%",
            alignSelf: "center",
            borderRadius: 16,
            maxHeight: "85%",
          }}
        >
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
            {step === "form"
              ? "Crear Nuevo Álbum"
              : step === "select"
                ? "Seleccionar Fotos"
                : "Ordenar Fotos"}
          </Dialog.Title>

          <Dialog.Content style={{ minHeight: 300, maxHeight: 500 }}>
            {step === "form" && (
              <View>
                <TextInput
                  label="Título del álbum"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  maxLength={200}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={{ marginBottom: 12 }}
                />
                <TextInput
                  label="Descripción"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  maxLength={1000}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  style={{ marginBottom: 12 }}
                />
                <Text style={{ ...STYLES.subheading, textAlign: "left", marginTop: 8 }}>
                  Selecciona fotos para crear un álbum con narrativas generadas
                  por IA
                </Text>
              </View>
            )}

            {step === "select" && (
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ ...STYLES.subheading, textAlign: "left", marginTop: 0 }}>
                    {selectedMemories.length} foto(s) seleccionada(s)
                  </Text>
                </View>
                <ScrollView style={{ flex: 1 }}>
                  {imageMemories.length === 0 ? (
                    <Text style={{ ...STYLES.subheading, textAlign: "center", marginTop: 20 }}>
                      No hay fotos disponibles. Crea algunos recuerdos primero.
                    </Text>
                  ) : (
                    imageMemories.map((memory, idx) => {
                      const isSelected = selectedMemories.some(
                        (m) => m.id === memory.id
                      );

                      return (
                        <View key={memory.id}>
                          <TouchableOpacity
                            onPress={() => handleToggleMemory(memory)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 8,
                            }}
                          >
                            <Checkbox
                              status={isSelected ? "checked" : "unchecked"}
                            />
                            {memory.mediaUrl && (
                              <Image
                                source={{ uri: memory.mediaUrl }}
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 4,
                                  marginHorizontal: 12,
                                }}
                              />
                            )}
                            <Text
                              numberOfLines={2}
                              style={{ flex: 1, fontSize: 14 }}
                            >
                              {memory.title || "Sin título"}
                            </Text>
                          </TouchableOpacity>
                          {idx < imageMemories.length - 1 && (
                            <Divider style={{ backgroundColor: COLORS.border }} />
                          )}
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {step === "reorder" && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ ...STYLES.subheading, textAlign: "center", marginBottom: 12 }}>
                  Función de reordenamiento temporalmente deshabilitada
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: "center" }}>
                  Las fotos se ordenarán en el orden en que fueron seleccionadas
                </Text>
              </View>
            )}

            {isCreating && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ ...STYLES.subheading, marginTop: 12 }}>Creando álbum...</Text>
              </View>
            )}
          </Dialog.Content>

          <Dialog.Actions
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 12,
              gap: 8,
            }}
          >
            {step === "form" && (
              <View style={{ flex: 1 }}>
                <CancelButton onPress={handleDismiss} disabled={isCreating} />
              </View>
            )}
            {step === "form" && (
              <View style={{ flex: 1 }}>
                <Button
                  mode="contained"
                  onPress={() => setStep("select")}
                  disabled={!title.trim() || isCreating}
                  buttonColor={COLORS.primary}
                  textColor={COLORS.white}
                  style={{ borderRadius: 12 }}
                >
                  Siguiente
                </Button>
              </View>
            )}

            {step === "select" && (
              <View style={{ flex: 1 }}>
                <Button
                  mode="outlined"
                  onPress={() => setStep("form")}
                  disabled={isCreating}
                  style={{ borderRadius: 12, borderColor: COLORS.border }}
                  textColor={COLORS.primary}
                >
                  Atrás
                </Button>
              </View>
            )}
            {step === "select" && (
              <View style={{ flex: 1 }}>
                <Button
                  mode="contained"
                  onPress={() => setStep("reorder")}
                  disabled={selectedMemories.length === 0 || isCreating}
                  buttonColor={COLORS.primary}
                  textColor={COLORS.white}
                  style={{ borderRadius: 12 }}
                >
                  Siguiente
                </Button>
              </View>
            )}

            {step === "reorder" && (
              <View style={{ flex: 1 }}>
                <Button
                  mode="outlined"
                  onPress={() => setStep("select")}
                  disabled={isCreating}
                  style={{ borderRadius: 12, borderColor: COLORS.border }}
                  textColor={COLORS.primary}
                >
                  Atrás
                </Button>
              </View>
            )}
            {step === "reorder" && (
              <View style={{ flex: 1 }}>
                <SaveButton
                  onPress={handleCreateAlbum}
                  text="Crear"
                  disabled={isCreating}
                  loading={isCreating}
                />
              </View>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar para mostrar errores */}
      <Snackbar
        visible={snackbarVisible && !!error}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        style={{ backgroundColor: COLORS.secondary }}
      >
        <Text style={{ color: COLORS.white }}>
        {error || "Error al crear el álbum"}
        </Text>
      </Snackbar>

      {/* Snackbar para mostrar estado de procesamiento */}
      <Snackbar
        visible={!!processingAlbumTitle}
        onDismiss={dismissProcessingDialog}
        duration={3000}
        style={{ backgroundColor: COLORS.primary }}
      >
        <Text style={{ color: COLORS.white }}>
        ✅ Álbum {processingAlbumTitle} creado. Estamos generando las narrativas...
        </Text>
      </Snackbar>
    </>
  );
}

/* Estilos temporalmente deshabilitados
const styles = StyleSheet.create({
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  draggableItemActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  draggableContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  orderBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
*/
