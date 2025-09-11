import React, { useState, useCallback } from "react";
import {
  StatusBar,
  ScrollView,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";

import RecuerdoItemComponent from "@/components/Recuerdos/RecuerdoItemComponent";
import NuevoRecuerdoDialogComponent from "@/components/Recuerdos/NuevoRecuerdoDialogComponent";
import eleEmpthy from "@/assets/images/elepad_mantenimiento.png";

const screenWidth = Dimensions.get("window").width;
const numColumns = 2;
const itemSize = (screenWidth - 48) / numColumns;

// Tipos de recuerdos
type RecuerdoTipo = "imagen" | "texto" | "audio";

interface Recuerdo {
  id: string;
  tipo: RecuerdoTipo;
  contenido: string;
  miniatura?: string;
  titulo?: string;
  fecha: Date;
}

export default function RecuerdosScreen() {
  const { loading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [recuerdos, setRecuerdos] = useState<Recuerdo[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<"select" | "create">("select");
  const [selectedTipo, setSelectedTipo] = useState<RecuerdoTipo | null>(null);

  // Función para simular la carga de recuerdos (en producción, aquí se conectaría con el backend)
  const cargarRecuerdos = useCallback(async () => {
    // En producción, aquí se cargarían los recuerdos desde el backend
    // Por ahora, simularemos que no hay recuerdos
    setRecuerdos([]);
    return [];
  }, []);

  // Función para cargar más recuerdos al hacer scroll
  const cargarMasRecuerdos = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    // Simular carga de más recuerdos (en producción, se implementaría la paginación)
    setTimeout(() => {
      setLoadingMore(false);
    }, 1000);
  }, [loadingMore]);

  // Función para refrescar la galería
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarRecuerdos();
    setRefreshing(false);
  }, [cargarRecuerdos]);

  // Manejador para crear un nuevo recuerdo
  const handleNuevoRecuerdo = (tipo: RecuerdoTipo) => {
    setSelectedTipo(tipo);
    setCurrentStep("create");
  };

  const handleGuardarRecuerdo = (contenido: string, titulo?: string) => {
    // Crear nuevo recuerdo
    const nuevoRecuerdo: Recuerdo = {
      id: Date.now().toString(),
      tipo: selectedTipo!,
      contenido,
      titulo,
      fecha: new Date(),
    };

    // Agregar al estado local (en producción se enviaría al backend)
    setRecuerdos((prev) => [nuevoRecuerdo, ...prev]);

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

  // Efecto para cargar los recuerdos inicialmente
  React.useEffect(() => {
    cargarRecuerdos();
  }, [cargarRecuerdos]);

  if (loading) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
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
            style={{ width: 180, height: 180, marginBottom: 10 }}
          />
          <Text style={STYLES.heading}>No hay recuerdos aún</Text>
          <Text style={STYLES.subheading}>
            Añade un recuedro recuerdo con + Agregar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recuerdos}
          renderItem={({ item }) => <RecuerdoItemComponent item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={cargarMasRecuerdos}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <ActivityIndicator color={COLORS.primary} />
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
    </SafeAreaView>
  );
}
