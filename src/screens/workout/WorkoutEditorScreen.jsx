import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

export const WorkoutEditorScreen = ({ route }) => {
  const navigation = useNavigation();
  const [isRestTimerVisible, setRestTimerVisible] = useState(false);
  const [restSeconds, setRestSeconds] = useState(40);

  const [workoutName, setWorkoutName] = useState(
    route?.params?.workoutName || '',
  );
  const routeExercises = route?.params?.exercises || [];

  const [exercises, setExercises] = useState(
    routeExercises.length > 0
      ? routeExercises.map(ex => ({
        ...ex,
        loggedSets: ex.loggedSets || 0,
        isCompleted: ex.isCompleted || false,
      }))
      : [
        {
          id: '1',
          name: 'Dumbbell Bench Press',
          sets: 3,
          reps: 0,
          weight: '0',
          loggedSets: 0,
          isCompleted: false,
        },
        {
          id: '2',
          name: 'Dumbbell Fly',
          sets: 2,
          reps: 0,
          weight: '0',
          loggedSets: 0,
          isCompleted: false,
        },
        {
          id: '3',
          name: 'Incline Dumbbell Press',
          sets: 3,
          reps: 0,
          weight: '0',
          loggedSets: 0,
          isCompleted: false,
        },
        {
          id: '4',
          name: 'Cable Crossover',
          sets: 3,
          reps: 0,
          weight: '0',
          loggedSets: 0,
          isCompleted: false,
        },
      ],
  );

  const [activeExerciseId, setActiveExerciseId] = useState(
    exercises.length > 0 ? exercises[0].id : null,
  );

  useEffect(() => {
    if (!isRestTimerVisible || restSeconds <= 0) return undefined;

    const interval = setInterval(() => {
      setRestSeconds(current => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerVisible, restSeconds]);

  const formatRestTime = totalSeconds => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const currentDay = days[new Date().getDay()];

  const handleLogSet = id => {
    setExercises(prevExercises => {
      const updatedExercises = prevExercises.map(ex => {
        if (ex.id === id) {
          const newLoggedSets = ex.loggedSets + 1;
          const isNowCompleted = newLoggedSets >= ex.sets;
          return {
            ...ex,
            loggedSets: newLoggedSets,
            isCompleted: isNowCompleted,
          };
        }
        return ex;
      });

      const currentEx = updatedExercises.find(e => e.id === id);
      if (currentEx && currentEx.isCompleted) {
        const currentIndex = updatedExercises.findIndex(e => e.id === id);
        const nextExercise = updatedExercises[currentIndex + 1];
        if (nextExercise) {
          setActiveExerciseId(nextExercise.id);
        }
      } else if (currentEx) {
        setActiveExerciseId(id);
      }

      return updatedExercises;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.editorHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 19L8 12L15 5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.editorHeaderTitle}>{currentDay}</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.editorContent}>
          <TextInput
            style={styles.workoutNameInput}
            placeholder="Workout name"
            placeholderTextColor="#555"
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>00:37</Text>
              <Text style={styles.summaryLabel}>Duration</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>14</Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>10</Text>
              <Text style={styles.summaryLabel}>Volume (kg)</Text>
            </View>
          </View>

          <View style={styles.exercisesHeader}>
            <Text style={styles.exercisesLabel}>
              EXERCISES ({exercises.length})
            </Text>
            <TouchableOpacity style={styles.addExerciseButton}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 5V19M5 12H19"
                  stroke="#007AFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.addExerciseText}>Add exercise +</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.exercisesList}>
            {exercises.map(exercise => {
              const isActive =
                exercise.id === activeExerciseId && !exercise.isCompleted;
              const isDone = exercise.isCompleted;

              return (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseCard,
                    isActive && styles.exerciseCardActive,
                    isDone && styles.exerciseCardDone,
                  ]}
                  onPress={() => handleLogSet(exercise.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseTopRow}>
                    <Text
                      style={[
                        styles.exerciseName,
                        isDone && styles.exerciseNameDone,
                      ]}
                    >
                      {exercise.name}
                    </Text>

                    <View
                      style={[
                        styles.loggedBadge,
                        isDone && styles.loggedBadgeDone,
                        isActive && styles.loggedBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.loggedBadgeText,
                          isDone && styles.loggedBadgeTextDone,
                          isActive && styles.loggedBadgeTextActive,
                        ]}
                      >
                        {exercise.loggedSets}/{exercise.sets} logged{' '}
                        {isDone ? '✓' : `· ${exercise.weight}kg`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.setsRow}>
                    <Text style={styles.setsText}>
                      {exercise.sets} sets · {exercise.reps} reps
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.restTimerContainer}>
            <Text style={styles.restTimerLabel}>REST TIME</Text>
            <TouchableOpacity
              style={styles.restTimerBox}
              onPress={() => setRestTimerVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.restTimerValue}>01:00</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isRestTimerVisible} transparent animationType="slide">
        <View style={styles.restTimerOverlay}>
          <TouchableOpacity
            style={styles.restTimerBackdrop}
            activeOpacity={1}
            onPress={() => setRestTimerVisible(false)}
          />
          <View style={styles.restTimerSheet}>
            <TouchableOpacity
              style={styles.restCloseBtn}
              onPress={() => setRestTimerVisible(false)}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#FFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.restTitle}>REST TIME</Text>
            <View style={styles.restDial}>
              <View style={styles.restDialHighlight} />
              <View style={styles.restGreenDot} />
              <Text style={styles.restTimeValue}>
                {formatRestTime(restSeconds)}
              </Text>
            </View>
            <View style={styles.restControls}>
              <TouchableOpacity
                style={styles.restAdjustBtn}
                onPress={() =>
                  setRestSeconds(current => Math.max(current - 15, 0))
                }
              >
                <Text style={styles.restAdjustIcon}>↶</Text>
                <Text style={styles.restAdjustText}>-15</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restAdjustBtn}
                onPress={() => setRestSeconds(current => current + 15)}
              >
                <Text style={styles.restAdjustIcon}>↷</Text>
                <Text style={styles.restAdjustText}>+15</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  editorHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editorContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  workoutNameInput: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#8E8E9A',
    fontSize: 11,
    fontWeight: '600',
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exercisesLabel: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExerciseText: {
    color: '#EE822A',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  exercisesList: {
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: '#15151F',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  exerciseCardActive: {
    borderColor: '#2E4D9F',
    backgroundColor: '#1E2436',
    shadowColor: '#2E4D9F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseCardDone: {
    borderColor: '#2A2A40',
    opacity: 0.6,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  exerciseNameDone: {
    textDecorationLine: 'line-through',
    color: '#8E8E9A',
  },
  loggedBadge: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  loggedBadgeActive: {
    borderColor: '#EE822A',
    backgroundColor: '#2C221F',
  },
  loggedBadgeDone: {
    borderColor: '#4CAF50',
    backgroundColor: '#1B3D1B',
  },
  loggedBadgeText: {
    color: '#8E8E9A',
    fontSize: 11,
    fontWeight: '700',
  },
  loggedBadgeTextActive: {
    color: '#EE822A',
  },
  loggedBadgeTextDone: {
    color: '#4CAF50',
  },
  setsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setsText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  restTimerContainer: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 20,
  },
  restTimerLabel: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  restTimerBox: {
    backgroundColor: '#1C1C2E',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  restTimerValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  restTimerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  restTimerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  restTimerSheet: {
    height: '55%',
    marginHorizontal: 8,
    backgroundColor: '#1E2436',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 0,
    alignItems: 'center',
    paddingTop: 42,
    overflow: 'hidden',
  },
  restCloseBtn: {
    position: 'absolute',
    top: 26,
    right: 26,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  restTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  restDial: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#1E2436',
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E4D9F',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  restDialHighlight: {
    position: 'absolute',
    top: 20,
    width: 105,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  restGreenDot: {
    position: 'absolute',
    left: 44,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  restTimeValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 64,
    fontWeight: '300',
  },
  restControls: {
    position: 'absolute',
    left: 54,
    right: 54,
    bottom: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restAdjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restAdjustIcon: { color: '#FFF', fontSize: 16, lineHeight: 16 },
  restAdjustText: { color: '#FFF', fontSize: 14, marginTop: -2 },
});

export default WorkoutEditorScreen;
