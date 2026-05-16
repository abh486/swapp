import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, FlatList, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { getCustomWorkoutTemplates } from '../../redux/actions/workoutActions';

const CurrentWorkoutPlanScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const folders = await dispatch(getCustomWorkoutTemplates());
        // Flatten all workouts from all folders
        const allWorkouts = [];
        folders.forEach(folder => {
          if (folder.workouts && folder.workouts.length > 0) {
            folder.workouts.forEach(w => w.folderName = folder.name);
            allWorkouts.push(...folder.workouts);
          }
        });
        setWorkouts(allWorkouts);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [dispatch]);

  const handleStartWorkout = () => {
    if (workouts.length > 0) {
      navigation.navigate('FastWorkoutActive', {
        level: 'Custom',
        duration: workouts[0].duration || '60 min',
        exercises: workouts[0].exercises || [],
        workoutName: workouts[0].name,
        templateId: workouts[0].id
      });
    }
  };

  const renderWorkoutItem = ({ item }) => (
    <View style={styles.workoutItem}>
      <View style={styles.titleRow}>
        <Text style={styles.workoutTitle}>{item.name}</Text>
        <View style={styles.folderBadge}>
          <Text style={styles.folderBadgeText}>{item.folderName}</Text>
        </View>
      </View>
      <Text style={styles.workoutSubtitle}>
        Muscles: {item.muscles && item.muscles.length > 0 ? item.muscles.join(', ').toUpperCase() : 'FULL BODY'} • Equip: {item.equipment || 'Any'}
      </Text>
      <View style={styles.exerciseList}>
        {item.exercises && item.exercises.map((ex, idx) => (
          <Text key={idx} style={styles.exerciseText}>
            • {ex.name} ({ex.sets || 3} sets x {ex.reps || 12} reps @ {ex.weight || '4.00'}kg)
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Top Image Section */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=2070' }}
        style={styles.imageBackground}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.currentWorkoutPill} onPress={() => navigation.goBack()}>
              <View style={styles.listIconCircle}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <Path d="M4 6H20M4 12H20M4 18H20" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                </Svg>
              </View>
              <Text style={styles.currentWorkoutText}>Current Workout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.tag}><Text style={styles.tagText}>Intermediate</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Basic Gym</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>45min</Text></View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom Sheet Section */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Select WORKOUT to start</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
        ) : workouts.length === 0 ? (
          <Text style={styles.emptyText}>No custom workouts found. Create one first!</Text>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={item => item.id}
            renderItem={renderWorkoutItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <TouchableOpacity
          style={[styles.startBtn, workouts.length === 0 && styles.startBtnDisabled]}
          disabled={workouts.length === 0}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageBackground: { height: '45%', width: '100%', justifyContent: 'space-between' },
  safeArea: { flex: 1, justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20 },
  headerRow: { flexDirection: 'row' },
  currentWorkoutPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 7, 100, 0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  listIconCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  currentWorkoutText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  tagsContainer: { alignItems: 'flex-end', gap: 10, paddingBottom: 20 },
  tag: { backgroundColor: 'rgba(59, 7, 100, 0.9)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  tagText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  bottomSheet: { flex: 1, backgroundColor: '#000', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, padding: 25 },
  sheetTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  listContent: { paddingBottom: 80 },
  workoutItem: { marginBottom: 25, backgroundColor: '#1A1A2E', padding: 15, borderRadius: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  workoutTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  folderBadge: { backgroundColor: 'rgba(168, 85, 247, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  folderBadgeText: { color: '#A855F7', fontSize: 11, fontWeight: 'bold' },
  workoutSubtitle: { color: '#A855F7', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  exerciseList: { paddingLeft: 5 },
  exerciseText: { color: '#CCC', fontSize: 13, marginBottom: 6 },
  emptyText: { color: '#888', fontSize: 15, textAlign: 'center', marginTop: 40 },

  startBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#3B0764', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

export default CurrentWorkoutPlanScreen;
