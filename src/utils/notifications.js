import { Platform } from 'react-native';
import firebase from '@react-native-firebase/app';
import apiClient from '../api/apiClient';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Safe messaging module getter
const getMessaging = () => {
  if (firebase.apps.length > 0) {
    try {
      return require('@react-native-firebase/messaging').default;
    } catch (err) {
      console.warn('[Firebase] Failed to load messaging module:', err.message);
    }
  }
  return null;
};

export const requestUserPermission = async () => {
  const messaging = getMessaging();
  if (!messaging) {
    console.log('[FCM] Firebase Messaging is not initialized/available. Skipping permission request.');
    return false;
  }
  try {
    const authStatus = await messaging().requestPermission({
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    });
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('[FCM] Notification permissions granted.');
      return true;
    }
    console.log('[FCM] Notification permissions denied.');
    return false;
  } catch (err) {
    console.error('[FCM] Permission request error:', err);
    return false;
  }
};

export const registerFcmToken = async () => {
  const messaging = getMessaging();
  if (!messaging) {
    console.log('[FCM] Firebase Messaging is not initialized/available. Skipping token registration.');
    return;
  }
  try {
    const hasPermission = await requestUserPermission();
    if (!hasPermission) return;

    // On iOS, register device for remote messages before fetching FCM token
    if (Platform.OS === 'ios') {
      try {
        if (!messaging().isDeviceRegisteredForRemoteMessages) {
          await messaging().registerDeviceForRemoteMessages();
          console.log('[FCM] Device registered for remote messages on iOS.');
        }

        // On physical iOS devices, verify APNs token is ready before calling getToken()
        let apnsToken = await messaging().getAPNSToken();
        let retries = 0;
        while (!apnsToken && retries < 4) {
          await new Promise(resolve => setTimeout(resolve, 500));
          apnsToken = await messaging().getAPNSToken();
          retries++;
        }
        if (apnsToken) {
          console.log('[FCM] APNs Token ready on iOS.');
        } else {
          console.log('[FCM] APNs token not yet available (may be on Simulator).');
        }
      } catch (iosErr) {
        console.warn('[FCM] iOS remote message registration warning:', iosErr.message);
      }
    }

    // Get FCM device token
    const token = await messaging().getToken();
    if (token) {
      console.log('[FCM] Token retrieved successfully:', token.substring(0, 15) + '...');
      await apiClient.post('/v1/notifications/register-fcm', { token });
      console.log('[FCM] Token registered with backend successfully.');
    }
  } catch (err) {
    console.error('[FCM] Failed to register FCM token:', err);
  }
};

export const initNotificationListeners = () => {
  const messaging = getMessaging();
  if (!messaging) {
    console.log('[FCM] Firebase Messaging is not initialized/available. Skipping listener initialization.');
    return () => {};
  }

  // Set foreground presentation options for iOS to display alert/sound when app is open
  try {
    messaging().setForegroundNotificationPresentationOptions({
      alert: true,
      badge: true,
      sound: true,
    });
  } catch (err) {
    console.warn('[FCM] Failed to set foreground presentation options:', err.message);
  }

  // Foreground message handler
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('[FCM] Foreground message received:', remoteMessage);
    try {
      const { notification } = remoteMessage;
      if (notification) {
        // Create high importance channel for Android
        const channelId = await notifee.createChannel({
          id: 'default_channel',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        // Display a local notification
        await notifee.displayNotification({
          title: notification.title,
          body: notification.body,
          android: {
            channelId,
            importance: AndroidImportance.HIGH,
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        });
      }
    } catch (err) {
      console.error('[FCM] Failed to display foreground notification using Notifee:', err);
    }
  });

  // Token refresh handler
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
    console.log('[FCM] Token refreshed:', token);
    try {
      await apiClient.post('/v1/notifications/register-fcm', { token });
    } catch (err) {
      console.error('[FCM] Failed to update refreshed token with backend:', err);
    }
  });

  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
};
