import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  providers: [],
  discoveredProviders: [],
  providerDetails: null,
  checkIns: [],
};

const providersReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.PROVIDERS_GET_BY_PLAN_IDS_REQUEST:
    case types.PROVIDERS_CHECK_IN_REQUEST:
    case types.PROVIDERS_CHECK_OUT_REQUEST:
    case types.PROVIDERS_GET_USER_CHECK_INS_REQUEST:
    case types.PROVIDERS_DISCOVER_REQUEST:
    case types.PROVIDERS_GET_DETAILS_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.PROVIDERS_GET_BY_PLAN_IDS_SUCCESS:
      return {
        ...state,
        loading: false,
        providers: action.payload,
      };
    
    case types.PROVIDERS_CHECK_IN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.PROVIDERS_CHECK_OUT_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.PROVIDERS_GET_USER_CHECK_INS_SUCCESS:
      return {
        ...state,
        loading: false,
        checkIns: action.payload,
      };
    
    case types.PROVIDERS_DISCOVER_SUCCESS:
      return {
        ...state,
        loading: false,
        discoveredProviders: action.payload,
      };
    
    case types.PROVIDERS_GET_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        providerDetails: action.payload,
      };
    
    case types.PROVIDERS_GET_BY_PLAN_IDS_FAILURE:
    case types.PROVIDERS_CHECK_IN_FAILURE:
    case types.PROVIDERS_CHECK_OUT_FAILURE:
    case types.PROVIDERS_GET_USER_CHECK_INS_FAILURE:
    case types.PROVIDERS_DISCOVER_FAILURE:
    case types.PROVIDERS_GET_DETAILS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default providersReducer;
