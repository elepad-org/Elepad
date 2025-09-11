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
  FAB,
  Portal,
  Dialog,
  Button,
  IconButton,
  Divider,
} from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES, SHADOWS } from "@/styles/base";
import eleEmpthy from "@/assets/images/elepad_mantenimiento.png";
import ImagePickerComponent from "@/components/Recuerdos/ImagePickerComponent";
import TextNoteComponent from "@/components/Recuerdos/TextNoteComponent";
import AudioRecorderComponent from "@/components/Recuerdos/AudioRecorderComponent";

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

// Componente de recuerdo vacío
const EmptyState = () => {
  return (
    <View style={STYLES.center}>
      <Image
        source={eleEmpthy}
        style={{ width: 180, height: 180, marginBottom: 24 }}
      />
      <Text style={STYLES.heading}>No hay recuerdos aún</Text>
      <Text style={STYLES.subheading}>
        Subí tu primer recuerdo tocando el botón +
      </Text>
    </View>
  );
};

// Componente para cada recuerdo en la galería
const RecuerdoItem = ({ item }: { item: Recuerdo }) => {
  return (
    <TouchableOpacity
      style={[STYLES.card, { width: itemSize, height: itemSize, margin: 4 }]}
    >
      {item.tipo === "imagen" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="image" size={32} iconColor={COLORS.primary} />
          <Text style={STYLES.footerText}>Imagen</Text>
        </View>
      )}
      {item.tipo === "texto" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text numberOfLines={2} style={STYLES.footerText}>
            {item.titulo || "Nota de texto"}
          </Text>
        </View>
      )}
      {item.tipo === "audio" && (
        <View style={[STYLES.center, { backgroundColor: COLORS.accent }]}>
          <IconButton icon="microphone" size={24} iconColor={COLORS.primary} />
          <Text numberOfLines={2} style={STYLES.footerText}>
            {item.titulo || "Nota de voz"}
          </Text>
        </View>
      )}
      <View
        style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 4,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 10 }}>
          {item.fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Componente para diálogo de nuevo recuerdo
const NuevoRecuerdoDialog = ({
  visible,
  hideDialog,
  onSelectTipo,
  step,
  selectedTipo,
  onSave,
  onCancel,
}: {
  visible: boolean;
  hideDialog: () => void;
  onSelectTipo: (tipo: RecuerdoTipo) => void;
  step: "select" | "create";
  selectedTipo: RecuerdoTipo | null;
  onSave: (contenido: string, titulo?: string) => void;
  onCancel: () => void;
}) => {
  if (step === "create" && selectedTipo) {
    return (
      <Dialog visible={visible} onDismiss={hideDialog}>
        {selectedTipo === "imagen" && (
          <ImagePickerComponent
            onImageSelected={(uri: string) => onSave(uri)}
            onCancel={onCancel}
          />
        )}
        {selectedTipo === "texto" && (
          <TextNoteComponent
            onSaveText={(titulo, contenido) => onSave(contenido, titulo)}
            onCancel={onCancel}
          />
        )}
        {selectedTipo === "audio" && (
          <AudioRecorderComponent
            onAudioRecorded={(uri: string) => onSave(uri)}
            onCancel={onCancel}
          />
        )}
      </Dialog>
    );
  }

  return (
    <Dialog visible={visible} onDismiss={hideDialog}>
      <Dialog.Title style={STYLES.heading}>Nuevo recuerdo</Dialog.Title>
      <Dialog.Content>
        <Text style={STYLES.subheading}>
          Selecciona el tipo de recuerdo que quieres subir:
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("imagen")}
        >
          <IconButton icon="image" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Imagen o Video</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("texto")}
        >
          <IconButton icon="text" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Texto</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
          }}
          onPress={() => onSelectTipo("audio")}
        >
          <IconButton icon="microphone" size={24} iconColor={COLORS.primary} />
          <Text style={STYLES.paragraphText}>Audio</Text>
        </TouchableOpacity>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={hideDialog}>Cancelar</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

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
          padding: 16,
          borderBottomColor: COLORS.border,
          borderBottomWidth: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={STYLES.heading}>Mis Recuerdos</Text>
        <Button
          mode="contained"
          onPress={() => setDialogVisible(true)}
          style={STYLES.buttonPrimary}
          icon="plus"
          compact
        >
          Agregar
        </Button>
      </View>

      {recuerdos.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={recuerdos}
          renderItem={({ item }) => <RecuerdoItem item={item} />}
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

      {/* FAB para crear nuevo recuerdo */}
      <FAB
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 16,
          backgroundColor: COLORS.primary,
        }}
        icon="plus"
        color="#fff"
        onPress={() => setDialogVisible(true)}
      />

      {/* Diálogo para seleccionar tipo de recuerdo */}
      <Portal>
        <NuevoRecuerdoDialog
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
