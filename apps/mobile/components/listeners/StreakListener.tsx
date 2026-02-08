import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/shared/Toast";
import StreakCelebrationModal from "@/components/StreakCelebrationModal";

export default function StreakListener() {
  const { streak } = useAuth();
  const { showToast } = useToast();
  const previousStreakRef = useRef<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    // Si tenemos datos de racha
    if (streak) {
      // Primera carga, solo sincronizar ref si es nulo
      // Sin embargo, si prev es null, y current > 0, podría ser que acabamos de cargar la racha.
      // Pero no queremos mostrar toast al iniciar la app si ya tiene racha.
      // Solo queremos mostrar si CAMBIA.
      if (previousStreakRef.current === null) {
        previousStreakRef.current = streak.currentStreak;
        return;
      }

      // Si aumentó
      if (
        streak.currentStreak > previousStreakRef.current &&
        streak.currentStreak > 0
      ) {
        console.log("🔥 Racha extendida detectada:", streak.currentStreak);
        setStreakCount(streak.currentStreak);
        setModalVisible(true);
      }
      previousStreakRef.current = streak.currentStreak;
    }
  }, [streak]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    // Mostrar toast después de cerrar el modal
    setTimeout(() => {
      showToast({
        message: `¡Racha extendida! ${streakCount} días 🔥`,
        type: "success",
        duration: 3000,
      });
    }, 300);
  }, [streakCount, showToast]);

  return (
    <StreakCelebrationModal
      visible={modalVisible}
      streakCount={streakCount}
      onClose={handleClose}
    />
  );
}
