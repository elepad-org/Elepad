import React from "react";
import { View, Text, FlatList, StyleSheet, SafeAreaView } from "react-native";
import { Card, Avatar, Surface, Chip } from "react-native-paper";

const theme = {
  colors: {
    title: "#2d5a87",

    completedCard: "#c8e6c9",
    pendingCard: "#fff3cd",
    completedText: "#2d5a87",
    pendingText: "#4a5568",
    completedChip: "rgba(76, 175, 80, 0.2)",
    pendingChip: "rgba(255, 193, 7, 0.3)",
  },
};

const HomeScreen = () => {
  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  // Mocked data
  const actividades = [
    {
      id: 1,
      titulo: "Tomar medicamento matutino",
      hora: "08:00",
      completado: true,
      descripcion: "Vitamina D y Omega 3",
    },
    {
      id: 2,
      titulo: "Ejercicios de estiramiento",
      hora: "10:30",
      completado: true,
      descripcion: "15 minutos de rutina suave",
    },
    {
      id: 3,
      titulo: "Almorzar",
      hora: "12:30",
      completado: false,
      descripcion: "Recordar beber agua",
    },
    {
      id: 4,
      titulo: "Medicamento de la tarde",
      hora: "15:00",
      completado: false,
      descripcion: "Presión arterial",
    },
  ];

  // TODO: Refactor this as a new component
  const ActividadCard = ({ actividad }) => {
    const { titulo, hora, descripcion, completado } = actividad;
    const isCompleted = completado;

    const cardStyle = {
      backgroundColor: isCompleted
        ? theme.colors.completedCard
        : theme.colors.pendingCard,
    };
    const textColor = isCompleted
      ? theme.colors.completedText
      : theme.colors.pendingText;
    const chipStyle = {
      backgroundColor: isCompleted
        ? theme.colors.completedChip
        : theme.colors.pendingChip,
    };

    return (
      <Card style={[styles.card, cardStyle]} elevation={2}>
        <Card.Content>
          <View style={styles.header2}>
            <Text style={[styles.titulo, { color: textColor }]}>{titulo}</Text>
            <Text style={[styles.hora, { color: textColor }]}>{hora}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={[styles.descripcion, { color: textColor, opacity: 0.8 }]}
            >
              {descripcion}
            </Text>
            <Chip
              icon={isCompleted ? "check" : "clock-outline"}
              style={[styles.chip, chipStyle]}
              textStyle={{ color: textColor, fontWeight: "bold" }}
            >
              {isCompleted ? "Completado" : "Pendiente"}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.headerSurface} elevation={4}>
        <Text style={styles.headerTitle}>logo</Text>
        <Avatar.Image
          size={50}
          source={{ uri: "https://i.pravatar.cc/150?u=a042581f4e29030" }}
        />
      </Surface>

      <FlatList
        data={actividades}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ActividadCard actividad={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <Surface style={styles.listHeader} elevation={1}>
            <Text style={styles.sectionTitle}>Actividades de Hoy</Text>
            <Text style={styles.dateText}>{fechaHoy}</Text>
          </Surface>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f2f8" },
  headerSurface: {
    backgroundColor: "#7fb3d3",
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: theme.colors.title },
  listContent: { paddingHorizontal: 20, paddingVertical: 24 },
  listHeader: {
    backgroundColor: "#d4e6f1",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: theme.colors.title },
  dateText: {
    fontSize: 16,
    color: "#4a6fa5",
    textTransform: "capitalize",
  },
  card: { borderRadius: 16 },
  header2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titulo: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 8 },
  hora: { fontSize: 14, fontWeight: "600" },
  descripcion: { fontSize: 14, marginBottom: 12 },
  chip: { alignSelf: "flex-start" },
});

export default HomeScreen;
