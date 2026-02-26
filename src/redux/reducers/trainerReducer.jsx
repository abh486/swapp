import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  trainers: [],
  trainerProfile: null,
};

const trainerReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.TRAINER_BROWSE_REQUEST:
    case types.TRAINER_GET_BY_ID_REQUEST:
    case types.TRAINER_GET_BY_TRAINER_ID_REQUEST:
    case types.TRAINER_GET_BY_PLAN_IDS_REQUEST:
    case types.TRAINER_START_CONVERSATION_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.TRAINER_BROWSE_SUCCESS:
      return {
        ...state,
        loading: false,
        trainers: action.payload,
      };
    
    case types.TRAINER_GET_BY_ID_SUCCESS:
    case types.TRAINER_GET_BY_TRAINER_ID_SUCCESS:
      return {
        ...state,
        loading: false,
        trainerProfile: action.payload,
      };
    
    case types.TRAINER_GET_BY_PLAN_IDS_SUCCESS:
      return {
        ...state,
        loading: false,
        trainers: action.payload,
      };
    
    case types.TRAINER_START_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
      };
    
    case types.TRAINER_BROWSE_FAILURE:
    case types.TRAINER_GET_BY_ID_FAILURE:
    case types.TRAINER_GET_BY_TRAINER_ID_FAILURE:
    case types.TRAINER_GET_BY_PLAN_IDS_FAILURE:
    case types.TRAINER_START_CONVERSATION_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default trainerReducer;

