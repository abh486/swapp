import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const getAllMultiGyms = () => async (dispatch) => {
  dispatch({ type: types.MULTIGYM_GET_ALL_REQUEST });
  try {
    const response = await apiClient.get('/gyms/multi-gym-list');
    dispatch({
      type: types.MULTIGYM_GET_ALL_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching multi-gym list:', error);
    dispatch({
      type: types.MULTIGYM_GET_ALL_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const multiGymCheckIn = (gymId) => async (dispatch) => {
  dispatch({ type: types.MULTIGYM_CHECK_IN_REQUEST });
  try {
    const response = await apiClient.post('/gyms/multi-gym/check-in', { gymId });
    dispatch({
      type: types.MULTIGYM_CHECK_IN_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking in to multi-gym:', error);
    dispatch({
      type: types.MULTIGYM_CHECK_IN_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const multiGymCheckOut = (checkInId) => async (dispatch) => {
  dispatch({ type: types.MULTIGYM_CHECK_OUT_REQUEST });
  try {
    const response = await apiClient.patch(`/gyms/multi-gym/check-out/${checkInId}`);
    dispatch({
      type: types.MULTIGYM_CHECK_OUT_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking out from multi-gym:', error);
    dispatch({
      type: types.MULTIGYM_CHECK_OUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getMultiGymCheckInHistory = () => async (dispatch) => {
  dispatch({ type: types.MULTIGYM_GET_HISTORY_REQUEST });
  try {
    const response = await apiClient.get('/gyms/multi-gym/check-in-history');
    dispatch({
      type: types.MULTIGYM_GET_HISTORY_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching multi-gym check-in history:', error);
    dispatch({
      type: types.MULTIGYM_GET_HISTORY_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

