import { useState, useCallback } from "react";
import { StatusBar, View, Image, FlatList, RefreshControl } from "react-native";
import {
  Text,
  Portal,
  Button,
  Snackbar,
  ActivityIndicator,
  IconButton,
  SegmentedButtons,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetMemories,
  createMemoryWithMedia,
  Memory,
} from "@elepad/api-client";
import { useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES } from "@/styles/base";
import { Platform } from "react-native";
import { uriToBlob } from "@/lib/uriToBlob";

import RecuerdoItemComponent from "@/components/Recuerdos/RecuerdoItemComponent";
import NuevoRecuerdoDialogComponent from "@/components/Recuerdos/NuevoRecuerdoDialogComponent";
import RecuerdoDetailDialog from "@/components/Recuerdos/RecuerdoDetailDialog";
import eleEmpthy from "@/assets/images/ele-idea.jpeg";

// Tipos de recuerdos
type RecuerdoTipo = "imagen" | "texto" | "audio";

interface RecuerdoData {
  contenido: string; // URI del archivo o texto
  titulo?: string;
  caption?: string;
  mimeType?: string;
}

// Función auxiliar para convertir Memory a Recuerdo para compatibilidad con componentes existentes
const memoryToRecuerdo = (memory: Memory): Recuerdo => {
  let tipo: RecuerdoTipo = "texto";

  if (memory.mimeType) {
    if (memory.mimeType.startsWith("image/")) {
      tipo = "imagen";
    } else if (memory.mimeType.startsWith("audio/")) {
      tipo = "audio";
    }
  }

  return {
    id: memory.id,
    tipo,
    contenido: memory.mediaUrl || memory.caption || "",
    miniatura:
      memory.mimeType?.startsWith("image/") && memory.mediaUrl
        ? memory.mediaUrl
        : undefined,
    titulo: memory.title || undefined,
    fecha: new Date(memory.createdAt),
  };
};

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  fecha: Date;
}

export default function RecuerdosScreen() {
  const { loading: authLoading, userElepad } = useAuth();

  // Estados locales
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [numColumns, setNumColumns] = useState(2);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [selectedRecuerdo, setSelectedRecuerdo] = useState<Recuerdo | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState<
    "select" | "create" | "metadata"
  >("select");
  const [selectedTipo, setSelectedTipo] = useState<RecuerdoTipo | null>(null);
  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [, setSelectedMimeType] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState(false);

  // Hook del API client
  const {
    data: memoriesResponse,
    isLoading: memoriesLoading,
    refetch: refetchMemories,
  } = useGetMemories({
    groupId: userElepad?.groupId || "",
    limit: 20,
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
        `Error al subir el recuerdo: ${error instanceof Error ? error.message : "Error desconocido"}`,
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

  // Extraer los datos de la respuesta
  const memoriesData =
    memoriesResponse && "data" in memoriesResponse ? memoriesResponse.data : [];
  const memories = Array.isArray(memoriesData) ? memoriesData : [];

  // Convertir memories a recuerdos para compatibilidad con componentes existentes
  const recuerdos = memories.map(memoryToRecuerdo).sort((a, b) => {
    if (sortOrder === "desc") {
      return b.fecha.getTime() - a.fecha.getTime();
    } else {
      return a.fecha.getTime() - b.fecha.getTime();
    }
  });

  // Estados de carga y error (patrón original restaurado)
  const isLoading =
    authLoading || memoriesLoading || uploadMemoryMutation.isPending;

  // Función para refrescar la galería (patrón original)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargarRecuerdos();
    } catch {
      setSnackbarMessage("Error al refrescar los recuerdos");
      setSnackbarError(true);
      setSnackbarVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [cargarRecuerdos]);

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
      let fileData: Blob;

      if (selectedTipo === "texto") {
        // Para texto, crear un blob con el contenido
        fileData = new Blob([data.contenido], { type: "text/plain" });
      } else {
        // Para archivos multimedia - mismo patrón que el avatar
        const fileName =
          selectedTipo === "imagen" ? "memory.jpg" : "memory.m4a";
        const mimeType =
          data.mimeType ||
          (selectedTipo === "imagen" ? "image/jpeg" : "audio/mp4");

        if (Platform.OS === "web") {
          // Para web, convertir URI a blob
          fileData = await uriToBlob(data.contenido);
        } else {
          // Para React Native, usar objeto con propiedades de Blob (igual que avatar)
          fileData = {
            uri: data.contenido,
            name: fileName,
            type: mimeType,
          } as unknown as Blob;
        }
      }

      // Usar bookId por defecto para el grupo
      const defaultBookId = "070ac9a2-832f-4c05-bfa5-cec689a4181c";

      const uploadData = {
        bookId: defaultBookId,
        groupId: userElepad!.groupId!,
        title: data.titulo,
        caption: data.caption,
        image: fileData,
      };

      await uploadMemoryMutation.mutateAsync(uploadData);
    } catch (error) {
      setSnackbarMessage(
        `Error al preparar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
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
            paddingVertical: 20,
            borderBottomColor: COLORS.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={STYLES.superHeading}>Mis Recuerdos</Text>
          <Button
            mode="contained"
            onPress={() => setDialogVisible(true)}
            style={{ ...STYLES.miniButton }}
            icon="plus"
          >
            Agregar
          </Button>
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
          paddingVertical: 20,
          borderBottomColor: COLORS.border,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={STYLES.superHeading}>Mis Recuerdos</Text>
        <Button
          mode="contained"
          onPress={() => setDialogVisible(true)}
          style={{ ...STYLES.miniButton }}
          icon="plus"
        >
          Agregar
        </Button>
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
            onPress={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            mode="contained-tonal"
          />
        </View>
        <SegmentedButtons
          value={numColumns.toString()}
          onValueChange={(value) => setNumColumns(parseInt(value))}
          buttons={[
            {
              value: "2",

              icon: "view-grid",
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
          <Text style={STYLES.heading}>No hay recuerdos aún</Text>
          <Text style={STYLES.subheading}>
            Añade un recuerdo recuerdo con + Agregar.
          </Text>
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
            memoriesLoading && recuerdos.length > 0 ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <ActivityIndicator />
              </View>
            ) : null
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
          isUploading={uploadMemoryMutation.isPending}
          selectedFileUri={selectedFileUri || undefined}
          onFileSelected={
            selectedTipo === "imagen" || selectedTipo === "audio"
              ? handleFileSelected
              : undefined
          }
        />
      </Portal>

      {/* Diálogo de detalle del recuerdo */}
      <RecuerdoDetailDialog
        visible={detailDialogVisible}
        recuerdo={selectedRecuerdo}
        onDismiss={handleCloseDetail}
      />

      {/* Snackbar para mostrar mensajes */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2200}
        style={{
          backgroundColor: snackbarError ? COLORS.error : COLORS.success,
          borderRadius: 8,
          marginBottom: 80, // Agregar margen para que no se superponga con la tab bar
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}
