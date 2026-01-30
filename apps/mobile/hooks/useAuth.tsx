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
import { usePushNotifications } from './usePushNotifications';
import { useStreakSnackbar } from "./useStreakSnackbar";
import { getTodayLocal, isSameLocalDate } from "@/lib/dateHelpers";

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
  const [streak, setStreak] = useState<StreakState | null>(null);
  const router = useRouter();
  const { showStreakExtended } = useStreakSnackbar();

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
        enabled: !!userElepad?.elder, // Solo si es elder
        staleTime: 0,
        gcTime: 1000 * 60, // gcTime reemplaza cacheTime en React Query v5
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
      },
    },
  );

  async function loadElepadUserById(userId: string) {
    // Solo mostrar loading si es un usuario diferente o no hay usuario cargado
    // Usamos ref para evitar problemas de stale closure en los listeners
    if (userElepadRef.current?.id !== userId) {
      setUserElepadLoading(true);
    }
    try {
      console.log("Cargando usuario de Elepad:", userId);
      const res = await getUsersId(userId);
      console.log("Datos del usuario:", res);
      const maybeStatus = (res as unknown as { status?: number }).status;
      const maybeData = (res as unknown as { data?: unknown }).data;
      if (maybeStatus === 404) {
        setUserElepad(null);
        return;
      }
      const u = (maybeData ?? (res as unknown)) as ElepadUser;

      // Fetch equipped frame
      const { data: frameData } = await supabase
        .from("user_inventory")
        .select("item:shop_items(asset_url)")
        .eq("user_id", userId)
        .eq("equipped", true)
        .single();

      if (frameData?.item) {
        // Safe cast as we know the structure from the query
        const item = frameData.item as unknown as { asset_url: string };
        u.activeFrameUrl = item.asset_url;
      }

      setUserElepad(u);
    } catch (err) {
      console.warn("loadElepadUserById error", err);
      setUserElepad(null);
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
      const hasPlayedToday = isSameLocalDate(
        streakData.lastPlayedDate || "",
        today,
      );

      setStreak({
        currentStreak: streakData.currentStreak,
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

    // Mostrar toast inmediatamente
    showStreakExtended(newStreakValue);

    // 🌐 Sincronizar con backend en background (sin await para no bloquear)
    syncStreak().catch((err) => {
      console.error("❌ Error sincronizando racha:", err);
      // Revertir en caso de error
      streakQuery.refetch();
    });
  };

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // No esperamos a que cargue el perfil para liberar el loading inicial
        // Esto permite que la UI navegue a home y muestre skeletons
        loadElepadUserById(session.user.id);
      } else {
        setUserElepad(null);
        setUserElepadLoading(false);
      }
      setLoading(false);
      hasInitialized.current = true;
      // No redirigir aquí - dejar que cada pantalla maneje su propia redirección
    };

    setData();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change:", event);
        setSession(session);
        setUser(session?.user ?? null);

        // Verificar si estamos en flujo de recuperación
        const inRecovery = segmentsRef.current.some(
          (s) => s.includes("update-password") || s.includes("forgot-password"),
        );

        if (inRecovery) {
          console.log(
            "🔒 Modo recuperación detectado, saltando carga de perfil y redirección",
          );
          setLoading(false);
          return;
        }

        if (session?.user) {
          // If this is a new sign up, wait a bit for the database to sync
          if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          await loadElepadUserById(session.user.id);
          // Solo redirigir a home si el usuario acaba de iniciar sesión explícitamente
          // Y SOLO la primera vez (no en refrescos de token o window focus)
          if (
            event === "SIGNED_IN" &&
            hasInitialized.current &&
            !hasRedirectedAfterSignIn.current
          ) {
            console.log("✅ Redirigiendo a home después de login");
            hasRedirectedAfterSignIn.current = true;
            router.replace("/(tabs)/home");
          }
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

  const signOut = async () => {
    try {
      console.log("Cerrando sesión:", user?.email);
      const { error } = await supabase.auth.signOut();
      if (error) {
        const maybeCode = (error as unknown as { code?: string }).code;
        if (maybeCode === "session_not_found") {
          setSession(null);
          setUser(null);
          setUserElepad(null);
          return;
        }
        console.warn("signOut error", error);
      }
      // Asegurar limpieza local (algunos navegadores pueden no emitir el evento)
      setSession(null);
      setUser(null);
      setUserElepad(null);
    } catch (e) {
      console.warn("signOut exception", e);
      setSession(null);
      setUser(null);
      setUserElepad(null);
    }
  };

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
