import * as types from '../actionTypes/actionTypes';
import {
  fetchSleepLogs as apiFetchLogs,
  fetchWeeklySleep as apiFetchWeekly,
  logSleepEntry as apiLogSleep,
  deleteSleepEntry as apiDeleteSleep,
  fetchSleepTarget as apiFetchTarget,
  saveSleepTarget as apiSaveTarget,
} from '../../api/sleepApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchSleepLogs = (dateKey) => async (dispatch) => {
  dispatch({ type: types.SLEEP_FETCH_LOGS_REQUEST });
  try {
    const data = await apiFetchLogs(dateKey);
    dispatch({
      type: types.SLEEP_FETCH_LOGS_SUCCESS,
      payload: { logs: data.logs, totalHours: data.totalHours, dateKey },
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.SLEEP_FETCH_LOGS_FAILURE,
      payload: error.message,
    });
    return { logs: [], totalHours: 0 };
  }
};

export const addSleepLog = (payload) => async (dispatch) => {
  dispatch({ type: types.SLEEP_ADD_LOG_REQUEST });
  try {
    const result = await apiLogSleep(payload);
    dispatch({
      type: types.SLEEP_ADD_LOG_SUCCESS,
      payload: result,
    });
    return result;
  } catch (error) {
    dispatch({
      type: types.SLEEP_ADD_LOG_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const removeSleepLog = (logId, dateKey) => async (dispatch) => {
  dispatch({ type: types.SLEEP_DELETE_LOG_REQUEST });
  try {
    await apiDeleteSleep(logId);
    dispatch({
      type: types.SLEEP_DELETE_LOG_SUCCESS,
      payload: { id: logId, dateKey },
    });
  } catch (error) {
    dispatch({
      type: types.SLEEP_DELETE_LOG_FAILURE,
      payload: error.message,
    });
  }
};

export const getSleepTarget = () => async (dispatch) => {
  dispatch({ type: types.SLEEP_FETCH_TARGET_REQUEST });
  try {
    const targetHours = await apiFetchTarget();
    dispatch({
      type: types.SLEEP_FETCH_TARGET_SUCCESS,
      payload: targetHours,
    });
    return targetHours;
  } catch (error) {
    dispatch({
      type: types.SLEEP_FETCH_TARGET_FAILURE,
      payload: error.message,
    });
    return 8.0;
  }
};

export const setSleepTarget = (targetHours) => async (dispatch) => {
  dispatch({ type: types.SLEEP_SAVE_TARGET_REQUEST });
  try {
    await apiSaveTarget(targetHours);
    await AsyncStorage.setItem('sleep_target_hours', String(targetHours));
    dispatch({
      type: types.SLEEP_SAVE_TARGET_SUCCESS,
      payload: parseFloat(targetHours),
    });
  } catch (error) {
    dispatch({
      type: types.SLEEP_SAVE_TARGET_FAILURE,
      payload: error.message,
    });
  }
};
