import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../../../api/apiClient';
import { GlobalLoader } from '../../../components/GlobalLoader';
import DietDatePickerModal from './components/DietDatePickerModal';
import { useAuth } from '../../../context/AuthContext';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { getTargetsForUser, getCachedBackendTargets, setCachedBackendTargets } from '../../../utils/nutritionCalculator';

const { width } = Dimensions.get('window');

const DietAllLogs = ({ navigation, route }) => {
  const { user } = useAuth();
  const reduxWeight = useSelector(state => state.weight);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleIOSDonePress = () => {
    setShowDatePicker(false);
  };

  const fetchAllDietLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/diet/logs');
      const payload = response?.data?.data || response?.data || [];
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.logs)
          ? payload.logs
          : [];
      const foodLogsOnly = normalized.filter(
        (item) => item.mealType !== 'water' && item.mealName !== 'Water'
      );
      setLogs(foodLogsOnly);
    } catch (err) {
      setError('Unable to load diet logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      const response = await apiClient.get('/diet/progress/summary');
      const data = response?.data?.data || response?.data;
      if (data) {
        setDailySummary(data);
        if (data.targets && data.targets.calories > 0) {
          setCachedBackendTargets(data.targets);
        }
      }
    } catch (err) {
      console.warn('[DietAllLogs] Failed to fetch summary:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchAllDietLogs();
  }, [fetchAllDietLogs]);

  useEffect(() => {
    fetchDailySummary();
  }, [fetchDailySummary, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchAllDietLogs();
      fetchDailySummary();
    }, [fetchAllDietLogs, fetchDailySummary])
  );

  // Filter logs for the selected date
  const dailyLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = log.createdAt ? new Date(log.createdAt) : new Date(log.date);
      return logDate.toDateString() === selectedDate.toDateString();
    });
  }, [logs, selectedDate]);

  // Calculate live target and consumed cals
  const liveTargets = useMemo(() => {
    const cached = getCachedBackendTargets();
    if (cached && cached.calories > 0) {
      return cached;
    }
    const activeWeight =
      reduxWeight?.logs?.[reduxWeight.logs.length - 1]?.value ||
      user?.weight?.value ||
      user?.weight ||
      reduxWeight?.startingValue ||
      70;
    const activeTarget =
      reduxWeight?.targetWeight ||
      user?.targetWeight?.value ||
      user?.targetWeight ||
      user?.goalWeight;
    const activeHeight = reduxWeight?.height || user?.height?.value || user?.height || 170;
    const activeGoal = user?.fitnessGoal || '';
    return getTargetsForUser({
      ...(user || {}),
      weight: activeWeight,
      height: activeHeight,
      targetWeight: activeTarget,
      goalWeight: activeTarget,
      fitnessGoal: activeGoal,
    });
  }, [user, reduxWeight?.targetWeight, reduxWeight?.startingValue, reduxWeight?.logs, reduxWeight?.height]);

  const targetCals = dailySummary?.targets?.calories || getCachedBackendTargets()?.calories || liveTargets.calories;
  const consumedCals = dailyLogs.reduce((sum, item) => sum + (item.calories || 0), 0);

  // Meal categories list
  const categories = [
    { type: 'Breakfast', label: 'Breakfast' },
    { type: 'Morning Snack', label: 'Morning Snack' },
    { type: 'Lunch', label: 'Lunch' },
    { type: 'Evening Snack', label: 'Evening Snack' },
    { type: 'Dinner', label: 'Dinner' },
    { type: 'Custom Meal', label: 'Custom Meal' },
  ];

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateTitle = isToday 
    ? 'Today' 
    : selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.dateSelector} 
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle}>{dateTitle}</Text>
          <Icon name="chevron-down" size={16} color="#FFF" style={styles.chevronDown} />
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Reminders')} style={styles.headerActionBtn}>
            <Icon name="cog-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Options', 'Diet options and logs management')} style={styles.headerActionBtn}>
            <Icon name="ellipsis-horizontal" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <GlobalLoader size={50} />
          <Text style={styles.stateText}>Loading logs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAllDietLogs} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Calorie header info row */}
          <View style={styles.caloriesOverviewRow}>
            <View style={styles.restaurantOuterCircle}>
              <View style={styles.restaurantInnerCircle}>
                <Icon name="restaurant" size={20} color="#000" />
              </View>
            </View>
            <View style={styles.caloriesTextContainer}>
              <Text style={styles.caloriesCounterText}>
                <Text style={styles.caloriesGreen}>{consumedCals.toLocaleString()} of {targetCals.toLocaleString()}</Text>
              </Text>
              <Text style={styles.calEatenLabel}>Cal Eaten</Text>
            </View>
            <TouchableOpacity 
              style={styles.analyticsTriggerBtn}
              onPress={() => navigation.navigate('MacronutrientDetails', { dailySummary })}
              activeOpacity={0.8}
            >
              <Icon name="bar-chart-sharp" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Cards List */}
          <View style={styles.categoriesList}>
            {categories.map((cat, index) => {
              const catLogs = dailyLogs.filter(
                log => (log.mealType || '').toLowerCase() === cat.type.toLowerCase()
              );
              
              const totalCal = catLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
              const totalProt = catLogs.reduce((sum, item) => sum + (item.protein || 0), 0);
              const totalFats = catLogs.reduce((sum, item) => sum + (item.fats || 0), 0);
              const totalCarbs = catLogs.reduce((sum, item) => sum + (item.carbs || 0), 0);
              const totalFibre = catLogs.reduce((sum, item) => sum + (item.fibre || 0), 0);

              const firstLogWithPhoto = catLogs.find(l => l.photoUrl || l.photo?.uri || l.imageUrl);
              const cardImage = firstLogWithPhoto 
                ? (firstLogWithPhoto.photoUrl || firstLogWithPhoto.photo?.uri || firstLogWithPhoto.imageUrl) 
                : null;

              const loggedTime = catLogs.length > 0 && catLogs[0].createdAt
                ? new Date(catLogs[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : null;

              return (
                <View key={cat.type}>
                  {/* Category Card */}
                  <View style={styles.mealCategoryCard}>
                    {/* Left details */}
                    <View style={styles.cardLeftCol}>
                      {/* Pill Header */}
                      <View style={styles.pillHeaderRow}>
                        <View style={styles.categoryPill}>
                          <Text style={styles.categoryPillText}>{cat.label}</Text>
                        </View>
                        {loggedTime && <Text style={styles.timeLabelText}>{loggedTime}</Text>}
                      </View>

                      {/* Items List */}
                      <View style={styles.itemsListContainer}>
                        {catLogs.length > 0 ? (
                          catLogs.map((log, lIdx) => (
                            <View key={lIdx} style={styles.foodItemRow}>
                              <Text style={styles.foodItemName} numberOfLines={1}>{log.mealName}</Text>
                              <Text style={styles.foodItemCal}>{log.calories}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.emptyItemsText}>No meals tracked yet</Text>
                        )}
                      </View>

                      {/* Divider line */}
                      <View style={styles.cardDivider} />

                      {/* Totals Row */}
                      <View style={styles.totalsMacroRow}>
                        <Text style={styles.macroTotalVal}>{totalCal}</Text>
                        <Text style={styles.macroTotalVal}>{Math.round(totalProt)}g</Text>
                        <Text style={styles.macroTotalVal}>{Math.round(totalFats)}g</Text>
                        <Text style={styles.macroTotalVal}>{Math.round(totalCarbs)}g</Text>
                        <Text style={styles.macroTotalVal}>{Math.round(totalFibre)}g</Text>
                      </View>
                    </View>

                    {/* Right Overlapping circular image */}
                    <View style={styles.imageOuterWrapper}>
                      {cardImage ? (
                        <Image source={{ uri: cardImage }} style={styles.circularMealImage} />
                      ) : (
                        <View style={[styles.circularMealImage, { backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' }]}>
                          <Icon name="restaurant-outline" size={24} color="rgba(255, 255, 255, 0.4)" />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Connectors & Specific Add buttons */}
                  <View style={styles.dashedConnectorContainer}>
                    <View style={styles.verticalDashedLine} />
                    <TouchableOpacity 
                      style={styles.addMealPill}
                      onPress={() => navigation.navigate('Dietplan', { openTrackFood: true, mealType: cat.type })}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addMealPillText}>Add {cat.label} +</Text>
                    </TouchableOpacity>
                    {index < categories.length - 1 && (
                      <View style={styles.verticalDashedLine} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <DietDatePickerModal
        showDatePicker={showDatePicker}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        handleIOSDonePress={handleIOSDonePress}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chevronDown: {
    marginLeft: 6,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  stateText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    marginTop: 15,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  caloriesOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  restaurantOuterCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  restaurantInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#72D786',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesTextContainer: {
    flex: 1,
    marginLeft: 18,
  },
  caloriesCounterText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  caloriesGreen: {
    color: '#72D786',
  },
  calEatenLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    marginTop: 3,
  },
  analyticsTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoriesList: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  mealCategoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    flexDirection: 'row',
    padding: 20,
    position: 'relative',
    height: 190,
  },
  cardLeftCol: {
    flex: 1,
    paddingRight: 100, // Make room for overlapping image
  },
  pillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryPill: {
    backgroundColor: '#A0E7A2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryPillText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  timeLabelText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  foodItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  foodItemName: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  foodItemCal: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyItemsText: {
    color: 'rgba(0, 0, 0, 0.35)',
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 12,
  },
  totalsMacroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroTotalVal: {
    color: '#000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  imageOuterWrapper: {
    position: 'absolute',
    right: -15,
    top: '15%',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 6,
    borderColor: '#000',
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  circularMealImage: {
    width: '100%',
    height: '100%',
  },
  dashedConnectorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    height: 48,
  },
  verticalDashedLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  addMealPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 4,
  },
  addMealPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DietAllLogs;
