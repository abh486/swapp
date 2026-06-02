import parseApiError from '../utils/parseApiError';

export const unwrapApiData = response => {
  const body = response?.data ?? response;
  if (!body) return null;

  if (body.data !== undefined) return body.data;
  return body;
};

export const unwrapApiMessage = (response, fallback = 'Request completed') => {
  const body = response?.data ?? response;
  return body?.message || fallback;
};

export const normalizeBooking = value => {
  const booking = value?.booking || value;
  if (!booking) return booking;

  const bookingStatus = booking.bookingStatus || booking.status;
  return {
    ...booking,
    bookingStatus,
    status: booking.status || bookingStatus,
    bookingMode: booking.bookingMode || booking.booking_mode,
    providerId: booking.providerId || booking.provider_id,
    userId: booking.userId || booking.user_id,
    checkInMethod: booking.checkInMethod || booking.check_in_method,
  };
};

export const normalizeCheckIn = value => {
  if (!value) return value;

  const bookingStatus = value.bookingStatus || value.status;
  return {
    ...value,
    bookingStatus,
    status: value.status || bookingStatus,
    method: value.method || value.checkInMethod || value.check_in_method,
    date: value.date || value.startTime || value.checkedAt,
  };
};

export const normalizeSlot = value => {
  if (!value) return value;

  const currentBookings = value.currentBookings ?? value.bookedCount ?? 0;
  return {
    ...value,
    id: value.id || value.slotId,
    slotId: value.slotId || value.id,
    dayOfWeek: value.dayOfWeek || value.day,
    startTime: value.startTime || value.start_time,
    endTime: value.endTime || value.end_time,
    currentBookings,
    bookedCount: value.bookedCount ?? currentBookings,
    totalCapacity: value.totalCapacity ?? value.total_capacity ?? value.capacity,
    swappCapacity: value.swappCapacity ?? value.swapp_capacity,
    availabilityState: value.availabilityState || value.status || 'AVAILABLE',
    isAvailable: value.isAvailable ?? !['FULL', 'PAST', 'UNAVAILABLE', 'CLOSED'].includes(value.availabilityState),
  };
};

export const parseApiFailure = (error, fallback) => {
  return parseApiError(error) || fallback || 'Something went wrong. Please try again.';
};
