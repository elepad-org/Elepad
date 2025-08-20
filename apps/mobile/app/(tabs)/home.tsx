import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, Button } from "react-native-paper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const displayName =
    (user?.user_metadata?.displayName as string | undefined) ||
    user?.email ||
    "usuario";

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.text}>
        Bienvenid@ {displayName}
      </Text>
      <Text style={styles.subtitle}>
        Este es tu inicio. Pronto agregaremos más funcionalidades aquí.
      </Text>
      <Button
        mode="contained"
        style={styles.logout}
        icon="logout"
        onPress={async () => {
          console.log("Cerrando sesión:", displayName);
          await signOut();
          router.replace("/");
          Alert.alert("Sesión cerrada", "Has cerrado sesión correctamente.");
        }}
      >
        Cerrar sesión
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  text: { textAlign: "center", fontWeight: "bold" },
  subtitle: { marginTop: 12, textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logout: { marginTop: 32, alignSelf: "center", borderRadius: 8 },
});
