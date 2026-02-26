import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  products: [],
};

const shopReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SHOP_FETCH_PRODUCTS_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.SHOP_FETCH_PRODUCTS_SUCCESS:
      return {
        ...state,
        loading: false,
        products: action.payload.data || action.payload,
      };
    
    case types.SHOP_FETCH_PRODUCTS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default shopReducer;

