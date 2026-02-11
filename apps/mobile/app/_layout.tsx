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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect } from "react";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import { Provider as PaperProvider } from "react-native-paper";
import { lightTheme, darkTheme } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import StreakListener from "@/components/listeners/StreakListener";
import { COLORS } from "@/styles/base";
import { ToastProvider } from "@/components/shared/Toast";
import { TourProvider } from "@/components/tour/TourProvider";
import { TourOverlay } from "@/components/tour/TourOverlay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      networkMode: 'offlineFirst',
    },
  },
});

// Caché en memoria del token para cumplir con la firma síncrona de getToken
let AUTH_TOKEN: string | undefined;
let TOKEN_LOADED = false;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useAppFonts();

  // Mantener el token actualizado en AUTH_TOKEN de forma reactiva
  useEffect(() => {
    let isMounted = true;
    
    const loadSession = async () => {
      try {
        // Timeout para getSession - si tarda más de 8 segundos, abortar
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 8000)
        );
        
        const { data, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]).catch((err) => {
          console.warn("⚠️ getSession timeout o error:", err);
          return { data: { session: null }, error: err };
        });
        
        if (isMounted) {
          AUTH_TOKEN = data.session?.access_token ?? undefined;
          TOKEN_LOADED = true;
          console.log(
            "🔑 Token inicial cargado:",
            AUTH_TOKEN ? "✅ Presente" : "❌ Ausente",
            error ? `(con error: ${error})` : ""
          );
        }
      } catch (err) {
        console.error("❌ Error cargando sesión:", err);
        if (isMounted) {
          TOKEN_LOADED = true;
        }
      }
    };
    
    loadSession();
    
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        AUTH_TOKEN = session?.access_token ?? undefined;
        TOKEN_LOADED = true;
        console.log("🔐 Token actualizado vía onAuthStateChange:", event, AUTH_TOKEN ? "✅" : "❌");
      },
    );
    
    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  configureApiClient({
    // TODO: read from a config.ts file, and make that file read from env
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787",
    // Función que siempre retorna el token más reciente
    // Si AUTH_TOKEN está vacío, intenta obtenerlo sincrónicamente del storage
    getToken: () => {
      // Si aún no se cargó, retornar undefined para que la API espere
      if (!TOKEN_LOADED) {
        console.warn("⏳ Token no está listo aún, retornando undefined");
      }
      return AUTH_TOKEN;
    },
  });

  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? NavDark : NavLight;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PaperProvider theme={paperTheme}>
              <ToastProvider>
                <NavigationThemeProvider value={navTheme}>
                  <StreakListener />
                  <TourProvider>
                    <Stack
                      screenOptions={{
                        contentStyle: { backgroundColor: COLORS.background },
                      }}
                    >
                        <Stack.Screen
                          name="index"
                          options={{ headerShown: false, animation: "fade" }}
                        />
                        <Stack.Screen
                          name="(auth)"
                          options={{ headerShown: false, animation: "fade" }}
                        />
                        <Stack.Screen
                          name="(tabs)"
                          options={{ headerShown: false, animation: "fade" }}
                        />
                        <Stack.Screen
                          name="familyGroup"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="configuracion"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="history"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="focus-game"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="memory-game"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="net-game"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="sudoku-game"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="game-detail/[gameId]"
                          options={{
                            headerShown: false,
                            animation: "fade",
                            presentation: "card",
                          }}
                        />
                        <Stack.Screen
                          name="notifications"
                          options={{
                            headerShown: false,
                            presentation: "card",
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="shop"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="albums"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                        <Stack.Screen
                          name="album-viewer"
                          options={{
                            headerShown: false,
                            animation: "fade",
                          }}
                        />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <TourOverlay />
                  </TourProvider>
                </NavigationThemeProvider>
              </ToastProvider>
            </PaperProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
