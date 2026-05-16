// src/redux/actions/homeActions.jsx
import * as types from '../actionTypes/actionTypes';
import * as homeApi from '../../api/homeApi';

export const getHomeFeed = (lat, lng, vertical) => async (dispatch) => {
  dispatch({ type: types.HOME_GET_FEED_REQUEST });
  try {
    const data = await homeApi.fetchHomeFeed(lat, lng, vertical);
    dispatch({
      type: types.HOME_GET_FEED_SUCCESS,
      payload: data
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.HOME_GET_FEED_FAILURE,
      payload: error.message || 'Failed to fetch home feed'
    });
    throw error;
  }
};

export const setActiveCategory = (id, vertical) => ({
  type: types.HOME_SET_ACTIVE_CATEGORY,
  payload: { id, vertical }
});
