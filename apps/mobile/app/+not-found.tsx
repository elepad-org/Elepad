import { Link, Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { Surface, Text, Button, useTheme } from "react-native-paper";

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Surface
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
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
      </Surface>
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
