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
  dispatch({ type: types.HYDRATION_ADD_LOG_REQUEST });
  try {
    const key = dateKey || new Date().toISOString().split('T')[0];
    const payload = {
      amountMl: parseInt(amountMl, 10) || 0,
      date: key,
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: notes || 'Water intake',
    };

    let result = null;
    try {
      const response = await apiClient.post('/hydration/logs', payload);
      result = response.data?.data || response.data;
    } catch (apiError) {
      // Fallback to active backend endpoint (/diet/logs)
      try {
        const dietFallback = await apiClient.post('/diet/logs', {
          mealName: 'Water',
          mealType: 'water',
          calories: 0,
          waterVolumeMl: parseInt(amountMl, 10) || 0,
          date: payload.date,
          notes: payload.notes,
        });
        result = dietFallback.data?.data || dietFallback.data;
      } catch (fallbackError) {
        console.warn('[HydrationActions] Offline fallback log created:', fallbackError.message);
        result = {
          id: Date.now().toString(),
          amountMl: parseInt(amountMl, 10) || 0,
        };
      }
    }

    // Sync updated total with AsyncStorage water_intake
    try {
      const currentTotal = getState()?.hydration?.totalMl || 0;
      const newTotal = currentTotal + (parseInt(amountMl, 10) || 0);
      await AsyncStorage.setItem(`water_intake_${key}`, (newTotal / 1000).toFixed(1));
    } catch (e) {}

    dispatch({
      type: types.HYDRATION_ADD_LOG_SUCCESS,
      payload: {
        id: result?._id || result?.id || Date.now().toString(),
        amount: parseInt(amountMl, 10) || 0,
        timestamp: payload.timestamp,
        dateKey: key,
      },
    });
    return result;
  } catch (error) {
    dispatch({
      type: types.HYDRATION_ADD_LOG_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * Permanently delete a water log entry and update Redux store.
 */
export const removeWaterLog = (logId, amountMl, dateKey) => async (dispatch, getState) => {
  dispatch({ type: types.HYDRATION_DELETE_LOG_REQUEST });
  try {
    const key = dateKey || new Date().toISOString().split('T')[0];
    if (logId && !String(logId).startsWith('local_')) {
      try {
        await apiClient.delete(`/hydration/logs/${logId}`);
      } catch (apiError) {
        try {
          await apiClient.delete(`/diet/logs/${logId}`);
        } catch (fallbackError) {
          // Ignore fallback error if already deleted/offline
        }
      }
    }

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
  } catch (error) {
    dispatch({
      type: types.HYDRATION_DELETE_LOG_FAILURE,
      payload: error.message,
    });
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
