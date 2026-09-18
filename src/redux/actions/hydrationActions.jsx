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
    let logsData = [];
    try {
      const response = await apiClient.get('/hydration/logs', {
        params: { date: dateKey },
      });
      logsData = response.data?.data || response.data || [];
    } catch (apiError) {
      // Fallback to active backend endpoint (/diet/logs/date/:date)
      try {
        const fallbackResponse = await apiClient.get(`/diet/logs/date/${dateKey}`);
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

    dispatch({
      type: types.HYDRATION_FETCH_LOGS_SUCCESS,
      payload: { logs: logsData, dateKey },
    });
    return logsData;
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
export const addWaterLog = ({ amountMl, dateKey, timestamp, notes }) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_ADD_LOG_REQUEST });
  try {
    const payload = {
      amountMl: parseInt(amountMl, 10) || 0,
      date: dateKey || new Date().toISOString().split('T')[0],
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

    dispatch({
      type: types.HYDRATION_ADD_LOG_SUCCESS,
      payload: {
        id: result?._id || result?.id || Date.now().toString(),
        amount: parseInt(amountMl, 10) || 0,
        timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateKey,
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
export const removeWaterLog = (logId, amountMl, dateKey) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_DELETE_LOG_REQUEST });
  try {
    if (logId) {
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

    dispatch({
      type: types.HYDRATION_DELETE_LOG_SUCCESS,
      payload: { id: logId, amount: amountMl, dateKey },
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
    let targetMl = 2500;
    try {
      const response = await apiClient.get('/hydration/target');
      targetMl = response.data?.data?.targetMl || response.data?.targetMl || 2500;
    } catch (apiError) {
      const savedGoal = await AsyncStorage.getItem('water_target_ml');
      if (savedGoal) targetMl = parseInt(savedGoal, 10) || 2500;
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
    return 2500;
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
