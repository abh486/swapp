import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  sessions: [],
};

const workoutReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.WORKOUT_LOG_SESSION_REQUEST:
    case types.WORKOUT_DELETE_SESSION_REQUEST:
    case types.WORKOUT_DELETE_EXERCISE_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.WORKOUT_LOG_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        sessions: [...state.sessions, action.payload],
      };
    
    case types.WORKOUT_DELETE_SESSION_SUCCESS:
      return {
        ...state,
        loading: false,
        sessions: state.sessions.filter(session => session.id !== action.payload),
      };
    
    case types.WORKOUT_DELETE_EXERCISE_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.WORKOUT_LOG_SESSION_FAILURE:
    case types.WORKOUT_DELETE_SESSION_FAILURE:
    case types.WORKOUT_DELETE_EXERCISE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default workoutReducer;

