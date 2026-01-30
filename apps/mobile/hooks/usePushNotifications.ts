import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { postDevicesRegister } from '@elepad/api-client/src/gen/client';

export const usePushNotifications = (userId?: string) => {
  const registerDeviceMutation = useMutation({
    mutationFn: async (data: {
      expo_push_token: string;
      platform: 'ios' | 'android';
      device_id?: string;
    }) => {
      return postDevicesRegister(data);
    },
  });

  useEffect(() => {
    if (!userId) return;

    const registerDevice = async () => {
      try {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Permission for notifications not granted');
          return;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync();
        const token = tokenData.data;

        if (!token) {
          console.log('No push token received');
          return;
        }

        // Register device
        await registerDeviceMutation.mutateAsync({
          expo_push_token: token,
          platform: Platform.OS as 'ios' | 'android',
          device_id: undefined, // Optional
        });

        console.log('Device registered for push notifications');
      } catch (error) {
        console.error('Error registering device for push notifications:', error);
      }
    };

    registerDevice();
  }, [userId]);

  return {
    isRegistering: registerDeviceMutation.isPending,
  };
};