import { useRef, useEffect } from "react";
import { useTour } from "@/hooks/useTour";
import { useTourContext } from "@/components/tour/TourProvider";
import { useTourStep } from "@/hooks/useTourStep";

interface UseCalendarTourProps {
  activeTab: string;
  activitiesLoading: boolean;
}

export const useCalendarTour = ({
  activeTab,
  activitiesLoading,
}: UseCalendarTourProps) => {
  const tour = useTour({ tourId: 'calendar' });
  const { setPreparing } = useTourContext();
  const tourLayoutsRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const headerStep = useTourStep({
    tourId: 'calendar',
    stepId: 'calendar-header',
    order: 1,
    text: 'Aquí podrás ver y gestionar todos los eventos de tu familia. ¡Organízate mejor!',
  });

  const addButtonStep = useTourStep({
    tourId: 'calendar',
    stepId: 'add-button',
    order: 2,
    text: 'Toca aquí para agregar nuevos eventos, citas médicas o recordatorios importantes.',
  });

  const calendarViewStep = useTourStep({
    tourId: 'calendar',
    stepId: 'calendar-view',
    order: 3,
    text: 'Usa el calendario para navegar entre fechas y ver rápidamente qué días tienen actividades.',
  });

  const taskListStep = useTourStep({
    tourId: 'calendar',
    stepId: 'task-list',
    order: 4,
    text: 'Aquí abajo verás el detalle de tus eventos y tareas del día seleccionado. Toca uno para ver más información.',
  });

  useEffect(() => {
    if (activeTab === 'calendar') {
      const checkAndStartTour = async () => {
        if (activitiesLoading) return;
        if (tour.isActive) return;

        const completed = await tour.isTourCompleted('calendar');

        if (!completed) {
          setPreparing(true);
          setTimeout(() => {
            const steps = [
              { ...headerStep.step, ref: headerStep.ref, layout: undefined },
              { ...addButtonStep.step, ref: addButtonStep.ref, layout: undefined },
              { ...calendarViewStep.step, ref: calendarViewStep.ref, layout: undefined },
              { ...taskListStep.step, ref: taskListStep.ref, layout: undefined },
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

            setTimeout(() => measureStep(headerStep, 'calendar-header'), 50);
            setTimeout(() => measureStep(addButtonStep, 'add-button'), 100);
            setTimeout(() => measureStep(calendarViewStep, 'calendar-view'), 150);
            setTimeout(() => measureStep(taskListStep, 'task-list'), 200);

          }, 500);
        }
      };

      checkAndStartTour();
    }
  }, [activeTab, activitiesLoading, tour.isActive]);

  return {
    headerRef: headerStep.ref,
    addButtonRef: addButtonStep.ref,
    calendarViewRef: calendarViewStep.ref,
    taskListRef: taskListStep.ref,
  };
};
