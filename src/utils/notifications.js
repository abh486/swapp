import firebase from '@react-native-firebase/app';
import apiClient from '../api/apiClient';

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
    const authStatus = await messaging().requestPermission();
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

    // Get FCM device token
    const token = await messaging().getToken();
    if (token) {
      console.log('[FCM] Token retrieved successfully');
      await apiClient.post('/notifications/register-fcm', { token });
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

  // Foreground message handler
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('[FCM] Foreground message received:', remoteMessage);
  });

  // Token refresh handler
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
    console.log('[FCM] Token refreshed:', token);
    try {
      await apiClient.post('/notifications/register-fcm', { token });
    } catch (err) {
      console.error('[FCM] Failed to update refreshed token with backend:', err);
    }
  });

  return () => {
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
};
