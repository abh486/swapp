import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, ScrollView, StatusBar, SafeAreaView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { getCustomWorkoutTemplates } from '../../redux/actions/workoutActions';

const CurrentWorkoutPlanScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(0);

  const getWorkoutKey = workout =>
    workout.id || workout._id || workout.name || JSON.stringify(workout);

  const getExerciseKey = exercise =>
    String(exercise.name || exercise.id || exercise._id || JSON.stringify(exercise))
      .trim()
      .toLowerCase();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchTemplates = async () => {
        setLoading(true);
        try {
          const folders = await dispatch(getCustomWorkoutTemplates());
          const templateFolders = Array.isArray(folders) ? folders : [];
          const selectedFolder =
            templateFolders.find(folder => Array.isArray(folder.workouts) && folder.workouts.length > 0) ||
            templateFolders[0];
          const folderWorkouts = Array.isArray(selectedFolder?.workouts)
            ? selectedFolder.workouts
            : [];
          const uniqueWorkouts = Array.from(
            new Map(folderWorkouts.map(workout => [getWorkoutKey(workout), workout])).values(),
          );

          if (isActive) {
            setWorkouts(uniqueWorkouts);
            setSelectedWorkoutIndex(0);
          }
        } catch (err) {
          console.error('Failed to fetch templates:', err);
          if (isActive) {
            setWorkouts([]);
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchTemplates();

      return () => {
        isActive = false;
      };
    }, [dispatch])
  );

  const handleStartWorkout = () => {
    if (workouts.length > 0 && selectedWorkoutIndex < workouts.length) {
      const selectedWorkout = workouts[selectedWorkoutIndex];
      navigation.navigate('FastWorkoutActive', {
        level: 'Custom',
        duration: selectedWorkout.duration || '60 min',
        exercises: selectedWorkout.exercises || [],
        workoutName: selectedWorkout.name,
        templateId: selectedWorkout.id
      });
    }
  };

  const getExerciseLine = exercise => {
    const sets = Array.isArray(exercise.sets) ? exercise.sets.length : exercise.sets || 3;
    const reps = Array.isArray(exercise.sets)
      ? exercise.sets[0]?.reps || 12
      : exercise.reps || 12;
    const weight = Array.isArray(exercise.sets)
      ? exercise.sets[0]?.weight
      : exercise.weight;

    return weight ? `${sets} sets of ${reps} reps at ${weight} kg` : `${sets} sets of ${reps} reps`;
  };

  const getExerciseImageUri = exercise =>
    exercise.gifUrl ||
    exercise.imageUrl ||
    exercise.image ||
    exercise.thumbnail ||
    exercise.thumbnailUrl ||
    exercise.photoUrl;

  const renderExerciseCard = (exercise, workoutIndex, exerciseIndex) => (
    <TouchableOpacity
      key={`${workoutIndex}-${exercise.id || exercise.name || exerciseIndex}`}
      style={[
        styles.exerciseCard,
        selectedWorkoutIndex === workoutIndex && styles.exerciseCardActive,
      ]}
      activeOpacity={0.85}
      onPress={() => setSelectedWorkoutIndex(workoutIndex)}
    >
      {getExerciseImageUri(exercise) ? (
        <Image
          source={{ uri: getExerciseImageUri(exercise) }}
          style={styles.exerciseThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.exerciseThumb} />
      )}
      <View style={styles.exerciseCopy}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.name || 'Exercise'}
        </Text>
        <Text style={styles.exerciseMeta} numberOfLines={1}>
          {getExerciseLine(exercise)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderWorkoutSection = (item, index) => {
    const isSelected = index === selectedWorkoutIndex;
    const exercises = Array.isArray(item.exercises)
      ? Array.from(
        new Map(item.exercises.map(exercise => [getExerciseKey(exercise), exercise])).values(),
      )
      : [];

    return (
      <View
        key={item.id || `${item.name}-${index}`}
        style={styles.workoutSection}
      >
        <Text style={[styles.sectionTitle, isSelected && styles.sectionTitleActive]}>
          WORKOUT {index + 1}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {exercises.length} {exercises.length === 1 ? 'Exercise' : 'Exercises'}
        </Text>
        {exercises.length > 0 ? (
          exercises.map((ex, idx) => renderExerciseCard(ex, index, idx))
        ) : (
          <View style={[styles.exerciseCard, isSelected && styles.exerciseCardActive]}>
            <View style={styles.exerciseThumb} />
            <View style={styles.exerciseCopy}>
              <Text style={styles.exerciseName}>No exercises added</Text>
              <Text style={styles.exerciseMeta}>Select another workout</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Image Section */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=2070' }}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <View style={styles.imageScrim} />
        <View style={styles.imageFade} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.currentWorkoutPill} onPress={() => navigation.goBack()}>
              <View style={styles.listIconCircleOuter}>
                <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 7H19M5 12H19M5 17H19" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
                  <Path d="M7 5V19M10 5V19M13 5V19M16 5V19" stroke="#111" strokeWidth="1.1" strokeLinecap="round" opacity="0.45" />
                </Svg>
              </View>
              <Text style={styles.currentWorkoutText}>Current Workout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>Intermediate</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Basic Gym</Text></View>
            <View style={styles.tagSmall}><Text style={styles.tagText}>45min</Text></View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <View style={styles.content}>
        {loading ? (
          <GlobalLoader size={60} style={{ marginTop: 40 }} />
        ) : workouts.length === 0 ? (
          <Text style={styles.emptyText}>No custom workouts found. Create one first!</Text>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {workouts.map((item, index) => renderWorkoutSection(item, index))}
          </ScrollView>
        )}

        <TouchableOpacity
          style={[styles.startBtn, workouts.length === 0 && styles.startBtnDisabled]}
          disabled={workouts.length === 0}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startBtnText}>Select Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageBackground: {
    height: 418,
    maxHeight: '43%',
    width: '100%',
    overflow: 'hidden',
  },
  imageScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  currentWorkoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B0058',
    minHeight: 42,
    paddingLeft: 3,
    paddingRight: 17,
    borderRadius: 23,
  },
  listIconCircleOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  currentWorkoutText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tagsContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 18,
    paddingBottom: 5,
  },
  tag: {
    backgroundColor: '#3B0058',
    minWidth: 96,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  tagSmall: {
    backgroundColor: '#3B0058',
    minWidth: 68,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  tagText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  content: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: -4,
    paddingHorizontal: 22,
  },
  listContent: {
    paddingTop: 11,
    paddingBottom: 132,
  },
  workoutSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  sectionTitleActive: {
    color: '#FFF',
  },
  sectionSubtitle: {
    color: '#CFCFCF',
    fontSize: 13,
    marginBottom: 16,
  },
  exerciseCard: {
    minHeight: 75,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F3F3F3',
    paddingHorizontal: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  exerciseCardActive: {
    borderColor: '#FFFFFF',
  },
  exerciseThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginRight: 15,
  },
  exerciseCopy: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  exerciseMeta: {
    color: '#8E8E8E',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center', marginTop: 40 },

  startBtn: {
    position: 'absolute',
    bottom: 38,
    alignSelf: 'center',
    backgroundColor: '#3B0058',
    width: 148,
    height: 43,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.7 },
});

export default CurrentWorkoutPlanScreen;
