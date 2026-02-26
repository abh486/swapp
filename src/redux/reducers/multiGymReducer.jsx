import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  multiGyms: [],
  checkInHistory: [],
};

const multiGymReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.MULTIGYM_GET_ALL_REQUEST:
    case types.MULTIGYM_CHECK_IN_REQUEST:
    case types.MULTIGYM_CHECK_OUT_REQUEST:
    case types.MULTIGYM_GET_HISTORY_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.MULTIGYM_GET_ALL_SUCCESS:
      return {
        ...state,
        loading: false,
        multiGyms: action.payload,
      };
    
    case types.MULTIGYM_CHECK_IN_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.MULTIGYM_CHECK_OUT_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.MULTIGYM_GET_HISTORY_SUCCESS:
      return {
        ...state,
        loading: false,
        checkInHistory: action.payload,
      };
    
    case types.MULTIGYM_GET_ALL_FAILURE:
    case types.MULTIGYM_CHECK_IN_FAILURE:
    case types.MULTIGYM_CHECK_OUT_FAILURE:
    case types.MULTIGYM_GET_HISTORY_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default multiGymReducer;

