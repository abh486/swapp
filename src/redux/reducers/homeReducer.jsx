// src/redux/reducers/homeReducer.jsx
import * as types from '../actionTypes/actionTypes';

const initialState = {
  feed: null,
  loading: false,
  error: null
};

const homeReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.HOME_GET_FEED_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.HOME_GET_FEED_SUCCESS:
      return {
        ...state,
        loading: false,
        feed: action.payload,
        error: null
      };
    case types.HOME_GET_FEED_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

export default homeReducer;
