import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { saveDietEntry } from '../../../redux/actions/dietActions';
import dietAiApi from '../../../api/dietAiApi';
import { useAuth } from '../../../context/AuthContext';
import { getTargetsForUser } from '../../../utils/nutritionCalculator';

const { width } = Dimensions.get('window');

const PLAN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to get dates of the current week starting from Monday
const getWeekDates = (baseDate) => {
  const current = new Date(baseDate);
  const day = current.getDay();
  // Adjust to get Monday as index 0 (0 = Sunday, 1 = Monday, ...)
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const week = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

const getMonthDates = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();

  const dates = [];
  for (let i = 1; i <= numDays; i++) {
    dates.push(new Date(year, month, i));
  }
  return dates;
};

const getDayLabel = (date) => {
  const shortNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return shortNames[date.getDay()];
};

// Health tips list for "Did you know?"
const HEALTH_TIPS = [
  "For authentic South Indian flavor, temper the upma with mustard and curry leaves while keeping oil minimal.",
  "Drinking a glass of water 30 minutes before a meal can aid digestion and help control portion sizes.",
  "Adding lean protein to your breakfast keeps you full longer and helps maintain muscle mass.",
  "Include a variety of colors in your salad to ensure a diverse range of vitamins and minerals.",
  "Prepare your meals in advance to avoid impulsive food choices during busy weekdays.",
  "Snacking on unsalted nuts provides healthy fats and protein, keeping energy levels stable.",
  "Steaming vegetables preserves more water-soluble vitamins compared to boiling them."
];



// Meal time presets
const MEAL_TIMES = {
  breakfast: '9:30 AM',
  lunch: '1:30 PM',
  dinner: '8:30 PM',
  snack: '5:00 PM',
  default: '12:00 PM'
};

const getInitialSelectedDate = (rec) => {
  const weeklyPlan = rec?.weeklyPlan || {};
  if (Object.keys(weeklyPlan).length === 0) return new Date();

  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todayMealsKey = Object.keys(weeklyPlan).find(
    key => key.toLowerCase() === todayName.toLowerCase()
  );
  if (todayMealsKey && weeklyPlan[todayMealsKey] && weeklyPlan[todayMealsKey].length > 0) {
    return today;
  }

  for (let i = 1; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const foundKey = Object.keys(weeklyPlan).find(
      key => key.toLowerCase() === dayName.toLowerCase()
    );
    if (foundKey && weeklyPlan[foundKey] && weeklyPlan[foundKey].length > 0) {
      return d;
    }
  }
  return today;
};

const WeeklyDietPlanScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { recommendation } = route.params || {};
  const dispatch = useDispatch();

  const [selectedDate, setSelectedDate] = useState(() => getInitialSelectedDate(recommendation));
  const [currentRecommendation, setCurrentRecommendation] = useState(recommendation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Updating diet plan...');
  const [likedMeals, setLikedMeals] = useState({});

  useEffect(() => {
    let interval;
    if (isLoading) {
      const msgs = [
        'Updating diet plan...',
        'Analyzing nutrition needs...',
        'Curating meals...',
        'Optimizing macros...',
        'Finalizing your plan...'
      ];
      let i = 0;
      setLoadingText(msgs[0]);
      interval = setInterval(() => {
        i = (i + 1) % msgs.length;
        setLoadingText(msgs[i]);
      }, 3500);
    } else {
      setLoadingText('Updating diet plan...');
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const calendarScrollViewRef = useRef(null);

  useEffect(() => {
    const monthDates = getMonthDates(selectedDate);
    const activeIdx = monthDates.findIndex(d => d.toDateString() === selectedDate.toDateString());
    if (activeIdx !== -1) {
      const itemWidth = 56;
      const timer = setTimeout(() => {
        calendarScrollViewRef.current?.scrollTo({
          x: activeIdx * itemWidth - width / 2 + itemWidth / 2,
          animated: true,
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);

  const fetchRecommendation = async (generate = false) => {
    setIsLoading(true);
    try {
      const params = { generate: generate ? 'true' : 'false' };
      const response = await dietAiApi.fetchWeeklyPlan(params);
      
      const planData = response?.weeklyPlan ? response : (response?.data?.weeklyPlan ? response.data : null);
      
      if (planData) {
        setCurrentRecommendation(planData);
      } else {
        console.warn('Invalid weekly plan data returned from AI', response);
      }
    } catch (err) {
      console.warn('Failed to fetch recommendation from proxy API', err);
      if (err.status === 400 || (err.response && err.response.status === 400)) {
        Alert.alert(
          'Profile Incomplete',
          'Please complete your physical and dietary profile in settings to generate a meal plan.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => navigation.navigate('WeightBodyMetrics') }
          ]
        );
      } else if (err.status === 429 || (err.response && err.response.status === 429)) {
        Alert.alert('In Progress', 'The AI is currently generating your meal plan. Please wait a moment.');
      } else {
        Alert.alert('Error', 'Failed to generate diet plan. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAndFetch = async () => {
      const needsRefresh = await AsyncStorage.getItem('diet_plan_needs_refresh');
      if (needsRefresh === 'true') {
        await AsyncStorage.removeItem('diet_plan_needs_refresh');
        fetchRecommendation(true);
      } else if (!currentRecommendation) {
        fetchRecommendation(false);
      }
    };
    checkAndFetch();
  }, []);

  const handleTrackMeal = async (meal) => {
    try {
      const payload = {
        mealName: meal.meal || meal.name || meal.description || 'Custom Meal',
        mealType: (meal.mealType || meal.type || 'breakfast').toLowerCase(),
        calories: parseInt(meal.calories) || 0,
        protein: parseInt(meal.protein) || 0,
        carbs: parseInt(meal.carbs) || 0,
        fats: parseInt(meal.fats || meal.fat) || 0,
        fiber: parseInt(meal.fibre || meal.fiber) || 0,
        notes: 'Tracked from AI Diet Plan',
      };

      const res = await dispatch(saveDietEntry(payload));
      if (res && res.success) {
        Alert.alert('Success', 'Meal tracked successfully!');
      } else {
        Alert.alert('Error', 'Failed to track meal.');
      }
    } catch (err) {
      console.warn('Track meal failed:', err);
      Alert.alert('Error', 'An error occurred while tracking the meal.');
    }
  };

  const handleViewDetails = (meal) => {
    Alert.alert(
      `${meal.mealType || meal.type || 'Meal'} Details`,
      `Meal: ${meal.meal || meal.name || meal.description || 'Custom Meal'}\n\n` +
      `Calories: ${meal.calories || 0} kcal\n` +
      `Protein: ${meal.protein || 0}g\n` +
      `Fat: ${meal.fats || meal.fat || 0}g\n` +
      `Carb: ${meal.carbs || 0}g\n` +
      `Fibre: ${meal.fibre || meal.fiber || 0}g`
    );
  };

  const toggleLikeMeal = (mealKey) => {
    setLikedMeals(prev => {
      const isLiked = !prev[mealKey];
      if (isLiked) {
        Alert.alert('Saved', 'Meal saved to favorites!');
      }
      return { ...prev, [mealKey]: isLiked };
    });
  };

  // Get active day meals based on selectedDate
  const dayOfWeekName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const dayNum = String(selectedDate.getDate()).padStart(2, '0');
  const selectedDateStr = `${year}-${month}-${dayNum}`;

  // Calculate day difference from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMidnight = new Date(selectedDate);
  selectedMidnight.setHours(0, 0, 0, 0);

  const diffDays = Math.round((selectedMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const weeklyPlan = currentRecommendation?.weeklyPlan || {};
  const hasGeneratedPlan = Object.keys(weeklyPlan).length > 0;

  // Retrieve meals strictly within the 7-day window starting today (0 to 6)
  let meals = [];
  if (diffDays >= 0 && diffDays < 7) {
    if (weeklyPlan[selectedDateStr] && Array.isArray(weeklyPlan[selectedDateStr])) {
      meals = weeklyPlan[selectedDateStr];
    } else {
      const dayDataKey = Object.keys(weeklyPlan).find(
        key => key.toLowerCase() === dayOfWeekName.toLowerCase()
      );
      meals = dayDataKey ? weeklyPlan[dayDataKey] : [];
    }
  }

  const userTargets = useMemo(() => getTargetsForUser(user), [user]);
  const totalCalsForDay = meals && meals.length > 0 ? meals.reduce((sum, m) => sum + (m.calories || 0), 0) : userTargets.calories;

  // Curated tip for the day
  const activeDayIndex = selectedDate.getDay();
  const dayTip = HEALTH_TIPS[activeDayIndex % HEALTH_TIPS.length];

  const renderCalendar = () => {
    const monthDates = getMonthDates(selectedDate);

    return (
      <View style={styles.calendarContainer}>
        <ScrollView
          ref={calendarScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScrollContent}
        >
          {monthDates.map((date, idx) => {
            const isActive = date.toDateString() === selectedDate.toDateString();
            const dayNum = date.getDate();
            const dayLabel = getDayLabel(date);

            return (
              <TouchableOpacity
                key={idx}
                style={styles.calendarDayCol}
                onPress={() => setSelectedDate(date)}
                activeOpacity={0.8}
              >
                <Text style={styles.calendarDayLabel}>{dayLabel}</Text>
                <View style={[
                  styles.calendarDateCircle,
                  isActive ? styles.calendarDateCircleActive : styles.calendarDateCircleInactive
                ]}>
                  <Text style={[
                    styles.calendarDateText,
                    isActive ? styles.calendarDateTextActive : styles.calendarDateTextInactive
                  ]}>
                    {dayNum}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Top Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.headerBtn, { marginRight: 15 }]} onPress={() => navigation.navigate('Reminders')} activeOpacity={0.7}>
            <Icon name="notifications-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('DietPreferences')} activeOpacity={0.7}>
            <Icon name="options-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month/Week Navigation */}
      <View style={styles.weekNavRow}>
        <TouchableOpacity onPress={handlePrevWeek} style={styles.weekNavBtn} activeOpacity={0.7}>
          <Icon name="chevron-back" size={16} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.weekNavTitle}>{`${selectedDate.toLocaleDateString('en-US', { month: 'long' })} ${selectedDate.getFullYear()}`}</Text>
        <TouchableOpacity onPress={handleNextWeek} style={styles.weekNavBtn} activeOpacity={0.7}>
          <Icon name="chevron-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Calendar */}
      {renderCalendar()}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#A3D9C9" />
          <Text style={styles.loadingText}>{loadingText}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Today's Plan Title & Sync Row */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>
              {selectedDate.toDateString() === new Date().toDateString() ? "Today's Plan" : `${dayOfWeekName}'s Plan`}
            </Text>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => fetchRecommendation(true)}
              activeOpacity={0.7}
            >
              <Icon name="sync-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* AI Badge + Quality Pill row */}
          <View style={styles.badgeRow}>
            {/* AI vs Fallback indicator */}
            {currentRecommendation && (
              <View style={[
                styles.aiBadge,
                currentRecommendation.isFallback
                  ? styles.aiBadgeFallback
                  : styles.aiBadgeAI
              ]}>
                <MaterialCommunityIcons
                  name={currentRecommendation.isFallback ? 'file-document-outline' : 'brain'}
                  size={13}
                  color={currentRecommendation.isFallback ? 'rgba(255,255,255,0.5)' : '#A3D9C9'}
                />
                <Text style={[
                  styles.aiBadgeText,
                  currentRecommendation.isFallback && { color: 'rgba(255,255,255,0.5)' }
                ]}>
                  {currentRecommendation.isFallback ? 'Template Plan' : 'AI Generated'}
                </Text>
              </View>
            )}

            {/* Plan Quality Pill */}
            {currentRecommendation?.validation?.status && (() => {
              const status = currentRecommendation.validation.status;
              const isBalanced = status === 'balanced';
              return (
                <View style={[
                  styles.qualityPill,
                  isBalanced ? styles.qualityPillGood : styles.qualityPillWarn
                ]}>
                  <Icon
                    name={isBalanced ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                    size={12}
                    color={isBalanced ? '#6BCB77' : '#FFD93D'}
                  />
                  <Text style={[styles.qualityPillText, { color: isBalanced ? '#6BCB77' : '#FFD93D' }]}>
                    {isBalanced ? 'Balanced' : 'Needs Review'}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Calories row */}
          <View style={styles.caloriesRow}>
            <Icon name="flame-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.caloriesText}>{totalCalsForDay} Cal for {dayOfWeekName}</Text>
          </View>

          {/* Macro progress bars */}
          {meals && meals.length > 0 && (() => {
            const totalProt = meals.reduce((s, m) => s + (m.protein || 0), 0);
            const totalCarbs = meals.reduce((s, m) => s + (m.carbs || 0), 0);
            const totalFats = meals.reduce((s, m) => s + (m.fats || m.fat || 0), 0);
            const totalMacro = totalProt + totalCarbs + totalFats || 1;
            return (
              <View style={styles.macroBarSection}>
                {[
                  { label: 'Protein', val: totalProt, color: '#6BCB77' },
                  { label: 'Carbs', val: totalCarbs, color: '#4D96FF' },
                  { label: 'Fat', val: totalFats, color: '#FF6B6B' },
                ].map(({ label, val, color }) => (
                  <View key={label} style={styles.macroBarRow}>
                    <Text style={styles.macroBarLabel}>{label}</Text>
                    <View style={styles.macroBarTrack}>
                      <View
                        style={[
                          styles.macroBarFill,
                          { width: `${Math.round((val / totalMacro) * 100)}%`, backgroundColor: color }
                        ]}
                      />
                    </View>
                    <Text style={[styles.macroBarValue, { color }]}>{val}g</Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Meals list */}
          {meals && meals.length > 0 ? (
            meals.map((meal, index) => {
              const mealTypeKey = (meal.mealType || meal.type || 'breakfast').toLowerCase();
              const mealTime = MEAL_TIMES[mealTypeKey] || MEAL_TIMES.default;
              const mealKey = `${dayOfWeekName}-${index}`;
              const isLiked = !!likedMeals[mealKey];

              // Resolve overlapping images from backend component images or main meal image
              let images = [];
              if (meal.components && Array.isArray(meal.components) && meal.components.length > 0) {
                images = meal.components.map(comp => comp.image).filter(Boolean);
              } else if (meal.imageUrl) {
                images = [meal.imageUrl];
              }

              // Pad with placeholder indicator if fewer than 3 images are available
              while (images.length < 3) {
                images.push('placeholder');
              }

              return (
                <View key={index} style={styles.mealCard}>
                  {/* Card Header */}
                  <View style={styles.mealHeaderRow}>
                    <Text style={styles.mealTitle}>
                      {meal.mealType || meal.type || 'Meal'}
                    </Text>
                    <Text style={styles.mealTime}>{mealTime}</Text>
                  </View>

                  {/* Overlapping Images / Vector Icon Fallbacks */}
                  <View style={styles.imagesContainer}>
                    {images.map((img, idx) => {
                      const imgStyle = idx === 0 ? styles.foodImage1 : idx === 1 ? styles.foodImage2 : styles.foodImage3;
                      const isUrl = img && typeof img === 'string' && img.startsWith('http') && !img.includes('placeholder');

                      if (isUrl) {
                        return <Image key={idx} source={{ uri: img }} style={imgStyle} />;
                      }

                      // Render beautiful vector icon matching meal slot
                      const iconName = mealTypeKey.includes('breakfast')
                        ? 'cafe-outline'
                        : mealTypeKey.includes('lunch')
                          ? 'restaurant-outline'
                          : mealTypeKey.includes('snack')
                            ? 'nutrition-outline'
                            : 'sunny-outline';
                      return (
                        <View
                          key={idx}
                          style={[
                            imgStyle,
                            {
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: '#1E1E20',
                              borderColor: 'rgba(255,255,255,0.08)',
                              borderWidth: 1
                            }
                          ]}
                        >
                          <Icon name={iconName} size={28} color="#A3D9C9" />
                        </View>
                      );
                    })}
                  </View>

                  {/* Food Items with Weights */}
                  <View style={styles.foodList}>
                    {meal.components && Array.isArray(meal.components) && meal.components.length > 0 ? (
                      meal.components.map((comp, idx) => (
                        <View key={idx} style={styles.foodItemRow}>
                          <Text style={styles.foodItemName} numberOfLines={1}>{comp.name}</Text>
                          <Text style={styles.foodItemWeight}>{comp.portion}</Text>
                        </View>
                      ))
                    ) : (
                      // Fallback: split by plus (+) sign only (never by commas, to prevent breaking technical USDA names)
                      (meal.meal || meal.name || meal.description || '').split('+').map(item => item.trim()).filter(Boolean).map((item, idx) => {
                        const match = item.match(/^(\d+(?:\.\d+)?\s*(?:g|ml|slices?|scoops?|medium|large|small)?)\b\s*(.+)$/i);
                        const name = match ? match[2].trim() : item;
                        const weight = match ? match[1].trim() : '100g';
                        return (
                          <View key={idx} style={styles.foodItemRow}>
                            <Text style={styles.foodItemName} numberOfLines={1}>{name}</Text>
                            <Text style={styles.foodItemWeight}>{weight}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Nutrition row */}
                  <View style={styles.nutritionRow}>
                    <View style={styles.nutritionCol}>
                      <Text style={styles.nutritionValue}>{meal.calories || 0}</Text>
                      <Text style={styles.nutritionLabel}>Cal</Text>
                    </View>
                    <View style={styles.nutritionCol}>
                      <Text style={styles.nutritionValue}>{meal.protein || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutritionCol}>
                      <Text style={styles.nutritionValue}>{meal.fats || meal.fat || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                    <View style={styles.nutritionCol}>
                      <Text style={styles.nutritionValue}>{meal.carbs || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Carb</Text>
                    </View>
                    <View style={styles.nutritionCol}>
                      <Text style={styles.nutritionValue}>{meal.fibre || meal.fiber || 0}g</Text>
                      <Text style={styles.nutritionLabel}>Fibre</Text>
                    </View>
                  </View>

                  {/* Card Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.trackBtn}
                      onPress={() => handleTrackMeal(meal)}
                      activeOpacity={0.8}
                    >
                      <Icon name="add" size={16} color="#A3D9C9" />
                      <Text style={styles.trackBtnText}>Track</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => handleViewDetails(meal)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.detailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.heartBtn, isLiked && { backgroundColor: '#1A2421', borderColor: '#1F524C' }]}
                      onPress={() => toggleLikeMeal(mealKey)}
                      activeOpacity={0.8}
                    >
                      <Icon
                        name={isLiked ? "heart" : "heart-outline"}
                        size={18}
                        color={isLiked ? "#e74c3c" : "#A3D9C9"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : hasGeneratedPlan ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={diffDays < 0 ? "history" : "calendar-clock"} 
                size={48} 
                color="#A3D9C9" 
                style={{ opacity: 0.6 }} 
              />
              <Text style={styles.emptyTitle}>
                {diffDays < 0 ? "Past Date" : "Rest Day / Skipped Day"}
              </Text>
              <Text style={styles.emptyText}>
                {diffDays < 0 
                  ? "Meal plan is active starting from today. Select today or an upcoming day to view meals." 
                  : "No meals scheduled for this day in your weekly plan."}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="brain" size={48} color="#A3D9C9" style={{ opacity: 0.6 }} />
              <Text style={styles.emptyTitle}>No weekly plan generated yet</Text>
              <Text style={styles.emptyText}>Generate a personalised AI diet plan tailored to your goals and preferences.</Text>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={() => navigation.navigate('DietPreferences', { startFlow: true })}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#1E8B72', '#0F5C4A']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <View style={styles.generateBtnContent}>
                  <MaterialCommunityIcons name="brain" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.generateBtnText}>Generate AI Plan</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Did you know tip card */}
          {meals && meals.length > 0 && (
            <View style={styles.didYouKnowCard}>
              <Text style={styles.didYouKnowTitle}>Did you know?</Text>
              <Text style={styles.didYouKnowText}>{dayTip}</Text>
              <TouchableOpacity
                style={styles.didYouKnowHeartBtn}
                onPress={() => Alert.alert('Liked', 'You liked this diet tip!')}
                activeOpacity={0.8}
              >
                <Icon name="heart-outline" size={14} color="#A3D9C9" />
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerBtn: {
    padding: 6,
  },
  calendarContainer: {
    marginVertical: 10,
    width: '100%',
  },
  calendarScrollContent: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A2421',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  weekNavTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calendarDayCol: {
    width: 44,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  calendarDayLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  calendarDateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDateCircleActive: {
    backgroundColor: '#1E504A',
  },
  calendarDateCircleInactive: {
    backgroundColor: '#1A2421',
  },
  calendarDateText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarDateTextActive: {
    color: '#FFF',
  },
  calendarDateTextInactive: {
    color: '#A3D9C9',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshBtn: {
    padding: 6,
  },
  // AI Badge + Quality pill
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  aiBadgeAI: {
    backgroundColor: 'rgba(163, 217, 201, 0.1)',
    borderColor: 'rgba(163, 217, 201, 0.3)',
  },
  aiBadgeFallback: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A3D9C9',
    letterSpacing: 0.3,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  qualityPillGood: {
    backgroundColor: 'rgba(107, 203, 119, 0.1)',
    borderColor: 'rgba(107, 203, 119, 0.3)',
  },
  qualityPillWarn: {
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderColor: 'rgba(255, 217, 61, 0.3)',
  },
  qualityPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Calories
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
  },
  caloriesText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginLeft: 6,
  },
  // Macro bars
  macroBarSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  macroBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    width: 48,
  },
  macroBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  macroBarFill: {
    height: 5,
    borderRadius: 4,
  },
  macroBarValue: {
    fontSize: 11,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#A3D9C9',
    fontSize: 14,
    fontWeight: '600',
  },
  mealCard: {
    backgroundColor: '#121214',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mealTime: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },
  imagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 6,
  },
  foodImage1: {
    width: 76,
    height: 76,
    borderRadius: 20,
    transform: [{ rotate: '-4deg' }],
    backgroundColor: '#1E1E1E',
  },
  foodImage2: {
    width: 76,
    height: 76,
    borderRadius: 20,
    marginLeft: -15,
    transform: [{ rotate: '4deg' }],
    backgroundColor: '#1E1E1E',
  },
  foodImage3: {
    width: 76,
    height: 76,
    borderRadius: 20,
    marginLeft: -15,
    transform: [{ rotate: '-2deg' }],
    backgroundColor: '#1E1E1E',
  },
  foodList: {
    marginBottom: 16,
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  foodItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  foodItemWeight: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
    marginBottom: 16,
  },
  nutritionCol: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nutritionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
    marginTop: 3,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 8,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A3D9C9',
    marginLeft: 3,
  },
  detailsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 8,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#A3D9C9',
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 30,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#121214',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 19,
  },
  generateBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#1E8B72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  generateBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  didYouKnowCard: {
    backgroundColor: '#0D1A16',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  didYouKnowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A3D9C9',
    marginBottom: 8,
  },
  didYouKnowText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: '600',
    paddingRight: 40,
  },
  didYouKnowHeartBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default WeeklyDietPlanScreen;
