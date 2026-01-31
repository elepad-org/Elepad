import { useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTour } from "@/hooks/useTour";
import { useTourContext } from "@/components/tour/TourProvider";
import { useTourStep } from "@/hooks/useTourStep";
import { MemoriesBook } from "@elepad/api-client";

interface UseRecuerdosTourProps {
  activeTab: string;
  authLoading: boolean;
  selectedBook: MemoriesBook | null;
}

export const useRecuerdosTour = ({ activeTab, authLoading, selectedBook }: UseRecuerdosTourProps) => {
  const router = useRouter();
  const tour = useTour({ tourId: 'memories' });
  const { setPreparing, state: tourState } = useTourContext();
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const headerStep = useTourStep({
    tourId: 'memories',
    stepId: 'memories-header',
    order: 1,
    text: 'Aquí guardarás tus tesoros más preciados: fotos, videos y relatos de tu vida.',
  });

  const addButtonStep = useTourStep({
    tourId: 'memories',
    stepId: 'memories-add',
    order: 2,
    text: 'Crea un nuevo "Baúl" para organizar tus recuerdos por temas, como "Viajes" o "Cumpleaños".',
  });

  const listStep = useTourStep({
    tourId: 'memories',
    stepId: 'memories-list',
    order: 3,
    text: 'Tus baúles aparecerán aquí. ¡Entra en uno para empezar a guardar recuerdos!',
  });

  const albumStep = useTourStep({
    tourId: 'memories',
    stepId: 'memories-album',
    order: 4,
    text: 'Descubre historias mágicas creadas por IA con tus fotos y recuerdos favoritos.',
  });

  useEffect(() => {
    // Only verify if we are in the memories tab
    if (activeTab !== 'recuerdos') return;

    // Wait for books/auth to load
    if (authLoading) return;

    // Check if tour should run
    if (tour.isActive) return;
    if (tourState.isPreparing) return;

    // Don't start if a book is selected (navigation depth)
    if (selectedBook) return;

    const checkAndStartTour = async () => {
      const completed = await tour.isTourCompleted('memories');
      if (!completed) {
        // Wait for UI to render
        setPreparing(true);
        setTimeout(() => {

          // Forzar navegación
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          router.navigate({ pathname: '/(tabs)', params: { tab: 'recuerdos' } });

          setTimeout(() => {

            const steps = [
              { ...headerStep.step, ref: headerStep.ref, layout: undefined },
              { ...addButtonStep.step, ref: addButtonStep.ref, layout: undefined },
              { ...listStep.step, ref: listStep.ref, layout: undefined },
              { ...albumStep.step, ref: albumStep.ref, layout: undefined },
            ];

            let measurementsComplete = 0;
            const totalMeasurements = 4;

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

            // Staggered measurement to ensure layout stability
            setTimeout(() => measureStep(headerStep, 'memories-header'), 100);
            setTimeout(() => measureStep(addButtonStep, 'memories-add'), 200);
            setTimeout(() => measureStep(listStep, 'memories-list'), 300);
            setTimeout(() => measureStep(albumStep, 'memories-album'), 400);

          }, 100);

        }, 500);
      }
    };

    checkAndStartTour();
  }, [activeTab, tour.isActive, authLoading, selectedBook, tourState.isPreparing]);

  return {
    headerRef: headerStep.ref,
    addButtonRef: addButtonStep.ref,
    listRef: listStep.ref,
    albumRef: albumStep.ref,
  };
};
