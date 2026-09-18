import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  TextInput,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { uploadToCloudinary } from '../../../utils/uploadToCloudinary';
import { analyzeMealWithAI } from '../../../redux/actions/dietActions';
import { getAccessStatus } from '../../../services/aiDieticianService';
import { fetchSleepLogs } from '../../../redux/actions/sleepActions';
import { useAuth } from '../../../context/AuthContext';
import { getTargetsForUser, getCachedBackendTargets, setCachedBackendTargets, fetchNutritionTargets } from '../../../utils/nutritionCalculator';
import dietAiApi from '../../../api/dietAiApi';


import DietHeader from './components/DietHeader';
import DietMacros from './components/DietMacros';
import DietWaterWidget from './components/DietWaterWidget';
import DietCameraModal from './components/DietCameraModal';
import DietDatePickerModal from './components/DietDatePickerModal';
import DietMealModal from './components/DietMealModal';
import DietMealSelectionModal from './components/DietMealSelectionModal';
import { useResponsiveMetrics } from '../../../utils/responsive';

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const PLAN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const migrateMeals = (mealsStr) => {
  if (!mealsStr) return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
  try {
    const parsed = JSON.parse(mealsStr);
    if (Array.isArray(parsed) && parsed.length === 2 && parsed.includes('Lunch') && parsed.includes('Dinner')) {
      return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    }
    return parsed;
  } catch (e) {
    const splitMeals = mealsStr.split(', ').filter(Boolean);
    if (splitMeals.length === 2 && splitMeals.includes('Lunch') && splitMeals.includes('Dinner')) {
      return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    }
    return splitMeals;
  }
};

const getMondayBasedIndex = (date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const buildCalendarDays = (selectedDate) => {
  const now = new Date();
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    const fullDate = new Date(currentYear, currentMonth, date);
    const dayOfWeek = fullDate.getDay();
    const isToday =
      date === now.getDate() &&
      currentMonth === now.getMonth() &&
      currentYear === now.getFullYear();

    const isSelected =
      date === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear();

    return {
      date,
      label: WEEKDAY_LABELS[getMondayBasedIndex(fullDate)],
      active: isSelected,
      isToday,
      fullDate,
    };
  });
};

const Dietplan = ({ navigation, route }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const reduxWeight = useSelector(state => state.weight);
  const metrics = useResponsiveMetrics();
  const { width, wp, hp, ms, sp, fs } = metrics;
  const weeklyPlanCardWidth = Math.min(wp(84), ms(360));
  const weeklyPlanCardSpacing = sp(12);
  const weeklyPlanSnapInterval = weeklyPlanCardWidth + weeklyPlanCardSpacing;

  const cameraRef = useRef(null);
  const weeklyPlanScrollViewRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({
    quality: 0.8,
  });

  // --- MODAL & LOG STATE ---
  const [showMealModal, setShowMealModal] = useState(false);
  const [showMealSelectionModal, setShowMealSelectionModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);

  // --- NUTRITION ENGINE STATES ---
  const [dailySummary, setDailySummary] = useState(null);

  const liveTargets = useMemo(() => {
    const cached = getCachedBackendTargets();
    if (cached && cached.calories > 0) {
      return cached;
    }
    const activeWeight =
      reduxWeight?.logs?.[reduxWeight.logs.length - 1]?.value ||
      user?.weight?.value ||
      user?.weight ||
      user?.userProfile?.weight ||
      user?.memberProfile?.weight ||
      reduxWeight?.startingValue ||
      70;
    const activeTarget =
      reduxWeight?.targetWeight ||
      user?.targetWeight?.value ||
      user?.targetWeight ||
      user?.userProfile?.targetWeight ||
      user?.memberProfile?.targetWeight ||
      user?.goalWeight;
    const activeHeight =
      reduxWeight?.height ||
      user?.height?.value ||
      user?.height ||
      user?.userProfile?.height ||
      user?.memberProfile?.height ||
      170;
    const activeFitnessGoal =
      user?.fitnessGoal ||
      user?.userProfile?.fitnessGoal ||
      user?.memberProfile?.fitnessGoal ||
      '';
    const activeGoalWeeks =
      reduxWeight?.goalWeeks ||
      user?.goalWeeks ||
      user?.userProfile?.goalWeeks ||
      user?.memberProfile?.goalWeeks ||
      12;
    const activeTimeframeDays =
      reduxWeight?.targetTimeframeDays ||
      user?.targetTimeframeDays ||
      user?.userProfile?.targetTimeframeDays ||
      user?.memberProfile?.targetTimeframeDays ||
      (activeGoalWeeks ? activeGoalWeeks * 7 : 84);
    const activeGoalType =
      reduxWeight?.goalType ||
      user?.goalType ||
      user?.userProfile?.goalType ||
      user?.memberProfile?.goalType ||
      null;

    const merged = {
      ...(user || {}),
      weight: activeWeight,
      height: activeHeight,
      targetWeight: activeTarget || undefined,
      goalWeight: activeTarget || undefined,
      fitnessGoal: activeFitnessGoal,
      goalWeeks: activeGoalWeeks,
      targetTimeframeDays: activeTimeframeDays,
      goalType: activeGoalType,
    };
    return getTargetsForUser(merged);
  }, [reduxWeight, user]);

  useEffect(() => {
    setDailySummary(prev => {
      const updatedTargets = liveTargets;
      if (!prev) {
        return {
          summary: { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0 },
          targets: updatedTargets,
          logs: [],
        };
      }
      return {
        ...prev,
        targets: updatedTargets,
      };
    });
  }, [liveTargets]);
  const [recommendation, setRecommendation] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' or 'analytics'
  const [newWeight, setNewWeight] = useState('');
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlanDay, setSelectedPlanDay] = useState(() => {
    return PLAN_DAY_NAMES[new Date().getDay()] || 'Monday';
  });

  const [stepsToday, setStepsToday] = useState(0);
  const [sleepHoursToday, setSleepHoursToday] = useState(0);
  const [hydrateGlasses, setHydrateGlasses] = useState(0);
  const [workoutCaloriesToday, setWorkoutCaloriesToday] = useState(0);
  const [sleepLogDetails, setSleepLogDetails] = useState(null); // { bedTime, wakeTime, duration }

  const formatSleep = (hours) => {
    const totalMinutes = Math.round((hours || 0) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs} hr ${mins} min`;
  };



  const reloadHealthKitData = async (dateToLoad = selectedDate) => {
    try {
      const dateObj = dateToLoad instanceof Date ? dateToLoad : new Date(dateToLoad);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      // 1. Fetch steps for the selected date
      const connected = await AsyncStorage.getItem('healthkit_connected');
      if (connected === 'true') {
        const { getStepCountForDate } = require('../../../utils/healthKit');
        const steps = await getStepCountForDate(dateObj);
        setStepsToday(steps || 0);
      } else {
        setStepsToday(0);
      }

      // 2. Fetch sleep data from API & AsyncStorage cache
      const sleepData = await fetchSleepLogs(dateKey);
      if (sleepData && sleepData.logs && sleepData.logs.length > 0) {
        setSleepHoursToday(sleepData.totalHours);
        setSleepLogDetails(sleepData.logs[0]);
        return;
      } else if (sleepData && sleepData.totalHours > 0) {
        setSleepHoursToday(sleepData.totalHours);
        setSleepLogDetails(null);
        return;
      }

      // 3. If no manual entry, check HealthKit sleep duration
      setSleepLogDetails(null);
      if (connected === 'true') {
        const { getSleepDurationToday } = require('../../../utils/healthKit');
        const isToday = new Date().toDateString() === dateObj.toDateString();
        if (isToday) {
          const sleepHours = await getSleepDurationToday();
          if (sleepHours > 0) {
            setSleepHoursToday(sleepHours);
            return;
          }
        }
      }

      // 4. Default to 0 when no sleep log is added
      setSleepHoursToday(0);
    } catch (err) {
      console.warn('[Dietplan] Failed to load HealthKit/AsyncStorage data:', err.message);
      setSleepHoursToday(0);
    }
  };

  const incrementHydrate = async () => {
    const newGlasses = Math.min(10, hydrateGlasses + 1);
    setHydrateGlasses(newGlasses);

    const dateKey = selectedDate
      ? (selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate).split('T')[0])
      : new Date().toISOString().split('T')[0];

    try {
      const currentWaterStr = await AsyncStorage.getItem(`water_intake_${dateKey}`);
      const currentWater = currentWaterStr ? parseFloat(currentWaterStr) : 0.0;
      const newWater = Math.min(8.0, currentWater + 0.45);
      await AsyncStorage.setItem(`water_intake_${dateKey}`, newWater.toFixed(1));
      fetchNutritionData(selectedDate, false);
    } catch (err) {
      console.error('Failed to sync hydrate to water widget:', err);
    }
  };

  useEffect(() => {
    reloadHealthKitData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const loadHydrateGlasses = async () => {
      const dateKey = selectedDate
        ? (selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate).split('T')[0])
        : new Date().toISOString().split('T')[0];
      try {
        const savedVal = await AsyncStorage.getItem(`water_intake_${dateKey}`);
        const currentWater = savedVal ? parseFloat(savedVal) : 0.0;
        const glasses = Math.round(currentWater / 0.45);
        setHydrateGlasses(glasses);
      } catch (err) {
        setHydrateGlasses(0);
      }
    };
    loadHydrateGlasses();
  }, [selectedDate, dailySummary]);


  const fetchNutritionData = useCallback(async (dateToFetch = selectedDate, showLoader = false) => {
    if (showLoader) {
      setIsNutritionLoading(true);
    }
    try {
      const year = dateToFetch.getFullYear();
      const month = String(dateToFetch.getMonth() + 1).padStart(2, '0');
      const day = String(dateToFetch.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Fetch user preferences from AsyncStorage to send to the backend
      const [
        savedPreference,
        savedSkipDays,
        savedMeals,
        savedAllergies,
        savedCuisines,
        savedOtherInfo
      ] = await Promise.all([
        AsyncStorage.getItem('diet_preference'),
        AsyncStorage.getItem('diet_skip_days'),
        AsyncStorage.getItem('diet_meals'),
        AsyncStorage.getItem('diet_allergies'),
        AsyncStorage.getItem('diet_cuisines'),
        AsyncStorage.getItem('diet_other_info')
      ]);

      const [logsResponse, workoutsResponse, summaryResponse] = await Promise.all([
        apiClient.get('/diet/logs').catch(() => ({ data: [] })),
        apiClient.get('/workouts/sessions?limit=100').catch(() => ({ data: { success: false } })),
        apiClient.get('/diet/progress/summary').catch(() => ({ data: null })),
      ]);

      if (logsResponse.data) {
        const payload = logsResponse.data?.data || logsResponse.data || [];
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.logs)
            ? payload.logs
            : [];
        // Filter out water logs so only food logs appear on the Diet screen
        const foodLogsOnly = normalized.filter(
          (item) => item.mealType !== 'water' && item.mealName !== 'Water'
        );
        setLogs(foodLogsOnly);

        // Filter food logs for the selected date
        const selectedDateStr = dateToFetch.toISOString().split('T')[0];
        const todayFoodLogs = foodLogsOnly.filter((item) => {
          if (!item.createdAt) return true;
          const itemDate = new Date(item.createdAt);
          return itemDate.toDateString() === dateToFetch.toDateString() ||
                 item.createdAt.startsWith(selectedDateStr);
        });

        const daySummary = todayFoodLogs.reduce((acc, log) => {
          acc.calories += log.calories || 0;
          acc.protein += log.protein || 0;
          acc.carbs += log.carbs || 0;
          acc.fats += log.fats || log.fat || 0;
          acc.fibre += log.fiber || log.fibre || 0;
          return acc;
        }, { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0 });

        // Retrieve backend-calculated targets (authoritative) or fallback to live profile targets
        const summaryPayload = summaryResponse?.data?.data || summaryResponse?.data;
        const backendTargets = summaryPayload?.targets;
        if (backendTargets && backendTargets.calories > 0) {
          setCachedBackendTargets(backendTargets);
        }

        const activeTargets = (backendTargets && backendTargets.calories > 0)
          ? {
              ...backendTargets,
              fat: backendTargets.fats || backendTargets.fat,
              fats: backendTargets.fats || backendTargets.fat,
              fiber: backendTargets.fibre || backendTargets.fiber,
              fibre: backendTargets.fibre || backendTargets.fiber,
            }
          : (getCachedBackendTargets() || liveTargets);

        const currentWeight =
          reduxWeight?.logs?.[reduxWeight.logs.length - 1]?.value ||
          user?.weight?.value ||
          user?.weight ||
          user?.userProfile?.weight ||
          user?.memberProfile?.weight ||
          reduxWeight?.startingValue ||
          70;
        daySummary.weight = currentWeight;

        setDailySummary({
          summary: daySummary,
          targets: activeTargets,
          logs: todayFoodLogs,
        });
      }

      // Check if weekly plan needs refresh or recommendation is not loaded
      try {
        const needsRefresh = await AsyncStorage.getItem('diet_plan_needs_refresh');
        if (needsRefresh === 'true' || !recommendation) {
          const recRes = await dietAiApi.fetchWeeklyPlan({ generate: needsRefresh === 'true' ? 'true' : 'false' });
          const planData = recRes?.weeklyPlan ? recRes : (recRes?.data?.weeklyPlan ? recRes.data : null);
          if (planData) {
            setRecommendation(planData);
            if (needsRefresh === 'true') {
              await AsyncStorage.removeItem('diet_plan_needs_refresh');
            }
          }
        }
      } catch (recErr) {
        console.log('[Dietplan] Weekly plan fetch note:', recErr.message);
      }

      // Calculate workouts calories
      let todayWorkoutCals = 0;
      if (workoutsResponse?.data?.success) {
        const sessions = workoutsResponse.data.data || [];
        const todaySessions = sessions.filter(session => {
          const sessionDate = session.date ? new Date(session.date) : new Date();
          return sessionDate.toDateString() === dateToFetch.toDateString();
        });

        todayWorkoutCals = todaySessions.reduce((sum, session) => {
          const duration = session.duration || 0;
          const intensity = session.intensity || 3;
          const metFactor = intensity === 1 ? 4 : intensity === 2 ? 6 : intensity === 3 ? 8 : intensity === 4 ? 10 : 12;
          return sum + (duration * metFactor);
        }, 0);
      }
      setWorkoutCaloriesToday(todayWorkoutCals);
    } catch (error) {
      console.warn('[Dietplan] Failed to fetch nutrition/analytics data:', error.message);
    } finally {
      if (showLoader) {
        setIsNutritionLoading(false);
      }
    }
  }, [selectedDate]);

  const lastDietCheckRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const now = Date.now();

      const checkSubscriptionAccess = async () => {
        try {
          const access = await getAccessStatus();
          if (isMounted) {
            if (!access || !access.hasAccess) {
              setHasAccess(false);
              setCheckingAccess(false);
              navigation.navigate('AIDieticianPaywall', { fromDietTab: true });
            } else {
              setHasAccess(true);
              setCheckingAccess(false);
              fetchNutritionData(selectedDate, false);
              reloadHealthKitData(selectedDate);
            }
          }
        } catch (err) {
          console.warn('[Dietplan] Failed to check subscription status:', err);
          if (isMounted) {
            setCheckingAccess(false);
          }
        }
      };

      if (now - lastDietCheckRef.current > 60000) {
        lastDietCheckRef.current = now;
        checkSubscriptionAccess();
      } else {
        setCheckingAccess(false);
        fetchNutritionData(selectedDate, false);
        reloadHealthKitData(selectedDate);
      }

      return () => {
        isMounted = false;
      };
    }, [navigation, selectedDate, fetchNutritionData])
  );

  useEffect(() => {
    if (!showMealModal) {
      fetchNutritionData(selectedDate, false);
    }
  }, [showMealModal, fetchNutritionData, selectedDate]);

  useEffect(() => {
    if (recommendation && recommendation.weeklyPlan) {
      const dayIndex = selectedDate.getDay();
      isProgrammaticScroll.current = true;
      weeklyPlanScrollViewRef.current?.scrollTo({
        x: dayIndex * weeklyPlanSnapInterval,
        animated: true,
      });
      const timer = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [selectedDate, recommendation, weeklyPlanSnapInterval]);

  const handleWeeklyPlanScroll = (event) => {
    if (isProgrammaticScroll.current) return;

    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / weeklyPlanSnapInterval);

    if (index >= 0 && index < PLAN_DAY_NAMES.length) {
      const targetDayName = PLAN_DAY_NAMES[index];
      const currentDayTime = selectedDate.getTime();
      let bestDay = null;
      let minDiff = Infinity;

      calendarDays.forEach((d) => {
        const weekdayName = d.fullDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (weekdayName.toLowerCase() === targetDayName.toLowerCase()) {
          const diff = Math.abs(d.fullDate.getTime() - currentDayTime);
          if (diff < minDiff) {
            minDiff = diff;
            bestDay = d;
          }
        }
      });

      if (bestDay && !bestDay.active) {
        const newDate = bestDay.fullDate;
        setSelectedDate(newDate);
        setSelectedPlanDay(targetDayName);
        setCalendarDays(buildCalendarDays(newDate));
        fetchNutritionData(newDate, true);
      }
    }
  };

  const handleGenerateWeeklyPlan = useCallback(async () => {
    setIsGeneratingPlan(true);
    try {
      const [
        savedPreference,
        savedSkipDays,
        savedMeals,
        savedAllergies,
        savedCuisines,
        savedOtherInfo
      ] = await Promise.all([
        AsyncStorage.getItem('diet_preference'),
        AsyncStorage.getItem('diet_skip_days'),
        AsyncStorage.getItem('diet_meals'),
        AsyncStorage.getItem('diet_allergies'),
        AsyncStorage.getItem('diet_cuisines'),
        AsyncStorage.getItem('diet_other_info')
      ]);

      Alert.alert('Success', 'Preferences saved successfully!');
    } finally {
      setIsGeneratingPlan(false);
    }
  }, []);


  const handleUpdateWeight = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      Alert.alert('Invalid Input', 'Please enter a valid weight number in kg.');
      return;
    }

    setIsUpdatingWeight(true);
    try {
      const response = await apiClient.post('/weight/update', { weight: parseFloat(newWeight) });
      if (response.data?.success) {
        Alert.alert('Success', 'Weight log recorded and goals updated.');
        setNewWeight('');
        fetchNutritionData();
      }
    } catch (error) {
      console.warn('[Dietplan] Weight update error:', error.message);
      Alert.alert('Error', 'Failed to update weight.');
    } finally {
      setIsUpdatingWeight(false);
    }
  };
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [mealStep, setMealStep] = useState(1);
  const [trackedMealImage, setTrackedMealImage] = useState(null);

  // --- AI LOG STATE ---
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('Lunch');
  const [mealDescription, setMealDescription] = useState('');
  const [nutritionData, setNutritionData] = useState({
    mealName: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });

  // --- CALENDAR STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDays, setCalendarDays] = useState(() => buildCalendarDays(new Date()));

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const handleTrackFood = useCallback(() => {
    navigation.navigate('DietAllLogs');
  }, [navigation]);

  const handleGoToPreferences = useCallback(() => {
    navigation.navigate('DietPreferences');
  }, [navigation]);

  const handleGoToReminders = useCallback(() => {
    navigation.navigate('Reminders');
  }, [navigation]);

  const handleTrackWithCamera = useCallback(() => {
    setShowCameraOverlay(true);
  }, []);

  const dailyLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = log.createdAt ? new Date(log.createdAt) : new Date(log.date);
      return logDate.toDateString() === selectedDate.toDateString();
    });
  }, [logs, selectedDate]);

  const combinedLogs = useMemo(() => {
    const items = [];

    // Add only actual meal logs from dailyLogs
    dailyLogs.forEach(log => {
      items.push({
        type: 'meal',
        mealType: log.mealType || 'Meal',
        mealName: log.mealName || 'Unnamed Meal',
        calories: log.calories || 0,
        protein: log.protein || 0,
        fats: log.fats || 0,
        carbs: log.carbs || 0,
        fibre: log.fibre || 0,
        time: log.createdAt ? new Date(log.createdAt) : new Date(log.date || Date.now()),
        photoUrl: log.photoUrl || log.photo?.uri || log.imageUrl || null,
        hasLog: true,
      });
    });

    // Sort meals chronologically by time first
    items.sort((a, b) => a.time - b.time);

    const formatTimeStr = (isoString) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Construct sleep log duration string
    let sleepDurationText = formatSleep(sleepHoursToday);
    let sleepTime = new Date(new Date().setHours(23, 59, 0, 0));

    if (sleepLogDetails && sleepLogDetails.bedTime && sleepLogDetails.wakeTime) {
      const bedStr = formatTimeStr(sleepLogDetails.bedTime);
      const wakeStr = formatTimeStr(sleepLogDetails.wakeTime);
      sleepDurationText = `${bedStr} - ${wakeStr} (${formatSleep(sleepHoursToday)})`;
      sleepTime = new Date(sleepLogDetails.wakeTime);
    }

    // Add a default/manual sleep entry to match layout at the absolute bottom
    items.push({
      type: 'sleep',
      title: 'Sleep',
      duration: sleepDurationText,
      target: '8 hr',
      time: sleepTime,
    });

    return items;
  }, [dailyLogs, sleepHoursToday, sleepLogDetails]);

  const handlePlusButtonPress = useCallback(() => {
    setShowMealSelectionModal(true);
  }, []);

  const handleSelectMeal = useCallback((mealType) => {
    setShowMealSelectionModal(false);
    setSelectedMealType(mealType);
    setSelectedImage(null);
    setMealQuantity(1);
    setMealStep(1);
    setMealDescription('');
    setShowMealModal(true);
  }, []);

  useEffect(() => {
    if (route?.params?.openTrackFood) {
      const mealType = route.params.mealType || 'Breakfast';
      // Clear route params so it doesn't trigger again
      navigation.setParams({ openTrackFood: undefined, mealType: undefined });
      handleSelectMeal(mealType);
    }
  }, [route?.params, handleSelectMeal, navigation]);

  const handleUploadPhoto = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      async (response) => {
        if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
          const imageAsset = response.assets[0];
          setSelectedImage(imageAsset.uri);
          setMealStep(1);
          setMealQuantity(1);
          setShowCameraOverlay(false);
          setShowMealModal(true);
          setAiLoading(true);

          try {
            console.log('[Dietplan] Uploading picked photo to Cloudinary...');
            const uploadedUrl = await uploadToCloudinary(imageAsset);
            setUploadedImageUrl(uploadedUrl);

            console.log('[Dietplan] Triggering AI analysis for:', uploadedUrl);
            const aiResponse = await dispatch(analyzeMealWithAI(uploadedUrl, ''));
            if (aiResponse.success && aiResponse.data) {
              const analysis = aiResponse.data.analysis || {};
              setNutritionData({
                mealName: analysis.cleanMealName || analysis.mealName || 'Unnamed Meal',
                calories: analysis.calories || 0,
                protein: analysis.protein || 0,
                carbs: analysis.carbs || 0,
                fats: analysis.fats || 0
              });
              setMealStep(2);
            } else {
              Alert.alert("AI Error", aiResponse.message || "Failed to analyze image.");
            }
          } catch (err) {
            console.error('[Dietplan] Image library upload/analysis error:', err);
            Alert.alert("Analysis Error", "Failed to upload or analyze the food image.");
          } finally {
            setAiLoading(false);
          }
        }
      }
    );
  }, [dispatch]);

  const handleCameraShot = useCallback(async () => {
    try {
      if (!photoOutput) {
        Alert.alert("Camera Error", "Camera output is not initialized.");
        return;
      }

      // Directly attempt to take the photo using Vision Camera V5 API. 
      const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});

      if (photo && photo.filePath) {
        // Android already prepends 'file://', iOS does not.
        const imagePath = photo.filePath.startsWith('file://') ? photo.filePath : 'file://' + photo.filePath;

        setSelectedImage(imagePath);
        setMealStep(1);
        setMealQuantity(1);
        setShowCameraOverlay(false);
        setShowMealModal(true);
        setAiLoading(true);

        try {
          const imageAsset = {
            uri: imagePath,
            type: 'image/jpeg',
            fileName: `photo_${Date.now()}.jpg`
          };
          console.log('[Dietplan] Uploading captured photo to Cloudinary...');
          const uploadedUrl = await uploadToCloudinary(imageAsset);
          setUploadedImageUrl(uploadedUrl);

          console.log('[Dietplan] Triggering AI analysis for:', uploadedUrl);
          const aiResponse = await dispatch(analyzeMealWithAI(uploadedUrl, ''));
          if (aiResponse.success && aiResponse.data) {
            const analysis = aiResponse.data.analysis || {};
            setNutritionData({
              mealName: analysis.cleanMealName || analysis.mealName || 'Unnamed Meal',
              calories: analysis.calories || 0,
              protein: analysis.protein || 0,
              carbs: analysis.carbs || 0,
              fats: analysis.fats || 0
            });
            setMealStep(2);
          } else {
            Alert.alert("AI Error", aiResponse.message || "Failed to analyze captured image.");
          }
        } catch (err) {
          console.error('[Dietplan] Camera shot upload/analysis error:', err);
          Alert.alert("Analysis Error", "Failed to upload or analyze the food image.");
        } finally {
          setAiLoading(false);
        }
      } else {
        throw new Error("Captured photo had no file path.");
      }
    } catch (error) {
      Alert.alert(
        "Camera Not Ready",
        "Please wait a moment for the camera to initialize before taking a photo."
      );
      console.error('Camera capture error:', error);
    }
  }, [photoOutput, dispatch]);

  // --- CALENDAR HANDLER ---
  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !date) {
        return;
      }
    }

    if (date) {
      setSelectedDate(date);
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }

      // Automatically switch the weekly diet plan tab to match the selected calendar day
      setSelectedPlanDay(PLAN_DAY_NAMES[date.getDay()]);
      setCalendarDays(buildCalendarDays(date));

      // Trigger daily summary fetch for the new selected date with loader enabled
      fetchNutritionData(date, true);
    }
  };

  const handleIOSDonePress = () => {
    setShowDatePicker(false);
  };

  const renderWeeklyDietPlan = () => {
    if (!recommendation || !recommendation.weeklyPlan) return null;

    const days = PLAN_DAY_NAMES;

    return (
      <View style={styles.weeklyPlanSection}>
        <LinearGradient
          colors={['#EE822A', '#8F5D98', '#2E4D9F']}
          style={styles.weeklyPlanCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ paddingVertical: 16, width: '100%' }}>
            <View style={[styles.planHeaderRow, { paddingHorizontal: 16, marginBottom: 16 }]}>
              <View style={styles.titleRow}>
                <Icon name="restaurant-outline" size={18} color="#e74c3c" />
                <Text style={styles.planTitle}>AI WEEKLY DIET PLAN</Text>
              </View>
              <Text style={styles.planSubtitle}>Customized nutritional program for your goal</Text>
            </View>

            <ScrollView
              ref={weeklyPlanScrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.weeklyPlanScrollWrapper}
              snapToInterval={weeklyPlanSnapInterval}
              decelerationRate="fast"
              bounces={true}
              onMomentumScrollEnd={handleWeeklyPlanScroll}
            >
              {days.map((day) => {
                const dayDataKey = Object.keys(recommendation.weeklyPlan).find(
                  key => key.toLowerCase() === day.toLowerCase()
                );
                const meals = dayDataKey ? recommendation.weeklyPlan[dayDataKey] : [];
                const userCalsTarget = dailySummary?.targets?.calories || getCachedBackendTargets()?.calories || getTargetsForUser(user).calories;
                const totalCals = meals && meals.length > 0 ? meals.reduce((sum, m) => sum + (m.calories || 0), 0) : userCalsTarget;

                return (
                  <View 
                    key={day} 
                    style={[
                      styles.dayPlanColumn, 
                      { width: weeklyPlanCardWidth, marginHorizontal: weeklyPlanCardSpacing / 2 }
                    ]}
                  >
                    <View style={styles.dayColumnHeader}>
                      <Text style={styles.dayColumnTitle}>{day.toUpperCase()}</Text>
                      <View style={styles.dayColumnBadge}>
                        <Text style={styles.dayColumnBadgeText}>{totalCals} kcal</Text>
                      </View>
                    </View>

                    <View style={styles.dayMealsList}>
                      {meals && meals.length > 0 ? (
                        meals.map((meal, index) => {
                          let iconName = 'restaurant-outline';
                          let iconColor = '#FF9500';
                          const typeLower = (meal.mealType || meal.type || '').toLowerCase();
                          if (typeLower.includes('breakfast')) {
                            iconName = 'cafe-outline';
                            iconColor = '#00E676';
                          } else if (typeLower.includes('snack')) {
                            iconName = 'nutrition-outline';
                            iconColor = '#7C4DFF';
                          } else if (typeLower.includes('lunch')) {
                            iconName = 'restaurant-outline';
                            iconColor = '#FF9500';
                          } else if (typeLower.includes('dinner')) {
                            iconName = 'sunny-outline';
                            iconColor = '#FF5252';
                          }

                          return (
                            <View key={index} style={styles.weeklyMealCard}>
                              <View style={[styles.weeklyMealIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
                                <Icon name={iconName} size={18} color={iconColor} />
                              </View>
                              <View style={styles.weeklyMealDetails}>
                                <View style={styles.weeklyMealTypeRow}>
                                  <Text style={[styles.weeklyMealTypeText, { color: iconColor }]}>
                                    {(meal.mealType || meal.type || 'Meal').toUpperCase()}
                                  </Text>
                                  <Text style={styles.weeklyMealCaloriesText}>
                                    {meal.calories || 0} kcal
                                  </Text>
                                </View>
                                <Text style={styles.weeklyMealDescriptionText} numberOfLines={2}>
                                  {meal.mealName || meal.name || meal.description || 'Nutritious meal'}
                                </Text>
                                <View style={styles.weeklyMacroBadgesRow}>
                                  <View style={[styles.weeklyMacroBadge, { marginRight: 6 }]}>
                                    <Text style={styles.weeklyMacroBadgeText}>P: {meal.protein || 0}g</Text>
                                  </View>
                                  <View style={[styles.weeklyMacroBadge, { marginRight: 6 }]}>
                                    <Text style={styles.weeklyMacroBadgeText}>C: {meal.carbs || 0}g</Text>
                                  </View>
                                  <View style={[styles.weeklyMacroBadge]}>
                                    <Text style={styles.weeklyMacroBadgeText}>F: {meal.fats || 0}g</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={[styles.planSubtitle, { textAlign: 'center', marginVertical: 20 }]}>
                          No meals recommended for this day.
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {checkingAccess ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Verifying subscription...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment...</Text>
        </View>
      ) : !hasAccess ? (
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconBg}>
            <Icon name="lock-closed" size={48} color="#e74c3c" />
          </View>
          <Text style={styles.lockedTitle}>7-Day Free Trial Expired</Text>
          <Text style={styles.lockedSubtitle}>
            Your free trial for AI Dietician has finished. Unlock premium access to continue tracking your meals, macros, personalized plans, and AI food scanner.
          </Text>
          <TouchableOpacity
            style={styles.unlockButton}
            onPress={() => navigation.navigate('AIDieticianPaywall', { fromDietTab: true })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EE822A', '#8F5D98', '#2E4D9F']}
              style={styles.unlockGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="sparkles" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.unlockButtonText}>Unlock AI Dietician Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : isNutritionLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading nutrition details...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>

          <DietHeader
            calendarDays={calendarDays}
            handleCalendarPress={handleCalendarPress}
            dailySummary={dailySummary}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setCalendarDays={setCalendarDays}
            PLAN_DAY_NAMES={PLAN_DAY_NAMES}
            setSelectedPlanDay={setSelectedPlanDay}
            fetchNutritionData={fetchNutritionData}
            buildCalendarDays={buildCalendarDays}
            handleTrackFood={handleTrackFood}
            handleGoToReminders={handleGoToReminders}
            navigation={navigation}
            recommendation={recommendation}
            stepsToday={stepsToday}
            sleepHoursToday={sleepHoursToday}
            workoutCaloriesToday={workoutCaloriesToday}
          />
          <DietMacros
            dailySummary={dailySummary}
            selectedDate={selectedDate}
            handleTrackWithCamera={handleTrackWithCamera}
            handlePlusButtonPress={handlePlusButtonPress}
            navigation={navigation}
          />

          <DietWaterWidget dailySummary={dailySummary} selectedDate={selectedDate} />

          {/* ── AI Recommendation Banner ── */}
          {(() => {
            if (!recommendation || !recommendation.weeklyPlan) return null;
            const dayOfWeekName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
            const weeklyPlan = recommendation.weeklyPlan || {};
            const dayDataKey = Object.keys(weeklyPlan).find(
              key => key.toLowerCase() === dayOfWeekName.toLowerCase()
            );
            const todayMeals = dayDataKey ? weeklyPlan[dayDataKey] : [];
            if (!todayMeals || todayMeals.length === 0) return null;

            // Pick next upcoming meal by rough hour
            const hour = new Date().getHours();
            const MEAL_HOURS = { breakfast: 7, lunch: 12, snack: 16, dinner: 19 };
            let nextMeal = todayMeals[0];
            for (const m of todayMeals) {
              const type = (m.mealType || m.type || 'lunch').toLowerCase();
              const mealHour = MEAL_HOURS[type] || 12;
              if (mealHour >= hour) { nextMeal = m; break; }
            }

            const mealName = nextMeal.meal || nextMeal.mealName || nextMeal.name || nextMeal.description || 'Nutritious meal';
            const mealType = (nextMeal.mealType || nextMeal.type || 'Meal');
            const calories = nextMeal.calories || 0;
            const protein = nextMeal.protein || 0;
            const isFallback = recommendation.isFallback;

            return (
              <TouchableOpacity
                style={styles.aiRecoCard}
                onPress={() => navigation.navigate('WeeklyDietPlan', { recommendation })}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#0D2B26', '#0B1C18']}
                  style={styles.aiRecoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Header */}
                  <View style={styles.aiRecoHeader}>
                    <View style={styles.aiRecoBadge}>
                      <MaterialCommunityIcons
                        name={isFallback ? 'file-document-outline' : 'brain'}
                        size={12}
                        color="#A3D9C9"
                      />
                      <Text style={styles.aiRecoBadgeText}>
                        {isFallback ? "Today's Plan" : 'AI Recommendation'}
                      </Text>
                    </View>
                    <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                  </View>

                  {/* Next Meal label */}
                  <Text style={styles.aiRecoNextLabel}>
                    NEXT · {mealType.toUpperCase()}
                  </Text>
                  <Text style={styles.aiRecoMealName} numberOfLines={2}>{mealName}</Text>

                  {/* Stats row */}
                  <View style={styles.aiRecoStatsRow}>
                    <View style={styles.aiRecoStat}>
                      <Icon name="flame-outline" size={13} color="#FF8C69" />
                      <Text style={styles.aiRecoStatText}>{calories} kcal</Text>
                    </View>
                    <View style={styles.aiRecoStatDot} />
                    <View style={styles.aiRecoStat}>
                      <MaterialCommunityIcons name="arm-flex-outline" size={13} color="#6BCB77" />
                      <Text style={styles.aiRecoStatText}>{protein}g protein</Text>
                    </View>
                  </View>

                  {/* View Full Plan link */}
                  <View style={styles.aiRecoFooter}>
                    <Text style={styles.aiRecoFooterText}>Tap to view full 7-day plan</Text>
                    <Icon name="arrow-forward-circle-outline" size={16} color="rgba(163, 217, 201, 0.6)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })()}

          {/* Tracker rows matching Screenshot 1 */}
          <View style={styles.trackerRowsContainer}>
            {/* Weight card */}
            <TouchableOpacity
              style={styles.trackerRowCard}
              onPress={() => navigation.navigate('WeightTracker')}
              activeOpacity={0.8}
            >
              <View style={styles.rowIconContainerBlue}>
                <MaterialCommunityIcons name="scale-bathroom" size={22} color="#FFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Weight</Text>
                <Text style={styles.rowSubtitle}>
                  {dailySummary?.summary?.weight ? `${dailySummary.summary.weight} kg` : user?.weight ? `${user.weight} kg` : 'Track weight'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('WeightTracker')} style={styles.rowActionBtn}>
                <Icon name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Walk card */}
            <TouchableOpacity
              style={styles.trackerRowCard}
              onPress={() => navigation.navigate('WalkDetails', { stepsToday })}
              activeOpacity={0.8}
            >
              <View style={styles.rowIconContainerBlue}>
                <Icon name="walk" size={22} color="#FFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Walk</Text>
                <Text style={styles.rowSubtitle}>
                  {`${stepsToday.toLocaleString()} of 10,000 steps`}
                </Text>
              </View>
              <TouchableOpacity onPress={reloadHealthKitData} style={styles.rowActionBtn}>
                <Icon name="refresh-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Sleep card */}
            <TouchableOpacity
              style={styles.trackerRowCard}
              onPress={() => navigation.navigate('SleepDetails', { 
                sleepHoursToday, 
                selectedDate: selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate 
              })}
              activeOpacity={0.8}
            >
              <View style={styles.rowIconContainerBlue}>
                <Icon name="moon" size={20} color="#FFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Sleep</Text>
                <Text style={styles.rowSubtitle}>
                  {`${formatSleep(sleepHoursToday)} of 8hr`}
                </Text>
              </View>
              <TouchableOpacity onPress={reloadHealthKitData} style={styles.rowActionBtn}>
                <Icon name="refresh-outline" size={20} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Hydrate card */}
            <TouchableOpacity
              style={styles.trackerRowCard}
              onPress={() => navigation.navigate('HydrationTracker')}
              activeOpacity={0.8}
            >
              <View style={styles.rowIconContainerBlue}>
                <MaterialCommunityIcons name="cup-water" size={22} color="#FFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Hydrate</Text>
                <Text style={styles.rowSubtitle}>
                  {`${hydrateGlasses} of 10 glasses`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('HydrationTracker')} style={styles.rowActionBtn}>
                <Icon name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Nutrition Tracker card */}
            <TouchableOpacity
              style={styles.trackerRowCard}
              onPress={() => navigation.navigate('MacronutrientDetails', { dailySummary })}
              activeOpacity={0.8}
            >
              <View style={styles.rowIconContainerBlue}>
                <MaterialCommunityIcons name="nutrition" size={22} color="#FFF" />
              </View>
              <View style={styles.rowTextContainer}>
                <Text style={styles.rowTitle}>Nutrition</Text>
                <Text style={styles.rowSubtitle}>
                  {`${dailySummary?.summary?.calories || 0} of ${dailySummary?.targets?.calories || 2000} kcal`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('MacronutrientDetails', { dailySummary })} style={styles.rowActionBtn}>
                <Icon name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Up arrow indicator */}
          <View style={styles.bottomArrowContainer}>
            <Icon name="chevron-up" size={24} color="rgba(255, 255, 255, 0.4)" />
          </View>

          {/* Today's Logs timeline widget */}
          <View style={styles.todayLogsContainer}>
            <Text style={styles.todayLogsHeaderTitle}>Today's Logs</Text>

            {combinedLogs.length > 0 ? (
              combinedLogs.map((item, idx) => {
                const formattedTime = item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <View key={`log-${idx}`} style={styles.logRow}>
                    {/* Left Column: Time */}
                    <View style={styles.timeColumn}>
                      <Text style={styles.timeText}>{formattedTime}</Text>
                    </View>

                    {/* Right Column: Card */}
                    <View style={styles.cardColumn}>
                      {item.type === 'meal' ? (
                        item.hasLog ? (
                          <View style={styles.mealCard}>
                            {/* Sparkles AI Icon in Top Right */}
                            <Icon name="sparkles" size={16} color="#FFF" style={styles.sparklesIcon} />

                            {/* Avatar & Title */}
                            <View style={styles.cardHeaderRow}>
                              {item.photoUrl ? (
                                <Image source={{ uri: item.photoUrl }} style={styles.creamAvatar} />
                              ) : (
                                <View style={styles.creamAvatar} />
                              )}
                              <Text style={styles.mealTypeTitle}>{item.mealType}</Text>
                            </View>

                            {/* Calories */}
                            <Text style={styles.caloriesRow}>
                              <Text style={styles.caloriesBold}>{item.calories}</Text>
                              <Text style={styles.caloriesTarget}> Cal Eaten</Text>
                            </Text>

                            {/* Meal description */}
                            <Text style={styles.mealDescriptionText}>{item.mealName}</Text>

                            {/* Macros Circles */}
                            <View style={styles.macrosCirclesRow}>
                              {/* Protein */}
                              <View style={styles.macroCircleCol}>
                                <View style={styles.macroCircle}>
                                  <Text style={styles.macroCircleVal}>{Math.round(item.protein)}</Text>
                                </View>
                                <Text style={styles.macroCircleLabel}>PROTEIN</Text>
                                <Text style={styles.macroCircleGram}>{item.protein.toFixed(1)} g</Text>
                              </View>

                              {/* Fats */}
                              <View style={styles.macroCircleCol}>
                                <View style={styles.macroCircle}>
                                  <Text style={styles.macroCircleVal}>{Math.round(item.fats)}</Text>
                                </View>
                                <Text style={styles.macroCircleLabel}>FATS</Text>
                                <Text style={styles.macroCircleGram}>{item.fats.toFixed(1)} g</Text>
                              </View>

                              {/* Carbs */}
                              <View style={styles.macroCircleCol}>
                                <View style={styles.macroCircle}>
                                  <Text style={styles.macroCircleVal}>{Math.round(item.carbs)}</Text>
                                </View>
                                <Text style={styles.macroCircleLabel}>CARBS</Text>
                                <Text style={styles.macroCircleGram}>{item.carbs.toFixed(1)} g</Text>
                              </View>

                              {/* Fibre */}
                              <View style={styles.macroCircleCol}>
                                <View style={styles.macroCircle}>
                                  <Text style={styles.macroCircleVal}>{Math.round(item.fibre)}</Text>
                                </View>
                                <Text style={styles.macroCircleLabel}>FIBRE</Text>
                                <Text style={styles.macroCircleGram}>{item.fibre.toFixed(1)} g</Text>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.emptyMealCard}
                            onPress={() => handleSelectMeal(item.mealType)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.cardHeaderRow}>
                              <View style={styles.creamAvatarEmpty} />
                              <Text style={styles.mealTypeTitle}>{item.mealType}</Text>
                            </View>
                            <Text style={styles.emptyMealDescriptionText}>Not tracked yet</Text>
                            <View style={styles.plusIconContainerEmpty}>
                              <Icon name="add" size={16} color="#FFF" />
                            </View>
                          </TouchableOpacity>
                        )
                      ) : (
                        // Sleep Card
                        <TouchableOpacity
                          style={styles.sleepCard}
                          onPress={() => navigation.navigate('SleepDetails', { 
                            sleepHoursToday, 
                            selectedDate: selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate 
                          })}
                          activeOpacity={0.8}
                        >
                          {/* Sparkles AI Icon in Top Right */}
                          <Icon name="sparkles" size={16} color="#50FA7B" style={styles.sparklesIcon} />

                          {/* Moon Icon & Title */}
                          <View style={styles.cardHeaderRow}>
                            <View style={styles.moonContainer}>
                              <Icon name="moon" size={14} color="#FFF" />
                            </View>
                            <Text style={styles.sleepTitle}>Sleep</Text>
                          </View>

                          {/* Sleep Duration */}
                          <Text style={styles.caloriesRow}>
                            <Text style={styles.caloriesBold}>{item.duration}</Text>
                            <Text style={styles.caloriesTarget}> / {item.target}</Text>
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.centerState}>
                <Text style={styles.stateText}>No logs found for today.</Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}

      {/* The ref is passed down here */}
      <DietCameraModal
        ref={cameraRef}
        showCameraOverlay={showCameraOverlay}
        setShowCameraOverlay={setShowCameraOverlay}
        cameraDevice={cameraDevice}
        handleCameraShot={handleCameraShot}
        handleUploadPhoto={handleUploadPhoto}
        hasPermission={hasPermission}
        requestPermission={requestPermission}
        photoOutput={photoOutput}
      />

      <DietDatePickerModal
        showDatePicker={showDatePicker}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        handleIOSDonePress={handleIOSDonePress}
      />

      <DietMealModal
        showMealModal={showMealModal}
        setShowMealModal={setShowMealModal}
        mealStep={mealStep}
        setMealStep={setMealStep}
        selectedImage={selectedImage}
        mealQuantity={mealQuantity}
        setMealQuantity={setMealQuantity}
        nutritionData={nutritionData}
        setNutritionData={setNutritionData}
        aiLoading={aiLoading}
        setAiLoading={setAiLoading}
        uploadedImageUrl={uploadedImageUrl}
        setUploadedImageUrl={setUploadedImageUrl}
        selectedMealType={selectedMealType}
        setSelectedMealType={setSelectedMealType}
        mealDescription={mealDescription}
        setMealDescription={setMealDescription}
        setTrackedMealImage={setTrackedMealImage}
        selectedDate={selectedDate}
        setSelectedImage={setSelectedImage}
      />

      <DietMealSelectionModal
        visible={showMealSelectionModal}
        onClose={() => setShowMealSelectionModal(false)}
        dailySummary={dailySummary}
        logs={dailyLogs}
        onSelectMeal={handleSelectMeal}
      />

      {/* AI Dietician Chat FAB */}
      <TouchableOpacity 
        style={styles.aiChatFab} 
        onPress={() => navigation.navigate('DieticianAIConversationList')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#EE822A', '#8F5D98', '#2E4D9F']}
          style={styles.aiChatFabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="chatbubbles" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  aiRecoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.15)',
    shadowColor: '#1E8B72',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  aiRecoGradient: {
    padding: 18,
  },
  aiRecoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  aiRecoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(163, 217, 201, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.2)',
  },
  aiRecoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A3D9C9',
    letterSpacing: 0.3,
  },
  aiRecoNextLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  aiRecoMealName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 23,
    marginBottom: 12,
  },
  aiRecoStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  aiRecoStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiRecoStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  aiRecoStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  aiRecoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 12,
  },
  aiRecoFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
    flex: 1,
  },
  scrollContentFixed: {
    paddingBottom: 150,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: -16,
    zIndex: 10,
  },
  navToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  navIcon: {
    marginHorizontal: 4,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: -16,
    zIndex: 10,
    marginBottom: 20,
  },
  navToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  activeTabText: {
    color: '#FFF',
  },
  tabSeparator: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  recommendationContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recHeaderTitle: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  recMealText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 18,
  },
  recBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recBadgeText: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '600',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  kpiSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  analyticsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardSectionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    color: '#e74c3c',
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dividerLine: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRow: {
    marginBottom: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#DDD',
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartWrapper: {
    marginTop: 4,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartChangeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 110,
    paddingRight: 10,
  },
  chartArea: {
    flex: 1,
  },
  axisLabelText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
  emptyChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  inputInstructions: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  weeklyPlanSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  weeklyPlanCard: {
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  planHeaderRow: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  planSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  dayTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  dayTabsWrapper: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  dayTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeDayTab: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  dayTabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeDayTabText: {
    color: '#FFF',
  },
  mealsList: {
    marginTop: 4,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  mealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mealCaloriesText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mealDescriptionText: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  macroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  macroBadgeText: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: '600',
  },
  generatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  generatingText: {
    color: '#e74c3c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  weeklyPlanScrollWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  dayPlanColumn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    marginHorizontal: 6,
    alignSelf: 'flex-start',
  },
  dayColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  dayColumnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  dayColumnBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayColumnBadgeText: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 'bold',
  },
  weeklyMealCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  weeklyMealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weeklyMealDetails: {
    flex: 1,
  },
  weeklyMealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyMealTypeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  weeklyMealCaloriesText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  weeklyMealDescriptionText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 18,
  },
  weeklyMacroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyMacroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weeklyMacroBadgeText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: 'bold',
  },
  trackerRowsContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  trackerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0c0f',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    height: 72,
  },
  rowIconContainerGray: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAEAEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconContainerBlue: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  rowTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    marginTop: 2,
  },
  rowActionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  todayLogsContainer: {
    paddingHorizontal: 20,
    marginTop: 25,
    paddingBottom: 40,
  },
  todayLogsHeaderTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timeColumn: {
    width: 75,
    paddingTop: 16,
  },
  timeText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  cardColumn: {
    flex: 1,
  },
  mealCard: {
    backgroundColor: '#0c0c0f',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    position: 'relative',
  },
  sleepCard: {
    backgroundColor: '#0c0c0f',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    position: 'relative',
  },
  sparklesIcon: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF6EE',
  },
  moonContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeTitle: {
    color: '#EE822A',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  sleepTitle: {
    color: '#FF9500',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  caloriesBold: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  caloriesTarget: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '500',
  },
  mealDescriptionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  macrosCirclesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroCircleCol: {
    alignItems: 'center',
    width: '23%',
  },
  macroCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroCircleVal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  macroCircleLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  macroCircleGram: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyMealCard: {
    backgroundColor: '#050505',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
    padding: 20,
    position: 'relative',
  },
  creamAvatarEmpty: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyMealDescriptionText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 4,
  },
  plusIconContainerEmpty: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#050505',
  },
  lockedIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1A1A1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedSubtitle: {
    color: '#A0A0A0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  aiChatFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 115 : 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#8F5D98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  aiChatFabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  unlockGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  unlockButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Dietplan;
