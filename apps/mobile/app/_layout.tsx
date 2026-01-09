import { AuthProvider } from "@/hooks/useAuth";
import {
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppFonts } from "@/hooks/useAppFonts";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import { Provider as PaperProvider } from "react-native-paper";
import { lightTheme, darkTheme } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StreakSnackbarProvider } from "@/hooks/useStreakSnackbar";

const queryClient = new QueryClient();

// Caché en memoria del token para cumplir con la firma síncrona de getToken, solutions by el amigo
let AUTH_TOKEN: string | undefined;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useAppFonts();

  // Mantener el token actualizado en AUTH_TOKEN de forma reactiva
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      AUTH_TOKEN = data.session?.access_token ?? undefined;
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        AUTH_TOKEN = session?.access_token ?? undefined;
      },
    );
    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  configureApiClient({
    // TODO: read from a config.ts file, and make that file read from env
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787",
    getToken: () => AUTH_TOKEN,
  });

  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? NavDark : NavLight;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StreakSnackbarProvider>
          <AuthProvider>
            <PaperProvider theme={paperTheme}>
              <NavigationThemeProvider value={navTheme}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="familyGroup"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </NavigationThemeProvider>
            </PaperProvider>
          </AuthProvider>
        </StreakSnackbarProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
