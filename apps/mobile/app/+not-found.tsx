import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { Text, Button } from "react-native-paper";
import { ThemedSafeAreaView } from "@/components/ThemedSafeAreaView";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedSafeAreaView style={styles.container}>
        <Text variant="headlineSmall">This screen does not exist.</Text>
        <Link href="/" asChild>
          <Button
            mode="contained"
            icon="home"
            accessibilityLabel="Go to home screen"
            style={styles.link}
          >
            Go to home screen
          </Button>
        </Link>
      </ThemedSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
