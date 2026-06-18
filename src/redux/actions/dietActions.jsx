import apiClient from '../../api/apiClient';
import parseApiError from '../../utils/parseApiError';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import * as types from '../actionTypes/actionTypes';

export const saveDietEntry = (dietData) => async (dispatch) => {
  dispatch({ type: types.DIET_SAVE_ENTRY_REQUEST });
  try {
    console.log('[DietService] Saving diet entry:', dietData);
    
    let photoUrl = dietData.photoUrl || null;
    
    if (dietData.photo && (!photoUrl || !photoUrl.startsWith('http'))) {
      try {
        photoUrl = await uploadToCloudinary(dietData.photo);
        console.log('[DietService] Image uploaded successfully:', photoUrl);
      } catch (uploadError) {
        console.warn('[DietService] Image upload failed:', uploadError.message);
      }
    }
    
    const transformedData = {
      mealName: dietData.mealName,
      mealType: dietData.mealType || 'breakfast',
      calories: parseInt(dietData.calories) || 0,
      protein: parseInt(dietData.protein) || 0,
      carbs: parseInt(dietData.carbs) || 0,
      fats: parseInt(dietData.fats) || 0,
      fiber: parseInt(dietData.fiber) || 0,
      sugar: parseInt(dietData.sugar) || 0,
      notes: dietData.notes || '',
      photoUrl: photoUrl,
    };
    
    const response = await apiClient.post('/diet/logs', transformedData);
    const result = {
      success: true,
      message: 'Diet entry saved successfully!',
      data: response.data.data || response.data,
    };
    
    dispatch({
      type: types.DIET_SAVE_ENTRY_SUCCESS,
      payload: result.data,
    });
    
    return result;
  } catch (error) {
    console.error('[DietService] Error saving diet entry:', error);
    const errorMessage = parseApiError(error);
    const result = {
      success: false,
      message: errorMessage,
      data: null,
    };
    
    dispatch({
      type: types.DIET_SAVE_ENTRY_FAILURE,
      payload: errorMessage,
    });
    
    return result;
  }
};

export const updateDietLog = (logId, updateData) => async (dispatch) => {
  dispatch({ type: types.DIET_UPDATE_LOG_REQUEST });
  try {
    let photoUrl = updateData.photo;
    
    if (updateData.photo && !updateData.photo.startsWith('http')) {
      try {
        photoUrl = await uploadToCloudinary(updateData.photo);
      } catch (uploadError) {
        console.warn('[DietService] New image upload failed:', uploadError.message);
      }
    }
    
    const transformedData = {
      ...updateData,
      photoUrl: photoUrl,
    };
    
    if (transformedData.photo) {
      delete transformedData.photo;
    }
    
    Object.keys(transformedData).forEach(key => {
      if (transformedData[key] === undefined) {
        delete transformedData[key];
      }
    });
    
    const response = await apiClient.put(`/diet/logs/${logId}`, transformedData);
    const result = {
      success: true,
      message: 'Diet log updated successfully!',
      data: response.data.data || response.data,
    };
    
    dispatch({
      type: types.DIET_UPDATE_LOG_SUCCESS,
      payload: result.data,
    });
    
    return result;
  } catch (error) {
    const errorMessage = parseApiError(error);
    const result = {
      success: false,
      message: errorMessage,
      data: null,
    };
    
    dispatch({
      type: types.DIET_UPDATE_LOG_FAILURE,
      payload: errorMessage,
    });
    
    return result;
  }
};

export const getDietLogsByDate = (date) => async (dispatch) => {
  dispatch({ type: types.DIET_GET_LOGS_BY_DATE_REQUEST });
  try {
    const response = await apiClient.get(`/diet/logs/date/${date}`);
    const result = {
      success: true,
      message: 'Diet logs fetched successfully.',
      data: response.data.data || response.data,
    };
    
    dispatch({
      type: types.DIET_GET_LOGS_BY_DATE_SUCCESS,
      payload: result.data,
      meta: { date },
    });
    
    return result;
  } catch (error) {
    const errorMessage = parseApiError(error);
    const result = {
      success: false,
      message: errorMessage,
      data: null,
    };
    
    dispatch({
      type: types.DIET_GET_LOGS_BY_DATE_FAILURE,
      payload: errorMessage,
    });
    
    return result;
  }
};

export const deleteDietLog = (logId) => async (dispatch) => {
  dispatch({ type: types.DIET_DELETE_LOG_REQUEST });
  try {
    await apiClient.delete(`/diet/logs/${logId}`);
    
    const result = {
      success: true,
      message: 'Diet log deleted successfully!',
      data: null,
    };
    
    dispatch({
      type: types.DIET_DELETE_LOG_SUCCESS,
      payload: logId,
    });
    
    return result;
  } catch (error) {
    const errorMessage = parseApiError(error);
    const result = {
      success: false,
      message: errorMessage,
      data: null,
    };
    
    dispatch({
      type: types.DIET_DELETE_LOG_FAILURE,
      payload: errorMessage,
    });
    
    return result;
  }
};

export const analyzeMealWithAI = (photoUrl, description) => async () => {
  try {
    console.log('[DietService] Requesting AI analysis:', { photoUrl, description });
    const response = await apiClient.post('/diet/analyze-meal', { photoUrl, description });
    
    return {
      success: true,
      data: response.data.data || response.data
    };
  } catch (error) {
    console.error('[DietService] AI analysis failed:', error);
    return {
      success: false,
      message: parseApiError(error),
      data: null
    };
  }
};


