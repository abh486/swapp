import * as types from '../actionTypes/actionTypes';

const initialState = {
  exercises: [],
  selectedExercise: null,
  searchResults: [],
  muscles: [],
  bodyParts: [],
  equipments: [],
  exerciseTypes: [],
  warmups: [],
  routines: [],
  loading: false,
  error: null,
};

const exerciseReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.EXERCISE_FETCH_LIST_REQUEST:
    case types.EXERCISE_SEARCH_REQUEST:
    case types.EXERCISE_FETCH_BY_ID_REQUEST:
    case types.EXERCISE_FETCH_METADATA_REQUEST:
    case types.EXERCISE_FETCH_ROUTINES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case types.EXERCISE_FETCH_LIST_SUCCESS:
      return {
        ...state,
        exercises: action.payload,
        loading: false,
      };

    case types.EXERCISE_SEARCH_SUCCESS:
      return {
        ...state,
        searchResults: action.payload,
        loading: false,
      };

    case types.EXERCISE_FETCH_BY_ID_SUCCESS:
      return {
        ...state,
        selectedExercise: action.payload,
        loading: false,
      };

    case types.EXERCISE_FETCH_METADATA_SUCCESS:
      return {
        ...state,
        muscles: action.payload.muscles || [],
        bodyParts: action.payload.bodyParts || [],
        equipments: action.payload.equipments || [],
        exerciseTypes: action.payload.exerciseTypes || [],
        loading: false,
      };

    case types.EXERCISE_FETCH_ROUTINES_SUCCESS:
      return {
        ...state,
        warmups: action.payload.warmups || [],
        routines: action.payload.routines || [],
        loading: false,
      };

    case types.EXERCISE_FETCH_LIST_FAILURE:
    case types.EXERCISE_SEARCH_FAILURE:
    case types.EXERCISE_FETCH_BY_ID_FAILURE:
    case types.EXERCISE_FETCH_METADATA_FAILURE:
    case types.EXERCISE_FETCH_ROUTINES_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default exerciseReducer;
