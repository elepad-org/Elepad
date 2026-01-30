import { useCallback } from 'react';
import { useTourContext } from '@/components/tour/TourProvider';
import { TourStepPosition } from '@/types/tour';

interface UseTourOptions {
  tourId: string;
  autoStart?: boolean;
  onComplete?: () => void;
}

export const useTour = (options?: UseTourOptions) => {
  const context = useTourContext();

  const startTourWithSteps = useCallback(
    async (steps: TourStepPosition[]) => {
      if (!options?.tourId) {
        console.warn('No tourId provided to useTour');
        return;
      }

      await context.startTour(options.tourId, steps);
    },
    [options?.tourId, context]
  );

  const reset = useCallback(async () => {
    if (!options?.tourId) return;
    await context.resetAllTours();
  }, [options?.tourId, context]);

  return {
    // State
    isActive: context.state.isActive && context.state.currentTourId === options?.tourId,
    currentStep: context.state.steps[context.state.currentStepIndex],
    currentStepIndex: context.state.currentStepIndex,
    totalSteps: context.state.steps.length,
    isFirstStep: context.state.currentStepIndex === 0,
    isLastStep: context.state.currentStepIndex === context.state.steps.length - 1,

    // Actions
    startTour: startTourWithSteps,
    nextStep: context.nextStep,
    prevStep: context.prevStep,
    stopTour: context.stopTour,
    resetAllTours: context.resetAllTours,
    isTourCompleted: context.isTourCompleted,
    reset,
  };
};
