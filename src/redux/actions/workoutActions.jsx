import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const fetchExercises = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EXERCISES_REQUEST, payload: { isLoadMore: params.isLoadMore } });
  try {
    let url = 'https://oss.exercisedb.dev/api/v1/exercises';
    let queryParams = [];
    
    if (params.search) {
      url = 'https://oss.exercisedb.dev/api/v1/exercises/search';
      queryParams.push(`search=${encodeURIComponent(params.search)}`);
      queryParams.push(`threshold=0.5`);
    } else {
      if (params.bodyParts && params.bodyParts.length > 0 && !params.bodyParts.includes('All Body Parts')) {
        queryParams.push(`bodyParts=${encodeURIComponent(params.bodyParts.join(','))}`);
      }
      if (params.targetMuscles && params.targetMuscles.length > 0 && !params.targetMuscles.includes('All Muscles')) {
        queryParams.push(`targetMuscles=${encodeURIComponent(params.targetMuscles.join(','))}`);
      }
      if (params.secondaryMuscles && params.secondaryMuscles.length > 0) {
        queryParams.push(`secondaryMuscles=${encodeURIComponent(params.secondaryMuscles.join(','))}`);
      }
      if (params.equipments && params.equipments.length > 0 && !params.equipments.includes('All Equipement') && params.equipments !== 'All Equipement') {
        const equipmentArray = Array.isArray(params.equipments) ? params.equipments : [params.equipments];
        queryParams.push(`equipments=${encodeURIComponent(equipmentArray.join(','))}`);
      }
      if (params.name) {
        queryParams.push(`name=${encodeURIComponent(params.name)}`);
      }
    }

    if (params.limit) {
      queryParams.push(`limit=${encodeURIComponent(params.limit)}`);
    } else {
      queryParams.push(`limit=50`);
    }

    if (params.isLoadMore && params.after) {
      queryParams.push(`after=${encodeURIComponent(params.after)}`);
    }

    const finalUrl = queryParams.length > 0 ? `${url}?${queryParams.join('&')}` : url;
    
    const response = await fetch(finalUrl);
    const data = await response.json();

    dispatch({
      type: types.WORKOUT_GET_EXERCISES_SUCCESS,
      payload: {
        exercises: data.data || data,
        meta: data.meta,
        isLoadMore: params.isLoadMore
      },
    });
    return data.data || data;
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: types.WORKOUT_GET_EXERCISES_FAILURE,
      payload: error.message || 'Server error',
    });
  }
};

export const fetchBodyParts = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_BODY_PARTS_REQUEST });
  try {
    const response = await fetch('https://oss.exercisedb.dev/api/v1/bodyparts');
    const data = await response.json();
    dispatch({
      type: types.WORKOUT_GET_BODY_PARTS_SUCCESS,
      payload: data.data || [],
    });
    return data.data || [];
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: types.WORKOUT_GET_BODY_PARTS_FAILURE,
      payload: error.message || 'Server error',
    });
  }
};

export const fetchMuscles = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_MUSCLES_REQUEST });
  try {
    const response = await fetch('https://oss.exercisedb.dev/api/v1/muscles');
    const data = await response.json();
    dispatch({
      type: types.WORKOUT_GET_MUSCLES_SUCCESS,
      payload: data.data || [],
    });
    return data.data || [];
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: types.WORKOUT_GET_MUSCLES_FAILURE,
      payload: error.message || 'Server error',
    });
  }
};

export const fetchEquipments = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EQUIPMENTS_REQUEST });
  try {
    const response = await fetch('https://oss.exercisedb.dev/api/v1/equipments');
    const data = await response.json();
    dispatch({
      type: types.WORKOUT_GET_EQUIPMENTS_SUCCESS,
      payload: data.data || [],
    });
    return data.data || [];
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: types.WORKOUT_GET_EQUIPMENTS_FAILURE,
      payload: error.message || 'Server error',
    });
  }
};

export const logWorkoutSession = (sessionData) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_LOG_SESSION_REQUEST });
  try {
    const response = await apiClient.post('/workouts/sessions', sessionData);
    dispatch({
      type: types.WORKOUT_LOG_SESSION_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_LOG_SESSION_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

export const deleteWorkoutSession = (sessionId) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_DELETE_SESSION_REQUEST });
  try {
    const response = await apiClient.delete(`/workouts/sessions/${sessionId}`);
    dispatch({
      type: types.WORKOUT_DELETE_SESSION_SUCCESS,
      payload: sessionId,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_DELETE_SESSION_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

export const deleteExerciseFromSession = (sessionId, logId) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_DELETE_EXERCISE_REQUEST });
  try {
    const response = await apiClient.delete(`/workouts/sessions/${sessionId}/logs/${logId}`);
    dispatch({
      type: types.WORKOUT_DELETE_EXERCISE_SUCCESS,
      payload: { sessionId, logId },
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_DELETE_EXERCISE_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

// NEW: Save selected filters to Redux before navigating
export const setSelectedFilters = (equipment, muscles) => ({
  type: types.WORKOUT_SET_SELECTED_FILTERS,
  payload: { equipment, muscles },
});

// NEW: Clear filters
export const clearSelectedFilters = () => ({
  type: types.WORKOUT_CLEAR_SELECTED_FILTERS,
});

export const saveCustomWorkoutTemplate = (folderName, workouts) => async (dispatch) => {
  try {
    const response = await apiClient.post('/workouts/sessions/custom-templates', { folderName, workouts });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const getCustomWorkoutTemplates = () => async (dispatch) => {
  try {
    const response = await apiClient.get('/workouts/sessions/custom-templates');
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const updateCustomWorkoutTemplate = (templateId, exercises) => async (dispatch) => {
  try {
    const response = await apiClient.put(`/workouts/sessions/custom-templates/${templateId}`, { exercises });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};