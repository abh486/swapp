import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const fetchProducts = (params) => async (dispatch) => {
  dispatch({ type: types.SHOP_FETCH_PRODUCTS_REQUEST });
  try {
    const response = await apiClient.get('/products', { params });
    dispatch({
      type: types.SHOP_FETCH_PRODUCTS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching products in shopService:", error.message);
    dispatch({
      type: types.SHOP_FETCH_PRODUCTS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

