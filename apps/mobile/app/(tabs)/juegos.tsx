import { StatusBar, ScrollView, View, Image } from "react-native";
import { ActivityIndicator, Text, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES } from "@/styles/base";
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
    <SafeAreaView style={STYLES.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Contenido principal */}
          <Card style={[STYLES.titleCard, { alignItems: "center" }]}>
            <Card.Content>
              <Text
                style={[STYLES.heading, { fontSize: 48, marginBottom: 16 }]}
              >
                🧩
              </Text>
              <Text style={[STYLES.heading, { marginBottom: 16 }]}>
                Página en desarrollo
              </Text>
              <Text
                style={[
                  STYLES.paragraphText,
                  { textAlign: "center", marginBottom: 12 },
                ]}
              >
                ¡Hola! Esta página está en construcción. Próximamente verás
                nuevas funcionalidades increíbles que harán tu experiencia aún
                mejor.
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
