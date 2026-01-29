import { useRef, useEffect } from "react";
import { useTour } from "@/hooks/useTour";
import { useTourStep } from "@/hooks/useTourStep";

interface UseGamesTourProps {
  activeTab: string;
  loading: boolean;
}

export const useGamesTour = ({ activeTab, loading }: UseGamesTourProps) => {
  const tour = useTour({ tourId: 'games' });
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const headerStep = useTourStep({
    tourId: 'games',
    stepId: 'games-header',
    order: 1,
    text: '¡Bienvenido a la zona de juegos! Aquí podrás divertirte y ejercitar tu mente.',
  });

  const actionsStep = useTourStep({
    tourId: 'games',
    stepId: 'games-actions',
    order: 2,
    text: 'Visita la tienda para canjear tus puntos o revisa tu historial de partidas.',
  });

  const gamesListStep = useTourStep({
    tourId: 'games',
    stepId: 'games-list',
    order: 3,
    text: 'Elige entre una variedad de juegos diseñados para ti. ¡Toca uno para empezar!',
  });

  useEffect(() => {
    if (activeTab === 'juegos') {
      const checkAndStartTour = async () => {
        if (loading) return;
        if (tour.isActive) return;

        const completed = await tour.isTourCompleted('games');

        if (!completed) {
          setTimeout(() => {
            const steps = [
              { ...headerStep.step, ref: headerStep.ref, layout: undefined },
              { ...actionsStep.step, ref: actionsStep.ref, layout: undefined },
              { ...gamesListStep.step, ref: gamesListStep.ref, layout: undefined },
            ];

            let measurementsComplete = 0;
            const totalMeasurements = 3;

            const checkStart = () => {
              measurementsComplete++;
              if (measurementsComplete === totalMeasurements) {
                const finalSteps = steps.map(s => ({
                  ...s,
                  layout: tourLayoutsRef.current[s.stepId]
                }));
                tour.startTour(finalSteps);
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
            setTimeout(() => measureStep(actionsStep, 'games-actions'), 100);
            setTimeout(() => measureStep(gamesListStep, 'games-list'), 150);

          }, 1000);
        }
      };

      checkAndStartTour();
    }
  }, [activeTab, loading, tour.isActive]);

  return {
    headerRef: headerStep.ref,
    actionsRef: actionsStep.ref,
    gamesListRef: gamesListStep.ref,
  };
};
