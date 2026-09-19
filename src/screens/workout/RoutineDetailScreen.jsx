import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  saveCustomWorkoutTemplate,
  resolveExerciseImageUri,
  getExerciseMuscleFallback,
} from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

const ChevronLeftIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#8E8E9A" strokeWidth={1.8} />
    <Path d="M12 7V12L15 15" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const DumbbellIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path d="M6 8H4v8h2V8zm12 0h-2v8h2V8zM6 12h12M3 10h1v4H3v-4zm17 0h1v4h-1v-4z" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const FlameIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C12 2 7 7 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 7 12 2 12 2Z"
      stroke="#EE822A"
      strokeWidth={1.8}
    />
  </Svg>
);

const BookmarkIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
      stroke="#EE822A"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RoutineDetailScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { program } = route.params || {};

  const [savingFolder, setSavingFolder] = useState(false);
  const [failedImages, setFailedImages] = useState({});

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
    return level || 'All Levels';
  };

  const getGoalLabel = (goal) => {
    if (goal === 'GAIN_MUSCLE') return 'Gain Muscle';
    if (goal === 'STRENGTH') return 'Strength';
    if (goal === 'LOSE_WEIGHT') return 'Lose Weight';
    return goal || 'Fitness';
  };

  const getEquipmentLabel = (eq) => {
    if (eq === 'GYM') return 'Gym';
    if (eq === 'DUMBBELLS') return 'Dumbbells';
    if (eq === 'NONE') return 'Bodyweight';
    return eq || 'All Equipment';
  };

  const handleSaveToFolders = async () => {
    try {
      setSavingFolder(true);
      await dispatch(saveCustomWorkoutTemplate(program.name, program.workouts));
      Alert.alert(
        'Saved to Folders!',
        `"${program.name}" has been saved into your Custom Workout Folders. You can view, track, or customize it anytime.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Failed to save preset to folders:', err);
      Alert.alert('Save Failed', 'Could not save routine folder to backend. Please try again.');
    } finally {
      setSavingFolder(false);
    }
  };

  const handleStartWorkout = (workout) => {
    const enrichedExercises = (workout.exercises || []).map((ex, exIdx) => {
      const isPlankOrHold = Boolean(
        ex.isTimeBased ||
        (ex.name && (ex.name.toLowerCase().includes('plank') || ex.name.toLowerCase().includes('hold')))
      );
      const setsCount = Number(ex.sets) || 3;
      const resolvedUri = resolveExerciseImageUri(ex) || ex.imageUrl || null;

      return {
        id: ex.id || `ex-${Date.now()}-${exIdx}`,
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        imageUrl: resolvedUri,
        gifUrl: ex.gifUrl || resolvedUri,
        bodyPart: ex.bodyPart || 'chest',
        target: ex.target || 'pectorals',
        equipment: ex.equipment || (program.equipment === 'NONE' ? 'body weight' : 'dumbbell'),
        isTimeBased: isPlankOrHold,
        duration: isPlankOrHold ? (ex.duration || 45) : null,
        sets: Array.from({ length: setsCount }, (_, i) => ({
          id: `set-${Date.now()}-${exIdx}-${i}-${Math.random()}`,
          reps: isPlankOrHold ? 0 : Number(ex.reps || 10),
          weight: isPlankOrHold ? (ex.duration || 45).toString() : (ex.weight || '0'),
          completed: false,
        })),
      };
    });

    navigation.navigate('FastWorkoutActive', {
      level: program.level,
      duration: workout.duration || 45,
      exercises: enrichedExercises,
      workoutName: `${program.name} - ${workout.dayName}`,
      folderName: program.name,
      source: 'custom_workout',
      isCustomWorkout: true,
    });
  };

  const totalExercises = (program.workouts || []).reduce((acc, w) => acc + (w.exercises || []).length, 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121216" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 44) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Workout Routine
        </Text>
        <TouchableOpacity
          style={styles.saveFolderBtn}
          onPress={handleSaveToFolders}
          disabled={savingFolder}
          activeOpacity={0.7}
        >
          {savingFolder ? (
            <ActivityIndicator size="small" color="#EE822A" />
          ) : (
            <>
              <BookmarkIcon />
              <Text style={styles.saveFolderBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <LinearGradient
            colors={['rgba(238, 130, 42, 0.12)', 'rgba(26, 26, 36, 0.95)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={20}
          />
          <Text style={styles.programName}>{program.name}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{getLevelLabel(program.level)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(238, 130, 42, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: '#EE822A' }]}>{getGoalLabel(program.goal)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(0, 122, 255, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: '#60A5FA' }]}>{getEquipmentLabel(program.equipment)}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(52, 199, 89, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: '#34C759' }]}>
                {program.workouts ? program.workouts.length : 0} Daily Routines
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            Comprehensive {program.workouts ? program.workouts.length : 0}-routine split with {totalExercises} total movements designed for optimal hypertrophy, muscular endurance, and progressive overload.
          </Text>
        </View>

        {/* Workouts List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Daily Routines & Exercises</Text>
          <Text style={styles.sectionSubtitle}>
            {program.workouts ? program.workouts.length : 0} workouts
          </Text>
        </View>

        {(program.workouts || []).map((workout, index) => {
          const workoutDuration = workout.duration || 45;
          const workoutCalories = Math.round(workoutDuration * 5.5);
          const exercisesList = workout.exercises || [];

          return (
            <View key={index} style={styles.workoutCard}>
              {/* Workout Day Top Bar */}
              <View style={styles.cardHeader}>
                <View style={styles.dayInfoLeft}>
                  <Text style={styles.dayTitle}>{workout.dayName}</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ClockIcon />
                      <Text style={styles.statText}>{workoutDuration} min</Text>
                    </View>
                    <View style={styles.statItem}>
                      <DumbbellIcon />
                      <Text style={styles.statText}>{exercisesList.length} Exercises</Text>
                    </View>
                    <View style={styles.statItem}>
                      <FlameIcon />
                      <Text style={styles.statText}>{workoutCalories} kcal</Text>
                    </View>
                  </View>
                </View>

                {workout.category && (
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{workout.category.toUpperCase()}</Text>
                  </View>
                )}
              </View>

              {/* Rich Exercises List */}
              <View style={styles.exercisesContainer}>
                {exercisesList.map((ex, exIdx) => {
                  const resolvedUri = resolveExerciseImageUri(ex) || ex.imageUrl;
                  const hasFailed = failedImages[ex.id || exIdx];
                  const fallbackAsset = getExerciseMuscleFallback(ex.bodyPart || ex.target);
                  const isTimeBased = Boolean(ex.isTimeBased);

                  return (
                    <View key={ex.id || exIdx} style={styles.exerciseRow}>
                      {/* Thumbnail with Fallback */}
                      <View style={styles.thumbnailBox}>
                        <Image
                          source={
                            !hasFailed && resolvedUri
                              ? { uri: resolvedUri }
                              : fallbackAsset
                          }
                          style={styles.thumbnailImg}
                          resizeMode="cover"
                          onError={() => {
                            setFailedImages(prev => ({ ...prev, [ex.id || exIdx]: true }));
                          }}
                        />
                      </View>

                      {/* Exercise Details */}
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName} numberOfLines={1}>
                          {ex.name}
                        </Text>

                        <View style={styles.exerciseMetaRow}>
                          {ex.target && (
                            <View style={styles.targetBadge}>
                              <Text style={styles.targetBadgeText}>
                                {ex.target.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {ex.equipment && (
                            <View style={styles.equipmentBadge}>
                              <Text style={styles.equipmentBadgeText}>
                                {ex.equipment.toLowerCase() === 'body weight' ? 'BODYWEIGHT' : ex.equipment.toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.setsInfoText}>
                          {ex.sets || 3} sets • {isTimeBased ? `${ex.reps || ex.duration || 45}s hold` : `${ex.reps || 10} reps`}
                          {ex.weight && ex.weight !== '0' ? ` • ${ex.weight} kg` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.startButton}
                activeOpacity={0.85}
                onPress={() => handleStartWorkout(workout)}
              >
                <LinearGradient
                  colors={['#EE822A', '#E05D1E']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  borderRadius={14}
                />
                <Text style={styles.startButtonText}>Start Workout</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F14',
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
    paddingBottom: 14,
    backgroundColor: '#0F0F14',
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(238, 130, 42, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(238, 130, 42, 0.3)',
  },
  saveFolderBtnText: {
    color: '#EE822A',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  introCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#16161F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    overflow: 'hidden',
  },
  programName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  badgeText: {
    color: '#E0E0E6',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#9E9EA8',
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '500',
  },
  workoutCard: {
    backgroundColor: '#16161F',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dayInfoLeft: {
    flex: 1,
    paddingRight: 10,
  },
  dayTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(238, 130, 42, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(238, 130, 42, 0.3)',
  },
  categoryText: {
    color: '#EE822A',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#8E8E9A',
    fontSize: 12.5,
    fontWeight: '500',
  },
  exercisesContainer: {
    gap: 10,
    marginBottom: 16,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 10,
    gap: 12,
  },
  thumbnailBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#20202C',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  targetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    borderRadius: 4,
  },
  targetBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700',
  },
  equipmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  equipmentBadgeText: {
    color: '#A0A0AA',
    fontSize: 10,
    fontWeight: '600',
  },
  setsInfoText: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '500',
  },
  startButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

export default RoutineDetailScreen;
