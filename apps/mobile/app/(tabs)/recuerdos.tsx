import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  StatusBar,
  View,
  Image,
  FlatList,
  RefreshControl,
  Pressable,
  BackHandler,
} from "react-native";
import {
  Text,
  Portal,
  Dialog,
  Button,
  Snackbar,
  ActivityIndicator,
  IconButton,
  Menu,
  SegmentedButtons,
  TextInput,
} from "react-native-paper";
import DropdownSelect from "@/components/shared/DropdownSelect";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetMemoriesBooks,
  useGetMemories,
  useGetFamilyGroupIdGroupMembers,
  createMemoriesBook,
  createMemoryWithMedia,
  createNote,
  deleteMemory,
  deleteMemoriesBook,
  GetFamilyGroupIdGroupMembers200,
  Memory,
  MemoriesBook,
  UpdateMemoriesBook,
  updateMemory,
  updateMemoriesBook,
} from "@elepad/api-client";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { Platform } from "react-native";
import { uriToBlob } from "@/lib/uriToBlob";

import RecuerdoItemComponent from "@/components/Recuerdos/RecuerdoItemComponent";
import NuevoRecuerdoDialogComponent from "@/components/Recuerdos/NuevoRecuerdoDialogComponent";
import RecuerdoDetailDialog from "@/components/Recuerdos/RecuerdoDetailDialog";
import ChestIcon from "@/components/Recuerdos/ChestIcon";
import SaveButton from "@/components/shared/SaveButton";
import CancelButton from "@/components/shared/CancelButton";
import BookCover from "@/components/Recuerdos/BookCover";
import eleEmpthy from "@/assets/images/ele-idea.jpeg";

// Tipos de recuerdos
type RecuerdoTipo = "imagen" | "texto" | "audio" | "video";

interface RecuerdoData {
  contenido: string; // URI del archivo o texto
  titulo?: string;
  caption?: string;
  mimeType?: string;
}

// Función auxiliar para convertir Memory a Recuerdo para compatibilidad con componentes existentes
const memoryToRecuerdo = (
  memory: Memory,
  memberNameById: Record<string, string>
): Recuerdo => {
  let tipo: RecuerdoTipo = "texto";

  if (memory.mimeType) {
    if (memory.mimeType.startsWith("image/")) {
      tipo = "imagen";
    } else if (memory.mimeType.startsWith("audio/")) {
      tipo = "audio";
    } else if (memory.mimeType.startsWith("video/")) {
      tipo = "video";
    } else if (memory.mimeType === "text/note") {
      tipo = "texto";
    }
  }

  return {
    id: memory.id,
    tipo,
    contenido: memory.mediaUrl || memory.caption || "",
    miniatura:
      (memory.mimeType?.startsWith("image/") ||
        memory.mimeType?.startsWith("video/")) &&
      memory.mediaUrl
        ? memory.mediaUrl
        : undefined,
    titulo: memory.title || undefined,
    descripcion: memory.caption || undefined,
    autorId: memory.createdBy,
    autorNombre: memberNameById[memory.createdBy] || undefined,
    fecha: new Date(memory.createdAt),
  };
};

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  descripcion?: string;
  autorId?: string;
  autorNombre?: string;
  fecha: Date;
}

const BAUL_COLOR_OPTIONS = [
  { key: "red", color: "#E53935" },
  { key: "green", color: "#43A047" },
  { key: "blue", color: "#1E88E5" },
  { key: "magenta", color: "#D81B60" },
  { key: "yellow", color: "#FDD835" },
  { key: "cyan", color: "#00ACC1" },
  { key: "white", color: "#FFFFFF" },
  { key: "purple", color: COLORS.primary },
] as const;

export default function RecuerdosScreen() {
  const { loading: authLoading, userElepad } = useAuth();

  const groupId = userElepad?.groupId || "";

  const membersQuery = useGetFamilyGroupIdGroupMembers(groupId, {
    query: { enabled: !!groupId },
  });

  // Normaliza la respuesta del hook (envuelta en {data} o directa)
  const selectGroupInfo = (): GetFamilyGroupIdGroupMembers200 | undefined => {
    const resp = membersQuery.data as
      | { data?: GetFamilyGroupIdGroupMembers200 }
      | GetFamilyGroupIdGroupMembers200
      | undefined;
    if (!resp) return undefined;
    return (
      (resp as { data?: GetFamilyGroupIdGroupMembers200 }).data ??
      (resp as GetFamilyGroupIdGroupMembers200)
    );
  };

  const groupInfo = selectGroupInfo();
  const groupMembers = useMemo(() => {
    if (!groupInfo)
      return [] as Array<{
        id: string;
        displayName: string;
        avatarUrl?: string | null;
      }>;

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<
      string,
      { id: string; displayName: string; avatarUrl?: string | null }
    >();
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, {
        id: m.id,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl ?? null,
      });
    }
    return Array.from(byId.values());
  }, [groupInfo]);

  const memberNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of groupMembers) {
      map[m.id] = m.displayName;
    }
    return map;
  }, [groupMembers]);

  // Estados locales

  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [numColumns, setNumColumns] = useState(2);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [selectedRecuerdo, setSelectedRecuerdo] = useState<Recuerdo | null>(
    null
  );
  const [selectedBook, setSelectedBook] = useState<MemoriesBook | null>(null);
  const [editingBook, setEditingBook] = useState<MemoriesBook | null>(null);
  const [bookMenuVisible, setBookMenuVisible] = useState(false);
  const [menuMounted, setMenuMounted] = useState(true);

  const handleOpenBookMenu = useCallback(() => {
    setBookMenuVisible(true);
  }, []);

  const handleCloseBookMenu = useCallback(() => {
    setBookMenuVisible(false);
    // Desmontar y volver a montar el menú para resetear completamente su estado
    setMenuMounted(false);
    setTimeout(() => {
      setMenuMounted(true);
    }, 50);
  }, []);

  const [bookDialogVisible, setBookDialogVisible] = useState(false);
  const [bookDialogMode, setBookDialogMode] = useState<"create" | "edit">(
    "create"
  );
  const [bookFormTitle, setBookFormTitle] = useState("");
  const [bookFormDescription, setBookFormDescription] = useState("");
  const [bookFormColor, setBookFormColor] = useState<string>(COLORS.primary);
  const [bookToDelete, setBookToDelete] = useState<MemoriesBook | null>(null);

  const [currentStep, setCurrentStep] = useState<
    "select" | "create" | "metadata"
  >("select");
  const [selectedTipo, setSelectedTipo] = useState<RecuerdoTipo | null>(null);
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState(false);

  const [memberFilterId, setMemberFilterId] = useState<string | null>(null);
  const [memberMenuMounted] = useState(true);

  const {
    data: booksResponse,
    isLoading: booksLoading,
    refetch: refetchBooks,
  } = useGetMemoriesBooks(
    { groupId },
    {
      query: {
        enabled: !!groupId,
      },
    }
  );

  // Hook del API client
  const {
    data: memoriesResponse,
    isLoading: memoriesLoading,
    refetch: refetchMemories,
  } = useGetMemories(
    {
      groupId,
      bookId: selectedBook?.id,
      createdBy: memberFilterId || undefined,
      limit: 20,
    },
    {
      query: {
        enabled: !!groupId && !!selectedBook,
      },
    }
  );

  const createBookMutation = useMutation({
    mutationFn: async (data: {
      groupId: string;
      title: string;
      description?: string;
      color: string;
    }) => {
      return createMemoriesBook(data);
    },
    onSuccess: async () => {
      await refetchBooks();
      setSnackbarMessage("Baúl creado");
      setSnackbarError(false);
      setSnackbarVisible(true);
      setBookDialogVisible(false);
    },
    onError: (error) => {
      setSnackbarMessage(
        `Error al crear el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: { id: string; patch: UpdateMemoriesBook }) => {
      return updateMemoriesBook(data.id, data.patch);
    },
    onSuccess: async () => {
      await refetchBooks();
      setSnackbarMessage("Baúl actualizado");
      setSnackbarError(false);
      setSnackbarVisible(true);
      setBookDialogVisible(false);
    },
    onError: (error) => {
      setSnackbarMessage(
        `Error al actualizar el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteMemoriesBook(id);
    },
    onSuccess: async () => {
      await refetchBooks();
      setSnackbarMessage("Baúl eliminado");
      setSnackbarError(false);
      setSnackbarVisible(true);
      setBookToDelete(null);
    },
    onError: (error) => {
      setSnackbarMessage(
        `Error al eliminar el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  const updateMemoryMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      patch: { title?: string; caption?: string };
    }) => {
      // rnFetch (mutator) devuelve el JSON directamente y tira excepción si !res.ok
      // (aunque el tipo generado por orval incluya {status, data}).
      const updated = await updateMemory(data.id, data.patch);
      return updated as unknown as Memory;
    },
    onSuccess: async (updated) => {
      await refetchMemories();
      setSelectedRecuerdo((prev) => {
        if (!prev || prev.id !== updated.id) return prev;
        return {
          ...prev,
          titulo: updated.title || undefined,
          descripcion: updated.caption || undefined,
        };
      });
      setSnackbarMessage("Recuerdo actualizado");
      setSnackbarError(false);
      setSnackbarVisible(true);
    },
    onError: (error) => {
      setSnackbarMessage(
        `Error al actualizar el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: string) => {
      // rnFetch tira excepción si !res.ok. En success, el body puede ser {message} o vacío.
      await deleteMemory(id);
      return true;
    },
    onSuccess: async () => {
      await refetchMemories();
      setDetailDialogVisible(false);
      setSelectedRecuerdo(null);
      setSnackbarMessage("Recuerdo eliminado");
      setSnackbarError(false);
      setSnackbarVisible(true);
    },
    onError: (error) => {
      setSnackbarMessage(
        `Error al eliminar el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  // Hook de mutación para subir archivos
  const uploadMemoryMutation = useMutation({
    mutationFn: async (data: {
      bookId: string;
      groupId: string;
      title?: string;
      caption?: string;
      image: Blob;
    }) => {
      console.log("=== CLIENT: Starting upload mutation ===");
      console.log("CLIENT: Upload data:", {
        ...data,
        image:
          data.image instanceof Blob
            ? "Blob"
            : typeof data.image === "object"
              ? "File object"
              : typeof data.image,
      });
      try {
        const result = await createMemoryWithMedia(data);
        console.log("CLIENT: Upload successful:", result);
        return result;
      } catch (error) {
        console.error("CLIENT: Upload mutation failed:", error);
        // Log more details about the error
        if (error && typeof error === "object") {
          console.error("CLIENT: Error details:", {
            message: (error as Error).message,
            status: (error as { status?: number }).status,
            statusText: (error as { statusText?: string }).statusText,
            body: (error as { body?: unknown }).body,
          });
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Upload mutation onSuccess:", data);
      // Refrescar la lista de memorias
      refetchMemories();
      setSnackbarMessage("Recuerdo agregado exitosamente");
      setSnackbarError(false);
      setSnackbarVisible(true);

      // Resetear estado del diálogo
      setDialogVisible(false);
      setCurrentStep("select");
      setSelectedTipo(null);
      setSelectedFileUri(null);
      setSelectedMimeType(null);
    },
    onError: (error) => {
      console.error("Upload mutation onError:", error);
      setSnackbarMessage(
        `Error al subir el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  // Hook de mutación para crear notas (solo texto)
  const createNoteMutation = useMutation({
    mutationFn: async (data: {
      bookId: string;
      groupId: string;
      title: string;
      caption?: string;
    }) => {
      console.log("=== CLIENT: Starting create note mutation ===");
      console.log("CLIENT: Note data:", data);
      try {
        const result = await createNote(data);
        console.log("CLIENT: Note created successfully:", result);
        return result;
      } catch (error) {
        console.error("CLIENT: Create note mutation failed:", error);
        if (error && typeof error === "object") {
          console.error("CLIENT: Error details:", {
            message: (error as Error).message,
            status: (error as { status?: number }).status,
            statusText: (error as { statusText?: string }).statusText,
            body: (error as { body?: unknown }).body,
          });
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Create note mutation onSuccess:", data);
      // Refrescar la lista de memorias
      refetchMemories();
      setSnackbarMessage("Nota agregada exitosamente");
      setSnackbarError(false);
      setSnackbarVisible(true);

      // Resetear estado del diálogo
      setDialogVisible(false);
      setCurrentStep("select");
      setSelectedTipo(null);
      setSelectedFileUri(null);
      setSelectedMimeType(null);
    },
    onError: (error) => {
      console.error("Create note mutation onError:", error);
      setSnackbarMessage(
        `Error al crear la nota: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    },
  });

  // Función para cargar recuerdos (mantiene el patrón original)
  const cargarRecuerdos = useCallback(async () => {
    try {
      await refetchMemories();
    } catch {
      setSnackbarMessage("Error al cargar los recuerdos");
      setSnackbarError(true);
      setSnackbarVisible(true);
    }
  }, [refetchMemories]);

  const cargarBaules = useCallback(async () => {
    try {
      await refetchBooks();
    } catch {
      setSnackbarMessage("Error al cargar los baúles");
      setSnackbarError(true);
      setSnackbarVisible(true);
    }
  }, [refetchBooks]);

  // Stabilize memories derivation to prevent re-renders
  const recuerdos = useMemo(() => {
    // Extraer los datos de la respuesta
    const memoriesPayload =
      memoriesResponse && "data" in memoriesResponse
        ? (memoriesResponse as unknown as { data: unknown }).data
        : undefined;

    const memoriesData = Array.isArray(memoriesPayload)
      ? memoriesPayload
      : memoriesPayload &&
          typeof memoriesPayload === "object" &&
          "data" in (memoriesPayload as Record<string, unknown>)
        ? (memoriesPayload as { data: unknown }).data
        : [];

    const memories = Array.isArray(memoriesData)
      ? (memoriesData as Memory[])
      : [];

    return memories
      .map((memory) => memoryToRecuerdo(memory, memberNameById))
      .sort((a, b) => {
        if (sortOrder === "desc") {
          return b.fecha.getTime() - a.fecha.getTime();
        } else {
          return a.fecha.getTime() - b.fecha.getTime();
        }
      });
  }, [memoriesResponse, memberNameById, sortOrder]);

  // Extraer memories para pasar al CreateAlbumDialog
  const memories = useMemo(() => {
    const memoriesPayload =
      memoriesResponse && "data" in memoriesResponse
        ? (memoriesResponse as unknown as { data: unknown }).data
        : undefined;

    const memoriesData = Array.isArray(memoriesPayload)
      ? memoriesPayload
      : memoriesPayload &&
          typeof memoriesPayload === "object" &&
          "data" in (memoriesPayload as Record<string, unknown>)
        ? (memoriesPayload as { data: unknown }).data
        : [];

    return Array.isArray(memoriesData) ? (memoriesData as Memory[]) : [];
  }, [memoriesResponse]);

  const params = useLocalSearchParams();
  const { memoryId, bookId } = params;

  const router = useRouter();

  // Effect for deep linking from Home
  useEffect(() => {
    if (bookId && typeof bookId === "string" && booksResponse) {
      const booksPayload = booksResponse.data || booksResponse;

      const books = Array.isArray(booksPayload) ? booksPayload : [];
      const targetBook = books.find((b: { id: string }) => b.id === bookId);

      if (targetBook && (!selectedBook || selectedBook.id !== targetBook.id)) {
        setSelectedBook(targetBook);
      }
    }
  }, [bookId, booksResponse, selectedBook]);

  const handledMemoryIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If no memoryId or invalid, reset handled ref so we can handle it again if it comes back
    if (!memoryId || typeof memoryId !== "string") {
      handledMemoryIdRef.current = null;
      return;
    }

    // If we already handled this memoryId, stop.
    if (handledMemoryIdRef.current === memoryId) {
      return;
    }

    if (selectedBook && memoriesResponse) {
      const targetMemory = recuerdos.find((r) => r.id === memoryId);

      if (targetMemory) {
        setSelectedRecuerdo(targetMemory);
        setDetailDialogVisible(true);
        handledMemoryIdRef.current = memoryId;
      }
    }
  }, [memoryId, selectedBook, memoriesResponse, recuerdos]);

  // Estados de carga y error (patrón original restaurado)
  const isLoading =
    authLoading ||
    memoriesLoading ||
    uploadMemoryMutation.isPending ||
    createNoteMutation.isPending ||
    updateMemoryMutation.isPending ||
    deleteMemoryMutation.isPending;

  const emptyTitle = memberFilterId
    ? `${
        memberNameById[memberFilterId] || "Este miembro"
      } aún no ha subido recuerdos`
    : "No hay recuerdos aún";

  const emptySubtitle = memberFilterId
    ? "Probá con otro miembro o con Todos."
    : "Añade un recuerdo recuerdo con + Agregar.";

  // Función para refrescar la galería (patrón original)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (selectedBook) {
        await cargarRecuerdos();
      } else {
        await cargarBaules();
      }
    } catch {
      setSnackbarMessage("Error al refrescar los recuerdos");
      setSnackbarError(true);
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [cargarRecuerdos, cargarBaules, selectedBook]);

  // Handle Android back button when inside a book
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (selectedBook) {
          setSelectedBook(null);
          setMemberFilterId(null);
          setBookMenuVisible(false);
          setDialogVisible(false);
          setDetailDialogVisible(false);
          setSelectedRecuerdo(null);
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen
      }
    );

    return () => backHandler.remove();
  }, [selectedBook]);

  const openCreateBookDialog = () => {
    setBookDialogMode("create");
    setEditingBook(null);
    setBookFormTitle("");
    setBookFormDescription("");
    setBookFormColor(COLORS.primary);
    setBookDialogVisible(true);
  };

  const openEditBookDialog = (book: MemoriesBook) => {
    setBookDialogMode("edit");
    setBookFormTitle(book.title || "");
    setBookFormDescription(book.description || "");
    setBookFormColor(book.color || COLORS.primary);
    setEditingBook(book);
    setBookDialogVisible(true);
  };

  const submitBookDialog = async () => {
    const title = bookFormTitle.trim();
    const description = bookFormDescription.trim();
    const color = bookFormColor;

    if (!title) {
      setSnackbarMessage("El nombre del baúl es obligatorio");
      setSnackbarError(true);
      setSnackbarVisible(true);
      return;
    }
    if (!color) {
      setSnackbarMessage("El color del baúl es obligatorio");
      setSnackbarError(true);
      setSnackbarVisible(true);
      return;
    }

    if (bookDialogMode === "create") {
      await createBookMutation.mutateAsync({
        groupId,
        title,
        description: description || undefined,
        color,
      });
      return;
    }

    if (!editingBook?.id) return;
    await updateBookMutation.mutateAsync({
      id: editingBook.id,
      patch: {
        title,
        description: description || undefined,
        color,
      },
    });
  };

  // Manejador para crear un nuevo recuerdo
  const handleNuevoRecuerdo = (tipo: RecuerdoTipo) => {
    setSelectedTipo(tipo);
    setCurrentStep("create");
  };

  // Manejador para cuando se selecciona un archivo (imagen o audio)
  const handleFileSelected = (uri: string, mimeType?: string) => {
    setSelectedFileUri(uri);
    setSelectedMimeType(mimeType || null);
    setCurrentStep("metadata");
  };

  // Función para crear un nuevo recuerdo con multimedia
  const handleGuardarRecuerdo = async (data: RecuerdoData) => {
    try {
      if (!selectedBook?.id) {
        setSnackbarMessage("Selecciona un baúl antes de agregar recuerdos");
        setSnackbarError(true);
        setSnackbarVisible(true);
        return;
      }

      if (selectedTipo === "texto") {
        // Para notas, usar el endpoint de createNote
        const noteData = {
          bookId: selectedBook.id,
          groupId,
          title: data.titulo || "Sin título",
          caption: data.caption || data.contenido,
        };

        await createNoteMutation.mutateAsync(noteData);
      } else {
        // Para archivos multimedia, usar el endpoint de createMemoryWithMedia
        let fileData: Blob;

        const fileName =
          selectedTipo === "imagen"
            ? "memory.jpg"
            : selectedTipo === "video"
              ? "memory.mp4"
              : "memory.m4a";
        const mimeType =
          data.mimeType ||
          (selectedTipo === "imagen"
            ? "image/jpeg"
            : selectedTipo === "video"
              ? "video/mp4"
              : "audio/m4a");

        if (Platform.OS === "web") {
          // Para web, convertir URI a blob
          fileData = await uriToBlob(data.contenido);
        } else {
          // Para React Native, asegurar que la URI tenga el prefijo file://
          let fileUri = data.contenido;
          if (
            !fileUri.startsWith("file://") &&
            !fileUri.startsWith("content://")
          ) {
            fileUri = `file://${fileUri}`;
          }

          console.log("Creating file object with:", {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          });
          fileData = {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          } as unknown as Blob;
        }

        console.log("File data prepared:", fileData);

        const uploadData = {
          bookId: selectedBook.id,
          groupId,
          title: data.titulo,
          caption: data.caption,
          image: fileData,
        };

        await uploadMemoryMutation.mutateAsync(uploadData);
      }
    } catch (error) {
      setSnackbarMessage(
        `Error al preparar el archivo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`
      );
      setSnackbarError(true);
      setSnackbarVisible(true);
    }
  };

  const handleCancelar = () => {
    setDialogVisible(false);
    setCurrentStep("select");
    setSelectedTipo(null);
    setSelectedFileUri(null);
    setSelectedMimeType(null);
  };

  const handleRecuerdoPress = (recuerdo: Recuerdo) => {
    setSelectedRecuerdo(recuerdo);
    setDetailDialogVisible(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogVisible(false);
    setSelectedRecuerdo(null);
  };

  const renderBookDialogs = () => {
    if (!bookDialogVisible && !bookToDelete) return null;

    return (
      <Portal>
        <Dialog
          visible={bookDialogVisible}
          onDismiss={() => {
            setBookDialogVisible(false);
            setEditingBook(null);
          }}
          style={{
            backgroundColor: COLORS.background,
            width: "92%",
            alignSelf: "center",
            borderRadius: 16,
          }}
        >
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
            {bookDialogMode === "create" ? "Nuevo baúl" : "Editar baúl"}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={bookFormTitle}
              onChangeText={setBookFormTitle}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Descripción"
              value={bookFormDescription}
              onChangeText={setBookFormDescription}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              multiline
              numberOfLines={3}
              style={{ marginBottom: 12 }}
            />

            <Text
              style={{
                ...STYLES.subheading,
                textAlign: "left",
                marginTop: 0,
              }}
            >
              Color del baúl
            </Text>

            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}
            >
              {BAUL_COLOR_OPTIONS.map((opt) => {
                const selected =
                  bookFormColor?.toLowerCase?.() === opt.color.toLowerCase();
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setBookFormColor(opt.color)}
                    style={{ marginRight: 10, marginBottom: 10 }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? COLORS.text : COLORS.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: opt.color,
                          borderWidth:
                            opt.color.toLowerCase() === "#ffffff" ? 1 : 0,
                          borderColor: COLORS.border,
                        }}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ alignItems: "center", marginTop: 12 }}>
              <View
                style={{
                  width: 180,
                  aspectRatio: 1,
                  backgroundColor: "transparent",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width: "94%", height: "94%" }}>
                  <ChestIcon color={bookFormColor} />
                </View>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions
            style={{
              paddingBottom: 30,
              paddingHorizontal: 24,
              paddingTop: 10,
              justifyContent: 'space-between',
            }}
          >
            <View style={{ width: 120 }}>
              <CancelButton
                onPress={() => {
                  setBookDialogVisible(false);
                  setEditingBook(null);
                }}
                disabled={
                  createBookMutation.isPending || updateBookMutation.isPending
                }
              />
            </View>
            <View style={{ width: 120 }}>
              <SaveButton
                onPress={submitBookDialog}
                loading={
                  createBookMutation.isPending || updateBookMutation.isPending
                }
                disabled={
                  !groupId ||
                  createBookMutation.isPending ||
                  updateBookMutation.isPending ||
                  deleteBookMutation.isPending
                }
              />
            </View>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!bookToDelete}
          onDismiss={() => setBookToDelete(null)}
          style={{
            backgroundColor: COLORS.background,
            width: "90%",
            alignSelf: "center",
            borderRadius: 16,
          }}
        >
          <Dialog.Title style={{ ...STYLES.heading, paddingTop: 8 }}>
            Eliminar baúl
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ ...STYLES.subheading, marginTop: 0 }}>
              Esto eliminará también los recuerdos dentro del baúl.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ paddingBottom: 12, paddingRight: 16 }}>
            <Button
              onPress={() => setBookToDelete(null)}
              disabled={deleteBookMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              buttonColor={COLORS.primary}
              textColor={COLORS.white}
              onPress={() => {
                if (!bookToDelete) return;
                deleteBookMutation.mutate(bookToDelete.id);
              }}
              loading={deleteBookMutation.isPending}
              disabled={
                deleteBookMutation.isPending ||
                createBookMutation.isPending ||
                updateBookMutation.isPending
              }
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  // -------- Vista: Lista de baúles --------
  const booksPayload =
    booksResponse && "data" in booksResponse
      ? (booksResponse as unknown as { data: unknown }).data
      : undefined;

  const booksData = Array.isArray(booksPayload)
    ? booksPayload
    : booksPayload &&
        typeof booksPayload === "object" &&
        "data" in (booksPayload as Record<string, unknown>)
      ? (booksPayload as { data: unknown }).data
      : [];

  const books = Array.isArray(booksData) ? (booksData as MemoriesBook[]) : [];
  const isBooksLoading =
    authLoading ||
    booksLoading ||
    createBookMutation.isPending ||
    updateBookMutation.isPending ||
    deleteBookMutation.isPending;

  if (!selectedBook) {
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "stretch",
          }}
        >
          <Text style={STYLES.superHeading}>Recuerdos</Text>
          <View style={{ flexDirection: "column", gap: 4 }}>
            <Button
              mode="contained"
              onPress={openCreateBookDialog}
              style={{
                borderRadius: 12,
                backgroundColor: "#5b507a",
                alignItems: "center",
              }}
              icon="plus"
              disabled={!groupId}
            >
              Nuevo
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push("../albums" as any)}
              style={{ borderRadius: 12 }}
              icon="book-multiple"
              disabled={!groupId}
            >
              Álbumes
            </Button>
          </View>
        </View>

        {isBooksLoading && books.length === 0 ? (
          <View style={{ ...STYLES.center, paddingHorizontal: 24 }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={{ ...STYLES.subheading, marginTop: 14 }}>
              Cargando baúles...
            </Text>
          </View>
        ) : books.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Image
              source={eleEmpthy}
              style={{
                width: 180,
                height: 180,
                borderRadius: 18,
                marginBottom: 16,
              }}
            />
            <Text style={STYLES.heading}>Todavía no hay baúles</Text>
            <Text style={{ ...STYLES.subheading, paddingHorizontal: 24 }}>
              Crea un baúl para agrupar tus recuerdos.
            </Text>
            <Button
              mode="contained"
              onPress={openCreateBookDialog}
              style={{ ...STYLES.buttonPrimary, width: "60%" }}
              icon="plus"
              disabled={!groupId}
            >
              Crear baúl
            </Button>
          </View>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: LAYOUT.bottomNavHeight,
            }}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => {
              const title = item.title || "(Sin nombre)";
              const color = item.color || COLORS.primary;
              return (
                <View
                  style={{
                    width: "48%",
                    marginBottom: 16,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      setSelectedBook(item);
                      setMemberFilterId(null);
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: COLORS.backgroundSecondary,
                        borderRadius: 18,
                        aspectRatio: 1,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <BookCover
                        bookId={item.id}
                        groupId={groupId}
                        color={color}
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          flexDirection: "row",
                        }}
                      >
                        <IconButton
                          icon="pencil"
                          size={18}
                          onPress={() => openEditBookDialog(item)}
                          style={{ margin: 0 }}
                        />
                        <IconButton
                          icon="trash-can"
                          size={18}
                          onPress={() => setBookToDelete(item)}
                          style={{ margin: 0 }}
                        />
                      </View>
                    </View>
                    <Text
                      style={{
                        ...STYLES.heading,
                        fontSize: 14,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        {renderBookDialogs()}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{
            backgroundColor: snackbarError ? COLORS.error : COLORS.primary,
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    );
  }

  if (isLoading && recuerdos.length === 0) {
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />

        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <IconButton
              icon="chevron-left"
              size={24}
              style={{ margin: 0 }}
              onPress={() => {
                setSelectedBook(null);
                setMemberFilterId(null);
                setBookMenuVisible(false);
                setDialogVisible(false);
                setDetailDialogVisible(false);
                setSelectedRecuerdo(null);
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <Button
                mode="contained"
                onPress={() => setDialogVisible(true)}
                buttonColor={COLORS.primary}
                textColor={COLORS.white}
                style={{ borderRadius: 12 }}
                icon="plus"
              >
                Agregar
              </Button>
              {menuMounted && (
                <Menu
                  visible={bookMenuVisible}
                  onDismiss={handleCloseBookMenu}
                  contentStyle={{
                    backgroundColor: COLORS.background,
                    borderRadius: 12,
                  }}
                  anchor={
                    <IconButton
                      icon="dots-horizontal"
                      size={22}
                      style={{ margin: 0 }}
                      onPress={handleOpenBookMenu}
                    />
                  }
                >
                  <Menu.Item
                    leadingIcon="pencil"
                    onPress={() => {
                      setBookMenuVisible(false);
                      openEditBookDialog(selectedBook);
                    }}
                    title="Modificar baúl"
                  />
                  <Menu.Item
                    leadingIcon="trash-can"
                    onPress={() => {
                      setBookMenuVisible(false);
                      setBookToDelete(selectedBook);
                    }}
                    title="Eliminar baúl"
                  />
                </Menu>
              )}
            </View>
          </View>

          <View style={{ paddingTop: 10 }}>
            <Text style={{ ...STYLES.superHeading, textAlign: "left" }}>
              {selectedBook.title || "Baúl"}
            </Text>
            {!!selectedBook.description && (
              <Text
                style={{
                  ...STYLES.subheading,
                  marginTop: 6,
                  color: COLORS.textSecondary,
                  textAlign: "left",
                }}
              >
                {selectedBook.description}
              </Text>
            )}
          </View>
        </View>

        {/* Controles de ordenamiento y vista */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginRight: 8,
              }}
            >
              Ordenar:
            </Text>
            <IconButton
              icon={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
              size={20}
              onPress={() =>
                setSortOrder(sortOrder === "desc" ? "asc" : "desc")
              }
              mode="contained-tonal"
            />
          </View>
          <SegmentedButtons
            value={numColumns.toString()}
            onValueChange={(value) => setNumColumns(parseInt(value))}
            buttons={[
              {
                value: "2",
                icon: "view-module",
              },
              {
                value: "3",
                icon: "view-comfy",
              },
            ]}
            style={{ width: 140 }}
            theme={{
              colors: {
                secondaryContainer: COLORS.primary,
                onSecondaryContainer: COLORS.white,
              },
            }}
          />
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <IconButton
            icon="chevron-left"
            size={24}
            style={{ margin: 0 }}
            onPress={() => {
              setSelectedBook(null);
              setMemberFilterId(null);
              setBookMenuVisible(false);
              setDialogVisible(false);
              setDetailDialogVisible(false);
              setSelectedRecuerdo(null);
            }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <Button
              mode="contained"
              onPress={() => setDialogVisible(true)}
              buttonColor={COLORS.primary}
              textColor={COLORS.white}
              style={{ borderRadius: 12 }}
              icon="plus"
            >
              Agregar
            </Button>
            {menuMounted && (
              <Menu
                visible={bookMenuVisible}
                onDismiss={handleCloseBookMenu}
                contentStyle={{
                  backgroundColor: COLORS.background,
                  borderRadius: 12,
                }}
                anchor={
                  <IconButton
                    icon="dots-horizontal"
                    size={22}
                    style={{ margin: 0 }}
                    onPress={handleOpenBookMenu}
                  />
                }
              >
                <Menu.Item
                  leadingIcon="pencil"
                  onPress={() => {
                    setBookMenuVisible(false);
                    openEditBookDialog(selectedBook);
                  }}
                  title="Modificar baúl"
                />
                <Menu.Item
                  leadingIcon="trash-can"
                  onPress={() => {
                    setBookMenuVisible(false);
                    setBookToDelete(selectedBook);
                  }}
                  title="Eliminar baúl"
                />
              </Menu>
            )}
          </View>
        </View>

        <View style={{ paddingTop: 10 }}>
          <Text style={{ ...STYLES.superHeading, textAlign: "left" }}>
            {selectedBook.title || "Baúl"}
          </Text>
          {!!selectedBook.description && (
            <Text
              style={{
                ...STYLES.subheading,
                marginTop: 6,
                color: COLORS.textSecondary,
                textAlign: "left",
              }}
            >
              {selectedBook.description}
            </Text>
          )}
        </View>
      </View>

      {/* Controles de ordenamiento y vista */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        {/* Primera fila: Filtro de Persona */}
        <View style={{ marginBottom: 8 }}>
          {memberMenuMounted && (
            <DropdownSelect
              label="Filtrar"
              value={memberFilterId || "all"}
              options={[
                { key: "all", label: "Todos", icon: "account-group" },
                ...groupMembers.map((m) => ({
                  key: m.id,
                  label: m.displayName,
                  avatarUrl: m.avatarUrl || null,
                })),
              ]}
              onSelect={(value) => {
                setMemberFilterId(value === "all" ? null : value);
              }}
              placeholder="Todos"
              showLabel={false}
            />
          )}
        </View>

        {/* Segunda fila: Ordenar y Vista */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Botón de Ordenar */}
          <IconButton
            icon={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={20}
            onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            mode="contained-tonal"
            style={{ margin: 0 }}
          />

          {/* Toggle de Vistas */}
          <SegmentedButtons
            value={numColumns.toString()}
            onValueChange={(value) => setNumColumns(parseInt(value))}
            buttons={[
              { value: "2", icon: "view-grid" },
              { value: "3", icon: "view-comfy" },
            ]}
            density="small"
            style={{ maxWidth: 80 }}
            theme={{
              colors: {
                secondaryContainer: COLORS.primary,
                onSecondaryContainer: COLORS.white,
              },
            }}
          />
        </View>
      </View>

      {recuerdos.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: "35%",
          }}
        >
          <Image
            source={eleEmpthy}
            style={{ width: 220, height: 220, marginBottom: 10 }}
          />
          <Text style={STYLES.heading}>{emptyTitle}</Text>
          <Text style={STYLES.subheading}>{emptySubtitle}</Text>
        </View>
      ) : (
        <FlatList
          key={`grid-${numColumns}`}
          data={recuerdos}
          renderItem={({ item }) => (
            <RecuerdoItemComponent
              item={item}
              numColumns={numColumns}
              onPress={handleRecuerdoPress}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
          columnWrapperStyle={{
            justifyContent: "flex-start",
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            <>
              {memoriesLoading && recuerdos.length > 0 && (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <ActivityIndicator />
                </View>
              )}
              {/* Invisible spacer to ensure last item is visible above navigation bar */}
              <View style={{ height: LAYOUT.bottomNavHeight + 20 }} />
            </>
          }
        />
      )}

      {/* Diálogo para seleccionar tipo de recuerdo */}
      <Portal>
        <NuevoRecuerdoDialogComponent
          visible={dialogVisible}
          hideDialog={() => setDialogVisible(false)}
          onSelectTipo={handleNuevoRecuerdo}
          step={currentStep}
          selectedTipo={selectedTipo}
          onSave={handleGuardarRecuerdo}
          onCancel={handleCancelar}
          isUploading={
            uploadMemoryMutation.isPending || createNoteMutation.isPending
          }
          selectedFileUri={selectedFileUri || undefined}
          selectedFileMimeType={selectedMimeType || undefined}
          onFileSelected={
            selectedTipo === "imagen" || selectedTipo === "audio"
              ? handleFileSelected
              : undefined
          }
          familyMembers={groupMembers}
          currentUserId={userElepad?.id}
        />
      </Portal>

      {renderBookDialogs()}

      {/* Diálogo de detalle del recuerdo */}
      <RecuerdoDetailDialog
        visible={detailDialogVisible}
        recuerdo={selectedRecuerdo}
        onDismiss={() => {
          handleCloseDetail();
          router.setParams({ memoryId: "", bookId: "" });
        }}
        onUpdateRecuerdo={async (id, patch) => {
          await updateMemoryMutation.mutateAsync({ id, patch });
        }}
        onDeleteRecuerdo={async (id) => {
          await deleteMemoryMutation.mutateAsync(id);
        }}
        isMutating={
          updateMemoryMutation.isPending || deleteMemoryMutation.isPending
        }
        familyMembers={groupMembers}
        currentUserId={userElepad?.id}
      />

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2200}
        style={{
          backgroundColor: snackbarError ? COLORS.error : COLORS.success,
          borderRadius: 16,
          marginBottom: LAYOUT.bottomNavHeight + 10,
          marginHorizontal: 20,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}
