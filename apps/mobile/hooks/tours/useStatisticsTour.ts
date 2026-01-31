import { useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTour } from "@/hooks/useTour";
import { useTourContext } from "@/components/tour/TourProvider";
import { useTourStep } from "@/hooks/useTourStep";

interface UseStatisticsTourProps {
  activeTab: string;
  loading: boolean;
  isHelper: boolean;
}

export const useStatisticsTour = ({ activeTab, loading, isHelper }: UseStatisticsTourProps) => {
  const router = useRouter();
  const tour = useTour({ tourId: 'statistics' });
  const { setPreparing, state: tourState } = useTourContext();
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const headerStep = useTourStep({
    tourId: 'statistics',
    stepId: 'stats-header',
    order: 1,
    text: 'Bienvenido al panel de estadísticas. Aquí podrás ver el progreso y actividad detallada.',
  });

  const filtersStep = useTourStep({
    tourId: 'statistics',
    stepId: 'stats-filters',
    order: 2,
    text: 'Utiliza estos filtros para seleccionar el adulto mayor y el tipo de juego que deseas analizar.',
  });

  const chartStep = useTourStep({
    tourId: 'statistics',
    stepId: 'stats-chart',
    order: 3,
    text: 'Este gráfico muestra la evolución del rendimiento. Puedes cambiar la vista por semana, mes o año.',
  });

  const summaryStep = useTourStep({
    tourId: 'statistics',
    stepId: 'stats-summary',
    order: 4,
    text: 'Aquí tienes un resumen rápido con el total de partidas, mejor puntaje y tasa de éxito.',
    side: 'top',
  });

  const historyStep = useTourStep({
    tourId: 'statistics',
    stepId: 'stats-history',
    order: 5,
    text: 'En esta sección aparecerán listadas las últimas partidas jugadas.',
  });

  useEffect(() => {
    // Only run for helpers in the juegos tab (which shows stats)
    if (activeTab === 'juegos' && isHelper) {
      const checkAndStartTour = async () => {
        if (loading) return;
        if (tour.isActive) return;
        if (tourState.isPreparing) return;

        const completed = await tour.isTourCompleted('statistics');

        if (!completed) {
          setPreparing(true);
          setTimeout(() => {

            // Forzar navegación al tab de juegos (que renderiza Stats para helpers)
            router.setParams({ tab: 'juegos' });

            setTimeout(() => {

              const steps = [
                { ...headerStep.step, ref: headerStep.ref, layout: undefined },
                { ...filtersStep.step, ref: filtersStep.ref, layout: undefined },
                { ...chartStep.step, ref: chartStep.ref, layout: undefined },
                { ...summaryStep.step, ref: summaryStep.ref, layout: undefined },
                { ...historyStep.step, ref: historyStep.ref, layout: undefined },
              ];

              let measurementsComplete = 0;
              const totalMeasurements = 5;

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
                  // If ref is missing (e.g. no history items), we still want to continue
                  // Special casing for history if valid fallback is needed, but for now just proceed
                  checkStart();
                }
              };

              setTimeout(() => measureStep(headerStep, 'stats-header'), 50);
              setTimeout(() => measureStep(filtersStep, 'stats-filters'), 100);
              setTimeout(() => measureStep(chartStep, 'stats-chart'), 150);
              setTimeout(() => measureStep(summaryStep, 'stats-summary'), 200);
              setTimeout(() => measureStep(historyStep, 'stats-history'), 250);

            }, 100);

          }, 500);
        }
      };

      checkAndStartTour();
    }
  }, [activeTab, loading, isHelper, tour.isActive, tourState.isPreparing]);

  return {
    headerRef: headerStep.ref,
    filtersRef: filtersStep.ref,
    chartRef: chartStep.ref,
    summaryRef: summaryStep.ref,
    historyRef: historyStep.ref,
  };
};
