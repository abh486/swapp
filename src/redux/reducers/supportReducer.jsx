import {
  SUPPORT_FETCH_TICKETS_REQUEST,
  SUPPORT_FETCH_TICKETS_SUCCESS,
  SUPPORT_FETCH_TICKETS_FAILURE,
  SUPPORT_CREATE_TICKET_REQUEST,
  SUPPORT_CREATE_TICKET_SUCCESS,
  SUPPORT_CREATE_TICKET_FAILURE,
  SUPPORT_RESOLVE_TICKET_REQUEST,
  SUPPORT_RESOLVE_TICKET_SUCCESS,
  SUPPORT_RESOLVE_TICKET_FAILURE,
  SUPPORT_ADD_REPLY_REQUEST,
  SUPPORT_ADD_REPLY_SUCCESS,
  SUPPORT_ADD_REPLY_FAILURE,
} from '../actionTypes/actionTypes';

const initialState = {
  tickets: [],
  loading: false,
  submitting: false,
  error: null,
};

const ensureArray = value => (Array.isArray(value) ? value : []);

export const supportReducer = (state = initialState, action) => {
  switch (action.type) {
    case SUPPORT_FETCH_TICKETS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SUPPORT_FETCH_TICKETS_SUCCESS:
      return {
        ...state,
        loading: false,
        tickets: ensureArray(action.payload),
        error: null,
      };
    case SUPPORT_FETCH_TICKETS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SUPPORT_CREATE_TICKET_REQUEST:
      return {
        ...state,
        submitting: true,
        error: null,
      };
    case SUPPORT_CREATE_TICKET_SUCCESS:
      return {
        ...state,
        submitting: false,
        tickets: [action.payload, ...ensureArray(state.tickets)],
        error: null,
      };
    case SUPPORT_CREATE_TICKET_FAILURE:
      return {
        ...state,
        submitting: false,
        error: action.payload,
      };

    case SUPPORT_RESOLVE_TICKET_REQUEST:
      return {
        ...state,
        submitting: true,
        error: null,
      };
    case SUPPORT_RESOLVE_TICKET_SUCCESS: {
      const targetId = action.payload?.id || action.payload?._id;
      return {
        ...state,
        submitting: false,
        tickets: ensureArray(state.tickets).map(t => {
          const tId = t.id || t._id;
          return (tId && targetId && tId === targetId) ? { ...t, ...action.payload } : t;
        }),
        error: null,
      };
    }
    case SUPPORT_RESOLVE_TICKET_FAILURE:
      return {
        ...state,
        submitting: false,
        error: action.payload,
      };

    case SUPPORT_ADD_REPLY_REQUEST:
      return {
        ...state,
        submitting: true,
        error: null,
      };
    case SUPPORT_ADD_REPLY_SUCCESS:
      return {
        ...state,
        submitting: false,
        tickets: ensureArray(state.tickets).map(t => {
          if (t.id === action.payload.ticketId || t._id === action.payload.ticketId) {
            return {
              ...t,
              replies: [...(t.replies || []), action.payload.reply],
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
        }),
        error: null,
      };
    case SUPPORT_ADD_REPLY_FAILURE:
      return {
        ...state,
        submitting: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default supportReducer;
