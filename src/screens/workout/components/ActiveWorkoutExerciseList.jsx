import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SwipeableSetRow } from './SwipeableSetRow';

// Handles image loading with two-stage fallback:
// 1. Primary imageUrl/gifUrl
// 2. ExerciseDB API URL (when exerciseId starts with 'exr_')
// 3. Muscle group avatar from wrkout.xyz
const ExerciseAvatar = ({ exercise, resolveExerciseImageUri, getMuscleImageUrl, failedImages, setFailedImages }) => {
  const [secondChanceFailed, setSecondChanceFailed] = useState(false);

  const target = (exercise.targetMuscles && exercise.targetMuscles[0]) ||
    (exercise.bodyParts && exercise.bodyParts[0]) || 'triceps';
  const muscleAvatar = getMuscleImageUrl(target);

  // Build primary image URL
  const primaryUrl = resolveExerciseImageUri(exercise);
  const primaryFailed = failedImages[exercise.id];

  // Build second-chance ExerciseDB URL (only if primary was the GitHub fallback)
  const exId = exercise.exerciseId || exercise.id;
  const hasExerciseDbId = exId && typeof exId === 'string' && exId.startsWith('exr_');
  const secondChanceUrl =
    primaryFailed && hasExerciseDbId && !secondChanceFailed
      ? `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/image/${exId}`
      : null;

  // Determine which source to render
  if (primaryUrl && !primaryFailed) {
    return (
      <Image
        source={{
          uri: primaryUrl,
          headers: primaryUrl.includes('rapidapi') ? {
            'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
          } : undefined,
        }}
        style={styles.exerciseImagePlaceholder}
        resizeMode="cover"
        onError={() => setFailedImages(prev => ({ ...prev, [exercise.id]: true }))}
      />
    );
  }

  if (secondChanceUrl) {
    return (
      <Image
        source={{
          uri: secondChanceUrl,
          headers: {
            'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
            'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
          },
        }}
        style={styles.exerciseImagePlaceholder}
        resizeMode="cover"
        onError={() => setSecondChanceFailed(true)}
      />
    );
  }

  // Final fallback: muscle group avatar
  return (
    <View style={[styles.exerciseImagePlaceholder, { alignItems: 'center', justifyContent: 'center' }]}>
      <Image
        source={{ uri: muscleAvatar }}
        style={{ width: 44, height: 44 }}
        resizeMode="contain"
      />
    </View>
  );
};

export const ActiveWorkoutExerciseList = ({
  exercises,
  isTimeBasedExercise,
  resolveExerciseImageUri,
  getMuscleImageUrl,
  failedImages,
  setFailedImages,
  activeTimerSetIds,
  setActiveTimerSetIds,
  toggleSetCompletion,
  handleDeleteSet,
  openEditSetModal,
  openAddSetModal,
  handleMarkAllSets,
  triggerAddExerciseModal,
  closeWorkout,
}) => {
  if (exercises.length === 0) {
    return (
      <View style={styles.emptyWorkoutContainer}>
        <View style={styles.dumbbellIconContainer}>
          <Svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <Path
              d="M6.5 6H7.5V18H6.5V6ZM17.5 6H16.5V18H17.5V6ZM4 8H6V16H4V8ZM20 8H18V16H20V8ZM7.5 11H16.5V13H7.5V11ZM2 10H3V14H2V10ZM22 10H21V14H22V10Z"
              fill="#EE822A"
            />
          </Svg>
        </View>

        <Text style={styles.getStartedTitle}>Get started</Text>
        <Text style={styles.getStartedSubtitle}>
          Select an exercise to kick off your workout and crush your goals!
        </Text>

        <TouchableOpacity
          style={styles.addExerciseBlueBtn}
          onPress={triggerAddExerciseModal}
        >
          <Text style={styles.addExerciseBlueText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={styles.emptyActionRow}>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => { }}>
            <Text style={styles.settingsBtnText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.discardBtn} onPress={closeWorkout}>
            <Text style={styles.discardBtnText}>Discard Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ width: '100%' }}>
      {exercises.map((exercise, index) => (
        <View
          key={exercise.id || exercise.exerciseId || `exercise-${index}`}
          style={[styles.exerciseContainer, index > 0 && { marginTop: 20 }]}
        >
          <View style={styles.exerciseHeader}>
            <ExerciseAvatar
              exercise={exercise}
              resolveExerciseImageUri={resolveExerciseImageUri}
              getMuscleImageUrl={getMuscleImageUrl}
              failedImages={failedImages}
              setFailedImages={setFailedImages}
            />
            <View style={styles.exerciseHeaderTextContainer}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              {(() => {
                const validSets = Array.isArray(exercise.sets)
                  ? exercise.sets
                  : [];
                const totalSets = validSets.length;
                const completedSets = validSets.filter(
                  s => s.completed,
                ).length;

                if (totalSets > 0 && completedSets > 0) {
                  const isTimeEx = isTimeBasedExercise(exercise);
                  const totalVal = validSets
                    .filter(s => s.completed)
                    .reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0);
                  const valStr = totalVal > 0
                    ? (isTimeEx
                      ? ` · ${parseFloat(totalVal.toFixed(2))}s`
                      : ` · ${parseFloat(totalVal.toFixed(2))}kg`)
                    : '';
                  return (
                    <Text
                      style={[
                        styles.exerciseSubtitle,
                        { color: '#008000', fontWeight: '500' },
                      ]}
                    >
                      {completedSets}/{totalSets} logged{valStr}
                    </Text>
                  );
                }
                return (
                  <Text style={styles.exerciseSubtitle}>
                    {totalSets} sets
                  </Text>
                );
              })()}
            </View>
            {(() => {
              const validSets = Array.isArray(exercise.sets)
                ? exercise.sets
                : [];
              const totalSets = validSets.length;
              const completedSets = validSets.filter(
                s => s.completed,
              ).length;
              const isAllCompleted =
                totalSets > 0 && completedSets === totalSets;

              if (isAllCompleted) {
                return (
                  <View style={styles.allCompletedCheckCircle}>
                    <Svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke="#FFF"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                );
              }

              return null;
            })()}
          </View>

          <Text style={styles.addNoteText}>Add note...</Text>

          {(Array.isArray(exercise.sets) ? exercise.sets : []).length > 0 && (
            <View style={styles.tableHeader}>
              <Text style={styles.colSet}>SET</Text>
              <Text style={styles.colPrevious}>PREVIOUS</Text>
              <Text style={styles.colReps}>REPS</Text>
              <Text style={styles.colWeight}>{isTimeBasedExercise(exercise) ? 'TIME (SEC)' : 'WEIGHT (KG)'}</Text>
            </View>
          )}

          {(Array.isArray(exercise.sets) ? exercise.sets : []).map(
            (set, idx) => (
              <SwipeableSetRow
                key={set.id}
                set={set}
                idx={idx}
                exercise={exercise}
                isTimeBasedExercise={isTimeBasedExercise}
                activeTimerSetIds={activeTimerSetIds}
                setActiveTimerSetIds={setActiveTimerSetIds}
                toggleSetCompletion={toggleSetCompletion}
                onDeleteSet={(setId) => handleDeleteSet(exercise.id, setId)}
                openEditSetModal={openEditSetModal}
              />
            ),
          )}

          <View style={styles.exerciseFooter}>
            <TouchableOpacity
              style={styles.addSetBtn}
              onPress={() => openAddSetModal(exercise.id)}
            >
              <View style={styles.addSetPlusIcon}>
                <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 5v14M5 12h14"
                    stroke="#FFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <Text style={styles.addSetText}>ADD SET</Text>
            </TouchableOpacity>

            {(Array.isArray(exercise.sets) ? exercise.sets : []).length > 0 && (() => {
              const sets = Array.isArray(exercise.sets) ? exercise.sets : [];
              const allCompleted = sets.length > 0 && sets.every(s => s.completed);
              return (
                <TouchableOpacity
                  style={styles.markAllBtn}
                  onPress={() => handleMarkAllSets(exercise.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.markAllText, allCompleted && { color: '#4CD964' }]}>
                    {allCompleted ? 'UNMARK ALL SETS' : 'MARK ALL SETS'}
                  </Text>
                  <View style={[styles.doubleCheckCircle, allCompleted && { borderColor: '#4CD964', backgroundColor: 'rgba(76, 217, 100, 0.2)' }]}>
                    <Svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke={allCompleted ? '#4CD964' : '#888'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>
      ))}

      {exercises.length > 0 && (
        <TouchableOpacity
          style={styles.addExerciseOuterBtn}
          onPress={triggerAddExerciseModal}
          activeOpacity={0.8}
        >
          <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
            <Path d="M12 5v14M5 12h14" stroke="#EE822A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.addExerciseOuterBtnText}>ADD EXERCISE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyWorkoutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    width: '100%',
  },
  dumbbellIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(238, 130, 42, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(238, 130, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  getStartedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  getStartedSubtitle: {
    color: '#8E8E9A',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  addExerciseBlueBtn: {
    backgroundColor: '#EE822A',
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EE822A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addExerciseBlueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  settingsBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  discardBtn: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardBtnText: {
    color: '#FF453A',
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseContainer: { marginBottom: 10 },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  exerciseImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1C2430',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  exerciseHeaderTextContainer: { flex: 1, marginLeft: 15 },
  exerciseName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseSubtitle: { color: '#AAA', fontSize: 13 },
  allCompletedCheckCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#008000',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addNoteText: { color: '#888', fontSize: 14, marginBottom: 20 },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  colSet: {
    flex: 1,
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  colPrevious: {
    flex: 2,
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  colReps: {
    flex: 1,
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  colWeight: {
    flex: 1.5,
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 5,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  addSetPlusIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addSetText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  markAllBtn: { flexDirection: 'row', alignItems: 'center' },
  markAllText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginRight: 8,
  },
  doubleCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addExerciseOuterBtn: {
    backgroundColor: 'rgba(238, 130, 42, 0.12)',
    borderRadius: 20,
    height: 38,
    paddingHorizontal: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(238, 130, 42, 0.4)',
  },
  addExerciseOuterBtnText: {
    color: '#EE822A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ActiveWorkoutExerciseList;
