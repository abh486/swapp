import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  multiProviders: [],
  checkInHistory: [],
};

const multiProviderReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.MULTI_PROVIDER_GET_ALL_REQUEST:
    case types.MULTI_PROVIDER_CHECK_IN_REQUEST:
    case types.MULTI_PROVIDER_CHECK_OUT_REQUEST:
    case types.MULTI_PROVIDER_GET_HISTORY_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.MULTI_PROVIDER_GET_ALL_SUCCESS:
      return {
        ...state,
        loading: false,
        multiProviders: action.payload,
      };
    
    case types.MULTI_PROVIDER_CHECK_IN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.MULTI_PROVIDER_CHECK_OUT_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.MULTI_PROVIDER_GET_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        checkInHistory: action.payload,
      };
    
    case types.MULTI_PROVIDER_GET_ALL_FAILURE:
    case types.MULTI_PROVIDER_CHECK_IN_FAILURE:
    case types.MULTI_PROVIDER_CHECK_OUT_FAILURE:
    case types.MULTI_PROVIDER_GET_HISTORY_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default multiProviderReducer;
