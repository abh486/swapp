// src/api/homeApi.js
import apiClient from './apiClient';

export const fetchHomeFeed = async (lat, lng, vertical) => {
  const params = {};
  if (lat) params.lat = lat;
  if (lng) params.lng = lng;
  if (vertical) params.vertical = vertical;
  
  const response = await apiClient.get('/common/home/feed', { params });
  return response.data;
};
