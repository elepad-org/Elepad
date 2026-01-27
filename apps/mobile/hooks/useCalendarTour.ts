import { useEffect, useState, useRef } from 'react';
import { useTourGuideController } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InteractionManager } from 'react-native';

const TOUR_STORAGE_KEY = '@elepad_has_seen_calendar_tour_v2';

export const useCalendarTour = () => {
  const { start, canStart, stop, eventEmitter } = useTourGuideController('calendarTour');
  const [hasSeenTour, setHasSeenTour] = useState<boolean | null>(null);
  const hasCheckedTour = useRef(false);

  useEffect(() => {
    console.log('📅 useCalendarTour: Effect triggered', { hasCheckedTour: hasCheckedTour.current, canStart });
    if (hasCheckedTour.current || !canStart) return;

    const checkTourStatus = async () => {
      try {
        hasCheckedTour.current = true; // Mark as checked to prevent loops
        const value = await AsyncStorage.getItem(TOUR_STORAGE_KEY);
        console.log('📅 useCalendarTour: Storage value', value);
        setHasSeenTour(value === 'true');

        if (value !== 'true') {
          console.log('📅 useCalendarTour: Starting tour...');
          // Small delay to ensure UI is ready
          InteractionManager.runAfterInteractions(() => {
            console.log('📅 useCalendarTour: Calling start()');
            start();
          });
        } else {
          console.log('📅 useCalendarTour: Tour already seen, skipping');
        }
      } catch (e) {
        console.error('Error checking tour status', e);
      }
    };

    checkTourStatus();
  }, [canStart, start]);

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
    restartTour: async () => {
      try {
        await AsyncStorage.removeItem(TOUR_STORAGE_KEY);
        hasCheckedTour.current = false; // Reset check flag
        start();
      } catch (e) {
        console.error('Error restarting tour', e);
      }
    },
  };
};
