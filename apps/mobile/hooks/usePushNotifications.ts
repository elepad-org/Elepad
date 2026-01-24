import { useEffect } from 'react';
import { usePostPushTokens } from '@elepad/api-client';
import { registerForPushNotificationsAsync } from '@/lib/pushNotifications';
import { Platform } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to register push notifications and send token to backend
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const postPushTokenMutation = usePostPushTokens();

  useEffect(() => {
    const registerPushNotifications = async () => {
      if (!user) return;

      const token = await registerForPushNotificationsAsync();

      if (token) {
        try {
          await postPushTokenMutation.mutateAsync({
            token,
            platform: Platform.OS as 'ios' | 'android',
          });
          console.log('Push token sent to backend successfully');
        } catch (error) {
          console.error('Error sending push token to backend:', error);
        }
      }
    };

    registerPushNotifications();
  }, [user, postPushTokenMutation]);

  return {
    isLoading: postPushTokenMutation.isPending,
    error: postPushTokenMutation.error,
  };
};