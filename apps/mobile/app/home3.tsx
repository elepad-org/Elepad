import { View, StyleSheet, FlatList } from "react-native";
import { Text, Card, Avatar } from "react-native-paper";

type Activity = {
  id: string;
  title: string;
  status: "Pendiente" | "Completado";
};

const mockActivities: Activity[] = [
  { id: "1", title: "Tomar medicamento", status: "Pendiente" },
  { id: "2", title: "Caminata diaria", status: "Completado" },
  { id: "3", title: "Llamar a la familia", status: "Pendiente" },
];

const Item = ({ item }: { item: Activity }) => {
  const isDone = item.status === "Completado";
  return (
    <Card
      style={[
        styles.activityCard,
        { backgroundColor: isDone ? "#38BDF8" : "#7DD3FC" }, // azul intenso para completado, celeste suave para pendiente
      ]}
    >
      <Card.Content>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityStatus}>{item.status}</Text>
      </Card.Content>
    </Card>
  );
};

export default function Home() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.headerTitle}
            // TODO: If the name is too long it should be truncated, otherwise it will overflow the menu item and the avatar
          >
            Bienvenido Juan Perez
          </Text>
        </View>
        <Avatar.Image
          size={50}
          source={{ uri: "https://i.pravatar.cc/150?u=a042581f4e29030" }} // Un avatar de placeholder
        />
      </View>

      {/* Body superpuesto */}
      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Actividades de Hoy</Text>
        <FlatList
          data={mockActivities}
          renderItem={({ item }) => <Item item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.activitiesList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2c56c8ff", // azul fuerte detrás de todo
  },
  header: {
    backgroundColor: "#2c56c8ff", // azul fuerte
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#f9f9f9ff",
  },
  headerText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#E0F2FE",
    marginBottom: 20,
    letterSpacing: 2,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#E0F2FE",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E0F2FE",
  },
  body: {
    flex: 1,
    backgroundColor: "#E0F2FE",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    padding: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 20,
    textAlign: "center",
  },
  activitiesList: {
    paddingBottom: 30,
  },
  activityCard: {
    marginBottom: 15,
    borderRadius: 20,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#1E3A8A",
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 5,
  },
  activityStatus: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
});
