import { createBooking, generateBookingQr, getMyBookings } from './bookingApi';
import { venueScanCheckIn, getCheckInHistory } from './checkinApi';
import { fetchMemberProviderAvailability } from './scheduleApi';

export const mobileIntegrationSmoke = {
  venueScanCheckIn,
  createBooking,
  fetchMemberProviderAvailability,
  generateBookingQr,
  getCheckInHistory,
  getMyBookings,
};
