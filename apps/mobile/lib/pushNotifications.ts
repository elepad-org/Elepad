import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { usePostPushTokens } from '@elepad/api-client';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    // Crear canal de notificación para Android
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones predeterminadas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      if (!projectId) {
        console.warn('Project ID not found');
      }
      
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      
      console.log('Push token obtained:', token, typeof token);
      
      if (typeof token !== 'string' || token.trim().length === 0) {
        console.warn('Invalid token format:', token);
        token = undefined;
      }
    } catch (e) {
      console.error('Error getting push token:', e);
      token = undefined;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Register push notifications and send token to backend
 * This should be called after user is authenticated
 */
export async function registerAndSendPushToken(): Promise<void> {
  const token = await registerForPushNotificationsAsync();
  
  if (token) {
    try {
      // Import here to avoid circular dependencies
      const { usePostPushTokens } = await import('@elepad/api-client');
      
      // Since this is not a React component, we need to use the API directly
      // For now, we'll store the token and send it when the user is authenticated
      console.log('Token obtained, will send to backend when authenticated');
      
      // TODO: Send token to backend using API client
      // This needs to be called from a component that has access to the mutation
      
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Show an immediate local notification
 */
export async function showLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await scheduleLocalNotification(title, body, data, null);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}
