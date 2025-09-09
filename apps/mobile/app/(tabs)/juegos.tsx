import { StatusBar, ScrollView, View, Image } from "react-native";
import { ActivityIndicator, Text, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, styles as baseStyles } from "@/styles/base";
import eleCasino from "@/assets/images/ele-casino.jpeg";

export default function JuegosScreen() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={baseStyles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        contentContainerStyle={baseStyles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={baseStyles.container}>
          {/* Contenido principal */}
          <Card style={[baseStyles.titleCard, { alignItems: "center" }]}>
            <Card.Content>
              <Text
                style={[baseStyles.heading, { fontSize: 48, marginBottom: 16 }]}
              >
                🧩
              </Text>
              <Text style={[baseStyles.heading, { marginBottom: 16 }]}>
                Página en desarrollo
              </Text>
              <Text
                style={[
                  baseStyles.paragraphText,
                  { textAlign: "center", marginBottom: 12 },
                ]}
              >
                ¡Hola! Esta página está en construcción. Próximamente verás
                nuevas funcionalidades increíbles que harán tu experiencia aún
                mejor.
              </Text>
              <Text
                style={[
                  baseStyles.subheading,
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
