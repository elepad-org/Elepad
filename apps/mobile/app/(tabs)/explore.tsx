import { StatusBar, ScrollView, Image, View } from "react-native";
import { ActivityIndicator, Text, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import elepadMantenimiento from "../../assets/images/elepad_mantenimiento.png";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function ExploreScreen() {
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

      <ScrollView style={baseStyles.contentWithCurves}>
        <View style={baseStyles.developmentContainer}>
          <Image
            source={elepadMantenimiento}
            style={baseStyles.maintenanceImage}
            resizeMode="contain"
          />
          <Card style={baseStyles.developmentCard} mode="elevated">
            <Card.Content>
              <Text style={baseStyles.developmentTitle}>
                🚧 Página en desarrollo
              </Text>
              <Text style={baseStyles.developmentText}>
                ¡Hola! Esta página está en construcción. Próximamente verás
                nuevas funcionalidades increíbles que harán tu experiencia aún
                mejor.
              </Text>
              <Text style={baseStyles.developmentSubtext}>
                Mantente atento a las actualizaciones 🎉
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
