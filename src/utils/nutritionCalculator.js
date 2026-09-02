/**
 * Helper: Client-side Profile Targets Calculator
 * Calculates BMR, daily calorie targets, and macro splits (protein, carbs, fats, fiber)
 * based on weight, height, age, gender, fitness goal, and activity level.
 */
export const calculateNutritionTargets = (weight, height, age, gender, fitnessGoal, activityLevel) => {
  const weightNum = isNaN(parseFloat(weight)) || parseFloat(weight) <= 0 ? 70 : parseFloat(weight);
  const heightNum = isNaN(parseFloat(height)) || parseFloat(height) <= 0 ? 170 : parseFloat(height);
  const ageNum = isNaN(parseInt(age, 10)) || parseInt(age, 10) <= 0 ? 25 : parseInt(age, 10);

  const genderStr = String(gender || '').toLowerCase().trim();
  const isFemale = genderStr === 'female' || genderStr === 'f' || genderStr.includes('woman') || genderStr.includes('girl');

  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = 0;
  if (isFemale) {
    bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
  } else {
    bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
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

  let targetCalories = Math.round(bmr * multiplier);

  // 3. Goal Adjustments
  const goal = String(fitnessGoal || '').toLowerCase();
  if (goal.includes('loss') || goal.includes('lose') || goal.includes('cut') || goal.includes('lean')) {
    const minCalories = isFemale ? 1200 : 1500;
    targetCalories = Math.max(minCalories, targetCalories - 500);
  } else if (goal.includes('gain') || goal.includes('muscle') || goal.includes('build') || goal.includes('bulk') || goal.includes('strength')) {
    targetCalories += 300;
  }

  // 4. Macro Splits
  let targetProtein = 0;
  let targetFat = 0;
  let targetCarbs = 0;

  if (goal.includes('gain') || goal.includes('muscle') || goal.includes('build') || goal.includes('strength')) {
    targetProtein = Math.round(weightNum * 2.2); // 2.2g / kg
    targetFat = Math.round((targetCalories * 0.25) / 9); // 25% fats
    const remainingCals = targetCalories - (targetProtein * 4) - (targetFat * 9);
    targetCarbs = Math.max(50, Math.round(remainingCals / 4));
  } else if (goal.includes('loss') || goal.includes('lose') || goal.includes('cut') || goal.includes('lean')) {
    targetProtein = Math.round(weightNum * 2.0); // 2.0g / kg
    targetFat = Math.round((targetCalories * 0.25) / 9); // 25% fats
    const remainingCals = targetCalories - (targetProtein * 4) - (targetFat * 9);
    targetCarbs = Math.max(50, Math.round(remainingCals / 4));
  } else {
    // Maintenance / General Health / Energy / Flexibility
    targetProtein = Math.round(weightNum * 1.8); // 1.8g / kg
    targetFat = Math.round((targetCalories * 0.25) / 9); // 25% fats
    const remainingCals = targetCalories - (targetProtein * 4) - (targetFat * 9);
    targetCarbs = Math.max(50, Math.round(remainingCals / 4));
  }

  // Daily target fibre based on calorie intake: ~14g per 1000 kcal, bounded between 25g and 38g
  const targetFibre = Math.min(38, Math.max(25, Math.round((targetCalories / 1000) * 14)));

  return {
    calories: targetCalories,
    protein: targetProtein,
    carbs: targetCarbs,
    fats: targetFat,
    fat: targetFat,
    fibre: targetFibre,
    fiber: targetFibre,
    bmr: Math.round(bmr),
  };
};

/**
 * Derives default user nutrition targets from a user/profile object
 */
export const getTargetsForUser = (userOrProfile) => {
  if (!userOrProfile) {
    return calculateNutritionTargets(70, 170, 25, 'Male', '', 'moderate');
  }

  const p = userOrProfile.userProfile || userOrProfile.memberProfile || userOrProfile;
  const weight = p.weight?.value || p.weight || p.startingWeight || 70;
  const height = p.height?.value || p.height || 170;
  const age = p.age || 25;
  const gender = p.gender || userOrProfile.gender || 'Male';
  const fitnessGoal = p.fitnessGoal || userOrProfile.fitnessGoal || '';
  const activityLevel = p.activityLevel || userOrProfile.activityLevel || 'moderate';

  return calculateNutritionTargets(weight, height, age, gender, fitnessGoal, activityLevel);
};
