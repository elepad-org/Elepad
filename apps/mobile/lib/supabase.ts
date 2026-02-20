import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
}

// Storage adapter que funciona en web y mobile con mejor manejo de errores
const storageAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        // Verificar si localStorage está disponible (no en SSR)
        if (typeof window !== "undefined" && window.localStorage) {
          const value = localStorage.getItem(key);
          console.log(`📦 Storage.getItem (web) [${key}]:`, value ? "✅ found" : "❌ not found");
          return value;
        }
        return null;
      }
      const value = await AsyncStorage.getItem(key);
      console.log(`📦 Storage.getItem (native) [${key}]:`, value ? "✅ found" : "❌ not found");
      return value;
    } catch (error) {
      console.error(`❌ Error en Storage.getItem [${key}]:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(key, value);
          console.log(`💾 Storage.setItem (web) [${key}]: ✅`);
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
      console.log(`💾 Storage.setItem (native) [${key}]: ✅`);
    } catch (error) {
      console.error(`❌ Error en Storage.setItem [${key}]:`, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem(key);
          console.log(`🗑️ Storage.removeItem (web) [${key}]: ✅`);
        }
        return;
      }
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Storage.removeItem (native) [${key}]: ✅`);
    } catch (error) {
      console.error(`❌ Error en Storage.removeItem [${key}]:`, error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Configuración adicional para mejorar el comportamiento en producción
    //storageKey: 'elepad-auth-token',
    //flowType: 'pkce',
  },
});
