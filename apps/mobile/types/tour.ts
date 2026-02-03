import React from 'react';
import { View } from 'react-native';

export interface TourStep {
  tourId: string;      // ID del tour (ej: 'home', 'calendar')
  stepId: string;      // ID único del paso
  order: number;       // Orden del paso (1, 2, 3...)
  text: string;        // Texto explicativo
  title?: string;      // Título opcional
  side?: 'top' | 'bottom'; // Preferencia de posición
}

export interface TourStepPosition extends TourStep {
  ref: React.RefObject<View | null>;  // Referencia al componente
  layout?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TourState {
  isActive: boolean;
  currentTourId: string | null;
  currentStepIndex: number;
  steps: TourStepPosition[];
  isPreparing: boolean;
}

export type TourAction =
  | { type: 'START_TOUR'; tourId: string; steps: TourStepPosition[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'STOP_TOUR' }
  | { type: 'UPDATE_LAYOUT'; stepId: string; layout: TourStepPosition['layout'] }
  | { type: 'SET_PREPARING'; isPreparing: boolean }
  | { type: 'HYDRATE_COMPLETED'; completedTours: Record<string, boolean> }
  | { type: 'MARK_COMPLETED'; tourId: string };
