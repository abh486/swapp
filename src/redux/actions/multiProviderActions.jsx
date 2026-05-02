import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const getAllMultiProviders = () => async (dispatch) => {
  dispatch({ type: types.MULTI_PROVIDER_GET_ALL_REQUEST });
  try {
    const response = await apiClient.get('/providers/multi-provider-list');
    dispatch({
      type: types.MULTI_PROVIDER_GET_ALL_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching multi-provider list:', error);
    dispatch({
      type: types.MULTI_PROVIDER_GET_ALL_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const multiProviderCheckIn = (providerId) => async (dispatch) => {
  dispatch({ type: types.MULTI_PROVIDER_CHECK_IN_REQUEST });
  try {
    const response = await apiClient.post('/providers/multi-provider/check-in', { providerId });
    dispatch({
      type: types.MULTI_PROVIDER_CHECK_IN_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking in to multi-provider:', error);
    dispatch({
      type: types.MULTI_PROVIDER_CHECK_IN_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const multiProviderCheckOut = (checkInId) => async (dispatch) => {
  dispatch({ type: types.MULTI_PROVIDER_CHECK_OUT_REQUEST });
  try {
    const response = await apiClient.patch(`/providers/multi-provider/check-out/${checkInId}`);
    dispatch({
      type: types.MULTI_PROVIDER_CHECK_OUT_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking out from multi-provider:', error);
    dispatch({
      type: types.MULTI_PROVIDER_CHECK_OUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getMultiProviderCheckInHistory = () => async (dispatch) => {
  dispatch({ type: types.MULTI_PROVIDER_GET_HISTORY_REQUEST });
  try {
    const response = await apiClient.get('/providers/multi-provider/check-in-history');
    dispatch({
      type: types.MULTI_PROVIDER_GET_HISTORY_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching multi-provider check-in history:', error);
    dispatch({
      type: types.MULTI_PROVIDER_GET_HISTORY_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};
