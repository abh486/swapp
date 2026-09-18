import * as types from '../actionTypes/actionTypes';
import apiClient from '../../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper to make an action function dual-compatible:
 * 1. Callable directly with `await fn(...)`
 * 2. Dispatchable via Redux `dispatch(fn(...))`
 */
const createDualAction = (actionCreator) => {
  return (...args) => {
    let executedPromise = null;
    const run = (dispatch) => {
      if (!executedPromise) {
        executedPromise = actionCreator(...args)(dispatch);
      }
      return executedPromise;
    };
    const thunk = (dispatch) => run(dispatch);
    thunk.then = (onFulfilled, onRejected) => run().then(onFulfilled, onRejected);
    thunk.catch = (onRejected) => run().catch(onRejected);
    thunk.finally = (onFinally) => run().finally(onFinally);
    return thunk;
  };
};

/**
 * Fetch sleep logs and total sleep hours for a given date.
 * Updates Redux store and handles local AsyncStorage fallback.
 */
export const fetchSleepLogs = createDualAction((dateKey) => async (dispatch) => {
  if (typeof dispatch === 'function') {
    dispatch({ type: types.SLEEP_FETCH_LOGS_REQUEST });
  }

  let logsList = [];
  let total = 0;

  try {
    const response = await apiClient.get('/sleep/logs', {
      params: { date: dateKey },
    });
    const data = response.data?.data || response.data;
    if (data && (Array.isArray(data.logs) || Array.isArray(data))) {
      const serverLogs = Array.isArray(data) ? data : data.logs;
      if (serverLogs.length > 0) {
        logsList = serverLogs;
        total = data.totalHours !== undefined
          ? data.totalHours
          : logsList.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);

        // Cache in AsyncStorage
        await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(logsList));
        await AsyncStorage.setItem(`sleep_duration_${dateKey}`, total.toString());
        await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(logsList[0]));

        if (typeof dispatch === 'function') {
          dispatch({
            type: types.SLEEP_FETCH_LOGS_SUCCESS,
            payload: { logs: logsList, totalHours: total, dateKey },
          });
        }
        return { logs: logsList, totalHours: total };
      }
    }
  } catch (error) {
    console.warn('[SleepActions] fetchSleepLogs API request failed, using AsyncStorage cache:', error.message);
  }

  // Offline / Fallback from AsyncStorage if server returned 0 logs or failed
  try {
    const cachedLogsStr = await AsyncStorage.getItem(`sleep_logs_${dateKey}`);
    if (cachedLogsStr) {
      const parsed = JSON.parse(cachedLogsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logsList = parsed;
        total = parsed.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
      }
    } else {
      const singleLogStr = await AsyncStorage.getItem(`sleep_log_${dateKey}`);
      if (singleLogStr) {
        const parsed = JSON.parse(singleLogStr);
        logsList = [parsed];
        total = parseFloat(parsed.duration) || 0;
      } else {
        const durationStr = await AsyncStorage.getItem(`sleep_duration_${dateKey}`);
        if (durationStr) {
          total = parseFloat(durationStr) || 0;
        }
      }
    }
  } catch (e) {
    console.warn('[SleepActions] Error reading AsyncStorage cache:', e);
  }

  if (typeof dispatch === 'function') {
    dispatch({
      type: types.SLEEP_FETCH_LOGS_SUCCESS,
      payload: { logs: logsList, totalHours: total, dateKey },
    });
  }
  return { logs: logsList, totalHours: total };
});

/**
 * Fetch weekly sleep data (7 days) for analysis.
 */
export const fetchWeeklySleep = createDualAction((dateKey) => async () => {
  try {
    const response = await apiClient.get('/sleep/weekly', {
      params: { date: dateKey },
    });
    const data = response.data?.data || response.data;
    if (data && Array.isArray(data.days)) {
      return data;
    }
  } catch (error) {
    console.warn('[SleepActions] fetchWeeklySleep API failed, calculating locally:', error.message);
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
});

/**
 * Log or update a sleep entry.
 */
export const logSleepEntry = createDualAction(({ id, bedTime, wakeTime, duration, date, notes, source }) => async (dispatch) => {
  if (typeof dispatch === 'function') {
    dispatch({ type: types.SLEEP_ADD_LOG_REQUEST });
  }

  const dateStr = date || (wakeTime ? new Date(wakeTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const payload = {
    id: id || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    bedTime: bedTime ? new Date(bedTime).toISOString() : null,
    wakeTime: wakeTime ? new Date(wakeTime).toISOString() : null,
    duration: duration !== undefined && duration !== null ? parseFloat(duration) : undefined,
    date: dateStr,
    notes: notes || 'Sleep log',
    source: source || 'MANUAL',
  };

  let result = null;
  try {
    const response = await apiClient.post('/sleep/logs', payload);
    result = response.data?.data || response.data || payload;
  } catch (error) {
    console.warn('[SleepActions] logSleepEntry API failed, saved to local cache only:', error.message);
    result = {
      ...payload,
      createdAt: new Date().toISOString(),
    };
  }

  // Ensure local AsyncStorage is updated immediately
  try {
    const existingStr = await AsyncStorage.getItem(`sleep_logs_${dateStr}`);
    let logs = existingStr ? JSON.parse(existingStr) : [];
    if (!Array.isArray(logs)) logs = [];
    const index = logs.findIndex((item) => item.id === result.id);
    if (index >= 0) {
      logs[index] = result;
    } else {
      logs.unshift(result);
    }
    const newTotal = logs.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
    await AsyncStorage.setItem(`sleep_logs_${dateStr}`, JSON.stringify(logs));
    await AsyncStorage.setItem(`sleep_duration_${dateStr}`, newTotal.toString());
    await AsyncStorage.setItem(`sleep_log_${dateStr}`, JSON.stringify(logs[0]));
  } catch (e) {
    console.warn('[SleepActions] Error caching logSleepEntry locally:', e);
  }

  if (typeof dispatch === 'function') {
    dispatch({
      type: types.SLEEP_ADD_LOG_SUCCESS,
      payload: result,
    });
  }
  return result;
});

export const addSleepLog = logSleepEntry;

/**
 * Delete a sleep entry.
 */
export const deleteSleepEntry = createDualAction((logId, dateKey) => async (dispatch) => {
  if (!logId) return;
  if (typeof dispatch === 'function') {
    dispatch({ type: types.SLEEP_DELETE_LOG_REQUEST });
  }

  let result = null;
  try {
    const response = await apiClient.delete(`/sleep/logs/${logId}`);
    result = response.data;
  } catch (error) {
    console.warn('[SleepActions] deleteSleepEntry API failed:', error.message);
  }

  // Update local AsyncStorage
  if (dateKey) {
    try {
      const existingStr = await AsyncStorage.getItem(`sleep_logs_${dateKey}`);
      if (existingStr) {
        let logs = JSON.parse(existingStr);
        if (Array.isArray(logs)) {
          logs = logs.filter((item) => item.id !== logId);
          const newTotal = logs.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
          await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(logs));
          await AsyncStorage.setItem(`sleep_duration_${dateKey}`, newTotal.toString());
          if (logs.length > 0) {
            await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(logs[0]));
          } else {
            await AsyncStorage.removeItem(`sleep_log_${dateKey}`);
          }
        }
      }
    } catch (e) {
      console.warn('[SleepActions] Error deleting sleep entry locally:', e);
    }
  }

  if (typeof dispatch === 'function') {
    dispatch({
      type: types.SLEEP_DELETE_LOG_SUCCESS,
      payload: { id: logId, dateKey },
    });
  }
  return result;
});

export const removeSleepLog = deleteSleepEntry;

/**
 * Fetch user's sleep target (default 8.0 hours).
 */
export const fetchSleepTarget = createDualAction(() => async (dispatch) => {
  if (typeof dispatch === 'function') {
    dispatch({ type: types.SLEEP_FETCH_TARGET_REQUEST });
  }

  let targetHours = 8.0;
  try {
    const response = await apiClient.get('/sleep/target');
    targetHours = response.data?.data?.targetHours || response.data?.targetHours || 8.0;
  } catch (error) {
    try {
      const saved = await AsyncStorage.getItem('sleep_target_hours');
      if (saved) targetHours = parseFloat(saved) || 8.0;
    } catch (e) {}
  }

  if (typeof dispatch === 'function') {
    dispatch({
      type: types.SLEEP_FETCH_TARGET_SUCCESS,
      payload: targetHours,
    });
  }
  return targetHours;
});

export const getSleepTarget = fetchSleepTarget;

/**
 * Save user's custom sleep target.
 */
export const saveSleepTarget = createDualAction((targetHours) => async (dispatch) => {
  if (typeof dispatch === 'function') {
    dispatch({ type: types.SLEEP_SAVE_TARGET_REQUEST });
  }

  try {
    try {
      await apiClient.post('/sleep/target', { targetHours });
    } catch (apiError) {}
    await AsyncStorage.setItem('sleep_target_hours', String(targetHours));
    if (typeof dispatch === 'function') {
      dispatch({
        type: types.SLEEP_SAVE_TARGET_SUCCESS,
        payload: parseFloat(targetHours),
      });
    }
  } catch (error) {
    if (typeof dispatch === 'function') {
      dispatch({
        type: types.SLEEP_SAVE_TARGET_FAILURE,
        payload: error.message,
      });
    }
  }
});

export const setSleepTarget = saveSleepTarget;
