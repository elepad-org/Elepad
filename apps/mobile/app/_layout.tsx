import {
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppFonts } from "@/hooks/useAppFonts";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import { Provider as PaperProvider } from "react-native-paper";
import { lightTheme, darkTheme } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

// Caché en memoria del token para cumplir con la firma síncrona de getToken.
let AUTH_TOKEN: string | undefined;

configureApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});

export default function RootLayout() {
  const [fontsLoaded] = useAppFonts();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        AUTH_TOKEN = session?.access_token;
        const apiUrl =
          process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

        configureApiClient({
          baseUrl: apiUrl,
          getToken: () => AUTH_TOKEN,
        });
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? NavDark : NavLight;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
