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
  const isInitializingRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const greetingStep = useTourStep({
    tourId: 'home',
    stepId: 'greeting',
    order: 1,
    text: 'Aquí puedes ver tu nombre de usuario y tu rol en la familia. ¡Bienvenido!',
  });

  const notificationStep = useTourStep({
    tourId: 'home',
    stepId: 'notifications',
    order: 2,
    text: 'Recibe notificaciones importantes sobre la actividad familiar aquí.',
  });

  const profileStep = useTourStep({
    tourId: 'home',
    stepId: 'profile',
    order: 3,
    text: 'Toca aquí para ver tu perfil y configuración.',
  });

  const streakStep = useTourStep({
    tourId: 'home',
    stepId: 'streak-counter',
    order: 4,
    text: '¡Este es tu contador de racha! Juega al menos una vez al día para mantener tu racha activa y ganar puntos extra.',
  });

  const eventsStep = useTourStep({
    tourId: 'home',
    stepId: 'events',
    order: 5,
    text: 'Consulta aquí tus próximos eventos y la agenda familiar.',
  });

  const activityStep = useTourStep({
    tourId: 'home',
    stepId: 'recent-activity',
    order: 6,
    text: userElepad?.elder
      ? 'Aquí puedes ver tu último juego completado con tu puntaje. ¡Toca para ver más detalles!'
      : 'Aquí verás la actividad reciente de los adultos mayores en tu grupo familiar.',
  });

  const lastMemoryStep = useTourStep({
    tourId: 'home',
    stepId: 'last-memory',
    order: 7,
    text: 'Tu recuerdo más reciente aparecerá aquí. ¡Revive tus momentos favoritos!',
  });

  useEffect(() => {
    const startHomeTour = async () => {
      // Prevenir ejecuciones múltiples de forma más estricta
      if (isInitializingRef.current || tourState.isPreparing || tour.isActive) {
        console.log('🏠 Home: Tour initialization already in progress or active, skipping...');
        return;
      }

      if (!userElepadLoading && userElepad) {
        const dataLoaded = !activitiesLoading && !attemptsLoading && !memoriesLoading;

        if (dataLoaded) {
          const completed = await tour.isTourCompleted('home');

          if (!completed) {
            console.log('🏠 Home: Data loaded, waiting for UI to settle...');

            // Marcar que estamos iniciando
            isInitializingRef.current = true;
            
            // Limpiar layouts anteriores
            tourLayoutsRef.current = {};
            
            // Bloquear interacciones mientras se prepara
            setPreparing(true);

            // Timeout de seguridad: Si después de 5 segundos no se completó, desbloquear
            const safetyTimer = setTimeout(() => {
              console.warn('🏠 Home: Tour initialization timeout, unlocking UI');
              // Limpiar todos los timers pendientes
              timersRef.current.forEach(timer => clearTimeout(timer));
              timersRef.current = [];
              setPreparing(false);
              isInitializingRef.current = false;
            }, 5000);
            timersRef.current.push(safetyTimer);

            const timer1 = setTimeout(() => {
              console.log('🏠 Home: Measuring elements...');

              // Forzar navegación al home por si el usuario cambió de tab
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              router.navigate({ pathname: '/(tabs)', params: { tab: 'home' } });

              // Aumentar el tiempo de espera para asegurar que el layout se estabilizó
              // Especialmente importante si hubo navegación o cambios de estado
              const timer2 = setTimeout(() => {

                // Determine which steps are active based on role
                // Updated order: Greeting -> Notifications -> Profile -> Streak -> Events -> Activity -> Last Memory
                const stepsToMeasure = [
                  greetingStep,
                  notificationStep,
                  profileStep,
                  ...(userElepad.elder ? [streakStep] : []),
                  eventsStep,
                  activityStep,
                  lastMemoryStep
                ];

                let measurementsComplete = 0;
                const totalMeasurements = stepsToMeasure.length;
                const completedSteps = new Set<string>();

                const checkAndStart = (stepId: string) => {
                  // Evitar conteos duplicados
                  if (completedSteps.has(stepId)) {
                    console.log(`🏠 Home: Step ${stepId} already counted, skipping`);
                    return;
                  }
                  
                  completedSteps.add(stepId);
                  measurementsComplete++;
                  console.log(`🏠 Home: Measurement ${measurementsComplete}/${totalMeasurements} complete`);
                  
                  if (measurementsComplete === totalMeasurements) {
                    try {
                      // Limpiar el timer de seguridad
                      clearTimeout(safetyTimer);
                      
                      const finalSteps = stepsToMeasure.map(s => {
                        const layout = tourLayoutsRef.current[s.step.stepId];
                        console.log(`🏠 Home: Layout for ${s.step.stepId}:`, layout);
                        return {
                          ...s.step,
                          ref: s.ref,
                          layout: layout
                        };
                      });
                      
                      // Validar que todos los layouts son válidos
                      const invalidLayouts = finalSteps.filter(s => !s.layout || s.layout.width === 0 || s.layout.height === 0);
                      if (invalidLayouts.length > 0) {
                        console.error('🏠 Home: Invalid layouts detected:', invalidLayouts.map(s => s.stepId));
                        console.warn('🏠 Home: Aborting tour start due to invalid layouts');
                        // No lanzar error, solo abortar silenciosamente
                        setPreparing(false);
                        isInitializingRef.current = false;
                        return;
                      }
                      
                      console.log('🏠 Home: Starting tour with', finalSteps.length, 'valid steps');
                      tour.startTour(finalSteps);
                      
                      // Dar tiempo al TourOverlay para prepararse antes de desbloquear
                      const unlockTimer = setTimeout(() => {
                        console.log('🏠 Home: Tour ready, unlocking UI');
                        setPreparing(false);
                        isInitializingRef.current = false;
                      }, 300);
                      timersRef.current.push(unlockTimer);
                      
                    } catch (error) {
                      console.error('🏠 Home: Error starting tour:', error);
                      // En caso de error, desbloquear inmediatamente
                      setPreparing(false);
                      isInitializingRef.current = false;
                    }
                  }
                };

                const measureStep = (step: typeof greetingStep, delay: number) => {
                  const timer = setTimeout(() => {
                    if (step.ref.current) {
                      step.ref.current.measureInWindow((x, y, w, h) => {
                        console.log(`🏠 Home: Measured ${step.step.stepId}: x=${x}, y=${y}, w=${w}, h=${h}`);
                        
                        // Validación más estricta: dimensiones deben ser > 0 y posición y razonable
                        // A veces en Android y puede ser negativo si está fuera de pantalla arriba, o muy pequeño
                        // Si y es muy pequeño (< -50) probablemente está fuera de pantalla
                        const isValid = w > 0 && h > 0 && y > -50;

                        if (!isValid) {
                          console.warn(`🏠 Home: Invalid/Suspicious dimensions for ${step.step.stepId}, retrying...`);
                          const retryTimer = setTimeout(() => {
                            if (step.ref.current) {
                              step.ref.current.measureInWindow((x2, y2, w2, h2) => {
                                console.log(`🏠 Home: Retry measured ${step.step.stepId}: x=${x2}, y=${y2}, w=${w2}, h=${h2}`);
                                // Solo guardar y continuar si las dimensiones son válidas
                                if (w2 > 0 && h2 > 0) {
                                  tourLayoutsRef.current[step.step.stepId] = { x: x2, y: y2, width: w2, height: h2 };
                                  checkAndStart(step.step.stepId);
                                } else {
                                  console.error(`🏠 Home: Failed to measure ${step.step.stepId} after retry`);
                                  // Marcar como completado pero con error para no bloquear
                                  checkAndStart(step.step.stepId);
                                }
                              });
                            } else {
                              console.error(`🏠 Home: Ref lost for ${step.step.stepId} during retry`);
                              checkAndStart(step.step.stepId);
                            }
                          }, 500); // Dar más tiempo en el retry (500ms vs 200ms)
                          timersRef.current.push(retryTimer);
                        } else {
                          tourLayoutsRef.current[step.step.stepId] = { x, y, width: w, height: h };
                          checkAndStart(step.step.stepId);
                        }
                      });
                    } else {
                      // If ref is missing, just proceed so we don't hang
                      console.warn('🏠 Home: Ref missing for step:', step.step.stepId);
                      checkAndStart(step.step.stepId);
                    }
                  }, delay);
                  timersRef.current.push(timer);
                };

                // Measure sequentially with delays
                stepsToMeasure.forEach((step, index) => {
                  measureStep(step, 100 * (index + 1)); // Increased delay between measurements
                });

              }, 800); // Increased wait time after navigation (100ms -> 800ms)
              timersRef.current.push(timer2);

            }, 500);
            timersRef.current.push(timer1);
          }
        }
      }
    };

    startHomeTour();

    // Cleanup: limpiar todos los timers cuando el efecto se desmonte o se vuelva a ejecutar
    return () => {
      console.log('🏠 Home: Effect cleanup triggered');
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
      // Si el componente se desmonta mientras está inicializando, desbloquear
      if (isInitializingRef.current) {
        console.log('🏠 Home: Cleaning up, unlocking UI');
        setPreparing(false);
        isInitializingRef.current = false;
      }
    };
  }, [userElepadLoading, userElepad, activitiesLoading, attemptsLoading, memoriesLoading, setPreparing]);

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
