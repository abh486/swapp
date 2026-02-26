import apiClient from '../../api/apiClient';
import parseApiError from '../../utils/parseApiError';
import * as types from '../actionTypes/actionTypes';

export const getGymsByPlanIds = (planIds) => async (dispatch) => {
  dispatch({ type: types.GYMS_GET_BY_PLAN_IDS_REQUEST });
  try {
    const response = await apiClient.post('/gyms/by-plan-ids', { planIds });
    dispatch({
      type: types.GYMS_GET_BY_PLAN_IDS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching gyms by plan IDs:', error);
    dispatch({
      type: types.GYMS_GET_BY_PLAN_IDS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const checkInToGym = (gymId) => async (dispatch) => {
  dispatch({ type: types.GYMS_CHECK_IN_REQUEST });
  try {
    const response = await apiClient.post(`/gyms/${gymId}/check-in`);
    dispatch({
      type: types.GYMS_CHECK_IN_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking in to gym:', error);
    dispatch({
      type: types.GYMS_CHECK_IN_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const checkOutFromGym = (checkInId) => async (dispatch) => {
  dispatch({ type: types.GYMS_CHECK_OUT_REQUEST });
  try {
    const response = await apiClient.post(`/gyms/check-ins/${checkInId}/check-out`);
    dispatch({
      type: types.GYMS_CHECK_OUT_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking out from gym:', error);
    dispatch({
      type: types.GYMS_CHECK_OUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getUserCheckIns = () => async (dispatch) => {
  dispatch({ type: types.GYMS_GET_USER_CHECK_INS_REQUEST });
  try {
    const response = await apiClient.get('/gyms/check-ins');
    dispatch({
      type: types.GYMS_GET_USER_CHECK_INS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user check-ins:', error);
    dispatch({
      type: types.GYMS_GET_USER_CHECK_INS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const discoverGyms = (params) => async (dispatch) => {
  dispatch({ type: types.GYMS_DISCOVER_REQUEST });
  try {
    console.log('[GymService] Discovering gyms with params:', params);
    
    const response = await apiClient.get('/gyms/discover', { params });
    console.log('[GymService] Raw API response:', response);
    console.log('[GymService] Response data:', response.data);
    
    let result;
    if (!response.data) {
      result = {
        success: true,
        message: 'No gyms found in your area',
        data: []
      };
    } else if (response.data.success !== undefined) {
      result = response.data;
    } else if (Array.isArray(response.data)) {
      result = {
        success: true,
        message: response.data.length > 0 ? 'Gyms found' : 'No gyms found in your area',
        data: response.data
      };
    } else if (typeof response.data === 'string') {
      result = {
        success: true,
        message: response.data,
        data: []
      };
    } else if (typeof response.data === 'object' && response.data !== null) {
      if (response.data.data !== undefined) {
        result = {
          success: true,
          message: response.data.message || 'Gyms found',
          data: Array.isArray(response.data.data) ? response.data.data : []
        };
      } else if (response.data.gyms !== undefined) {
        result = {
          success: true,
          message: response.data.message || 'Gyms found',
          data: Array.isArray(response.data.gyms) ? response.data.gyms : []
        };
      } else if (response.data.id || response.data.name) {
        result = {
          success: true,
          message: 'Gym found',
          data: [response.data]
        };
      } else {
        result = {
          success: true,
          message: 'No gyms found in your area',
          data: []
        };
      }
    } else {
      result = {
        success: true,
        message: 'No gyms found in your area',
        data: []
      };
    }
    
    dispatch({
      type: types.GYMS_DISCOVER_SUCCESS,
      payload: result.data,
    });
    
    return result;
  } catch (error) {
    console.error('[GymService] Discover gyms error:', error);
    
    let result;
    if (error.code === 'ECONNABORTED') {
      result = {
        success: false,
        message: 'Request timeout - please try again',
        data: []
      };
    } else if (!error.response) {
      result = {
        success: false,
        message: 'Network error - please check your connection',
        data: []
      };
    } else if (error.response.status === 404) {
      result = {
        success: true,
        message: 'No gyms found in your area',
        data: []
      };
    } else if (error.response.status === 200) {
      result = {
        success: true,
        message: 'Gyms found',
        data: Array.isArray(error.response.data) ? error.response.data : []
      };
    } else {
      result = {
        success: false,
        message: parseApiError(error),
        data: []
      };
    }
    
    dispatch({
      type: types.GYMS_DISCOVER_FAILURE,
      payload: result.message,
    });
    
    return result;
  }
};

export const getGymDetails = (gymId) => async (dispatch) => {
  dispatch({ type: types.GYMS_GET_DETAILS_REQUEST });
  try {
    console.log('[GymService] Getting gym details for:', gymId);
    
    const response = await apiClient.get(`/gyms/profile/${gymId}`);
    console.log('[GymService] Gym details response:', response.data);
    
    dispatch({
      type: types.GYMS_GET_DETAILS_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('[GymService] Get gym details error:', error);
    
    let result;
    if (error.code === 'ECONNABORTED') {
      result = {
        success: false,
        message: 'Request timeout - please try again',
        data: null
      };
    } else if (!error.response) {
      result = {
        success: false,
        message: 'Network error - please check your connection',
        data: null
      };
    } else {
      result = {
        success: false,
        message: parseApiError(error),
        data: null
      };
    }
    
    dispatch({
      type: types.GYMS_GET_DETAILS_FAILURE,
      payload: result.message,
    });
    
    return result;
  }
};

