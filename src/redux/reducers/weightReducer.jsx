import * as types from '../actionTypes/actionTypes';

const initialState = {
  logs: [],
  targetWeight: null,
  height: null,
  startingValue: null,
  loading: false,
  error: null,
};

const weightReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.WEIGHT_FETCH_LOGS_REQUEST:
    case types.WEIGHT_ADD_LOG_REQUEST:
    case types.WEIGHT_DELETE_LOG_REQUEST:
    case types.WEIGHT_FETCH_TARGET_REQUEST:
    case types.WEIGHT_SAVE_TARGET_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case types.WEIGHT_FETCH_LOGS_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: (Array.isArray(action.payload) ? action.payload : []).slice().sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime())),
      };

    case types.WEIGHT_ADD_LOG_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: [...state.logs, action.payload].sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime())),
      };

    case types.WEIGHT_DELETE_LOG_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: state.logs.filter((item) => item.id !== action.payload && item._id !== action.payload),
      };

    case types.WEIGHT_FETCH_TARGET_SUCCESS:
      return {
        ...state,
        loading: false,
        targetWeight: action.payload?.targetWeight !== undefined && action.payload?.targetWeight !== null ? action.payload.targetWeight : state.targetWeight,
        height: action.payload?.height !== undefined && action.payload?.height !== null ? action.payload.height : state.height,
        startingValue: action.payload?.startingValue !== undefined && action.payload?.startingValue !== null ? action.payload.startingValue : state.startingValue,
      };

    case types.WEIGHT_SAVE_TARGET_SUCCESS:
      return {
        ...state,
        loading: false,
        ...(action.payload?.targetWeight !== undefined ? { targetWeight: action.payload.targetWeight } : {}),
        ...(action.payload?.height !== undefined ? { height: action.payload.height } : {}),
        ...(action.payload?.startingValue !== undefined ? { startingValue: action.payload.startingValue } : {}),
      };

    case types.WEIGHT_FETCH_LOGS_FAILURE:
    case types.WEIGHT_ADD_LOG_FAILURE:
    case types.WEIGHT_DELETE_LOG_FAILURE:
    case types.WEIGHT_FETCH_TARGET_FAILURE:
    case types.WEIGHT_SAVE_TARGET_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default weightReducer;
