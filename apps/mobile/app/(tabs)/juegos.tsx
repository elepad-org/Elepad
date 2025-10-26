import { StatusBar, ScrollView, View, Image, StyleSheet } from "react-native";
import { ActivityIndicator, Text, Card, Button } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES } from "@/styles/base";
import { router } from "expo-router";
import eleCasino from "@/assets/images/ele-casino.jpeg";

export default function JuegosScreen() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={STYLES.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={STYLES.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Título de la sección */}
          <Text style={[STYLES.heading, { marginBottom: 16 }]}>
            🧩 Juegos Mentales
          </Text>
          <Text style={[STYLES.paragraphText, { marginBottom: 24 }]}>
            Entrena tu mente con nuestros juegos diseñados para estimular la
            memoria y las habilidades cognitivas.
          </Text>

          {/* Juego de Memoria */}
          <Card style={[STYLES.card, { marginBottom: 16 }]}>
            <Card.Content>
              <View style={styles.gameHeader}>
                <Text style={styles.gameIcon}>🧠</Text>
                <View style={styles.gameInfo}>
                  <Text variant="titleLarge" style={styles.gameTitle}>
                    Juego de Memoria
                  </Text>
                  <Text variant="bodyMedium" style={styles.gameDescription}>
                    Encuentra todas las parejas de cartas iguales
                  </Text>
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                mode="contained"
                onPress={() => router.push("/memory-game")}
                icon="play"
                buttonColor={COLORS.primary}
                style={styles.playButton}
              >
                Jugar Ahora
              </Button>
            </Card.Actions>
          </Card>

          {/* Próximamente */}
          <Card style={[STYLES.titleCard, { alignItems: "center" }]}>
            <Card.Content>
              <Text
                style={[STYLES.heading, { fontSize: 48, marginBottom: 16 }]}
              >
                🎮
              </Text>
              <Text style={[STYLES.heading, { marginBottom: 16 }]}>
                Más juegos próximamente
              </Text>
              <Text
                style={[
                  STYLES.paragraphText,
                  { textAlign: "center", marginBottom: 12 },
                ]}
              >
                Estamos trabajando en nuevos juegos emocionantes para ti. Pronto
                tendrás sudoku, rompecabezas y mucho más.
              </Text>
              <Text
                style={[
                  STYLES.subheading,
                  { textAlign: "center", marginBottom: 16 },
                ]}
              >
                Mantente atento a las actualizaciones 🎉
              </Text>
              <Image
                source={eleCasino}
                style={{
                  width: "100%",
                  height: 330,
                  borderRadius: 16,
                  marginTop: 8,
                }}
                resizeMode="cover"
              />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gameIcon: {
    fontSize: 48,
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  gameDescription: {
    color: COLORS.textSecondary,
  },
  playButton: {
    flex: 1,
  },
});
