import apiClient from '../api/apiClient';

let cachedBackendTargets = null;

/**
 * Fetch nutrition targets calculated by the backend engine (/diet/progress/summary)
 * The backend calculates BMR, TDEE, calories, and macro splits on the server based on the user's DB profile.
 */
export const fetchNutritionTargets = async () => {
  try {
    const response = await apiClient.get('/diet/progress/summary');
    const data = response.data?.data || response.data;
    if (data?.targets && data.targets.calories > 0) {
      cachedBackendTargets = {
        ...data.targets,
        fat: data.targets.fats || data.targets.fat,
        fats: data.targets.fats || data.targets.fat,
        fiber: data.targets.fibre || data.targets.fiber,
        fibre: data.targets.fibre || data.targets.fiber,
      };
      return cachedBackendTargets;
    }
  } catch (error) {
    console.warn('[nutritionCalculator] Failed to fetch targets from backend:', error.message);
  }
  return cachedBackendTargets;
};

/**
 * Get in-memory cached targets calculated by the backend
 */
export const getCachedBackendTargets = () => cachedBackendTargets;

/**
 * Set or update cached targets calculated by the backend
 */
export const setCachedBackendTargets = (targets) => {
  if (!targets) {
    cachedBackendTargets = null;
    return;
  }
  if (targets && targets.calories > 0) {
    cachedBackendTargets = {
      ...targets,
      fat: targets.fats || targets.fat,
      fats: targets.fats || targets.fat,
      fiber: targets.fibre || targets.fiber,
      fibre: targets.fibre || targets.fiber,
    };
  }
};

/**
 * Helper: Client-side Profile Targets Calculator
 * Implements the Swap Application - Nutrition & Calorie Engine specifications:
 * - BMR: Mifflin-St Jeor & Katch-McArdle (when body fat % is provided)
 * - TDEE: Physical Activity Level (PAL) Multipliers
 * - Goal-based Target: Total energy change = |target_weight - current_weight| * 7700 kcal
 * - Daily adjustment = Total energy change / timeframe_days
 * - Guardrails: Deficit capped at 25% TDEE, Absolute floors (1200F / 1500M), >1%/week timeframe validation
 * - Maintenance phase: TDEE recalculated at target weight with zero adjustment
 * - Macros: Protein (1.6-2.2 g/kg), Fat (25% default), Carbs (remainder), Fiber (~14g/1000 kcal)
 */
export const calculateNutritionTargets = (
  weight,
  height,
  age,
  gender,
  fitnessGoal = '',
  activityLevel = 'moderate',
  targetWeight = null,
  timeframeDays = null,
  goalTypeOverride = null,
  bodyFatPct = null,
  fatPercentage = 0.25
) => {
  const weightNum = isNaN(parseFloat(weight)) || parseFloat(weight) <= 0 ? 70 : parseFloat(weight);
  const heightNum = isNaN(parseFloat(height)) || parseFloat(height) <= 0 ? 170 : parseFloat(height);
  const ageNum = isNaN(parseInt(age, 10)) || parseInt(age, 10) <= 0 ? 25 : parseInt(age, 10);
  const targetWeightNum =
    targetWeight !== null && !isNaN(parseFloat(targetWeight)) && parseFloat(targetWeight) > 0
      ? parseFloat(targetWeight)
      : null;

  const genderStr = String(gender || '').toLowerCase().trim();
  const isFemale =
    genderStr === 'female' ||
    genderStr === 'f' ||
    genderStr.includes('woman') ||
    genderStr.includes('girl');
  const minCalories = isFemale ? 1200 : 1500;

  // 1. Calculate BMR
  let bmr = 0;
  const parsedBodyFat = parseFloat(bodyFatPct);
  if (!isNaN(parsedBodyFat) && parsedBodyFat >= 3 && parsedBodyFat <= 65) {
    // Alternate: Katch-McArdle Equation (accurate for athletic users when body fat % is known)
    const lbm = weightNum * (1 - parsedBodyFat / 100);
    bmr = 370 + 21.6 * lbm;
  } else {
    // Default: Mifflin-St Jeor Equation
    if (isFemale) {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    }
  }

  // 2. Physical Activity Level (PAL) Multipliers
  let multiplier = 1.4;
  const activity = String(activityLevel || '').toLowerCase().trim();
  if (activity === 'sedentary' || activity.includes('wheelchair')) {
    multiplier = 1.2;
  } else if (activity === 'light' || activity === 'lightly_active' || activity.includes('1-3')) {
    multiplier = 1.375;
  } else if (activity === 'moderate' || activity === 'moderately_active' || activity.includes('3-5')) {
    multiplier = 1.55;
  } else if (activity === 'active' || activity.includes('6-7')) {
    multiplier = 1.725;
  } else if (activity === 'very_active' || activity === 'athlete' || activity === 'extra_active' || activity.includes('2x')) {
    multiplier = 1.9;
  }

  const tdee = Math.round(bmr * multiplier);
  let targetCalories = tdee;
  let dailyAdjustment = 0;

  // 3. Determine Goal Type (lose / gain / maintain)
  let goalType = 'maintain';
  const goalStr = String(fitnessGoal || '').toLowerCase();

  if (goalTypeOverride) {
    const override = String(goalTypeOverride).toLowerCase();
    if (override.includes('loss') || override.includes('lose')) goalType = 'lose';
    else if (override.includes('gain') || override.includes('build') || override.includes('bulk')) goalType = 'gain';
    else if (override.includes('maintain')) goalType = 'maintain';
  } else if (targetWeightNum !== null) {
    const weightDelta = targetWeightNum - weightNum;
    if (Math.abs(weightDelta) < 0.1) {
      goalType = 'maintain';
    } else if (weightDelta < 0) {
      goalType = 'lose';
    } else {
      goalType = 'gain';
    }
  } else {
    if (goalStr.includes('loss') || goalStr.includes('lose') || goalStr.includes('cut') || goalStr.includes('lean')) {
      goalType = 'lose';
    } else if (goalStr.includes('gain') || goalStr.includes('muscle') || goalStr.includes('build') || goalStr.includes('bulk') || goalStr.includes('strength')) {
      goalType = 'gain';
    } else {
      goalType = 'maintain';
    }
  }

  // 4. Timeframe Analysis & Guardrails (7700 kcal / kg)
  let days = 84; // default 12 weeks
  let isTimeframeUnsafe = false;
  let safeTimeframeWeeks = 12;
  let safeTimeframeDays = 84;

  if (targetWeightNum !== null && goalType !== 'maintain') {
    const totalWeightChangeKg = Math.abs(targetWeightNum - weightNum);
    const totalEnergyChangeNeeded = totalWeightChangeKg * 7700;

    // Guardrail: Safe rate is <= 1% bodyweight change per week
    const maxSafeWeeklyChangeKg = weightNum * 0.01;
    const minSafeWeeks = maxSafeWeeklyChangeKg > 0 ? totalWeightChangeKg / maxSafeWeeklyChangeKg : 4;
    safeTimeframeWeeks = Math.max(1, Math.ceil(minSafeWeeks));
    safeTimeframeDays = safeTimeframeWeeks * 7;

    if (timeframeDays !== null && !isNaN(parseInt(timeframeDays, 10)) && parseInt(timeframeDays, 10) > 0) {
      days = parseInt(timeframeDays, 10);
      // Flag if user's input timeframe implies > 1% bodyweight change per week
      const impliedWeeklyRateKg = totalWeightChangeKg / (days / 7);
      if (impliedWeeklyRateKg > maxSafeWeeklyChangeKg * 1.05) {
        isTimeframeUnsafe = true;
      }
    } else {
      days = safeTimeframeDays;
    }

    const rawDailyAdjustment = Math.round(totalEnergyChangeNeeded / Math.max(1, days));

    if (goalType === 'lose') {
      // Guardrail: Daily deficit capped at ~25% of TDEE (typically 500-1000 kcal max)
      const maxDeficit = Math.min(1000, Math.round(tdee * 0.25));
      dailyAdjustment = Math.min(maxDeficit, rawDailyAdjustment);
      targetCalories = Math.max(minCalories, tdee - dailyAdjustment);
    } else {
      // Surplus for muscle building/gain: capped at 20% TDEE (300-600 kcal typical)
      const maxSurplus = Math.min(750, Math.round(tdee * 0.20));
      dailyAdjustment = Math.min(maxSurplus, rawDailyAdjustment);
      targetCalories = tdee + dailyAdjustment;
    }
  } else if (goalType === 'maintain') {
    // Section 6: Maintenance Phase Logic - TDEE recomputed at current weight, no deficit/surplus
    targetCalories = tdee;
    dailyAdjustment = 0;
  } else {
    // Target weight not specified, use general goal targets with safety bounds
    if (goalType === 'lose') {
      const deficit = Math.min(Math.round(tdee * 0.25), 500);
      dailyAdjustment = deficit;
      targetCalories = Math.max(minCalories, tdee - deficit);
    } else if (goalType === 'gain') {
      dailyAdjustment = 300;
      targetCalories = tdee + 300;
    }
  }

  // 5. Macronutrient Splits (Section 3.4 & Section 8)
  // Order: protein -> fat -> carbs (remainder)
  // Scaling by goalType AND activityLevel:
  // - Sedentary users require 1.2 - 1.4 g/kg (prevents excessive protein crowding out carbs)
  // - Light / Moderate: 1.4 - 1.6 g/kg
  // - Active / Athletic: 1.8 - 2.2 g/kg (muscle preservation in deficit or gain)
  const act = String(activityLevel || '').toLowerCase().trim();
  const isSedentary = act === 'sedentary' || act.includes('wheelchair');
  const isLightOrMod = act === 'light' || act.includes('1-3') || act === 'moderate' || act.includes('3-5');

  let proteinFactor = 1.6;
  if (goalType === 'lose') {
    proteinFactor = isSedentary ? 1.3 : isLightOrMod ? 1.6 : 2.0;
  } else if (goalType === 'gain') {
    proteinFactor = isSedentary ? 1.4 : isLightOrMod ? 1.8 : 2.2;
  } else {
    proteinFactor = isSedentary ? 1.2 : isLightOrMod ? 1.4 : 1.6;
  }

  let targetProtein = Math.round(weightNum * proteinFactor);

  // Guardrail: protein calories should not exceed 35% of total calories to protect carb intake
  const maxProteinGrams = Math.round((targetCalories * 0.35) / 4);
  if (targetProtein > maxProteinGrams && maxProteinGrams >= Math.round(weightNum * 1.0)) {
    targetProtein = maxProteinGrams;
  }

  // Fat: 20-35% of total calories (default 25%)
  const clampedFatPct = Math.min(0.35, Math.max(0.20, fatPercentage));
  const targetFat = Math.round((targetCalories * clampedFatPct) / 9);

  // Carbs: remainder calories
  const remainingCalories = targetCalories - (targetProtein * 4) - (targetFat * 9);
  const targetCarbs = Math.max(50, Math.round(remainingCalories / 4));

  // Fiber: ~14g per 1000 kcal
  const targetFibre = Math.max(25, Math.round((targetCalories / 1000) * 14));

  return {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fats: targetFat,
    fat: targetFat,
    fibre: targetFibre,
    fiber: targetFibre,
    bmr: Math.round(bmr),
    tdee,
    goalType,
    dailyAdjustment,
    timeframeDays: days,
    timeframeWeeks: Math.round(days / 7),
    isTimeframeUnsafe,
    safeTimeframeWeeks,
    safeTimeframeDays,
    isMaintenance: goalType === 'maintain',
  };
};

/**
 * Normalizes weight input to kilograms (handles numbers, strings, and { value, unit } objects)
 */
export const normalizeWeightToKg = (w) => {
  if (w === null || w === undefined) return null;
  if (typeof w === 'number') return w > 0 ? w : null;
  if (typeof w === 'string') {
    const parsed = parseFloat(w);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }
  if (typeof w === 'object') {
    const val = parseFloat(w.value !== undefined ? w.value : w.val);
    if (isNaN(val) || val <= 0) return null;
    const unit = String(w.unit || '').toUpperCase();
    if (unit === 'LBS' || unit === 'LB') {
      return val / 2.20462262;
    }
    return val;
  }
  return null;
};

/**
 * Normalizes height input to centimeters (handles numbers, strings, and { value, unit } objects)
 */
export const normalizeHeightToCm = (h) => {
  if (h === null || h === undefined) return null;
  if (typeof h === 'number') return h > 0 ? h : null;
  if (typeof h === 'string') {
    const parsed = parseFloat(h);
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }
  if (typeof h === 'object') {
    const val = parseFloat(h.value !== undefined ? h.value : h.val);
    if (isNaN(val) || val <= 0) return null;
    const unit = String(h.unit || '').toUpperCase();
    if (unit === 'FT' || unit === 'FEET') {
      return val * 30.48;
    }
    return val;
  }
  return null;
};

/**
 * Derives default user nutrition targets from a user/profile object
 */
export const getTargetsForUser = (
  userOrProfile,
  overrideTargetWeight = null,
  overrideTimeframeDays = null,
  overrideGoalType = null
) => {
  // If backend targets are available and no manual overrides were requested, use backend targets!
  if (cachedBackendTargets && cachedBackendTargets.calories > 0 && !overrideTargetWeight && !overrideTimeframeDays && !overrideGoalType) {
    return cachedBackendTargets;
  }

  if (userOrProfile?.targets && userOrProfile.targets.calories > 0 && !overrideTargetWeight && !overrideTimeframeDays && !overrideGoalType) {
    return {
      ...userOrProfile.targets,
      fat: userOrProfile.targets.fats || userOrProfile.targets.fat,
      fats: userOrProfile.targets.fats || userOrProfile.targets.fat,
      fiber: userOrProfile.targets.fibre || userOrProfile.targets.fiber,
      fibre: userOrProfile.targets.fibre || userOrProfile.targets.fiber,
    };
  }

  if (!userOrProfile) {
    return calculateNutritionTargets(70, 170, 25, 'Male', '', 'moderate');
  }

  const p = userOrProfile.userProfile || userOrProfile.memberProfile || userOrProfile;

  const rawWeight =
    userOrProfile.weight ??
    p.weight ??
    p.startingWeight ??
    70;
  const weight = normalizeWeightToKg(rawWeight) || 70;

  const rawHeight =
    userOrProfile.height ??
    p.height ??
    170;
  const height = normalizeHeightToCm(rawHeight) || 170;

  const age = userOrProfile.age || p.age || 25;
  const gender = userOrProfile.gender || p.gender || 'Male';
  const fitnessGoal = userOrProfile.fitnessGoal || p.fitnessGoal || '';
  const activityLevel = userOrProfile.activityLevel || p.activityLevel || 'moderate';
  const bodyFatPct =
    userOrProfile.bodyFat ??
    userOrProfile.bodyFatPct ??
    p.bodyFat ??
    p.bodyFatPct ??
    null;

  const rawTargetWeight =
    overrideTargetWeight ??
    userOrProfile.targetWeight ??
    userOrProfile.target_weight ??
    userOrProfile.goalWeight ??
    p.targetWeight ??
    p.target_weight ??
    p.goalWeight ??
    null;
  const targetWeight = normalizeWeightToKg(rawTargetWeight);

  const timeframeDays =
    overrideTimeframeDays ??
    (userOrProfile.targetTimeframeDays ??
      p.targetTimeframeDays ??
      (userOrProfile.goalWeeks ? userOrProfile.goalWeeks * 7 : null) ??
      (p.goalWeeks ? p.goalWeeks * 7 : null) ??
      null);

  const goalType =
    overrideGoalType ??
    (userOrProfile.goalType ??
      p.goalType ??
      null);

  return calculateNutritionTargets(
    weight,
    height,
    age,
    gender,
    fitnessGoal,
    activityLevel,
    targetWeight,
    timeframeDays,
    goalType,
    bodyFatPct
  );
};
