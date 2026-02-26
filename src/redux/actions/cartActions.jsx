import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const fetchCart = () => async (dispatch) => {
  dispatch({ type: types.CART_FETCH_REQUEST });
  try {
    const response = await apiClient.get('/cart');
    dispatch({
      type: types.CART_FETCH_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    dispatch({
      type: types.CART_FETCH_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const addToCart = (productId, quantity = 1) => async (dispatch) => {
  dispatch({ type: types.CART_ADD_ITEM_REQUEST });
  try {
    const response = await apiClient.post('/cart', { productId, quantity });
    dispatch({
      type: types.CART_ADD_ITEM_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    dispatch({
      type: types.CART_ADD_ITEM_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const updateCartItem = (cartItemId, quantity) => async (dispatch) => {
  dispatch({ type: types.CART_UPDATE_ITEM_REQUEST });
  try {
    const response = await apiClient.patch(`/cart/${cartItemId}`, { quantity });
    dispatch({
      type: types.CART_UPDATE_ITEM_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    dispatch({
      type: types.CART_UPDATE_ITEM_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const removeFromCart = (cartItemId) => async (dispatch) => {
  dispatch({ type: types.CART_REMOVE_ITEM_REQUEST });
  try {
    await apiClient.delete(`/cart/${cartItemId}`);
    dispatch({
      type: types.CART_REMOVE_ITEM_SUCCESS,
      payload: cartItemId,
    });
  } catch (error) {
    dispatch({
      type: types.CART_REMOVE_ITEM_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const createCheckout = () => async (dispatch) => {
  dispatch({ type: types.CART_CREATE_CHECKOUT_REQUEST });
  try {
    const response = await apiClient.post('/cart/checkout');
    dispatch({
      type: types.CART_CREATE_CHECKOUT_SUCCESS,
      payload: response.data.data.checkoutUrl,
    });
    return response.data.data.checkoutUrl;
  } catch (error) {
    dispatch({
      type: types.CART_CREATE_CHECKOUT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

