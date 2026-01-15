import { useState } from "react";
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  Text,
  IconButton,
  Checkbox,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { Memory } from "@elepad/api-client";
import { COLORS } from "@/styles/base";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

  const renderDraggableItem = ({
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
  };

  // Mostrar snackbar si hay error, falta implementar
  const showError = () => {
    if (error) {
      setSnackbarVisible(true);
    }
  };

  return (
    <>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={handleDismiss}
          style={styles.dialog}
        >
          <Dialog.Title>
            {step === "form"
              ? "Crear Nuevo Álbum"
              : step === "select"
                ? "Seleccionar Fotos"
                : "Ordenar Fotos"}
          </Dialog.Title>

          <Dialog.Content style={styles.dialogContent}>
            {step === "form" && (
              <View>
                <TextInput
                  label="Título del álbum"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  maxLength={200}
                  style={styles.input}
                />
                <TextInput
                  label="Descripción"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  maxLength={1000}
                  style={styles.input}
                />
                <Text style={styles.helperText}>
                  Selecciona fotos para crear un álbum con narrativas generadas
                  por IA
                </Text>
              </View>
            )}

            {step === "select" && (
              <View style={styles.selectContainer}>
                <Text style={styles.selectedCount}>
                  {selectedMemories.length} foto(s) seleccionada(s)
                </Text>
                <ScrollView style={styles.memoryList}>
                  {imageMemories.length === 0 ? (
                    <Text style={styles.emptyText}>
                      No hay fotos disponibles. Crea algunos recuerdos primero.
                    </Text>
                  ) : (
                    imageMemories.map((memory) => {
                      const isSelected = selectedMemories.some(
                        (m) => m.id === memory.id
                      );

                      return (
                        <TouchableOpacity
                          key={memory.id}
                          onPress={() => handleToggleMemory(memory)}
                          style={styles.memoryItem}
                        >
                          <Checkbox
                            status={isSelected ? "checked" : "unchecked"}
                          />
                          {memory.mediaUrl && (
                            <Image
                              source={{ uri: memory.mediaUrl }}
                              style={styles.memoryThumbnail}
                            />
                          )}
                          <Text
                            numberOfLines={2}
                            style={styles.memoryItemTitle}
                          >
                            {memory.title || "Sin título"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {step === "reorder" && (
              <GestureHandlerRootView style={styles.reorderContainer}>
                <Text style={styles.reorderHelp}>
                  Mantén presionado y arrastra para reordenar
                </Text>
                <DraggableFlatList
                  data={selectedMemories}
                  onDragEnd={({ data }) => {
                    const reordered = data.map((item, idx) => ({
                      ...item,
                      order: idx,
                    }));
                    setSelectedMemories(reordered);
                  }}
                  keyExtractor={(item) => item.id}
                  renderItem={renderDraggableItem}
                  containerStyle={styles.draggableList}
                />
              </GestureHandlerRootView>
            )}

            {isCreating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Creando álbum...</Text>
              </View>
            )}
          </Dialog.Content>

          <Dialog.Actions>
            {step === "form" && (
              <>
                <Button onPress={handleDismiss}>Cancelar</Button>
                <Button
                  onPress={() => setStep("select")}
                  disabled={!title.trim() || isCreating}
                >
                  Siguiente
                </Button>
              </>
            )}

            {step === "select" && (
              <>
                <Button onPress={() => setStep("form")}>Atrás</Button>
                <Button
                  onPress={() => setStep("reorder")}
                  disabled={selectedMemories.length === 0}
                >
                  Siguiente
                </Button>
              </>
            )}

            {step === "reorder" && (
              <>
                <Button onPress={() => setStep("select")}>Atrás</Button>
                <Button onPress={handleCreateAlbum} disabled={isCreating}>
                  Crear Álbum
                </Button>
              </>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar para mostrar errores */}
      <Snackbar
        visible={snackbarVisible && !!error}
        onDismiss={() => setSnackbarVisible(false)}
        duration={5000}
        style={{ backgroundColor: "#FF3B30" }}
      >
        {error || "Error al crear el álbum"}
      </Snackbar>

      {/* Snackbar para mostrar estado de procesamiento */}
      <Snackbar
        visible={!!processingAlbumTitle}
        onDismiss={dismissProcessingDialog}
        duration={3000}
      >
        ✅ Álbum "{processingAlbumTitle}" creado. Generando narrativas...
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxHeight: "80%",
  },
  dialogContent: {
    minHeight: 300,
    maxHeight: 500,
  },
  input: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  selectContainer: {
    flex: 1,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: COLORS.primary,
  },
  memoryList: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    marginTop: 20,
  },
  memoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  memoryThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  memoryItemTitle: {
    flex: 1,
    fontSize: 14,
  },
  reorderContainer: {
    flex: 1,
  },
  reorderHelp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  draggableList: {
    flex: 1,
  },
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  draggableItemActive: {
    backgroundColor: "#E0E0E0",
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.primary,
  },
});
