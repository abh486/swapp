/**
 * workoutCalorieCalculator.js
 * Comprehensive exercise science calorie calculation utility.
 * 
 * Computes realistic calorie expenditure based on:
 * 1. TIME: Total duration in seconds or minutes.
 * 2. WORKOUT:
 *    - Workout Title / Category / Focus (Cardio, HIIT, Legs, Upper, Core, Full Body, etc.)
 *    - Specific exercise movements, target muscle groups, and body parts
 *    - Mechanical work volume (kg moved), reps (weighted & bodyweight), and completed sets
 *    - Time-based holds (planks, isometric holds)
 * 3. USER: Body weight in kg (defaults to standard 70kg / 154lbs if unspecified)
 */

// Metabolic Equivalent of Task (MET) ratings based on exercise science compendium
export const WORKOUT_MET_TABLE = {
  // Cardio & High Intensity Interval Training
  HIIT: 9.0,
  CARDIO: 8.5,
  AEROBIC: 8.0,
  CIRCUIT: 8.0,
  TABATA: 9.5,
  RUNNING: 9.0,
  CYCLING: 7.5,
  ROWING: 7.5,
  JUMP_ROPE: 10.0,

  // Compound & Heavy Lower Body (Largest muscle mass recruitment)
  LEGS: 6.8,
  LOWER_BODY: 6.8,
  GLUTES: 6.5,
  QUADS: 6.8,
  FULL_BODY: 7.0,
  POWERLIFTING: 6.5,
  CROSSFIT: 8.0,

  // Upper Body Compound
  UPPER_BODY: 5.8,
  CHEST: 5.8,
  BACK: 6.0,
  PUSH: 5.8,
  PULL: 6.0,

  // Small Muscle Groups & Isolation
  SHOULDERS: 5.0,
  ARMS: 4.8,
  BICEPS: 4.6,
  TRICEPS: 4.6,
  CORE: 5.0,
  ABS: 5.0,
  CALVES: 4.5,

  // Light / Recovery
  STRETCHING: 3.0,
  MOBILITY: 3.2,
  YOGA: 3.2,
  WARMUP: 3.5,
  COOLDOWN: 2.8,

  // General Resistance Default
  GENERAL_STRENGTH: 5.5,
};

/**
 * Determine the workout MET rating from the title and exercises
 */
export const getWorkoutMET = (workoutTitle = '', exercises = []) => {
  const titleLower = String(workoutTitle || '').toLowerCase();

  // 1. High intensity & cardio keywords
  if (
    titleLower.includes('hiit') ||
    titleLower.includes('tabata') ||
    titleLower.includes('interval') ||
    titleLower.includes('cardio') ||
    titleLower.includes('burn') ||
    titleLower.includes('fat loss') ||
    titleLower.includes('run') ||
    titleLower.includes('circuit')
  ) {
    return WORKOUT_MET_TABLE.HIIT;
  }

  // 2. Full body & Crossfit
  if (
    titleLower.includes('full body') ||
    titleLower.includes('full-body') ||
    titleLower.includes('crossfit') ||
    titleLower.includes('wod') ||
    titleLower.includes('total body')
  ) {
    return WORKOUT_MET_TABLE.FULL_BODY;
  }

  // 3. Lower body & Legs
  if (
    titleLower.includes('leg') ||
    titleLower.includes('glute') ||
    titleLower.includes('quad') ||
    titleLower.includes('hamstring') ||
    titleLower.includes('squat') ||
    titleLower.includes('lower body')
  ) {
    return WORKOUT_MET_TABLE.LEGS;
  }

  // 4. Back & Pull
  if (
    titleLower.includes('back') ||
    titleLower.includes('pull') ||
    titleLower.includes('deadlift') ||
    titleLower.includes('lat')
  ) {
    return WORKOUT_MET_TABLE.BACK;
  }

  // 5. Chest & Push
  if (
    titleLower.includes('chest') ||
    titleLower.includes('push') ||
    titleLower.includes('bench') ||
    titleLower.includes('pectoral')
  ) {
    return WORKOUT_MET_TABLE.CHEST;
  }

  // 6. Upper Body
  if (titleLower.includes('upper body') || titleLower.includes('upper')) {
    return WORKOUT_MET_TABLE.UPPER_BODY;
  }

  // 7. Shoulders / Arms / Core
  if (
    titleLower.includes('shoulder') ||
    titleLower.includes('arm') ||
    titleLower.includes('bicep') ||
    titleLower.includes('tricep')
  ) {
    return WORKOUT_MET_TABLE.SHOULDERS;
  }

  if (
    titleLower.includes('ab') ||
    titleLower.includes('core') ||
    titleLower.includes('waist')
  ) {
    return WORKOUT_MET_TABLE.CORE;
  }

  // 8. Stretching / Warmup
  if (
    titleLower.includes('stretch') ||
    titleLower.includes('warm') ||
    titleLower.includes('cool') ||
    titleLower.includes('yoga') ||
    titleLower.includes('mobility')
  ) {
    return WORKOUT_MET_TABLE.STRETCHING;
  }

  // 9. Inspect exercises if available
  if (Array.isArray(exercises) && exercises.length > 0) {
    let lowerCount = 0;
    let upperCount = 0;
    let cardioCount = 0;
    let coreCount = 0;

    exercises.forEach(ex => {
      const name = String(ex?.name || ex?.exercise?.name || '').toLowerCase();
      const bodyPart = String(ex?.bodyPart || ex?.exercise?.bodyPart || '').toLowerCase();
      const target = String(ex?.target || ex?.exercise?.target || '').toLowerCase();

      if (
        bodyPart.includes('cardio') ||
        target.includes('cardiovascular') ||
        name.includes('burpee') ||
        name.includes('jump') ||
        name.includes('run')
      ) {
        cardioCount++;
      } else if (
        bodyPart.includes('leg') ||
        target.includes('quad') ||
        target.includes('glute') ||
        target.includes('hamstring') ||
        name.includes('squat') ||
        name.includes('lunge') ||
        name.includes('deadlift')
      ) {
        lowerCount++;
      } else if (
        bodyPart.includes('waist') ||
        target.includes('ab') ||
        name.includes('plank') ||
        name.includes('crunch')
      ) {
        coreCount++;
      } else {
        upperCount++;
      }
    });

    const total = exercises.length;
    if (cardioCount / total >= 0.4) return WORKOUT_MET_TABLE.CARDIO;
    if (lowerCount / total >= 0.4) return WORKOUT_MET_TABLE.LEGS;
    if (lowerCount > 0 && upperCount > 0) return WORKOUT_MET_TABLE.FULL_BODY;
    if (upperCount / total >= 0.5) return WORKOUT_MET_TABLE.UPPER_BODY;
    if (coreCount / total >= 0.5) return WORKOUT_MET_TABLE.CORE;
  }

  return WORKOUT_MET_TABLE.GENERAL_STRENGTH;
};

/**
 * Calculates calorie burning for a workout session considering:
 * - duration (time in seconds or minutes)
 * - workout parameters (exercises, title, volume, completed sets, reps)
 * - user weight
 *
 * @param {Object} params
 * @param {number} params.duration Duration in seconds (or if isMinutes=true, in minutes)
 * @param {boolean} [params.isMinutes=false] Flag indicating duration is in minutes
 * @param {Array} [params.exercises=[]] List of exercises with completed sets
 * @param {number} [params.volume=0] Total volume lifted in kg
 * @param {number} [params.totalReps=0] Total reps performed
 * @param {number} [params.completedSetsCount=0] Number of completed sets
 * @param {string} [params.workoutTitle=''] Name or title of the workout
 * @param {number} [params.userWeightKg=70] User's bodyweight in kg
 * @returns {number} Burned calories (rounded integer)
 */
export const calculateWorkoutCalories = ({
  duration = 0,
  isMinutes = false,
  exercises = [],
  volume = 0,
  totalReps = 0,
  completedSetsCount = 0,
  workoutTitle = '',
  userWeightKg = 70,
} = {}) => {
  // Normalize duration to seconds and minutes
  const rawDuration = Number(duration) || 0;
  const durationSeconds = isMinutes ? rawDuration * 60 : rawDuration;
  const durationMinutes = durationSeconds / 60;

  // Resolve bodyweight in kg (default 70kg, reasonable clamp 40 - 180kg)
  const weight = Math.max(40, Math.min(180, Number(userWeightKg) || 70));

  // Determine workout MET
  const met = getWorkoutMET(workoutTitle, exercises);

  // Exercise Science MET Calorie Formula:
  // Burn Rate (kcal/min) = (MET * 3.5 * weightKg) / 200
  const grossKcalPerMin = (met * 3.5 * weight) / 200;

  // Resistance workouts have rest periods between sets (active density typically 55% - 75%)
  // For Cardio / HIIT, density is higher (~85%)
  const isHighIntensity = met >= 8.0;
  const activeDensity = isHighIntensity ? 0.85 : 0.65;

  // Parse exercise sets if available
  let countedCompletedSets = Number(completedSetsCount) || 0;
  let bodyweightReps = 0;
  let weightedReps = 0;
  let timedHoldSeconds = 0;
  let calculatedVolume = Number(volume) || 0;
  let hasSetBasedExercises = false;

  if (Array.isArray(exercises) && exercises.length > 0) {
    let setsFromEx = 0;
    let volFromEx = 0;

    exercises.forEach(ex => {
      const sets = Array.isArray(ex?.sets) ? ex.sets : (Array.isArray(ex?.logs) ? ex.logs : []);
      if (sets.length > 0) {
        hasSetBasedExercises = true;
      }
      const exName = String(ex?.name || ex?.exercise?.name || '').toLowerCase();
      const isTimeBased =
        exName.includes('plank') ||
        exName.includes('hold') ||
        exName.includes('run') ||
        exName.includes('cycling') ||
        exName.includes('treadmill') ||
        exName.includes('jump rope') ||
        Boolean(ex?.isTimeBased);

      sets.forEach(s => {
        // Consider set completed if explicitly marked or if reps/weight exists and not explicitly uncompleted
        const isCompleted = s.completed !== undefined ? Boolean(s.completed) : (Number(s.reps) > 0 || Number(s.weight) > 0);
        if (isCompleted) {
          setsFromEx += 1;
          const r = Number(s.reps) || 0;
          const w = Number(s.weight) || 0;
          const t = Number(s.time || s.duration) || 0;

          if (isTimeBased || t > 0) {
            timedHoldSeconds += t || (r > 0 ? r : 30);
          } else {
            if (w > 0) {
              weightedReps += r;
              volFromEx += w * r;
            } else if (r > 0) {
              bodyweightReps += r;
            }
          }
        }
      });
    });

    if (countedCompletedSets === 0 && setsFromEx > 0) {
      countedCompletedSets = setsFromEx;
    }
    if (calculatedVolume === 0 && volFromEx > 0) {
      calculatedVolume = volFromEx;
    }
  }

  // If totalReps was passed and no breakdown exists
  if (bodyweightReps === 0 && weightedReps === 0 && Number(totalReps) > 0) {
    if (calculatedVolume > 0) {
      weightedReps = Number(totalReps);
    } else {
      bodyweightReps = Number(totalReps);
    }
  }

  const hasCompletedWork =
    countedCompletedSets > 0 ||
    calculatedVolume > 0 ||
    bodyweightReps > 0 ||
    weightedReps > 0 ||
    timedHoldSeconds > 0 ||
    Number(totalReps) > 0;

  // CRITICAL FIX: If no exercise work / completed sets have been performed,
  // do NOT burn calories simply because the stopwatch timer is ticking!
  // Unless it's an estimated template preview (isMinutes=true without exercises),
  // a live workout with 0 completed sets must stay at 0 calories.
  if (!hasCompletedWork && !isMinutes) {
    return 0;
  }

  if (hasSetBasedExercises && !hasCompletedWork) {
    return 0;
  }

  // 1. Mechanical Work Breakdown:
  // - Volume Burn: ~0.016 kcal per kg of volume moved
  // - Bodyweight Reps Burn: ~0.28 kcal per rep (squats, pushups, situps, lunges)
  // - Weighted Reps Muscular Effort: ~0.08 kcal per rep
  // - Timed Hold Burn: ~4.5 kcal per min of active static hold
  // - EPOC (Excess Post-Exercise Oxygen Consumption) per set: ~1.5 kcal
  const volumeBurn = calculatedVolume * 0.016;
  const bwRepsBurn = bodyweightReps * 0.28;
  const weightedRepsBurn = weightedReps * 0.08;
  const timedHoldBurn = (timedHoldSeconds / 60) * 4.5;
  const epocBurn = countedCompletedSets * 1.5;

  const totalMechanicalBurn = volumeBurn + bwRepsBurn + weightedRepsBurn + timedHoldBurn + epocBurn;

  // 2. Active Duration Credited:
  // For resistance training, each completed set accounts for active work + reasonable rest interval (~2.5 mins).
  // If the user rests for a very long time without completing new sets, duration cannot endlessly inflate calories.
  let effectiveDurationMinutes = durationMinutes;
  if (countedCompletedSets > 0) {
    const maxCreditedDuration = Math.max(countedCompletedSets * 2.5, (timedHoldSeconds / 60) * 1.5);
    effectiveDurationMinutes = Math.min(durationMinutes, maxCreditedDuration);
  }

  let totalBurn = 0;

  if (totalMechanicalBurn > 0 && effectiveDurationMinutes > 0) {
    // Both time and mechanical sets/weights are present:
    // Base duration covers the energetic cost of sustaining the session for completed sets:
    const baseDurationBurn = effectiveDurationMinutes * (grossKcalPerMin * 0.55);
    totalBurn = baseDurationBurn + totalMechanicalBurn;
  } else if (totalMechanicalBurn > 0) {
    totalBurn = totalMechanicalBurn;
  } else if (isMinutes && durationMinutes > 0) {
    // Template / Routine estimate mode (where exercises have no live sets yet)
    totalBurn = durationMinutes * grossKcalPerMin * activeDensity;
  } else {
    totalBurn = 0;
  }

  // Maximum ceiling: Max 18 kcal/min (prevent runaway timer bugs like leaving phone on overnight)
  const maxSensibleBurn = Math.max(150, (effectiveDurationMinutes || durationMinutes) * 18);
  const clampedBurn = Math.min(totalBurn, maxSensibleBurn);

  return Math.max(0, Math.round(clampedBurn));
};

/**
 * Estimates calories for preset routines or template creation
 * @param {number|string} duration Duration in minutes or string like '45min'
 * @param {string} workoutTitle Workout name / title
 * @param {Array} [exercises=[]] Exercises array
 * @returns {number} Estimated calories
 */
export const estimateRoutineCalories = (duration, workoutTitle = '', exercises = []) => {
  const durationMins = typeof duration === 'number'
    ? duration
    : parseInt(String(duration || '45'), 10) || 45;

  return calculateWorkoutCalories({
    duration: durationMins,
    isMinutes: true,
    workoutTitle,
    exercises,
    completedSetsCount: Array.isArray(exercises) ? exercises.length * 3 : 9,
  });
};
