import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/shared/Toast";
import StreakCelebrationModal from "@/components/StreakCelebrationModal";

export default function StreakListener() {
  const { streak } = useAuth();
  const { showToast } = useToast();
  const previousStreakRef = useRef<number | null>(null);
  const previousHasPlayedTodayRef = useRef<boolean | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    // Si tenemos datos de racha
    if (streak) {
      // Primera carga, inicializar refs
      if (previousStreakRef.current === null) {
        previousStreakRef.current = streak.currentStreak;
        previousHasPlayedTodayRef.current = streak.hasPlayedToday;
        return;
      }

      // Detectar si ACABAMOS de jugar hoy (cambio de false a true)
      const justPlayedToday =
        !previousHasPlayedTodayRef.current && streak.hasPlayedToday;

      // Si se detecta que se jugó por primera vez en el día
      if (justPlayedToday) {
        // Delay slightly to allow game completion modals to appear first if any
        setTimeout(() => {
          setStreakCount(streak.currentStreak);
          setModalVisible(true);
        }, 800);
      }

      previousStreakRef.current = streak.currentStreak;
      previousHasPlayedTodayRef.current = streak.hasPlayedToday;
    }
  }, [streak]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
    // Mostrar toast después de cerrar el modal
    setTimeout(() => {
      showToast({
        message: `¡Racha extendida! ${streakCount} días 🔥`,
        type: "streak",
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
