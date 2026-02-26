import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  logs: [],
  logsByDate: {},
};

const dietReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.DIET_SAVE_ENTRY_REQUEST:
    case types.DIET_UPDATE_LOG_REQUEST:
    case types.DIET_GET_LOGS_BY_DATE_REQUEST:
    case types.DIET_DELETE_LOG_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.DIET_SAVE_ENTRY_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: [...state.logs, action.payload],
      };
    
    case types.DIET_UPDATE_LOG_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: state.logs.map(log => 
          log.id === action.payload.id ? action.payload : log
        ),
      };
    
    case types.DIET_GET_LOGS_BY_DATE_SUCCESS:
      return {
        ...state,
        loading: false,
        logsByDate: {
          ...state.logsByDate,
          [action.meta?.date]: action.payload,
        },
      };
    
    case types.DIET_DELETE_LOG_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: state.logs.filter(log => log.id !== action.payload),
      };
    
    case types.DIET_SAVE_ENTRY_FAILURE:
    case types.DIET_UPDATE_LOG_FAILURE:
    case types.DIET_GET_LOGS_BY_DATE_FAILURE:
    case types.DIET_DELETE_LOG_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default dietReducer;

