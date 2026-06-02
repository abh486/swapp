import apiClient from './apiClient';
import { API_ROUTES } from './contracts';
import { normalizeSlot, unwrapApiData } from './apiUtils';

export const fetchProviderSlots = async params => {
  const response = await apiClient.get(API_ROUTES.providerSlots.base, { params });
  const data = unwrapApiData(response);
  const slots = Array.isArray(data) ? data : data?.slots || [];

  return slots.map(normalizeSlot);
};

export const fetchMemberProviderAvailability = async ({ providerId, date, categoryId }) => {
  const response = await apiClient.get(API_ROUTES.bookings.availability(providerId), {
    params: {
      date,
      ...(categoryId ? { categoryId } : {}),
    },
  });
  const data = unwrapApiData(response);
  const slots = Array.isArray(data) ? data : data?.slots || [];

  return {
    raw: response.data,
    providerId: data?.providerId || providerId,
    date: data?.date || date,
    slots: slots.map(normalizeSlot),
  };
};
