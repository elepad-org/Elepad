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
import { useEffect, useRef } from "react";
import { configureApiClient } from "@elepad/api-client/src/runtime";
import { Provider as PaperProvider } from "react-native-paper";
import { lightTheme, darkTheme } from "@/styles/theme";
import { supabase } from "@/lib/supabase";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StreakSnackbarProvider } from "@/hooks/useStreakSnackbar";
import { COLORS } from "@/styles/base";
import { ToastProvider } from "@/components/shared/Toast";
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";


const queryClient = new QueryClient();

// Caché en memoria del token para cumplir con la firma síncrona de getToken
let AUTH_TOKEN: string | undefined;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useAppFonts();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Mantener el token actualizado en AUTH_TOKEN de forma reactiva
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      AUTH_TOKEN = data.session?.access_token ?? undefined;
      console.log(
        "🔑 Token inicial cargado:",
        AUTH_TOKEN ? "✅ Presente" : "❌ Ausente",
      );
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        AUTH_TOKEN = session?.access_token ?? undefined;
      },
    );
    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  // Setup push notifications
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listener para notificaciones recibidas mientras la app está en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    // Listener para cuando el usuario interactúa con la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      // Aquí puedes navegar a la pantalla correspondiente según el tipo de notificación
      const data = response.notification.request.content.data;
      if (data?.type === 'activity') {
        // Navegar a calendar con activityId
      } else if (data?.type === 'memory') {
        // Navegar a memories con memoryId
      }
    });

    return () => {
      // Cleanup notification listeners
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
      return AUTH_TOKEN;
    },
  });

  const paperTheme = colorScheme === "dark" ? darkTheme : lightTheme;
  const navTheme = colorScheme === "dark" ? NavDark : NavLight;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StreakSnackbarProvider>
            <AuthProvider>
            
                <PaperProvider theme={paperTheme}>
                <NavigationThemeProvider value={navTheme}>
                  <ToastProvider>
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
                      <Stack.Screen name="+not-found" />
                    </Stack>
                  </ToastProvider>
                </NavigationThemeProvider>
                </PaperProvider>
              
            </AuthProvider>
          </StreakSnackbarProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
