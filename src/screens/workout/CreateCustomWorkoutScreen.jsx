import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEquipments, fetchMuscles, fetchExercises, saveCustomWorkoutTemplate } from '../../redux/actions/workoutActions';
import LinearGradient from 'react-native-linear-gradient';

// --- Main Screen: Workout Groups ---
const CreateCustomWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  const [folders, setFolders] = useState([]);
  const [isFolderModalVisible, setFolderModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [activeFolder, setActiveFolder] = useState(null);

  const { equipments, muscles, loading } = useSelector((state) => state.workout);

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  // Workout Modal State
  const [isWorkoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipement');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [workoutNameInput, setWorkoutNameInput] = useState('');

  const equipmentList = equipments && equipments.length > 0
    ? ['All Equipement', ...equipments.map(e => e.name || e)]
    : ['All Equipement', 'None', 'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other'];

  const musclesList = muscles && muscles.length > 0
    ? ['All Muscles', ...muscles.map(m => m.name || m)]
    : ['All Muscles', 'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Cardio', 'Chest', 'Forearms', 'Full Body', 'Glutes', 'Hamstrings', 'Lats', 'Lower back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back', 'Other'];

  const toggleMuscle = (muscle) => {
    if (muscle === 'All Muscles') {
      setSelectedMuscles([]);
      return;
    }
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const handleCreateFolder = () => {
    if (folderName.trim() === '') return;
    const newFolder = { id: Date.now().toString(), name: folderName, workouts: [] };
    setFolders([...folders, newFolder]);
    setFolderName('');
    setFolderModalVisible(false);
    setActiveFolder(newFolder);
  };

  const handleBackPress = () => {
    if (activeFolder) {
      setActiveFolder(null);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateWorkoutBtn = () => {
    if (!activeFolder && folders.length === 0) {
      const newFolder = { id: Date.now().toString(), name: "Morning", workouts: [] };
      setFolders([newFolder]);
      setActiveFolder(newFolder);
    }
    setWorkoutModalVisible(true);
  };

  const handleSaveWorkout = async () => {
    const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');
    const folderToUse = activeFolder || (folders.length > 0 ? folders[0] : null);
    
    let formattedExercises = [];
    
    const knownBodyParts = ['back', 'cardio', 'chest', 'lower arms', 'lower legs', 'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'];
    const selectedBodyParts = [];
    const selectedTargetMuscles = [];

    cleanedMuscles.forEach(m => {
      const lowerM = m.toLowerCase();
      if (knownBodyParts.includes(lowerM)) {
        selectedBodyParts.push(lowerM);
      } else {
        selectedTargetMuscles.push(lowerM);
      }
    });

    const fetchedExercises = await dispatch(fetchExercises({
      limit: 10,
      equipments: selectedEquipment !== 'All Equipement' ? selectedEquipment.toLowerCase() : undefined,
      bodyParts: selectedBodyParts.length > 0 ? selectedBodyParts : undefined,
      targetMuscles: selectedTargetMuscles.length > 0 ? selectedTargetMuscles : undefined
    }));

    if (fetchedExercises) {
      formattedExercises = fetchedExercises.map(ex => ({
        ...ex,
        id: ex.id || ex._id,
        sets: 3,
        reps: 12,
        weight: '4.00',
        loggedSets: 0,
        isCompleted: false
      }));
    }

    if (folderToUse) {
      const newWorkout = {
        id: Date.now().toString(),
        name: workoutNameInput.trim() || `WORKOUT ${folderToUse.workouts.length + 1}`,
        muscles: cleanedMuscles,
        duration: '60 min',
        calories: '60 kcal',
        equipment: selectedEquipment,
        exercises: formattedExercises.length > 0 ? formattedExercises : [
          { id: '1', name: 'Dumbbell Bench Press', sets: 3, reps: 12, weight: '4.00', loggedSets: 0, isCompleted: false },
          { id: '2', name: 'Dumbbell Fly', sets: 2, reps: 15, weight: '4.00', loggedSets: 0, isCompleted: false },
          { id: '3', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '6.00', loggedSets: 0, isCompleted: false },
          { id: '4', name: 'Cable Crossover', sets: 3, reps: 12, weight: '5.00', loggedSets: 0, isCompleted: false },
        ]
      };

      const updatedFolder = { ...folderToUse, workouts: [...folderToUse.workouts, newWorkout] };
      setFolders(folders.map(f => f.id === updatedFolder.id ? updatedFolder : f));
      setActiveFolder(updatedFolder);
      
      // Save to backend
      try {
        await dispatch(saveCustomWorkoutTemplate(updatedFolder.name, updatedFolder.workouts));
      } catch (err) {
        console.error('Failed to sync custom workout folder', err);
      }
    }

    setWorkoutModalVisible(false);
    setSelectedMuscles([]);
    setSelectedEquipment('All Equipement');
    setWorkoutNameInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.headerPillContainer}>
          <TouchableOpacity style={styles.createWorkoutPill} activeOpacity={0.8} onPress={handleCreateWorkoutBtn}>
            <Image source={require('../../assets/image/threedot.png')} style={styles.threedotIcon} resizeMode="contain" />
            <Text style={styles.createWorkoutPillText}>Create a Custom Workout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.groupsSection}>
          <Text style={styles.groupsTitleNew}>Workout Groups</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foldersScrollContainer}>
            {folders.map((folder) => {
              const isActive = activeFolder && activeFolder.id === folder.id;
              return (
                <TouchableOpacity key={folder.id} style={[styles.folderPill, isActive && styles.folderPillActive]} onPress={() => setActiveFolder(folder)}>
                  <Text style={[styles.folderPillText, isActive && styles.folderPillTextActive]}>{folder.name}</Text>
                </TouchableOpacity>
              );
            })}
            
            <TouchableOpacity style={styles.createFolderPill} activeOpacity={0.7} onPress={() => setFolderModalVisible(true)}>
              <Text style={styles.createFolderPillText}>Create Folder</Text>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{marginLeft: 4}}>
                <Path d="M12 5V19M5 12H19" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {(!activeFolder || activeFolder.workouts.length === 0) && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>Your workout space is empty.</Text>
              <Text style={styles.emptyStateSubtitle}>Build your first routine and start{'\n'}tracking progress.</Text>
              
              <TouchableOpacity style={styles.createWorkoutInnerBtn} onPress={handleCreateWorkoutBtn}>
                <Text style={styles.createWorkoutInnerBtnText}>Create new Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeFolder && activeFolder.workouts.length > 0 && (
          <View style={styles.workoutsContainer}>
            {activeFolder.workouts.map(workout => (
              <View key={workout.id} style={styles.workoutCardContainer}>
                <LinearGradient colors={['#3B0764', '#1E0A3C']} style={StyleSheet.absoluteFill} borderRadius={24} />
                <View style={styles.workoutCardContent}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  
                  <View style={styles.tagsRow}>
                    {workout.muscles.length > 0 ? workout.muscles.slice(0, 3).map((m, i) => (
                      <View key={i} style={styles.tagPill}>
                        <Text style={styles.tagText}>{m.toUpperCase()}</Text>
                      </View>
                    )) : (
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>FULL BODY</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.statsRow}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="9" stroke="#FFF" strokeWidth="1.5" />
                      <Path d="M12 7V12L15 15" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.statText}>{workout.duration}</Text>
                    <View style={{width: 15}} />
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2C12 2 7 7 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 7 12 2 12 2Z" stroke="#FFF" strokeWidth="1.5" />
                    </Svg>
                    <Text style={styles.statText}>{workout.calories}</Text>
                  </View>

                  {/* FIX: Added || [] to ensure we always pass an array to FastWorkoutActive */}
                  <TouchableOpacity 
                    style={styles.workoutChevronBtn} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('FastWorkoutActive', { 
                      level: 'Custom',
                      duration: 'Custom',
                      exercises: workout.exercises || [],
                      workoutName: workout.name
                    })}
                  >
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path d="M9 18L15 12L9 6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isFolderModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFolderModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : null}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <TouchableOpacity onPress={() => setFolderModalVisible(false)} style={styles.closeButton}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Folder name</Text>
              <TextInput style={styles.folderInput} placeholder="e.g. Morning" placeholderTextColor="#555" value={folderName} onChangeText={setFolderName} autoFocus />
            </View>
            <TouchableOpacity style={styles.modalCreateButton} onPress={handleCreateFolder}>
              <Text style={styles.modalCreateButtonText}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Equipment/Muscles Modal */}
      <Modal visible={isWorkoutModalVisible} animationType="slide" transparent={true}>
        <View style={styles.fullModalContainer}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'Equipment' && styles.tabButtonActive]} onPress={() => setActiveTab('Equipment')}>
              <Text style={[styles.tabText, activeTab === 'Equipment' && styles.tabTextActive]}>Equipment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'Muscles' && styles.tabButtonActive]} onPress={() => setActiveTab('Muscles')}>
              <Text style={[styles.tabText, activeTab === 'Muscles' && styles.tabTextActive]}>Muscles</Text>
            </TouchableOpacity>
          </View>

          {/* Content Container */}
          <View style={styles.fullModalContentContainer}>
            <View style={styles.modalHandle} />
            <TextInput 
              style={styles.workoutNameInput} 
              placeholder="Enter Workout Name (e.g. Leg Day)" 
              placeholderTextColor="#888" 
              value={workoutNameInput} 
              onChangeText={setWorkoutNameInput} 
            />
            <Text style={styles.modalTitle}>{activeTab === 'Equipment' ? 'Equipment' : 'Muscles'}</Text>
            <View style={styles.modalDivider} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
              {activeTab === 'Equipment' ? (
                equipmentList.map((item, index) => {
                  const isChecked = selectedEquipment === item;
                  return (
                    <View key={index}>
                      <TouchableOpacity style={styles.listItem} onPress={() => setSelectedEquipment(item)}>
                        <View style={styles.iconCircle} />
                        <Text style={styles.listItemText}>{item}</Text>
                        {isChecked && (
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.checkmark}>
                            <Path d="M5 13L9 17L19 7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemDivider} />
                    </View>
                  )
                })
              ) : (
                musclesList.map((item, index) => {
                  const isChecked = selectedMuscles.includes(item);
                  return (
                    <View key={index}>
                      <TouchableOpacity style={styles.listItem} onPress={() => toggleMuscle(item)}>
                        <View style={styles.iconCircle} />
                        <Text style={styles.listItemText}>{item}</Text>
                        {isChecked && (
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.checkmark}>
                            <Path d="M5 13L9 17L19 7" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemDivider} />
                    </View>
                  )
                })
              )}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>

          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity style={styles.floatingSaveBtn} onPress={handleSaveWorkout} disabled={loading}>
              <Text style={styles.floatingSaveBtnText}>{loading ? 'Loading...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.floatingSaveBtn, {backgroundColor: '#2A2A40', marginLeft: 10}]} onPress={() => setWorkoutModalVisible(false)}>
              <Text style={styles.floatingSaveBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- New Screen: Workout Editor ---
export const WorkoutEditorScreen = ({ route }) => {
  const navigation = useNavigation();
  
  // FIX: Ensure route.params.exercises falls back to an empty array if undefined
  const [workoutName, setWorkoutName] = useState(route.params?.workoutName || '');
  const routeExercises = route.params?.exercises || [];

  const [exercises, setExercises] = useState(routeExercises.length > 0 
    ? routeExercises.map(ex => ({...ex, loggedSets: ex.loggedSets || 0, isCompleted: ex.isCompleted || false})) 
    : [
        { id: '1', name: 'Dumbbell Bench Press', sets: 3, reps: 12, weight: '4.00', loggedSets: 0, isCompleted: false },
        { id: '2', name: 'Dumbbell Fly', sets: 2, reps: 15, weight: '4.00', loggedSets: 0, isCompleted: false },
        { id: '3', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '6.00', loggedSets: 0, isCompleted: false },
        { id: '4', name: 'Cable Crossover', sets: 3, reps: 12, weight: '5.00', loggedSets: 0, isCompleted: false },
      ]
  );

  const [activeExerciseId, setActiveExerciseId] = useState(exercises.length > 0 ? exercises[0].id : null);

  // Get current day for the header (e.g., "Friday")
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];

  // Handle the click logic: 1/3 -> 2/3 -> 3/3 -> complete
  const handleLogSet = (id) => {
    setExercises(prevExercises => {
      const updatedExercises = prevExercises.map(ex => {
        if (ex.id === id) {
          const newLoggedSets = ex.loggedSets + 1;
          const isNowCompleted = newLoggedSets >= ex.sets;
          return { ...ex, loggedSets: newLoggedSets, isCompleted: isNowCompleted };
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.editorHeaderTitle}>{currentDay}</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.editorContent}>
          <TextInput
            style={styles.workoutNameInput}
            placeholder="Workout name"
            placeholderTextColor="#555"
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          {/* Stats Summary Row */}
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
            <Text style={styles.exercisesLabel}>EXERCISES ({exercises.length})</Text>
            <TouchableOpacity style={styles.addExerciseButton}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path d="M12 5V19M5 12H19" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
              <Text style={styles.addExerciseText}>Add exercise +</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Exercise List */}
          <View style={styles.exercisesList}>
            {exercises.map((exercise) => {
              const isActive = exercise.id === activeExerciseId && !exercise.isCompleted;
              const isDone = exercise.isCompleted;

              return (
                <TouchableOpacity 
                  key={exercise.id} 
                  style={[styles.exerciseCard, isActive && styles.exerciseCardActive, isDone && styles.exerciseCardDone]} 
                  onPress={() => handleLogSet(exercise.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.exerciseTopRow}>
                    <Text style={[styles.exerciseName, isDone && styles.exerciseNameDone]}>{exercise.name}</Text>
                    
                    <View style={[styles.loggedBadge, isDone && styles.loggedBadgeDone, isActive && styles.loggedBadgeActive]}>
                      <Text style={[styles.loggedBadgeText, isDone && styles.loggedBadgeTextDone, isActive && styles.loggedBadgeTextActive]}>
                        {exercise.loggedSets}/{exercise.sets} logged {isDone ? '✓' : `· ${exercise.weight}kg`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.setsRow}>
                    <Text style={styles.setsText}>{exercise.sets} sets · {exercise.reps} reps</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Rest Timer UI */}
          <View style={styles.restTimerContainer}>
            <Text style={styles.restTimerLabel}>REST TIME</Text>
            <View style={styles.restTimerBox}>
              <Text style={styles.restTimerValue}>01:00</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  headerPillContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'flex-start',
  },
  createWorkoutPill: {
    backgroundColor: '#2A0548',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingRight: 20,
    paddingVertical: 5,
    paddingLeft: 5,
  },
  threedotIcon: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  createWorkoutPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  plusIcon: {
    marginRight: 10,
  },
  groupsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  groupsTitleNew: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 20,
  },
  foldersScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
  },
  folderPill: {
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#3A3A4A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  folderPillActive: {
    backgroundColor: '#2A0548',
    borderColor: '#E9D5FF', // Light purple/white border as in image
  },
  folderPillText: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '600',
  },
  folderPillTextActive: {
    color: '#FFFFFF',
  },
  createFolderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#3A3A4A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  createFolderPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    alignItems: 'center',
    flex: 1,
  },
  emptyStateBox: {
    borderWidth: 1.5,
    borderColor: '#555566', // Lighter dashed border
    borderStyle: 'dashed',
    borderRadius: 40, // Large border radius
    paddingVertical: 45,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F16', // Slightly lighter black for the box
  },
  emptyStateTitle: {
    color: '#FFFFFF', // White title
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#8E8E9A',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30, // Space before the button
  },
  createWorkoutInnerBtn: {
    backgroundColor: '#2A0548', // Dark purple background
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // Rounded pill
  },
  createWorkoutInnerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#15151F',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  folderInput: {
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
  },
  modalCreateButton: {
    backgroundColor: '#7C3AED',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- Purple Workout Card UI ---
  workoutsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 40,
  },
  workoutCardContainer: {
    width: '100%',
    height: 150,
    marginBottom: 20,
    position: 'relative',
    borderRadius: 24,
    shadowColor: '#3B0764',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  workoutCardContent: {
    flex: 1,
    padding: 24,
    position: 'relative',
  },
  workoutName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  tagPill: {
    backgroundColor: '#32104E',
    borderWidth: 1,
    borderColor: '#4A1C78',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#E0E0E0',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  workoutChevronBtn: {
    position: 'absolute',
    right: -10, 
    top: '40%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B0764',
    borderWidth: 2,
    borderColor: '#15151F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  // --- Equipment/Muscles Full Modal ---
  fullModalContainer: { flex: 1, backgroundColor: '#0A0A12', paddingTop: 50 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  tabButton: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingVertical: 10, alignItems: 'center', marginHorizontal: 5 },
  tabButtonActive: { borderColor: '#4A148C', backgroundColor: '#2D1B4E' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#D8B4E2' },
  fullModalContentContainer: { flex: 1, borderWidth: 1, borderColor: '#444', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 15, borderBottomWidth: 0, marginHorizontal: 10 },
  workoutNameInput: { backgroundColor: '#1C1C2E', color: '#FFF', fontSize: 16, padding: 15, marginHorizontal: 20, marginTop: 10, marginBottom: 5, borderRadius: 12, borderWidth: 1, borderColor: '#2D2D44' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalDivider: { height: 1, backgroundColor: '#333', width: '100%' },
  listContainer: { paddingHorizontal: 20, paddingTop: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#666', marginRight: 15 },
  listItemText: { color: '#fff', fontSize: 15, flex: 1 },
  itemDivider: { height: 1, backgroundColor: '#333', width: '100%' },
  checkmark: { marginLeft: 'auto' },
  floatingButtonContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  floatingSaveBtn: { flex: 1, backgroundColor: '#7C3AED', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  floatingSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // --- Workout Editor Styles ---
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  editorHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
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
    color: '#7C3AED',
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
    borderColor: '#7C3AED',
    backgroundColor: '#1A1025',
    shadowColor: '#7C3AED',
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
    borderColor: '#7C3AED',
    backgroundColor: '#2D1B4E',
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
    color: '#D8B4E2',
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
});

export default CreateCustomWorkoutScreen;