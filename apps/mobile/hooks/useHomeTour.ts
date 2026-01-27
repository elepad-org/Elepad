
import { useEffect, useState, useRef } from 'react';
import { useTourGuideController } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';

const TOUR_STORAGE_KEY = '@elepad_has_seen_home_tour_v2';

export const useHomeTour = (isLoading = false) => {
  const { start, canStart, stop, eventEmitter } = useTourGuideController();
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const hasCheckedTour = useRef(false);

  useEffect(() => {
    if (hasCheckedTour.current || !canStart || isLoading) return;

    const checkTourStatus = async () => {
      try {
        hasCheckedTour.current = true; // Mark as checked to prevent loops
        const value = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        setHasSeenTour(value === 'true');

        if (value !== 'true') {
          // Small delay to ensure UI is ready
          InteractionManager.runAfterInteractions(() => {
            start();
          });
        }
      } catch (e) {
        console.error('Error checking tour status', e);
      }
    };

    checkTourStatus();
  }, [canStart, start, isLoading]);

  const handleFinishTour = async () => {
    try {
      await AsyncStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Error saving tour status', e);
    }
  };

  useEffect(() => {
    if (eventEmitter) {
      eventEmitter.on('stop', handleFinishTour);
    }
    return () => {
      if (eventEmitter) {
        eventEmitter.off('stop', handleFinishTour);
      }
    };
  }, [eventEmitter]);

  return {
    start,
    stop,
    hasSeenTour,
    restartTour: () => start(),
  };
};
