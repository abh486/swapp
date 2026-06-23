import { Platform } from 'react-native';
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

/**
 * Requests App Tracking Transparency permission on iOS.
 * Resolves immediately to 'unavailable' on other platforms.
 * @returns {Promise<string>} The authorization status: 'authorized', 'denied', 'not-determined', 'restricted', or 'unavailable'.
 */
export const requestTracking = async () => {
  if (Platform.OS !== 'ios') {
    return 'unavailable';
  }

  try {
    console.log('[Tracking] Requesting App Tracking Transparency permission...');
    const status = await requestTrackingPermission();
    console.log(`[Tracking] iOS Tracking permission request status: ${status}`);
    return status;
  } catch (error) {
    console.error('[Tracking] Failed to request tracking permission:', error);
    return 'unavailable';
  }
};

/**
 * Gets the current App Tracking Transparency permission status on iOS.
 * Resolves to 'unavailable' on non-iOS platforms.
 * @returns {Promise<string>}
 */
export const getStatus = async () => {
  if (Platform.OS !== 'ios') {
    return 'unavailable';
  }

  try {
    const status = await getTrackingStatus();
    console.log(`[Tracking] Current iOS tracking status: ${status}`);
    return status;
  } catch (error) {
    console.error('[Tracking] Failed to get tracking status:', error);
    return 'unavailable';
  }
};
