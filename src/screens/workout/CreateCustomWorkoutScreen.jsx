import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import {
  fetchEquipments,
  fetchMuscles,
  saveCustomWorkoutTemplate,
  getCustomWorkoutTemplates,
  deleteCustomWorkoutFolder,
  renameCustomWorkoutFolder,
  resolveExerciseImageUri,
  getExerciseMuscleFallback,
} from '../../redux/actions/workoutActions';
import { CreateFolderModal } from './components/CreateFolderModal';
import { CustomWorkoutModal } from './components/CustomWorkoutModal';
import { calculateWorkoutCalories } from '../../utils/workoutCalorieCalculator';
import { WorkoutEditorScreen } from './WorkoutEditorScreen';

export { WorkoutEditorScreen };

const EXERCISE_TO_MUSCLE = {
  'bench press': 'Chest',
  'incline bench': 'Chest',
  'decline bench': 'Chest',
  'dumbbell fly': 'Chest',
  'chest fly': 'Chest',
  'push up': 'Chest',
  'overhead press': 'Shoulders',
  'lateral raise': 'Shoulders',
  'front raise': 'Shoulders',
  'shrugs': 'Shoulders',
  'bicep curl': 'Biceps',
  'biceps curl': 'Biceps',
  'hammer curl': 'Biceps',
  'barbell curl': 'Biceps',
  'concentration curl': 'Biceps',
  'preacher curl': 'Biceps',
  'curl': 'Biceps',
  'tricep pushdown': 'Arms',
  'overhead tricep extension': 'Arms',
  'skull crusher': 'Arms',
  'dip': 'Arms',
  'pull up': 'Back',
  'lat pulldown': 'Back',
  'bent over row': 'Back',
  'deadlift': 'Back',
  't-bar row': 'Back',
  'squat': 'Legs',
  'leg press': 'Legs',
  'leg extension': 'Legs',
  'leg curl': 'Legs',
  'calf raise': 'Legs',
  'lunge': 'Legs',
  'crunch': 'Core',
  'plank': 'Core',
  'leg raise': 'Core',
  'russian twist': 'Core',
};

const mapBodyPartToMuscleGroup = (bodyPart, exerciseName = '') => {
  if (!bodyPart) return null;
  const bp = bodyPart.toLowerCase().trim();
  const nameLower = exerciseName.toLowerCase();

  if (bp.includes('upper arms') || bp.includes('lower arms') || bp.includes('arms')) {
    if (nameLower.includes('tricep') || nameLower.includes('dip') || nameLower.includes('extension')) {
      return 'arms';
    }
    if (nameLower.includes('bicep') || nameLower.includes('curl') || nameLower.includes('chin') || nameLower.includes('preacher')) {
      return 'biceps';
    }
    return 'arms';
  }
  if (bp.includes('chest') || bp.includes('pectorals')) return 'chest';
  if (bp.includes('shoulders') || bp.includes('deltoids')) return 'shoulders';
  if (bp.includes('upper legs') || bp.includes('lower legs') || bp.includes('legs') || bp.includes('quadriceps') || bp.includes('hamstrings') || bp.includes('calves') || bp.includes('glutes')) return 'legs';
  if (bp.includes('back') || bp.includes('lats') || bp.includes('traps') || bp.includes('spine')) return 'back';
  if (bp.includes('waist') || bp.includes('core') || bp.includes('abs') || bp.includes('abdominals') || bp.includes('cardio')) return 'core';
  return bp;
};

const getWorkoutMuscles = (wk) => {
  if (wk.muscles && wk.muscles.length > 0 && wk.muscles[0].toLowerCase() !== 'full body') {
    return wk.muscles.map(m => mapBodyPartToMuscleGroup(m) || m);
  }
  const list = new Set();
  const exList = wk.exercises || [];
  exList.forEach(ex => {
    const nameLower = ex.name.toLowerCase();
    let found = false;
    for (const [key, muscle] of Object.entries(EXERCISE_TO_MUSCLE)) {
      if (nameLower.includes(key)) {
        list.add(muscle.toLowerCase());
        found = true;
        break;
      }
    }
    if (!found) {
      const bp = ex.bodyPart || ex.target;
      if (bp) {
        const mapped = mapBodyPartToMuscleGroup(bp, ex.name);
        if (mapped) {
          list.add(mapped.toLowerCase());
        }
      }
    }
  });
  const result = Array.from(list).slice(0, 3);
  return result.length > 0 ? result : ['chest', 'back', 'legs'];
};

const CreateCustomWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  const [folders, setFolders] = useState([]);
  const { user } = useAuth() || {};
  const userId = user?.id || user?.userId || user?.user_id;
  const foldersKey = userId ? `@cached_custom_workout_folders_${userId}` : '@cached_custom_workout_folders';

  const [activeFolder, setActiveFolder] = useState(null);
  const [isFolderModalVisible, setFolderModalVisible] = useState(false);
  const [isWorkoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [reopenModalOnFocus, setReopenModalOnFocus] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [renameInputValue, setRenameInputValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const { equipments, muscles } = useSelector(state => state.workout);

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  useEffect(() => {
    if (isFocused && reopenModalOnFocus) {
      setWorkoutModalVisible(true);
      setReopenModalOnFocus(false);
    }
  }, [isFocused, reopenModalOnFocus]);

  useEffect(() => {
    if (isFocused) {
      const loadFolders = async () => {
        try {
          const cached = await AsyncStorage.getItem(foldersKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const filteredCached = parsed.filter(f => f.name && f.name.toLowerCase() !== 'highflying');
              setFolders(filteredCached);
              setActiveFolder(prev => (prev && prev.name?.toLowerCase() !== 'highflying') ? prev : filteredCached[0] || null);
            }
          } else {
            setFolders([]);
          }
        } catch (e) { }

        try {
          const backendFolders = await dispatch(getCustomWorkoutTemplates());
          if (Array.isArray(backendFolders)) {
            const filteredBackend = backendFolders.filter(f => f.name && f.name.toLowerCase() !== 'highflying');
            setFolders(filteredBackend);
            AsyncStorage.setItem(foldersKey, JSON.stringify(filteredBackend)).catch(() => { });
            setActiveFolder(prev => {
              if (!prev || prev.name?.toLowerCase() === 'highflying') return filteredBackend[0] || null;
              const updated = filteredBackend.find(f => f.name === prev.name || f.id === prev.id);
              return updated || filteredBackend[0] || null;
            });
          }
        } catch (err) {
          console.error('Failed to load custom workout folders:', err);
        }
      };
      loadFolders();
    }
  }, [dispatch, isFocused, foldersKey]);

  const handleDeleteFolder = (folder) => {
    Alert.alert(
      "Delete Workout Group?",
      `Are you sure you want to delete "${folder.name}"? This will delete all custom workouts inside this folder.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const folderIdentifier = folder.id || folder._id || folder.name;
              if (folderIdentifier) {
                try {
                  await dispatch(deleteCustomWorkoutFolder(folderIdentifier));
                } catch (err) {
                  if (folder.name && folder.name !== folderIdentifier) {
                    try {
                      await dispatch(deleteCustomWorkoutFolder(folder.name));
                    } catch (e) {}
                  }
                }
              }

              const updatedFolders = folders.filter(f => f.id !== folder.id && f.name !== folder.name);
              setFolders(updatedFolders);

              await AsyncStorage.setItem(foldersKey, JSON.stringify(updatedFolders));

              if (updatedFolders.length > 0) {
                setActiveFolder(prev => {
                  if (!prev || prev.id === folder.id || prev.name === folder.name) return updatedFolders[0];
                  const updated = updatedFolders.find(f => f.id === prev.id || f.name === prev.name);
                  return updated || updatedFolders[0];
                });
              } else {
                setActiveFolder(null);
              }
            } catch (err) {
              console.error("Failed to delete folder:", err);
              Alert.alert("Error", err.message || "Failed to delete folder.");
            }
          }
        }
      ]
    );
  };

  const handleOpenRename = () => {
    if (!activeFolder) return;
    setRenameInputValue(activeFolder.name || '');
    setSettingsModalVisible(false);
    setTimeout(() => {
      setRenameModalVisible(true);
    }, 250);
  };

  const handleConfirmRename = async () => {
    const trimmed = renameInputValue.trim();
    if (!trimmed) {
      Alert.alert('Invalid Name', 'Please enter a valid folder name.');
      return;
    }
    if (!activeFolder) return;

    if (trimmed.toLowerCase() === activeFolder.name.toLowerCase()) {
      setRenameModalVisible(false);
      return;
    }

    try {
      setIsRenaming(true);
      const folderIdentifier = activeFolder.id || activeFolder._id || activeFolder.name;
      const updated = await dispatch(renameCustomWorkoutFolder(folderIdentifier, trimmed));

      const updatedName = updated?.name || trimmed;
      const updatedFolder = {
        ...activeFolder,
        name: updatedName,
        workouts: updated?.workouts || activeFolder.workouts || [],
      };

      const updatedFolders = folders.map(f =>
        (f.id && f.id === activeFolder.id) || f.name === activeFolder.name ? updatedFolder : f
      );

      setFolders(updatedFolders);
      setActiveFolder(updatedFolder);
      await AsyncStorage.setItem(foldersKey, JSON.stringify(updatedFolders));
      setRenameModalVisible(false);
    } catch (err) {
      console.error('Failed to rename folder:', err);
      Alert.alert('Error', err.message || 'Failed to rename folder.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleOpenDelete = () => {
    if (!activeFolder) return;
    const target = activeFolder;
    setSettingsModalVisible(false);
    setTimeout(() => {
      handleDeleteFolder(target);
    }, 250);
  };

  const handleCreateFolder = (newFolder) => {
    setFolders(prev => {
      const updated = [...prev, newFolder];
      AsyncStorage.setItem(foldersKey, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
    setActiveFolder(newFolder);
    setEditingWorkout(null);
    setFolderModalVisible(false);
    setTimeout(() => {
      setWorkoutModalVisible(true);
    }, 250);
  };

  const handleBackPress = () => {
    if (activeFolder) {
      setActiveFolder(null);
    } else {
      navigation.goBack();
    }
  };

  const handleCreateWorkoutBtn = () => {
    setEditingWorkout(null);
    if (!activeFolder || folders.length === 0) {
      setFolderModalVisible(true);
      return;
    }
    setWorkoutModalVisible(true);
  };

  const handleEditWorkoutBtn = (workout) => {
    setEditingWorkout(workout);
    setWorkoutModalVisible(true);
  };

  const handleSaveWorkout = async ({
    workoutNameInput,
    selectedExercises,
    selectedEquipment,
    editingWorkoutId,
  }) => {
    try {
      const folderToUse = activeFolder || (folders.length > 0 ? folders[0] : null);

      let formattedExercises = selectedExercises.slice(0, 30).map(ex => ({
        ...ex,
        id: ex.id || ex._id,
        gifUrl: ex.gifUrl,
        sets: 3,
        reps: 0,
        weight: '0',
        loggedSets: 0,
        isCompleted: false,
      }));

      let targetFolder = folderToUse;
      if (!targetFolder) {
        targetFolder = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          name: 'Morning',
          workouts: [],
        };
      }

      const durationVal = targetFolder?.duration || '45min';
      const durationMins = parseInt(durationVal) || 45;
      const targetName = workoutNameInput.trim() || (editingWorkoutId ? '' : targetFolder.name);
      const computedCalories = `${calculateWorkoutCalories({
        duration: durationMins,
        isMinutes: true,
        workoutTitle: targetName,
        exercises: formattedExercises,
        completedSetsCount: formattedExercises.length * 3,
      })} kcal`;

      const mappedMuscles = new Set();
      formattedExercises.forEach(ex => {
        const nameLower = ex.name.toLowerCase();
        let found = false;
        for (const [key, muscle] of Object.entries(EXERCISE_TO_MUSCLE)) {
          if (nameLower.includes(key)) {
            mappedMuscles.add(muscle.toLowerCase());
            found = true;
            break;
          }
        }
        if (!found) {
          if (ex.target) {
            mappedMuscles.add(ex.target.toLowerCase());
          }
          if (ex.muscles && Array.isArray(ex.muscles)) {
            ex.muscles.forEach(m => mappedMuscles.add(m.toLowerCase()));
          }
        }
      });
      const uniqueMuscles = Array.from(mappedMuscles).slice(0, 3);
      const finalMuscles = uniqueMuscles.length > 0 ? uniqueMuscles : ['chest', 'back', 'legs'];

      let updatedWorkouts = [...targetFolder.workouts];
      if (editingWorkoutId) {
        updatedWorkouts = updatedWorkouts.map(w => {
          if (w.id === editingWorkoutId) {
            return {
              ...w,
              name: workoutNameInput.trim() || w.name,
              muscles: finalMuscles,
              duration: durationVal,
              calories: computedCalories,
              equipment: selectedEquipment || w.equipment,
              exercises: formattedExercises,
            };
          }
          return w;
        });
      } else {
        const newWorkout = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
          name:
            workoutNameInput.trim() ||
            (targetFolder.workouts.length === 0
              ? targetFolder.name
              : `${targetFolder.name} ${targetFolder.workouts.length + 1}`),
          muscles: finalMuscles,
          duration: durationVal,
          calories: computedCalories,
          equipment: selectedEquipment || 'All Equipment',
          exercises: formattedExercises,
        };
        updatedWorkouts.push(newWorkout);
      }

      const updatedFolder = {
        ...targetFolder,
        workouts: updatedWorkouts,
      };

      const folderExists = folders.some(f => f.id === updatedFolder.id);
      const updatedFoldersList = folderExists
        ? folders.map(f => (f.id === updatedFolder.id ? updatedFolder : f))
        : [...folders, updatedFolder];

      const savedFolder = await dispatch(
        saveCustomWorkoutTemplate(updatedFolder.name, updatedFolder.workouts),
      );

      if (savedFolder) {
        setFolders(prev => prev.map(f => f.name === updatedFolder.name ? savedFolder : f));
        setActiveFolder(savedFolder);
      } else {
        setFolders(updatedFoldersList);
        setActiveFolder(updatedFolder);
      }

      setWorkoutModalVisible(false);
      setEditingWorkout(null);
    } catch (error) {
      console.error('Failed to save custom workout:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Top Navigation Row */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              onPress={handleBackPress}
              activeOpacity={0.8}
              style={{ padding: 4 }}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 19L8 12L15 5"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <View style={styles.createWorkoutPill}>
              <Text style={styles.createWorkoutPillText} numberOfLines={1}>
                {activeFolder ? activeFolder.name : 'Create a Custom Workout'}
              </Text>
            </View>
          </View>

          {activeFolder && (
            <TouchableOpacity
              style={styles.folderSettingsBtn}
              onPress={() => setSettingsModalVisible(true)}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="settings-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Workout Groups Section */}
        <View style={styles.groupsSection}>
          <Text style={styles.groupsTitleNew}>Workout Groups</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.foldersScrollContainer}
          >
            {folders.map(folder => {
              const isActive = activeFolder && activeFolder.id === folder.id;
              return (
                <TouchableOpacity
                  key={folder.id}
                  style={[
                    styles.folderPill,
                    isActive && styles.folderPillActive,
                  ]}
                  onPress={() => setActiveFolder(folder)}
                >
                  <Text
                    style={[
                      styles.folderPillText,
                      isActive && styles.folderPillTextActive,
                    ]}
                  >
                    {folder.name}
                  </Text>

                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.createFolderPill}
              activeOpacity={0.7}
              onPress={() => setFolderModalVisible(true)}
            >
              <Text style={styles.createFolderPillText}>Create Folder</Text>
              <Svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                style={{ marginLeft: 4 }}
              >
                <Path
                  d="M12 5V19M5 12H19"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </ScrollView>
        </View>


        {/* Empty State */}
        {(!activeFolder || activeFolder.workouts.length === 0) && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateTitle}>
                Your workout space is empty.
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                Build your first routine and start{'\n'}tracking progress.
              </Text>

              <TouchableOpacity
                style={styles.createWorkoutInnerBtn}
                onPress={handleCreateWorkoutBtn}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.createWorkoutInnerBtnText}>
                  Create new Workout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Workouts List */}
        {activeFolder && activeFolder.workouts.length > 0 && (
          <View style={styles.workoutsContainer}>
            {activeFolder.workouts.map((workout, idx) => (
              <View
                key={workout.id}
                style={styles.workoutCardContainer}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={24}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <View style={styles.workoutCardContent}>
                  <Text style={styles.workoutDayText}>
                    {activeFolder?.name || `WORKOUT ${idx + 1}`}
                  </Text>
                  {(!workout.name ||
                    workout.name.toLowerCase().startsWith('day ') ||
                    (activeFolder?.name && workout.name.toLowerCase() === activeFolder.name.toLowerCase())
                  ) ? null : (
                    <Text style={styles.workoutName}>{workout.name}</Text>
                  )}

                  <View style={styles.tagsRow}>
                    {(() => {
                      const displayedMuscles = getWorkoutMuscles(workout);
                      return displayedMuscles.map((m, i) => (
                        <View key={i} style={styles.tagPill}>
                          <Text style={styles.tagText}>{m.toUpperCase()}</Text>
                        </View>
                      ));
                    })()}
                  </View>

                  <View style={styles.statsRow}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="9" stroke="#FFF" strokeWidth="1.5" />
                      <Path d="M12 7V12L15 15" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
                    </Svg>
                    <Text style={styles.statText}>{workout.duration}</Text>
                    <View style={{ width: 15 }} />
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 2C12 2 7 7 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 7 12 2 12 2Z"
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                    </Svg>
                    <Text style={styles.statText}>
                      {(!workout.calories || workout.calories === '60 kcal')
                        ? `${calculateWorkoutCalories({
                            duration: parseInt(workout.duration) || 45,
                            isMinutes: true,
                            workoutTitle: workout.name,
                            exercises: workout.exercises || [],
                            completedSetsCount: (workout.exercises?.length || 3) * 3,
                          })} kcal`
                        : workout.calories}
                    </Text>
                  </View>

                  {workout.exercises && workout.exercises.length > 0 && (
                    <View style={styles.exercisesListContainer}>
                      {workout.exercises.slice(0, 5).map((ex, exIdx) => {
                        const imgUri = resolveExerciseImageUri(ex) || ex.imageUrl || ex.gifUrl;
                        const fallback = getExerciseMuscleFallback(ex.bodyPart || ex.target);
                        return (
                          <View key={ex.id || exIdx} style={styles.customExCardRow}>
                            <View style={styles.customExThumbBox}>
                              <Image
                                source={imgUri ? { uri: imgUri } : fallback}
                                defaultSource={fallback}
                                style={styles.customExThumbImg}
                                resizeMode="cover"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.exerciseItemText} numberOfLines={1}>
                                {ex.name}
                              </Text>
                              <Text style={styles.exerciseSubDetailText}>
                                {ex.sets || 3} sets {ex.target ? `• ${ex.target}` : ''}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                      {workout.exercises.length > 5 && (
                        <Text style={styles.moreExercisesText}>
                          +{workout.exercises.length - 5} more exercises
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.editWorkoutBtn}
                      onPress={() => handleEditWorkoutBtn(workout)}
                      activeOpacity={0.8}
                    >
                      <Icon name="create-outline" size={16} color="#FFF" />
                      <Text style={styles.editWorkoutBtnText}>Add / Edit Exercises</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.startWorkoutPill}
                      onPress={() =>
                        navigation.navigate('FastWorkoutActive', {
                          level: 'Intermediate',
                          duration: workout.duration || '45min',
                          exercises: workout.exercises || [],
                          workoutName: workout.name,
                          folderName: activeFolder?.name,
                          templateId: workout.id,
                          source: 'custom_workout',
                          isCustomWorkout: true,
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Text style={styles.startWorkoutPillText}>Start</Text>
                      <Icon name="play-outline" size={12} color="#FFF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Folder Creation Modal */}
      <CreateFolderModal
        visible={isFolderModalVisible}
        onClose={() => setFolderModalVisible(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* Custom Workout Creation / Edit Modal */}
      <CustomWorkoutModal
        visible={isWorkoutModalVisible}
        onClose={() => setWorkoutModalVisible(false)}
        onSaveWorkout={handleSaveWorkout}
        editingWorkout={editingWorkout}
        setReopenModalOnFocus={setReopenModalOnFocus}
      />

      {/* Folder Settings / Options Modal */}
      <Modal
        visible={isSettingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSettingsModalVisible(false)}
        >
          <View style={styles.settingsModalCard} onStartShouldSetResponder={() => true}>
            {/* Modal Header */}
            <View style={styles.settingsModalHeader}>
              <View style={styles.settingsIconBadge}>
                <Icon name="folder-open" size={22} color="#EE822A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsModalFolderTitle} numberOfLines={1}>
                  {activeFolder?.name}
                </Text>
                <Text style={styles.settingsModalFolderSubtitle}>Folder Settings</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsModalCloseBtn}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Icon name="close" size={18} color="#8E8E9A" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsDivider} />

            {/* Options List */}
            <View style={styles.settingsOptionsList}>
              {/* Rename Option */}
              <TouchableOpacity
                style={styles.settingsOptionItem}
                onPress={handleOpenRename}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsOptionIconBox, { backgroundColor: 'rgba(238, 130, 42, 0.15)' }]}>
                  <Icon name="create-outline" size={20} color="#EE822A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsOptionTitle}>Rename Folder</Text>
                  <Text style={styles.settingsOptionDesc}>Change the folder name</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#6B6B7F" />
              </TouchableOpacity>

              {/* Delete Option */}
              <TouchableOpacity
                style={[styles.settingsOptionItem, { marginTop: 10, borderColor: 'rgba(255, 69, 58, 0.3)' }]}
                onPress={handleOpenDelete}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsOptionIconBox, { backgroundColor: 'rgba(255, 69, 58, 0.15)' }]}>
                  <Icon name="trash-outline" size={20} color="#FF453A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsOptionTitle, { color: '#FF453A' }]}>Delete Folder</Text>
                  <Text style={styles.settingsOptionDesc}>Permanently remove folder & routines</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#FF453A" />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.settingsCancelBtn}
              onPress={() => setSettingsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.settingsCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isRenaming && setRenameModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !isRenaming && setRenameModalVisible(false)}
          />
          <View style={styles.renameModalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.renameModalHeader}>
              <View style={[styles.settingsIconBadge, { backgroundColor: 'rgba(238, 130, 42, 0.15)' }]}>
                <Icon name="pencil" size={20} color="#EE822A" />
              </View>
              <Text style={styles.renameModalTitle}>Rename Folder</Text>
              <Text style={styles.renameModalSubtitle}>
                Enter a new name for your custom workout group.
              </Text>
            </View>

            <TextInput
              style={styles.renameInput}
              value={renameInputValue}
              onChangeText={setRenameInputValue}
              placeholder="Folder Name"
              placeholderTextColor="#6B6B7F"
              autoFocus
              maxLength={40}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmRename}
            />

            <View style={styles.renameActionsRow}>
              <TouchableOpacity
                style={styles.renameCancelBtn}
                onPress={() => setRenameModalVisible(false)}
                disabled={isRenaming}
                activeOpacity={0.7}
              >
                <Text style={styles.renameCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.renameSaveBtn}
                onPress={handleConfirmRename}
                disabled={isRenaming || !renameInputValue.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  borderRadius={14}
                />
                <Text style={styles.renameSaveBtnText}>
                  {isRenaming ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 10,
  },
  folderSettingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#3A3A4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createWorkoutPill: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createWorkoutPillText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderPillActive: {
    backgroundColor: '#2A0548',
    borderColor: '#E9D5FF',
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
    borderColor: '#555566',
    borderStyle: 'dashed',
    borderRadius: 40,
    paddingVertical: 45,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F0F16',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
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
    marginBottom: 30,
  },
  createWorkoutInnerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createWorkoutInnerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    paddingBottom: 40,
  },
  workoutCardContainer: {
    width: '100%',
    minHeight: 150,
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
  workoutDayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 4,
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
  exercisesListContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  exerciseItemText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  customExCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 10,
    padding: 6,
    gap: 10,
    marginBottom: 6,
  },
  customExThumbBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  customExThumbImg: {
    width: '100%',
    height: '100%',
  },
  exerciseSubDetailText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  moreExercisesText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  editWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  startWorkoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  startWorkoutPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  settingsModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161622',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2E2E42',
    padding: 22,
  },
  settingsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(238, 130, 42, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModalFolderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  settingsModalFolderSubtitle: {
    color: '#8E8E9A',
    fontSize: 13,
    marginTop: 2,
  },
  settingsModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#20202F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#222234',
    marginVertical: 18,
  },
  settingsOptionsList: {
    gap: 10,
  },
  settingsOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E2D',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A3C',
    gap: 12,
  },
  settingsOptionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsOptionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  settingsOptionDesc: {
    color: '#8E8E9A',
    fontSize: 12,
    marginTop: 2,
  },
  settingsCancelBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#20202F',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E42',
  },
  settingsCancelBtnText: {
    color: '#C0C0D0',
    fontSize: 15,
    fontWeight: '600',
  },
  renameModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161622',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2E2E42',
    padding: 22,
  },
  renameModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  renameModalTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 12,
  },
  renameModalSubtitle: {
    color: '#8E8E9A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 10,
  },
  renameInput: {
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#3A3A4E',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
  renameActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  renameCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#20202F',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E42',
  },
  renameCancelBtnText: {
    color: '#C0C0D0',
    fontSize: 15,
    fontWeight: '600',
  },
  renameSaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  renameSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreateCustomWorkoutScreen;
