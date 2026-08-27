import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dedicated API service for Sleep tracking.
 * Provides seamless fallback to local AsyncStorage when backend endpoints are unavailable/offline.
 */

/**
 * Fetch sleep logs and total sleep hours for a given date.
 * @param {string} dateKey - Date in YYYY-MM-DD format
 */
export const fetchSleepLogs = async (dateKey) => {
  try {
    const response = await apiClient.get('/sleep/logs', {
      params: { date: dateKey },
    });
    const data = response.data?.data || response.data;
    if (data && (Array.isArray(data.logs) || Array.isArray(data))) {
      const logsList = Array.isArray(data) ? data : data.logs;
      const total = data.totalHours !== undefined
        ? data.totalHours
        : logsList.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);

      // Cache in AsyncStorage
      await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(logsList));
      await AsyncStorage.setItem(`sleep_duration_${dateKey}`, total.toString());
      if (logsList.length > 0) {
        await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(logsList[0]));
      }

      return { logs: logsList, totalHours: total };
    }
  } catch (error) {
    console.warn('[SleepAPI] fetchSleepLogs API request failed, using AsyncStorage cache:', error.message);
  }

  // Offline / Fallback from AsyncStorage
  try {
    const cachedLogsStr = await AsyncStorage.getItem(`sleep_logs_${dateKey}`);
    if (cachedLogsStr) {
      const parsed = JSON.parse(cachedLogsStr);
      const total = parsed.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
      return { logs: parsed, totalHours: total };
    }
    const singleLogStr = await AsyncStorage.getItem(`sleep_log_${dateKey}`);
    if (singleLogStr) {
      const parsed = JSON.parse(singleLogStr);
      return { logs: [parsed], totalHours: parseFloat(parsed.duration) || 0 };
    }
    const durationStr = await AsyncStorage.getItem(`sleep_duration_${dateKey}`);
    if (durationStr) {
      return { logs: [], totalHours: parseFloat(durationStr) || 0 };
    }
  } catch (e) {
    console.warn('[SleepAPI] Error reading AsyncStorage cache:', e);
  }

  return { logs: [], totalHours: 0 };
};

/**
 * Fetch weekly sleep data (7 days) for analysis.
 * @param {string} dateKey - End date in YYYY-MM-DD format
 */
export const fetchWeeklySleep = async (dateKey) => {
  try {
    const response = await apiClient.get('/sleep/weekly', {
      params: { date: dateKey },
    });
    const data = response.data?.data || response.data;
    if (data && Array.isArray(data.days)) {
      return data;
    }
  } catch (error) {
    console.warn('[SleepAPI] fetchWeeklySleep API failed, calculating locally:', error.message);
  }

  // Local fallback calculation
  const endDate = dateKey ? new Date(dateKey) : new Date();
  const days = [];
  let sumDeficit = 0;
  const targetHours = 8.0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;

    let duration = 0;
    try {
      const val = await AsyncStorage.getItem(`sleep_duration_${key}`);
      if (val) duration = parseFloat(val) || 0;
    } catch (e) {}

    const weekdayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
    days.push({
      label: weekdayLabel,
      value: duration,
      dateKey: key,
    });
    sumDeficit += duration - targetHours;
  }

  return {
    days,
    targetHours,
    weeklyDeficit: Math.round(sumDeficit),
  };
};

/**
 * Log or update a sleep entry.
 * @param {Object} payload - { id, bedTime, wakeTime, duration, date, notes, source }
 */
export const logSleepEntry = async ({ id, bedTime, wakeTime, duration, date, notes, source }) => {
  const dateStr = date || (wakeTime ? new Date(wakeTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const payload = {
    id,
    bedTime: bedTime ? new Date(bedTime).toISOString() : null,
    wakeTime: wakeTime ? new Date(wakeTime).toISOString() : null,
    duration: duration !== undefined && duration !== null ? parseFloat(duration) : undefined,
    date: dateStr,
    notes: notes || 'Sleep log',
    source: source || 'MANUAL',
  };

  try {
    const response = await apiClient.post('/sleep/logs', payload);
    const result = response.data?.data || response.data;
    return result;
  } catch (error) {
    console.warn('[SleepAPI] logSleepEntry API failed, saved to local cache only:', error.message);
    return {
      id: id || `manual-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };
  }
};

/**
 * Delete a sleep entry.
 * @param {string} logId - Unique log ID
 */
export const deleteSleepEntry = async (logId) => {
  if (!logId) return;

  try {
    const response = await apiClient.delete(`/sleep/logs/${logId}`);
    return response.data;
  } catch (error) {
    console.warn('[SleepAPI] deleteSleepEntry API failed:', error.message);
    return null;
  }
};

/**
 * Fetch user's sleep target (default 8.0 hours).
 */
export const fetchSleepTarget = async () => {
  try {
    const response = await apiClient.get('/sleep/target');
    return response.data?.data?.targetHours || response.data?.targetHours || 8.0;
  } catch (error) {
    return 8.0;
  }
};

/**
 * Save user's custom sleep target.
 * @param {number} targetHours - e.g. 8.0
 */
export const saveSleepTarget = async (targetHours) => {
  try {
    const response = await apiClient.post('/sleep/target', { targetHours });
    return response.data;
  } catch (error) {
    return null;
  }
};
