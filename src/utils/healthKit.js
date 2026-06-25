import { Platform } from 'react-native';

let AppleHealthKit = null;
if (Platform.OS === 'ios') {
  const HealthKitModule = require('react-native-health');
  AppleHealthKit = HealthKitModule.default || HealthKitModule;
}

const permissions = Platform.OS === 'ios' ? {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
    ],
    write: [],
  },
} : {};

/**
 * Request HealthKit authorization from the user.
 * @returns {Promise<boolean>} Resolves to true if successful, false if not supported (e.g. Android).
 */
export const requestHealthKitPermission = () => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      resolve(false);
      return;
    }

    if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
      reject(
        new Error(
          'HealthKit native module is not available. Please run pod install in the ios directory and rebuild the app.'
        )
      );
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (error) => {
      if (error) {
        console.error('[HealthKit] Permission request/Initialization failed:', error);
        reject(error);
      } else {
        console.log('[HealthKit] Initialized successfully');
        resolve(true);
      }
    });
  });
};

/**
 * Query the total step count for the current day.
 * @returns {Promise<number>}
 */
export const getStepCountToday = () => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    if (!AppleHealthKit || typeof AppleHealthKit.getStepCount !== 'function') {
      resolve(0);
      return;
    }

    const options = {
      date: new Date().toISOString(),
    };
    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.value);
      }
    });
  });
};
