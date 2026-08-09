// src/redux/actions/homeActions.jsx
import * as types from '../actionTypes/actionTypes';
import * as homeApi from '../../api/homeApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHED_HOME_FEED_KEY = '@cached_home_feed';

export const getHomeFeed = (lat, lng, vertical) => async (dispatch, getState) => {
  const currentState = getState()?.home;
  if (!currentState?.feed) {
    try {
      const cachedData = await AsyncStorage.getItem(CACHED_HOME_FEED_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        dispatch({
          type: types.HOME_GET_FEED_SUCCESS,
          payload: parsed,
        });
      }
    } catch (e) {
      console.log('[homeActions] Error loading cached home feed:', e.message);
    }
  }

  dispatch({ type: types.HOME_GET_FEED_REQUEST });
  try {
    const data = await homeApi.fetchHomeFeed(lat, lng, vertical);
    dispatch({
      type: types.HOME_GET_FEED_SUCCESS,
      payload: data,
    });
    if (data) {
      AsyncStorage.setItem(CACHED_HOME_FEED_KEY, JSON.stringify(data)).catch(() => {});
    }
    return data;
  } catch (error) {
    dispatch({
      type: types.HOME_GET_FEED_FAILURE,
      payload: error.message || 'Failed to fetch home feed',
    });
    throw error;
  }
};

export const setActiveCategory = (id, vertical) => ({
  type: types.HOME_SET_ACTIVE_CATEGORY,
  payload: { id, vertical },
});
