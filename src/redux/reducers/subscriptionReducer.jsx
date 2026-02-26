import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  checkoutUrl: null,
  portalUrl: null,
  multiGymTiers: [],
};

const subscriptionReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SUBSCRIPTION_CREATE_CHECKOUT_REQUEST:
    case types.SUBSCRIPTION_CREATE_PORTAL_REQUEST:
    case types.SUBSCRIPTION_GET_MULTIGYM_TIERS_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.SUBSCRIPTION_CREATE_CHECKOUT_SUCCESS:
      return {
        ...state,
        loading: false,
        checkoutUrl: action.payload.checkoutUrl,
      };
    
    case types.SUBSCRIPTION_CREATE_PORTAL_SUCCESS:
      return {
        ...state,
        loading: false,
        portalUrl: action.payload.portalUrl,
      };
    
    case types.SUBSCRIPTION_GET_MULTIGYM_TIERS_SUCCESS:
      return {
        ...state,
        loading: false,
        multiGymTiers: action.payload,
      };
    
    case types.SUBSCRIPTION_CREATE_CHECKOUT_FAILURE:
    case types.SUBSCRIPTION_CREATE_PORTAL_FAILURE:
    case types.SUBSCRIPTION_GET_MULTIGYM_TIERS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default subscriptionReducer;

