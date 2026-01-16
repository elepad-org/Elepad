import { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  Text,
  IconButton,
} from "react-native-paper";
import { Memory } from "@elepad/api-client";
import { COLORS, STYLES } from "@/styles/base";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import SaveButton from "../shared/SaveButton";
import CancelButton from "../shared/CancelButton";
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
  const {
    createAlbum,
    isCreating,
    //error,
    dismissProcessingDialog,
    processingAlbumTitle,
  } = useAlbumCreation();

  const [step, setStep] = useState<"form" | "select" | "reorder">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemories, setSelectedMemories] = useState<SelectedMemory[]>(
    []
  );

  const imageMemories = memories.filter(
    (m) => m.mimeType && m.mimeType.startsWith("image/")
  );

  const handleReset = () => {
    setStep("form");
    setTitle("");
    setDescription("");
    setSelectedMemories([]);
  };

  const handleDismiss = () => {
    handleReset();
    onDismiss();
  };

  const handleToggleMemory = (memory: Memory) => {
    const isSelected = selectedMemories.some((m) => m.id === memory.id);

    if (isSelected) {
      setSelectedMemories((prev) =>
        prev
          .filter((m) => m.id !== memory.id)
          .map((m, idx) => ({ ...m, order: idx }))
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
          style={[styles.draggableItem, isActive && styles.draggableItemActive]}
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
                <Text
                  style={{
                    ...STYLES.subheading,
                    textAlign: "left",
                    marginTop: 8,
                  }}
                >
                  Selecciona fotos para crear un álbum con narrativas generadas
                  por IA
                </Text>
              </View>
            )}

            {step === "select" && (
              <View style={{ flex: 1 }}>
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      ...STYLES.subheading,
                      textAlign: "left",
                      marginTop: 0,
                    }}
                  >
                    {selectedMemories.length} foto(s) seleccionada(s)
                  </Text>
                </View>
                <FlatList
                  data={imageMemories}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  columnWrapperStyle={{
                    justifyContent: "flex-start",
                    marginBottom: 8,
                    gap: 8,
                  }}
                  scrollEnabled={true}
                  renderItem={({ item }) => {
                    const isSelected = selectedMemories.some(
                      (m) => m.id === item.id
                    );
                    const dialogWidth = Dimensions.get("window").width * 0.92;
                    const itemSize = (dialogWidth - 48 - 16) / 3;

                    return (
                      <TouchableOpacity
                        onPress={() => handleToggleMemory(item)}
                        style={{
                          width: itemSize,
                          height: itemSize,
                          borderRadius: 8,
                          overflow: "hidden",
                          borderWidth: 2,
                          borderColor: isSelected
                            ? COLORS.primary
                            : COLORS.border,
                          backgroundColor: isSelected
                            ? `${COLORS.primary}15`
                            : COLORS.card,
                        }}
                      >
                        {item.mediaUrl && (
                          <Image
                            source={{ uri: item.mediaUrl }}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
                            }}
                          />
                        )}
                        {isSelected && (
                          <View
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: COLORS.primary,
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: COLORS.white,
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                            >
                              ✓
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingVertical: 40,
                      }}
                    >
                      <Text
                        style={{
                          ...STYLES.subheading,
                          textAlign: "center",
                        }}
                      >
                        No hay fotos disponibles. Crea algunos recuerdos
                        primero.
                      </Text>
                    </View>
                  }
                />
              </View>
            )}

            {step === "reorder" && (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Text
                  style={{
                    ...STYLES.subheading,
                    textAlign: "center",
                    marginBottom: 12,
                  }}
                >
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
                  containerStyle={{ flex: 1 }}
                />
              </GestureHandlerRootView>
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

      {/* Modal de procesamiento de álbum */}
      <Portal>
        <Dialog
          visible={!!processingAlbumTitle}
          dismissable={false}
          style={styles.processingDialog}
        >
          <Dialog.Content style={styles.processingContent}>
            <Text style={styles.processingTitle}>Creando Álbum</Text>

            <Text style={styles.processingDescription}>
              Estamos generando tu álbum {processingAlbumTitle}.
            </Text>
            <Text style={styles.processingDescription}>
              Te enviaremos una notificación cuando esté listo.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <SaveButton
              onPress={() => {
                dismissProcessingDialog();
                handleDismiss();
              }}
              text="Aceptar"
            />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

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
  processingDialog: {
    borderRadius: 16,
  },
  processingContent: {
    alignItems: "center",
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  processingDescription: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    fontStyle: "italic",
  },
});
