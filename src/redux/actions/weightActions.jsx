import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const fetchWeightLogs = () => async (dispatch) => {
  dispatch({ type: types.WEIGHT_FETCH_LOGS_REQUEST });
  try {
    const res = await apiClient.get('/weight/logs');
    const logs = res.data?.data || res.data || [];
    dispatch({
      type: types.WEIGHT_FETCH_LOGS_SUCCESS,
      payload: logs,
    });
    return logs;
  } catch (error) {
    dispatch({
      type: types.WEIGHT_FETCH_LOGS_FAILURE,
      payload: error.message,
    });
    return [];
  }
};

export const addWeightLog = ({ value, date, timestamp }) => async (dispatch) => {
  dispatch({ type: types.WEIGHT_ADD_LOG_REQUEST });
  const ts = timestamp || Date.now();
  try {
    const res = await apiClient.post('/weight/logs', { value, date, timestamp: ts });
    const result = res.data?.data || res.data;
    const logItem = {
      id: result?.id || result?._id || Date.now().toString(),
      value: parseFloat(value),
      date: date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: ts,
      source: 'Database',
    };
    dispatch({
      type: types.WEIGHT_ADD_LOG_SUCCESS,
      payload: logItem,
    });
    return result;
  } catch (error) {
    console.warn('[weightActions] addWeightLog network error, applying locally:', error.message);
    const logItem = {
      id: Date.now().toString(),
      value: parseFloat(value),
      date: date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      timestamp: ts,
      source: 'Local',
    };
    dispatch({
      type: types.WEIGHT_ADD_LOG_SUCCESS,
      payload: logItem,
    });
    return logItem;
  }
};

export const removeWeightLog = (logId) => async (dispatch) => {
  dispatch({ type: types.WEIGHT_DELETE_LOG_REQUEST });
  try {
    await apiClient.delete(`/weight/logs/${logId}`);
    dispatch({
      type: types.WEIGHT_DELETE_LOG_SUCCESS,
      payload: logId,
    });
  } catch (error) {
    dispatch({
      type: types.WEIGHT_DELETE_LOG_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const fetchWeightTarget = () => async (dispatch) => {
  dispatch({ type: types.WEIGHT_FETCH_TARGET_REQUEST });
  try {
    const res = await apiClient.get('/weight/target');
    const data = res.data?.data || res.data || {};
    dispatch({
      type: types.WEIGHT_FETCH_TARGET_SUCCESS,
      payload: data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.WEIGHT_FETCH_TARGET_FAILURE,
      payload: error.message,
    });
    return {};
  }
};

export const saveWeightTarget = (payload) => async (dispatch) => {
  dispatch({ type: types.WEIGHT_SAVE_TARGET_REQUEST });
  try {
    const res = await apiClient.post('/weight/target', payload);
    const result = res.data?.data || res.data;
    dispatch({
      type: types.WEIGHT_SAVE_TARGET_SUCCESS,
      payload: result || payload,
    });
    return result;
  } catch (error) {
    console.warn('[weightActions] saveWeightTarget network error, applying locally:', error.message);
    dispatch({
      type: types.WEIGHT_SAVE_TARGET_SUCCESS,
      payload: payload,
    });
    return payload;
  }
};
