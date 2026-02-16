import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import {
  StatusBar,
  View,
  Image,
  FlatList,
  RefreshControl,
  Pressable,
  BackHandler,
  Dimensions,
} from "react-native";
import {
  Text,
  Portal,
  Dialog,
  Button,
  ActivityIndicator,
  IconButton,
  Menu,
  Avatar,
  SegmentedButtons,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useGetMemoriesBooks,
  useGetFamilyGroupIdGroupMembers,
  createMemoriesBook,
  createMemoryWithMedia,
  createNote,
  deleteMemory,
  deleteMemoriesBook,
  GetFamilyGroupIdGroupMembers200,
  MemoryWithReactions,
  MemoriesBook,
  UpdateMemoriesBook,
  updateMemory,
  updateMemoriesBook,
  useAddReaction,
  getMemories,
} from "@elepad/api-client";
import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, LAYOUT } from "@/styles/base";
import { Platform } from "react-native";
import { uriToBlob } from "@/lib/uriToBlob";

import MasonryList from "@react-native-seoul/masonry-list";
import RecuerdoItemComponent from "@/components/Recuerdos/RecuerdoItemComponent";
import NuevoRecuerdoDialogComponent from "@/components/Recuerdos/NuevoRecuerdoDialogComponent";
import RecuerdoDetailDialog from "@/components/Recuerdos/RecuerdoDetailDialog";
import { BackButton } from "@/components/shared/BackButton";
import SaveButton from "@/components/shared/SaveButton";
import CancelButton from "@/components/shared/CancelButton";
import BookCover from "@/components/Recuerdos/BookCover";
import eleEmpthy from "@/assets/images/ele-fotografiando.png";
import { useToast } from "@/components/shared/Toast";
import { StyledTextInput } from "@/components/shared";
import { ExpandableFAB } from "@/components/shared/ExpandableFAB";

import { useRecuerdosTour } from "@/hooks/tours/useRecuerdosTour";
import { useTabContext } from "@/context/TabContext";

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
  memory: MemoryWithReactions,
  memberNameById: Record<string, string>,
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
    reactions: (memory.reactions || []).map(
      (r: {
        id: string;
        userId: string;
        stickerId: string;
        stickerUrl: string | null;
      }) => ({
        id: r.id,
        userId: r.userId,
        stickerId: r.stickerId,
        stickerUrl: r.stickerUrl,
      }),
    ),
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
  reactions?: {
    id: string;
    userId: string;
    stickerId: string;
    stickerUrl: string | null;
  }[];
}

export default function RecuerdosScreen() {
  const isFocused = useIsFocused();
  const { loading: authLoading, userElepad } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Dimensiones responsive
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const emptyLogoSize = screenWidth * 0.60; // 55% del ancho de pantalla
  const emptyLogoTop = screenHeight * 0.08; // 25% del alto de pantalla (más arriba que el 35% anterior)

  const { mutateAsync: addReaction } = useAddReaction();
  const { activeTab } = useTabContext();

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
        activeFrameUrl?: string | null;
      }>;

    const raw = [groupInfo.owner, ...groupInfo.members];
    const byId = new Map<
      string,
      {
        id: string;
        displayName: string;
        avatarUrl?: string | null;
        activeFrameUrl?: string | null;
      }
    >();
    for (const m of raw) {
      if (!m?.id) continue;
      byId.set(m.id, {
        id: m.id,
        displayName: m.displayName,
        avatarUrl: m.avatarUrl ?? null,
        activeFrameUrl: m.activeFrameUrl ?? null,
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
    null,
  );
  const [selectedBook, setSelectedBook] = useState<MemoriesBook | null>(null);
  const [editingBook, setEditingBook] = useState<MemoriesBook | null>(null);
  const [bookMenuVisible, setBookMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const handleCloseBookMenu = useCallback(() => {
    setBookMenuVisible(false);
  }, []);

  const handleCloseFilterMenu = useCallback(() => {
    setFilterMenuVisible(false);
    setFilterSubMode("none");
  }, []);

  const [bookDialogVisible, setBookDialogVisible] = useState(false);
  const [bookDialogMode, setBookDialogMode] = useState<"create" | "edit">(
    "create",
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

  const [memberFilterId, setMemberFilterId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<RecuerdoTipo | "all">("all");
  const [filterSubMode, setFilterSubMode] = useState<
    "none" | "person" | "type"
  >("none");

  // --- Books Filter State ---
  const [booksSortOrder, setBooksSortOrder] = useState<"desc" | "asc">("desc");
  const [booksNumColumns, setBooksNumColumns] = useState(1);

  // --- Tour Setup ---
  const { headerRef, addButtonRef, listRef, albumRef } = useRecuerdosTour({
    activeTab,
    authLoading,
    selectedBook,
  });

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
    },
  );

  // Hook de infinite query para paginación
  const {
    data: memoriesInfiniteData,
    isLoading: memoriesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchMemories,
  } = useInfiniteQuery({
    queryKey: [
      "/memories",
      {
        groupId,
        bookId: selectedBook?.id,
        createdBy: memberFilterId || undefined,
      },
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getMemories({
        groupId,
        bookId: selectedBook?.id,
        createdBy: memberFilterId || undefined,
        limit: 20,
        offset: pageParam,
      });
      return response;
    },
    getNextPageParam: (lastPage) => {
      // Verificar que lastPage tenga la estructura esperada
      if (!lastPage || typeof lastPage !== "object" || !("data" in lastPage)) {
        return undefined;
      }

      const { data, total, offset, limit } = lastPage as unknown as {
        data: unknown[];
        total: number;
        offset: number;
        limit: number;
      };
      const nextOffset = offset + limit;

      // Si la última página no tiene datos, no hay más
      if (!data || data.length === 0) {
        return undefined;
      }

      // Si la última página tiene menos datos que el límite, ya terminamos
      if (data.length < limit) {
        return undefined;
      }

      // Continuar si:
      // 1. nextOffset < total (caso normal)
      // 2. O si la última página tiene exactamente 'limit' items (indica que puede haber más)
      return nextOffset < total || data.length === limit
        ? nextOffset
        : undefined;
    },
    enabled: !!groupId && !!selectedBook,
    initialPageParam: 0,
  });

  // Transformar la data paginada en un formato compatible con el código existente
  const memoriesResponse = useMemo(() => {
    if (!memoriesInfiniteData) {
      return undefined;
    }

    // Combinar todas las páginas en un solo array
    const allMemories: MemoryWithReactions[] = [];
    let total = 0;

    memoriesInfiniteData.pages.forEach((page) => {
      // Verificar que page tenga la estructura esperada
      if (!page || typeof page !== "object" || !("data" in page)) {
        return;
      }

      const pageData = page as unknown as {
        data: MemoryWithReactions[];
        total: number;
        limit: number;
        offset: number;
      };

      if (pageData.data && Array.isArray(pageData.data)) {
        allMemories.push(...pageData.data);
        total = pageData.total;
      }
    });

    const result = {
      data: {
        data: allMemories,
        total,
        limit: 20,
        offset: 0,
      },
    };

    return result;
  }, [memoriesInfiniteData]);

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
      showToast({ message: "Baúl creado", type: "success" });
      setBookDialogVisible(false);
    },
    onError: (error) => {
      showToast({
        message: `Error al crear el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: { id: string; patch: UpdateMemoriesBook }) => {
      return updateMemoriesBook(data.id, data.patch);
    },
    onSuccess: async () => {
      await refetchBooks();
      showToast({ message: "Baúl actualizado", type: "success" });
      setBookDialogVisible(false);
    },
    onError: (error) => {
      showToast({
        message: `Error al actualizar el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteMemoriesBook(id);
    },
    onSuccess: async () => {
      await refetchBooks();
      showToast({ message: "Baúl eliminado", type: "success" });
      setBookToDelete(null);
    },
    onError: (error) => {
      showToast({
        message: `Error al eliminar el baúl: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
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
      return updated as unknown as MemoryWithReactions;
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
      showToast({ message: "Recuerdo actualizado", type: "success" });
    },
    onError: (error) => {
      showToast({
        message: `Error al actualizar el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
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
      showToast({ message: "Recuerdo eliminado", type: "success" });
    },
    onError: (error) => {
      showToast({
        message: `Error al eliminar el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
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
      try {
        const result = await createMemoryWithMedia(data);
        return result;
      } catch (error) {
        console.error("Error al subir recuerdo:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Refrescar la lista de memorias
      refetchMemories();
      // Invalidar query global de memorias (para el Home)
      queryClient.invalidateQueries({ queryKey: ["/memories"] });

      showToast({ message: "Recuerdo agregado exitosamente", type: "success" });

      // Resetear estado del diálogo
      setDialogVisible(false);
      setCurrentStep("select");
      setSelectedTipo(null);
      setSelectedFileUri(null);
      setSelectedMimeType(null);
    },
    onError: (error) => {
      console.error("Upload mutation onError:", error);
      showToast({
        message: `Error al subir el recuerdo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
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
      try {
        const result = await createNote(data);
        return result;
      } catch (error) {
        console.error("Error al crear nota:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar query global de memorias (para el Home)
      // La key generada por orval es ['/memories', params]. Usamos partial matching.
      queryClient.invalidateQueries({ queryKey: ["/memories"] });

      showToast({ message: "Nota agregada exitosamente", type: "success" });

      // Resetear estado del diálogo
      setDialogVisible(false);
      setCurrentStep("select");
      setSelectedTipo(null);
      setSelectedFileUri(null);
      setSelectedMimeType(null);
    },
    onError: (error) => {
      console.error("Create note mutation onError:", error);
      showToast({
        message: `Error al crear la nota: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
    },
  });

  // Función para cargar recuerdos (mantiene el patrón original)
  const cargarRecuerdos = useCallback(async () => {
    try {
      await refetchMemories();
    } catch {
      showToast({ message: "Error al cargar los recuerdos", type: "error" });
    }
  }, [refetchMemories]);

  const cargarBaules = useCallback(async () => {
    try {
      await refetchBooks();
    } catch {
      showToast({ message: "Error al cargar los baúles", type: "error" });
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
      ? (memoriesData as MemoryWithReactions[])
      : [];

    return memories
      .map((memory) => memoryToRecuerdo(memory, memberNameById))
      .filter(
        (recuerdo) => typeFilter === "all" || recuerdo.tipo === typeFilter,
      )
      .sort((a, b) => {
        if (sortOrder === "desc") {
          return b.fecha.getTime() - a.fecha.getTime();
        } else {
          return a.fecha.getTime() - b.fecha.getTime();
        }
      });
  }, [memoriesResponse, memberNameById, sortOrder, typeFilter]);

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

  // Sync selectedRecuerdo with recuerdos list when it updates (e.g. after adding a reaction)
  useEffect(() => {
    if (selectedRecuerdo) {
      const updated = recuerdos.find((r) => r.id === selectedRecuerdo.id);
      if (updated && updated !== selectedRecuerdo) {
        setSelectedRecuerdo(updated);
      }
    }
  }, [recuerdos]);

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
      showToast({ message: "Error al refrescar los recuerdos", type: "error" });
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
      },
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
      showToast({
        message: "El nombre del baúl es obligatorio",
        type: "error",
      });
      return;
    }
    if (!color) {
      showToast({
        message: "El color del baúl es obligatorio",
        type: "error",
      });
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
        showToast({
          message: "Selecciona un baúl antes de agregar recuerdos",
          type: "error",
        });
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

          fileData = {
            uri: fileUri,
            name: fileName,
            type: mimeType,
          } as unknown as Blob;
        }

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
      showToast({
        message: `Error al preparar el archivo: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
        type: "error",
      });
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
            {bookDialogMode === "create" ? "Nuevo baúl" : "Modificar baúl"}
          </Dialog.Title>
          <Dialog.Content style={{ paddingBottom: 12 }}>
            <StyledTextInput
              label="Nombre"
              value={bookFormTitle}
              onChangeText={setBookFormTitle}
              marginBottom={12}
            />
            <StyledTextInput
              label="Descripción"
              value={bookFormDescription}
              onChangeText={setBookFormDescription}
              multiline
              numberOfLines={3}
              marginBottom={12}
            />
          </Dialog.Content>
          <Dialog.Actions
            style={{
              paddingBottom: 30,
              paddingHorizontal: 24,
              paddingTop: 0,
              justifyContent: "space-between",
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
                  !bookFormTitle.trim() ||
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
          <Dialog.Actions
            style={{
              paddingBottom: 30,
              paddingHorizontal: 24,
              paddingTop: 0,
              justifyContent: "space-between",
            }}
          >
            <View style={{ width: 120 }}>
              <CancelButton
                onPress={() => setBookToDelete(null)}
                disabled={deleteBookMutation.isPending}
              />
            </View>
            <View style={{ width: 120 }}>
              <SaveButton
                text="Eliminar"
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
              />
            </View>
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

  const rawBooks = Array.isArray(booksData)
    ? (booksData as MemoriesBook[])
    : [];

  const books = useMemo(() => {
    return [...rawBooks].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (booksSortOrder === "desc") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });
  }, [rawBooks, booksSortOrder]);

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
            paddingTop: 20,
            paddingBottom: 0,
            borderBottomColor: COLORS.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View ref={headerRef}>
              <Text style={STYLES.superHeading}>Recuerdos</Text>
            </View>
            <View ref={addButtonRef}>
              <Button
                mode="contained"
                onPress={openCreateBookDialog}
                style={{
                  borderRadius: 12,
                  backgroundColor: COLORS.primary,
                }}
                icon="plus"
                disabled={!groupId}
              >
                Agregar
              </Button>
            </View>
          </View>
        </View>

        {/* Controles de ordenamiento y vista para Baúles */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Toggle de Vistas - Izquierda */}
          <SegmentedButtons
            value={booksNumColumns.toString()}
            onValueChange={(value) => setBooksNumColumns(parseInt(value))}
            buttons={[
              { value: "1", icon: "view-agenda" }, // Lista
              { value: "2", icon: "view-grid" }, // Grilla
            ]}
            density="small"
            style={{ maxWidth: 100 }}
            theme={{
              colors: {
                secondaryContainer: COLORS.primary,
                onSecondaryContainer: COLORS.white,
              },
            }}
          />

          {/* Botón de Ordenar - Derecha */}
          <IconButton
            icon={booksSortOrder === "desc" ? "arrow-down" : "arrow-up"}
            size={20}
            onPress={() =>
              setBooksSortOrder(booksSortOrder === "desc" ? "asc" : "desc")
            }
            mode="contained-tonal"
            style={{ margin: 0 }}
          />
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
            style={{ flex: 1, alignItems: "center", marginTop: emptyLogoTop }}
            ref={listRef}
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
          <View style={{ flex: 1 }} ref={listRef}>
            <FlatList
              key={`${booksNumColumns}-${booksSortOrder}`} // Forzar re-render al cambiar columnas o orden
              data={books}
              keyExtractor={(item) => item.id}
              numColumns={booksNumColumns}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingTop: 0,
                paddingBottom: LAYOUT.bottomNavHeight,
              }}
              columnWrapperStyle={booksNumColumns > 1 ? { gap: 12 } : undefined}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
              renderItem={({ item, index }) => {
                const title = item.title || "(Sin nombre)";
                const color = item.color || COLORS.primary;

                const gap = 12;
                const padding = 24 * 2;
                const availableWidth =
                  screenWidth - padding - (booksNumColumns - 1) * gap;
                const itemWidth = availableWidth / booksNumColumns;

                return (
                  <Animated.View
                    key={item.id}
                    entering={ZoomIn.delay(index * 25).springify()}
                    style={{
                      width: itemWidth,
                      aspectRatio: 1.64,
                      marginBottom: 12,
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setSelectedBook(item);
                        setMemberFilterId(null);
                      }}
                      style={{ width: "100%", height: "100%" }}
                    >
                      <BookCover
                        bookId={item.id}
                        groupId={groupId}
                        color={color}
                        title={title}
                        compact={booksNumColumns > 1}
                      />
                    </Pressable>
                  </Animated.View>
                );
              }}
            />
          </View>
        )}

        {renderBookDialogs()}

        {/* FAB expandible para Álbumes */}
        {groupId && (
          <ExpandableFAB
            ref={albumRef}
            label={
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  minWidth: 110,
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                  Histor
                </Text>
                <Text style={{ color: COLORS.secondary, fontWeight: "700" }}>
                  IA
                </Text>
                <Text style={{ color: COLORS.primary, fontWeight: "700" }}>
                  s
                </Text>
              </Text>
            }
            icon="book-multiple"
            onPress={() => router.push("../albums")}
            bottom={LAYOUT.bottomNavHeight + 16}
            right={16}
            autoCollapseDelay={5000}
          />
        )}
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
          <BackButton
            size={28}
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
          </View>
        </View>

        <View
          style={{
            paddingTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginRight: -8,
          }}
        >
          <View style={{ flex: 1 }}>
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
          <Menu
            key={bookMenuVisible ? "open" : "closed"}
            visible={bookMenuVisible}
            onDismiss={handleCloseBookMenu}
            contentStyle={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              width: 215,
            }}
            style={{ alignSelf: "flex-end", marginRight: 0, marginTop: -8 }}
            anchor={
              <IconButton
                icon="dots-horizontal"
                size={22}
                iconColor={COLORS.primary}
                style={{ margin: 0 }}
                onPress={() => setBookMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => {
                setBookMenuVisible(false);
                openEditBookDialog(selectedBook);
              }}
              title="Modificar"
            />
            <Menu.Item
              leadingIcon="trash-can"
              onPress={() => {
                setBookMenuVisible(false);
                setBookToDelete(selectedBook);
              }}
              title="Eliminar"
            />
          </Menu>
        </View>
      </View>

      {/* Controles de ordenamiento y vista */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 8,
        }}
      >
        {/* Ordenar y Vista */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Toggle de Vistas - Izquierda */}
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

          {/* Botones de Ordenar y Filtrar - Derecha */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <IconButton
              icon={sortOrder === "desc" ? "arrow-down" : "arrow-up"}
              size={20}
              onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              mode="contained-tonal"
              style={{ margin: 0 }}
            />
            <Menu
              key={filterMenuVisible ? "open" : "closed"}
              visible={filterMenuVisible}
              onDismiss={handleCloseFilterMenu}
              contentStyle={{
                backgroundColor: COLORS.white,
                borderRadius: 12,
                width: 215,
              }}
              anchor={
                <IconButton
                  icon="filter-variant"
                  size={20}
                  onPress={() => setFilterMenuVisible(true)}
                  mode="contained-tonal"
                  style={{ margin: 0 }}
                />
              }
            >
              {(() => {
                if (filterSubMode === "none") {
                  return (
                    <>
                      <Menu.Item
                        leadingIcon="account-group"
                        onPress={() => setFilterSubMode("person")}
                        title="Filtrar por persona"
                      />
                      <Menu.Item
                        leadingIcon="file-multiple"
                        onPress={() => setFilterSubMode("type")}
                        title="Filtrar por tipo"
                      />
                    </>
                  );
                } else if (filterSubMode === "person") {
                  return (
                    <>
                      <Menu.Item
                        leadingIcon="arrow-left"
                        onPress={() => setFilterSubMode("none")}
                        title="Atrás"
                      />
                      <Menu.Item
                        leadingIcon="account-group"
                        onPress={() => {
                          setMemberFilterId(null);
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Todos"
                        style={{
                          backgroundColor:
                            memberFilterId === null
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                      {groupMembers.map((m) => (
                        <Menu.Item
                          key={m.id}
                          leadingIcon={() =>
                            m.avatarUrl ? (
                              <Avatar.Image
                                size={24}
                                source={{ uri: m.avatarUrl }}
                              />
                            ) : (
                              <Avatar.Text
                                size={24}
                                label={m.displayName.charAt(0).toUpperCase()}
                              />
                            )
                          }
                          onPress={() => {
                            setMemberFilterId(m.id);
                            setFilterMenuVisible(false);
                            setFilterSubMode("none");
                          }}
                          title={m.displayName}
                          style={{
                            backgroundColor:
                              memberFilterId === m.id
                                ? COLORS.primary + "20"
                                : "transparent",
                          }}
                        />
                      ))}
                    </>
                  );
                } else if (filterSubMode === "type") {
                  return (
                    <>
                      <Menu.Item
                        leadingIcon="arrow-left"
                        onPress={() => setFilterSubMode("none")}
                        title="Atrás"
                      />
                      <Menu.Item
                        leadingIcon="file-multiple"
                        onPress={() => {
                          setTypeFilter("all");
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Todos los tipos"
                        style={{
                          backgroundColor:
                            typeFilter === "all"
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                      <Menu.Item
                        leadingIcon="image"
                        onPress={() => {
                          setTypeFilter("imagen");
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Imágenes"
                        style={{
                          backgroundColor:
                            typeFilter === "imagen"
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                      <Menu.Item
                        leadingIcon="video"
                        onPress={() => {
                          setTypeFilter("video");
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Videos"
                        style={{
                          backgroundColor:
                            typeFilter === "video"
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                      <Menu.Item
                        leadingIcon="microphone"
                        onPress={() => {
                          setTypeFilter("audio");
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Audios"
                        style={{
                          backgroundColor:
                            typeFilter === "audio"
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                      <Menu.Item
                        leadingIcon="text"
                        onPress={() => {
                          setTypeFilter("texto");
                          setFilterMenuVisible(false);
                          setFilterSubMode("none");
                        }}
                        title="Notas"
                        style={{
                          backgroundColor:
                            typeFilter === "texto"
                              ? COLORS.primary + "20"
                              : "transparent",
                        }}
                      />
                    </>
                  );
                }
              })()}
            </Menu>
          </View>
        </View>
      </View>

      {isLoading && recuerdos.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : recuerdos.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: emptyLogoTop,
          }}
        >
          <Image
            source={eleEmpthy}
            style={{
              width: emptyLogoSize,
              height: emptyLogoSize,
              marginBottom: 0,
            }}
          />
          <Text style={STYLES.heading}>{emptyTitle}</Text>
          <Text style={STYLES.subheading}>{emptySubtitle}</Text>
        </View>
      ) : (
        <MasonryList
          data={recuerdos}
          numColumns={numColumns}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item, i }) => (
            <Animated.View entering={ZoomIn.delay(i * 25).springify()}>
              <RecuerdoItemComponent
                item={item as Recuerdo}
                numColumns={numColumns}
                onPress={handleRecuerdoPress}
              />
            </Animated.View>
          )}
          key={`masonry-${numColumns}-${sortOrder}-${isFocused}`}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <>
              {(memoriesLoading || isFetchingNextPage) &&
                recuerdos.length > 0 && (
                  <View style={{ padding: 16, alignItems: "center" }}>
                    <ActivityIndicator color={COLORS.primary} />
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
      {/* Diálogo de detalle del recuerdo */}
      {detailDialogVisible && (
        <RecuerdoDetailDialog
          visible={detailDialogVisible}
          recuerdo={selectedRecuerdo}
          hasNext={
            selectedRecuerdo
              ? recuerdos.findIndex((r) => r.id === selectedRecuerdo.id) <
                recuerdos.length - 1
              : false
          }
          hasPrev={
            selectedRecuerdo
              ? recuerdos.findIndex((r) => r.id === selectedRecuerdo.id) > 0
              : false
          }
          onDismiss={() => {
            handleCloseDetail();
            router.setParams({ memoryId: "", bookId: "" });
          }}
          onNavigate={(direction) => {
            if (!selectedRecuerdo) return;
            const currentIndex = recuerdos.findIndex(
              (r) => r.id === selectedRecuerdo.id,
            );
            if (currentIndex === -1) return;

            const nextIndex =
              direction === "next" ? currentIndex + 1 : currentIndex - 1;
            if (nextIndex >= 0 && nextIndex < recuerdos.length) {
              setSelectedRecuerdo(recuerdos[nextIndex]);
            }
          }}
          onUpdateRecuerdo={async (id, patch) => {
            await updateMemoryMutation.mutateAsync({ id, patch });
          }}
          onDeleteRecuerdo={async (id) => {
            await deleteMemoryMutation.mutateAsync(id);
          }}
          onReact={async (recuerdoId, stickerId) => {
            try {
              await addReaction({
                id: recuerdoId,
                data: { stickerId },
              });
              await refetchMemories();
            } catch (error) {
              console.error("Error adding reaction:", error);
              showToast({
                message: "Error al agregar reacción",
                type: "error",
              });
            }
          }}
          isMutating={
            updateMemoryMutation.isPending || deleteMemoryMutation.isPending
          }
          familyMembers={groupMembers}
          currentUserId={userElepad?.id}
          isElder={userElepad?.elder || false}
        />
      )}
    </SafeAreaView>
  );
}
