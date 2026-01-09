import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { getUsersId } from "@elepad/api-client/src/gen/client";
import { useGetStreaksMe } from "@elepad/api-client";
import { useRouter } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useStreakSnackbar } from "./useStreakSnackbar";
import { getTodayLocal, isSameLocalDate, utcDateToLocal } from "@/utils/dateHelpers";

type AuthContext = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userElepad: ElepadUser | null;
  refreshUserElepad: () => Promise<void>;
  // Estado de racha optimista
  streak: StreakState | null;
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
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const router = useRouter();
  const { showStreakExtended } = useStreakSnackbar();
  
  // Ref para tracking de cambio de día
  const lastCheckedDate = useRef<string | null>(null);
  
  // Query para obtener racha del backend
  const streakQuery = useGetStreaksMe({
    query: {
      enabled: !!userElepad?.elder, // Solo si es elder
      staleTime: 0,
      gcTime: 1000 * 60, // gcTime reemplaza cacheTime en React Query v5
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
    },
  });

  async function loadElepadUserById(userId: string) {
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
      setUserElepad(u);
    } catch (err) {
      console.warn("loadElepadUserById error", err);
      setUserElepad(null);
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
      const streakData = 'data' in streakQuery.data ? streakQuery.data.data : streakQuery.data;
      
      // Convertir lastPlayedDate de UTC a local antes de comparar
      const lastPlayedDateLocal = streakData.lastPlayedDate 
        ? utcDateToLocal(streakData.lastPlayedDate)
        : null;
      
      const hasPlayedToday = isSameLocalDate(lastPlayedDateLocal || '', today);
      
      setStreak({
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        lastPlayedDate: lastPlayedDateLocal,
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
        setStreak(prev => prev ? { ...prev, hasPlayedToday: false } : null);
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
    console.log(`🔥 Actualización optimista: ${streak.currentStreak} -> ${newStreakValue}`);
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
    syncStreak().catch(err => {
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
        await loadElepadUserById(session.user.id);
      } else {
        setUserElepad(null);
      }
      setLoading(false);
      if (session) router.replace("/home");
    };

    setData();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // If this is a new sign up, wait a bit for the database to sync
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          await loadElepadUserById(session.user.id);
          router.replace("/home");
        } else {
          setUserElepad(null);
          router.replace("/");
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

  const value = {
    session,
    user,
    loading,
    signOut,
    userElepad,
    refreshUserElepad,
    streak,
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
};
