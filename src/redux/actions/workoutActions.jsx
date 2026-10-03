import apiClient from '../../api/apiClient';
import exerciseApi from './exerciseActions';
import * as types from '../actionTypes/actionTypes';
import {
  sortExercisesByAlreadyUsed,
  recordUsedExercises,
  recordExercisePerformance,
  isExerciseUsed,
  initUsedWorkouts,
  clearUserWorkouts,
} from '../../utils/usedWorkoutsManager';

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
  else if (searchStr.includes('bicep') || (searchStr.includes('curl') && !searchStr.includes('leg') && !searchStr.includes('hamstring') && !searchStr.includes('wrist'))) target = 'biceps';
  else if (searchStr.includes('calf') || searchStr.includes('calves')) target = 'calves';
  else if (searchStr.includes('squat') || searchStr.includes('lunge') || searchStr.includes('leg') || searchStr.includes('quad') || searchStr.includes('hamstring') || searchStr.includes('glute')) target = 'quads';
  else if (searchStr.includes('push-up') || searchStr.includes('chest') || searchStr.includes('press') || searchStr.includes('bench') || searchStr.includes('pec')) target = 'pectorals';
  else if (searchStr.includes('shoulder') || searchStr.includes('raise') || searchStr.includes('delt')) target = 'delts';
  else if (searchStr.includes('pulldown') || searchStr.includes('chin-up') || searchStr.includes('pull-up') || searchStr.includes('latissimus') || (searchStr.includes('lat') && !searchStr.includes('lateral') && !searchStr.includes('flat') && !searchStr.includes('platform')) || (searchStr.includes('row') && !searchStr.includes('upright row'))) target = 'lats';
  else if (searchStr.includes('tricep') || searchStr.includes('kickback')) target = 'triceps';
  else if (searchStr.includes('neck')) target = 'neck';
  else if (searchStr.includes('forearm') || searchStr.includes('wrist')) target = 'forearms';
  else if (searchStr.includes('trap') || searchStr.includes('shrug')) target = 'traps';
  else if (searchStr.includes('back')) target = 'lats';

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

import LOCAL_EXERCISES from '../../data/exercises.json';

// Pre-computed lookup index for O(1) ID and Name exercise access
const EXERCISE_MAP_BY_ID = new Map();
const EXERCISE_MAP_BY_NAME = new Map();

(LOCAL_EXERCISES || []).forEach((ex) => {
  if (ex.id) EXERCISE_MAP_BY_ID.set(String(ex.id).toLowerCase(), ex);
  if (ex.exerciseId) EXERCISE_MAP_BY_ID.set(String(ex.exerciseId).toLowerCase(), ex);
  if (ex.name) EXERCISE_MAP_BY_NAME.set(String(ex.name).toLowerCase().trim(), ex);
});

const EXERCISE_ALIASES = {
  'push-up': 'close-grip push-up',
  'push up': 'close-grip push-up',
  'pushups': 'close-grip push-up',
  'plank': 'front plank with twist',
  'plank hold': 'front plank with twist',
  'superman': 'superman push-up',
  'superman hold': 'superman push-up',
  'bodyweight squat': 'bodyweight drop jump squat',
  'squat': 'bodyweight drop jump squat',
  'lunges': 'forward lunge (male)',
  'lunge': 'forward lunge (male)',
  'glute bridge': 'barbell glute bridge',
  'single-leg glute bridge': 'barbell glute bridge',
  'single-leg calf raise': 'standing calf raise',
  'calf raise': 'standing calf raise',
  'mountain climbers': 'bridge - mountain climber (cross body)',
  'mountain climber': 'bridge - mountain climber (cross body)',
  'burpees': 'burpee',
  'burpee': 'burpee',
  'high knees': 'high knee against wall',
  'bench dips': 'chest dip (on dip-pull-up cage)',
  'dips': 'chest dip (on dip-pull-up cage)',
  'inverted row': 'inverted row',
  'inverted bodyweight row': 'inverted row',
  'bicycle crunches': 'band bicycle crunch',
  'bicycle crunch': 'band bicycle crunch',
  'db press': 'dumbbell bench press',
  'dumbbell bench press': 'dumbbell bench press',
  'db goblet squat': 'dumbbell goblet squat',
  'dumbbell goblet squat': 'dumbbell goblet squat',
  'db row': 'dumbbell bent over row',
  'dumbbell row': 'dumbbell bent over row',
  'one-arm dumbbell row': 'dumbbell one arm bent-over row',
  'db shoulder press': 'dumbbell standing overhead press',
  'dumbbell shoulder press': 'dumbbell standing overhead press',
  'dumbbell shoulder press (heavy)': 'dumbbell standing overhead press',
  'db romanian deadlift': 'dumbbell romanian deadlift',
  'dumbbell romanian deadlift': 'dumbbell romanian deadlift',
  'db bicep curl': 'dumbbell alternate biceps curl',
  'dumbbell bicep curl': 'dumbbell alternate biceps curl',
  'dumbbell curl': 'dumbbell alternate biceps curl',
  'dumbbell hammer curl': 'dumbbell hammer curl',
  'db thruster': 'dumbbell push press',
  'dumbbell thruster': 'dumbbell push press',
  'db lunge': 'dumbbell lunge',
  'dumbbell lunges': 'dumbbell lunge',
  'dumbbell lateral raise': 'dumbbell lateral raise',
  'db lateral raise': 'dumbbell lateral raise',
  'db tricep extension': 'barbell lying triceps extension',
  'dumbbell overhead tricep extension': 'barbell lying triceps extension',
  'dumbbell overhead extension': 'barbell lying triceps extension',
  'db pullover': 'dumbbell pullover',
  'dumbbell pullover': 'dumbbell pullover',
  'db rear delt fly': 'barbell rear delt raise',
  'dumbbell rear delt fly': 'barbell rear delt raise',
  'cable tricep pushdown': 'cable pushdown',
  'barbell overhead press': 'barbell seated overhead press',
  'barbell row': 'barbell bent over row',
  'cable face pulls': 'ez barbell decline close grip face press',
  'barbell skull crushers': 'barbell lying triceps extension skull crusher',
  'hack squat machine': 'sled hack squat',
  'cable crossover': 'cable cross-over',
  'deadlift': 'barbell deadlift',
  'romanian deadlift': 'barbell romanian deadlift',
  'lat pulldown': 'cable pulldown',
  'pull-up': 'assisted pull-up',
  'pull up': 'assisted pull-up',
};

export const findLocalExercise = (exercise) => {
  if (!exercise) return null;
  const idKey = exercise.id || exercise.exerciseId;
  if (idKey && EXERCISE_MAP_BY_ID.has(String(idKey).toLowerCase())) {
    return EXERCISE_MAP_BY_ID.get(String(idKey).toLowerCase());
  }
  const nameKey = (exercise.name || exercise.exerciseName || '').toLowerCase().trim();
  if (nameKey && EXERCISE_MAP_BY_NAME.has(nameKey)) {
    return EXERCISE_MAP_BY_NAME.get(nameKey);
  }
  // Check alias lookup
  if (nameKey && EXERCISE_ALIASES[nameKey]) {
    const aliasTarget = EXERCISE_ALIASES[nameKey];
    if (EXERCISE_MAP_BY_NAME.has(aliasTarget)) {
      return EXERCISE_MAP_BY_NAME.get(aliasTarget);
    }
  }
  // Substring / keyword fuzzy lookup
  if (nameKey && nameKey.length >= 3) {
    const matched = (LOCAL_EXERCISES || []).find((e) => {
      const eName = (e.name || '').toLowerCase();
      return eName.includes(nameKey) || nameKey.includes(eName);
    });
    if (matched) return matched;
  }
  return null;
};

export const resolveExerciseImageUri = (exercise) => {
  if (!exercise) return null;

  // 1. Check local exercise dataset first (verified CDN image)
  const localMatch = findLocalExercise(exercise);
  if (localMatch) {
    if (localMatch.imageUrl && typeof localMatch.imageUrl === 'string' && localMatch.imageUrl.startsWith('http')) {
      return localMatch.imageUrl;
    }
    if (localMatch.gifUrl && typeof localMatch.gifUrl === 'string' && localMatch.gifUrl.startsWith('http')) {
      return localMatch.gifUrl;
    }
  }

  // 2. Check exercise object's own valid image URLs (filter out broken github raw URLs)
  if (
    exercise.imageUrl &&
    typeof exercise.imageUrl === 'string' &&
    exercise.imageUrl.startsWith('http') &&
    !exercise.imageUrl.includes('yuhonas/free-exercise-db')
  ) {
    return exercise.imageUrl;
  }
  if (
    exercise.gifUrl &&
    typeof exercise.gifUrl === 'string' &&
    exercise.gifUrl.startsWith('http') &&
    !exercise.gifUrl.includes('yuhonas/free-exercise-db')
  ) {
    return exercise.gifUrl;
  }
  if (exercise.imageUrls) {
    const url = exercise.imageUrls['720p'] || exercise.imageUrls['480p'] || exercise.imageUrls['360p'];
    if (url) return url;
  }

  if (exercise.imageUrl && typeof exercise.imageUrl === 'string' && exercise.imageUrl.startsWith('http')) {
    return exercise.imageUrl;
  }

  return null;
};

export const resolveExerciseAnimationUri = (exercise) => {
  if (!exercise) return null;

  const localMatch = findLocalExercise(exercise);
  if (localMatch) {
    if (localMatch.gifUrl && typeof localMatch.gifUrl === 'string' && localMatch.gifUrl.startsWith('http')) {
      return localMatch.gifUrl;
    }
  }

  if (
    exercise.gifUrl &&
    typeof exercise.gifUrl === 'string' &&
    exercise.gifUrl.startsWith('http') &&
    !exercise.gifUrl.includes('yuhonas/free-exercise-db')
  ) {
    return exercise.gifUrl;
  }
  if (exercise.videoUrl && typeof exercise.videoUrl === 'string' && exercise.videoUrl.startsWith('http')) {
    const clean = exercise.videoUrl.split('?')[0].toLowerCase();
    if (clean.endsWith('.gif')) return exercise.videoUrl;
  }
  if (exercise.gif && typeof exercise.gif === 'string' && exercise.gif.startsWith('http')) return exercise.gif;
  if (exercise.imageUrl && typeof exercise.imageUrl === 'string' && exercise.imageUrl.toLowerCase().includes('.gif')) return exercise.imageUrl;
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
  if (search.includes('ab') || search.includes('sit-up') || search.includes('crunch') || search.includes('core') || search.includes('waist')) {
    return require('../../assets/image/pickpush.jpg');
  }
  return require('../../assets/image/athletic-shirtless-young-male-fitness-model-holds-dumbbell-with-light-isolated-dark-background.png');
};

export const normalizeApiExercise = (ex, index = 0) => {
  const exId = ex.exerciseId || ex.id || `ex_${index}`;
  const targetMuscles = (ex.targetMuscles || ex.primaryMuscles || (ex.target ? [ex.target] : [])).map(m => String(m).toLowerCase());
  const bodyParts = (ex.bodyParts || (ex.bodyPart ? [ex.bodyPart] : [])).map(b => String(b).toLowerCase());
  const equipments = (ex.equipments || (ex.equipment ? [ex.equipment] : [])).map(e => String(e).toLowerCase());

  const resolvedImg = resolveExerciseImageUri(ex);
  const resolvedAnim = resolveExerciseAnimationUri(ex);

  return {
    id: exId,
    exerciseId: exId,
    name: ex.name || '',
    target: ex.target || (targetMuscles[0] || ''),
    bodyPart: ex.bodyPart || (bodyParts[0] || ''),
    equipment: ex.equipment || (equipments[0] || ''),
    imageUrl: resolvedImg,
    imageUrls: ex.imageUrls || null,
    videoUrl: ex.videoUrl || null,
    gifUrl: resolvedAnim || ex.gifUrl || resolvedImg,
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
  biceps: ['biceps', 'bicep', 'biceps brachii', 'brachialis'],
  chest: ['chest', 'pectoral', 'pectorals', 'upper chest', 'lower chest', 'serratus', 'pecs', 'serratus anterior'],
  pectorals: ['chest', 'pectoral', 'pectorals', 'upper chest', 'lower chest'],
  forearms: ['forearms', 'forearm', 'wrist flexors', 'wrist extensors', 'brachioradialis'],
  lats: ['lats', 'latissimus', 'latissimus dorsi'],
  'lower back': ['lower back', 'erector spinae', 'back', 'lumbar', 'spine'],
  neck: ['neck', 'sternocleidomastoid', 'levator scapulae'],
  shoulders: ['shoulders', 'shoulder', 'deltoids', 'delts', 'anterior deltoid', 'lateral deltoid', 'posterior deltoid'],
  delts: ['shoulders', 'shoulder', 'deltoids', 'delts'],
  traps: ['traps', 'trapezius'],
  triceps: ['triceps', 'tricep'],
  'upper back': ['upper back', 'rhomboids', 'infraspinatus', 'teres major'],
  abductors: ['abductors', 'abductor', 'hip abductors', 'gluteus medius', 'tensor fasciae latae'],
  adductors: ['adductors', 'adductor', 'inner thigh', 'groin'],
  calves: ['calves', 'calf', 'gastrocnemius', 'soleus', 'lower leg'],
  glutes: ['glutes', 'glute', 'gluteus maximus', 'butt', 'hips'],
  hamstrings: ['hamstrings', 'hamstring', 'biceps femoris', 'semitendinosus'],
  quadriceps: ['quadriceps', 'quads', 'quad', 'rectus femoris', 'thighs'],
  quads: ['quadriceps', 'quads', 'quad', 'rectus femoris', 'thighs'],
  cardio: ['cardio', 'cardiovascular system', 'running', 'jogging', 'jump', 'aerobic'],
  'full body': ['full body', 'compound', 'functional', 'bodyweight'],
  back: ['back', 'lats', 'latissimus', 'traps', 'trapezius', 'rhomboids', 'lower back', 'upper back', 'spine'],
  legs: ['quads', 'quadriceps', 'hamstrings', 'calves', 'glutes', 'thighs', 'upper legs', 'lower legs'],
  arms: ['biceps', 'triceps', 'forearms', 'upper arms', 'lower arms'],
};

const BODY_PART_TERMS = new Set([
  'upper arms', 'lower arms', 'arms',
  'upper legs', 'lower legs', 'legs',
  'back', 'chest', 'waist', 'shoulders', 'neck', 'cardio'
]);

const isMuscleMatch = (exMuscle, filterM) => {
  const m1 = String(exMuscle || '').toLowerCase().trim();
  const m2 = String(filterM || '').toLowerCase().trim();
  if (!m1 || !m2) return false;
  if (m1 === m2) return true;

  // Protect against false match between "biceps femoris" (hamstrings) and arm "biceps"
  if (
    (m1.includes('biceps femoris') && (m2 === 'biceps' || m2 === 'bicep' || m2.includes('biceps brachii'))) ||
    (m2.includes('biceps femoris') && (m1 === 'biceps' || m1 === 'bicep' || m1.includes('biceps brachii')))
  ) {
    return false;
  }

  // Protect against false match between "lateral" / "flat" / "platform" and "lat" / "lats"
  if (
    ((m1.includes('lateral') || m1.includes('flat') || m1.includes('platform') || m1.includes('unilateral')) && (m2 === 'lats' || m2 === 'lat')) ||
    ((m2.includes('lateral') || m2.includes('flat') || m2.includes('platform') || m2.includes('unilateral')) && (m1 === 'lats' || m1 === 'lat'))
  ) {
    return false;
  }

  const synonyms1 = muscleSynonyms[m2] || [];
  if (synonyms1.includes(m1)) return true;

  const synonyms2 = muscleSynonyms[m1] || [];
  if (synonyms2.includes(m2)) return true;

  if (m1.includes(m2) || m2.includes(m1)) {
    if (
      (m1.includes('biceps femoris') || m2.includes('biceps femoris')) &&
      (m1 === 'biceps' || m2 === 'biceps' || m1 === 'bicep' || m2 === 'bicep')
    ) {
      return false;
    }
    // Prevent "lat" or "lats" from matching words like "lateral", "flat", "platform"
    if (m2 === 'lat' || m2 === 'lats') {
      return /\b(lat|lats|latissimus)\b/i.test(m1);
    }
    if (m1 === 'lat' || m1 === 'lats') {
      return /\b(lat|lats|latissimus)\b/i.test(m2);
    }
    return true;
  }

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
  if (clean1.includes('machine') && (clean2.includes('machine') || clean2.includes('cable') || clean2.includes('leverage'))) return true;
  if (clean2.includes('machine') && (clean1.includes('machine') || clean1.includes('cable') || clean1.includes('leverage'))) return true;
  if ((clean1.includes('plate') || clean1.includes('weighted')) && (clean2.includes('plate') || clean2.includes('weighted'))) return true;

  return false;
};

export const fetchExercises = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_EXERCISES_REQUEST, payload: { isLoadMore: params.isLoadMore } });
  try {
    // Target muscles filter
    const filterMuscles = [];
    const rawMuscles = params.targetMuscles || params.muscles || params.muscle || [];
    const muscleList = Array.isArray(rawMuscles) ? rawMuscles : String(rawMuscles).split(',');
    muscleList.forEach(tm => {
      const cleaned = tm.trim().toLowerCase();
      if (cleaned && !cleaned.includes('all muscle')) filterMuscles.push(cleaned);
    });

    // Body parts filter (if explicitly passed, e.g. for level body parts)
    const filterBodyParts = [];
    const rawBodyParts = params.bodyParts || [];
    const bodyPartList = Array.isArray(rawBodyParts) ? rawBodyParts : String(rawBodyParts).split(',');
    bodyPartList.forEach(bp => {
      const cleaned = bp.trim().toLowerCase();
      if (cleaned && !cleaned.includes('all body')) filterBodyParts.push(cleaned);
    });

    // Filter by equipment
    const filterEquipments = [];
    const rawEquips = params.equipments || params.equipment || [];
    const equipList = Array.isArray(rawEquips) ? rawEquips : String(rawEquips).split(',');
    equipList.forEach(eq => {
      const cleaned = eq.trim().toLowerCase();
      if (cleaned && !cleaned.includes('all equip')) filterEquipments.push(cleaned);
    });

    const searchQuery = (params.search || params.name || params.keywords || '').trim().toLowerCase();

    // Fetch all exercises from local dataset (zero network latency)
    const apiRes = await exerciseApi.getExercises({ limit: 0 });
    let allExercises = (apiRes?.data || []).map(normalizeApiExercise);

    let filteredList = allExercises;

    // Apply search query filtering across name, target, body parts, and equipments
    if (searchQuery) {
      const isLatQuery = searchQuery === 'lat' || searchQuery === 'lats';
      filteredList = filteredList.filter(ex => {
        if (isLatQuery) {
          const latRegex = /\b(lat|lats|latissimus)\b/i;
          return (
            latRegex.test(ex.name || '') ||
            latRegex.test(ex.target || '') ||
            (ex.targetMuscles || []).some(m => latRegex.test(m))
          );
        }
        return (
          (ex.name || '').toLowerCase().includes(searchQuery) ||
          (ex.target || '').toLowerCase().includes(searchQuery) ||
          (ex.equipment || '').toLowerCase().includes(searchQuery) ||
          (ex.targetMuscles || []).some(m => m.toLowerCase().includes(searchQuery)) ||
          (ex.bodyParts || []).some(bp => bp.toLowerCase().includes(searchQuery)) ||
          (ex.equipments || []).some(eq => eq.toLowerCase().includes(searchQuery))
        );
      });
    }

    // Apply equipment filtering
    if (filterEquipments.length > 0) {
      filteredList = filteredList.filter(ex =>
        (ex.equipments || []).some(eq => filterEquipments.some(filterEq => isEquipmentMatch(eq, filterEq))) ||
        (ex.equipment && filterEquipments.some(filterEq => isEquipmentMatch(ex.equipment, filterEq)))
      );
    }

    // Apply target muscle filtering
    if (filterMuscles.length > 0) {
      filteredList = filteredList.filter(ex => {
        // Direct target muscle match
        const matchesTarget =
          (ex.targetMuscles || []).some(m => filterMuscles.some(filterM => isMuscleMatch(m, filterM))) ||
          (ex.target && filterMuscles.some(filterM => isMuscleMatch(ex.target, filterM)));
        if (matchesTarget) return true;

        // If the filter term is a recognized broader body part term (e.g. 'arms', 'legs', 'back'), check bodyParts
        const matchesBodyPart = filterMuscles.some(filterM => {
          const fLower = filterM.toLowerCase().trim();
          if (!BODY_PART_TERMS.has(fLower)) return false;
          return (
            (ex.bodyParts || []).some(bp => isMuscleMatch(bp, fLower)) ||
            (ex.bodyPart && isMuscleMatch(ex.bodyPart, fLower))
          );
        });
        return matchesBodyPart;
      });
    }

    // Apply explicit body part filtering (when specifically passed in params)
    if (filterBodyParts.length > 0) {
      filteredList = filteredList.filter(ex =>
        (ex.bodyParts || []).some(bp => filterBodyParts.some(filterBp => isMuscleMatch(bp, filterBp))) ||
        (ex.bodyPart && filterBodyParts.some(filterBp => isMuscleMatch(ex.bodyPart, filterBp)))
      );
    }

    // Prioritize already used workouts/exercises at the very beginning (even when filtered by muscles)
    filteredList = sortExercisesByAlreadyUsed(filteredList);

    const totalCount = filteredList.length;
    let paginatedList = filteredList;

    // Slicing/pagination after filtering across the whole dataset
    const limit = Number(params.limit);
    if (limit > 0 && params.after) {
      const cursorIndex = parseInt(params.after, 10);
      const startIndex = (!isNaN(cursorIndex) && cursorIndex >= 0) ? cursorIndex : 0;
      paginatedList = filteredList.slice(startIndex, startIndex + limit);
    } else if (limit > 0 && (filterEquipments.length === 0 && filterMuscles.length === 0 && !searchQuery) && limit < filteredList.length) {
      // If no filters are active, cap initial view to limit for smooth initial render
      paginatedList = filteredList.slice(0, limit);
    }

    const lastItem = paginatedList[paginatedList.length - 1];
    const nextCursor = lastItem ? lastItem.id : null;

    dispatch({
      type: types.WORKOUT_GET_EXERCISES_SUCCESS,
      payload: {
        exercises: paginatedList,
        meta: {
          total: totalCount,
          hasNextPage: paginatedList.length < filteredList.length,
          nextCursor
        },
        isLoadMore: params.isLoadMore
      },
    });
    return paginatedList;
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
  if (s.includes('hamstring') || s.includes('biceps femoris') || s.includes('semitendinosus')) return 'Hamstrings';
  if (s.includes('bicep') || s.includes('brachialis')) return 'Biceps';
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
  if (s.includes('gastrocnemius') || s.includes('soleus') || s.includes('calf') || s.includes('calves')) return 'Calves';
  if (s.includes('adductor') || s.includes('pectineus') || s.includes('gracilis')) return 'Adductors';
  if (s.includes('abductor') || s.includes('tensor fasciae')) return 'Abductors';
  if (s.includes('forearm') || s.includes('flexor') || s.includes('extensor') || s.includes('brachioradialis')) return 'Forearms';
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
    if (sessionData?.exercises || sessionData?.templateExercises) {
      recordUsedExercises(sessionData.exercises || sessionData.templateExercises);
      recordExercisePerformance(sessionData.exercises || sessionData.templateExercises);
    }
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

export const updateWorkoutSession = (sessionId, updateData) => async (dispatch) => {
  try {
    const response = await apiClient.put(`/workouts/sessions/${sessionId}`, updateData);
    const data = response.data?.data || response.data;
    if (data && data.user) {
      const userProfile = data.user.userProfile;
      data.user = {
        ...data.user,
        name: data.user.name || userProfile?.name || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || userProfile?.username || null,
        username: data.user.username || userProfile?.username || (data.user.email ? data.user.email.split('@')[0] : null),
        avatar: data.user.avatar || userProfile?.profileImage || null,
      };
    }
    return data;
  } catch (error) {
    console.error('API Error in updateWorkoutSession:', error);
    const errorMessage = error.response?.data || new Error('Server error updating workout session.');
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
      name: wk.name || wk.dayName || 'Workout',
      duration: wk.duration != null ? String(wk.duration) : null,
      calories: wk.calories != null ? String(wk.calories) : null,
      exercises: (wk.exercises || []).map(ex => ({
        ...ex,
        imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || ex.gifUrl || null,
        gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseImageUri(ex) || null,
      })),
    }));
    const response = await apiClient.post('/workouts/sessions/custom-templates', { folderName, workouts: formattedWorkouts });
    (workouts || []).forEach(wk => {
      if (wk.exercises) recordUsedExercises(wk.exercises);
    });
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
      data.forEach(folder => {
        (folder.workouts || []).forEach(wk => {
          const exList = wk.exercises || wk.workoutExercises || [];
          if (Array.isArray(exList) && exList.length > 0) {
            recordUsedExercises(exList);
          }
        });
      });
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
    if (Array.isArray(exercises) && exercises.length > 0) {
      recordUsedExercises(exercises);
    }
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

export const renameCustomWorkoutFolder = (folderId, newName) => async (dispatch) => {
  try {
    const response = await apiClient.put(`/workouts/sessions/custom-folders/${folderId}`, { name: newName });
    return response.data.data;
  } catch (error) {
    console.error('API Error in renameCustomWorkoutFolder:', error);
    throw error.response?.data || new Error('Failed to rename folder.');
  }
};

export const fetchWorkoutHistory = (params = {}) => async (dispatch) => {
  dispatch({ type: types.WORKOUT_GET_HISTORY_REQUEST });
  try {
    const queryParams = new URLSearchParams(params).toString();
    const url = `/workouts/sessions${queryParams ? `?${queryParams}` : ''}`;
    const response = await apiClient.get(url);
    const sessions = response.data?.data || response.data || [];
    if (Array.isArray(sessions)) {
      sessions.forEach(sess => {
        const dateMs = sess.date ? new Date(sess.date).getTime() : Date.now();
        if (Array.isArray(sess.logs)) recordExercisePerformance(sess.logs, dateMs);
        if (Array.isArray(sess.exercises)) recordExercisePerformance(sess.exercises, dateMs);
        (sess.logs || []).forEach(l => {
          if (l.exercise) recordUsedExercises([l.exercise], dateMs);
          else if (l.exerciseId) recordUsedExercises([{ id: l.exerciseId, name: l.exerciseName || '' }], dateMs);
        });
        if (Array.isArray(sess.exercises)) {
          recordUsedExercises(sess.exercises, dateMs);
        }
      });
    }
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

export {
  sortExercisesByAlreadyUsed,
  recordUsedExercises,
  isExerciseUsed,
  initUsedWorkouts,
  clearUserWorkouts,
};
