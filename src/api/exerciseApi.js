import axios from 'axios';

const RAPIDAPI_BASE_URL = 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1';

const exerciseApiClient = axios.create({
  baseURL: RAPIDAPI_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
    'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
  },
});

/**
 * Check API Server Liveness
 */
export const checkLiveness = async () => {
  try {
    const res = await exerciseApiClient.get('/liveness');
    return res.data;
  } catch (error) {
    console.warn('[exerciseApi] checkLiveness failed:', error?.message);
    return null;
  }
};

/**
 * Get exercises list with filters & pagination
 * @param {Object} params - { limit, after, search, name, keywords, bodyParts, equipments, targetMuscles }
 */
export const getExercises = async (params = {}) => {
  try {
    const queryParams = {};
    if (params.limit) queryParams.limit = params.limit;
    if (params.after) queryParams.after = params.after;
    if (params.name) queryParams.name = params.name;
    if (params.keywords) queryParams.keywords = params.keywords;

    const res = await exerciseApiClient.get('/exercises', { params: queryParams });
    return res.data;
  } catch (error) {
    console.error('[exerciseApi] getExercises error:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Search exercises by query string
 * @param {string} query
 */
export const searchExercises = async (query) => {
  try {
    if (!query) return { success: true, data: [] };
    const res = await exerciseApiClient.get('/exercises/search', {
      params: { search: query },
    });
    return res.data;
  } catch (error) {
    console.error('[exerciseApi] searchExercises error:', error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Get single exercise details by exerciseId
 * @param {string} exerciseId
 */
export const getExerciseById = async (exerciseId) => {
  try {
    if (!exerciseId) return null;
    const res = await exerciseApiClient.get(`/exercises/${encodeURIComponent(exerciseId)}`);
    return res.data;
  } catch (error) {
    console.error(`[exerciseApi] getExerciseById (${exerciseId}) error:`, error?.response?.data || error?.message);
    throw error;
  }
};

/**
 * Get all available muscle groups
 */
export const getMuscles = async () => {
  try {
    const res = await exerciseApiClient.get('/muscles');
    return res.data;
  } catch (error) {
    console.warn('[exerciseApi] getMuscles error:', error?.message);
    return { success: false, data: [] };
  }
};

/**
 * Get all available body parts
 */
export const getBodyParts = async () => {
  try {
    const res = await exerciseApiClient.get('/bodyparts');
    return res.data;
  } catch (error) {
    console.warn('[exerciseApi] getBodyParts error:', error?.message);
    return { success: false, data: [] };
  }
};

/**
 * Get all available equipments
 */
export const getEquipments = async () => {
  try {
    const res = await exerciseApiClient.get('/equipments');
    return res.data;
  } catch (error) {
    console.warn('[exerciseApi] getEquipments error:', error?.message);
    return { success: false, data: [] };
  }
};

/**
 * Get all exercise types
 */
export const getExerciseTypes = async () => {
  try {
    const res = await exerciseApiClient.get('/exercisetypes');
    return res.data;
  } catch (error) {
    console.warn('[exerciseApi] getExerciseTypes error:', error?.message);
    return { success: false, data: [] };
  }
};

/**
 * Get warmup & stretching exercises from API
 */
export const getWarmupExercises = async () => {
  try {
    const res = await exerciseApiClient.get('/exercises/search', {
      params: { search: 'stretch' },
    });
    if (res?.data?.data) {
      return res.data.data.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        id: ex.exerciseId || `warmup_${idx}`,
        name: ex.name,
        imageUrl: ex.imageUrl,
        videoUrl: ex.videoUrl || null,
        type: 'WARMUP',
        durationSec: 45,
        reps: 12,
        sets: 2,
      }));
    }
    return [];
  } catch (error) {
    console.warn('[exerciseApi] getWarmupExercises error:', error?.message);
    return [];
  }
};

/**
 * Fetch complete structured workout routines dynamically assembled with API video/image media
 */
export const getCompleteWorkouts = async () => {
  try {
    const [warmupRes, strengthRes] = await Promise.all([
      getWarmupExercises(),
      getExercises({ limit: 20 }),
    ]);

    const strengthList = strengthRes?.data || [];

    const completeRoutines = [
      {
        id: 'api-warmup-routine',
        name: 'Full-Body Dynamic Mobility & Warm-up',
        level: 'BEGINNER',
        category: 'WARMUP',
        duration: 10,
        description: 'Prepare your joints, ligaments, and heart rate with dynamic stretches.',
        exercises: warmupRes.slice(0, 6),
      },
      {
        id: 'api-fullbody-routine',
        name: 'Complete Full-Body Strength Routine',
        level: 'INTERMEDIATE',
        category: 'STRENGTH',
        duration: 45,
        description: 'Comprehensive multi-joint strength workout for muscle growth & endurance.',
        exercises: strengthList.slice(0, 6).map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          id: ex.exerciseId || `ex_fb_${idx}`,
          name: ex.name,
          imageUrl: ex.imageUrl,
          bodyParts: ex.bodyParts,
          equipments: ex.equipments,
          targetMuscles: ex.targetMuscles,
          sets: 3,
          reps: 10,
          weight: '15 kg',
        })),
      },
      {
        id: 'api-upperbody-routine',
        name: 'Upper Body Power & Hypertrophy',
        level: 'ADVANCED',
        category: 'UPPER_BODY',
        duration: 40,
        description: 'Target chest, back, shoulders, biceps, and triceps with focused volume.',
        exercises: strengthList.slice(6, 12).map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          id: ex.exerciseId || `ex_ub_${idx}`,
          name: ex.name,
          imageUrl: ex.imageUrl,
          bodyParts: ex.bodyParts,
          equipments: ex.equipments,
          targetMuscles: ex.targetMuscles,
          sets: 4,
          reps: 12,
          weight: '20 kg',
        })),
      },
    ];

    return {
      success: true,
      warmups: warmupRes,
      routines: completeRoutines,
    };
  } catch (error) {
    console.error('[exerciseApi] getCompleteWorkouts error:', error?.message);
    return { success: false, warmups: [], routines: [] };
  }
};

export default {
  checkLiveness,
  getExercises,
  searchExercises,
  getExerciseById,
  getMuscles,
  getBodyParts,
  getEquipments,
  getExerciseTypes,
  getWarmupExercises,
  getCompleteWorkouts,
};
