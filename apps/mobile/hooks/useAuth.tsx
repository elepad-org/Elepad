import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { getUsersId } from "@elepad/api-client/src/gen/client";
import { useGetStreaksMe, GetStreaksMe200 } from "@elepad/api-client";
import { useRouter, useSegments } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { usePushNotifications } from "./usePushNotifications";

import {
  getTodayLocal,
  getYesterdayLocal,
  isSameLocalDate,
} from "@/lib/dateHelpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { clearPendingAlbums } from "@/hooks/usePendingAlbums";

type AuthContext = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userElepad: ElepadUser | null;
  userElepadLoading: boolean;
  refreshUserElepad: () => Promise<void>;
  updateUserTimezone: (timezone: string) => void;
  // Estado de racha optimista
  streak: StreakState | null;
  streakLoading: boolean;
  markGameCompleted: () => Promise<void>;
  syncStreak: () => Promise<void>;
};

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  hasPlayedToday: boolean;
};

const AuthContext = createContext<AuthContext>({} as AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userElepad, setUserElepad] = useState<ElepadUser | null>(null);
  const [userElepadLoading, setUserElepadLoading] = useState(true); // Empezar con true
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false); // Nuevo: indica si la sesión ya se intentó cargar
  const [streak, setStreak] = useState<StreakState | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Register push notifications when user is authenticated
  usePushNotifications(user?.id);
  const segments = useSegments();
  const segmentsRef = useRef(segments);

  // Mantener segments actualizados en ref
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // Ref para tracking de cambio de día
  const lastCheckedDate = useRef<string | null>(null);
  // Ref para evitar redirects múltiples
  const hasInitialized = useRef(false);
  // Ref para evitar múltiples redirects después de login
  const hasRedirectedAfterSignIn = useRef(false);

  // Ref para tener acceso al estado actual de userElepad dentro de closures (listeners)
  const userElepadRef = useRef(userElepad);

  useEffect(() => {
    userElepadRef.current = userElepad;
  }, [userElepad]);

  // Obtener la fecha local del cliente en formato YYYY-MM-DD
  const getClientDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Query para obtener racha del backend
  const streakQuery = useGetStreaksMe(
    {
      clientDate: getClientDate(),
    },
    {
      query: {
        enabled: !!userElepad?.elder && sessionReady, // Solo si es elder Y la sesión está lista
        staleTime: 0,
        gcTime: 1000 * 60, // gcTime reemplaza cacheTime en React Query v5
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
      },
    },
  );

  async function loadElepadUserById(userId: string) {
    // Solo mostrar loading si es un usuario diferente o no hay usuario cargado
    if (userElepadRef.current?.id !== userId) {
      setUserElepadLoading(true);
    }
    
    let u: ElepadUser | null = null;
    let attempts = 0;
    const maxAttempts = 15; // 15 intentos ~ 15 segundos max

    try {
      console.log("🚀 Iniciando búsqueda de perfil Elepad:", userId);

      while (attempts < maxAttempts) {
        attempts++;
        let res: unknown = null;
        let fetchError = null;

        // Intentar fetch
        try {
          // Timeout para getUsersId - si tarda más de 8 segundos, abortar
          const userPromise = getUsersId(userId);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("User fetch timeout")), 8000),
          );
          
          res = await Promise.race([userPromise, timeoutPromise]);
        } catch (err) {
          fetchError = err;
        }

        // Analizar resultado
        if (fetchError) {
           console.warn(`⚠️ Error fetching user (Intento ${attempts}/${maxAttempts}):`, fetchError);
           
           // Si el error es 401, la sesión es inválida. Forzamos signOut.
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           if ((fetchError as any).status === 401) {
              console.error("❌ Token inválido detectado (401) en loadElepadUserById. Limpiando sesión corrupta.");
              // Forzar limpieza
              await signOut();
              return null;
           }

           // Si falla la red, esperamos y reintentamos
           if (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
           }
        } else {
           // Si no hubo error de fetch, revisamos la respuesta
           // La respuesta puede venir wrappeada en { data: ... } o ser directa
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           const status = (res as any)?.status;
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           let data = (res as any)?.data;
           
           // Si res parece ser el objeto usuario directamente (tiene id), lo usamos
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           if (!data && (res as any)?.id) {
              data = res;
           }
           
           // Caso 1: Usuario encontrado
           if (data && (status === 200 || status === undefined)) {
              const tempUser = data as ElepadUser;
              
              // Verificamos si tiene groupId (esencial para la app)
              if (tempUser.groupId) {
                 u = tempUser;
                 break; // ¡ÉXITO COMPLETO!
              } else {
                 console.log(`👤 Usuario encontrado pero sin Grupo. (Intento ${attempts}/${maxAttempts}) - Esperando vinculación...`);
                 // Backoff: Si ya existe el usuario pero no el grupo, esperamos más tiempo (2s)
                 // para no saturar la red mientras se crea el grupo.
                 await new Promise((r) => setTimeout(r, 2000));
                 continue;
              }
           } 
           // Caso 2: 404 Not Found
           else if (status === 404) {
              console.log(`Running... 404 User Not Found (Intento ${attempts}/${maxAttempts})`);
           } 
           // Caso 3: Otros errores
           else {
              console.log(`⚠️ Respuesta inesperada: Status ${status}`, res);
           }
           
           // Si llegamos aquí es porque no tuvimos éxito completo (break)
           // Esperamos y reintentamos si quedan intentos
           if (attempts < maxAttempts) {
              await new Promise((r) => setTimeout(r, 1000));
              continue;
           }
        }
      }

      console.log("🏁 Fin de búsqueda de usuario. Resultado:", u ? "✅ ÉXITO" : "❌ FALLÓ");
      
      if (!u) {
        setUserElepad(null);
        return null; 
      }

      // Fetch equipped frame (Inventario)
      // Esto es secundario, no reintentamos agresivamente
      try {
        const { data } = await supabase
          .from("user_inventory")
          .select("item:shop_items(asset_url)")
          .eq("user_id", userId)
          .eq("equipped", true)
          .maybeSingle(); // Usamos maybeSingle para evitar error si no tiene marco, y try/catch por si falla la red

        if (data?.item) {
          const item = data.item as unknown as { asset_url: string };
          u.activeFrameUrl = item.asset_url;
        }
      } catch (err) {
        console.warn("⚠️ Error fetching frame:", err);
        // No fallamos toda la carga por esto
      }

      setUserElepad(u);
      return u; 
    } catch (err) {
      console.error("❌ Error fatal en loadElepadUserById:", err);
      setUserElepad(null);
      return null;
    } finally {
      setUserElepadLoading(false);
    }
  }

  // Sincronizar racha desde el backend
  const syncStreak = async () => {
    if (!userElepad?.elder) {
      setStreak(null);
      return;
    }

    await streakQuery.refetch();
  };

  // Efecto para sincronizar racha cuando cambia el usuario o llegan datos del backend
  useEffect(() => {
    if (userElepad?.elder && streakQuery.data) {
      const today = getTodayLocal();

      // Extraer datos - la respuesta puede estar envuelta en {data: ...}
      const responseData =
        "data" in streakQuery.data ? streakQuery.data.data : streakQuery.data;

      // Validar que sea del tipo correcto
      if (
        !responseData ||
        typeof responseData !== "object" ||
        "message" in responseData
      ) {
        return; // Es un error, no procesar
      }

      const streakData = responseData as GetStreaksMe200;

      // Las fechas ya vienen en formato local del cliente desde el backend
      const yesterday = getYesterdayLocal();
      const lastPlayed = streakData.lastPlayedDate || "";

      // Las fechas ya vienen en formato local del cliente desde el backend
      const hasPlayedToday = isSameLocalDate(lastPlayed, today);

      // Verificar si la racha sigue activa (se jugó hoy o ayer)
      const isStreakActive =
        hasPlayedToday || isSameLocalDate(lastPlayed, yesterday);

      // Si la racha no está activa, mostramos 0
      const effectiveCurrentStreak = isStreakActive
        ? streakData.currentStreak
        : 0;

      console.log(
        "🔥 Racha actual:",
        effectiveCurrentStreak,
        "| Última jugada:",
        lastPlayed,
        "| Activa:",
        isStreakActive,
      );

      setStreak({
        currentStreak: effectiveCurrentStreak,
        longestStreak: streakData.longestStreak,
        lastPlayedDate: streakData.lastPlayedDate,
        hasPlayedToday,
      });

      lastCheckedDate.current = today;
    } else if (!userElepad?.elder) {
      setStreak(null);
    }
  }, [userElepad, streakQuery.data]);

  // Detectar cambio de día y resetear hasPlayedToday
  useEffect(() => {
    if (!userElepad?.elder || !streak) return;

    const interval = setInterval(() => {
      const today = getTodayLocal();

      if (lastCheckedDate.current && lastCheckedDate.current !== today) {
        console.log("🗓️ Cambio de día detectado, reseteando hasPlayedToday");
        setStreak((prev) => (prev ? { ...prev, hasPlayedToday: false } : null));
        lastCheckedDate.current = today;
      }
    }, 60000); // Check cada minuto

    return () => clearInterval(interval);
  }, [userElepad, streak]);

  // Actualización optimista cuando se completa un juego
  const markGameCompleted = async () => {
    if (!userElepad?.elder || !streak) {
      console.warn("⚠️ Usuario no es elder o no tiene racha inicializada");
      return;
    }

    // Solo actualizar si NO ha jugado hoy
    if (streak.hasPlayedToday) {
      console.log("ℹ️ Ya jugó hoy, no se extiende la racha");
      return;
    }

    const today = getTodayLocal();
    const newStreakValue = streak.currentStreak + 1;

    // ✅ Actualización optimista inmediata
    console.log(
      `🔥 Actualización optimista: ${streak.currentStreak} -> ${newStreakValue}`,
    );
    setStreak({
      ...streak,
      currentStreak: newStreakValue,
      longestStreak: Math.max(newStreakValue, streak.longestStreak),
      lastPlayedDate: today,
      hasPlayedToday: true,
    });

    // 🌐 Sincronizar con backend en background (sin await para no bloquear)
    syncStreak().catch((err) => {
      console.error("❌ Error sincronizando racha:", err);
      // Revertir en caso de error
      streakQuery.refetch();
    });
  };

  useEffect(() => {
    const setData = async () => {
      try {
        console.log("🔄 Iniciando carga de sesión...");
        
        // Timeout aumentado a 30s para producción (AsyncStorage puede ser lento)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 30000)
        );
        
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]).catch((err) => {
          console.warn("⚠️ getSession timeout o error:", err);
          // En caso de timeout, intentar obtener la sesión sin timeout como fallback
          return supabase.auth.getSession().catch((fallbackErr) => {
            console.error("❌ Fallback getSession también falló:", fallbackErr);
            return { data: { session: null }, error: fallbackErr };
          });
        });
        
        const { data: { session }, error } = result;
        
        if (error) {
          console.error("❌ Error obteniendo sesión:", error);
        } else if (session) {
          console.log("✅ Sesión cargada correctamente:", session.user?.email);
        } else {
          console.log("ℹ️ No hay sesión guardada");
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setSessionReady(true); // ✅ Marcar sesión como lista (con o sin usuario)
        
        if (session?.user) {
          // No esperamos a que cargue el perfil para liberar el loading inicial
          // Esto permite que la UI navegue a home y muestre skeletons
          await loadElepadUserById(session.user.id);
        } else {
          setUserElepad(null);
          setUserElepadLoading(false);
        }
        hasInitialized.current = true;
        // No redirigir aquí - dejar que cada pantalla maneje su propia redirección
      } catch (err) {
        console.error("❌ Error inicializando sesión:", err);
        setSession(null);
        setUser(null);
        setUserElepad(null);
        setUserElepadLoading(false);
        setSessionReady(true); // ✅ Marcar como listo incluso si hay error
      } finally {
        setLoading(false);
      }
    };

    setData();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change:", event);
        setSession(session);
        setUser(session?.user ?? null);

        // Verificar si estamos en flujo de recuperación o cambio de contraseña
        const inRecovery = segmentsRef.current.some(
          (s) => s.includes("update-password") || s.includes("forgot-password"),
        );
        const inPasswordChange = segmentsRef.current.some(
          (s) => s.includes("change-password"),
        );

        if (inRecovery) {
          console.log(
            "🔒 Modo recuperación detectado, saltando carga de perfil y redirección",
          );
          setLoading(false);
          return;
        }

        // Si es USER_UPDATED y estamos en cambio de contraseña, solo actualizar session sin recargar
        if (event === "USER_UPDATED" && inPasswordChange) {
          console.log("🔑 Contraseña actualizada, manteniendo estado actual");
          setLoading(false);
          return;
        }

        if (session?.user) {
          // If this is a new sign up, wait a bit for the database to sync
          // Aumentamos el delay a 2000ms (2s) para dar tiempo a NewAccount a crear el grupo familiar
          // y evitar condiciones de carrera o saturación de red.
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            console.log("⏳ Esperando 2s antes de cargar perfil para permitir inicialización post-hilo...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          
          // Solo recargar usuario si NO es un simple USER_UPDATED
          if (event !== "USER_UPDATED") {
            // NO esperar a que termine, para no bloquear el evento (especialmente SIGNED_IN que puede venir de signUp)
            loadElepadUserById(session.user.id).then((user) => {
               // Intentar redirección AQUÍ, cuando la promesa se resuelva
                if (
                  user &&
                  (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
                  hasInitialized.current &&
                  !hasRedirectedAfterSignIn.current
                ) {
                    console.log(`✅ Redirigiendo a home después de ${event} (Usuario listo, carga asíncrona)`);
                    hasRedirectedAfterSignIn.current = true;
                    router.replace("/(tabs)/home");
                } else if (!user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
                    console.log(`⏳ Usuario no listo aún tras carga asíncrona.`);
                }
            });
          } else {
             // En caso de USER_UPDATED, solo actualizamos referencia si es necesario,
             // pero no forzamos redirect aquí típicamente. La redirección principal
             // debe ocurrir en SIGNED_IN o INITIAL_SESSION.
          }
          
          /* 
            IMPORTANTE: Eliminamos la redirección INMEDIATA que dependía del `await`.
            Ahora la redirección ocurre:
            1. En el .then() de loadElepadUserById
            2. O en el useEffect reactivo de userElepad
          */
          
        } else {
          setUserElepad(null);
          setUserElepadLoading(false);
          // Resetear flag cuando se cierra sesión
          hasRedirectedAfterSignIn.current = false;
          // Solo redirigir a login si ya se había inicializado (evitar redirect en mount inicial)
          if (hasInitialized.current && event === "SIGNED_OUT") {
            console.log("🚪 Redirigiendo a login después de logout");
            router.replace("/");
          }
        }
        setLoading(false);
      },
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Efecto de respaldo: Redirigir cuando userElepad esté listo si se quedó pendiente
  useEffect(() => {
    if (
      session?.user && 
      userElepad && 
      hasInitialized.current && 
      !hasRedirectedAfterSignIn.current
    ) {
       console.log("✅ Redirigiendo a home (Efecto reactivo: Usuario ya cargado)");
       hasRedirectedAfterSignIn.current = true;
       router.replace("/(tabs)/home");
    }
  }, [session, userElepad]);


  async function signOut() {
    try {
      console.log("Cerrando sesión:", user?.email);
      
      // Limpiar estado local primero para evitar re-renders durante el signOut
      setSession(null);
      setUser(null);
      setUserElepad(null);
      
      // Intentar signOut de Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Ignoramos sesión no encontrada
        const maybeCode = (error as unknown as { code?: string }).code;
        if (maybeCode !== "session_not_found") {
          console.warn("signOut error supabase:", error);
        }
      }
    } catch (e) {
      console.warn("signOut exception", e);
    } finally {
      // SIEMPRE forzar limpieza de storage
      try {
        await AsyncStorage.removeItem('elepad-auth-token');
        console.log("✅ Token de sesión eliminado forzosamente del storage (limpieza post-signout)");
      } catch (storageError) {
         console.error("❌ Error eliminando token del storage:", storageError);
      }
      
      setSession(null);
      setUser(null);
      setUserElepad(null);
      setStreak(null);
      // Limpiar toda la cache de React Query para que no queden datos del usuario anterior
      queryClient.clear();
      // Limpiar álbumes pendientes
      clearPendingAlbums();
      // Redirigir siempre a login
      router.replace("/");
    }
  }

  const refreshUserElepad = async () => {
    const id = user?.id;
    if (id) await loadElepadUserById(id);
  };

  const updateUserTimezone = (timezone: string) => {
    if (userElepad) {
      setUserElepad({ ...userElepad, timezone });
    }
  };

  const value = {
    session,
    user,
    loading,
    signOut,
    userElepad,
    userElepadLoading,
    refreshUserElepad,
    updateUserTimezone,
    streak,
    streakLoading: streakQuery.isLoading,
    markGameCompleted,
    syncStreak,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

// Tipado mínimo del usuario de nuestra API
export type ElepadUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  groupId?: string;
  elder: boolean;
  timezone?: string;
  activeFrameUrl?: string;
};
