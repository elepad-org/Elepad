import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
} from "react-native";
import { ActivityIndicator, Text, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { FONT } from "@/styles/theme";
import elepadMantenimiento from "../../assets/images/elepad_mantenimiento.png";

const colors = {
  primary: "#7fb3d3",
  white: "#f9f9f9ff",
  background: "#F4F7FF",
};

export default function ExploreScreen() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ScrollView style={styles.contentContainer}>
        <View style={styles.developmentContainer}>
          <Image
            source={elepadMantenimiento}
            style={styles.heartImage}
            resizeMode="contain"
          />
          <Card style={styles.developmentCard} mode="elevated">
            <Card.Content>
              <Text style={styles.developmentTitle}>
                🚧 Página en desarrollo
              </Text>
              <Text style={styles.developmentText}>
                ¡Hola! Esta página está en construcción. Próximamente verás
                nuevas funcionalidades increíbles que harán tu experiencia aún
                mejor.
              </Text>
              <Text style={styles.developmentSubtext}>
                Mantente atento a las actualizaciones 🎉
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: "12%",
    paddingBottom: "20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  welcomeGreeting: {
    fontSize: 16,
    fontFamily: FONT.regular,
    color: colors.white,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    color: colors.white,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -40,
    paddingTop: 10,
  },
  developmentContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  heartImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  developmentCard: {
    width: "100%",
    backgroundColor: colors.white,
    elevation: 3,
  },
  developmentTitle: {
    fontSize: 24,
    fontFamily: FONT.bold,
    textAlign: "center",
    color: colors.primary,
    marginBottom: 16,
  },
  developmentText: {
    fontSize: 16,
    fontFamily: FONT.regular,
    textAlign: "center",
    lineHeight: 24,
    color: "#666",
    marginBottom: 12,
  },
  developmentSubtext: {
    fontSize: 14,
    fontFamily: FONT.medium,
    textAlign: "center",
    color: colors.primary,
  },
  memberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitials: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: colors.primary,
  },
  listContainer: {
    padding: 8,
  },
  logout: { marginTop: 32, alignSelf: "center", borderRadius: 8 },
});
