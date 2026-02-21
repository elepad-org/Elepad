import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * useActivitiesRealtime
 *
 * Suscribe a la tabla `activities` de Supabase vía WebSocket (Realtime).
 * Solo se conecta cuando `enabled` es true (ej: cuando el tab está activo).
 * Como fallback, también refetch al volver la app a foreground.
 *
 * Requisito en Supabase: ejecutar una vez:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE activities;
 * O activar el toggle en Dashboard → Database → Replication → activities.
 */
export function useActivitiesRealtime(
  queryKey: readonly unknown[],
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const keyStr = JSON.stringify(queryKey);

  // ─ Refetch al entrar al tab ──────────────────────────────────────────────
  // Cuando el usuario vuelve al tab (enabled pasa a true), refrescar
  // inmediatamente para capturar cambios que ocurrieron mientras estaba
  // en otro tab y el canal WebSocket aún no estaba conectado.
  useEffect(() => {
    if (enabled && queryKey.length) {
      queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
    }
  }, [enabled, keyStr, queryClient]);

  // ─ WebSocket Realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !queryKey.length) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channelName = `activities-realtime-${String(queryKey[0])}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Obtener sesión y pasar el JWT al sistema Realtime para que la
    // evaluación de RLS funcione correctamente.
    const bootstrap = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.warn("📡 Realtime: sin sesión auth, no se puede conectar");
        return;
      }

      supabase.realtime.setAuth(sessionData.session.access_token);

      channelRef.current = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities" },
          () => {
            queryClient.invalidateQueries({
              queryKey: queryKey as unknown[],
            });
          },
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log("📡 Realtime activities: conectado");
          } else if (status === "CHANNEL_ERROR") {
            console.error("📡 Realtime activities: error de canal", err);
          } else if (status === "TIMED_OUT") {
            console.warn("📡 Realtime activities: timeout");
          }
        });
    };

    bootstrap();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        console.log("📡 Realtime activities: desconectado");
      }
    };
  }, [enabled, keyStr, queryClient]);

  // ─ Fallback: refetch al volver a foreground ────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        queryClient.invalidateQueries({ queryKey: queryKey as unknown[] });
      }
    });

    return () => sub.remove();
  }, [enabled, keyStr, queryClient]);
}
