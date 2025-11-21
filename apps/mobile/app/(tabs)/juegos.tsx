import { StatusBar, ScrollView, View, Image } from "react-native";
import {
  ActivityIndicator,
  Text,
  Card,
  Button,
  Icon,
} from "react-native-paper";
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
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={[STYLES.heading, { marginBottom: 0 }]}>
              🧩 Juegos Mentales
            </Text>
            <Button mode="outlined" onPress={() => router.navigate("/history")}>
              Historial
            </Button>
          </View>
          <View style={{ height: 8 }} />
          <Text style={[STYLES.paragraphText, { marginBottom: 24 }]}>
            Entrena tu mente con nuestros juegos diseñados para estimular la
            memoria y las habilidades cognitivas.
          </Text>

          {/* Juego de Memoria */}
          <Card
            style={[
              STYLES.titleCard,
              { alignItems: "center", marginBottom: 16 },
            ]}
          >
            <Card.Content style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 64, marginBottom: 12 }}>🧠</Text>
              <Text
                variant="headlineSmall"
                style={{
                  fontWeight: "bold",
                  color: COLORS.primary,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Juego de Memoria
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Encuentra todas las parejas de cartas iguales y entrena tu
                mente. ¡Desafía tu memoria!
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push("/memory-game")}
                icon="play"
                buttonColor={COLORS.primary}
                style={{ width: "100%" }}
                contentStyle={{ paddingVertical: 4 }}
              >
                Jugar Ahora
              </Button>
              <View style={{ height: 8 }} />
            </Card.Content>
          </Card>

          {/* Juego NET */}
          <Card
            style={[
              STYLES.titleCard,
              { alignItems: "center", marginBottom: 16 },
            ]}
          >
            <Card.Content style={{ alignItems: "center" }}>
              <Icon source="lan" size={64} color="#2196F3" />
              <View style={{ height: 12 }} />
              <Text
                variant="headlineSmall"
                style={{
                  fontWeight: "bold",
                  color: COLORS.primary,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                NET
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Conecta toda la red girando las casillas. Rota las piezas hasta
                formar una red completamente conectada.
              </Text>
              <Button
                mode="contained"
                onPress={() => router.push("/net-game")}
                icon="play"
                buttonColor={COLORS.primary}
                style={{ width: "100%" }}
                contentStyle={{ paddingVertical: 4 }}
              >
                Jugar Ahora
              </Button>
              <View style={{ height: 8 }} />
            </Card.Content>
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
