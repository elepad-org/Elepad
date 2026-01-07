import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { getUsersId } from "@elepad/api-client/src/gen/client";
import { useRouter } from "expo-router";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContext = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  userElepad: ElepadUser | null;
  refreshUserElepad: () => Promise<void>;
};

const AuthContext = createContext<AuthContext>({} as AuthContext);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userElepad, setUserElepad] = useState<ElepadUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
};
