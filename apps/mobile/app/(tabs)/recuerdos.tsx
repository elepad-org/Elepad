import React, { useState, useCallback } from "react";
import {
  StatusBar,
  ScrollView,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Portal,
  Dialog,
  Button,
  IconButton,
  Divider,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { useGetMemories, Memory } from "@elepad/api-client";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";

import RecuerdoItemComponent from "@/components/Recuerdos/RecuerdoItemComponent";
import NuevoRecuerdoDialogComponent from "@/components/Recuerdos/NuevoRecuerdoDialogComponent";
import eleEmpthy from "@/assets/images/ele-idea.jpeg";

const screenWidth = Dimensions.get("window").width;
const numColumns = 2;
const itemSize = (screenWidth - 48) / numColumns;

// Tipos de recuerdos
type RecuerdoTipo = "imagen" | "texto" | "audio";

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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<"select" | "create">("select");
  const [selectedTipo, setSelectedTipo] = useState<RecuerdoTipo | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarError, setSnackbarError] = useState(false);

  // Hook del API client
  const {
    data: memoriesResponse,
    isLoading: memoriesLoading,
    error,
    refetch: refetchMemories,
  } = useGetMemories(
    {
      groupId: userElepad?.groupId || undefined,
      limit: 20,
    },
    {
      query: {
        enabled: !!userElepad?.groupId, // Solo ejecutar cuando tengamos groupId
      },
    },
  );

  // Función para cargar recuerdos (mantiene el patrón original)
  const cargarRecuerdos = useCallback(async () => {
    try {
      await refetchMemories();
    } catch (err) {
      setSnackbarMessage("Error al cargar los recuerdos");
      setSnackbarError(true);
      setSnackbarVisible(true);
    }
  }, [refetchMemories]);

  // Extraer los datos de la respuesta
  const memoriesData =
    memoriesResponse && "data" in memoriesResponse ? memoriesResponse.data : [];
  const memories = Array.isArray(memoriesData) ? memoriesData : [];
  const hasGroupId = !!userElepad?.groupId;

  // Convertir memories a recuerdos para compatibilidad con componentes existentes
  const recuerdos = memories.map(memoryToRecuerdo);

  // Estados de carga y error (patrón original restaurado)
  const isLoading = authLoading || memoriesLoading;
  const hasError = !!error;
  const isEmpty = !isLoading && !hasError && recuerdos.length === 0;

  // Función para refrescar la galería (patrón original)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await cargarRecuerdos();
    } catch (err) {
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

  const handleGuardarRecuerdo = (contenido: string, titulo?: string) => {
    // TODO: Implementar la subida real de recuerdos usando uploadMemory del hook
    // Por ahora, solo mostrar un mensaje
    setSnackbarMessage("Funcionalidad de subida en desarrollo");
    setSnackbarError(false);
    setSnackbarVisible(true);

    // Resetear estado
    setDialogVisible(false);
    setCurrentStep("select");
    setSelectedTipo(null);
  };

  const handleCancelar = () => {
    setDialogVisible(false);
    setCurrentStep("select");
    setSelectedTipo(null);
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

  // Si el usuario no tiene groupId, mostrar mensaje
  if (!hasGroupId) {
    return (
      <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View style={STYLES.center}>
          <Text style={STYLES.heading}>Sin grupo familiar</Text>
          <Text style={STYLES.subheading}>
            Necesitas estar en un grupo familiar para ver recuerdos.
          </Text>
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
          data={recuerdos}
          renderItem={({ item }) => <RecuerdoItemComponent item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 16 }}
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
        />
      </Portal>

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
