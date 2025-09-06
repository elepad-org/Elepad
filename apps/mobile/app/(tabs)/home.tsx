import React from "react";
import { StatusBar, ScrollView, Image, View } from "react-native";
import { ActivityIndicator, Text, Avatar, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import elepadMantenimiento from "../../assets/images/elepad_mantenimiento.png";
import { COLORS, styles as baseStyles } from "@/styles/base";

export default function HomeScreen() {
  const { userElepad, loading } = useAuth();

  if (loading) {
    return (
      <View style={baseStyles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const displayName =
    (userElepad?.displayName as string) || userElepad?.email || "Usuario";

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <SafeAreaView style={baseStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* --- Header --- */}
      <View style={baseStyles.headerPrimary}>
        <View style={baseStyles.welcomeTextContainer}>
          <Text style={baseStyles.welcomeGreeting}>¡Hola!</Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={baseStyles.headerTitle}
          >
            {displayName}
          </Text>
        </View>
        {userElepad?.avatarUrl ? (
          <Avatar.Image size={50} source={{ uri: userElepad?.avatarUrl }} />
        ) : (
          <View style={baseStyles.memberAvatarPlaceholder}>
            <Text style={baseStyles.memberInitials}>
              {getInitials(displayName)}
            </Text>
          </View>
        )}
      </View>

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
