import { Platform, NativeModules } from 'react-native';

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
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
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

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.initHealthKit !== 'function') {
      reject(
        new Error(
          'HealthKit native module is not available. Please run pod install in the ios directory and rebuild the app.'
        )
      );
      return;
    }

    NativeModule.initHealthKit(permissions, (error) => {
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
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getStepCount !== 'function') {
      resolve(0);
      return;
    }

    const options = {
      date: new Date().toISOString(),
    };
    NativeModule.getStepCount(options, (err, results) => {
      if (err || !results) {
        resolve(0);
      } else {
        resolve(results.value || 0);
      }
    });
  });
};

/**
 * Query the active energy burned (calories) for the current day.
 * @returns {Promise<number>}
 */
export const getActiveEnergyBurnedToday = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getActiveEnergyBurned !== 'function') {
      resolve(0);
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const options = {
      startDate: startOfToday.toISOString(),
      endDate: new Date().toISOString(),
    };

    NativeModule.getActiveEnergyBurned(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve(0);
      } else {
        const total = results.reduce((sum, item) => sum + (item.value || 0), 0);
        resolve(Math.round(total));
      }
    });
  });
};

/**
 * Query the walking/running distance for the current day.
 * @returns {Promise<number>}
 */
export const getDistanceWalkingRunningToday = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getDistanceWalkingRunning !== 'function') {
      resolve(0);
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const options = {
      startDate: startOfToday.toISOString(),
      endDate: new Date().toISOString(),
    };

    NativeModule.getDistanceWalkingRunning(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve(0);
      } else {
        const total = results.reduce((sum, item) => sum + (item.value || 0), 0);
        // Distance is returned in meters or miles/kilometers depending on settings.
        // The standard native module returns meters. Let's convert to km if greater than 100.
        const kmVal = total > 100 ? total / 1000 : total;
        resolve(parseFloat(kmVal.toFixed(1)));
      }
    });
  });
};

/**
 * Query sleep duration in hours in the last 24 hours.
 * @returns {Promise<number>}
 */
export const getSleepDurationToday = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getSleepSamples !== 'function') {
      resolve(0);
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const options = {
      startDate: startOfYesterday.toISOString(),
      endDate: new Date().toISOString(),
      limit: 100,
    };

    NativeModule.getSleepSamples(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve(0);
      } else {
        let totalMinutes = 0;
        results.forEach((sample) => {
          // Verify it's an asleep sample
          if (sample.value === 'ASLEEP' || sample.value === 0 || sample.value === 1) {
            const start = new Date(sample.startDate);
            const end = new Date(sample.endDate);
            const diffMs = end - start;
            if (diffMs > 0) {
              totalMinutes += diffMs / 1000 / 60;
            }
          }
        });
        const hours = totalMinutes / 60;
        resolve(parseFloat(hours.toFixed(1)));
      }
    });
  });
};

/**
 * Query the total step count for a specific date.
 * @param {Date} date
 * @returns {Promise<number>}
 */
export const getStepCountForDate = (date) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getStepCount !== 'function') {
      resolve(0);
      return;
    }

    const options = {
      date: date.toISOString(),
    };
    NativeModule.getStepCount(options, (err, results) => {
      if (err || !results) {
        resolve(0);
      } else {
        resolve(results.value || 0);
      }
    });
  });
};

/**
 * Query the active energy burned (calories) for a specific date.
 * @param {Date} date
 * @returns {Promise<number>}
 */
export const getActiveEnergyBurnedForDate = (date) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getActiveEnergyBurned !== 'function') {
      resolve(0);
      return;
    }

    const startOfDate = new Date(date);
    startOfDate.setHours(0, 0, 0, 0);

    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDate.toISOString(),
      endDate: endOfDate.toISOString(),
    };

    NativeModule.getActiveEnergyBurned(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve(0);
      } else {
        const total = results.reduce((sum, item) => sum + (item.value || 0), 0);
        resolve(Math.round(total));
      }
    });
  });
};

/**
 * Query the walking/running distance for a specific date.
 * @param {Date} date
 * @returns {Promise<number>}
 */
export const getDistanceWalkingRunningForDate = (date) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve(0);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getDistanceWalkingRunning !== 'function') {
      resolve(0);
      return;
    }

    const startOfDate = new Date(date);
    startOfDate.setHours(0, 0, 0, 0);

    const endOfDate = new Date(date);
    endOfDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDate.toISOString(),
      endDate: endOfDate.toISOString(),
    };

    NativeModule.getDistanceWalkingRunning(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve(0);
      } else {
        const total = results.reduce((sum, item) => sum + (item.value || 0), 0);
        const kmVal = total > 100 ? total / 1000 : total;
        resolve(parseFloat(kmVal.toFixed(2)));
      }
    });
  });
};

/**
 * Query steps history samples for the last few days.
 * @param {number} daysCount
 * @returns {Promise<Array<{steps: number, kcal: number, distance: string, dateStr: string}>>}
 */
export const getStepsHistoryLastDays = (daysCount = 7) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') {
      resolve([]);
      return;
    }

    const NativeModule = NativeModules.AppleHealthKit || AppleHealthKit;

    if (!NativeModule || typeof NativeModule.getDailyStepCountSamples !== 'function') {
      resolve([]);
      return;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    startDate.setHours(0, 0, 0, 0);

    const options = {
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
    };

    NativeModule.getDailyStepCountSamples(options, (err, results) => {
      if (err || !results || !Array.isArray(results)) {
        resolve([]);
      } else {
        const mapped = results.map(r => ({
          steps: r.value || 0,
          kcal: Math.round((r.value || 0) * 0.045),
          distance: `${((r.value || 0) * 0.0008).toFixed(2)} KM`,
          dateStr: new Date(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        resolve(mapped);
      }
    });
  });
};
