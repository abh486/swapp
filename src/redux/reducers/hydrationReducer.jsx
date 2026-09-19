import * as types from '../actionTypes/actionTypes';

const initialState = {
  logs: [],
  totalMl: 0,
  targetMl: 4000,
  loading: false,
  error: null,
};

const hydrationReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.HYDRATION_FETCH_LOGS_REQUEST:
    case types.HYDRATION_ADD_LOG_REQUEST:
    case types.HYDRATION_DELETE_LOG_REQUEST:
    case types.HYDRATION_FETCH_TARGET_REQUEST:
    case types.HYDRATION_SET_TARGET_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case types.HYDRATION_FETCH_LOGS_SUCCESS: {
      const logs = action.payload.logs || [];
      const formatted = logs.map((item) => ({
        id: item.id || item._id,
        amount: item.amount || item.amountMl || item.waterVolumeMl || item.calories || 250,
        timestamp: item.timestamp || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM'),
      }));
      const total = action.payload.totalMl !== undefined ? action.payload.totalMl : formatted.reduce((sum, item) => sum + item.amount, 0);

      return {
        ...state,
        logs: formatted,
        totalMl: total,
        loading: false,
      };
    }

    case types.HYDRATION_ADD_LOG_SUCCESS: {
      const newEntry = action.payload;
      const updatedLogs = [newEntry, ...state.logs];
      const newTotal = state.totalMl + newEntry.amount;
      return {
        ...state,
        logs: updatedLogs,
        totalMl: newTotal,
        loading: false,
      };
    }

    case types.HYDRATION_DELETE_LOG_SUCCESS: {
      const { id, amount } = action.payload;
      const updatedLogs = state.logs.filter((item) => item.id !== id);
      const newTotal = Math.max(0, state.totalMl - (amount || 0));
      return {
        ...state,
        logs: updatedLogs,
        totalMl: newTotal,
        loading: false,
      };
    }

    case types.HYDRATION_FETCH_TARGET_SUCCESS:
    case types.HYDRATION_SET_TARGET_SUCCESS:
      return {
        ...state,
        targetMl: action.payload === 2500 ? 4000 : action.payload,
        loading: false,
      };

    case types.HYDRATION_FETCH_LOGS_FAILURE:
    case types.HYDRATION_ADD_LOG_FAILURE:
    case types.HYDRATION_DELETE_LOG_FAILURE:
    case types.HYDRATION_FETCH_TARGET_FAILURE:
    case types.HYDRATION_SET_TARGET_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default hydrationReducer;
