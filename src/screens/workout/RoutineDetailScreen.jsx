import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, StatusBar, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const ChevronLeftIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#8E8E9A" strokeWidth={1.8} />
    <Path d="M12 7V12L15 15" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const DumbbellIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8H4v8h2V8zm12 0h-2v8h2V8zM6 12h12M3 10h1v4H3v-4zm17 0h1v4h-1v-4z" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const RoutineDetailScreen = ({ route, navigation }) => {
  const { program } = route.params || {};

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No routine details found.</Text>
      </View>
    );
  }

  const getLevelLabel = (level) => {
    if (level === 'BEGINNER') return 'Beginner';
    if (level === 'INTERMEDIATE') return 'Medium';
    if (level === 'ADVANCED') return 'Advanced';
    return level || '';
  };

  const getGoalLabel = (goal) => {
    if (goal === 'GAIN_MUSCLE') return 'Gain Muscle';
    if (goal === 'STRENGTH') return 'Strength';
    if (goal === 'LOSE_WEIGHT') return 'Lose Weight';
    return goal || '';
  };

  const getEquipmentLabel = (eq) => {
    if (eq === 'GYM') return 'Gym';
    if (eq === 'DUMBBELLS') return 'Dumbbells';
    if (eq === 'NONE') return 'None';
    return eq || '';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Workout Program
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Section */}
        <View style={styles.introSection}>
          <Text style={styles.programName}>{program.name}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getLevelLabel(program.level)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(238, 130, 42, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: '#EE822A' }]}>{getGoalLabel(program.goal)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(0, 122, 255, 0.15)' }]}>
              <Text style={[styles.badgeText, { color: '#007AFF' }]}>{getEquipmentLabel(program.equipment)}</Text>
            </View>
          </View>
          
          <Text style={styles.description}>
            This program contains {program.routinesCount || (program.workouts ? program.workouts.length : 0)} daily workout sessions designed for your {getGoalLabel(program.goal).toLowerCase()} goal. Focus on progressive overload and form.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Categories / Workout Days */}
        <Text style={styles.sectionTitle}>Daily Workouts</Text>

        {(program.workouts || []).map((workout, index) => (
          <View key={index} style={styles.workoutSection}>
            <View style={styles.cardHeader}>
              <Text style={styles.dayTitle}>{workout.dayName}</Text>
              {workout.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{workout.category.toUpperCase()}</Text>
                </View>
              )}
            </View>

            {/* Workout Details (Duration / Exercises count) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ClockIcon />
                <Text style={styles.statText}>{workout.duration || 45} mins</Text>
              </View>
              <View style={styles.statItem}>
                <DumbbellIcon />
                <Text style={styles.statText}>{(workout.exercises || []).length} Exercises</Text>
              </View>
            </View>

            {/* Exercises List */}
            <View style={styles.exercisesSection}>
              {(workout.exercises || []).map((ex, exIdx) => (
                <Text key={ex.id || exIdx} style={styles.exerciseItem} numberOfLines={1}>
                  • {ex.name} <Text style={styles.setDetail}>({ex.sets} sets x {ex.reps} reps)</Text>
                </Text>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.startButton}
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('FastWorkoutActive', {
                  level: program.level,
                  duration: workout.duration || 45,
                  exercises: (workout.exercises || []).map(ex => ({
                    id: ex.id,
                    name: ex.name,
                    sets: Array.from({ length: ex.sets }, (_, i) => ({
                      id: i + 1,
                      reps: ex.reps,
                      weight: ex.weight,
                      completed: false,
                    })),
                  })),
                  workoutName: `${program.name} - ${workout.dayName}`,
                  source: 'custom_workout',
                  isCustomWorkout: true,
                });
              }}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>

            {index < (program.workouts || []).length - 1 && <View style={[styles.divider, { marginTop: 24 }]} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121216',
  },
  errorText: {
    color: '#8E8E9A',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 60,
    paddingBottom: 16,
    backgroundColor: '#121216',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  introSection: {
    paddingBottom: 10,
  },
  programName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#8E8E9A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  workoutSection: {
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '500',
  },
  exercisesSection: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 14,
    marginLeft: 4,
    marginBottom: 18,
    gap: 8,
  },
  exerciseItem: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  setDetail: {
    color: '#8E8E9A',
    fontSize: 13,
  },
  startButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#EE822A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RoutineDetailScreen;
