import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  conversations: [],
  messages: {},
};

const chatReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.CHAT_START_CONVERSATION_REQUEST:
    case types.CHAT_GET_CONVERSATIONS_REQUEST:
    case types.CHAT_GET_MESSAGES_REQUEST:
    case types.CHAT_SEND_MESSAGE_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.CHAT_START_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
        conversations: [...state.conversations, action.payload],
      };
    
    case types.CHAT_GET_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        conversations: action.payload,
      };
    
    case types.CHAT_GET_MESSAGES_SUCCESS:
      return {
        ...state,
        loading: false,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: action.payload.messages,
        },
      };
    
    case types.CHAT_SEND_MESSAGE_SUCCESS:
      return {
        ...state,
        loading: false,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload,
          ],
        },
      };
    
    case types.CHAT_START_CONVERSATION_FAILURE:
    case types.CHAT_GET_CONVERSATIONS_FAILURE:
    case types.CHAT_GET_MESSAGES_FAILURE:
    case types.CHAT_SEND_MESSAGE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default chatReducer;

