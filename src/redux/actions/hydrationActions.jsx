import * as types from '../actionTypes/actionTypes';
import apiClient from '../../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fetch hydration logs and daily total for a given date.
 * Dispatches Redux lifecycle actions and handles fallback to diet logs if needed.
 */
export const fetchHydrationLogs = (dateKey) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_FETCH_LOGS_REQUEST });
  try {
    const key = dateKey || new Date().toISOString().split('T')[0];
    let logsData = [];
    try {
      const response = await apiClient.get('/hydration/logs', {
        params: { date: key },
      });
      logsData = response.data?.data || response.data || [];
    } catch (apiError) {
      // Fallback to active backend endpoint (/diet/logs/date/:date)
      try {
        const fallbackResponse = await apiClient.get(`/diet/logs/date/${key}`);
        const allLogs = fallbackResponse.data?.data || fallbackResponse.data || [];
        if (Array.isArray(allLogs)) {
          logsData = allLogs.filter(
            (item) => item.mealType === 'water' || item.mealName === 'Water'
          );
        }
      } catch (fallbackError) {
        logsData = [];
      }
    }

    const formatted = logsData.map((item) => ({
      id: item.id || item._id,
      amount: item.amountMl || item.waterVolumeMl || item.calories || 250,
      timestamp: item.timestamp || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'),
    }));
    const totalFromLogs = formatted.reduce((sum, item) => sum + item.amount, 0);

    const localVal = await AsyncStorage.getItem(`water_intake_${key}`);
    const localLiters = localVal ? parseFloat(localVal) : 0;
    const localMl = Math.round(localLiters * 1000);

    let finalLogs = formatted;
    let finalTotal = totalFromLogs;

    if (totalFromLogs > 0) {
      // Sync AsyncStorage to match backend logs
      const liters = (totalFromLogs / 1000).toFixed(1);
      await AsyncStorage.setItem(`water_intake_${key}`, liters);
      finalTotal = totalFromLogs;
    } else if (localMl > 0) {
      finalLogs = [{
        id: 'local_init',
        amount: localMl,
        amountMl: localMl,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: 'Water intake',
      }];
      finalTotal = localMl;
    }

    dispatch({
      type: types.HYDRATION_FETCH_LOGS_SUCCESS,
      payload: { logs: finalLogs, totalMl: finalTotal, dateKey: key },
    });
    return finalLogs;
  } catch (error) {
    dispatch({
      type: types.HYDRATION_FETCH_LOGS_FAILURE,
      payload: error.message,
    });
    return [];
  }
};

/**
 * Log a new water intake entry to the database and update Redux store.
 */
export const addWaterLog = ({ amountMl, dateKey, timestamp, notes }) => async (dispatch, getState) => {
  const key = dateKey || new Date().toISOString().split('T')[0];
  const ml = parseInt(amountMl, 10) || 0;
  const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 1. Immediately update AsyncStorage and Redux store optimistically
  try {
    const currentTotal = getState()?.hydration?.totalMl || 0;
    const newTotal = currentTotal + ml;
    await AsyncStorage.setItem(`water_intake_${key}`, (newTotal / 1000).toFixed(1));
  } catch (e) {}

  dispatch({
    type: types.HYDRATION_ADD_LOG_SUCCESS,
    payload: {
      id: localId,
      amount: ml,
      timestamp: time,
      dateKey: key,
    },
  });

  // 2. Persist to backend in background
  try {
    const payload = {
      amountMl: ml,
      date: key,
      timestamp: time,
      notes: notes || 'Water intake',
    };
    let result = null;
    try {
      const response = await apiClient.post('/hydration/logs', payload);
      result = response.data?.data || response.data;
    } catch (apiError) {
      try {
        const dietFallback = await apiClient.post('/diet/logs', {
          mealName: 'Water',
          mealType: 'water',
          calories: 0,
          waterVolumeMl: ml,
          date: payload.date,
          notes: payload.notes,
        });
        result = dietFallback.data?.data || dietFallback.data;
      } catch (fallbackError) {}
    }
    return result;
  } catch (error) {
    console.warn('[HydrationActions] Background add sync error:', error.message);
  }
};

/**
 * Permanently delete a water log entry and update Redux store.
 */
export const removeWaterLog = (logId, amountMl, dateKey) => async (dispatch, getState) => {
  const key = dateKey || new Date().toISOString().split('T')[0];

  // Sync updated total with AsyncStorage water_intake
  try {
    const currentTotal = getState()?.hydration?.totalMl || 0;
    const newTotal = Math.max(0, currentTotal - (parseInt(amountMl, 10) || 0));
    await AsyncStorage.setItem(`water_intake_${key}`, (newTotal / 1000).toFixed(1));
  } catch (e) {}

  dispatch({
    type: types.HYDRATION_DELETE_LOG_SUCCESS,
    payload: { id: logId, amount: amountMl, dateKey: key },
  });

  if (logId && !String(logId).startsWith('local_')) {
    try {
      await apiClient.delete(`/hydration/logs/${logId}`);
    } catch (apiError) {
      try {
        await apiClient.delete(`/diet/logs/${logId}`);
      } catch (fallbackError) {}
    }
  }
};

/**
 * Subtract water intake: deletes matching or latest log(s) and updates Redux store & AsyncStorage optimistically.
 */
export const subtractWaterLog = ({ amountMl, dateKey }) => async (dispatch, getState) => {
  try {
    const key = dateKey || new Date().toISOString().split('T')[0];
    const state = getState()?.hydration || {};
    const currentTotal = state.totalMl || 0;
    const logs = [...(state.logs || [])];
    const amountToSub = Math.min(currentTotal, parseInt(amountMl, 10) || 0);

    if (amountToSub <= 0 && currentTotal <= 0) {
      await AsyncStorage.setItem(`water_intake_${key}`, '0.0');
      dispatch({
        type: types.HYDRATION_FETCH_LOGS_SUCCESS,
        payload: { logs: [], totalMl: 0, dateKey: key },
      });
      return;
    }

    const newTotal = Math.max(0, currentTotal - amountToSub);
    await AsyncStorage.setItem(`water_intake_${key}`, (newTotal / 1000).toFixed(1));

    if (newTotal === 0) {
      const logsToDelete = [...logs];
      // Optimistically clear Redux immediately
      dispatch({
        type: types.HYDRATION_FETCH_LOGS_SUCCESS,
        payload: { logs: [], totalMl: 0, dateKey: key },
      });
      // Delete in background
      (async () => {
        for (const log of logsToDelete) {
          if (log.id && !String(log.id).startsWith('local_')) {
            try { await apiClient.delete(`/hydration/logs/${log.id}`); } catch (e) {
              try { await apiClient.delete(`/diet/logs/${log.id}`); } catch (e2) {}
            }
          }
        }
      })();
      return;
    }

    // Try finding an exact match
    const exactIdx = logs.findIndex((item) => item.amount === amountToSub);
    if (exactIdx !== -1) {
      const logToDelete = logs[exactIdx];
      logs.splice(exactIdx, 1);
      // Optimistically delete from Redux immediately
      dispatch({
        type: types.HYDRATION_DELETE_LOG_SUCCESS,
        payload: { id: logToDelete.id, amount: amountToSub, dateKey: key },
      });
      // Delete in background
      if (logToDelete.id && !String(logToDelete.id).startsWith('local_')) {
        apiClient.delete(`/hydration/logs/${logToDelete.id}`).catch(() => {
          apiClient.delete(`/diet/logs/${logToDelete.id}`).catch(() => {});
        });
      }
      return;
    }

    // If no exact match, delete or reduce latest log
    if (logs.length > 0) {
      const latestLog = logs[0];
      if (latestLog.amount <= amountToSub) {
        logs.shift();
        // Optimistically delete from Redux immediately
        dispatch({
          type: types.HYDRATION_DELETE_LOG_SUCCESS,
          payload: { id: latestLog.id, amount: latestLog.amount, dateKey: key },
        });
        // Delete in background
        if (latestLog.id && !String(latestLog.id).startsWith('local_')) {
          apiClient.delete(`/hydration/logs/${latestLog.id}`).catch(() => {
            apiClient.delete(`/diet/logs/${latestLog.id}`).catch(() => {});
          });
        }
      } else {
        const updatedAmount = latestLog.amount - amountToSub;
        logs[0] = { ...latestLog, amount: updatedAmount };
        // Optimistically update Redux immediately
        dispatch({
          type: types.HYDRATION_FETCH_LOGS_SUCCESS,
          payload: { logs, totalMl: newTotal, dateKey: key },
        });
        // Update in background
        (async () => {
          if (latestLog.id && !String(latestLog.id).startsWith('local_')) {
            try { await apiClient.delete(`/hydration/logs/${latestLog.id}`); } catch (e) {
              try { await apiClient.delete(`/diet/logs/${latestLog.id}`); } catch (e2) {}
            }
          }
          try {
            await apiClient.post('/hydration/logs', {
              amountMl: updatedAmount,
              date: key,
              timestamp: latestLog.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              notes: 'Adjusted water intake',
            });
          } catch (e) {}
        })();
      }
    } else {
      dispatch({
        type: types.HYDRATION_DELETE_LOG_SUCCESS,
        payload: { id: null, amount: amountToSub, dateKey: key },
      });
    }
  } catch (error) {
    console.error('[HydrationActions] subtractWaterLog error:', error);
  }
};

/**
 * Fetch user's custom daily hydration target.
 */
export const getHydrationTarget = () => async (dispatch) => {
  dispatch({ type: types.HYDRATION_FETCH_TARGET_REQUEST });
  try {
    let targetMl = 4000;
    try {
      const response = await apiClient.get('/hydration/target');
      const fetched = response.data?.data?.targetMl || response.data?.targetMl;
      if (fetched && fetched !== 2500) {
        targetMl = fetched;
      } else {
        targetMl = 4000;
      }
    } catch (apiError) {
      const savedGoal = await AsyncStorage.getItem('water_target_ml');
      if (savedGoal) {
        const parsed = parseInt(savedGoal, 10);
        targetMl = (parsed && parsed !== 2500) ? parsed : 4000;
      }
    }

    // Auto-migrate AsyncStorage if it had 2500 or nothing
    const savedGoal = await AsyncStorage.getItem('water_target_ml');
    if (!savedGoal || savedGoal === '2500') {
      await AsyncStorage.setItem('water_target_ml', String(targetMl));
    }

    dispatch({
      type: types.HYDRATION_FETCH_TARGET_SUCCESS,
      payload: targetMl,
    });
    return targetMl;
  } catch (error) {
    dispatch({
      type: types.HYDRATION_FETCH_TARGET_FAILURE,
      payload: error.message,
    });
    return 4000;
  }
};

/**
 * Save user's custom daily hydration target.
 */
export const setHydrationTarget = (targetMl) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_SET_TARGET_REQUEST });
  try {
    try {
      await apiClient.post('/hydration/target', { targetMl });
    } catch (apiError) {
      // Continue to persist locally even if backend endpoint is unavailable
    }
    await AsyncStorage.setItem('water_target_ml', String(targetMl));
    dispatch({
      type: types.HYDRATION_SET_TARGET_SUCCESS,
      payload: parseInt(targetMl, 10),
    });
  } catch (error) {
    dispatch({
      type: types.HYDRATION_SET_TARGET_FAILURE,
      payload: error.message,
    });
  }
};
