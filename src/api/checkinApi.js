import apiClient from './apiClient';
import { API_ROUTES } from './contracts';
import { normalizeCheckIn, unwrapApiData, unwrapApiMessage } from './apiUtils';

export const venueScanCheckIn = async ({ providerId, sig, categoryId }) => {
  const response = await apiClient.post(API_ROUTES.checkin.venueScan, {
    providerId,
    sig,
    ...(categoryId ? { categoryId } : {}),
  });
  const data = unwrapApiData(response);

  return {
    raw: response.data,
    message: unwrapApiMessage(response, 'Venue scan check-in successful.'),
    checkIn: normalizeCheckIn(data),
  };
};

export const getCheckInHistory = async params => {
  const response = await apiClient.get(API_ROUTES.checkin.history, { params });
  const data = unwrapApiData(response);
  const history = Array.isArray(data) ? data : data?.history || [];

  return history.map(normalizeCheckIn);
};
