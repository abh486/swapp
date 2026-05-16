import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  sessions: [],
  exercises: [],
  bodyParts: [],
  muscles: [],
  equipments: [],
  nextCursor: null,
  hasNextPage: false,
  selectedEquipment: null,
  selectedMuscles: [],
};

const workoutReducer = (state = initialState, action) => {
  switch (action.type) {
    
    case types.WORKOUT_GET_EXERCISES_REQUEST:
      return { ...state, loading: !action.payload?.isLoadMore, error: null };
    case types.WORKOUT_GET_BODY_PARTS_REQUEST:
    case types.WORKOUT_GET_MUSCLES_REQUEST:
    case types.WORKOUT_GET_EQUIPMENTS_REQUEST:
      return { ...state, loading: true, error: null };

    case types.WORKOUT_GET_EXERCISES_SUCCESS:
      const isLoadMore = action.payload.isLoadMore;
      const newExercises = isLoadMore 
        ? [...state.exercises, ...action.payload.exercises] 
        : action.payload.exercises;
      return { 
        ...state, 
        loading: false, 
        exercises: newExercises,
        nextCursor: action.payload.meta?.nextCursor || null,
        hasNextPage: action.payload.meta?.hasNextPage || false,
      };
    case types.WORKOUT_GET_BODY_PARTS_SUCCESS:
      return { ...state, loading: false, bodyParts: action.payload };
    case types.WORKOUT_GET_MUSCLES_SUCCESS:
      return { ...state, loading: false, muscles: action.payload };
    case types.WORKOUT_GET_EQUIPMENTS_SUCCESS:
      return { ...state, loading: false, equipments: action.payload };

    case types.WORKOUT_GET_EXERCISES_FAILURE:
    case types.WORKOUT_GET_BODY_PARTS_FAILURE:
    case types.WORKOUT_GET_MUSCLES_FAILURE:
    case types.WORKOUT_GET_EQUIPMENTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

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

    // NEW: Set selected filters for navigation between screens
    case types.WORKOUT_SET_SELECTED_FILTERS:
      return {
        ...state,
        selectedEquipment: action.payload.equipment,
        selectedMuscles: action.payload.muscles,
      };

    // NEW: Clear filters when returning to default view
    case types.WORKOUT_CLEAR_SELECTED_FILTERS:
      return {
        ...state,
        selectedEquipment: null,
        selectedMuscles: [],
      };
    
    default:
      return state;
  }
};

export default workoutReducer;