import { useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTour } from "@/hooks/useTour";
import { useTourContext } from "@/components/tour/TourProvider";
import { useTourStep } from "@/hooks/useTourStep";

interface UseGamesTourProps {
  activeTab: string;
  loading: boolean;
  isElder: boolean;
}

export const useGamesTour = ({ activeTab, loading, isElder }: UseGamesTourProps) => {
  const router = useRouter();
  const tour = useTour({ tourId: 'games' });
  const { setPreparing, state: tourState } = useTourContext();
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const headerStep = useTourStep({
    tourId: 'games',
    stepId: 'games-header',
    order: 1,
    text: '¡Bienvenido a la zona de juegos! Aquí podrás divertirte y ejercitar tu mente.',
  });

  const shopStep = useTourStep({
    tourId: 'games',
    stepId: 'games-shop',
    order: 2,
    text: 'Visita la tienda para canjear tus puntos por divertidos elementos.',
  });

  const historyStep = useTourStep({
    tourId: 'games',
    stepId: 'games-history',
    order: 3,
    text: 'Revisa tu historial de partidas y progreso.',
  });

  const gamesListStep = useTourStep({
    tourId: 'games',
    stepId: 'games-list',
    order: 4,
    text: 'Elige entre una variedad de juegos diseñados para ti.',
  });

  const gameDetailsStep = useTourStep({
    tourId: 'games',
    stepId: 'game-details-memory',
    order: 5,
    text: 'Toca aquí para ver más detalles sobre este juego.',
  });

  const gamePlayStep = useTourStep({
    tourId: 'games',
    stepId: 'game-play-memory',
    order: 6,
    text: 'O toca el botón de Play para empezar a jugar directamente.',
  });

  useEffect(() => {
    if (activeTab === 'juegos') {
      const checkAndStartTour = async () => {
        if (!isElder) return; // Solo para elders
        if (loading) return;
        if (tour.isActive) return;
        if (tourState.isPreparing) return;

        const completed = await tour.isTourCompleted('games');

        if (!completed) {
          setPreparing(true);
          setTimeout(() => {

            // Forzar navegación
            router.setParams({ tab: 'juegos' });

            setTimeout(() => {

              const steps = [
                { ...headerStep.step, ref: headerStep.ref, layout: undefined },
                { ...shopStep.step, ref: shopStep.ref, layout: undefined },
                { ...historyStep.step, ref: historyStep.ref, layout: undefined },
                { ...gamesListStep.step, ref: gamesListStep.ref, layout: undefined },
                { ...gameDetailsStep.step, ref: gameDetailsStep.ref, layout: undefined },
                { ...gamePlayStep.step, ref: gamePlayStep.ref, layout: undefined },
              ];

              let measurementsComplete = 0;
              const totalMeasurements = 6;

              const checkStart = () => {
                measurementsComplete++;
                if (measurementsComplete === totalMeasurements) {
                  const finalSteps = steps.map(s => ({
                    ...s,
                    layout: tourLayoutsRef.current[s.stepId]
                  }));
                  tour.startTour(finalSteps);
                  setPreparing(false);
                }
              };

              const measureStep = (step: typeof headerStep, id: string) => {
                if (step.ref.current) {
                  step.ref.current.measureInWindow((x: number, y: number, w: number, h: number) => {
                    tourLayoutsRef.current[id] = { x, y, width: w, height: h };
                    checkStart();
                  });
                } else {
                  checkStart();
                }
              };

              setTimeout(() => measureStep(headerStep, 'games-header'), 50);
              setTimeout(() => measureStep(shopStep, 'games-shop'), 100);
              setTimeout(() => measureStep(historyStep, 'games-history'), 150);
              setTimeout(() => measureStep(gamesListStep, 'games-list'), 200);
              setTimeout(() => measureStep(gameDetailsStep, 'game-details-memory'), 250);
              setTimeout(() => measureStep(gamePlayStep, 'game-play-memory'), 300);

            }, 100);

          }, 500);
        }
      };

      checkAndStartTour();
    }
  }, [activeTab, loading, tour.isActive, tourState.isPreparing]);

  return {
    headerRef: headerStep.ref,
    shopRef: shopStep.ref,
    historyRef: historyStep.ref,
    gamesListRef: gamesListStep.ref,
    gameDetailsRef: gameDetailsStep.ref,
    gamePlayRef: gamePlayStep.ref,
  };
};
