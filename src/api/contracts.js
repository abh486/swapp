export const API_ROUTES = Object.freeze({
  bookings: {
    base: '/v1/bookings',
    mine: '/v1/bookings/mine',
    byId: (bookingId) => `/v1/bookings/${bookingId}`,
    availability: (providerId) => `/v1/bookings/availability/provider/${providerId}`,
    cancel: (bookingId) => `/v1/bookings/${bookingId}/cancel`,
    generateQr: (bookingId) => `/v1/bookings/${bookingId}/generate-qr`,
  },
  checkin: {
    scan: '/v1/checkin/scan',
    manual: '/v1/checkin/manual',
    venueScan: '/v1/checkin/venue-scan',
    history: '/v1/checkin/history',
  },
  providerSlots: {
    base: '/v1/provider/slots',
  },
});

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  DECLINED: 'DECLINED',
});

export const BOOKING_MODE = Object.freeze({
  OPEN_ACCESS: 'OPEN_ACCESS',
  SLOT_BASED: 'SLOT_BASED',
  APPOINTMENT_ONLY: 'APPOINTMENT',
  APPOINTMENT: 'APPOINTMENT',
});

export const CHECKIN_METHOD = Object.freeze({
  BOOKING_QR: 'BOOKING_QR',
  VENUE_QR: 'VENUE_QR',
  MANUAL: 'MANUAL',
});
