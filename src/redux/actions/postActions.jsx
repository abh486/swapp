import apiClient from '../../api/apiClient';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import * as types from '../actionTypes/actionTypes';

export const getAllPosts = (params = { page: 1, limit: 10 }) => async (dispatch) => {
  dispatch({ type: types.POST_GET_ALL_REQUEST });
  try {
    const response = await apiClient.get('/community/posts', { params });
    dispatch({
      type: types.POST_GET_ALL_SUCCESS,
      payload: response.data,
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.POST_GET_ALL_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const createPost = (caption, image) => async (dispatch) => {
  dispatch({ type: types.POST_CREATE_REQUEST });
  try {
    if (!caption || !image) {
      throw new Error('Caption and image are required.');
    }

    const imageUrl = await uploadToCloudinary(image);

    console.log('📤 [Backend] Creating post with Cloudinary URL...');
    const response = await apiClient.post('/community/posts', {
      content: caption.trim(),
      imageUrl: imageUrl,
    });
    
    dispatch({
      type: types.POST_CREATE_SUCCESS,
      payload: response.data,
    });
    
    return response;
  } catch (error) {
    console.error('Error in createPost:', error);
    dispatch({
      type: types.POST_CREATE_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const addComment = (postId, commentText) => async (dispatch) => {
  dispatch({ type: types.POST_ADD_COMMENT_REQUEST });
  try {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, { 
      content: commentText.trim() 
    });
    dispatch({
      type: types.POST_ADD_COMMENT_SUCCESS,
      payload: { postId, comment: response.data },
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.POST_ADD_COMMENT_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const likePost = (postId) => async (dispatch) => {
  dispatch({ type: types.POST_LIKE_REQUEST });
  try {
    const response = await apiClient.post(`/community/posts/${postId}/like`);
    dispatch({
      type: types.POST_LIKE_SUCCESS,
      payload: { postId, data: response.data },
    });
    return response;
  } catch (error) {
    dispatch({
      type: types.POST_LIKE_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

