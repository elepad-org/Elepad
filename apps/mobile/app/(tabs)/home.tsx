import {
  Alert,
  StyleSheet,
  View,
  ScrollView,
} from "react-native";
import { ActivityIndicator, Text, Button, Avatar, useTheme } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ActivitiesList from "../../components/ActivitiesList";
import CalendarView from "@/components/CalendarView";
import {ThemedSafeAreaView} from "@/components/ThemedSafeAreaView";

export default function HomeScreen() {
  const { userElepad, loading, signOut } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";

  return (
    <ThemedSafeAreaView style={styles.safeArea}>
      {/* --- Header --- */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name="menu" size={40} color={colors.onPrimary} />
        <View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.headerTitle, { color: colors.onPrimary }]}
            // TODO: If the name is too long it should be truncated, otherwise it will overflow the menu item and the avatar
          >
            Bienvenido {displayName}
          </Text>
        </View>
        <Avatar.Image
          size={50}
          source={{ uri: "https://i.pravatar.cc/150?u=a042581f4e29030" }}
        />
      </View>

      <ScrollView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        <View>
          <ActivitiesList />
          <CalendarView />
        </View>
      </ScrollView>
      <Button
        mode="contained"
        style={styles.logout}
        icon="logout"
        onPress={async () => {
          await signOut();
          router.replace("/");
          Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
        }}
      >
        Cerrar sesión
      </Button>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 20,
        }}
      >
        <Button
          mode="contained"
          style={styles.logout}
          icon="logout"
          onPress={async () => {
            router.navigate("/home2");
          }}
        >
          Ir a Home 2
        </Button>
        <Button
          mode="contained"
          style={styles.logout}
          icon="logout"
          onPress={async () => {
            router.navigate("/home3");
          }}
        >
          Ir a Home 3
        </Button>
      </View>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: "12%",
    paddingBottom: "20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -40,
    paddingTop: 10,
  },
  listContainer: {
    padding: 8,
  },
  logout: { marginTop: 32, alignSelf: "center", borderRadius: 8 },
});
