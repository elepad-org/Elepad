import { useRef, useEffect } from "react";
import { useTour } from "@/hooks/useTour";
import { useTourStep } from "@/hooks/useTourStep";
import { ElepadUser } from "@/hooks/useAuth";

interface UseHomeTourProps {
  userElepad: ElepadUser | null;
  userElepadLoading: boolean;
  activitiesLoading: boolean;
  attemptsLoading: boolean;
  memoriesLoading: boolean;
}

export const useHomeTour = ({
  userElepad,
  userElepadLoading,
  activitiesLoading,
  attemptsLoading,
  memoriesLoading,
}: UseHomeTourProps) => {
  const tour = useTour({ tourId: 'home' });
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const greetingStep = useTourStep({
    tourId: 'home',
    stepId: 'greeting',
    order: 1,
    text: 'Aquí puedes ver tu nombre de usuario y tu rol en la familia. ¡Bienvenido!',
  });

  const streakStep = useTourStep({
    tourId: 'home',
    stepId: 'streak-counter',
    order: 2,
    text: '¡Este es tu contador de racha! Juega al menos una vez al día para mantener tu racha activa y ganar puntos extra.',
  });

  const activityStep = useTourStep({
    tourId: 'home',
    stepId: 'recent-activity',
    order: 3,
    text: userElepad?.elder
      ? 'Aquí puedes ver tu último juego completado con tu puntaje. ¡Toca para ver más detalles!'
      : 'Aquí verás la actividad reciente de los adultos mayores en tu grupo familiar.',
  });

  useEffect(() => {
    const startHomeTour = async () => {
      if (!userElepadLoading && userElepad && !tour.isActive) {
        const dataLoaded = !activitiesLoading && !attemptsLoading && !memoriesLoading;

        if (dataLoaded) {
          const completed = await tour.isTourCompleted('home');

          if (!completed) {
            console.log('🏠 Home: Data loaded, waiting for UI to settle...');

            setTimeout(() => {
              console.log('🏠 Home: Measuring elements...');

              let measurementsComplete = 0;
              const totalMeasurements = 3;

              const checkAndStart = () => {
                measurementsComplete++;
                if (measurementsComplete === totalMeasurements) {
                  const steps = [
                    { ...greetingStep.step, ref: greetingStep.ref, layout: tourLayoutsRef.current['greeting'] },
                    { ...streakStep.step, ref: streakStep.ref, layout: tourLayoutsRef.current['streak-counter'] },
                    { ...activityStep.step, ref: activityStep.ref, layout: tourLayoutsRef.current['recent-activity'] },
                  ];
                  tour.startTour(steps);
                }
              };



              // We need to use setTimeout as in the original code to stagger or just wait a bit? 
              // The original used 50ms gaps. Let's replicate that for safety.
              setTimeout(() => {
                if (greetingStep.ref.current) {
                  greetingStep.ref.current.measureInWindow((x, y, w, h) => {
                    tourLayoutsRef.current['greeting'] = { x, y, width: w, height: h };
                    checkAndStart();
                  });
                } else checkAndStart();
              }, 50);

              setTimeout(() => {
                if (streakStep.ref.current) {
                  streakStep.ref.current.measureInWindow((x, y, w, h) => {
                    tourLayoutsRef.current['streak-counter'] = { x, y, width: w, height: h };
                    checkAndStart();
                  });
                } else checkAndStart();
              }, 100);

              setTimeout(() => {
                if (activityStep.ref.current) {
                  activityStep.ref.current.measureInWindow((x, y, w, h) => {
                    tourLayoutsRef.current['recent-activity'] = { x, y, width: w, height: h };
                    checkAndStart();
                  });
                } else checkAndStart();
              }, 150);

            }, 2000);
          }
        }
      }
    };

    startHomeTour();
  }, [userElepadLoading, userElepad, activitiesLoading, attemptsLoading, memoriesLoading, tour.isActive]);

  return {
    greetingRef: greetingStep.ref,
    streakRef: streakStep.ref,
    activityRef: activityStep.ref,
  };
};
