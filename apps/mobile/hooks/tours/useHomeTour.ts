import { useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTour } from "@/hooks/useTour";
import { useTourContext } from "@/components/tour/TourProvider";
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
  const router = useRouter();
  const tour = useTour({ tourId: 'home' });
  const { setPreparing, state: tourState } = useTourContext();
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const greetingStep = useTourStep({
    tourId: 'home',
    stepId: 'greeting',
    order: 1,
    text: 'Aquí puedes ver tu nombre de usuario y tu rol en la familia. ¡Bienvenido!',
  });

  const profileStep = useTourStep({
    tourId: 'home',
    stepId: 'profile',
    order: 2,
    text: 'Toca aquí para ver tu perfil y configuración.',
  });

  const notificationStep = useTourStep({
    tourId: 'home',
    stepId: 'notifications',
    order: 3,
    text: 'Recibe notificaciones importantes sobre la actividad familiar aquí.',
  });

  const lastMemoryStep = useTourStep({
    tourId: 'home',
    stepId: 'last-memory',
    order: 4,
    text: 'Tu recuerdo más reciente aparecerá aquí. ¡Revive tus momentos favoritos!',
  });

  const streakStep = useTourStep({
    tourId: 'home',
    stepId: 'streak-counter',
    order: 5,
    text: '¡Este es tu contador de racha! Juega al menos una vez al día para mantener tu racha activa y ganar puntos extra.',
  });

  const eventsStep = useTourStep({
    tourId: 'home',
    stepId: 'events',
    order: 6,
    text: 'Consulta aquí tus próximos eventos y la agenda familiar.',
  });

  const activityStep = useTourStep({
    tourId: 'home',
    stepId: 'recent-activity',
    order: 7,
    text: userElepad?.elder
      ? 'Aquí puedes ver tu último juego completado con tu puntaje. ¡Toca para ver más detalles!'
      : 'Aquí verás la actividad reciente de los adultos mayores en tu grupo familiar.',
  });

  useEffect(() => {
    const startHomeTour = async () => {
      if (!userElepadLoading && userElepad && !tour.isActive && !tourState.isPreparing) {
        const dataLoaded = !activitiesLoading && !attemptsLoading && !memoriesLoading;

        if (dataLoaded) {
          const completed = await tour.isTourCompleted('home');

          if (!completed) {
            console.log('🏠 Home: Data loaded, waiting for UI to settle...');

            // Bloquear interacciones mientras se prepara
            setPreparing(true);

            setTimeout(() => {
              console.log('🏠 Home: Measuring elements...');

              // Forzar navegación al home por si el usuario cambió de tab
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              router.navigate({ pathname: '/(tabs)', params: { tab: 'home' } });

              // Esperar un frame/tiempo extra para asegurar que el layout se actualizó tras la navegación
              setTimeout(() => {

                // Determine which steps are active based on role
                const stepsToMeasure = [
                  greetingStep,
                  profileStep,
                  notificationStep,
                  lastMemoryStep,
                  ...(userElepad.elder ? [streakStep] : []),
                  eventsStep,
                  activityStep
                ];

                let measurementsComplete = 0;
                const totalMeasurements = stepsToMeasure.length;

                const checkAndStart = () => {
                  measurementsComplete++;
                  if (measurementsComplete === totalMeasurements) {
                    const finalSteps = stepsToMeasure.map(s => ({
                      ...s.step,
                      ref: s.ref,
                      layout: tourLayoutsRef.current[s.step.stepId]
                    }));
                    tour.startTour(finalSteps);
                    // Desbloquear interacciones una vez iniciado
                    setPreparing(false);
                  }
                };

                const measureStep = (step: typeof greetingStep, delay: number) => {
                  setTimeout(() => {
                    if (step.ref.current) {
                      step.ref.current.measureInWindow((x, y, w, h) => {
                        tourLayoutsRef.current[step.step.stepId] = { x, y, width: w, height: h };
                        checkAndStart();
                      });
                    } else {
                      // If ref is missing, just proceed so we don't hang
                      checkAndStart();
                    }
                  }, delay);
                };

                // Measure sequentially with delays
                stepsToMeasure.forEach((step, index) => {
                  measureStep(step, 50 * (index + 1));
                });

              }, 100); // Pequeña espera tras forzar navegación

            }, 500);
          }
        }
      }
    };

    startHomeTour();
  }, [userElepadLoading, userElepad, activitiesLoading, attemptsLoading, memoriesLoading]);

  return {
    greetingRef: greetingStep.ref,
    profileRef: profileStep.ref,
    notificationRef: notificationStep.ref,
    lastMemoryRef: lastMemoryStep.ref,
    streakRef: streakStep.ref,
    eventsRef: eventsStep.ref,
    activityRef: activityStep.ref,
  };
};
