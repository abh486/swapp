import apiClient from './apiClient';
import { API_ROUTES } from './contracts';
import { normalizeBooking, unwrapApiData, unwrapApiMessage } from './apiUtils';

export const createBooking = async payload => {
  const response = await apiClient.post(API_ROUTES.bookings.base, payload);
  const data = unwrapApiData(response);

  return {
    raw: response.data,
    message: unwrapApiMessage(response, 'Booking created successfully.'),
    booking: normalizeBooking(data),
  };
};

export const getMyBookings = async () => {
  const response = await apiClient.get(API_ROUTES.bookings.mine);
  const data = unwrapApiData(response);
  const bookings = data?.bookings || data || [];

  return Array.isArray(bookings) ? bookings.map(normalizeBooking) : [];
};

export const generateBookingQr = async (bookingId, location) => {
  const response = await apiClient.post(API_ROUTES.bookings.generateQr(bookingId), {
    latitude: location?.latitude,
    longitude: location?.longitude,
  });
  const data = unwrapApiData(response);

  return {
    raw: response.data,
    message: unwrapApiMessage(response, 'Check-in pass generated.'),
    qrToken: data?.qrToken,
    expiresInSeconds: data?.expiresInSeconds || data?.expiresIn || 60,
  };
};

export const checkoutBooking = async (bookingId) => {
  const response = await apiClient.post(`${API_ROUTES.bookings.base}/${bookingId}/checkout`);
  const data = unwrapApiData(response);

  return {
    raw: response.data,
    message: unwrapApiMessage(response, 'Checked out successfully.'),
    booking: normalizeBooking(data),
  };
};

