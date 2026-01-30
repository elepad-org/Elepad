import { useRef, useCallback } from 'react';
import { View } from 'react-native';
import { useTourContext } from '@/components/tour/TourProvider';
import { TourStep } from '@/types/tour';

export const useTourStep = (step: TourStep) => {
  const ref = useRef<View>(null);
  const context = useTourContext();

  // Expose a manual measure function instead of auto-measuring
  const measure = useCallback(() => {
    if (ref.current) {
      ref.current.measureInWindow(
        (x: number, y: number, width: number, height: number) => {
          console.log(`🎯 TourStep: Measured ${step.stepId}:`, { x, y, width, height });
          context.updateStepLayout(step.stepId, { x, y, width, height });
        }
      );
    }
  }, [step.stepId, context]);

  return { ref, measure, step };
};
