import { AuthProvider } from "@/hooks/useAuth";
import {
  DarkTheme as NavDark,
  DefaultTheme as NavLight,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import { useEffect } from "react";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import {
  Provider as PaperProvider,
  adaptNavigationTheme,
} from "react-native-paper";
import SpaceMono from "@/assets/fonts/SpaceMono-Regular.ttf";
import JosefinSansVariable from "@/assets/fonts/JosefinSans-Variable.ttf";
import MontserratRegular from "@/assets/fonts/Montserrat-Regular.ttf";
import { lightTheme, darkTheme } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

// Caché en memoria del token para cumplir con la firma síncrona de getToken, solutions by el amigo
let AUTH_TOKEN: string | undefined;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Load all custom fonts (keys are the fontFamily names you'll use in styles)
  const [loaded] = useFonts({
    SpaceMono,
    JosefinSans: JosefinSansVariable,
    Montserrat: MontserratRegular,
  });

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
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={paperTheme}>
            <NavigationThemeProvider value={navTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
            </NavigationThemeProvider>
          </PaperProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
