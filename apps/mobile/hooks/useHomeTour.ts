
import { useEffect, useState, useRef } from 'react';
import { useTourGuideController } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';

const TOUR_STORAGE_KEY = '@elepad_has_seen_home_tour_v2';

export const useHomeTour = (isLoading = false) => {
  const { start, canStart, stop, eventEmitter } = useTourGuideController('homeTour');
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const hasCheckedTour = useRef(false);
  const hasStartedTour = useRef(false);

  useEffect(() => {
    // console.log('🎯 useHomeTour: Effect triggered', { hasCheckedTour: hasCheckedTour.current, hasStartedTour: hasStartedTour.current, canStart, isLoading });

    // TOUR TEMPORARILY DISABLED - Remove this return to re-enable
    return;

    if (hasCheckedTour.current || !canStart || isLoading || hasStartedTour.current) return;

    const checkTourStatus = async () => {
      try {
        hasCheckedTour.current = true; // Mark as checked to prevent loops
        const value = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        console.log('🎯 useHomeTour: Storage value', value);
        setHasSeenTour(value === 'true');

        if (value !== 'true') {
          console.log('🎯 useHomeTour: Starting tour...');
          hasStartedTour.current = true; // Mark as started
          // Longer delay to ensure UI, backdrop, and context are fully ready
          InteractionManager.runAfterInteractions(() => {
            setTimeout(() => {
              console.log('🎯 useHomeTour: Calling start()');
              start();
            }, 500);
          });
        } else {
          console.log('🎯 useHomeTour: Tour already seen, skipping');
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
