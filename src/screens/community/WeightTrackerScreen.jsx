import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Image,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { calculateNutritionTargets, fetchNutritionTargets, getCachedBackendTargets } from '../../utils/nutritionCalculator';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInUp,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWeightLogs,
  addWeightLog,
  removeWeightLog,
  fetchWeightTarget,
  saveWeightTarget,
} from '../../redux/actions/weightActions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GREEN = '#4CAF50';
const GREEN_BRIGHT = '#66BB6A';
const CARD_BG = '#161A17';
const DARK_BG = '#0A0D0B';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedKeypadKey = ({ label, icon, onPress, isUnit, isDone, onKeypadType }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 450 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 350 });
  };

  const handlePress = () => {
    if (onKeypadType) onKeypadType();
    onPress();
  };

  return (
    <AnimatedTouchableOpacity
      style={[
        isDone ? styles.keypadDoneBtn : isUnit ? styles.keypadUnitBtn : styles.keypadKey,
        animStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {icon ? (
        <Icon name={icon} size={24} color="#FFF" />
      ) : (
        <Text style={isDone ? styles.keypadDoneBtnText : isUnit ? styles.keypadUnitBtnText : styles.keypadKeyText}>
          {label}
        </Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

const WeightTrackerScreen = ({ navigation }) => {
  const { refreshAuthStatus, updateUserLocal, user } = useAuth() || {};
  const dispatch = useDispatch();
  const reduxWeight = useSelector(state => state.weight);
  const [goalType, setGoalType] = useState('Gained');
  const [startingValue, setStartingValue] = useState(() => {
    const profile = user?.userProfile || user?.memberProfile || user || {};
    const sw = profile.startingWeight?.value ?? profile.startingWeight ?? reduxWeight?.startingValue;
    return sw ? String(Number(sw).toFixed(1)) : '';
  });
  const [currentGoalVal, setCurrentGoalVal] = useState(() => {
    const profile = user?.userProfile || user?.memberProfile || user || {};
    const tw = profile.targetWeight?.value ?? profile.targetWeight ?? profile.goalWeight ?? reduxWeight?.targetWeight;
    return tw ? String(Number(tw).toFixed(1)) : '';
  });
  const [heightVal, setHeightVal] = useState(() => {
    const profile = user?.userProfile || user?.memberProfile || user || {};
    const h = profile.height?.value ?? profile.height ?? reduxWeight?.height;
    return h ? String(Math.round(Number(h))) : '';
  });
  const [weightLogs, setWeightLogs] = useState([]);
  const [bodyFatLogs, setBodyFatLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('Weight');
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [editCardModal, setEditCardModal] = useState(null);
  const [logValue, setLogValue] = useState('');
  const [logDateText, setLogDateText] = useState('');
  const [editValue, setEditValue] = useState('');
  const [goalAmount, setGoalAmount] = useState('11.0');
  const [goalWeeks, setGoalWeeks] = useState('4');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [targetBMI, setTargetBMI] = useState(22.0);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [isFirstKey, setIsFirstKey] = useState(true);
  const sliderRef = useRef(null);

  const currentWeightVal = useMemo(() => {
    if (weightLogs && weightLogs.length > 0) {
      return Number(weightLogs[weightLogs.length - 1].value);
    }
    const profW = user?.weight?.value ?? user?.weight ?? user?.userProfile?.weight ?? user?.memberProfile?.weight;
    if (profW && Number(profW) > 0) return Number(profW);
    return parseFloat(startingValue) || 0;
  }, [weightLogs, startingValue, user]);

  const currentTargetCals = useMemo(() => {
    const cached = getCachedBackendTargets();
    if (cached && cached.calories > 0) {
      return cached.calories;
    }
    const w = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
    const resolvedHeight = parseFloat(heightVal) || parseFloat(user?.userProfile?.height) || parseFloat(user?.memberProfile?.height) || parseFloat(user?.height?.value) || parseFloat(user?.height) || 170;
    const tw = parseFloat(currentGoalVal);
    if (!tw || isNaN(tw) || tw <= 0) return null;
    const act = user?.activityLevel || user?.userProfile?.activityLevel || user?.memberProfile?.activityLevel || 'moderate';
    const g = user?.gender || user?.userProfile?.gender || user?.memberProfile?.gender || 'Male';
    const a = user?.age || user?.userProfile?.age || user?.memberProfile?.age || 25;
    const goal = user?.fitnessGoal || user?.userProfile?.fitnessGoal || user?.memberProfile?.fitnessGoal || '';
    const tfDays = (parseInt(goalWeeks, 10) || 12) * 7;
    return calculateNutritionTargets(w, resolvedHeight, a, g, goal, act, tw, tfDays, goalType).calories;
  }, [currentWeightVal, startingValue, heightVal, currentGoalVal, goalWeeks, goalType, user]);

  const modalTargetsPreview = useMemo(() => {
    if (editCardModal !== 'goal' && editCardModal !== 'current') return null;
    const val = parseFloat(editValue);
    if (!val || isNaN(val) || val <= 0) return null;
    const valInKg = weightUnit === 'lbs' ? val / 2.20462262 : val;
    const act = user?.activityLevel || user?.userProfile?.activityLevel || user?.memberProfile?.activityLevel || 'moderate';
    const g = user?.gender || user?.userProfile?.gender || user?.memberProfile?.gender || 'Male';
    const a = user?.age || user?.userProfile?.age || user?.memberProfile?.age || 25;
    const goal = user?.fitnessGoal || user?.userProfile?.fitnessGoal || user?.memberProfile?.fitnessGoal || '';
    const resolvedHeight = parseFloat(heightVal) || parseFloat(user?.userProfile?.height) || parseFloat(user?.memberProfile?.height) || parseFloat(user?.height?.value) || parseFloat(user?.height) || 170;

    let w, tw;
    let previewGoalType = goalType;
    if (editCardModal === 'goal') {
      w = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
      tw = valInKg;
      previewGoalType = Math.abs(tw - w) < 0.1 ? 'maintain' : (tw >= w ? 'gain' : 'lose');
    } else {
      w = valInKg;
      tw = parseFloat(currentGoalVal) || null;
      if (tw) {
        previewGoalType = Math.abs(tw - w) < 0.1 ? 'maintain' : (tw >= w ? 'gain' : 'lose');
      }
    }
    const tfDays = (parseInt(goalWeeks, 10) || 12) * 7;
    return calculateNutritionTargets(w, resolvedHeight, a, g, goal, act, tw, tfDays, previewGoalType);
  }, [editCardModal, editValue, weightUnit, currentWeightVal, startingValue, heightVal, currentGoalVal, goalWeeks, goalType, user]);

  const modalCaloriesPreview = useMemo(() => {
    return modalTargetsPreview?.calories || null;
  }, [modalTargetsPreview]);

  const goalModalRateInfo = useMemo(() => {
    if (editCardModal !== 'goal') return null;
    const val = parseFloat(editValue);
    if (!val || isNaN(val) || val <= 0) return null;
    const goalKg = weightUnit === 'lbs' ? val / 2.20462262 : val;
    const currW = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
    const deltaKg = Math.abs(goalKg - currW);
    const isGain = goalKg > currW;
    const isLoss = goalKg < currW;
    const isMaintain = Math.abs(goalKg - currW) < 0.1;
    const weeks = Math.max(1, parseInt(goalWeeks, 10) || 12);
    const weeklyRateKg = deltaKg > 0 ? (deltaKg / weeks) : 0;
    const weeklyRateDisplay = weightUnit === 'lbs' ? (weeklyRateKg * 2.20462262) : weeklyRateKg;
    const maxSafeWeeklyKg = currW * 0.01;
    const isUnsafeRate = deltaKg > 0.5 && weeklyRateKg > (maxSafeWeeklyKg * 1.05);
    const minSafeWeeks = Math.max(1, Math.ceil(deltaKg / Math.max(0.1, maxSafeWeeklyKg)));
    const safeWeeklyRateKg = deltaKg > 0 ? (deltaKg / minSafeWeeks) : 0.5;
    const safeWeeklyRateDisplay = weightUnit === 'lbs' ? (safeWeeklyRateKg * 2.20462262) : safeWeeklyRateKg;

    return {
      goalKg,
      currW,
      deltaKg,
      isGain,
      isLoss,
      isMaintain,
      weeks,
      weeklyRateKg,
      weeklyRateDisplay,
      maxSafeWeeklyKg,
      isUnsafeRate,
      minSafeWeeks,
      safeWeeklyRateKg,
      safeWeeklyRateDisplay,
    };
  }, [editCardModal, editValue, weightUnit, currentWeightVal, startingValue, goalWeeks]);

  // ── Reanimated values for typing feedback (Up to Down slide drop) ─────
  const keypadY = useSharedValue(0);
  const keypadScale = useSharedValue(1);
  const keypadOpacity = useSharedValue(1);

  const triggerKeypadAnim = () => {
    keypadY.value = -24;
    keypadOpacity.value = 0.3;
    keypadScale.value = 1.18;

    keypadY.value = withSpring(0, { damping: 11, stiffness: 320 });
    keypadScale.value = withSpring(1.0, { damping: 12, stiffness: 250 });
    keypadOpacity.value = withTiming(1.0, { duration: 160 });
  };

  const animatedKeypadValueStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: keypadY.value },
      { scale: keypadScale.value },
    ],
    opacity: keypadOpacity.value,
  }));

  const currentUserId = user?.id || user?._id || 'guest';
  const STARTING_WEIGHT_KEY = `weight_tracker_starting_${currentUserId}`;
  const WEIGHT_GOAL_KEY = `weight_tracker_goal_${currentUserId}`;
  const WEIGHT_LOGS_KEY = `weight_tracker_logs_${currentUserId}`;
  const BODY_FAT_LOGS_KEY = `body_fat_tracker_logs_${currentUserId}`;
  const METRICS_KEY = `weight_body_metrics_${currentUserId}`;

  // Helper: apply a profile object to state (called from cache and fresh API response)
  const applyProfile = async (profile, existingWeightLogs, savedGoal) => {
    if (!profile) return;

    // Seed first weight log from profile if none logged yet
    if (existingWeightLogs.length === 0) {
      const w = profile.weight?.value || profile.weight;
      if (w && Number(w) > 0) {
        const log = {
          id: 'initial_profile_weight',
          value: Number(w),
          date: new Date(0).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          timestamp: 0,
          source: 'Profile',
          photo: null,
        };
        setWeightLogs([log]);
        try { await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify([log])); } catch (_) { }
      }
    }

    const startW = profile.weight?.value || profile.weight;
    // Try multiple possible field names for target weight
    const targetW =
      profile.targetWeight?.value ??
      profile.targetWeight ??
      profile.target_weight?.value ??
      profile.target_weight ??
      profile.goalWeight?.value ??
      profile.goalWeight ??
      null;

    console.log('[WeightTracker] applyProfile → startW:', startW, '| targetW:', targetW, '| full profile keys:', Object.keys(profile));

    if (startW && Number(startW) > 0) setStartingValue(String(Number(startW).toFixed(1)));
    if (targetW !== null && Number(targetW) > 0) {
      setCurrentGoalVal(String(Number(targetW).toFixed(1)));
      if (startW) {
        setGoalAmount(String(Math.abs(Number(targetW) - Number(startW)).toFixed(1)));
        if (!savedGoal) setGoalType(Number(targetW) >= Number(startW) ? 'Gained' : 'Lost');
      }
    }

    const h = profile.height?.value || profile.height;
    if (h && Number(h) > 0) setHeightVal(String(Math.round(Number(h))));
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;
        fetchNutritionTargets().catch(() => {});
        const profile = user?.userProfile || user?.memberProfile || user || {};

        // ── 0. Resolve Starting Weight Robustly ─────────────────────────────
        const savedStarting = await AsyncStorage.getItem(STARTING_WEIGHT_KEY);
        let finalStarting = savedStarting;

        if (!finalStarting) {
          const profSW = profile.startingWeight?.value ?? profile.startingWeight;
          if (profSW && Number(profSW) > 0) {
            finalStarting = String(Number(profSW).toFixed(1));
          }
        }

        if (!finalStarting) {
          const onboardingRaw = await AsyncStorage.getItem('member_profile_metrics');
          if (onboardingRaw) {
            const m = JSON.parse(onboardingRaw);
            if ((!m.userId || m.userId === currentUserId) && m.startingWeight && Number(m.startingWeight) > 0) {
              finalStarting = String(Number(m.startingWeight).toFixed(1));
            }
          }
        }

        if (!finalStarting) {
          const rawLogs = await AsyncStorage.getItem(WEIGHT_LOGS_KEY);
          const parsedLogs = rawLogs ? JSON.parse(rawLogs) : [];
          if (parsedLogs.length > 0 && parsedLogs[0]?.value) {
            finalStarting = String(Number(parsedLogs[0].value).toFixed(1));
          } else {
            const initialW = profile.weight?.value ?? profile.weight;
            if (initialW && Number(initialW) > 0) {
              finalStarting = String(Number(initialW).toFixed(1));
            }
          }
        }

        if (finalStarting) {
          setStartingValue(finalStarting);
          await AsyncStorage.setItem(STARTING_WEIGHT_KEY, finalStarting);
          if (!profile.startingWeight) {
            apiClient.put('/users/profile', { startingWeight: parseFloat(finalStarting) }).catch(() => {});
            apiClient.post('/weight/target', { startingValue: parseFloat(finalStarting) }).catch(() => {});
          }
        }

        const targetW =
          profile.targetWeight?.value ??
          profile.targetWeight ??
          profile.target_weight?.value ??
          profile.target_weight ??
          profile.goalWeight?.value ??
          profile.goalWeight ??
          null;
        const h = profile.height?.value ?? profile.height ?? null;

        if (targetW) setCurrentGoalVal(String(Number(targetW).toFixed(1)));
        else setCurrentGoalVal('');

        if (h) setHeightVal(String(Math.round(Number(h))));
        else setHeightVal('');

        // ── 1. Restore user-scoped weight logs ──────────────────────────────
        let curWeights = [];
        const savedW = await AsyncStorage.getItem(WEIGHT_LOGS_KEY);
        if (savedW) {
          curWeights = JSON.parse(savedW);
          setWeightLogs(curWeights);
        } else {
          setWeightLogs([]);
        }

        const savedF = await AsyncStorage.getItem(BODY_FAT_LOGS_KEY);
        if (savedF) {
          setBodyFatLogs(JSON.parse(savedF));
        } else {
          setBodyFatLogs([]);
        }

        // ── 2. Restore user-edited goal preferences (goalType, goalWeeks) ───
        const savedGoal = await AsyncStorage.getItem(WEIGHT_GOAL_KEY);
        if (savedGoal) {
          const g = JSON.parse(savedGoal);
          setGoalType(g.goalType || 'Gained');
          setGoalWeeks(g.goalWeeks || '4');
        }

        // ── 3. Read onboarding metrics ONLY if scoped to current user ───────
        const onboardingRaw = await AsyncStorage.getItem('member_profile_metrics');
        if (onboardingRaw) {
          const m = JSON.parse(onboardingRaw);
          if (!m.userId || m.userId === currentUserId) {
            setStartingValue(prev => prev || (m.weight ? String(Number(m.weight).toFixed(1)) : ''));
            setCurrentGoalVal(prev => prev || (m.targetWeight ? String(Number(m.targetWeight).toFixed(1)) : ''));
            setHeightVal(prev => prev || (m.height ? String(Math.round(Number(m.height))) : ''));
          }
        }

        // ── 4. Dispatch Redux Thunks to Sync Ground-Truth API Data ─────────
        dispatch(fetchWeightLogs());
        dispatch(fetchWeightTarget());
      } catch (e) {
        console.error('[WeightTracker] Load failed:', e);
      }
    };
    load();
  }, [currentUserId, dispatch, WEIGHT_LOGS_KEY, WEIGHT_GOAL_KEY, BODY_FAT_LOGS_KEY]);

  // Sync Redux store logs to local state when reduxWeight changes
  useEffect(() => {
    if (Array.isArray(reduxWeight.logs)) {
      if (reduxWeight.logs.length > 0) {
        const sorted = [...reduxWeight.logs].sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime()));
        setWeightLogs(sorted);
      } else {
        setWeightLogs([]);
      }
    }
    if (reduxWeight.targetWeight) setCurrentGoalVal(String(Number(reduxWeight.targetWeight).toFixed(1)));
    if (reduxWeight.startingValue) setStartingValue(prev => prev || String(Number(reduxWeight.startingValue).toFixed(1)));
    if (reduxWeight.height) setHeightVal(String(Math.round(Number(reduxWeight.height))));
  }, [reduxWeight.logs, reduxWeight.targetWeight, reduxWeight.startingValue, reduxWeight.height]);


  const currentLogs = useMemo(() => activeTab === 'Weight' ? weightLogs : bodyFatLogs, [activeTab, weightLogs, bodyFatLogs]);
  const displayUnit = activeTab === 'Weight' ? weightUnit.toUpperCase() : '%';
  const unit = displayUnit;

  const formatWeight = (kgValue) => {
    const num = parseFloat(kgValue) || 0;
    if (weightUnit === 'lbs') {
      return (num * 2.20462262).toFixed(1);
    }
    return num.toFixed(1);
  };

  const displayDelta = useMemo(() => {
    const rawDelta = parseFloat(currentGoalVal) - currentWeightVal;
    if (weightUnit === 'lbs') return rawDelta * 2.20462262;
    return rawDelta;
  }, [currentGoalVal, currentWeightVal, weightUnit]);

  const CHART_H = SCREEN_HEIGHT * 0.22;

  const chartPoints = useMemo(() => {
    if (currentLogs.length === 0) return [];
    const vals = currentLogs.map(l => l.value);
    const yMin = Math.min(...vals) - 5;
    const yMax = Math.max(parseFloat(currentGoalVal) || 80, ...vals) + 5;
    const yRange = yMax - yMin || 1;
    const drawW = SCREEN_WIDTH;
    const drawH = CHART_H - 10;
    return currentLogs.map((log, i) => ({
      x: currentLogs.length > 1 ? (i / (currentLogs.length - 1)) * drawW : drawW / 2,
      y: 5 + (1 - (log.value - yMin) / yRange) * drawH,
      value: log.value,
      date: log.date,
    }));
  }, [currentLogs, currentGoalVal, CHART_H]);

  const targetLineY = useMemo(() => {
    if (currentLogs.length === 0) return 20;
    const vals = currentLogs.map(l => l.value);
    const yMin = Math.min(...vals) - 5;
    const yMax = Math.max(parseFloat(currentGoalVal) || 80, ...vals) + 5;
    const yRange = yMax - yMin || 1;
    return 5 + (1 - (parseFloat(currentGoalVal) - yMin) / yRange) * (CHART_H - 10);
  }, [currentLogs, currentGoalVal, CHART_H]);

  const linePath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    return chartPoints.reduce((p, pt, i) => p + `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y} `, '');
  }, [chartPoints]);

  // ── Period selector for Weight Progress bar chart ────────────────────────
  const [progressPeriod, setProgressPeriod] = useState('90D');

  // ── Weight Changes: compute delta for each period ────────────────────────
  const weightChanges = useMemo(() => {
    const periods = [
      { label: '3 day', days: 3 },
      { label: '7 day', days: 7 },
      { label: '14 day', days: 14 },
      { label: '30 day', days: 30 },
      { label: '90 day', days: 90 },
      { label: 'All Time', days: null },
    ];
    const now = Date.now();
    const latest = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].value : null;
    return periods.map(({ label, days }) => {
      if (!latest || weightLogs.length === 0) return { label, delta: 0, direction: 'none' };
      let refLog = weightLogs[0];
      if (days !== null) {
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        const filtered = weightLogs.filter(l => l.timestamp >= cutoff);
        refLog = filtered.length > 0 ? filtered[0] : weightLogs[0];
      }
      const delta = latest - refLog.value;
      return {
        label,
        delta: Math.abs(delta).toFixed(1),
        rawDelta: delta,
        direction: Math.abs(delta) < 0.05 ? 'none' : delta < 0 ? 'lost' : 'gained',
      };
    });
  }, [weightLogs]);

  // ── Bar chart data for Weight Progress ───────────────────────────────────
  const barChartData = useMemo(() => {
    const periodDays = { '90D': 90, '6M': 180, '1Y': 365, 'ALL': null };
    const days = periodDays[progressPeriod];
    const now = Date.now();
    const filtered = days
      ? weightLogs.filter(l => l.timestamp >= now - days * 24 * 60 * 60 * 1000)
      : [...weightLogs];
    if (filtered.length === 0) return [];
    const target = parseFloat(currentGoalVal) || 80;
    const maxVal = Math.max(...filtered.map(l => l.value), target) + 5;
    const minVal = Math.max(0, Math.min(...filtered.map(l => l.value)) - 5);
    const range = maxVal - minVal || 1;
    return filtered.map(l => ({
      height: ((l.value - minVal) / range) * 100,
      targetHeight: ((target - minVal) / range) * 100,
      value: l.value,
      date: l.date,
    }));
  }, [weightLogs, progressPeriod, currentGoalVal]);

  // ── BMI Calculation ──────────────────────────────────────────────────────
  const bmi = useMemo(() => {
    const h = parseFloat(heightVal);
    const w = currentWeightVal;
    if (!h || !w || h <= 0 || w <= 0) return null;
    const weightInKg = weightUnit === 'lbs' ? w * 0.45359237 : w;
    const heightM = h > 10 ? h / 100 : h;
    const val = weightInKg / (heightM * heightM);
    const val2Str = val.toFixed(2);

    const minHealthyKg = (18.5 * heightM * heightM).toFixed(1);
    const maxHealthyKg = (24.9 * heightM * heightM).toFixed(1);

    let status = 'Normal';
    let color = GREEN;
    let note = '';

    if (val < 18.5) {
      status = 'Underweight';
      color = '#4FC3F7';
      const diff = (18.5 * heightM * heightM - weightInKg).toFixed(1);
      note = `Your BMI is ${val2Str}, which is below the healthy range (18.5–24.9). For your height of ${Math.round(h)} cm, your healthy weight range is ${minHealthyKg}–${maxHealthyKg} ${weightUnit}. You are about ${diff} ${weightUnit} below the recommended lower limit.`;
    } else if (val < 25) {
      status = 'Normal';
      color = GREEN;
      note = `Your BMI is ${val2Str}, which falls within the ideal healthy range (18.5–24.9). For your height of ${Math.round(h)} cm, your healthy weight range is ${minHealthyKg}–${maxHealthyKg} ${weightUnit}. Keep maintaining your balanced diet and lifestyle!`;
    } else if (val < 30) {
      status = 'Overweight';
      color = '#FFB300';
      const diff = (weightInKg - 24.9 * heightM * heightM).toFixed(1);
      note = `Your BMI is ${val2Str}, which is above the healthy range (18.5–24.9). For your height of ${Math.round(h)} cm, your target healthy range is ${minHealthyKg}–${maxHealthyKg} ${weightUnit} (${diff} ${weightUnit} above upper limit).`;
    } else {
      status = 'Obese';
      color = '#EF5350';
      const diff = (weightInKg - 24.9 * heightM * heightM).toFixed(1);
      note = `Your BMI is ${val2Str}, which indicates obesity (≥30.0). For your height of ${Math.round(h)} cm, your recommended healthy weight range is ${minHealthyKg}–${maxHealthyKg} ${weightUnit}. Consider consulting a healthcare professional for a tailored plan.`;
    }

    return {
      val: val.toFixed(1),
      val2Dec: val2Str,
      raw: val,
      status,
      color,
      note,
      minHealthyKg,
      maxHealthyKg,
    };
  }, [heightVal, currentWeightVal, weightUnit]);

  const themeColor = bmi?.color || GREEN;

  // ── Progress % toward goal ───────────────────────────────────────────────
  const goalProgress = useMemo(() => {
    const start = parseFloat(startingValue) || currentWeightVal;
    const target = parseFloat(currentGoalVal);
    const totalDiff = Math.abs(target - start);
    if (totalDiff === 0) return 0;
    const achieved = Math.abs(currentWeightVal - start);
    return Math.min(100, Math.round((achieved / totalDiff) * 100));
  }, [startingValue, currentGoalVal, currentWeightVal]);

  const openAddLog = () => {
    setEditValue(formatWeight(currentWeightVal));
    setIsFirstKey(true);
    setEditCardModal('current');
  };

  const syncGoalWeight = async (targetWeightKg, customGoalWeeks = null, customGoalType = null) => {
    const numTarget = parseFloat(targetWeightKg);
    if (isNaN(numTarget) || numTarget <= 0) return;
    const currentW = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
    const diff = Math.abs(numTarget - currentW).toFixed(1);
    const gType = customGoalType || (Math.abs(numTarget - currentW) < 0.1 ? 'Maintain' : numTarget >= currentW ? 'Gained' : 'Lost');
    const fitGoal = gType === 'Maintain' ? 'Maintenance' : gType === 'Gained' ? 'Build Muscle' : 'Weight Loss';
    const dbGoalType = gType === 'Maintain' ? 'maintain' : gType === 'Gained' ? 'gain' : 'lose';
    const weeksToSave = customGoalWeeks ? String(customGoalWeeks) : (goalWeeks || '12');
    const daysToSave = parseInt(weeksToSave, 10) * 7;

    setGoalAmount(diff);
    setGoalType(gType);
    if (customGoalWeeks) {
      setGoalWeeks(String(customGoalWeeks));
    }

    try {
      // 1. Local member profile metrics
      const raw = await AsyncStorage.getItem('member_profile_metrics');
      const m = raw ? JSON.parse(raw) : {};
      m.targetWeight = String(numTarget.toFixed(1));
      m.goalWeight = String(numTarget.toFixed(1));
      m.goalWeeks = String(weeksToSave);
      m.targetTimeframeDays = daysToSave;
      m.goalType = dbGoalType;
      m.fitnessGoal = fitGoal;
      await AsyncStorage.setItem('member_profile_metrics', JSON.stringify(m));

      // 2. Goal metadata
      const gData = {
        goalType: gType,
        goalAmount: diff,
        goalWeeks: weeksToSave,
        targetTimeframeDays: daysToSave,
        startingValue,
        currentGoalVal: String(numTarget.toFixed(1)),
        weightUnit,
      };
      await AsyncStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(gData));

      // 3. User profile cache
      const cached = await AsyncStorage.getItem('userProfile');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.targetWeight = numTarget;
        parsed.goalWeight = numTarget;
        parsed.target_weight = numTarget;
        parsed.goalWeeks = parseInt(weeksToSave, 10);
        parsed.targetTimeframeDays = daysToSave;
        parsed.goalType = dbGoalType;
        parsed.fitnessGoal = fitGoal;
        if (parsed.userProfile) {
          parsed.userProfile.targetWeight = numTarget;
          parsed.userProfile.goalWeight = numTarget;
          parsed.userProfile.target_weight = numTarget;
          parsed.userProfile.goalWeeks = parseInt(weeksToSave, 10);
          parsed.userProfile.targetTimeframeDays = daysToSave;
          parsed.userProfile.goalType = dbGoalType;
          parsed.userProfile.fitnessGoal = fitGoal;
        }
        if (parsed.memberProfile) {
          parsed.memberProfile.targetWeight = numTarget;
          parsed.memberProfile.goalWeight = numTarget;
          parsed.memberProfile.target_weight = numTarget;
          parsed.memberProfile.goalWeeks = parseInt(weeksToSave, 10);
          parsed.memberProfile.targetTimeframeDays = daysToSave;
          parsed.memberProfile.goalType = dbGoalType;
          parsed.memberProfile.fitnessGoal = fitGoal;
        }
        await AsyncStorage.setItem('userProfile', JSON.stringify(parsed));
      }

      // 4. Update AuthContext state synchronously
      if (typeof updateUserLocal === 'function') {
        updateUserLocal({
          targetWeight: numTarget,
          goalWeight: numTarget,
          target_weight: numTarget,
          goalWeeks: parseInt(weeksToSave, 10),
          targetTimeframeDays: daysToSave,
          goalType: dbGoalType,
          fitnessGoal: fitGoal,
        });
      }

      // 5. Mark diet plan to refresh targets
      await AsyncStorage.setItem('diet_plan_needs_refresh', 'true');

      // 6. Backend sync
      await Promise.allSettled([
        apiClient.post('/weight/target', {
          targetWeight: numTarget,
          goalWeeks: parseInt(weeksToSave, 10),
          targetTimeframeDays: daysToSave,
          goalType: dbGoalType,
        }),
        apiClient.put('/users/profile', {
          targetWeight: numTarget,
          goalWeight: numTarget,
          target_weight: numTarget,
          goalWeeks: parseInt(weeksToSave, 10),
          targetTimeframeDays: daysToSave,
          goalType: dbGoalType,
          fitnessGoal: fitGoal,
        }),
      ]);

      // 7. Fetch updated nutrition targets from backend
      await fetchNutritionTargets().catch(() => {});

      // 8. Refresh Auth context across entire app
      if (typeof refreshAuthStatus === 'function') {
        await refreshAuthStatus();
      }
    } catch (err) {
      console.warn('[WeightTracker] syncGoalWeight error:', err.message);
    }
  };

  const syncCurrentWeight = async (currentWeightKg) => {
    const numW = parseFloat(currentWeightKg);
    if (isNaN(numW) || numW <= 0) return;
    try {
      const raw = await AsyncStorage.getItem('member_profile_metrics');
      const m = raw ? JSON.parse(raw) : {};
      m.weight = String(numW.toFixed(1));
      await AsyncStorage.setItem('member_profile_metrics', JSON.stringify(m));

      const cached = await AsyncStorage.getItem('userProfile');
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.weight = numW;
        if (parsed.userProfile) parsed.userProfile.weight = numW;
        if (parsed.memberProfile) parsed.memberProfile.weight = numW;
        await AsyncStorage.setItem('userProfile', JSON.stringify(parsed));
      }

      if (typeof updateUserLocal === 'function') {
        updateUserLocal({ weight: numW });
      }

      await AsyncStorage.setItem('diet_plan_needs_refresh', 'true');

      await apiClient.put('/users/profile', { weight: numW });
      await fetchNutritionTargets().catch(() => {});

      if (typeof refreshAuthStatus === 'function') {
        await refreshAuthStatus();
      }
    } catch (err) {
      console.warn('[WeightTracker] syncCurrentWeight error:', err.message);
    }
  };

  const handleAddLog = async () => {
    const val = parseFloat(logValue);
    if (isNaN(val) || val <= 0) { Alert.alert('Invalid Input', 'Please enter a valid number.'); return; }
    const valInKg = (activeTab === 'Weight' && weightUnit === 'lbs') ? val / 2.20462262 : val;
    const newLog = { id: String(Date.now()), value: valInKg, date: logDateText.trim() || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), timestamp: Date.now(), source: 'Manual', photo: null };
    if (activeTab === 'Weight') {
      const updated = [...weightLogs, newLog].sort((a, b) => a.timestamp - b.timestamp);
      setWeightLogs(updated);
      await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updated));
      dispatch(addWeightLog({ value: valInKg, date: newLog.date, timestamp: newLog.timestamp }));
      await syncCurrentWeight(valInKg);
    } else {
      const updated = [...bodyFatLogs, newLog].sort((a, b) => a.timestamp - b.timestamp);
      setBodyFatLogs(updated);
      await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify(updated));
    }
    setLogModalVisible(false);
  };

  const handleSaveGoal = async () => {
    const data = { goalType, goalAmount, goalWeeks, startingValue, currentGoalVal };
    await AsyncStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(data));
    if (currentGoalVal && !isNaN(parseFloat(currentGoalVal))) {
      await syncGoalWeight(parseFloat(currentGoalVal));
    }
    setGoalModalVisible(false);
  };

  const openEditCard = (type) => {
    const map = {
      starting: formatWeight(startingValue),
      current: formatWeight(currentWeightVal),
      goal: formatWeight(currentGoalVal),
      height: heightVal,
    };
    setEditValue(map[type] || '');
    setIsFirstKey(true);
    setEditCardModal(type);
  };

  const handleSaveCard = async () => {
    const v = editValue.trim();
    if (!v || isNaN(parseFloat(v))) { setEditCardModal(null); return; }
    const numV = parseFloat(v);
    const numVInKg = (editCardModal !== 'height' && weightUnit === 'lbs')
      ? numV / 2.20462262
      : numV;

    if (editCardModal === 'starting') {
      const valStr = numVInKg.toFixed(1);
      setStartingValue(valStr);
      await AsyncStorage.setItem(STARTING_WEIGHT_KEY, valStr);
      dispatch(saveWeightTarget({ startingValue: valStr }));
      try {
        const raw = await AsyncStorage.getItem('member_profile_metrics');
        const m = raw ? JSON.parse(raw) : {};
        m.userId = currentUserId;
        m.startingWeight = valStr;
        await AsyncStorage.setItem('member_profile_metrics', JSON.stringify(m));
        if (typeof updateUserLocal === 'function') {
          updateUserLocal({ startingWeight: numVInKg });
        }
        await apiClient.put('/users/profile', { startingWeight: numVInKg });
        await apiClient.post('/weight/target', { startingValue: numVInKg });
        if (typeof refreshAuthStatus === 'function') await refreshAuthStatus();
      } catch (_) {}
    } else if (editCardModal === 'goal') {
      const valStr = numVInKg.toFixed(1);
      const currentW = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
      const diff = Math.abs(numVInKg - currentW).toFixed(1);
      const gType = Math.abs(numVInKg - currentW) < 0.1 ? 'Maintain' : (numVInKg >= currentW ? 'Gained' : 'Lost');
      const weeksNum = parseInt(goalWeeks, 10) || 12;

      setCurrentGoalVal(valStr);
      setGoalAmount(diff);
      setGoalType(gType);

      dispatch(saveWeightTarget({
        targetWeight: valStr,
        height: heightVal,
        startingValue,
        goalWeeks: weeksNum,
        targetTimeframeDays: weeksNum * 7,
        goalType: gType === 'Maintain' ? 'maintain' : (gType === 'Gained' ? 'gain' : 'lose'),
      }));

      await syncGoalWeight(numVInKg, String(weeksNum), gType);
    } else if (editCardModal === 'height') {
      const valStr = String(Math.round(numV));
      setHeightVal(valStr);
      dispatch(saveWeightTarget({ height: valStr }));
      try {
        const raw = await AsyncStorage.getItem('member_profile_metrics');
        const m = raw ? JSON.parse(raw) : {};
        m.height = valStr;
        await AsyncStorage.setItem('member_profile_metrics', JSON.stringify(m));
        await apiClient.put('/users/profile', { height: parseFloat(valStr) });
        if (typeof refreshAuthStatus === 'function') await refreshAuthStatus();
      } catch (_) {}
    } else if (editCardModal === 'current') {
      const ts = Date.now();
      const newLog = { id: String(ts), value: numVInKg, date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }), timestamp: ts, source: 'Manual', photo: null };
      const updated = [...weightLogs, newLog].sort((a, b) => a.timestamp - b.timestamp);
      setWeightLogs(updated);
      await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updated));
      dispatch(addWeightLog({ value: numVInKg, date: newLog.date, timestamp: ts }));
      await syncCurrentWeight(numVInKg);
    }
    setEditCardModal(null);
  };

  const handleDeleteLog = (id) => {
    Alert.alert('Delete Log', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (activeTab === 'Weight') {
            const f = weightLogs.filter(l => l.id !== id);
            setWeightLogs(f);
            await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(f));
            dispatch(removeWeightLog(id));
          }
          else { const f = bodyFatLogs.filter(l => l.id !== id); setBodyFatLogs(f); await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify(f)); }
        }
      },
    ]);
  };

  const metricCards = [
    { key: 'starting', icon: 'weight-lifter', label: 'Starting Weight', value: `${formatWeight(startingValue)} ${displayUnit}` },
    { key: 'current', icon: 'weight-lifter', label: 'Current Weight', value: `${formatWeight(currentWeightVal)} ${displayUnit}` },
    {
      key: 'goal',
      icon: 'target',
      label: 'Goal Weight',
      value: `${formatWeight(currentGoalVal)} ${displayUnit}`,
      subvalue: currentTargetCals ? `${currentTargetCals.toLocaleString()} Cal/day` : undefined,
    },
    { key: 'height', icon: 'ruler', label: 'Height', value: `${heightVal} cm` },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      <ScrollView
        style={{ flex: 1, backgroundColor: DARK_BG }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HERO — inside ScrollView so the full page scrolls */}
        <View style={styles.hero}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Icon name="chevron-back" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Weight Tracker</Text>
            <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={styles.settingsBtn}>
              <Icon name="settings-sharp" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.targetLabel, { color: themeColor }]}>
              TARGET: {formatWeight(currentGoalVal)} {displayUnit} {currentTargetCals ? `• ${currentTargetCals.toLocaleString()} Cal/day` : ''}
            </Text>
            <View style={styles.deltaRow}>
              <Animated.Text key={displayDelta.toFixed(1)} entering={FadeInUp.springify()} style={styles.deltaValue}>
                {displayDelta >= 0 ? '+' : ''}{displayDelta.toFixed(1)}
              </Animated.Text>
              <View style={styles.deltaRight}>
                <Text style={styles.deltaUnit}>{displayUnit}</Text>
                <Text style={[styles.deltaDirection, { color: themeColor }]}>
                  {displayDelta >= 0 ? 'to gain' : 'to lose'}
                </Text>
              </View>
            </View>
            <Text style={styles.motivationText}>Stay consistent towards your goal</Text>
          </View>

          <View style={{ height: CHART_H, width: SCREEN_WIDTH }} pointerEvents="none">
            {chartPoints.length >= 2 ? (
              <Svg width={SCREEN_WIDTH} height={CHART_H}>
                <Defs>
                  <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={themeColor} stopOpacity="0.28" />
                    <Stop offset="100%" stopColor={themeColor} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Line x1={0} y1={targetLineY} x2={SCREEN_WIDTH} y2={targetLineY} stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} strokeDasharray="6 4" />
                <Path d={`${linePath} L ${chartPoints[chartPoints.length - 1].x} ${CHART_H} L ${chartPoints[0].x} ${CHART_H} Z`} fill="url(#grad)" />
                <Path d={linePath} fill="none" stroke={themeColor} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
                {chartPoints.map((pt, i) => (
                  <Circle key={i} cx={pt.x} cy={pt.y} r={5} fill={themeColor} stroke={DARK_BG} strokeWidth={2} />
                ))}
              </Svg>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Log entries to see your chart</Text>
              </View>
            )}
          </View>
        </View>



        {/* ACTION ROW */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.historyBtn} onPress={() => setHistoryModalVisible(true)} activeOpacity={0.8}>
            <Icon name="menu" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logWeightBtn} onPress={openAddLog} activeOpacity={0.85}>
            <Text style={styles.logWeightBtnText}>+ Log Weight</Text>
          </TouchableOpacity>
        </View>

        {/* METRIC CARDS */}
        <View style={styles.cardsGrid}>
          {metricCards.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={styles.card}
              onPress={() => openEditCard(card.key)}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <MaterialCommunityIcons name={card.icon} size={22} color="rgba(255,255,255,0.5)" />
                <Icon name="pencil" size={15} color="rgba(255,255,255,0.3)" />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              {card.subvalue && (
                <Text style={{ fontSize: 11, color: GREEN_BRIGHT, marginTop: 4, fontWeight: '600' }}>
                  {card.subvalue}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>


        {/* ── WEIGHT PROGRESS CARD ───────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={styles.sectionCardTitle}>Weight Progress</Text>
            <View style={[styles.goalBadge, { backgroundColor: `${themeColor}22` }]}>
              <Text style={[styles.goalBadgeText, { color: themeColor }]}>🏁 {goalProgress}% of goal</Text>
            </View>
          </View>

          {/* Bar chart */}
          <View style={styles.barChartArea}>
            {barChartData.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No logs recorded for this period</Text>
              </View>
            ) : (
              <>
                {/* Dashed target line at targetHeight% from bottom */}
                <View style={[styles.barTargetLine, { bottom: `${barChartData[0]?.targetHeight ?? 60}%` }]} />
                <View style={styles.barsRow}>
                  {barChartData.map((b, i) => (
                    <View key={i} style={styles.barWrapper}>
                      <View style={[styles.bar, { height: `${Math.max(4, b.height)}%`, backgroundColor: themeColor }]} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Period tabs */}
          <View style={styles.periodRow}>
            {['90D', '6M', '1Y', 'ALL'].map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setProgressPeriod(p)}
                style={[styles.periodBtn, progressPeriod === p && styles.periodBtnActive]}
              >
                <Text style={[styles.periodBtnText, progressPeriod === p && styles.periodBtnTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── WEIGHT CHANGES CARD ────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Weight Changes</Text>
          {weightChanges.map((row, i) => {
            const isLost = row.direction === 'lost';
            const isGained = row.direction === 'gained';
            const barColor = isLost ? '#EF5350' : isGained ? themeColor : '#555';
            const arrow = isLost ? '↓' : isGained ? '↑' : '→';
            const dirLabel = isLost ? 'Lost' : isGained ? 'Gained' : 'No change';
            const barW = isLost || isGained ? Math.min(1, parseFloat(row.delta) / 10) : 0.3;
            return (
              <View key={i} style={styles.changeRow}>
                <Text style={styles.changePeriodText}>{row.label}</Text>
                <View style={styles.changeBarTrack}>
                  <View style={[styles.changeBar, { width: `${Math.round(barW * 100)}%`, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.changeDeltaText}>
                  {row.direction === 'none' ? '0.0' : `-${row.delta}`} KG
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 70 }}>
                  <Text style={{ color: barColor, fontSize: 13, fontWeight: '700' }}>{arrow}</Text>
                  <Text style={{ color: barColor, fontSize: 13, fontWeight: '600' }}>{dirLabel}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── BMI CARD ───────────────────────────────────────────────────── */}
        {bmi && (
          <View style={styles.bmiCard}>
            <View style={styles.bmiTop}>
              <MaterialCommunityIcons name="walk" size={26} color="rgba(255,255,255,0.6)" />
              <TouchableOpacity onPress={() => setBmiModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="eye-outline" size={22} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.bmiLabel}>Body Mass Index</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
              <Text style={styles.bmiValue}>{bmi.val}</Text>
              <Text style={[styles.bmiStatus, { color: bmi.color }]}>{bmi.status}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* CUSTOM KEYPAD EDIT CARD MODAL */}
      <Modal visible={editCardModal !== null} transparent animationType="slide" onRequestClose={() => setEditCardModal(null)}>
        <View style={styles.keypadModalOverlay}>
          <View style={styles.keypadModalSheet}>
            <View style={styles.keypadHandle} />
            {/* Value display */}
            <View style={{ alignItems: 'center', marginBottom: 6 }}>
              <Animated.Text style={[styles.keypadDisplayValue, animatedKeypadValueStyle, { marginBottom: 2 }]}>
                {editValue || '0'}
              </Animated.Text>
              {goalModalRateInfo && !goalModalRateInfo.isMaintain && (
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                  {goalModalRateInfo.isGain ? '+' : '−'}
                  {formatWeight(goalModalRateInfo.deltaKg)} {displayUnit} to {goalModalRateInfo.isGain ? 'gain' : 'lose'}
                </Text>
              )}
            </View>

            {/* Per-week Rate of Increase / Decrease Selector */}
            {editCardModal === 'goal' && goalModalRateInfo && !goalModalRateInfo.isMaintain && (
              <View style={styles.keypadGoalRateCard}>
                <View style={styles.keypadGoalRateHeader}>
                  <Text style={styles.keypadGoalRateLabel}>
                    Per-week {goalModalRateInfo.isGain ? 'increase' : 'loss'}:
                  </Text>
                  <Text style={[styles.keypadGoalRateValue, { color: goalModalRateInfo.isUnsafeRate ? '#FFB300' : GREEN_BRIGHT }]}>
                    {goalModalRateInfo.isGain ? '+' : '−'}{goalModalRateInfo.weeklyRateDisplay.toFixed(2)} {displayUnit}/wk
                  </Text>
                </View>

                <Text style={styles.keypadGoalRateSubtext}>
                  Timeframe: {goalModalRateInfo.weeks} Weeks ({goalModalRateInfo.weeks * 7} Days)
                </Text>

                <View style={styles.keypadRateStepperRow}>
                  <TouchableOpacity
                    style={styles.keypadRateStepperBtn}
                    onPress={() => {
                      const step = weightUnit === 'lbs' ? 0.25 : 0.1;
                      const nextRate = Math.max(0.1, goalModalRateInfo.weeklyRateDisplay - step);
                      const nextRateKg = weightUnit === 'lbs' ? nextRate / 2.20462262 : nextRate;
                      const nextWeeks = Math.max(1, Math.round(goalModalRateInfo.deltaKg / nextRateKg));
                      setGoalWeeks(String(nextWeeks));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.keypadRateStepperBtnText}>−</Text>
                  </TouchableOpacity>

                  {(weightUnit === 'lbs' ? [0.5, 1.0, 1.5, 2.0] : [0.25, 0.50, 0.75, 1.00]).map((rateVal) => {
                    const rateKg = weightUnit === 'lbs' ? rateVal / 2.20462262 : rateVal;
                    const impliedWeeks = Math.max(1, Math.round(goalModalRateInfo.deltaKg / rateKg));
                    const isSelected = Math.abs(goalModalRateInfo.weeks - impliedWeeks) <= 1;
                    return (
                      <TouchableOpacity
                        key={`kr-${rateVal}`}
                        style={[styles.keypadRateChip, isSelected && styles.keypadRateChipActive]}
                        onPress={() => setGoalWeeks(String(impliedWeeks))}
                      >
                        <Text style={[styles.keypadRateChipText, isSelected && styles.keypadRateChipTextActive]}>
                          {rateVal.toFixed(2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.keypadRateStepperBtn}
                    onPress={() => {
                      const step = weightUnit === 'lbs' ? 0.25 : 0.1;
                      const nextRate = goalModalRateInfo.weeklyRateDisplay + step;
                      const nextRateKg = weightUnit === 'lbs' ? nextRate / 2.20462262 : nextRate;
                      const nextWeeks = Math.max(1, Math.round(goalModalRateInfo.deltaKg / nextRateKg));
                      setGoalWeeks(String(nextWeeks));
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.keypadRateStepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {goalModalRateInfo.isUnsafeRate && (
                  <TouchableOpacity
                    style={styles.keypadRateWarning}
                    onPress={() => setGoalWeeks(String(goalModalRateInfo.minSafeWeeks))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.keypadRateWarningText}>
                      ⚠️ Aggressive pace (>1%/wk). Tap for safe pace: {goalModalRateInfo.safeWeeklyRateDisplay.toFixed(2)} {displayUnit}/wk ({goalModalRateInfo.minSafeWeeks}W)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {(editCardModal === 'goal' || editCardModal === 'current') && modalTargetsPreview && (
              <Text style={{ textAlign: 'center', color: GREEN_BRIGHT, fontSize: 13, marginBottom: 12, fontWeight: '600' }}>
                Estimated Daily Target: {modalTargetsPreview.calories.toLocaleString()} Cal/day
                {modalTargetsPreview.dailyAdjustment !== 0 && (
                  ` (${modalTargetsPreview.dailyAdjustment > 0 ? `+${modalTargetsPreview.dailyAdjustment}` : modalTargetsPreview.dailyAdjustment} Cal ${modalTargetsPreview.dailyAdjustment > 0 ? 'surplus' : 'deficit'})`
                )}
              </Text>
            )}

            {/* Numpad grid */}
            <View style={styles.keypadGrid}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map((num) => (
                  <AnimatedKeypadKey
                    key={num}
                    label={num}
                    onKeypadType={triggerKeypadAnim}
                    onPress={() => {
                      if (isFirstKey) {
                        setEditValue(num);
                        setIsFirstKey(false);
                      } else {
                        if (editValue.length >= 6) return;
                        setEditValue(prev => (prev === '0' ? num : prev + num));
                      }
                    }}
                  />
                ))}
              </View>

              <View style={styles.keypadRow}>
                {['4', '5', '6'].map((num) => (
                  <AnimatedKeypadKey
                    key={num}
                    label={num}
                    onKeypadType={triggerKeypadAnim}
                    onPress={() => {
                      if (isFirstKey) {
                        setEditValue(num);
                        setIsFirstKey(false);
                      } else {
                        if (editValue.length >= 6) return;
                        setEditValue(prev => (prev === '0' ? num : prev + num));
                      }
                    }}
                  />
                ))}
              </View>

              <View style={styles.keypadRow}>
                {['7', '8', '9'].map((num) => (
                  <AnimatedKeypadKey
                    key={num}
                    label={num}
                    onKeypadType={triggerKeypadAnim}
                    onPress={() => {
                      if (isFirstKey) {
                        setEditValue(num);
                        setIsFirstKey(false);
                      } else {
                        if (editValue.length >= 6) return;
                        setEditValue(prev => (prev === '0' ? num : prev + num));
                      }
                    }}
                  />
                ))}
              </View>

              <View style={styles.keypadRow}>
                <AnimatedKeypadKey
                  label="."
                  onKeypadType={triggerKeypadAnim}
                  onPress={() => {
                    if (editCardModal === 'height') return;
                    if (isFirstKey) {
                      setEditValue('0.');
                      setIsFirstKey(false);
                    } else {
                      if (!editValue.includes('.')) {
                        setEditValue(prev => (prev ? prev + '.' : '0.'));
                      }
                    }
                  }}
                />

                <AnimatedKeypadKey
                  label="0"
                  onKeypadType={triggerKeypadAnim}
                  onPress={() => {
                    if (isFirstKey) {
                      setEditValue('0');
                      setIsFirstKey(false);
                    } else {
                      if (editValue.length >= 6) return;
                      setEditValue(prev => (prev === '0' ? '0' : prev + '0'));
                    }
                  }}
                />

                <AnimatedKeypadKey
                  icon="backspace-outline"
                  onKeypadType={triggerKeypadAnim}
                  onPress={() => {
                    setIsFirstKey(false);
                    setEditValue(prev => (prev.length > 1 ? prev.slice(0, -1) : ''));
                  }}
                />
              </View>

              <View style={styles.keypadBottomRow}>
                <AnimatedKeypadKey
                  label={weightUnit.toUpperCase()}
                  isUnit
                  onPress={() => setWeightUnit(prev => (prev === 'kg' ? 'lbs' : 'kg'))}
                />

                <AnimatedKeypadKey
                  label="Done"
                  isDone
                  onPress={handleSaveCard}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* WEIGHT LOGS HISTORY MODAL */}
      <Modal visible={historyModalVisible} transparent animationType="slide" onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalSheet}>
            <View style={styles.historyHandle} />
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyHeaderTitle}>Weight Logs</Text>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.historyCloseBtn}
              >
                <Icon name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {weightLogs.length === 0 ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No weight logs recorded yet</Text>
                </View>
              ) : (
                weightLogs.slice().reverse().map((log) => {
                  let formattedDate = log.date;
                  try {
                    const d = new Date(log.date);
                    if (!isNaN(d.getTime())) {
                      formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                    }
                  } catch (_) { }
                  return (
                    <View key={log.id} style={styles.historyLogRow}>
                      <View style={{ gap: 4 }}>
                        <Text style={styles.historyLogWeightText}>
                          {formatWeight(log.value)} {displayUnit}
                        </Text>
                        <Text style={styles.historyLogDateText}>
                          {formattedDate}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BMI DETAIL MODAL */}
      <Modal visible={bmiModalVisible} transparent animationType="slide">
        <View style={styles.bmiModalOverlay}>
          <View style={styles.bmiModalSheet}>
            <Text style={styles.bmiModalSub}>Your BMI is</Text>
            <Text style={styles.bmiModalBigVal}>{bmi?.val2Dec ?? bmi?.val ?? '--'}</Text>

            {[
              { label: 'Underweight', range: '<18.5', color: '#4FC3F7', active: bmi && bmi.raw < 18.5 },
              { label: 'Normal', range: '18.5–24.9', color: GREEN, active: bmi && bmi.raw >= 18.5 && bmi.raw < 25 },
              { label: 'Overweight', range: '25–29.9', color: '#FFB300', active: bmi && bmi.raw >= 25 && bmi.raw < 30 },
              { label: 'Obese', range: '≥30', color: '#EF5350', active: bmi && bmi.raw >= 30 },
            ].map(row => (
              <View
                key={row.label}
                style={[
                  styles.bmiCategoryRow,
                  row.active && { borderColor: row.color, borderWidth: 1.5 },
                ]}
              >
                <View style={[styles.bmiDot, { backgroundColor: row.color }]} />
                <Text style={styles.bmiCategoryLabel}>{row.label}</Text>
                <Text style={styles.bmiCategoryRange}>{row.range}</Text>
              </View>
            ))}

            <View style={styles.bmiNoteCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="information-circle-outline" size={18} color="rgba(255,255,255,0.5)" />
                <Text style={styles.bmiNoteTitle}>Note</Text>
              </View>
              <Text style={styles.bmiNoteText}>
                {bmi?.note || 'BMI is a general indicator based on height and weight.'}
              </Text>
            </View>

            <TouchableOpacity style={styles.bmiCloseBtn} onPress={() => setBmiModalVisible(false)}>
              <Text style={styles.bmiCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal visible={goalModalVisible} transparent animationType="slide" onRequestClose={() => setGoalModalVisible(false)}>
        <View style={styles.settingsModalOverlay}>
          <View style={styles.settingsModalSheet}>
            {/* Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.settingsDoneBtn}
                onPress={async () => {
                  const data = { goalType, goalAmount, goalWeeks, startingValue, currentGoalVal, weightUnit, targetBMI };
                  await AsyncStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(data));
                  if (currentGoalVal && !isNaN(parseFloat(currentGoalVal))) {
                    await syncGoalWeight(parseFloat(currentGoalVal), goalWeeks, goalType);
                  }
                  setGoalModalVisible(false);
                }}
              >
                <Text style={styles.settingsDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

              {/* Unit toggle */}
              <Text style={styles.settingsSectionLabel}>Unit</Text>
              <View style={styles.unitToggleContainer}>
                <View style={styles.unitToggle}>
                  {['kg', 'lbs'].map(u => (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setWeightUnit(u)}
                      style={[styles.unitToggleBtn, weightUnit === u && styles.unitToggleBtnActive]}
                    >
                      <Text style={[styles.unitToggleBtnText, weightUnit === u && styles.unitToggleBtnTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Ideal Weight section */}
              <View style={styles.idealWeightBadge}>
                <MaterialCommunityIcons name="walk" size={16} color="#FFF" />
                <Text style={styles.idealWeightBadgeText}>Ideal Weight</Text>
              </View>
              <Text style={styles.idealWeightSubtitle}>Ideal weight based on height and target BMI</Text>

              {/* Height card */}
              <View style={styles.settingsCard}>
                <Text style={styles.settingsCardLabel}>Height</Text>
                <Text style={styles.settingsCardValue}>{heightVal} cm</Text>
              </View>

              {/* Healthy range */}
              {(() => {
                const hM = parseFloat(heightVal) > 10 ? parseFloat(heightVal) / 100 : parseFloat(heightVal);
                const minW = (18.5 * hM * hM).toFixed(1);
                const maxW = (25 * hM * hM).toFixed(1);
                return (
                  <View style={styles.healthyRangeRow}>
                    <Icon name="person-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.healthyRangeText}>Healthy range: {minW} – {maxW} {weightUnit}</Text>
                  </View>
                );
              })()}

              {/* Calculated ideal weight card */}
              {(() => {
                const hM = parseFloat(heightVal) > 10 ? parseFloat(heightVal) / 100 : parseFloat(heightVal);
                const idealW = (targetBMI * hM * hM).toFixed(1);
                return (
                  <View style={styles.settingsCard}>
                    <Text style={styles.settingsCardLabel}>Calculated ideal weight</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                      <Text style={styles.idealWeightValue}>{idealW}</Text>
                      <Text style={styles.idealWeightValueUnit}>{weightUnit}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Target BMI slider */}
              <View style={styles.settingsCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={styles.settingsCardLabel}>Target BMI</Text>
                  <Text style={styles.bmiSliderValue}>{targetBMI.toFixed(1)}</Text>
                </View>
                {/* Custom slider */}
                <View
                  style={styles.sliderTrack}
                  ref={sliderRef}
                  onLayout={e => { sliderRef.current._width = e.nativeEvent.layout.width; }}
                  {...PanResponder.create({
                    onStartShouldSetPanResponder: () => true,
                    onMoveShouldSetPanResponder: () => true,
                    onPanResponderGrant: (e) => {
                      const w = sliderRef.current?._width || (SCREEN_WIDTH - 80);
                      const x = e.nativeEvent.locationX;
                      const pct = Math.min(1, Math.max(0, x / w));
                      const newBMI = Math.round((18.5 + pct * (25 - 18.5)) * 10) / 10;
                      setTargetBMI(newBMI);
                    },
                    onPanResponderMove: (e) => {
                      const w = sliderRef.current?._width || (SCREEN_WIDTH - 80);
                      const x = e.nativeEvent.locationX;
                      const pct = Math.min(1, Math.max(0, x / w));
                      const newBMI = Math.round((18.5 + pct * (25 - 18.5)) * 10) / 10;
                      setTargetBMI(newBMI);
                    },
                  }).panHandlers}
                >
                  <View style={[styles.sliderFill, { width: `${((targetBMI - 18.5) / (25 - 18.5)) * 100}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${((targetBMI - 18.5) / (25 - 18.5)) * 100}%` }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={styles.sliderEndLabel}>18.5</Text>
                  <Text style={styles.sliderEndLabel}>25</Text>
                </View>
              </View>

              {/* Target Timeframe section */}
              {(() => {
                const hM = parseFloat(heightVal) > 10 ? parseFloat(heightVal) / 100 : parseFloat(heightVal);
                const idealWNum = parseFloat((targetBMI * hM * hM).toFixed(1));
                const currWNum = currentWeightVal > 0 ? currentWeightVal : (parseFloat(startingValue) || 70);
                const totalDeltaKg = Math.abs(idealWNum - currWNum);
                const weeksNum = Math.max(1, parseInt(goalWeeks, 10) || 12);
                const weeklyKg = totalDeltaKg / weeksNum;
                const weeklyPct = currWNum > 0 ? (weeklyKg / currWNum) * 100 : 0;
                const minSafeWeeks = Math.max(1, Math.ceil(totalDeltaKg / (currWNum * 0.01)));
                const isUnsafe = weeklyPct > 1.05 && totalDeltaKg > 0.5;

                const userGender = user?.gender || user?.userProfile?.gender || user?.memberProfile?.gender || 'Male';
                const userAge = user?.age || user?.userProfile?.age || user?.memberProfile?.age || 25;
                const userAct = user?.activityLevel || user?.userProfile?.activityLevel || user?.memberProfile?.activityLevel || 'moderate';
                const userGoal = user?.fitnessGoal || user?.userProfile?.fitnessGoal || user?.memberProfile?.fitnessGoal || '';

                const previewTargets = calculateNutritionTargets(
                  currWNum,
                  parseFloat(heightVal) || 170,
                  userAge,
                  userGender,
                  userGoal,
                  userAct,
                  idealWNum,
                  weeksNum * 7
                );

                const presetWeeks = [4, 8, 12, 16, 20, 24, 32];

                return (
                  <View style={{ marginTop: 6, marginBottom: 10 }}>
                    {/* Timeframe Card */}
                    <View style={styles.settingsCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.settingsCardLabel}>Target Timeframe</Text>
                        <Text style={styles.bmiSliderValue}>{weeksNum} Weeks</Text>
                      </View>

                      {/* Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setGoalWeeks(prev => String(Math.max(1, (parseInt(prev, 10) || 12) - 1)))}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValText}>{weeksNum} W ({weeksNum * 7}d)</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => setGoalWeeks(prev => String(Math.min(104, (parseInt(prev, 10) || 12) + 1)))}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Preset Chips */}
                      <View style={styles.timeframePresetRow}>
                        {presetWeeks.map(w => {
                          const isActive = weeksNum === w;
                          return (
                            <TouchableOpacity
                              key={`pw-${w}`}
                              onPress={() => setGoalWeeks(String(w))}
                              style={[styles.timeframeChip, isActive && styles.timeframeChipActive]}
                            >
                              <Text style={[styles.timeframeChipText, isActive && styles.timeframeChipTextActive]}>
                                {w}W
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Weekly Rate Indicator & Presets */}
                      {totalDeltaKg > 0.2 && (
                        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                              Weekly Rate ({idealWNum >= currWNum ? 'Gain' : 'Loss'}):
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: isUnsafe ? '#FFB300' : GREEN_BRIGHT }}>
                              {idealWNum >= currWNum ? '+' : '−'}{(weightUnit === 'lbs' ? (weeklyKg * 2.20462262) : weeklyKg).toFixed(2)} {displayUnit}/wk
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                            {(weightUnit === 'lbs' ? [0.5, 1.0, 1.5, 2.0] : [0.25, 0.50, 0.75, 1.00]).map((rateVal) => {
                              const rateKg = weightUnit === 'lbs' ? rateVal / 2.20462262 : rateVal;
                              const impliedWeeks = Math.max(1, Math.round(totalDeltaKg / rateKg));
                              const isSelected = Math.abs(weeksNum - impliedWeeks) <= 1;
                              return (
                                <TouchableOpacity
                                  key={`swr-${rateVal}`}
                                  onPress={() => setGoalWeeks(String(impliedWeeks))}
                                  style={[styles.timeframeChip, isSelected && styles.timeframeChipActive, { paddingVertical: 5, paddingHorizontal: 10 }]}
                                >
                                  <Text style={[styles.timeframeChipText, isSelected && styles.timeframeChipTextActive]}>
                                    {rateVal.toFixed(2)} {displayUnit}/wk
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Pace & Guardrail Feedback */}
                    {totalDeltaKg > 0.2 && (
                      <View style={[styles.guardrailCard, isUnsafe ? styles.guardrailCardUnsafe : styles.guardrailCardSafe]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Icon
                            name={isUnsafe ? 'warning-outline' : 'checkmark-circle-outline'}
                            size={18}
                            color={isUnsafe ? '#FFB300' : '#2ecc71'}
                          />
                          <Text style={[styles.guardrailTitle, { color: isUnsafe ? '#FFB300' : '#2ecc71' }]}>
                            {isUnsafe ? 'Aggressive Pace (>1% bodyweight/week)' : 'Healthy & Sustainable Pace'}
                          </Text>
                        </View>
                        <Text style={styles.guardrailSubtitle}>
                          {isUnsafe
                            ? `Pace of ${weeklyKg.toFixed(2)} kg/week (${weeklyPct.toFixed(1)}%/wk) is too fast and risks muscle loss. Recommended safe timeframe is at least ${minSafeWeeks} weeks.`
                            : `Pace of ${weeklyKg.toFixed(2)} kg/week (${weeklyPct.toFixed(1)}%/wk) is within the recommended 1% weekly limit.`}
                        </Text>
                        {isUnsafe && (
                          <TouchableOpacity
                            style={styles.safeTimeframeBtn}
                            onPress={() => setGoalWeeks(String(minSafeWeeks))}
                          >
                            <Text style={styles.safeTimeframeBtnText}>
                              Auto-Set Safe Timeframe ({minSafeWeeks} Weeks)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {/* Calculated Daily Nutrition Impact */}
                    <View style={styles.caloriesPreviewCard}>
                      <View style={styles.caloriesPreviewRow}>
                        <View>
                          <Text style={styles.settingsCardLabel}>Computed Daily Calories</Text>
                          <Text style={styles.caloriesPreviewVal}>{previewTargets.calories} kcal</Text>
                        </View>
                        <View style={[styles.caloriesPreviewBadge, { backgroundColor: previewTargets.isMaintenance ? '#3A3A3C' : previewTargets.goalType === 'lose' ? '#2C3830' : '#382F2C' }]}>
                          <Text style={[styles.caloriesPreviewBadgeText, { color: previewTargets.isMaintenance ? '#AAA' : previewTargets.goalType === 'lose' ? '#2ecc71' : '#FF9F43' }]}>
                            {previewTargets.isMaintenance
                              ? 'Maintenance'
                              : previewTargets.goalType === 'lose'
                              ? `-${Math.abs(previewTargets.dailyAdjustment)} kcal deficit`
                              : `+${previewTargets.dailyAdjustment} kcal surplus`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.caloriesPreviewMacros}>
                        Protein: {previewTargets.protein}g • Fats: {previewTargets.fats}g • Carbs: {previewTargets.carbs}g • Fiber: {previewTargets.fiber}g
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Big White Pill 'Use as goal' button */}
              <TouchableOpacity
                style={styles.useAsGoalPillBtn}
                onPress={async () => {
                  const hM = parseFloat(heightVal) > 10 ? parseFloat(heightVal) / 100 : parseFloat(heightVal);
                  const idealW = (targetBMI * hM * hM).toFixed(1);
                  const startW = parseFloat(startingValue) || currentWeightVal;
                  const diff = Math.abs(parseFloat(idealW) - startW).toFixed(1);
                  const gType = Math.abs(parseFloat(idealW) - startW) < 0.1 ? 'Maintain' : (parseFloat(idealW) >= startW ? 'Gained' : 'Lost');
                  const weeksNum = parseInt(goalWeeks, 10) || 12;

                  // Update screen state immediately
                  setCurrentGoalVal(idealW);
                  setGoalAmount(diff);
                  setGoalType(gType);

                  // Dispatch Redux action to persist target weight & timeframe to DB
                  dispatch(saveWeightTarget({
                    targetWeight: idealW,
                    height: heightVal,
                    startingValue,
                    goalWeeks: weeksNum,
                    targetTimeframeDays: weeksNum * 7,
                    goalType: gType === 'Maintain' ? 'maintain' : (gType === 'Gained' ? 'gain' : 'lose'),
                  }));

                  // Sync target weight and timeframe across local storage, backend profile, and AuthContext
                  await syncGoalWeight(parseFloat(idealW), String(weeksNum), gType);

                  // Dismiss settings modal so user sees updated screen
                  setGoalModalVisible(false);
                }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="target" size={22} color="#111" />
                <Text style={styles.useAsGoalPillBtnText}>Use as goal</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK_BG },
  hero: { width: '100%', backgroundColor: '#0C1410', overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },
  settingsBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  heroContent: { paddingHorizontal: 20, paddingTop: 14 },
  targetLabel: { fontSize: 13, fontWeight: '600', color: GREEN_BRIGHT, letterSpacing: 0.5, marginBottom: 4, opacity: 0.9 },
  deltaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  deltaValue: { fontSize: 68, fontWeight: '800', color: '#FFF', letterSpacing: -3, lineHeight: 72 },
  deltaRight: { paddingBottom: 6, gap: 2 },
  deltaUnit: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  deltaDirection: { fontSize: 15, fontWeight: '600' },
  motivationText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 6, marginBottom: 0 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 10, marginBottom: 12 },
  tabBtn: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  tabBtnTextActive: { color: '#FFF' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  historyBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1E2220', justifyContent: 'center', alignItems: 'center' },
  logWeightBtn: { flex: 1, height: 52, borderRadius: 26, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  logWeightBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF', letterSpacing: 0.2 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 20 },
  card: { width: (SCREEN_WIDTH - 34) / 2, backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '700', color: '#FFF', letterSpacing: -0.5 },
  timelineTitle: { fontSize: 17, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN },
  timelineValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  timelineUnit: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.4)' },
  timelineMeta: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  timelineThumb: { width: 44, height: 44, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#161A18', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#FFF', textAlign: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 8, marginTop: 12 },
  modalInput: { height: 50, backgroundColor: '#0F1310', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, fontSize: 16, color: '#FFF' },
  typeSelectorRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: { flex: 1, height: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  typeBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  typeBtnText: { fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  typeBtnTextActive: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  confirmBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  // ── Weight Progress card ────────────────────────────────────────────────
  sectionCard: { marginHorizontal: 12, marginBottom: 14, backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  goalBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  goalBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  barChartArea: { height: 120, width: '100%', position: 'relative', marginBottom: 12, justifyContent: 'flex-end' },
  barTargetLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: 'rgba(255,255,255,0.18)', borderStyle: 'dashed' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 5, paddingHorizontal: 2 },
  barWrapper: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', backgroundColor: GREEN, borderRadius: 4, minHeight: 4 },
  periodRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  periodBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)' },
  periodBtnActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  periodBtnText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  periodBtnTextActive: { color: '#FFF' },

  // ── Weight Changes card ─────────────────────────────────────────────────
  changeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.04)', gap: 10 },
  changePeriodText: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500', width: 52 },
  changeBarTrack: { flex: 1, height: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', maxWidth: 100 },
  changeBar: { height: '100%', borderRadius: 4 },
  changeDeltaText: { fontSize: 13, fontWeight: '700', color: '#FFF', width: 70, textAlign: 'right' },

  // ── BMI card ────────────────────────────────────────────────────────────
  bmiCard: { marginHorizontal: 12, marginBottom: 30, backgroundColor: CARD_BG, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  bmiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  bmiLabel: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  bmiValue: { fontSize: 36, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  bmiStatus: { fontSize: 18, fontWeight: '700' },

  // ── Settings modal ────────────────────────────────────────────────────
  settingsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  settingsModalSheet: { backgroundColor: '#1C1D1F', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '88%', width: '100%', paddingTop: 16 },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14, position: 'relative' },
  settingsTitle: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  settingsDoneBtn: { position: 'absolute', right: 20, backgroundColor: '#FFF', borderRadius: 22, paddingVertical: 6, paddingHorizontal: 18 },
  settingsDoneBtnText: { fontSize: 14, fontWeight: '700', color: '#111' },
  settingsSectionLabel: { fontSize: 15, fontWeight: '600', color: '#FFF', marginBottom: 10 },
  unitToggleContainer: { marginBottom: 24 },
  unitToggle: { flexDirection: 'row', backgroundColor: '#2A2A2C', borderRadius: 30, padding: 4 },
  unitToggleBtn: { flex: 1, height: 40, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  unitToggleBtnActive: { backgroundColor: '#4A4A4C' },
  unitToggleBtnText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  unitToggleBtnTextActive: { color: '#FFF' },
  idealWeightBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C3830', borderRadius: 20, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 14, marginBottom: 8 },
  idealWeightBadgeText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  idealWeightSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  settingsCard: { backgroundColor: '#27292C', borderRadius: 16, padding: 16, marginBottom: 10 },
  settingsCardLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  settingsCardValue: { fontSize: 22, fontWeight: '700', color: '#FFF', marginTop: 4 },
  healthyRangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingHorizontal: 4 },
  healthyRangeText: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  idealWeightValue: { fontSize: 42, fontWeight: '800', color: '#FFF', letterSpacing: -1 },
  idealWeightValueUnit: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  useAsGoalPillBtn: { backgroundColor: '#FFFFFF', borderRadius: 30, height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 24 },
  useAsGoalPillBtnText: { fontSize: 16, fontWeight: '700', color: '#111111' },
  bmiSliderValue: { fontSize: 17, fontWeight: '700', color: '#FFF' },
  sliderTrack: { height: 6, backgroundColor: '#3A3A3C', borderRadius: 3, position: 'relative', justifyContent: 'center' },
  sliderFill: { height: '100%', backgroundColor: '#777', borderRadius: 3 },
  sliderThumb: { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', top: -11, marginLeft: -14, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  sliderEndLabel: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },

  // ── Weight logs history modal ───────────────────────────────────────────
  historyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  historyModalSheet: { backgroundColor: '#1C1D1F', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '80%', width: '100%', paddingTop: 12 },
  historyHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 12 },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', position: 'relative' },
  historyHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  historyCloseBtn: { position: 'absolute', right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  historyLogRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  historyLogWeightText: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  historyLogDateText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.5)' },

  // ── BMI detail modal ────────────────────────────────────────────────────
  bmiModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bmiModalSheet: { backgroundColor: '#1A1A1C', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: Platform.OS === 'ios' ? 44 : 30 },
  bmiModalSub: { fontSize: 15, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 6 },
  bmiModalBigVal: { fontSize: 64, fontWeight: '800', color: '#FFF', textAlign: 'center', letterSpacing: -2, marginBottom: 24 },
  bmiCategoryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2C', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  bmiDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  bmiCategoryLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFF' },
  bmiCategoryRange: { fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  bmiNoteCard: { backgroundColor: '#2A2A2C', borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 20 },
  bmiNoteTitle: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  bmiNoteText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
  bmiCloseBtn: { backgroundColor: '#FFF', borderRadius: 26, height: 54, justifyContent: 'center', alignItems: 'center' },
  bmiCloseBtnText: { fontSize: 16, fontWeight: '700', color: '#111' },

  // ── Custom keypad sheet modal ───────────────────────────────────────────
  keypadModalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  keypadModalSheet: { backgroundColor: '#1E2024', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 36 : 24 },
  keypadHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 14 },
  keypadDisplayValue: { fontSize: 44, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 16, letterSpacing: -1 },
  keypadGrid: { gap: 10 },
  keypadRow: { flexDirection: 'row', gap: 10 },
  keypadKey: { flex: 1, height: 50, backgroundColor: '#32353A', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  keypadKeyText: { fontSize: 22, fontWeight: '600', color: '#FFFFFF' },
  keypadBottomRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  keypadUnitBtn: { flex: 1, height: 50, backgroundColor: '#32353A', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  keypadUnitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  keypadDoneBtn: { flex: 1, height: 50, backgroundColor: '#D6D8DC', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  keypadDoneBtnText: { fontSize: 16, fontWeight: '700', color: '#111111' },

  // ── Timeframe & Guardrails Styles ───────────────────────────────────────
  timeframePresetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  timeframeChip: { backgroundColor: '#32353A', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  timeframeChipActive: { backgroundColor: '#FFFFFF' },
  timeframeChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  timeframeChipTextActive: { color: '#111', fontWeight: '700' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 10 },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#32353A', justifyContent: 'center', alignItems: 'center' },
  stepperBtnText: { fontSize: 20, color: '#FFF', fontWeight: '700', lineHeight: 22 },
  stepperValText: { fontSize: 17, color: '#FFF', fontWeight: '800', minWidth: 90, textAlign: 'center' },
  guardrailCard: { borderRadius: 16, padding: 14, marginTop: 8, marginBottom: 12 },
  guardrailCardUnsafe: { backgroundColor: 'rgba(255, 179, 0, 0.12)', borderWidth: 1, borderColor: '#FFB300' },
  guardrailCardSafe: { backgroundColor: 'rgba(46, 204, 113, 0.12)', borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.4)' },
  guardrailTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  guardrailSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 17 },
  safeTimeframeBtn: { backgroundColor: '#FFB300', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginTop: 10, alignSelf: 'flex-start' },
  safeTimeframeBtnText: { fontSize: 13, fontWeight: '700', color: '#111' },
  caloriesPreviewCard: { backgroundColor: '#232528', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  caloriesPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  caloriesPreviewVal: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  caloriesPreviewBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  caloriesPreviewBadgeText: { fontSize: 12, fontWeight: '700' },
  caloriesPreviewMacros: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  // ── Keypad Goal Rate Card Styles ─────────────────────────────────────────
  keypadGoalRateCard: { backgroundColor: '#272A2F', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  keypadGoalRateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  keypadGoalRateLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  keypadGoalRateValue: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  keypadGoalRateSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  keypadRateStepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  keypadRateStepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#35393F', justifyContent: 'center', alignItems: 'center' },
  keypadRateStepperBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF', lineHeight: 20 },
  keypadRateChip: { backgroundColor: '#35393F', paddingVertical: 6, paddingHorizontal: 11, borderRadius: 14 },
  keypadRateChipActive: { backgroundColor: '#FFF' },
  keypadRateChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  keypadRateChipTextActive: { color: '#111', fontWeight: '700' },
  keypadRateWarning: { backgroundColor: 'rgba(255, 179, 0, 0.15)', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255, 179, 0, 0.4)' },
  keypadRateWarningText: { fontSize: 11, color: '#FFB300', fontWeight: '600' },
});

export default WeightTrackerScreen;
