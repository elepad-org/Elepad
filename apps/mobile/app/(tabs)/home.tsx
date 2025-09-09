import React from "react";
import { StatusBar, ScrollView, View } from "react-native";
import { ActivityIndicator, Text, Avatar, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
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

      <ScrollView
        contentContainerStyle={baseStyles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={baseStyles.container}>
          {/* Header con saludo */}
          <Card style={[baseStyles.titleCard, { marginBottom: 24 }]}>
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[baseStyles.subheading, { marginBottom: 4 }]}>
                    ¡Hola!
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={baseStyles.heading}
                  >
                    {displayName}
                  </Text>
                </View>
                {userElepad?.avatarUrl ? (
                  <Avatar.Image
                    size={50}
                    source={{ uri: userElepad?.avatarUrl }}
                  />
                ) : (
                  <Avatar.Text
                    size={50}
                    label={getInitials(displayName)}
                    style={baseStyles.memberAvatarPlaceholder}
                    labelStyle={baseStyles.memberInitials}
                  />
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Contenido principal */}
          <Card style={[baseStyles.titleCard, { alignItems: "center" }]}>
            <Card.Content>
              <Text
                style={[baseStyles.heading, { fontSize: 48, marginBottom: 16 }]}
              >
                🚧
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
              <Text style={[baseStyles.subheading, { textAlign: "center" }]}>
                Mantente atento a las actualizaciones 🎉
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
