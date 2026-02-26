import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const getUserProfile = () => async (dispatch) => {
  dispatch({ type: types.PROFILE_GET_USER_REQUEST });
  try {
    const response = await apiClient.get('/profile');
    dispatch({
      type: types.PROFILE_GET_USER_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    dispatch({
      type: types.PROFILE_GET_USER_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

