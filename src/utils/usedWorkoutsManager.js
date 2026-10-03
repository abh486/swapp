import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

const BASE_USED_WORKOUTS_KEY = '@already_used_workout_exercises';
const BASE_EXERCISE_PERF_KEY = '@exercise_previous_history';

let currentUserId = null;
let isInitialized = false;
let initPromise = null;

export const getCurrentUserId = () => currentUserId;

export const setCurrentUserId = (userId) => {
  if (userId && currentUserId !== userId) {
    clearUserWorkouts();
    currentUserId = userId;
  } else if (!userId && currentUserId) {
    clearUserWorkouts();
  }
};

const resolveActiveUserId = async (preferredUserId = null) => {
  if (preferredUserId) {
    currentUserId = preferredUserId;
    return preferredUserId;
  }
  if (currentUserId) {
    return currentUserId;
  }
  try {
    const cached = await AsyncStorage.getItem('userProfile');
    if (cached) {
      const parsed = JSON.parse(cached);
      const uid = parsed?.id || parsed?.userId || parsed?.user_id || parsed?.sub;
      if (uid) {
        currentUserId = uid;
        return uid;
      }
    }
  } catch (_) {}
  return null;
};

const getUsedKey = (userId) => (userId ? `${BASE_USED_WORKOUTS_KEY}_${userId}` : null);
const getPerfKey = (userId) => (userId ? `${BASE_EXERCISE_PERF_KEY}_${userId}` : null);
const getLatestWorkoutKey = (userId) => (userId ? `latestWorkoutData_${userId}` : null);
const getCustomFoldersKey = (userId) => (userId ? `@cached_custom_workout_folders_${userId}` : null);

// Pre-defined exercise aliases for robust cross-naming matching
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

// In-memory lookup maps for lightning-fast synchronous checking
const usedById = new Map();
const usedByName = new Map();

// In-memory cache for exercise performance history (sets, lastSet, bestSet)
const perfById = new Map();
const perfByName = new Map();

/**
 * Clear in-memory cache and reset active user state
 */
export const clearUserWorkouts = () => {
  usedById.clear();
  usedByName.clear();
  perfById.clear();
  perfByName.clear();
  currentUserId = null;
  isInitialized = false;
  initPromise = null;
};

const normalizeStr = (str) => {
  if (!str) return '';
  return String(str).toLowerCase().trim();
};

/**
 * Proactively save in-memory entries into user-scoped AsyncStorage
 */
const persistUsedExercises = async () => {
  try {
    const uid = await resolveActiveUserId();
    if (!uid) return;
    const key = getUsedKey(uid);
    if (!key) return;
    const list = Array.from(usedByName.values());
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn('[UsedWorkoutsManager] Failed to persist used exercises:', err);
  }
};

/**
 * Persist previous exercise performance data to user-scoped AsyncStorage
 */
const persistExercisePerformance = async () => {
  try {
    const uid = await resolveActiveUserId();
    if (!uid) return;
    const key = getPerfKey(uid);
    if (!key) return;
    const list = Array.from(perfByName.values());
    await AsyncStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn('[UsedWorkoutsManager] Failed to persist exercise performance:', err);
  }
};

/**
 * Register one or more exercises as used.
 * @param {Array|Object} exercises - Single exercise or array of exercises
 * @param {number} [timestamp] - Optional custom timestamp (defaults to Date.now())
 * @param {string} [userId] - Optional user id
 */
export const recordUsedExercises = (exercises, timestamp = Date.now(), userId = null) => {
  if (!exercises) return;
  if (userId && currentUserId !== userId) {
    clearUserWorkouts();
    currentUserId = userId;
  }
  const list = Array.isArray(exercises) ? exercises : [exercises];
  if (list.length === 0) return;

  let hasChanges = false;

  list.forEach((ex) => {
    if (!ex) return;
    const rawId = ex.id || ex._id || ex.exerciseId;
    const rawName = ex.name || ex.exerciseName;

    const idKey = rawId ? normalizeStr(rawId) : null;
    const nameKey = rawName ? normalizeStr(rawName) : null;

    if (!idKey && !nameKey) return;

    // Check existing entry
    let existing = null;
    if (idKey && usedById.has(idKey)) {
      existing = usedById.get(idKey);
    } else if (nameKey && usedByName.has(nameKey)) {
      existing = usedByName.get(nameKey);
    }

    const updated = {
      id: rawId || (existing && existing.id) || null,
      name: rawName || (existing && existing.name) || '',
      lastUsedAt: Math.max(timestamp, (existing && existing.lastUsedAt) || 0),
      count: ((existing && existing.count) || 0) + 1,
    };

    if (idKey) usedById.set(idKey, updated);
    if (nameKey) usedByName.set(nameKey, updated);

    // Also register alias name if present
    if (nameKey && EXERCISE_ALIASES[nameKey]) {
      usedByName.set(normalizeStr(EXERCISE_ALIASES[nameKey]), updated);
    }

    hasChanges = true;
  });

  if (hasChanges) {
    persistUsedExercises();
  }
};

/**
 * Check if a given exercise has been used before.
 * @param {Object} exercise
 * @returns {{ isUsed: boolean, count: number, lastUsedAt: number }|null}
 */
export const isExerciseUsed = (exercise) => {
  if (!exercise || (usedById.size === 0 && usedByName.size === 0)) return null;

  const rawId = exercise.id || exercise._id || exercise.exerciseId;
  const rawName = exercise.name || exercise.exerciseName;

  const idKey = rawId ? normalizeStr(rawId) : null;
  const nameKey = rawName ? normalizeStr(rawName) : null;

  if (idKey && usedById.has(idKey)) {
    const entry = usedById.get(idKey);
    return { isUsed: true, count: entry.count, lastUsedAt: entry.lastUsedAt };
  }

  if (nameKey && usedByName.has(nameKey)) {
    const entry = usedByName.get(nameKey);
    return { isUsed: true, count: entry.count, lastUsedAt: entry.lastUsedAt };
  }

  // Check alias
  if (nameKey && EXERCISE_ALIASES[nameKey]) {
    const aliasKey = normalizeStr(EXERCISE_ALIASES[nameKey]);
    if (usedByName.has(aliasKey)) {
      const entry = usedByName.get(aliasKey);
      return { isUsed: true, count: entry.count, lastUsedAt: entry.lastUsedAt };
    }
  }

  // Check reverse alias lookup
  if (nameKey) {
    for (const [alias, canonical] of Object.entries(EXERCISE_ALIASES)) {
      if (canonical === nameKey && usedByName.has(alias)) {
        const entry = usedByName.get(alias);
        return { isUsed: true, count: entry.count, lastUsedAt: entry.lastUsedAt };
      }
    }
  }

  return null;
};

/**
 * Sort any list of exercises so that ALREADY USED workouts/exercises come FIRST!
 * Preserves the original relative order among non-used exercises.
 * Even when filtered by selected muscles or equipment, this guarantees used exercises
 * matching the filter appear at the very top.
 *
 * @param {Array} exercisesList - The filtered or unfiltered exercises list
 * @returns {Array} - Reordered list with used exercises at the top, tagged with isAlreadyUsed
 */
export const sortExercisesByAlreadyUsed = (exercisesList) => {
  if (!Array.isArray(exercisesList) || exercisesList.length === 0) {
    return [];
  }
  if (usedById.size === 0 && usedByName.size === 0) {
    return exercisesList;
  }

  const used = [];
  const unused = [];

  for (let i = 0; i < exercisesList.length; i++) {
    const ex = exercisesList[i];
    const match = isExerciseUsed(ex);

    if (match) {
      used.push({
        exercise: {
          ...ex,
          isAlreadyUsed: true,
          lastUsedAt: match.lastUsedAt,
          useCount: match.count,
        },
        lastUsedAt: match.lastUsedAt || 0,
        count: match.count || 0,
        originalIndex: i,
      });
    } else {
      unused.push(ex);
    }
  }

  // Sort used items: most recently used first, then by frequency, then original order
  used.sort((a, b) => {
    if (b.lastUsedAt !== a.lastUsedAt) {
      return b.lastUsedAt - a.lastUsedAt;
    }
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.originalIndex - b.originalIndex;
  });

  return [...used.map(u => u.exercise), ...unused];
};

/**
 * Register exercise performance data (completed sets, weights, reps)
 * Supports exercises array, workout logs array, or single exercise
 * @param {Array|Object} items
 * @param {number} [timestamp]
 */
export const recordExercisePerformance = (items, timestamp = Date.now()) => {
  if (!items) return;
  const list = Array.isArray(items) ? items : [items];
  if (list.length === 0) return;

  let hasChanges = false;

  list.forEach((item) => {
    if (!item) return;

    // Handle different shapes:
    // Shape 1: workoutLog { exerciseId, exercise: { id, name }, sets: [...] }
    // Shape 2: exercise { id, name, sets: [...], setsArray: [...], reps, weight }
    const rawId = item.exercise?.id || item.exerciseId || item.id || item._id;
    const rawName = item.exercise?.name || item.name || item.exerciseName;

    const idKey = rawId ? normalizeStr(rawId) : null;
    const nameKey = rawName ? normalizeStr(rawName) : null;

    if (!idKey && !nameKey) return;

    // Extract sets - ONLY completed sets with actual reps or weight
    const rawSets = item.sets || item.completedSets || [];
    let validSets = [];

    if (Array.isArray(rawSets) && rawSets.length > 0) {
      validSets = rawSets
        .filter(s => s && s.completed !== false)
        .map(s => ({
          reps: s.reps !== undefined && s.reps !== null ? Number(s.reps) : 0,
          weight: s.weight !== undefined && s.weight !== null ? parseFloat(String(s.weight).replace(',', '.')) || 0 : 0,
        }))
        .filter(s => s.reps > 0 || s.weight > 0);
    }

    if (validSets.length === 0) return;

    let bestSet = validSets[0];
    validSets.forEach(s => {
      if (s.weight > bestSet.weight || (s.weight === bestSet.weight && s.reps > bestSet.reps)) {
        bestSet = s;
      }
    });
    const lastSet = validSets[validSets.length - 1];

    const perfEntry = {
      id: rawId || null,
      name: rawName || '',
      sets: validSets,
      lastSet,
      bestSet,
      lastUpdated: timestamp,
    };

    if (idKey) perfById.set(idKey, perfEntry);
    if (nameKey) perfByName.set(nameKey, perfEntry);

    if (nameKey && EXERCISE_ALIASES[nameKey]) {
      perfByName.set(normalizeStr(EXERCISE_ALIASES[nameKey]), perfEntry);
    }

    hasChanges = true;
  });

  if (hasChanges) {
    persistExercisePerformance();
  }
};

/**
 * Record personal bests returned from backend
 * @param {Object} pbMap - { [exerciseName]: { weight, reps } }
 */
export const recordPersonalBests = (pbMap) => {
  if (!pbMap || typeof pbMap !== 'object') return;
  let hasChanges = false;

  Object.entries(pbMap).forEach(([name, data]) => {
    if (!name || !data) return;
    const nameKey = normalizeStr(name);
    const w = parseFloat(data.weight) || 0;
    const r = parseInt(data.reps, 10) || 0;
    if (w <= 0 && r <= 0) return;

    const existing = perfByName.get(nameKey);
    const updated = {
      id: (existing && existing.id) || null,
      name: name,
      sets: (existing && existing.sets) || [{ weight: w, reps: r }],
      lastSet: (existing && existing.lastSet) || { weight: w, reps: r },
      bestSet: {
        weight: Math.max(w, existing?.bestSet?.weight || 0),
        reps: Math.max(r, existing?.bestSet?.reps || 0),
      },
      lastUpdated: Date.now(),
    };

    perfByName.set(nameKey, updated);
    if (EXERCISE_ALIASES[nameKey]) {
      perfByName.set(normalizeStr(EXERCISE_ALIASES[nameKey]), updated);
    }
    hasChanges = true;
  });

  if (hasChanges) {
    persistExercisePerformance();
  }
};

/**
 * Retrieve cached performance history for an exercise
 * @param {Object} exercise
 * @returns {Object|null}
 */
export const getExercisePerformanceHistory = (exercise) => {
  if (!exercise) return null;
  const rawId = exercise.id || exercise._id || exercise.exerciseId;
  const rawName = exercise.name || exercise.exerciseName;

  const idKey = rawId ? normalizeStr(rawId) : null;
  const nameKey = rawName ? normalizeStr(rawName) : null;

  if (idKey && perfById.has(idKey)) {
    return perfById.get(idKey);
  }
  if (nameKey && perfByName.has(nameKey)) {
    return perfByName.get(nameKey);
  }
  if (nameKey && EXERCISE_ALIASES[nameKey]) {
    const aliasKey = normalizeStr(EXERCISE_ALIASES[nameKey]);
    if (perfByName.has(aliasKey)) {
      return perfByName.get(aliasKey);
    }
  }
  if (nameKey) {
    for (const [alias, canonical] of Object.entries(EXERCISE_ALIASES)) {
      if (canonical === nameKey && perfByName.has(alias)) {
        return perfByName.get(alias);
      }
    }
  }
  return null;
};

/**
 * Formats weight and reps into human-readable previous text (e.g., '50kg x 10' or '45s')
 * @param {number|string} weight
 * @param {number|string} reps
 * @param {boolean} [isTimeBased=false]
 * @returns {string}
 */
export const formatSetPerformance = (weight, reps, isTimeBased = false) => {
  const parsedWeight = parseFloat(String(weight !== undefined && weight !== null ? weight : 0).replace(',', '.'));
  const parsedReps = parseInt(reps !== undefined && reps !== null ? reps : 0, 10);
  const validWeight = !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;
  const validReps = !isNaN(parsedReps) && parsedReps > 0 ? parsedReps : 0;

  if (validWeight === 0 && validReps === 0) {
    return '—';
  }

  if (isTimeBased) {
    const secs = validWeight > 0 ? validWeight : validReps;
    return `${secs}s`;
  }

  const weightStr = Number.isInteger(validWeight)
    ? `${validWeight}`
    : validWeight.toFixed(1).replace(/\.0$/, '');

  if (validWeight > 0 && validReps > 0) {
    return `${weightStr}kg x ${validReps}`;
  }

  if (validWeight > 0 && validReps === 0) {
    return `${weightStr}kg`;
  }

  if (validWeight === 0 && validReps > 0) {
    return `0kg x ${validReps}`;
  }

  return '—';
};

/**
 * Robust, multi-layered resolver to get previous weight & reps for an exercise set
 * Resolves across:
 * 1. Explicit set-level previous text/previous fields
 * 2. Set-level prevWeight / prevReps
 * 3. exercise.previousSets array
 * 4. Cached previous workout history from persistent storage / backend
 * 5. personalBests map or exercise.personalBest
 * 6. exercise.setsArray (templates)
 * 7. exercise.weight and exercise.reps
 * 8. Current workout session completed earlier sets
 *
 * @param {Object} exercise - Exercise object
 * @param {number} idx - Set index (0-indexed)
 * @param {Object} [currentSet] - Optional current set object
 * @param {boolean} [isTimeBased=false] - Whether time-based
 * @param {Object} [personalBests=null] - Optional personal bests map
 * @returns {string} - Formatted previous string (e.g. '50kg x 10' or '—')
 */
export const getPreviousForExercise = (
  exercise,
  idx,
  currentSet = null,
  isTimeBased = false,
  personalBests = null
) => {
  if (!exercise) return '—';

  // 1. Direct formatted string on set
  if (currentSet?.prevText && typeof currentSet.prevText === 'string' && currentSet.prevText !== '—') {
    return currentSet.prevText;
  }
  if (currentSet?.previous && typeof currentSet.previous === 'string' && currentSet.previous !== '—') {
    return currentSet.previous;
  }

  // 2. Direct prevWeight / prevReps on currentSet (from past workout history)
  if (currentSet && (currentSet.prevWeight != null || currentSet.prevReps != null)) {
    const pw = currentSet.prevWeight;
    const pr = currentSet.prevReps;
    const formatted = formatSetPerformance(pw, pr, isTimeBased);
    if (formatted !== '—') return formatted;
  }

  // 3. exercise.previousSets array (from past completed workout)
  if (Array.isArray(exercise.previousSets) && exercise.previousSets.length > 0) {
    const targetSet = exercise.previousSets[idx] || exercise.previousSets[exercise.previousSets.length - 1];
    if (targetSet) {
      const formatted = formatSetPerformance(targetSet.weight, targetSet.reps, isTimeBased);
      if (formatted !== '—') return formatted;
    }
  }

  // 4. Cached history from previous completed workout sessions in usedWorkoutsManager
  const perfHistory = getExercisePerformanceHistory(exercise);
  if (perfHistory && Array.isArray(perfHistory.sets) && perfHistory.sets.length > 0) {
    const targetSet = perfHistory.sets[idx] || perfHistory.lastSet || perfHistory.bestSet;
    if (targetSet) {
      const formatted = formatSetPerformance(targetSet.weight, targetSet.reps, isTimeBased);
      if (formatted !== '—') return formatted;
    }
  }

  // 5. Check personal bests (passed in or in exercise from actual past workouts)
  const pbMap = personalBests || exercise.personalBests || exercise.personalBest;
  const exName = exercise.name || exercise.exerciseName;
  if (pbMap && exName) {
    const norm = normalizeStr(exName);
    if (pbMap.weight !== undefined || pbMap.reps !== undefined) {
      const formatted = formatSetPerformance(pbMap.weight, pbMap.reps, isTimeBased);
      if (formatted !== '—') return formatted;
    } else {
      const matchKey = Object.keys(pbMap).find(k => normalizeStr(k) === norm);
      if (matchKey && pbMap[matchKey]) {
        const pb = pbMap[matchKey];
        const formatted = formatSetPerformance(pb.weight, pb.reps, isTimeBased);
        if (formatted !== '—') return formatted;
      }
    }
  }

  return '—';
};

/**
 * Harvest exercises and past performance from user-scoped local storage and remote backend history.
 * Runs non-blockingly so the app is always fast.
 * @param {string|null} [userId=null] - Explicit user ID to initialize for
 */
export const initUsedWorkouts = (userId = null) => {
  if (userId && currentUserId === userId && isInitialized) {
    return Promise.resolve();
  }
  if (initPromise && (!userId || currentUserId === userId)) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const activeUserId = await resolveActiveUserId(userId);

      // Clean up legacy un-scoped storage keys if they exist so they don't leak across users
      AsyncStorage.removeItem('@already_used_workout_exercises').catch(() => {});
      AsyncStorage.removeItem('@exercise_previous_history').catch(() => {});

      if (!activeUserId) {
        // Unauthenticated or guest state: wipe any previous user's data
        usedById.clear();
        usedByName.clear();
        perfById.clear();
        perfByName.clear();
        currentUserId = null;
        isInitialized = true;
        return;
      }

      // If user changed, clear previous user's in-memory data
      usedById.clear();
      usedByName.clear();
      perfById.clear();
      perfByName.clear();

      // 1. Load from user-scoped used workouts key
      const usedKey = getUsedKey(activeUserId);
      if (usedKey) {
        const storedStr = await AsyncStorage.getItem(usedKey);
        if (storedStr) {
          try {
            const list = JSON.parse(storedStr);
            if (Array.isArray(list)) {
              list.forEach(item => {
                if (!item) return;
                const idKey = item.id ? normalizeStr(item.id) : null;
                const nameKey = item.name ? normalizeStr(item.name) : null;
                if (idKey) usedById.set(idKey, item);
                if (nameKey) usedByName.set(nameKey, item);
              });
            }
          } catch (e) {
            console.warn('[UsedWorkoutsManager] Parse stored used workouts failed:', e);
          }
        }
      }

      // 1b. Load from user-scoped exercise performance history key
      const perfKey = getPerfKey(activeUserId);
      if (perfKey) {
        const storedPerfStr = await AsyncStorage.getItem(perfKey);
        if (storedPerfStr) {
          try {
            const perfList = JSON.parse(storedPerfStr);
            if (Array.isArray(perfList)) {
              perfList.forEach(item => {
                if (!item) return;
                const idKey = item.id ? normalizeStr(item.id) : null;
                const nameKey = item.name ? normalizeStr(item.name) : null;
                if (idKey) perfById.set(idKey, item);
                if (nameKey) perfByName.set(nameKey, item);
                if (nameKey && EXERCISE_ALIASES[nameKey]) {
                  perfByName.set(normalizeStr(EXERCISE_ALIASES[nameKey]), item);
                }
              });
            }
          } catch (e) {
            console.warn('[UsedWorkoutsManager] Parse stored performance failed:', e);
          }
        }
      }

      // 2. Harvest from user-scoped latestWorkoutData (AsyncStorage)
      try {
        const latestKey = getLatestWorkoutKey(activeUserId);
        const latestStr = latestKey ? await AsyncStorage.getItem(latestKey) : null;
        if (latestStr) {
          const latest = JSON.parse(latestStr);
          const exercises = latest.exercises || latest.templateExercises || [];
          if (Array.isArray(exercises) && exercises.length > 0) {
            recordUsedExercises(exercises, Date.now() - 3600000);
            recordExercisePerformance(exercises, Date.now() - 3600000);
          }
        }
      } catch (e) { }

      // 3. Harvest from user-scoped custom workout folders (AsyncStorage)
      try {
        const customFoldersKey = getCustomFoldersKey(activeUserId);
        const cachedFoldersStr = customFoldersKey ? await AsyncStorage.getItem(customFoldersKey) : null;
        if (cachedFoldersStr) {
          const folders = JSON.parse(cachedFoldersStr);
          if (Array.isArray(folders)) {
            folders.forEach(folder => {
              (folder.workouts || []).forEach(wk => {
                const exList = wk.exercises || wk.workoutExercises || [];
                if (Array.isArray(exList) && exList.length > 0) {
                  recordUsedExercises(exList, Date.now() - 86400000);
                }
              });
            });
          }
        }
      } catch (e) { }

      // 4. Background query past workout history from backend for this user (if logged in)
      apiClient.get('/workouts/sessions?limit=50').then(res => {
        // Ensure user hasn't switched while network request was in-flight
        if (currentUserId !== activeUserId) return;

        const sessions = res?.data?.data || res?.data?.sessions || [];
        if (Array.isArray(sessions) && sessions.length > 0) {
          // Sort oldest first so recent workouts take precedence
          const sorted = [...sessions].reverse();
          sorted.forEach(session => {
            const dateMs = session.date ? new Date(session.date).getTime() : Date.now();
            const logs = session.logs || [];
            if (logs.length > 0) {
              recordExercisePerformance(logs, dateMs);
            }
            logs.forEach(log => {
              if (log.exercise) {
                recordUsedExercises([log.exercise], dateMs);
              } else if (log.exerciseId) {
                recordUsedExercises([{ id: log.exerciseId, name: log.exerciseName || '' }], dateMs);
              }
            });
            if (Array.isArray(session.exercises) && session.exercises.length > 0) {
              recordUsedExercises(session.exercises, dateMs);
              recordExercisePerformance(session.exercises, dateMs);
            }
          });
        }
      }).catch(() => {
        // Silently ignore if offline or not logged in yet
      });

      isInitialized = true;
    } catch (err) {
      console.warn('[UsedWorkoutsManager] initUsedWorkouts error:', err);
      isInitialized = true;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

// Auto-trigger initialization on module import if cached profile exists
initUsedWorkouts();

export default {
  initUsedWorkouts,
  clearUserWorkouts,
  recordUsedExercises,
  isExerciseUsed,
  sortExercisesByAlreadyUsed,
  recordExercisePerformance,
  recordPersonalBests,
  getExercisePerformanceHistory,
  formatSetPerformance,
  getPreviousForExercise,
  getCurrentUserId,
  setCurrentUserId,
};
