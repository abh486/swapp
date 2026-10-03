import * as types from '../actionTypes/actionTypes';
import LOCAL_EXERCISES from '../../data/exercises.json';

// Pre-computed lookup index for O(1) ID access
const EXERCISE_BY_ID = new Map();
const EXERCISE_BY_NAME = new Map();
LOCAL_EXERCISES.forEach((ex) => {
  if (ex.id) EXERCISE_BY_ID.set(String(ex.id).toLowerCase(), ex);
  if (ex.exerciseId) EXERCISE_BY_ID.set(String(ex.exerciseId).toLowerCase(), ex);
  if (ex.name) EXERCISE_BY_NAME.set(String(ex.name).toLowerCase(), ex);
});

// ── Raw Direct API Call Helpers (Now Powered Locally) ──

export const checkLiveness = async () => {
  return {
    success: true,
    message: 'Local ExerciseDB Ready (Offline & Zero Latency)',
    totalExercises: LOCAL_EXERCISES.length,
  };
};

export const getExercises = async (params = {}) => {
  try {
    let filtered = LOCAL_EXERCISES;

    // Search query by name / keywords
    const search = (params.search || params.name || params.keywords || '').trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((ex) =>
        ex.name?.toLowerCase().includes(search) ||
        ex.target?.toLowerCase().includes(search) ||
        ex.equipment?.toLowerCase().includes(search)
      );
    }

    // Filter by target muscles
    const rawMuscles = params.targetMuscles || params.muscles || [];
    const muscleList = (Array.isArray(rawMuscles) ? rawMuscles : String(rawMuscles).split(','))
      .map(m => m.trim().toLowerCase())
      .filter(m => m && !m.includes('all muscle'));
    if (muscleList.length > 0) {
      filtered = filtered.filter((ex) =>
        (ex.targetMuscles || []).some(tm => muscleList.includes(tm.toLowerCase())) ||
        (ex.target && muscleList.includes(ex.target.toLowerCase()))
      );
    }

    // Filter by body parts
    const rawBodyParts = params.bodyParts || [];
    const bodyPartList = (Array.isArray(rawBodyParts) ? rawBodyParts : String(rawBodyParts).split(','))
      .map(b => b.trim().toLowerCase())
      .filter(b => b && !b.includes('all body'));
    if (bodyPartList.length > 0) {
      filtered = filtered.filter((ex) =>
        (ex.bodyParts || []).some(bp => bodyPartList.includes(bp.toLowerCase())) ||
        (ex.bodyPart && bodyPartList.includes(ex.bodyPart.toLowerCase()))
      );
    }

    // Filter by equipment
    const rawEquips = params.equipments || params.equipment || [];
    const equipList = (Array.isArray(rawEquips) ? rawEquips : String(rawEquips).split(','))
      .map(e => e.trim().toLowerCase())
      .filter(e => e && !e.includes('all equip'));
    if (equipList.length > 0) {
      filtered = filtered.filter((ex) =>
        (ex.equipments || []).some(eq => equipList.includes(eq.toLowerCase()))
      );
    }

    // Pagination / Slicing
    let startIndex = 0;
    if (params.after) {
      const cursorIndex = parseInt(params.after, 10);
      if (!isNaN(cursorIndex) && cursorIndex >= 0) {
        startIndex = cursorIndex;
      }
    }

    const limit = Number(params.limit) > 0 ? Number(params.limit) : filtered.length;
    const endIndex = Math.min(startIndex + limit, filtered.length);
    const pagedData = filtered.slice(startIndex, endIndex);

    return {
      success: true,
      data: pagedData,
      meta: {
        total: filtered.length,
        hasNextPage: endIndex < filtered.length,
        nextCursor: endIndex < filtered.length ? String(endIndex) : null,
      },
    };
  } catch (error) {
    console.error('[exerciseActions] getExercises error:', error?.message);
    throw error;
  }
};

export const searchExercises = async (query) => {
  try {
    const q = (query || '').trim().toLowerCase();
    if (!q) return { success: true, data: [] };

    const results = LOCAL_EXERCISES.filter((ex) =>
      ex.name?.toLowerCase().includes(q) ||
      ex.target?.toLowerCase().includes(q) ||
      ex.equipment?.toLowerCase().includes(q) ||
      (ex.targetMuscles || []).some(m => m.toLowerCase().includes(q)) ||
      (ex.bodyParts || []).some(b => b.toLowerCase().includes(q))
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('[exerciseActions] searchExercises error:', error?.message);
    throw error;
  }
};

export const getExerciseById = async (exerciseId) => {
  try {
    if (!exerciseId) return null;
    const cleanId = String(exerciseId).trim().toLowerCase();
    const found = EXERCISE_BY_ID.get(cleanId) || EXERCISE_BY_NAME.get(cleanId);
    return {
      success: !!found,
      data: found || null,
    };
  } catch (error) {
    console.error(`[exerciseActions] getExerciseById (${exerciseId}) error:`, error?.message);
    throw error;
  }
};

export const getMuscles = async () => {
  try {
    const muscles = [...new Set(LOCAL_EXERCISES.flatMap(e => e.targetMuscles || []))]
      .filter(Boolean)
      .sort();
    return { success: true, data: muscles };
  } catch (error) {
    console.warn('[exerciseActions] getMuscles error:', error?.message);
    return { success: false, data: [] };
  }
};

export const getBodyParts = async () => {
  try {
    const bodyParts = [...new Set(LOCAL_EXERCISES.flatMap(e => e.bodyParts || []))]
      .filter(Boolean)
      .sort();
    return { success: true, data: bodyParts };
  } catch (error) {
    console.warn('[exerciseActions] getBodyParts error:', error?.message);
    return { success: false, data: [] };
  }
};

export const getEquipments = async () => {
  try {
    const equipments = [...new Set(LOCAL_EXERCISES.flatMap(e => e.equipments || []))]
      .filter(Boolean)
      .sort();
    return { success: true, data: equipments };
  } catch (error) {
    console.warn('[exerciseActions] getEquipments error:', error?.message);
    return { success: false, data: [] };
  }
};

export const getExerciseTypes = async () => {
  return {
    success: true,
    data: ['STRENGTH', 'CARDIO', 'STRETCHING', 'PLYOMETRICS'],
  };
};

export const getWarmupExercises = async () => {
  try {
    const warmups = LOCAL_EXERCISES.filter((ex) =>
      ex.category === 'CARDIO' ||
      ex.name?.toLowerCase().includes('stretch') ||
      ex.name?.toLowerCase().includes('jump') ||
      ex.name?.toLowerCase().includes('circle') ||
      (ex.bodyParts || []).includes('cardio')
    ).slice(0, 12);

    return warmups.map((ex, idx) => ({
      exerciseId: ex.exerciseId,
      id: ex.exerciseId || `warmup_${idx}`,
      name: ex.name,
      imageUrl: ex.imageUrl,
      videoUrl: ex.videoUrl || null,
      gifUrl: ex.gifUrl,
      type: 'WARMUP',
      durationSec: 45,
      reps: 12,
      sets: 2,
    }));
  } catch (error) {
    console.warn('[exerciseActions] getWarmupExercises error:', error?.message);
    return [];
  }
};

export const getCompleteWorkouts = async () => {
  try {
    const [warmupRes, strengthRes] = await Promise.all([
      getWarmupExercises(),
      getExercises({ limit: 30 }),
    ]);

    const strengthList = strengthRes?.data || [];

    const completeRoutines = [
      {
        id: 'local-warmup-routine',
        name: 'Full-Body Dynamic Mobility & Warm-up',
        level: 'BEGINNER',
        category: 'WARMUP',
        duration: 10,
        description: 'Prepare your joints, ligaments, and heart rate with dynamic stretches.',
        exercises: warmupRes.slice(0, 6),
      },
      {
        id: 'local-fullbody-routine',
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
          gifUrl: ex.gifUrl,
          videoUrl: ex.videoUrl,
          bodyParts: ex.bodyParts,
          equipments: ex.equipments,
          targetMuscles: ex.targetMuscles,
          sets: 3,
          reps: 10,
          weight: '15 kg',
        })),
      },
      {
        id: 'local-upperbody-routine',
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
          gifUrl: ex.gifUrl,
          videoUrl: ex.videoUrl,
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
    console.error('[exerciseActions] getCompleteWorkouts error:', error?.message);
    return { success: false, warmups: [], routines: [] };
  }
};

// ── Redux Async Thunk Actions ──

export const fetchExercisesRedux = (params = {}) => async (dispatch) => {
  dispatch({ type: types.EXERCISE_FETCH_LIST_REQUEST });
  try {
    const data = await getExercises(params);
    dispatch({
      type: types.EXERCISE_FETCH_LIST_SUCCESS,
      payload: data?.data || [],
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.EXERCISE_FETCH_LIST_FAILURE,
      payload: error.message,
    });
    return [];
  }
};

export const searchExercisesRedux = (query) => async (dispatch) => {
  dispatch({ type: types.EXERCISE_SEARCH_REQUEST });
  try {
    const data = await searchExercises(query);
    dispatch({
      type: types.EXERCISE_SEARCH_SUCCESS,
      payload: data?.data || [],
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.EXERCISE_SEARCH_FAILURE,
      payload: error.message,
    });
    return [];
  }
};

export const fetchExerciseByIdRedux = (exerciseId) => async (dispatch) => {
  dispatch({ type: types.EXERCISE_FETCH_BY_ID_REQUEST });
  try {
    const data = await getExerciseById(exerciseId);
    dispatch({
      type: types.EXERCISE_FETCH_BY_ID_SUCCESS,
      payload: data?.data || data,
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.EXERCISE_FETCH_BY_ID_FAILURE,
      payload: error.message,
    });
    return null;
  }
};

export const fetchExerciseMetadataRedux = () => async (dispatch) => {
  dispatch({ type: types.EXERCISE_FETCH_METADATA_REQUEST });
  try {
    const [muscles, bodyParts, equipments, typesList] = await Promise.all([
      getMuscles(),
      getBodyParts(),
      getEquipments(),
      getExerciseTypes(),
    ]);

    const metadata = {
      muscles: muscles?.data || [],
      bodyParts: bodyParts?.data || [],
      equipments: equipments?.data || [],
      exerciseTypes: typesList?.data || [],
    };

    dispatch({
      type: types.EXERCISE_FETCH_METADATA_SUCCESS,
      payload: metadata,
    });
    return metadata;
  } catch (error) {
    dispatch({
      type: types.EXERCISE_FETCH_METADATA_FAILURE,
      payload: error.message,
    });
    return {};
  }
};

export const fetchCompleteWorkoutsRedux = () => async (dispatch) => {
  dispatch({ type: types.EXERCISE_FETCH_ROUTINES_REQUEST });
  try {
    const data = await getCompleteWorkouts();
    dispatch({
      type: types.EXERCISE_FETCH_ROUTINES_SUCCESS,
      payload: {
        warmups: data?.warmups || [],
        routines: data?.routines || [],
      },
    });
    return data;
  } catch (error) {
    dispatch({
      type: types.EXERCISE_FETCH_ROUTINES_FAILURE,
      payload: error.message,
    });
    return { warmups: [], routines: [] };
  }
};

// Default export object for backwards compatibility
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
