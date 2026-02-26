import apiClient from '../../api/apiClient';
import socketService from '../../api/socketService';
import * as types from '../actionTypes/actionTypes';

export const startConversation = (recipientId) => async (dispatch) => {
  dispatch({ type: types.CHAT_START_CONVERSATION_REQUEST });
  try {
    const response = await apiClient.post('/chat/conversations', { recipientId });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to start conversation');
    }
    
    dispatch({
      type: types.CHAT_START_CONVERSATION_SUCCESS,
      payload: response.data.data,
    });
    
    return response.data.data;
  } catch (error) {
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Chat service not available. Please try again later.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data.message || 'Invalid request';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    dispatch({
      type: types.CHAT_START_CONVERSATION_FAILURE,
      payload: errorMessage,
    });
    
    throw new Error(errorMessage);
  }
};

export const getConversations = () => async (dispatch) => {
  dispatch({ type: types.CHAT_GET_CONVERSATIONS_REQUEST });
  try {
    const response = await apiClient.get('/chat/conversations');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch conversations');
    }
    
    dispatch({
      type: types.CHAT_GET_CONVERSATIONS_SUCCESS,
      payload: response.data.data,
    });
    
    return response.data.data;
  } catch (error) {
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Chat service not available. Please try again later.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    dispatch({
      type: types.CHAT_GET_CONVERSATIONS_FAILURE,
      payload: errorMessage,
    });
    
    throw new Error(errorMessage);
  }
};

export const getMessages = (conversationId) => async (dispatch) => {
  dispatch({ type: types.CHAT_GET_MESSAGES_REQUEST });
  try {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch messages');
    }
    
    dispatch({
      type: types.CHAT_GET_MESSAGES_SUCCESS,
      payload: { conversationId, messages: response.data.data },
    });
    
    return response.data.data;
  } catch (error) {
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Conversation not found or you do not have access.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    dispatch({
      type: types.CHAT_GET_MESSAGES_FAILURE,
      payload: errorMessage,
    });
    
    throw new Error(errorMessage);
  }
};

export const sendMessage = (conversationId, content) => async (dispatch) => {
  dispatch({ type: types.CHAT_SEND_MESSAGE_REQUEST });
  try {
    const response = await apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send message');
    }
    
    dispatch({
      type: types.CHAT_SEND_MESSAGE_SUCCESS,
      payload: response.data.data,
    });
    
    return response.data.data;
  } catch (error) {
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Conversation not found or you do not have access.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data.message || 'Invalid request';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }
    
    dispatch({
      type: types.CHAT_SEND_MESSAGE_FAILURE,
      payload: errorMessage,
    });
    
    throw new Error(errorMessage);
  }
};

// Socket-related actions (these don't dispatch Redux actions but are kept for compatibility)
export const sendMessageViaSocket = async (conversationId, content) => {
  try {
    await socketService.sendMessage(conversationId, content);
  } catch (error) {
    throw error;
  }
};

export const initializeSocket = async () => {
  try {
    return await socketService.connect();
  } catch (error) {
    throw error;
  }
};

export const joinConversation = (conversationId) => {
  socketService.joinConversation(conversationId);
};

export const leaveConversation = (conversationId) => {
  socketService.leaveConversation(conversationId);
};

export const onNewMessage = (callback) => {
  socketService.onNewMessage(callback);
};

export const offNewMessage = (callback) => {
  socketService.offNewMessage(callback);
};

export const disconnectSocket = () => {
  socketService.disconnect();
};

