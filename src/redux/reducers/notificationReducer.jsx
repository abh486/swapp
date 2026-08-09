import * as types from '../actionTypes/actionTypes';

const initialState = {
  loading: false,
  error: null,
  notifications: [],
};

const notificationReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.NOTIFICATION_GET_USER_REQUEST:
    case types.NOTIFICATION_MARK_READ_REQUEST:
    case types.NOTIFICATION_DELETE_REQUEST:
      return { ...state, loading: true, error: null };
    
    case types.NOTIFICATION_GET_USER_SUCCESS: {
      let resolved = [];
      const payload = action.payload;
      if (Array.isArray(payload)) {
        resolved = payload;
      } else if (payload && Array.isArray(payload.notifications)) {
        resolved = payload.notifications;
      } else if (payload && Array.isArray(payload.data)) {
        resolved = payload.data;
      } else if (payload && payload.data && Array.isArray(payload.data.notifications)) {
        resolved = payload.data.notifications;
      }
      return {
        ...state,
        loading: false,
        notifications: resolved,
      };
    }
    
    case types.NOTIFICATION_MARK_READ_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload.notificationId
            ? { ...notif, read: true }
            : notif
        ),
      };
    
    case types.NOTIFICATION_DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        notifications: state.notifications.filter(
          notif => notif.id !== action.payload
        ),
      };
    
    case 'NOTIFICATION_RECEIVED': {
      const newNotif = action.payload;
      if (state.notifications.some(n => n.id === newNotif.id)) {
        return state;
      }
      return {
        ...state,
        notifications: [newNotif, ...state.notifications],
      };
    }
    
    case types.NOTIFICATION_GET_USER_FAILURE:
    case types.NOTIFICATION_MARK_READ_FAILURE:
    case types.NOTIFICATION_DELETE_FAILURE:
      return { ...state, loading: false, error: action.payload };
    
    default:
      return state;
  }
};

export default notificationReducer;

