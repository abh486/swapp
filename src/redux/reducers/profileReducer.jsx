import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  profile: null,
};

const profileReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.PROFILE_GET_USER_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.PROFILE_GET_USER_SUCCESS:
      return {
        ...state,
        loading: false,
        profile: action.payload,
      };
    
    case types.PROFILE_GET_USER_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default profileReducer;

