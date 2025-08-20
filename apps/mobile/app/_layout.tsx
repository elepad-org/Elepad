import { AuthProvider } from "@/hooks/useAuth";
import {
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import {
  Provider as PaperProvider,
  adaptNavigationTheme,
} from "react-native-paper";
import SpaceMono from "@/assets/fonts/SpaceMono-Regular.ttf";
import { lightTheme, darkTheme } from "@/styles/theme";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useRef } from "react";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import type { MD3Theme } from "react-native-paper";

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({ SpaceMono });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  configureApiClient({
    // TODO: read from a config.ts file, and make that file read from env
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787/api",
    // TODO: add auth only when that is implemented on the backend
    // getToken: async () => {
    //   const { data } = await supabase.auth.getSession();
    //   return data.session?.access_token;
    // },
  });

  const { LightTheme: AdaptedNavLight, DarkTheme: AdaptedNavDark } =
    adaptNavigationTheme({
      reactNavigationLight: NavLight,
      reactNavigationDark: NavDark,
      materialLight: lightTheme,
      materialDark: darkTheme,
    });

  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? AdaptedNavDark : AdaptedNavLight;

  return (
    <AuthProvider>
      <AuthGate navTheme={navTheme} paperTheme={paperTheme} />
    </AuthProvider>
  );
}

type GateProps = { navTheme: NavigationTheme; paperTheme: MD3Theme };

function AuthGate({ navTheme, paperTheme }: GateProps) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastSessionRef = useRef<boolean | null>(null);

  // Evitar loops: solo navegar si cambia el estado de sesión
  useEffect(() => {
    if (loading) return;
    const isAuthed = !!session;
    if (lastSessionRef.current === isAuthed) return;
    lastSessionRef.current = isAuthed;

    const inTabs = segments[0] === "(tabs)";
    if (!isAuthed && inTabs) {
      router.replace("/");
    } else if (isAuthed && !inTabs) {
      router.replace("/(tabs)/home");
    }
  }, [loading, session, segments, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={paperTheme}>
        <NavigationThemeProvider value={navTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
