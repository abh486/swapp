import * as types from '../actionTypes/actionTypes';

const initialState = {
  logs: [],
  totalHours: 0,
  targetHours: 8.0,
  loading: false,
  error: null,
};

const sleepReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SLEEP_FETCH_LOGS_REQUEST:
    case types.SLEEP_ADD_LOG_REQUEST:
    case types.SLEEP_DELETE_LOG_REQUEST:
    case types.SLEEP_FETCH_TARGET_REQUEST:
    case types.SLEEP_SAVE_TARGET_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case types.SLEEP_FETCH_LOGS_SUCCESS: {
      const logs = action.payload.logs || [];
      const total = action.payload.totalHours !== undefined
        ? action.payload.totalHours
        : logs.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);

      return {
        ...state,
        logs,
        totalHours: total,
        loading: false,
      };
    }

    case types.SLEEP_ADD_LOG_SUCCESS: {
      const newEntry = action.payload;
      const filtered = state.logs.filter(item => item.id !== newEntry.id);
      const updatedLogs = [newEntry, ...filtered];
      const newTotal = updatedLogs.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
      return {
        ...state,
        logs: updatedLogs,
        totalHours: newTotal,
        loading: false,
      };
    }

    case types.SLEEP_DELETE_LOG_SUCCESS: {
      const { id } = action.payload;
      const updatedLogs = state.logs.filter((item) => item.id !== id);
      const newTotal = updatedLogs.reduce((sum, item) => sum + (parseFloat(item.duration) || 0), 0);
      return {
        ...state,
        logs: updatedLogs,
        totalHours: newTotal,
        loading: false,
      };
    }

    case types.SLEEP_FETCH_TARGET_SUCCESS:
    case types.SLEEP_SAVE_TARGET_SUCCESS:
      return {
        ...state,
        targetHours: action.payload,
        loading: false,
      };

    case types.SLEEP_FETCH_LOGS_FAILURE:
    case types.SLEEP_ADD_LOG_FAILURE:
    case types.SLEEP_DELETE_LOG_FAILURE:
    case types.SLEEP_FETCH_TARGET_FAILURE:
    case types.SLEEP_SAVE_TARGET_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default sleepReducer;
