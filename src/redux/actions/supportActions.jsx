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
import apiClient from '../../api/apiClient';

const normalizeTickets = payload => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tickets)) return payload.tickets;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.supportTickets)) return payload.supportTickets;
  return [];
};

export const fetchSupportTickets = () => async (dispatch) => {
  dispatch({ type: SUPPORT_FETCH_TICKETS_REQUEST });
  try {
    const response = await apiClient.get('/v1/support/tickets');
    const data = response.data;
    if (data.success || data.data) {
      const tickets = normalizeTickets(data.data || data);
      dispatch({ type: SUPPORT_FETCH_TICKETS_SUCCESS, payload: tickets });
      return { success: true, data: tickets };
    } else {
      dispatch({ type: SUPPORT_FETCH_TICKETS_FAILURE, payload: data.message });
      return { success: false, message: data.message };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: SUPPORT_FETCH_TICKETS_FAILURE, payload: errorMsg });
    return { success: false, message: errorMsg };
  }
};

export const createSupportTicket = (ticketData) => async (dispatch) => {
  dispatch({ type: SUPPORT_CREATE_TICKET_REQUEST });
  try {
    const response = await apiClient.post('/v1/support/tickets', ticketData);
    const data = response.data;
    if (data.success || data.data) {
      dispatch({ type: SUPPORT_CREATE_TICKET_SUCCESS, payload: data.data || data });
      return { success: true, data: data.data || data };
    } else {
      dispatch({ type: SUPPORT_CREATE_TICKET_FAILURE, payload: data.message });
      return { success: false, message: data.message };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: SUPPORT_CREATE_TICKET_FAILURE, payload: errorMsg });
    return { success: false, message: errorMsg };
  }
};

export const resolveSupportTicket = (ticketId) => async (dispatch) => {
  dispatch({ type: SUPPORT_RESOLVE_TICKET_REQUEST });
  try {
    const response = await apiClient.patch(`/v1/support/tickets/${ticketId}/resolve`);
    const data = response.data;
    if (data.success || data.data) {
      dispatch({ type: SUPPORT_RESOLVE_TICKET_SUCCESS, payload: data.data || data });
      return { success: true, data: data.data || data };
    } else {
      dispatch({ type: SUPPORT_RESOLVE_TICKET_FAILURE, payload: data.message });
      return { success: false, message: data.message };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: SUPPORT_RESOLVE_TICKET_FAILURE, payload: errorMsg });
    return { success: false, message: errorMsg };
  }
};

export const addSupportReply = (ticketId, body) => async (dispatch) => {
  dispatch({ type: SUPPORT_ADD_REPLY_REQUEST });
  try {
    const response = await apiClient.post(`/v1/support/tickets/${ticketId}/reply`, { body });
    const data = response.data;
    if (data.success || data.data) {
      const replyData = data.data || data;
      dispatch({ type: SUPPORT_ADD_REPLY_SUCCESS, payload: { ticketId, reply: replyData } });
      return { success: true, data: replyData };
    } else {
      dispatch({ type: SUPPORT_ADD_REPLY_FAILURE, payload: data.message });
      return { success: false, message: data.message };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    dispatch({ type: SUPPORT_ADD_REPLY_FAILURE, payload: errorMsg });
    return { success: false, message: errorMsg };
  }
};
