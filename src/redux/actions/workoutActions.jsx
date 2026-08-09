import apiClient from '../../api/apiClient';
import exerciseApi from '../../api/exerciseApi';
import * as types from '../actionTypes/actionTypes';
import exercisesData from '../../assets/exercises.json';

const normalizeFilterList = value => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map(item => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .filter(item => !item.startsWith('all '));
};

const normalizeExercisesResponse = data => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.exercises)) return data.exercises;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const mapNameToMuscleAndEquipment = (name, displayName) => {
  const nameLower = (name || '').toLowerCase();
  const displayLower = (displayName || '').toLowerCase();
  const searchStr = `${nameLower} ${displayLower}`;

  let target = 'abs';
  if (searchStr.includes('sit-up') || searchStr.includes('crunch') || searchStr.includes('ab_') || searchStr.includes('abdominal') || searchStr.includes('oblique') || searchStr.includes('heel touch')) target = 'abs';
  else if (searchStr.includes('bicep') || searchStr.includes('curl')) target = 'biceps';
  else if (searchStr.includes('calf') || searchStr.includes('calves')) target = 'calves';
  else if (searchStr.includes('squat') || searchStr.includes('lunge') || searchStr.includes('leg') || searchStr.includes('quad') || searchStr.includes('hamstring') || searchStr.includes('glute')) target = 'quads';
  else if (searchStr.includes('push-up') || searchStr.includes('chest') || searchStr.includes('press') || searchStr.includes('bench') || searchStr.includes('pec')) target = 'pectorals';
  else if (searchStr.includes('back') || searchStr.includes('row') || searchStr.includes('chin-up') || searchStr.includes('pull-up') || searchStr.includes('lat')) target = 'lats';
  else if (searchStr.includes('shoulder') || searchStr.includes('raise') || searchStr.includes('delt')) target = 'delts';
  else if (searchStr.includes('tricep') || searchStr.includes('kickback')) target = 'triceps';
  else if (searchStr.includes('neck')) target = 'neck';
  else if (searchStr.includes('forearm')) target = 'forearms';
  else if (searchStr.includes('trap')) target = 'traps';

  let equipment = 'body weight';
  if (searchStr.includes('dumbbell')) equipment = 'dumbbell';
  else if (searchStr.includes('barbell')) equipment = 'barbell';
  else if (searchStr.includes('kettlebell')) equipment = 'kettlebell';
  else if (searchStr.includes('cable')) equipment = 'cable';
  else if (searchStr.includes('band')) equipment = 'resistance band';
  else if (searchStr.includes('ball')) equipment = 'medicine ball';
  else if (searchStr.includes('machine')) equipment = 'machine';

  return { target, equipment };
};

export const normalizeApiExercise = (ex, index = 0) => {
  const exId = ex.exerciseId || ex.id || `ex_${index}`;
  const targetMuscles = (ex.targetMuscles || ex.primaryMuscles || []).map(m => String(m).toLowerCase());
  const bodyParts = (ex.bodyParts || []).map(b => String(b).toLowerCase());
  const equipments = (ex.equipments || (ex.equipment ? [ex.equipment] : [])).map(e => String(e).toLowerCase());

  return {
    id: exId,
    exerciseId: exId,
    name: ex.name || '',
    imageUrl: ex.imageUrl || ex.imageUrls?.['720p'] || ex.imageUrls?.['480p'] || null,
    imageUrls: ex.imageUrls || null,
    videoUrl: ex.videoUrl || null,
    gifUrl: ex.imageUrl || ex.videoUrl || null,
    targetMuscles: targetMuscles.length > 0 ? targetMuscles : bodyParts,
    secondaryMuscles: (ex.secondaryMuscles || []).map(m => String(m).toLowerCase()),
    equipments: equipments.length > 0 ? equipments : ['body weight'],
    bodyParts: bodyParts,
    instructions: ex.instructions || [],
    exerciseTips: ex.exerciseTips || [],
    overview: ex.overview || '',
    variations: ex.variations || [],
    category: ex.exerciseType || ex.category || 'STRENGTH',
    cursor: exId
  };
};

const getLocalMappedExercises = () => {
  const list = exercisesData?.exercises || [];
  return list.map(normalizeApiExercise);
};

export const fetchExercises = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EXERCISES_REQUEST, payload: { isLoadMore: params.isLoadMore } });
  try {
    let rawExercises = [];
    let hasNextPage = false;
    let nextCursor = null;
    let totalCount = 0;

    const localList = getLocalMappedExercises();

    try {
      if (params.search || params.name) {
        const searchQuery = (params.search || params.name).trim();
        const apiRes = await exerciseApi.searchExercises(searchQuery);
        if (apiRes && apiRes.data && apiRes.data.length > 0) {
          rawExercises = apiRes.data.map(normalizeApiExercise);
          totalCount = rawExercises.length;
        }
      } else {
        const limit = Number(params.limit) || 200;
        const apiRes = await exerciseApi.getExercises({
          limit,
          after: params.after || undefined,
          keywords: params.keywords || undefined,
        });
        if (apiRes && apiRes.data && apiRes.data.length > 0) {
          rawExercises = apiRes.data.map(normalizeApiExercise);
          hasNextPage = Boolean(apiRes.meta?.hasNextPage);
          nextCursor = apiRes.meta?.nextCursor || null;
          totalCount = apiRes.meta?.total || rawExercises.length;
        }
      }
    } catch (apiError) {
      console.warn('[fetchExercises] RapidAPI call error, falling back to full local dataset:', apiError?.message);
      rawExercises = [];
    }

    // Merge API exercises with local JSON exercises (avoiding duplicate IDs)
    const exerciseMap = new Map();
    localList.forEach(ex => exerciseMap.set(ex.id || ex.name.toLowerCase(), ex));
    rawExercises.forEach(ex => exerciseMap.set(ex.id || ex.name.toLowerCase(), ex));

    const combinedExercises = Array.from(exerciseMap.values());
    totalCount = combinedExercises.length;

    let filteredList = combinedExercises;

    // Filter by equipment
    if (params.equipments) {
      const rawEquips = Array.isArray(params.equipments)
        ? params.equipments
        : String(params.equipments).split(',');
      const cleanedEquips = rawEquips.map(e => e.trim().toLowerCase()).filter(Boolean);

      if (cleanedEquips.length > 0 && !cleanedEquips.includes('all equipment')) {
        filteredList = filteredList.filter(ex =>
          ex.equipments.some(eq => cleanedEquips.some(filterEq => eq.includes(filterEq) || filterEq.includes(eq)))
        );
      }
    }

    // Filter by muscles / body parts
    const filterMuscles = [];
    if (params.targetMuscles) {
      const list = Array.isArray(params.targetMuscles) ? params.targetMuscles : String(params.targetMuscles).split(',');
      list.forEach(tm => {
        const cleaned = tm.trim().toLowerCase();
        if (cleaned && cleaned !== 'all muscles') filterMuscles.push(cleaned);
      });
    }
    if (params.bodyParts) {
      const list = Array.isArray(params.bodyParts) ? params.bodyParts : String(params.bodyParts).split(',');
      list.forEach(bp => {
        const cleaned = bp.trim().toLowerCase();
        if (cleaned) filterMuscles.push(cleaned);
      });
    }

    if (filterMuscles.length > 0) {
      filteredList = filteredList.filter(ex =>
        ex.targetMuscles.some(m => filterMuscles.some(filterM => m.includes(filterM) || filterM.includes(m))) ||
        ex.bodyParts.some(bp => filterMuscles.some(filterM => bp.includes(filterM) || filterM.includes(bp)))
      );
    }

    const lastItem = filteredList[filteredList.length - 1];
    nextCursor = nextCursor || (lastItem ? lastItem.id : null);

    dispatch({
      type: types.WORKOUT_GET_EXERCISES_SUCCESS,
      payload: {
        exercises: filteredList,
        meta: {
          total: totalCount || filteredList.length,
          hasNextPage,
          nextCursor
        },
        isLoadMore: params.isLoadMore
      },
    });
    return filteredList;
  } catch (error) {
    console.error('Fetch Exercises Error:', error);
    dispatch({
      type: types.WORKOUT_GET_EXERCISES_FAILURE,
      payload: error.message || 'Error fetching exercises',
    });
  }
};

export const fetchBodyParts = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_BODY_PARTS_REQUEST });
  try {
    const res = await exerciseApi.getBodyParts();
    const bodyParts = (res?.data || []).map(item => item.name);
    dispatch({
      type: types.WORKOUT_GET_BODY_PARTS_SUCCESS,
      payload: bodyParts,
    });
    return bodyParts;
  } catch (err) {
    dispatch({
      type: types.WORKOUT_GET_BODY_PARTS_SUCCESS,
      payload: ['BACK', 'CHEST', 'SHOULDERS', 'WAIST', 'BICEPS', 'TRICEPS', 'QUADRICEPS', 'CALVES'],
    });
    return ['BACK', 'CHEST', 'SHOULDERS', 'WAIST', 'BICEPS', 'TRICEPS', 'QUADRICEPS', 'CALVES'];
  }
};

const mapRawMuscleToCleanName = (rawName) => {
  if (!rawName) return '';
  const s = String(rawName).toLowerCase().trim();
  if (s.includes('bicep') || s.includes('brachialis') || s.includes('brachioradialis')) return 'Biceps';
  if (s.includes('tricep')) return 'Triceps';
  if (s.includes('deltoid')) return 'Shoulders';
  if (s.includes('pectoral') || s.includes('pec ')) return 'Chest';
  if (s.includes('latissimus') || s.includes('lats')) return 'Lats';
  if (s.includes('trapezius') || s.includes('trap')) return 'Traps';
  if (s.includes('spinae') || s.includes('erector') || s.includes('lower back')) return 'Lower Back';
  if (s.includes('rhomboid') || s.includes('upper back') || s.includes('infraspinatus') || s.includes('scapulae')) return 'Upper Back';
  if (s.includes('abdomin') || s.includes('oblique') || s.includes('rectus')) return 'Abdominals';
  if (s.includes('glute')) return 'Glutes';
  if (s.includes('quadriceps') || s.includes('rectus femoris')) return 'Quadriceps';
  if (s.includes('hamstring') || s.includes('biceps femoris') || s.includes('semitendinosus')) return 'Hamstrings';
  if (s.includes('gastrocnemius') || s.includes('soleus') || s.includes('calf') || s.includes('calves')) return 'Calves';
  if (s.includes('adductor') || s.includes('pectineus') || s.includes('gracilis')) return 'Adductors';
  if (s.includes('abductor') || s.includes('tensor fasciae')) return 'Abductors';
  if (s.includes('forearm') || s.includes('flexor') || s.includes('extensor')) return 'Forearms';
  if (s.includes('neck') || s.includes('sternocleidomastoid')) return 'Neck';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const fetchMuscles = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_MUSCLES_REQUEST });
  try {
    const res = await exerciseApi.getMuscles();
    const rawList = (res?.data || []).map(item => item.name);
    const cleanedSet = new Set();
    rawList.forEach(m => {
      const clean = mapRawMuscleToCleanName(m);
      if (clean) cleanedSet.add(clean);
    });

    const defaultMuscles = [
      'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Cardio',
      'Chest', 'Forearms', 'Full Body', 'Glutes', 'Hamstrings', 'Lats',
      'Lower Back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back'
    ];

    defaultMuscles.forEach(m => cleanedSet.add(m));
    const muscles = Array.from(cleanedSet).sort();

    dispatch({
      type: types.WORKOUT_GET_MUSCLES_SUCCESS,
      payload: muscles,
    });
    return muscles;
  } catch (err) {
    const defaultMuscles = [
      'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Cardio',
      'Chest', 'Forearms', 'Full Body', 'Glutes', 'Hamstrings', 'Lats',
      'Lower Back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back'
    ];
    dispatch({
      type: types.WORKOUT_GET_MUSCLES_SUCCESS,
      payload: defaultMuscles,
    });
    return defaultMuscles;
  }
};

const mapRawEquipmentToCleanName = (rawName) => {
  if (!rawName) return '';
  const s = String(rawName).toLowerCase().trim();
  if (s === 'body weight' || s === 'bodyweight' || s === 'none') return 'None';
  if (s.includes('barbell') || s.includes('ez barbell') || s.includes('olympic barbell') || s.includes('trap bar')) return 'Barbell';
  if (s.includes('dumbbell')) return 'Dumbbell';
  if (s.includes('kettlebell')) return 'Kettlebell';
  if (s.includes('cable') || s.includes('leverage machine') || s.includes('smith machine') || s.includes('sled machine')) return 'Machine';
  if (s.includes('resistance band') || s.includes('band')) return 'Resistance Band';
  if (s.includes('suspension')) return 'Suspension Band';
  if (s.includes('weighted') || s.includes('plate') || s.includes('vibrate plate')) return 'Plate';
  if (s.includes('ball') || s.includes('bosu') || s.includes('medicine ball') || s.includes('stability ball')) return 'Medicine Ball';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const fetchEquipments = () => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EQUIPMENTS_REQUEST });
  try {
    const res = await exerciseApi.getEquipments();
    const rawList = (res?.data || []).map(item => item.name);
    const cleanedSet = new Set(['Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other']);

    rawList.forEach(eq => {
      const clean = mapRawEquipmentToCleanName(eq);
      if (clean && clean !== 'None') cleanedSet.add(clean);
    });

    const equipments = Array.from(cleanedSet);

    dispatch({
      type: types.WORKOUT_GET_EQUIPMENTS_SUCCESS,
      payload: equipments,
    });
    return equipments;
  } catch (err) {
    const defaultEquips = ['Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other'];
    dispatch({
      type: types.WORKOUT_GET_EQUIPMENTS_SUCCESS,
      payload: defaultEquips,
    });
    return defaultEquips;
  }
};

export const logWorkoutSession = (sessionData) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_LOG_SESSION_REQUEST });
  try {
    const response = await apiClient.post('/workouts/sessions', sessionData);
    dispatch({
      type: types.WORKOUT_LOG_SESSION_SUCCESS,
      payload: response.data.data,
    });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_LOG_SESSION_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

export const deleteWorkoutSession = (sessionId) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_DELETE_SESSION_REQUEST });
  try {
    const response = await apiClient.delete(`/workouts/sessions/${sessionId}`);
    dispatch({
      type: types.WORKOUT_DELETE_SESSION_SUCCESS,
      payload: sessionId,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_DELETE_SESSION_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

export const deleteExerciseFromSession = (sessionId, logId) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_DELETE_EXERCISE_REQUEST });
  try {
    const response = await apiClient.delete(`/workouts/sessions/${sessionId}/logs/${logId}`);
    dispatch({
      type: types.WORKOUT_DELETE_EXERCISE_SUCCESS,
      payload: { sessionId, logId },
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error.response?.data || new Error('Server error.');
    dispatch({
      type: types.WORKOUT_DELETE_EXERCISE_FAILURE,
      payload: errorMessage,
    });
    throw errorMessage;
  }
};

export const fetchWarmupsAndCompleteWorkouts = () => async (dispatch) => {
  try {
    const data = await exerciseApi.getCompleteWorkouts();
    dispatch({
      type: 'WORKOUT_GET_COMPLETE_ROUTINES_SUCCESS',
      payload: data,
    });
    return data;
  } catch (error) {
    console.error('fetchWarmupsAndCompleteWorkouts Error:', error);
    return { success: false, warmups: [], routines: [] };
  }
};

export const setSelectedFilters = (equipment, muscles) => ({
  type: types.WORKOUT_SET_SELECTED_FILTERS,
  payload: { equipment, muscles },
});

export const clearSelectedFilters = () => ({
  type: types.WORKOUT_CLEAR_SELECTED_FILTERS,
});

export const saveCustomWorkoutTemplate = (folderName, workouts) => async (dispatch) => {
  try {
    const response = await apiClient.post('/workouts/sessions/custom-templates', { folderName, workouts });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const getCustomWorkoutTemplates = () => async (dispatch) => {
  try {
    const response = await apiClient.get('/workouts/sessions/custom-templates');
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const updateCustomWorkoutTemplate = (templateId, exercises) => async (dispatch) => {
  try {
    const response = await apiClient.put(`/workouts/sessions/custom-templates/${templateId}`, { exercises });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const deleteCustomWorkoutFolder = (folderId) => async (dispatch) => {
  try {
    const response = await apiClient.delete(`/workouts/sessions/custom-folders/${folderId}`);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const fetchWorkoutHistory = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_HISTORY_REQUEST });
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `/workouts/sessions${queryParams ? `?${queryParams}` : ''}`;
    const response = await apiClient.get(url);
    dispatch({
      type: types.WORKOUT_GET_HISTORY_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    dispatch({
      type: types.WORKOUT_GET_HISTORY_FAILURE,
      payload: error.response?.data || new Error('Server error.'),
    });
    throw error.response?.data || new Error('Server error.');
  }
};
