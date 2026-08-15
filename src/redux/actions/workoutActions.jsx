import apiClient from '../../api/apiClient';
import exerciseApi from './exerciseActions';
import * as types from '../actionTypes/actionTypes';

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

export const resolveExerciseImageUri = (exercise) => {
  if (!exercise) return null;
  if (exercise.imageUrl && typeof exercise.imageUrl === 'string' && exercise.imageUrl.startsWith('http')) return exercise.imageUrl;
  if (exercise.gifUrl && typeof exercise.gifUrl === 'string' && exercise.gifUrl.startsWith('http')) return exercise.gifUrl;
  if (exercise.imageUrls) {
    const url = exercise.imageUrls['720p'] || exercise.imageUrls['480p'] || exercise.imageUrls['360p'];
    if (url) return url;
  }
  const exId = exercise.exerciseId || exercise.id;
  if (exId && typeof exId === 'string' && exId.startsWith('exr_')) {
    return `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/image/${exId}`;
  }
  if (exercise.name && typeof exercise.name === 'string') {
    const formattedName = exercise.name
      .trim()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('_');
    return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${formattedName}/0.jpg`;
  }
  return null;
};

export const getExerciseMuscleFallback = (exercise) => {
  if (!exercise) return require('../../assets/image/athletic-shirtless-young-male-fitness-model-holds-dumbbell-with-light-isolated-dark-background.png');
  const name = (exercise.name || exercise.exerciseName || '').toLowerCase();
  const target = (
    (exercise.targetMuscles && exercise.targetMuscles[0]) ||
    (exercise.bodyParts && exercise.bodyParts[0]) ||
    exercise.target ||
    exercise.bodyPart ||
    ''
  ).toLowerCase();

  const search = `${name} ${target}`;

  if (search.includes('pull') || search.includes('lat') || search.includes('back') || search.includes('row') || search.includes('chin')) {
    return require('../../assets/image/pullup.jpg');
  }
  if (search.includes('lunge') || search.includes('squat') || search.includes('glute') || search.includes('leg') || search.includes('quad') || search.includes('hip') || search.includes('side')) {
    return require('../../assets/image/pistol.jpg');
  }
  if (search.includes('chest') || search.includes('push') || search.includes('press') || search.includes('bench') || search.includes('pec')) {
    return require('../../assets/image/chest.jpg');
  }
  if (search.includes('arm') || search.includes('bicep') || search.includes('tricep') || search.includes('curl')) {
    return require('../../assets/image/arm.jpg');
  }
  return require('../../assets/image/athletic-shirtless-young-male-fitness-model-holds-dumbbell-with-light-isolated-dark-background.png');
};

export const normalizeApiExercise = (ex, index = 0) => {
  const exId = ex.exerciseId || ex.id || `ex_${index}`;
  const targetMuscles = (ex.targetMuscles || ex.primaryMuscles || []).map(m => String(m).toLowerCase());
  const bodyParts = (ex.bodyParts || []).map(b => String(b).toLowerCase());
  const equipments = (ex.equipments || (ex.equipment ? [ex.equipment] : [])).map(e => String(e).toLowerCase());

  const resolvedImg = resolveExerciseImageUri(ex);

  return {
    id: exId,
    exerciseId: exId,
    name: ex.name || '',
    imageUrl: resolvedImg,
    imageUrls: ex.imageUrls || null,
    videoUrl: ex.videoUrl || null,
    gifUrl: resolvedImg,
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

const muscleSynonyms = {
  abdominals: ['abdominals', 'abs', 'obliques', 'waist', 'core', 'rectus abdominis', 'stomach'],
  abs: ['abdominals', 'abs', 'obliques', 'waist', 'core'],
  biceps: ['biceps', 'bicep', 'brachialis', 'brachioradialis', 'arms'],
  chest: ['chest', 'pectoral', 'pectorals', 'upper chest', 'lower chest', 'serratus', 'pecs'],
  pectorals: ['chest', 'pectoral', 'pectorals', 'upper chest', 'lower chest'],
  forearms: ['forearms', 'forearm', 'wrist flexors', 'wrist extensors', 'brachioradialis'],
  lats: ['lats', 'latissimus', 'latissimus dorsi', 'back', 'mid back'],
  'lower back': ['lower back', 'erector spinae', 'back', 'lumbar'],
  neck: ['neck', 'sternocleidomastoid'],
  shoulders: ['shoulders', 'shoulder', 'deltoids', 'delts', 'anterior deltoid', 'lateral deltoid', 'posterior deltoid'],
  delts: ['shoulders', 'shoulder', 'deltoids', 'delts'],
  traps: ['traps', 'trapezius', 'upper back'],
  triceps: ['triceps', 'tricep', 'arms'],
  'upper back': ['upper back', 'rhomboids', 'infraspinatus', 'teres major', 'back'],
  abductors: ['abductors', 'abductor', 'hip abductors', 'gluteus medius', 'tensor fasciae latae'],
  adductors: ['adductors', 'adductor', 'inner thigh', 'groin'],
  calves: ['calves', 'calf', 'gastrocnemius', 'soleus', 'lower leg'],
  glutes: ['glutes', 'glute', 'gluteus maximus', 'butt', 'hips'],
  hamstrings: ['hamstrings', 'hamstring', 'biceps femoris', 'semitendinosus'],
  quadriceps: ['quadriceps', 'quads', 'quad', 'rectus femoris', 'thighs'],
  quads: ['quadriceps', 'quads', 'quad', 'rectus femoris', 'thighs'],
  cardio: ['cardio', 'running', 'jogging', 'jump', 'aerobic'],
  'full body': ['full body', 'compound', 'functional', 'bodyweight'],
  back: ['back', 'lats', 'latissimus', 'traps', 'trapezius', 'rhomboids', 'lower back', 'upper back'],
  legs: ['quads', 'quadriceps', 'hamstrings', 'calves', 'glutes', 'thighs'],
};

const isMuscleMatch = (exMuscle, filterM) => {
  const m1 = String(exMuscle || '').toLowerCase().trim();
  const m2 = String(filterM || '').toLowerCase().trim();
  if (!m1 || !m2) return false;
  if (m1.includes(m2) || m2.includes(m1)) return true;

  const synonyms1 = muscleSynonyms[m2] || [];
  if (synonyms1.some(syn => m1.includes(syn) || syn.includes(m1))) return true;

  const synonyms2 = muscleSynonyms[m1] || [];
  if (synonyms2.some(syn => m2.includes(syn) || syn.includes(m2))) return true;

  return false;
};

const isEquipmentMatch = (exEquipment, filterEq) => {
  const e1 = String(exEquipment || '').toLowerCase().trim();
  const e2 = String(filterEq || '').toLowerCase().trim();
  if (!e1 || !e2) return false;
  if (e1 === 'all equipment' || e2 === 'all equipment' || e1 === 'all' || e2 === 'all') return true;

  const clean1 = e1.replace(/s$/, '');
  const clean2 = e2.replace(/s$/, '');

  if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
  if ((clean1.includes('body') || clean1 === 'none') && (clean2.includes('body') || clean2 === 'none')) return true;
  if (clean1.includes('band') && clean2.includes('band')) return true;
  if (clean1.includes('cable') && clean2.includes('cable')) return true;
  if (clean1.includes('barbell') && clean2.includes('barbell')) return true;
  if (clean1.includes('dumbbell') && clean2.includes('dumbbell')) return true;
  if (clean1.includes('kettlebell') && clean2.includes('kettlebell')) return true;
  if (clean1.includes('machine') && clean2.includes('machine')) return true;

  return false;
};

export const fetchExercises = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EXERCISES_REQUEST, payload: { isLoadMore: params.isLoadMore } });
  try {
    let rawExercises = [];
    let hasNextPage = false;
    let nextCursor = null;
    let totalCount = 0;

    // Filter by muscles / body parts
    const filterMuscles = [];
    const rawMuscles = params.targetMuscles || params.muscles || params.bodyParts || params.muscle || [];
    const muscleList = Array.isArray(rawMuscles) ? rawMuscles : String(rawMuscles).split(',');
    muscleList.forEach(tm => {
      const cleaned = tm.trim().toLowerCase();
      if (cleaned && !cleaned.includes('all muscle')) filterMuscles.push(cleaned);
    });

    // Filter by equipment
    const filterEquipments = [];
    const rawEquips = params.equipments || params.equipment || [];
    const equipList = Array.isArray(rawEquips) ? rawEquips : String(rawEquips).split(',');
    equipList.forEach(eq => {
      const cleaned = eq.trim().toLowerCase();
      if (cleaned && !cleaned.includes('all equip')) filterEquipments.push(cleaned);
    });

    const searchQuery = (params.search || params.name || params.keywords || '').trim();

    if (searchQuery) {
      const apiRes = await exerciseApi.searchExercises(searchQuery);
      if (apiRes && apiRes.data && apiRes.data.length > 0) {
        rawExercises = apiRes.data.map(normalizeApiExercise);
        totalCount = rawExercises.length;
      }
    } else if (filterMuscles.length > 0 && filterEquipments.length === 0) {
      const apiRes = await exerciseApi.searchExercises(filterMuscles[0]);
      if (apiRes && apiRes.data && apiRes.data.length > 0) {
        rawExercises = apiRes.data.map(normalizeApiExercise);
        totalCount = rawExercises.length;
      }
    }

    if (rawExercises.length === 0) {
      let currentAfter = params.after || undefined;
      let targetLimit = Number(params.limit) || 350;
      let fetchedCount = 0;
      let maxPages = 15;

      while (fetchedCount < targetLimit && maxPages > 0) {
        maxPages--;
        try {
          const apiRes = await exerciseApi.getExercises({
            limit: 50,
            after: currentAfter,
          });

          const pageData = apiRes?.data || [];
          if (!pageData.length) break;

          const normalizedPage = pageData.map(normalizeApiExercise);
          rawExercises.push(...normalizedPage);
          fetchedCount += normalizedPage.length;

          hasNextPage = Boolean(apiRes?.meta?.hasNextPage);
          currentAfter = apiRes?.meta?.nextCursor;

          if (!hasNextPage || !currentAfter) break;
        } catch (pageErr) {
          console.warn('[fetchExercises] Page fetch warning:', pageErr?.message);
          break;
        }
      }
      totalCount = rawExercises.length;
      nextCursor = currentAfter;
    }

    let filteredList = rawExercises;

    // Apply equipment filtering
    if (filterEquipments.length > 0) {
      filteredList = filteredList.filter(ex =>
        ex.equipments.some(eq => filterEquipments.some(filterEq => isEquipmentMatch(eq, filterEq)))
      );
    }

    // Apply muscle filtering
    if (filterMuscles.length > 0) {
      filteredList = filteredList.filter(ex =>
        ex.targetMuscles.some(m => filterMuscles.some(filterM => isMuscleMatch(m, filterM))) ||
        ex.bodyParts.some(bp => filterMuscles.some(filterM => isMuscleMatch(bp, filterM)))
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
    const formattedWorkouts = (workouts || []).map(wk => ({
      ...wk,
      exercises: (wk.exercises || []).map(ex => ({
        ...ex,
        imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || ex.gifUrl || null,
        gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseImageUri(ex) || null,
      })),
    }));
    const response = await apiClient.post('/workouts/sessions/custom-templates', { folderName, workouts: formattedWorkouts });
    return response.data.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const getCustomWorkoutTemplates = () => async (dispatch) => {
  try {
    const response = await apiClient.get('/workouts/sessions/custom-templates');
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data.map(folder => ({
        ...folder,
        workouts: (folder.workouts || []).map(wk => ({
          ...wk,
          exercises: (wk.exercises || wk.workoutExercises || []).map(ex => ({
            ...ex,
            imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || ex.gifUrl || null,
            gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseImageUri(ex) || null,
          })),
        })),
      }));
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || new Error('Server error.');
  }
};

export const updateCustomWorkoutTemplate = (templateId, exercises) => async (dispatch) => {
  try {
    const formattedExercises = (exercises || []).map(ex => ({
      ...ex,
      imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || ex.gifUrl || null,
      gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseImageUri(ex) || null,
    }));
    const response = await apiClient.put(`/workouts/sessions/custom-templates/${templateId}`, { exercises: formattedExercises });
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
