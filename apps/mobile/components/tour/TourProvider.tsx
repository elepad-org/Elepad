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
  setPreparing: (isPreparing: boolean) => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const initialState: TourState = {
  isActive: false,
  currentTourId: null,
  currentStepIndex: 0,
  steps: [],
  isPreparing: false,
  completedTours: {},
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
        // No cambiar isPreparing aquí - dejar que useHomeTour lo maneje
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
      return {
        ...initialState,
        // Crucial: Preserve completed tours or we forget what we just did!
        completedTours: state.completedTours,
      };
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        steps: state.steps.map(step =>
          step.stepId === action.stepId
            ? { ...step, layout: action.layout }
            : step
        ),
      };
    case 'SET_PREPARING':
      return {
        ...state,
        isPreparing: action.isPreparing,
      };
    case 'HYDRATE_COMPLETED':
      return {
        ...state,
        completedTours: action.completedTours,
      };
    case 'MARK_COMPLETED':
      return {
        ...state,
        completedTours: {
          ...state.completedTours,
          [action.tourId]: true,
        },
      };
    default:
      return state;
  }
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tourReducer, initialState);

  // Load completed tours on mount
  React.useEffect(() => {
    const hydrate = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const tourKeys = keys.filter(key => key.startsWith(TOUR_STORAGE_PREFIX));
        const completedMap: Record<string, boolean> = {};

        // We know keys starting with prefix exist, so we can just mark them true
        // If we needed values we'd use multiGet, but existence is enough for now logic?
        // Actually legacy logic used values 'true'. Let's follow that pattern or just assume keys match.
        // Let's safe bet: map keys to IDs.

        tourKeys.forEach(key => {
          const id = key.replace(TOUR_STORAGE_PREFIX, '');
          completedMap[id] = true;
        });

        dispatch({ type: 'HYDRATE_COMPLETED', completedTours: completedMap });
        console.log('🎯 Tour: Hydrated status for:', Object.keys(completedMap));
      } catch (error) {
        console.error('Error hydrating tours:', error);
      }
    };
    hydrate();
  }, []);

  const startTour = useCallback(async (tourId: string, steps: TourStepPosition[]) => {
    console.log('🎯 Tour: Starting tour:', tourId);

    // Check if tour was already completed (Now sync via state!)
    // Safe check against undefined state during hot reload/init
    if (state.completedTours && state.completedTours[tourId]) {
      console.log('🎯 Tour: Already completed (cached), skipping');
      return;
    }

    // Double check storage just in case hydration missed? No, trust state for speed.
    // If state says no, proceed.

    dispatch({ type: 'START_TOUR', tourId, steps });
  }, [state.completedTours]);

  const markTourComplete = useCallback(async (tourId: string) => {
    try {
      // Optimistic update
      dispatch({ type: 'MARK_COMPLETED', tourId });

      await AsyncStorage.setItem(`${TOUR_STORAGE_PREFIX}${tourId}`, 'true');
      console.log('🎯 Tour: Marked as completed:', tourId);
    } catch (error) {
      console.error('Error marking tour complete:', error);
    }
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
  }, [state.currentStepIndex, state.steps.length, state.currentTourId, markTourComplete]);

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
  }, [state.currentTourId, markTourComplete]);

  const updateStepLayout = useCallback((stepId: string, layout: TourStepPosition['layout']) => {
    dispatch({ type: 'UPDATE_LAYOUT', stepId, layout });
  }, []);



  const isTourCompleted = useCallback(async (tourId: string): Promise<boolean> => {
    // Instant return from state, safe check
    return !!(state.completedTours && state.completedTours[tourId]);
  }, [state.completedTours]);

  const resetAllTours = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const tourKeys = keys.filter(key => key.startsWith(TOUR_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(tourKeys);

      // We'd need a RESET_COMPLETED action ideally, or just hack hydration to empty
      dispatch({ type: 'HYDRATE_COMPLETED', completedTours: {} });

      console.log('🎯 Tour: All tours reset');
    } catch (error) {
      console.error('Error resetting tours:', error);
    }
  }, []);

  const setPreparing = useCallback((isPreparing: boolean) => {
    dispatch({ type: 'SET_PREPARING', isPreparing });
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
    setPreparing,
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
