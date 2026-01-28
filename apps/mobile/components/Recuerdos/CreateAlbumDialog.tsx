import { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
} from "react-native";
import {
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        <View style={step === "form" ? styles.formContainer : styles.imagesContainer}>
          <Text style={styles.title}>
            {step === "form"
              ? "Crear Nuevo Álbum"
              : step === "select"
                ? "Seleccionar Fotos"
                : "Ordenar Fotos"}
          </Text>
          <Text style={styles.subtitle}>
            {step === "form"
              ? "Ingresa los datos del álbum"
              : step === "select"
                ? `${selectedMemories.length} foto(s) seleccionada(s)`
                : "Mantén presionado y arrastra para reordenar"}
          </Text>

          <View style={step==="form" ? styles.contentFormContainer :  styles.contentImagesContainer}>
            {step === "form" && (
              <View style={{ width: "100%" }}>
                <TextInput
                  mode="outlined"
                  placeholder="Título"
                  value={title}
                  onChangeText={setTitle}
                  keyboardType="default"
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  outlineColor="rgba(203, 203, 203, 0.92)"
                  activeOutlineColor={COLORS.textLight}
                  textColor={COLORS.text}
                  placeholderTextColor={COLORS.textSecondary}
                  dense
                />

                <TextInput
                  mode="outlined"
                  placeholder="Descripción"
                  value={description}
                  onChangeText={setDescription}
                  keyboardType="default"
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                  outlineColor="rgba(203, 203, 203, 0.92)"
                  activeOutlineColor={COLORS.textLight}
                  textColor={COLORS.text}
                  placeholderTextColor={COLORS.textSecondary}
                  dense
                />
               
              </View>
            )}

            {step === "select" && (
              <View style={{ flex: 1, width: "100%" }}>
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
                    const containerWidth =
                      Dimensions.get("window").width * 0.88 - 56;
                    const itemSize = (containerWidth - 16) / 3;

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
                        width: "100%",
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
            )}
          </View>

          <View style={styles.buttonContainer}>
            {step === "form" && (
              <>
                <View style={{ flex: 1 }}>
                  <CancelButton onPress={handleDismiss} disabled={isCreating} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
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
              </>
            )}

            {step === "select" && (
              <>
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
                <View style={{ flex: 1, marginLeft: 8 }}>
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
              </>
            )}

            {step === "reorder" && (
              <>
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
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <SaveButton
                    onPress={handleCreateAlbum}
                    text="Crear"
                    disabled={isCreating}
                    loading={isCreating}
                  />
                </View>
              </>
            )}
          </View>
        </View>

        {/* Modal de procesamiento de álbum */}
        <Modal
          visible={!!processingAlbumTitle}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
        >
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              disabled={true}
            />
            <View style={[styles.formContainer, { maxHeight: "50%" }]}>
              <Text style={styles.processingTitle}>Creando Álbum</Text>

              <Text style={styles.processingDescription}>
                Estamos generando tu álbum {processingAlbumTitle}.
              </Text>
              <Text style={styles.processingDescription}>
                Te enviaremos una notificación cuando esté listo.
              </Text>

              <View style={{ marginTop: 24, width: "100%" }}>
                <SaveButton
                  onPress={() => {
                    dismissProcessingDialog();
                    handleDismiss();
                  }}
                  text="Aceptar"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imagesContainer: {
    width: "100%",
    maxWidth: 400,
    minHeight: 600,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: 28,
    zIndex: 1,
  },
  formContainer: {
     width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 20,
    padding: 28,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  contentImagesContainer: {
    flex: 1,
    width: "100%",
  },
  contentFormContainer: {
    width: "100%",
    minHeight: 150,
  },
  input: {
    width: "100%",
    marginBottom: 14,
    backgroundColor: "transparent",
  },
  inputOutline: {
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
    gap: 8,
  },
  draggableItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "center",
    maxWidth: "90%",
  },
  draggableItemActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
    maxWidth: "90%",
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
  },
});
