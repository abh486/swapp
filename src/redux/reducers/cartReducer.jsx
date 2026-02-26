import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  items: [],
  checkoutUrl: null,
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.CART_FETCH_REQUEST:
    case types.CART_ADD_ITEM_REQUEST:
    case types.CART_UPDATE_ITEM_REQUEST:
    case types.CART_REMOVE_ITEM_REQUEST:
    case types.CART_CREATE_CHECKOUT_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.CART_FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload,
      };
    
    case types.CART_ADD_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload,
      };
    
    case types.CART_UPDATE_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        items: action.payload,
      };
    
    case types.CART_REMOVE_ITEM_SUCCESS:
      return {
        ...state,
        loading: false,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case types.CART_CREATE_CHECKOUT_SUCCESS:
      return {
        ...state,
        loading: false,
        checkoutUrl: action.payload,
      };
    
    case types.CART_FETCH_FAILURE:
    case types.CART_ADD_ITEM_FAILURE:
    case types.CART_UPDATE_ITEM_FAILURE:
    case types.CART_REMOVE_ITEM_FAILURE:
    case types.CART_CREATE_CHECKOUT_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default cartReducer;

