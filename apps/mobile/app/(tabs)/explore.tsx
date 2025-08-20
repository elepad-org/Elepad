import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Explorar
      </Text>
      <Text style={styles.paragraph}>
        Esta es una nueva app que está en construcción.
      </Text>
      <Text style={styles.paragraph}>Muy pronto verás más contenido aquí.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  paragraph: { textAlign: "center", marginTop: 4 },
});
