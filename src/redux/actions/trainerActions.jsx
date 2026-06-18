import apiClient from '../../api/apiClient';
import socketService from '../../api/socketService';
import { startConversation, getMessages, sendMessage } from './chatActions';
import * as types from '../actionTypes/actionTypes';

export const browseTrainers = (params = {}) => async (dispatch) => {
  dispatch({ type: types.TRAINER_BROWSE_REQUEST });
  try {
    const response = await apiClient.get('/trainers/browse', { params });
    dispatch({
      type: types.TRAINER_BROWSE_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching trainers:", error.response?.data || error.message);
    dispatch({
      type: types.TRAINER_BROWSE_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getTrainerById = (userId) => async (dispatch) => {
  dispatch({ type: types.TRAINER_GET_BY_ID_REQUEST });
  try {
    console.log(`[API] Fetching trainer profile for user ID: ${userId}`);
    const response = await apiClient.get(`/trainers/${userId}`);
    console.log(`[API] Successfully fetched trainer profile:`, response.data.data);
    dispatch({
      type: types.TRAINER_GET_BY_ID_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching trainer profile for user ID: ${userId}`, error.response?.data || error.message);
    dispatch({
      type: types.TRAINER_GET_BY_ID_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getTrainerProfileByTrainerId = (trainerId) => async (dispatch) => {
  dispatch({ type: types.TRAINER_GET_BY_TRAINER_ID_REQUEST });
  try {
    console.log(`[API] Fetching trainer profile by trainer ID: ${trainerId}`);
    const response = await apiClient.get(`/trainers/${trainerId}`);
    console.log(`[API] Successfully fetched trainer profile by trainer ID:`, response.data.data);
    dispatch({
      type: types.TRAINER_GET_BY_TRAINER_ID_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching trainer profile by trainer ID: ${trainerId}`, error.response?.data || error.message);
    dispatch({
      type: types.TRAINER_GET_BY_TRAINER_ID_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getTrainersByPlanIds = (planIds) => async (dispatch) => {
  dispatch({ type: types.TRAINER_GET_BY_PLAN_IDS_REQUEST });
  try {
    const response = await apiClient.post('/trainers/by-plan-ids', { planIds });
    dispatch({
      type: types.TRAINER_GET_BY_PLAN_IDS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trainers by plan IDs:', error);
    dispatch({
      type: types.TRAINER_GET_BY_PLAN_IDS_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const startConversationWithTrainer = (trainerId) => async (dispatch) => {
  dispatch({ type: types.TRAINER_START_CONVERSATION_REQUEST });
  try {
    console.log('Starting conversation with trainer ID:', trainerId);
    const conversation = await dispatch(startConversation(trainerId));
    dispatch({
      type: types.TRAINER_START_CONVERSATION_SUCCESS,
      payload: conversation,
    });
    return conversation;
  } catch (error) {
    console.error("Error starting conversation with trainer:", error.response?.data || error.message);
    dispatch({
      type: types.TRAINER_START_CONVERSATION_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const getTrainerMessages = (conversationId) => async (dispatch) => {
  return dispatch(getMessages(conversationId));
};

export const sendMessageToTrainer = (conversationId, content) => async (dispatch) => {
  return dispatch(sendMessage(conversationId, content));
};

export const sendMessageViaSocket = async (conversationId, content) => {
  try {
    return await socketService.sendMessage(conversationId, content);
  } catch (error) {
    console.error("Error sending message via socket:", error.message);
    throw error;
  }
};

export const initializeTrainerChat = async (token, conversationId, onNewMessage) => {
  try {
    await socketService.connect();
    socketService.joinConversation(conversationId);
    socketService.onNewMessage(onNewMessage);
  } catch (error) {
    console.error("Error initializing trainer chat:", error.message);
    throw error;
  }
};

export const endTrainerChat = (conversationId) => {
  try {
    socketService.leaveConversation(conversationId);
    socketService.offNewMessage();
  } catch (error) {
    console.error("Error ending trainer chat:", error.message);
  }
};

