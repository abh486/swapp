import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  posts: [],
};

const postReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.POST_GET_ALL_REQUEST:
    case types.POST_CREATE_REQUEST:
    case types.POST_ADD_COMMENT_REQUEST:
    case types.POST_LIKE_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.POST_GET_ALL_SUCCESS:
      return {
        ...state,
        loading: false,
        // FIX: Ensure we set state.posts to the array inside .data
        // Also handles both direct array return or axios wrapper
        posts: action.payload.data || action.payload, 
      };
    
    case types.POST_CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        // FIX: Add the new post. 
        // Ensure we access the specific post object from action.payload.data
        posts: [action.payload.data, ...state.posts],
      };
    
    case types.POST_ADD_COMMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, comments: [...(post.comments || []), action.payload.comment] }
            : post
        ),
      };
    
    case types.POST_LIKE_SUCCESS:
      return {
        ...state,
        loading: false,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, ...action.payload.data }
            : post
        ),
      };
    
    case types.POST_GET_ALL_FAILURE:
    case types.POST_CREATE_FAILURE:
    case types.POST_ADD_COMMENT_FAILURE:
    case types.POST_LIKE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default postReducer;