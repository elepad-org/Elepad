import { ScrollView, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, Avatar, Card } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { STYLES } from "@/styles/base";

export default function HomeScreen() {
  const { userElepad, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={STYLES.center}>
        <ActivityIndicator />
      </SafeAreaView>
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
    <SafeAreaView style={STYLES.safeArea}>
      <StatusBar />

      <ScrollView
        contentContainerStyle={STYLES.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={STYLES.container}>
          {/* Header con saludo */}
          <Card style={[STYLES.titleCard, { marginBottom: 24 }]}>
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
                  <Text style={[STYLES.subheading, { marginBottom: 4 }]}>
                    ¡Hola!
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={STYLES.heading}
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
                    style={STYLES.memberAvatarPlaceholder}
                    labelStyle={STYLES.memberInitials}
                  />
                )}
              </View>
            </Card.Content>
          </Card>

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
