/**
 * dietAiApi.js
 * Centralized API methods for all AI Diet Recommendation system calls.
 */
import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

/**
 * Reads all saved diet preference keys from AsyncStorage and returns a params object
 * ready to send to the /recommendations endpoint.
 */
export const buildDietParams = async (overrides = {}) => {
  const [
    savedPreference,
    savedSkipDays,
    savedMeals,
    savedAllergies,
    savedCuisines,
    savedOtherInfo,
  ] = await Promise.all([
    AsyncStorage.getItem('diet_preference'),
    AsyncStorage.getItem('diet_skip_days'),
    AsyncStorage.getItem('diet_meals'),
    AsyncStorage.getItem('diet_allergies'),
    AsyncStorage.getItem('diet_cuisines'),
    AsyncStorage.getItem('diet_other_info'),
  ]);

  return {
    dietPreference: savedPreference || 'Selective Non-Veg',
    skipDays: savedSkipDays ? JSON.parse(savedSkipDays) : ['Monday'],
    meals: migrateMeals(savedMeals),
    allergies: savedAllergies ? JSON.parse(savedAllergies) : ['No Known Allergies'],
    cuisines: savedCuisines ? JSON.parse(savedCuisines) : ['USA Food'],
    otherInfo: savedOtherInfo || 'Love extra protein, low calorie',
    generate: 'false',
    ...overrides,
  };
};

export const fetchWeeklyPlan = async (params = {}) => {
  return null;
};

/**
 * Fetch macro targets for the current user from the backend.
 * Returns { calories, protein, carbs, fats } targets.
 */
export const fetchMacroTargets = async () => {
  const response = await apiClient.get('/diet/macro-targets');
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to fetch macro targets.');
  }
  return response.data.data;
};

/**
 * Trigger AI meal analysis from an uploaded image URL.
 * @param {string} photoUrl - Cloudinary URL of the uploaded food image
 * @param {string} description - Optional text description of the meal
 */
export const analyzeMealPhoto = async (photoUrl, description = '') => {
  const response = await apiClient.post('/diet/analyze-meal', { photoUrl, description });
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to analyze meal image.');
  }
  return response.data.data;
};

/**
 * Save diet preferences to AsyncStorage.
 * @param {Object} prefs - Preferences object to persist
 */
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
};

export default {
  buildDietParams,
  fetchWeeklyPlan,
  fetchMacroTargets,
  analyzeMealPhoto,
  saveDietPreferences,
};
