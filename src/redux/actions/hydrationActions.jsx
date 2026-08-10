import * as types from '../actionTypes/actionTypes';
import {
  fetchHydrationLogs as apiFetchLogs,
  logWaterIntake as apiLogWater,
  deleteWaterLog as apiDeleteLog,
  fetchHydrationTarget as apiFetchTarget,
  saveHydrationTarget as apiSaveTarget,
} from '../../api/hydrationApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchHydrationLogs = (dateKey) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_FETCH_LOGS_REQUEST });
  try {
    const logsData = await apiFetchLogs(dateKey);
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

export const addWaterLog = ({ amountMl, dateKey, timestamp, notes }) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_ADD_LOG_REQUEST });
  try {
    const result = await apiLogWater({ amountMl, date: dateKey, timestamp, notes });
    dispatch({
      type: types.HYDRATION_ADD_LOG_SUCCESS,
      payload: {
        id: result?._id || result?.id || Date.now().toString(),
        amount: parseInt(amountMl, 10),
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

export const removeWaterLog = (logId, amountMl, dateKey) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_DELETE_LOG_REQUEST });
  try {
    await apiDeleteLog(logId);
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

export const getHydrationTarget = () => async (dispatch) => {
  dispatch({ type: types.HYDRATION_FETCH_TARGET_REQUEST });
  try {
    const targetMl = await apiFetchTarget();
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

export const setHydrationTarget = (targetMl) => async (dispatch) => {
  dispatch({ type: types.HYDRATION_SET_TARGET_REQUEST });
  try {
    await apiSaveTarget(targetMl);
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
