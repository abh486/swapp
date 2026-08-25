/**
 * dietAiApi.js
 * Centralized API methods for all AI Diet Recommendation system calls.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const migrateMeals = (mealsStr) => {
  if (!mealsStr) return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
  try {
    const parsed = JSON.parse(mealsStr);
    if (Array.isArray(parsed) && parsed.length === 2 && parsed.includes('Lunch') && parsed.includes('Dinner')) {
      return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    }
    return parsed;
  } catch (e) {
    const splitMeals = mealsStr.split(', ').filter(Boolean);
    if (splitMeals.length === 2 && splitMeals.includes('Lunch') && splitMeals.includes('Dinner')) {
      return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    }
    return splitMeals;
  }
};


 * Fetch Macro Targets via proxy
  */
export const fetchMacroTargets = async (params) => {
  const response = await apiClient.post('/diet/macros', params);
  return response.data;
};

/**
 * Fetch Weekly Diet Plan via proxy
 */
export const fetchWeeklyPlan = async (params) => {
  const response = await apiClient.post('/diet/generate-plan', params);
  return response.data;
};

/**
 * Analyze Meal Photo via proxy
 * Sends multipart/form-data for actual image upload
 */
export const analyzeMealPhoto = async (photoUri) => {
  const formData = new FormData();
  formData.append('photo', {
    uri: photoUri,
    type: 'image/jpeg', // Standard assumption for camera, backend can validate
    name: 'meal_photo.jpg',
  });

  const response = await apiClient.post('/diet/analyze-meal', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};


export const saveDietPreferences = async (prefs) => {
  const {
    preference,
    skipDays,
    meals,
    allergies,
    cuisines,
    otherInfo,
  } = prefs;

  await Promise.all([
    preference !== undefined && AsyncStorage.setItem('diet_preference', preference),
    skipDays !== undefined && AsyncStorage.setItem('diet_skip_days', JSON.stringify(skipDays)),
    meals !== undefined && AsyncStorage.setItem('diet_meals', JSON.stringify(meals)),
    allergies !== undefined && AsyncStorage.setItem('diet_allergies', JSON.stringify(allergies)),
    cuisines !== undefined && AsyncStorage.setItem('diet_cuisines', JSON.stringify(cuisines)),
    otherInfo !== undefined && AsyncStorage.setItem('diet_other_info', otherInfo),
  ].filter(Boolean));

  // Sync to Swapp Backend so it can be pushed to NutriAI
  try {
    const payload = {};
    if (preference !== undefined) payload.dietPreference = preference;
    if (skipDays !== undefined) payload.skipDays = JSON.stringify(skipDays);
    if (meals !== undefined) payload.meals = JSON.stringify(meals);
    if (allergies !== undefined) payload.allergies = JSON.stringify(allergies);
    if (cuisines !== undefined) payload.cuisines = JSON.stringify(cuisines);
    if (otherInfo !== undefined) payload.otherInfo = otherInfo;

    if (Object.keys(payload).length > 0) {
      await apiClient.put('/users/profile', payload);
    }
  } catch (err) {
    console.error('Failed to sync diet preferences to backend:', err);
  }
};

/**
 * AI Dietician Chat API Endpoints
 */
export const getDietChatConversations = async () => {
  const response = await apiClient.get('/diet/chat/conversations');
  return response.data;
};

export const getDietChatConversation = async (conversationId) => {
  const response = await apiClient.get(`/diet/chat/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendDietChatMessage = async (conversationId, message) => {
  const response = await apiClient.post('/diet/chat/messages', {
    conversationId,
    message,
  });
  return response.data;
};

export default {
  saveDietPreferences,
  fetchMacroTargets,
  fetchWeeklyPlan,
  analyzeMealPhoto,
  getDietChatConversations,
  getDietChatConversation,
  sendDietChatMessage,
};
