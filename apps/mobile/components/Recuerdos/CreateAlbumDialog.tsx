import { useState, useMemo } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { Button, Text } from "react-native-paper";
import { Memory } from "@elepad/api-client";
import { COLORS, STYLES } from "@/styles/base";
import { useAlbumCreation } from "@/hooks/useAlbumCreation";
import SaveButton from "../shared/SaveButton";
import CancelButton from "../shared/CancelButton";
import { StyledTextInput } from "../shared";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import PolaroidPreview from "./PolaroidPreview";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CreateAlbumDialogProps {
  visible: boolean;
  onDismiss: () => void;
  memories: Memory[];
  familyMembers?: Array<{
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  }>;
}

interface SelectedMemory {
  id: string;
  title: string | null;
  mediaUrl: string | null;
  order: number;
  // Keep original memory data for preview
  original: Memory;
}

export type ThemeTag =
  | "Aventura"
  | "Fantasía"
  | "Pequeños momentos"
  | "Celebración"
  | "Acogedor";

const THEME_TAGS: ThemeTag[] = [
  "Aventura",
  "Fantasía",
  "Pequeños momentos",
  "Celebración",
  "Acogedor",
];

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function CreateAlbumDialog({
  visible,
  onDismiss,
  memories,
  familyMembers = [],
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
  const [selectedTags, setSelectedTags] = useState<ThemeTag[]>([]);
  const [selectedMemories, setSelectedMemories] = useState<SelectedMemory[]>(
    [],
  );
  const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);

  const imageMemories = useMemo(
    () =>
      memories.filter((m) => m.mimeType && m.mimeType.startsWith("image/")),
    [memories],
  );

  const handleReset = () => {
    setStep("form");
    setTitle("");
    setDescription("");
    setSelectedTags([]);
    setSelectedMemories([]);
    setPreviewMemory(null);
  };

  const handleDismiss = () => {
    handleReset();
    onDismiss();
  };

  const handleToggleTag = (tag: ThemeTag) => {
    const isSelected = selectedTags.includes(tag);

    if (isSelected) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 2) {
        setSelectedTags((prev) => [...prev, tag]);
      }
    }
  };

  const handleToggleMemory = (memory: Memory) => {
    const isSelected = selectedMemories.some((m) => m.id === memory.id);

    if (isSelected) {
      setSelectedMemories((prev) =>
        prev
          .filter((m) => m.id !== memory.id)
          .map((m, idx) => ({ ...m, order: idx })),
      );
    } else {
      setSelectedMemories((prev) => [
        ...prev,
        {
          id: memory.id,
          title: memory.title,
          mediaUrl: memory.mediaUrl,
          order: prev.length,
          original: memory,
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
        tags: selectedTags,
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
        <View
          style={[styles.draggableItem, isActive && styles.draggableItemActive]}
        >
          <TouchableOpacity
            style={styles.draggableContentContainer}
            onPress={() => setPreviewMemory(item.original)}
            activeOpacity={0.7}
          >
            {item.mediaUrl && (
              <Image source={{ uri: item.mediaUrl }} style={styles.thumbnail} />
            )}
            <View style={styles.draggableContent}>
              <Text numberOfLines={1} style={styles.memoryTitle}>
                {item.title || "Sin título"}
              </Text>
              <Text style={styles.orderBadge}>#{item.order + 1}</Text>
            </View>
          </TouchableOpacity>

          {/* Drag Handle - Explicit interaction */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={50}
            style={styles.dragHandle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="drag-horizontal" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  const getAuhorName = (id: string) => {
    const member = familyMembers.find((m) => m.id === id);
    return member?.displayName || "Desconocido";
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
        <View
          style={
            step === "form" ? styles.formContainer : styles.imagesContainer
          }
        >
          <Text style={styles.modalTitle}>
            {step === "form"
              ? "Crear nuevo álbum"
              : step === "select"
                ? "Seleccionar Fotos"
                : "Ordenar Fotos"}
          </Text>
          <Text style={styles.subtitle}>
            {step === "form"
              ? "Ingresa los datos del álbum"
              : step === "select"
                ? `${selectedMemories.length} foto(s) seleccionada(s)`
                : "Toca para ver, arrastra desde la derecha para ordenar"}
          </Text>

          <View
            style={
              step === "form"
                ? styles.contentFormContainer
                : styles.contentImagesContainer
            }
          >
            {step === "form" && (
              <View style={{ width: "100%" }}>
                <StyledTextInput
                  label="Título"
                  placeholder=""
                  value={title}
                  onChangeText={setTitle}
                  keyboardType="default"
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  marginBottom={16}
                />

                <StyledTextInput
                  label="Descripción"
                  placeholder=""
                  value={description}
                  onChangeText={setDescription}
                  keyboardType="default"
                  autoCapitalize="sentences"
                  returnKeyType="done"
                  marginBottom={16}
                />

                <Text style={styles.tagsLabel}>
                  Temática del álbum (selecciona 1-2)
                </Text>
                <View style={styles.tagsContainer}>
                  {THEME_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => handleToggleTag(tag)}
                        style={[
                          styles.tagChip,
                          isSelected && styles.tagChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            isSelected && styles.tagTextSelected,
                          ]}
                        >
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
                    gap: 8,
                  }}
                  contentContainerStyle={{
                    paddingBottom: 20
                  }}
                  scrollEnabled={true}
                  renderItem={({ item }) => {
                    const isSelected = selectedMemories.some(
                      (m) => m.id === item.id,
                    );
                    // Better calc for 3 columns with padding
                    // Container padding horizontal is 28 (x2 = 56)
                    // Gap is 8 (x2 = 16)
                    // MaxWidth is 400. 
                    // Let's use a percentage or fixed based on container
                    // Actually checking styles.imagesContainer padding is 28.
                    const availableWidth = Math.min(SCREEN_WIDTH - 48, 400 - 56);
                    const itemSize = (availableWidth - 16) / 3;

                    return (
                      <TouchableOpacity
                        onPress={() => handleToggleMemory(item)}
                        onLongPress={() => setPreviewMemory(item)}
                        delayLongPress={300}
                        activeOpacity={0.7}
                        style={{
                          width: itemSize,
                          height: itemSize,
                          borderRadius: 8,
                          overflow: "hidden",
                          borderWidth: isSelected ? 3 : 0,
                          borderColor: COLORS.primary,
                          marginBottom: 8,
                          backgroundColor: COLORS.card,
                        }}
                      >
                        {item.mediaUrl && (
                          <Image
                            source={{ uri: item.mediaUrl }}
                            style={{
                              width: "100%",
                              height: "100%",
                              resizeMode: "cover",
                              opacity: isSelected ? 0.8 : 1,
                            }}
                          />
                        )}
                        {isSelected && (
                          <View
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              backgroundColor: COLORS.primary,
                              borderRadius: 12,
                              width: 24,
                              height: 24,
                              justifyContent: "center",
                              alignItems: "center",
                              borderWidth: 2,
                              borderColor: COLORS.white,
                            }}
                          >
                            <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />
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
              <GestureHandlerRootView style={{ flex: 1, width: "100%" }}>
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
                  activationDistance={10}
                  scrollEnabled={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </GestureHandlerRootView>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {step === "form" && (
              <>
                <View style={{ width: 120 }}>
                  <CancelButton onPress={handleDismiss} text="Cancelar" />
                </View>
                <View style={{ width: 120 }}>
                  <Button
                    mode="contained"
                    onPress={() => setStep("select")}
                    disabled={
                      !title.trim() || selectedTags.length === 0 || isCreating
                    }
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
                <View style={{ width: 120 }}>
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
                <View style={{ width: 120 }}>
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
                <View style={{ width: 120 }}>
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
                <View style={{ width: 120 }}>
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
          onRequestClose={() => { }}
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

        {/* Preview Modal */}
        {previewMemory && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setPreviewMemory(null)}
          >
            <View style={styles.previewContainer}>
              <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={() => setPreviewMemory(null)}
              />
              <View style={styles.previewContent}>
                <PolaroidPreview
                  memory={{
                    id: previewMemory.id,
                    title: previewMemory.title,
                    description: previewMemory.caption,
                    mediaUrl: previewMemory.mediaUrl,
                    mimeType: previewMemory.mimeType,
                    autorNombre: getAuhorName(previewMemory.createdBy),
                    fecha: new Date(previewMemory.createdAt),
                  }}
                  familyMembers={familyMembers}
                />
              </View>
            </View>
          </Modal>
        )}

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
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  previewContent: {
    width: '100%',
    alignItems: 'center',
  },
  imagesContainer: {
    width: "100%",
    maxWidth: 400,
    height: "80%",
    maxHeight: 700,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 28,
    zIndex: 1,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: 28,
    zIndex: 1,
  },
  modalTitle: {
    ...STYLES.heading,
    textAlign: "center",
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
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "center",
    width: "100%",
    overflow: 'hidden'
  },
  draggableItemActive: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  draggableContentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  dragHandle: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    backgroundColor: '#f9f9f9',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  draggableContent: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
    color: COLORS.text,
  },
  orderBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
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
  inputWrapper: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    overflow: "hidden",
  },
  tagsLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  tagChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  tagTextSelected: {
    color: COLORS.white,
  },
});
