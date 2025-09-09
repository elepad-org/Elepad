import { StatusBar, ScrollView, View } from "react-native";
import { ActivityIndicator, Text, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, STYLES } from "@/styles/base";

export default function ExploreScreen() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={STYLES.center}>
        <ActivityIndicator />
      </SafeAreaView>
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
                🚧
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
              <Text style={[STYLES.subheading, { textAlign: "center" }]}>
                Mantente atento a las actualizaciones 🎉
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
