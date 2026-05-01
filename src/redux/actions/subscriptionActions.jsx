import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const createCheckoutSession = (planId, planType) => async (dispatch) => {
  dispatch({ type: types.SUBSCRIPTION_CREATE_CHECKOUT_REQUEST });
  try {
    const response = await apiClient.post('/subscriptions/create-checkout-session', {
      planId,
      planType,
    });
    dispatch({
      type: types.SUBSCRIPTION_CREATE_CHECKOUT_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: types.SUBSCRIPTION_CREATE_CHECKOUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const createPortalSession = () => async (dispatch) => {
  dispatch({ type: types.SUBSCRIPTION_CREATE_PORTAL_REQUEST });
  try {
    const response = await apiClient.post('/subscriptions/portal-session');
    dispatch({
      type: types.SUBSCRIPTION_CREATE_PORTAL_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: types.SUBSCRIPTION_CREATE_PORTAL_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getMultiProviderTiers = () => async (dispatch) => {
  dispatch({ type: types.SUBSCRIPTION_GET_MULTI_PROVIDER_TIERS_REQUEST });
  try {
    const response = await apiClient.get('/admin/multi-provider-tiers');
    dispatch({
      type: types.SUBSCRIPTION_GET_MULTI_PROVIDER_TIERS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: types.SUBSCRIPTION_GET_MULTI_PROVIDER_TIERS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getUserProfile = () => async (dispatch) => {
  try {
    const response = await apiClient.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserCheckIns = () => async (dispatch) => {
  try {
    const response = await apiClient.get('/users/check-ins');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkInToProvider = (providerId) => async (dispatch) => {
  try {
    const response = await apiClient.post('/providers/check-in', { providerId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkOutFromProvider = (checkInId) => async (dispatch) => {
  try {
    const response = await apiClient.patch(`/providers/check-out/${checkInId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

