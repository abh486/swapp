import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image, PanResponder, Animated} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEquipments,
  fetchMuscles,
  fetchExercises,
  saveCustomWorkoutTemplate,
  getCustomWorkoutTemplates,
  setSelectedFilters,
} from '../../redux/actions/workoutActions';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsiveMetrics } from '../../utils/responsive';

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_BODY_PARTS_MAP = {
  Beginner: ['cardio', 'neck'],
  Intermediate: ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  Advanced: ['waist', 'lower arms', 'lower legs'],
};

const OptionChip = ({ styles, title, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onSelect}
    activeOpacity={0.7}>
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{title}</Text>
  </TouchableOpacity>
);

const CreateCustomWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [folders, setFolders] = useState([]);
  const [isFolderModalVisible, setFolderModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [activeFolder, setActiveFolder] = useState(null);

  const { equipments, muscles, loading } = useSelector(state => state.workout);

  const { wp, hp, ms, sp, fs, isLandscape } = useResponsiveMetrics();
  const responsiveStyles = createCustomWorkoutCreationStyles({ wp, hp, ms, sp, fs, isLandscape });

  const [currentStep, setCurrentStep] = useState(1); // 1 = Config screen, 2 = Folders screen
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [selectedEnv, setSelectedEnv] = useState('BASIC GYM');
  const [selectedDuration, setSelectedDuration] = useState('45min');

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const backendFolders = await dispatch(getCustomWorkoutTemplates());
        if (backendFolders && backendFolders.length > 0) {
          setFolders(backendFolders);
          setActiveFolder(prev => prev || backendFolders[0]);
        }
      } catch (err) {
        console.error('Failed to load custom workout folders:', err);
      }
    };
    loadFolders();
  }, [dispatch]);

  // Workout Modal State
  const [isWorkoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pan = React.useRef(new Animated.ValueXY()).current;

  const equipmentList =
    equipments && equipments.length > 0
      ? ['All Equipement', ...equipments.map(e => e.name || e)]
      : [
          'All Equipement',
          'None',
          'Barbell',
          'Dumbbell',
          'Kettlebell',
          'Machine',
          'Plate',
          'Resistance Band',
          'Suspension Band',
          'Other',
        ];

  const musclesList =
    muscles && muscles.length > 0
      ? ['All Muscles', ...muscles.map(m => m.name || m)]
      : [
          'All Muscles',
          'Abdominals',
          'Abductors',
          'Adductors',
          'Biceps',
          'Calves',
          'Cardio',
          'Chest',
          'Forearms',
          'Full Body',
          'Glutes',
          'Hamstrings',
          'Lats',
          'Lower back',
          'Neck',
          'Quadriceps',
          'Shoulders',
          'Traps',
          'Triceps',
          'Upper Back',
          'Other',
        ];

  const filteredList = (activeTab === 'Equipment' ? equipmentList : musclesList)
    .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleMuscle = muscle => {
    if (muscle === 'All Muscles') {
      setSelectedMuscles(prev => prev.includes(muscle) ? [] : [muscle]);
      return;
    }
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
    } else {
      setSelectedMuscles([
        ...selectedMuscles.filter(m => m !== 'All Muscles'),
        muscle,
      ]);
    }
  };

  const handleCreateFolder = () => {
    if (folderName.trim() === '') return;
    const newFolder = {
      id: Date.now().toString(),
      name: folderName,
      workouts: [],
    };
    setFolders([...folders, newFolder]);
    setFolderName('');
    setFolderModalVisible(false);
    setActiveFolder(newFolder);
  };

  const handleBackPress = () => {
    if (activeFolder) {
      setActiveFolder(null);
    } else {
      setCurrentStep(1);
    }
  };

  const handleCreateWorkoutBtn = () => {
    if (!activeFolder) {
      if (folders.length === 0) {
        const newFolder = {
          id: Date.now().toString(),
          name: 'Morning',
          workouts: [],
        };
        setFolders([newFolder]);
        setActiveFolder(newFolder);
      } else {
        setActiveFolder(folders[0]);
      }
    }
    setWorkoutModalVisible(true);
  };

  const handleSaveWorkout = async () => {
    setIsSaving(true);
    try {
      dispatch(setSelectedFilters(selectedEquipment, selectedMuscles));
      const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');
      const folderToUse =
        activeFolder || (folders.length > 0 ? folders[0] : null);

      const UI_TO_API_MUSCLE_MAP = {
        abdominals: { type: 'target', value: 'abs' },
        abductors: { type: 'target', value: 'abductors' },
        adductors: { type: 'target', value: 'adductors' },
        biceps: { type: 'target', value: 'biceps' },
        calves: { type: 'target', value: 'calves' },
        cardio: { type: 'bodyPart', value: 'cardio' },
        chest: { type: 'bodyPart', value: 'chest' },
        forearms: { type: 'target', value: 'forearms' },
        glutes: { type: 'target', value: 'glutes' },
        hamstrings: { type: 'target', value: 'hamstrings' },
        lats: { type: 'target', value: 'lats' },
        'lower back': { type: 'target', value: 'spine' },
        neck: { type: 'bodyPart', value: 'neck' },
        quadriceps: { type: 'target', value: 'quads' },
        shoulders: { type: 'bodyPart', value: 'shoulders' },
        traps: { type: 'target', value: 'traps' },
        triceps: { type: 'target', value: 'triceps' },
        'upper back': { type: 'target', value: 'upper back' },
      };

      const UI_TO_API_EQUIPMENT_MAP = {
        none: 'body weight',
        machine: 'cable',
        plate: 'weighted',
        'suspension band': 'leverage machine',
      };

      const selectedBodyParts = [];
      const selectedTargetMuscles = [];

      cleanedMuscles.forEach(m => {
        const lowerM = m.toLowerCase();
        if (UI_TO_API_MUSCLE_MAP[lowerM]) {
          const mapping = UI_TO_API_MUSCLE_MAP[lowerM];
          if (mapping.type === 'bodyPart') {
            selectedBodyParts.push(mapping.value);
          } else {
            selectedTargetMuscles.push(mapping.value);
          }
        } else {
          selectedTargetMuscles.push(lowerM);
        }
      });

      const eqKey = selectedEquipment.toLowerCase();
      const apiEquipment =
        UI_TO_API_EQUIPMENT_MAP[eqKey] ||
        (selectedEquipment && selectedEquipment !== 'All Equipement'
          ? eqKey
          : undefined);

      const fetchedExercises = await dispatch(
        fetchExercises({
          limit: 30,
          equipments: apiEquipment,
          bodyParts:
            selectedBodyParts.length > 0 ? selectedBodyParts : undefined,
          targetMuscles:
            selectedTargetMuscles.length > 0
              ? selectedTargetMuscles
              : undefined,
        }),
      );

      let finalExercises = fetchedExercises || [];

      let formattedExercises = finalExercises.slice(0, 30).map(ex => ({
        ...ex,
        id: ex.id || ex._id,
        gifUrl: ex.gifUrl,
        sets: 3,
        reps: 12,
        weight: '4.00',
        loggedSets: 0,
        isCompleted: false,
      }));

      let targetFolder = folderToUse;
      if (!targetFolder) {
        targetFolder = {
          id: Date.now().toString(),
          name: 'Morning',
          workouts: [],
        };
      }

      const newWorkout = {
        id: Date.now().toString(),
        name:
          workoutNameInput.trim() ||
          `WORKOUT ${targetFolder.workouts.length + 1}`,
        muscles: cleanedMuscles,
        duration: selectedDuration,
        calories: '60 kcal',
        equipment: selectedEquipment || 'All Equipement',
        exercises: formattedExercises,
      };

      const updatedFolder = {
        ...targetFolder,
        workouts: [...targetFolder.workouts, newWorkout],
      };

      const folderExists = folders.some(f => f.id === updatedFolder.id);
      const updatedFoldersList = folderExists
        ? folders.map(f => (f.id === updatedFolder.id ? updatedFolder : f))
        : [...folders, updatedFolder];

      setFolders(updatedFoldersList);
      setActiveFolder(updatedFolder);

      await dispatch(
        saveCustomWorkoutTemplate(updatedFolder.name, updatedFolder.workouts),
      );

      // Close modal and clean up states
      setWorkoutModalVisible(false);
      setSelectedMuscles([]);
      setSelectedEquipment('');
      setWorkoutNameInput('');

      // Auto-navigate to FastWorkoutActive with the newly created custom workout!
      navigation.navigate('FastWorkoutActive', {
        level: selectedLevel,
        duration: selectedDuration,
        exercises: newWorkout.exercises || [],
        workoutName: newWorkout.name,
      });
    } catch (error) {
      console.error('Failed to save custom workout:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkoutRef = React.useRef();
  handleSaveWorkoutRef.current = handleSaveWorkout;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSaving,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > 240 - 46 - 20) {
          Animated.spring(pan, {
            toValue: { x: 240 - 46, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            handleSaveWorkoutRef.current?.();
            Animated.timing(pan, {
              toValue: { x: 0, y: 0 },
              duration: 0,
              useNativeDriver: false,
            }).start();
          }, 300);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  // Render Step 1: Configuration Screen
  if (currentStep === 1) {
    return (
      <SafeAreaView style={responsiveStyles.container}>
        {/* Header */}
        <View style={responsiveStyles.header}>
          <TouchableOpacity
            style={responsiveStyles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <View style={responsiveStyles.headerPill}>
            <Image
              source={require('../../assets/image/threedot.png')}
              style={responsiveStyles.lightningIcon}
              resizeMode="contain"
            />
            <Text style={responsiveStyles.headerTitle}>Create a Custom Workout</Text>
          </View>
        </View>

        {/* Card */}
        <View style={responsiveStyles.card}>
          <Text style={responsiveStyles.sectionLabel}>LEVEL</Text>
          <View style={responsiveStyles.optionsRow}>
            {['Beginner', 'Intermediate', 'Advanced'].map(level => (
              <OptionChip
                styles={responsiveStyles}
                key={level}
                title={level}
                isSelected={selectedLevel === level}
                onSelect={() => setSelectedLevel(level)}
              />
            ))}
          </View>

          <Text style={responsiveStyles.sectionLabel}>TRAINING ENVIRONMENT</Text>
          <View style={responsiveStyles.optionsRow}>
            {['ADVANCED GYM', 'BASIC GYM', 'AT-HOME GYM', 'ZERO EQUIPMENT', 'PERSONALISED'].map(env => (
              <OptionChip
                styles={responsiveStyles}
                key={env}
                title={env}
                isSelected={selectedEnv === env}
                onSelect={() => setSelectedEnv(env)}
              />
            ))}
          </View>

          <Text style={responsiveStyles.sectionLabel}>WORKOUT DURATION</Text>
          <View style={responsiveStyles.optionsRow}>
            {['30min', '45min', '50min', 'Choose Duration'].map(dur => (
              <OptionChip
                styles={responsiveStyles}
                key={dur}
                title={dur}
                isSelected={selectedDuration === dur}
                onSelect={() => setSelectedDuration(dur)}
              />
            ))}
          </View>

          {/* Proceed Button */}
          <View style={responsiveStyles.addExerciseArea}>
            <TouchableOpacity
              style={responsiveStyles.proceedButton}
              onPress={() => setCurrentStep(2)}
              activeOpacity={0.85}
            >
              <Text style={responsiveStyles.proceedButtonText}>Proceed to Workout Groups</Text>
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
                <Path
                  d="M9 5L16 12L9 19"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render Step 2: Folders/Groups list Screen
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 40, gap: 10 }}>
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
          <View style={[styles.headerPillContainer, { marginTop: 0, marginBottom: 0, paddingHorizontal: 0 }]}>
            <TouchableOpacity
              style={styles.createWorkoutPill}
              activeOpacity={0.8}
              onPress={handleCreateWorkoutBtn}
            >
              <Image
                source={require('../../assets/image/threedot.png')}
                style={styles.threedotIcon}
                resizeMode="contain"
              />
              <Text style={styles.createWorkoutPillText}>
                Create a Custom Workout
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
              >
                <Text style={styles.createWorkoutInnerBtnText}>
                  Create new Workout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeFolder && activeFolder.workouts.length > 0 && (
          <View style={styles.workoutsContainer}>
            {activeFolder.workouts.map(workout => (
              <View key={workout.id} style={styles.workoutCardContainer}>
                <LinearGradient
                  colors={['#3B0764', '#1E0A3C']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={24}
                />
                <View style={styles.workoutCardContent}>
                  <Text style={styles.workoutName}>{workout.name}</Text>

                  <View style={styles.tagsRow}>
                    {workout.muscles.length > 0 ? (
                      workout.muscles.slice(0, 3).map((m, i) => (
                        <View key={i} style={styles.tagPill}>
                          <Text style={styles.tagText}>{m.toUpperCase()}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.tagPill}>
                        <Text style={styles.tagText}>FULL BODY</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.statsRow}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="#FFF"
                        strokeWidth="1.5"
                      />
                      <Path
                        d="M12 7V12L15 15"
                        stroke="#FFF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
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
                    <Text style={styles.statText}>{workout.calories}</Text>
                  </View>

                  {/* Chevron triggers player */}
                  <TouchableOpacity
                    style={styles.workoutChevronBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('FastWorkoutActive', {
                        level: selectedLevel,
                        duration: selectedDuration,
                        exercises: workout.exercises || [],
                        workoutName: workout.name,
                      })
                    }
                  >
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 18L15 12L9 6"
                        stroke="#FFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isFolderModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Folder</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFolderModalVisible(false)}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FOLDER NAME</Text>
              <TextInput
                style={styles.folderInput}
                placeholder="Enter folder name"
                placeholderTextColor="#555"
                value={folderName}
                onChangeText={setFolderName}
              />
            </View>

            <TouchableOpacity
              style={styles.modalCreateButton}
              onPress={handleCreateFolder}
            >
              <Text style={styles.modalCreateButtonText}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isWorkoutModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.fullModalContainer}>
          <TouchableOpacity
            style={styles.selectorBackButton}
            onPress={() => setWorkoutModalVisible(false)}
            activeOpacity={0.8}
          >
            <Svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Exercise"
              placeholderTextColor="#444"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'Equipment' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveTab('Equipment');
                setSearchQuery('');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Equipment' && styles.tabTextActive,
                ]}
              >
                All Equipment
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'Muscles' && styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveTab('Muscles');
                setSearchQuery('');
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'Muscles' && styles.tabTextActive,
                ]}
              >
                All Muscles
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Container */}
          <View style={styles.fullModalContentContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.selectionModalTitle}>
              {activeTab === 'Equipment' ? 'Equipment' : 'Muscles'}
            </Text>
            <View style={styles.modalDivider} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            >
              {filteredList.map((item, index) => {
                const isChecked =
                  activeTab === 'Equipment'
                    ? selectedEquipment === item
                    : selectedMuscles.includes(item);

                return (
                  <View key={index}>
                    <TouchableOpacity
                      style={styles.listItem}
                      onPress={() =>
                        activeTab === 'Equipment'
                          ? setSelectedEquipment(item)
                          : toggleMuscle(item)
                      }
                    >
                      <View style={styles.iconCircle}>
                        {index === 0 && (
                          <Svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <Path
                              d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z"
                              stroke="#FFFFFF"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        )}
                      </View>
                      <Text style={styles.listItemText}>{item}</Text>
                      {isChecked && (
                        <View style={styles.checkmark}>
                          <Svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <Path
                              d="M20 6L9 17L4 12"
                              stroke="#7C3AED"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.itemDivider} />
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Input field for workout name */}
          <TextInput
            style={styles.workoutNameInput}
            placeholder="Name your workout (optional)"
            placeholderTextColor="#555"
            value={workoutNameInput}
            onChangeText={setWorkoutNameInput}
          />

          {/* Swipe Button */}
          <View style={styles.floatingButtonContainer}>
            <View style={[styles.floatingButtonBg, { width: 240 }]}>
              <Text style={styles.floatingButtonTextBg}>
                Swipe to Save Workout
              </Text>
              <Svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                style={{ position: 'absolute', right: 12 }}
              >
                <Path
                  d="M9 18L15 12L9 6"
                  stroke="#555"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M13 18L19 12L13 6"
                  stroke="#3a3a3a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M17 18L23 12L17 6"
                  stroke="#222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Animated.View
                style={[
                  styles.swipeThumb,
                  {
                    transform: [
                      {
                        translateX: pan.x.interpolate({
                          inputRange: [0, 240 - 46],
                          outputRange: [0, 240 - 46],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.floatingButtonIcon}>
                  {isSaving ? (
                    <GlobalLoader size={30} />
                  ) : (
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5V19M5 12H19"
                        stroke="#7C3AED"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </Svg>
                  )}
                </View>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createCustomWorkoutCreationStyles = ({ wp, hp, ms, sp, fs, isLandscape }) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sp(18),
      paddingTop: sp(14),
      paddingBottom: sp(10),
      gap: sp(10)
    },
    backButton: {
      padding: sp(4),
    },
    headerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#3B0764',
      alignSelf: 'flex-start',
      paddingRight: sp(18),
      paddingLeft: 0,
      borderRadius: ms(22),
      minHeight: ms(44),
    },
    lightningIcon: { width: ms(32), height: ms(32), marginLeft: ms(10), marginRight: sp(6) },
    headerTitle: { fontSize: fs(13), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
    card: {
      flex: 1,
      borderRadius: ms(44),
      marginHorizontal: sp(10),
      marginBottom: sp(14),
      paddingHorizontal: sp(22),
      paddingTop: sp(24),
      paddingBottom: sp(20),
      borderWidth: 1.3,
      borderColor: 'rgba(255,255,255,0.88)',
      backgroundColor: 'transparent',
    },
    sectionLabel: {
      color: '#FFFFFF',
      fontSize: 9.5,
      fontWeight: '800',
      letterSpacing: 2.2,
      marginBottom: 10,
    },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 18 },
    chip: {
      backgroundColor: '#000000',
      paddingVertical: 8,
      paddingHorizontal: 13,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#314057',
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipSelected: { backgroundColor: '#48075F', borderColor: '#48075F' },
    chipText: { color: '#AEB4C0', fontSize: 11, fontWeight: '600' },
    chipTextSelected: { color: '#FFFFFF' },
    addExerciseArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    proceedButton: {
      backgroundColor: '#3B0764',
      flexDirection: 'row',
      height: 52,
      borderRadius: 26,
      paddingHorizontal: 26,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    proceedButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  });


// --- New Screen: Workout Editor ---
export const WorkoutEditorScreen = ({ route }) => {
  const navigation = useNavigation();
  const [isRestTimerVisible, setRestTimerVisible] = useState(false);
  const [restSeconds, setRestSeconds] = useState(40);

  // FIX: Ensure route.params.exercises falls back to an empty array if undefined
  const [workoutName, setWorkoutName] = useState(
    route.params?.workoutName || '',
  );
  const routeExercises = route.params?.exercises || [];

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
            reps: 12,
            weight: '4.00',
            loggedSets: 0,
            isCompleted: false,
          },
          {
            id: '2',
            name: 'Dumbbell Fly',
            sets: 2,
            reps: 15,
            weight: '4.00',
            loggedSets: 0,
            isCompleted: false,
          },
          {
            id: '3',
            name: 'Incline Dumbbell Press',
            sets: 3,
            reps: 10,
            weight: '6.00',
            loggedSets: 0,
            isCompleted: false,
          },
          {
            id: '4',
            name: 'Cable Crossover',
            sets: 3,
            reps: 12,
            weight: '5.00',
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

  // Get current day for the header (e.g., "Friday")
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

  // Handle the click logic: 1/3 -> 2/3 -> 3/3 -> complete
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
            <Text style={styles.exercisesLabel}>
              EXERCISES ({exercises.length})
            </Text>
            <TouchableOpacity style={styles.addExerciseButton}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 5V19M5 12H19"
                  stroke="#7C3AED"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
              <Text style={styles.addExerciseText}>Add exercise +</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Exercise List */}
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

          {/* Rest Timer UI */}
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

// --- Styles ---
const sliderWidth = 46;
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
  fullModalContainer: { flex: 1, backgroundColor: '#000000', paddingTop: 128 },
  selectorBackButton: {
    position: 'absolute',
    top: 42,
    left: 26,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    marginHorizontal: 26,
    height: 48,
    marginBottom: 24,
    backgroundColor: '#000000',
  },
  searchInput: {
    color: '#fff',
    marginLeft: 12,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 26,
    marginBottom: 50,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  tabButtonActive: { borderColor: '#FFFFFF', backgroundColor: '#3A0751' },
  tabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  fullModalContentContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 54,
    borderTopRightRadius: 54,
    paddingTop: 24,
    borderBottomWidth: 0,
    marginHorizontal: 24,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  workoutNameInput: {
    backgroundColor: '#000000',
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 18,
    height: 48,
    marginHorizontal: 36,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  modalHandle: {
    width: 54,
    height: 6,
    backgroundColor: '#D9DDE2',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  selectionModalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalDivider: { height: 1, backgroundColor: '#B8B8B8', width: '100%' },
  listContainer: { paddingHorizontal: 36, paddingTop: 22 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, minHeight: 72 },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginRight: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemText: { color: '#fff', fontSize: 17, flex: 1, fontWeight: '700' },
  itemDivider: { height: 1, backgroundColor: '#A8A8A8', width: '100%' },
  checkmark: { marginLeft: 'auto' },
  floatingButtonContainer: { alignItems: 'center', paddingVertical: 16 },
  floatingButtonBg: {
    backgroundColor: '#2A0A3A',
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#3D1A54',
    overflow: 'hidden',
  },
  floatingButtonTextBg: {
    color: '#777',
    fontSize: 11,
    fontWeight: 'bold',
    position: 'absolute',
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  swipeThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: sliderWidth,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  floatingButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

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
  restTimerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  restTimerBackdrop: { ...StyleSheet.absoluteFillObject },
  restTimerSheet: {
    height: '55%',
    marginHorizontal: 8,
    backgroundColor: '#12051C',
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
    backgroundColor: '#2A0A3A',
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
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

export default CreateCustomWorkoutScreen;
