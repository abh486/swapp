import apiClient from '../../api/apiClient';
import parseApiError from '../../utils/parseApiError';
import * as types from '../actionTypes/actionTypes';

export const getProvidersByPlanIds = (planIds) => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_GET_BY_PLAN_IDS_REQUEST });
  try {
    const response = await apiClient.post('/providers/by-plan-ids', { planIds });
    dispatch({
      type: types.PROVIDERS_GET_BY_PLAN_IDS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching providers by plan IDs:', error);
    dispatch({
      type: types.PROVIDERS_GET_BY_PLAN_IDS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const checkInToProvider = (providerId) => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_CHECK_IN_REQUEST });
  try {
    const response = await apiClient.post(`/providers/${providerId}/check-in`);
    dispatch({
      type: types.PROVIDERS_CHECK_IN_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking in to provider:', error);
    dispatch({
      type: types.PROVIDERS_CHECK_IN_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const checkOutFromProvider = (checkInId) => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_CHECK_OUT_REQUEST });
  try {
    const response = await apiClient.post(`/providers/check-ins/${checkInId}/check-out`);
    dispatch({
      type: types.PROVIDERS_CHECK_OUT_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error checking out from provider:', error);
    dispatch({
      type: types.PROVIDERS_CHECK_OUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getUserCheckIns = () => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_GET_USER_CHECK_INS_REQUEST });
  try {
    const response = await apiClient.get('/providers/check-ins');
    dispatch({
      type: types.PROVIDERS_GET_USER_CHECK_INS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user check-ins:', error);
    dispatch({
      type: types.PROVIDERS_GET_USER_CHECK_INS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const discoverProviders = (params) => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_DISCOVER_REQUEST });
  try {
    console.log('[ProviderService] Discovering providers with params:', params);
    
    const response = await apiClient.get('/providers/discover', { params });
    
    let result;
    if (!response.data) {
      result = {
        success: true,
        message: 'No providers found in your area',
        data: []
      };
    } else if (response.data.success !== undefined) {
      result = response.data;
    } else if (Array.isArray(response.data)) {
      result = {
        success: true,
        message: response.data.length > 0 ? 'Providers found' : 'No providers found in your area',
        data: response.data
      };
    } else {
      result = {
        success: true,
        message: 'Providers found',
        data: response.data.data || response.data.providers || []
      };
    }
    
    dispatch({
      type: types.PROVIDERS_DISCOVER_SUCCESS,
      payload: result.data,
    });
    
    return result;
  } catch (error) {
    console.error('[ProviderService] Discover providers error:', error);
    
    let result = {
      success: false,
      message: parseApiError(error),
      data: []
    };
    
    dispatch({
      type: types.PROVIDERS_DISCOVER_FAILURE,
      payload: result.message,
    });
    
    return result;
  }
};

export const getProviderDetails = (providerId) => async (dispatch) => {
  dispatch({ type: types.PROVIDERS_GET_DETAILS_REQUEST });
  try {
    console.log('[ProviderService] Getting provider details for:', providerId);
    
    const response = await apiClient.get(`/providers/profile/${providerId}`);
    
    dispatch({
      type: types.PROVIDERS_GET_DETAILS_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('[ProviderService] Get provider details error:', error);
    
    let result = {
      success: false,
      message: parseApiError(error),
      data: null
    };
    
    dispatch({
      type: types.PROVIDERS_GET_DETAILS_FAILURE,
      payload: result.message,
    });
    
    return result;
  }
};

export const getProviderReviews = (providerId) => async (dispatch) => {
  try {
    const response = await apiClient.get(`/v1/reviews/provider/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('[ProviderService] Get provider reviews error:', error);
    return {
      success: false,
      message: parseApiError(error),
      data: null
    };
  }
};

export const submitProviderReview = (reviewData) => async (dispatch) => {
  try {
    const response = await apiClient.post('/v1/reviews', reviewData);
    return response.data;
  } catch (error) {
    console.error('[ProviderService] Submit review error:', error);
    return {
      success: false,
      message: parseApiError(error),
      data: null
    };
  }
};
