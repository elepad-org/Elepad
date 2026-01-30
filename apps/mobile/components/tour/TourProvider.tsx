import React, { createContext, useContext, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TourState, TourAction, TourStepPosition } from '@/types/tour';

const TOUR_STORAGE_PREFIX = '@elepad_tour_completed_';

interface TourContextValue {
  state: TourState;
  startTour: (tourId: string, steps: TourStepPosition[]) => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  stopTour: () => void;
  updateStepLayout: (stepId: string, layout: TourStepPosition['layout']) => void;
  markTourComplete: (tourId: string) => Promise<void>;
  isTourCompleted: (tourId: string) => Promise<boolean>;
  resetAllTours: () => Promise<void>;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const initialState: TourState = {
  isActive: false,
  currentTourId: null,
  currentStepIndex: 0,
  steps: [],
};

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'START_TOUR':
      return {
        ...state,
        isActive: true,
        currentTourId: action.tourId,
        currentStepIndex: 0,
        steps: action.steps,
      };
    case 'NEXT_STEP':
      if (state.currentStepIndex < state.steps.length - 1) {
        return { ...state, currentStepIndex: state.currentStepIndex + 1 };
      }
      return state;
    case 'PREV_STEP':
      if (state.currentStepIndex > 0) {
        return { ...state, currentStepIndex: state.currentStepIndex - 1 };
      }
      return state;
    case 'STOP_TOUR':
      return initialState;
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        steps: state.steps.map(step =>
          step.stepId === action.stepId
            ? { ...step, layout: action.layout }
            : step
        ),
      };
    default:
      return state;
  }
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  const startTour = useCallback(async (tourId: string, steps: TourStepPosition[]) => {
    console.log('🎯 Tour: Starting tour:', tourId);

    // Check if tour was already completed
    const completed = await isTourCompleted(tourId);
    if (completed) {
      console.log('🎯 Tour: Already completed, skipping');
      return;
    }

    dispatch({ type: 'START_TOUR', tourId, steps });
  }, []);

  const nextStep = useCallback(() => {
    console.log('🎯 Tour: Next step');
    const isLastStep = state.currentStepIndex === state.steps.length - 1;

    if (isLastStep && state.currentTourId) {
      // Complete tour
      markTourComplete(state.currentTourId);
      dispatch({ type: 'STOP_TOUR' });
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [state.currentStepIndex, state.steps.length, state.currentTourId]);

  const prevStep = useCallback(() => {
    console.log('🎯 Tour: Previous step');
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const stopTour = useCallback(() => {
    console.log('🎯 Tour: Stopping tour');
    if (state.currentTourId) {
      markTourComplete(state.currentTourId);
    }
    dispatch({ type: 'STOP_TOUR' });
  }, [state.currentTourId]);

  const updateStepLayout = useCallback((stepId: string, layout: TourStepPosition['layout']) => {
    dispatch({ type: 'UPDATE_LAYOUT', stepId, layout });
  }, []);

  const markTourComplete = useCallback(async (tourId: string) => {
    try {
      await AsyncStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourId}`, 'true');
      console.log('🎯 Tour: Marked as completed:', tourId);
    } catch (error) {
      console.error('Error marking tour complete:', error);
    }
  }, []);

  const isTourCompleted = useCallback(async (tourId: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(`${TOUR_STORAGE_PREFIX}${tourId}`);
      return value === 'true';
    } catch (error) {
      console.error('Error checking tour completion:', error);
      return false;
    }
  }, []);

  const resetAllTours = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tourKeys = keys.filter(key => key.startsWith(TOUR_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(tourKeys);
      console.log('🎯 Tour: All tours reset');
    } catch (error) {
      console.error('Error resetting tours:', error);
    }
  }, []);

  const value: TourContextValue = {
    state,
    startTour,
    nextStep,
    prevStep,
    stopTour,
    updateStepLayout,
    markTourComplete,
    isTourCompleted,
    resetAllTours,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTourContext = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTourContext must be used within TourProvider');
  }
  return context;
};
