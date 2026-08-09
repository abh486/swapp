import apiClient from '../../api/apiClient';
import * as types from '../actionTypes/actionTypes';

export const getUserNotifications = () => async (dispatch) => {
  dispatch({ type: types.NOTIFICATION_GET_USER_REQUEST });
  try {
    const response = await apiClient.get('/v1/notifications/me');
    dispatch({
      type: types.NOTIFICATION_GET_USER_SUCCESS,
      payload: response.data.data || response.data,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    dispatch({
      type: types.NOTIFICATION_GET_USER_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const markNotificationAsRead = (notificationId) => async (dispatch) => {
  dispatch({ type: types.NOTIFICATION_MARK_READ_REQUEST });
  try {
    const response = await apiClient.patch(`/v1/notifications/${notificationId}/read`);
    dispatch({
      type: types.NOTIFICATION_MARK_READ_SUCCESS,
      payload: { notificationId, data: response.data },
    });
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    dispatch({
      type: types.NOTIFICATION_MARK_READ_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

export const deleteNotification = (notificationId) => async (dispatch) => {
  dispatch({ type: types.NOTIFICATION_DELETE_REQUEST });
  try {
    const response = await apiClient.delete(`/v1/notifications/${notificationId}`);
    dispatch({
      type: types.NOTIFICATION_DELETE_SUCCESS,
      payload: notificationId,
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    dispatch({
      type: types.NOTIFICATION_DELETE_FAILURE,
      payload: error.message,
    });
    throw error;
  }
};

