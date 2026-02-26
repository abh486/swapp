import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  gyms: [],
  discoveredGyms: [],
  gymDetails: null,
  checkIns: [],
};

const gymsReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.GYMS_GET_BY_PLAN_IDS_REQUEST:
    case types.GYMS_CHECK_IN_REQUEST:
    case types.GYMS_CHECK_OUT_REQUEST:
    case types.GYMS_GET_USER_CHECK_INS_REQUEST:
    case types.GYMS_DISCOVER_REQUEST:
    case types.GYMS_GET_DETAILS_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.GYMS_GET_BY_PLAN_IDS_SUCCESS:
      return {
        ...state,
        loading: false,
        gyms: action.payload,
      };
    
    case types.GYMS_CHECK_IN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.GYMS_CHECK_OUT_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.GYMS_GET_USER_CHECK_INS_SUCCESS:
      return {
        ...state,
        loading: false,
        checkIns: action.payload,
      };
    
    case types.GYMS_DISCOVER_SUCCESS:
      return {
        ...state,
        loading: false,
        discoveredGyms: action.payload,
      };
    
    case types.GYMS_GET_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        gymDetails: action.payload,
      };
    
    case types.GYMS_GET_BY_PLAN_IDS_FAILURE:
    case types.GYMS_CHECK_IN_FAILURE:
    case types.GYMS_CHECK_OUT_FAILURE:
    case types.GYMS_GET_USER_CHECK_INS_FAILURE:
    case types.GYMS_DISCOVER_FAILURE:
    case types.GYMS_GET_DETAILS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default gymsReducer;

