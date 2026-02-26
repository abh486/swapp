// src/screens/activity/Activity.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Strings } from '../../config/config'; // Import Config

const { height } = Dimensions.get('window');

const Activity = () => {
  const navigation = useNavigation();

  // Separate animated values for each card
  const [workoutScaleAnim] = useState(new Animated.Value(1));
  const [dietScaleAnim] = useState(new Animated.Value(1));

  // Separate paused states for each video, initially false to autoplay both
  const [workoutPaused, setWorkoutPaused] = useState(false);
  const [dietPaused, setDietPaused] = useState(false);

  // Sample stats data (Removed Google Fit and Heart Rate states)
  const [workoutStats, setWorkoutStats] = useState({
    sessionsCompleted: 0,
    caloriesBurned: 0,
    weeklyGoal: 15,
    currentStreak: 0,
    steps: 0,
  });

  const [dietStats, setDietStats] = useState({
    caloriesConsumed: 0,
    dailyGoal: 2200,
    proteinIntake: 0,
    waterIntake: 0,
  });

  // Removed Google Fit initialization useEffect
  // Removed Google Fit connection logic
  // Removed Heart Rate monitoring logic

  const animatePress = (anim) => {
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleWorkoutPress = () => {
    setWorkoutPaused((prev) => !prev);
    animatePress(workoutScaleAnim);
  };

  const handleDietPress = () => {
    setDietPaused((prev) => !prev);
    animatePress(dietScaleAnim);
  };

  const handleWorkoutLogPress = () => {
    navigation.navigate('WorkoutLog');
  };

  const handleDietLogPress = () => {
    navigation.navigate('DietLog');
  };

  const handleWorkoutStatsPress = () => {
    navigation.navigate('WorkoutStats');
  };

  const handleDietStatsPress = () => {
    navigation.navigate('DietStats');
  };

  const handleOllamaPress = () => {
    navigation.navigate('ollama');
  };

  const workoutProgress =
    (workoutStats.sessionsCompleted / workoutStats.weeklyGoal) * 100;
  const dietProgress = (dietStats.caloriesConsumed / dietStats.dailyGoal) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{Strings.Activity.header.title}</Text>
        <View style={styles.profileImage} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Google Fit Connection Card - REMOVED */}

        {/* Heart Rate Card - REMOVED */}

        {/* Last Workout Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{Strings.Activity.lastWorkout.title}</Text>
          <Text style={styles.cardSubtitle}>{Strings.Activity.lastWorkout.subtitle}</Text>
          
          <View style={styles.workoutChart}>
            <View style={styles.chartBar}>
              <View style={[styles.barFill, { height: '60%' }]} />
              <Text style={styles.barLabel}>{Strings.Activity.lastWorkout.labels.duration}</Text>
            </View>
            
            <View style={styles.chartBar}>
              <View style={[styles.barFill, { height: '80%' }]} />
              <Text style={styles.barLabel}>{Strings.Activity.lastWorkout.labels.calories}</Text>
            </View>
            
            <View style={styles.chartBar}>
              <View style={[styles.barFill, { height: '50%' }]} />
              <Text style={styles.barLabel}>{Strings.Activity.lastWorkout.labels.distance}</Text>
            </View>
          </View>
          
          <View style={styles.workoutStats}>
            <View style={styles.workoutStatItem}>
              <Text style={styles.workoutStatValue}>45 {Strings.Activity.lastWorkout.stats.min}</Text>
            </View>
            <View style={styles.workoutStatItem}>
              <Text style={styles.workoutStatValue}>{workoutStats.caloriesBurned} {Strings.Activity.lastWorkout.stats.kcal}</Text>
            </View>
            <View style={styles.workoutStatItem}>
              <Text style={styles.workoutStatValue}>5.2 {Strings.Activity.lastWorkout.stats.km}</Text>
            </View>
          </View>
          
          <View style={styles.workoutActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWorkoutLogPress}
            >
              <Text style={styles.actionButtonText}>{Strings.Activity.lastWorkout.actions.logWorkout}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={handleWorkoutStatsPress}
            >
              <Text style={styles.actionButtonText}>{Strings.Activity.lastWorkout.actions.stats}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Macros Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{Strings.Activity.dailyMacros.title}</Text>
          <Text style={styles.cardSubtitle}>{Strings.Activity.dailyMacros.subtitle}</Text>
          
          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>{Strings.Activity.dailyMacros.macros.protein}</Text>
                <Text style={styles.macroValue}>{dietStats.proteinIntake}g / 150g</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((dietStats.proteinIntake / 150) * 100, 100)}%` },
                  ]}
                />
              </View>
            </View>
            
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>{Strings.Activity.dailyMacros.macros.carbs}</Text>
                <Text style={styles.macroValue}>180g / 250g</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '72%' },
                  ]}
                />
              </View>
            </View>
            
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>{Strings.Activity.dailyMacros.macros.fats}</Text>
                <Text style={styles.macroValue}>45g / 70g</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '64%' },
                  ]}
                />
              </View>
            </View>
          </View>
          
          <View style={styles.dietActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDietLogPress}
            >
              <Text style={styles.actionButtonText}>{Strings.Activity.dailyMacros.actions.logMeal}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={handleDietStatsPress}
            >
              <Text style={styles.actionButtonText}>{Strings.Activity.dailyMacros.actions.stats}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Status */}
        <View style={styles.activityStatus}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View
                style={[styles.statusDot, !workoutPaused && styles.activeDot]}
              />
              <Text style={styles.statusText}>{Strings.Activity.status.workoutActive}</Text>
            </View>
            <View style={styles.statusSeparator} />
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, !dietPaused && styles.activeDot]} />
              <Text style={styles.statusText}>{Strings.Activity.status.dietTracking}</Text>
            </View>
          </View>

          <View style={styles.streakContainer}>
            <Text style={styles.streakText}> {workoutStats.currentStreak} {Strings.Activity.status.streak}</Text>
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOllamaPress}
      >
        <Icon name="chatbot-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#57595B',
  },
  googleFitIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  syncButton: {
    backgroundColor: '#452829',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  connectButton: {
    backgroundColor: '#452829',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  heartRateCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  heartRateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  heartRateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heartRateCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heartRateCircleProgress: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 80,
    borderWidth: 8,
    borderTopColor: '#452829',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-90deg' }],
  },
  heartRateValueContainer: {
    alignItems: 'center',
  },
  heartRateValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heartRateUnit: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  heartRateDetails: {
    flex: 1,
    marginLeft: 24,
  },
  heartRateDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartRateDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heartRateDetailLabel: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  heartRateDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  heartRateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(69, 40, 41, 0.2)',
    borderWidth: 1,
    borderColor: '#452829',
  },
  stopButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  heartRateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  workoutChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    marginHorizontal: 8,
  },
  barFill: {
    width: '100%',
    backgroundColor: '#452829',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#57595B',
    marginTop: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  workoutStatItem: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 14,
    color: '#57595B',
  },
  workoutActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#452829',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  statsButton: {
    backgroundColor: 'rgba(69, 40, 41, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#452829',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  macrosContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  macroItem: {
    marginBottom: 16,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  macroValue: {
    fontSize: 14,
    color: '#57595B',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#452829',
    borderRadius: 4,
  },
  dietActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityStatus: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 8,
  },
  activeDot: {
    backgroundColor: '#452829',
    borderColor: '#452829',
    shadowColor: '#452829',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#57595B',
    fontSize: 12,
    fontWeight: '500',
  },
  statusSeparator: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  streakContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  streakText: {
    color: '#452829',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#452829',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Activity;