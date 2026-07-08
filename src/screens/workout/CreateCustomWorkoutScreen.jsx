import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image, PanResponder, Animated, FlatList, TouchableWithoutFeedback, Alert } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEquipments,
  fetchMuscles,
  fetchExercises,
  saveCustomWorkoutTemplate,
  getCustomWorkoutTemplates,
  setSelectedFilters,
  deleteCustomWorkoutFolder,
} from '../../redux/actions/workoutActions';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsiveMetrics } from '../../utils/responsive';
import exercisesData from '../../assets/exercises.json';

const FiltersIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
    <Path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14H7M9 8H15M17 12H23" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LevelIcon = ({ fillCount, selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="14" width="4" height="6" rx="1.5" fill={fillCount >= 1 ? (selected ? '#007AFF' : '#FFFFFF') : '#33333C'} />
    <Rect x="10" y="10" width="4" height="10" rx="1.5" fill={fillCount >= 2 ? (selected ? '#007AFF' : '#FFFFFF') : '#33333C'} />
    <Rect x="16" y="6" width="4" height="14" rx="1.5" fill={fillCount >= 3 ? (selected ? '#007AFF' : '#FFFFFF') : '#33333C'} />
  </Svg>
);

const FlexArmIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M8.5 7.5c.3-1.6 1.4-2.8 2.7-3.3 1-.4 2.1-.2 2.9.4.8.6 1.2 1.5 1.2 2.6V8c1.3.4 2.3 1.5 2.5 2.8.2 1.4-.4 2.7-1.4 3.5-.8.6-1.8.8-2.7.7-.6 1-1.6 1.7-2.8 1.9-1.2.2-2.3-.2-3.1-1.1L5.5 14c-.6-.6-1-1.4-1.2-2.2-.2-1 .1-2 .7-2.8l1.5-1.5c1-1 2.6-1 3.6 0l1.4 1.4c-.6.6-1 .9-1.5.9-.6 0-1-.4-1-.8V7.5z" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StrengthIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M2 19h20M5 19v-5h14v5M6 10h12M12 10v4M4 7h16M2 7v3M22 7v3" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WeightScaleIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="3" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" />
    <Circle cx="12" cy="10" r="3" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" />
    <Path d="M12 10l2-2" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const GymIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M6 3h12M6 3v18M18 3v18M6 8h12M12 8v10M10 18h4" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DumbbellIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M6 8H4v8h2V8zm12 0h-2v8h2V8zM6 12h12M3 10h1v4H3v-4zm17 0h1v4h-1v-4z" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const StandingPersonIcon = ({ selected }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="2.5" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" />
    <Path d="M12 7.5v7.5M9 9h6M10.5 15v5M13.5 15v5" stroke={selected ? '#007AFF' : '#FFFFFF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LEVEL_BODY_PARTS_MAP_UPPER = {
  BEGINNER: ['cardio', 'neck'],
  INTERMEDIATE: ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  ADVANCED: ['waist', 'lower arms', 'lower legs'],
};

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_BODY_PARTS_MAP = {
  Beginner: ['cardio', 'neck'],
  Intermediate: ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  Advanced: ['waist', 'lower arms', 'lower legs'],
};

const OptionChip = ({ styles, title, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && { borderColor: 'transparent' }]}
    onPress={onSelect}
    activeOpacity={0.7}>
    {isSelected ? (
      <LinearGradient
        colors={['#EE822A', '#8F5D98', '#2E4D9F']}
        style={[StyleSheet.absoluteFillObject, { borderRadius: (styles.chip?.borderRadius ?? 10) }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    ) : null}
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{title}</Text>
  </TouchableOpacity>
);

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
  'russian twist': 'Core'
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

  const [folders, setFolders] = useState([]);
  const [isFolderModalVisible, setFolderModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [activeFolder, setActiveFolder] = useState(null);

  const { equipments, muscles, exercises, loading } = useSelector(state => state.workout);

  const { wp, hp, ms, sp, fs, isLandscape } = useResponsiveMetrics();
  const responsiveStyles = createCustomWorkoutCreationStyles({ wp, hp, ms, sp, fs, isLandscape });

  const [currentStep, setCurrentStep] = useState(2); // Start directly on Folders screen (Step 2)
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [selectedEnv, setSelectedEnv] = useState('BASIC GYM');
  const [selectedDuration, setSelectedDuration] = useState('45min');
  const [customDuration, setCustomDuration] = useState('');

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const loadFolders = async () => {
        try {
          const backendFolders = await dispatch(getCustomWorkoutTemplates());
          if (backendFolders && backendFolders.length > 0) {
            setFolders(backendFolders);
            setActiveFolder(prev => {
              if (!prev) return backendFolders[0];
              const updated = backendFolders.find(f => f.name === prev.name || f.id === prev.id);
              return updated || backendFolders[0];
            });
          }
        } catch (err) {
          console.error('Failed to load custom workout folders:', err);
        }
      };
      loadFolders();
    }
  }, [dispatch, isFocused]);

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
              const isLocalOnly = !folder.id.includes('-');
              if (!isLocalOnly) {
                try {
                  await dispatch(deleteCustomWorkoutFolder(folder.id));
                } catch (err) {
                  if (err.statusCode !== 404 && err.message !== 'Folder not found') {
                    throw err;
                  }
                }
              }

              const updatedFolders = folders.filter(f => f.id !== folder.id);
              setFolders(updatedFolders);

              if (updatedFolders.length > 0) {
                setActiveFolder(prev => {
                  if (!prev) return updatedFolders[0];
                  const updated = updatedFolders.find(f => f.id === prev.id);
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

  const [folderLevel, setFolderLevel] = useState('');
  const [folderGoal, setFolderGoal] = useState('');
  const [folderEquipment, setFolderEquipment] = useState('');
  const [folderDuration, setFolderDuration] = useState('');
  const [folderCustomDuration, setFolderCustomDuration] = useState('');

  const isFolderFormValid = 
    folderName.trim() !== '' &&
    folderLevel !== '' &&
    folderGoal !== '' &&
    folderEquipment !== '' &&
    (folderDuration === 'Custom' ? folderCustomDuration.trim() !== '' : folderDuration !== '');

  const [isWorkoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [isMuscleModalVisible, setIsMuscleModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pan = React.useRef(new Animated.ValueXY()).current;

  const mapFiltersToApi = (level, goal, eq) => {
    const apiFilters = {};
    const bodyPartsForLevel = LEVEL_BODY_PARTS_MAP_UPPER[level] || LEVEL_BODY_PARTS_MAP_UPPER['BEGINNER'];
    apiFilters.bodyParts = bodyPartsForLevel;

    if (eq === 'GYM') {
      apiFilters.equipments = 'barbell,cable,machine,plate,leverage machine,bench';
    } else if (eq === 'DUMBBELLS') {
      apiFilters.equipments = 'dumbbell';
    } else if (eq === 'NONE') {
      apiFilters.equipments = 'body weight';
    }

    if (goal === 'GAIN_MUSCLE') {
      apiFilters.categories = 'strength,powerlifting,strongman';
    } else if (goal === 'STRENGTH') {
      apiFilters.categories = 'strength,powerlifting';
    } else if (goal === 'LOSE_WEIGHT') {
      apiFilters.categories = 'cardio,plyometrics';
    }

    return apiFilters;
  };

  const toggleExerciseSelection = (exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(ex => ex.id === exercise.id)) {
        return prev.filter(ex => ex.id !== exercise.id);
      }
      return [...prev, exercise];
    });
  };

  useEffect(() => {
    if (!isWorkoutModalVisible) return;
    const folderLevelFilter = activeFolder?.level || 'BEGINNER';
    const folderGoalFilter = activeFolder?.goal || '';
    const folderEquipmentFilter = activeFolder?.equipment || '';

    const apiFilters = mapFiltersToApi(folderLevelFilter, folderGoalFilter, folderEquipmentFilter);

    if (selectedEquipment) {
      apiFilters.equipments = selectedEquipment.toLowerCase();
    }
    if (selectedMuscles.length > 0) {
      apiFilters.targetMuscles = selectedMuscles.map(m => m.toLowerCase());
    }

    dispatch(fetchExercises({
      limit: 100,
      ...apiFilters
    }));
  }, [selectedEquipment, selectedMuscles, isWorkoutModalVisible, activeFolder, dispatch]);

  const equipmentList =
    equipments && equipments.length > 0
      ? ['All Equipment', ...equipments.map(e => e.name || e)]
      : [
        'All Equipment',
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

  const selectEquipmentAndClose = (equipment) => {
    setSelectedEquipment(equipment === 'All Equipment' || equipment === 'All Equipement' ? '' : equipment);
    setIsEquipmentModalVisible(false);
  };

  const selectMuscleAndClose = (muscle) => {
    toggleMuscle(muscle);
    setIsMuscleModalVisible(false);
  };

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
    if (!isFolderFormValid) return;
    const newFolder = {
      id: Date.now().toString(),
      name: folderName,
      level: folderLevel,
      goal: folderGoal,
      equipment: folderEquipment,
      duration: folderDuration === 'Custom' ? `${folderCustomDuration}min` : folderDuration,
      workouts: [],
    };
    setFolders([...folders, newFolder]);
    setFolderName('');
    setFolderLevel('');
    setFolderGoal('');
    setFolderEquipment('');
    setFolderDuration('');
    setFolderCustomDuration('');
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
    let finalExercises = selectedExercises || [];
    if (finalExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise for your custom workout.');
      return;
    }

    setIsSaving(true);
    try {
      const folderToUse =
        activeFolder || (folders.length > 0 ? folders[0] : null);

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

      // Extract target muscles dynamically from exercises
      const muscleList = new Set();
      formattedExercises.forEach(ex => {
        if (ex.bodyPart) {
          muscleList.add(ex.bodyPart.toLowerCase());
        }
        if (ex.target) {
          muscleList.add(ex.target.toLowerCase());
        }
        if (ex.muscles && Array.isArray(ex.muscles)) {
          ex.muscles.forEach(m => muscleList.add(m.toLowerCase()));
        }
      });
      
      const durationVal = targetFolder?.duration || (selectedDuration === 'Custom' ? (customDuration ? `${customDuration}min` : '45min') : selectedDuration);
      const durationMins = parseInt(durationVal) || 45;
      const computedCalories = `${Math.round(durationMins * 7.5)} kcal`;

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

      const newWorkout = {
        id: Date.now().toString(),
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

      const updatedFolder = {
        ...targetFolder,
        workouts: [...targetFolder.workouts, newWorkout],
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
      setSelectedEquipment('');
      setSelectedMuscles([]);
      setWorkoutNameInput('');
      setSelectedExercises([]);

      const savedWorkout = savedFolder?.workouts?.find(w => w.name === newWorkout.name) || newWorkout;

      navigation.navigate('FastWorkoutActive', {
        level: folderToUse?.level || 'BEGINNER',
        duration: newWorkout.duration,
        exercises: newWorkout.exercises || [],
        workoutName: newWorkout.name,
        folderName: folderToUse?.name,
        templateId: savedWorkout.id,
        isSetupMode: true,
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

  const displayedExercises = (exercises || []).filter(ex =>
    (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.equipment || (ex.equipments && ex.equipments[0]) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.target || (ex.targetMuscles && ex.targetMuscles[0]) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderExerciseItem = ({ item }) => {
    const target = item.target || (item.targetMuscles && item.targetMuscles[0]) || '';
    const equipment = item.equipment || (item.equipments && item.equipments[0]) || '';
    const imageSource = item.gifUrl
      ? { uri: item.gifUrl, headers: { 'x-api-key': '327a86f1-6475-4c3c-9827-76a85cb04743' } }
      : { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=120' };
    const isSelected = selectedExercises.some(ex => ex.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.exerciseCardCustom, isSelected && styles.exerciseCardSelectedCustom]}
        activeOpacity={0.75}
        onPress={() => toggleExerciseSelection(item)}
      >
        <View style={styles.exerciseRowCustom}>
          <Image source={imageSource} style={styles.exerciseThumbnailCustom} resizeMode="cover" />
          <View style={styles.exerciseInfoCustom}>
            <Text style={styles.exerciseNameCustom}>{item.name}</Text>
            <View style={styles.badgeRowCustom}>
              {target ? (
                <View style={styles.muscleBadgeCustom}>
                  <Text style={styles.badgeTextCustom}>{target}</Text>
                </View>
              ) : null}
              {equipment ? (
                <View style={styles.equipmentBadgeCustom}>
                  <Text style={styles.badgeTextCustom}>{equipment}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.checkboxContainerCustom}>
            {isSelected ? (
              <View style={styles.checkboxSelectedCustom}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            ) : (
              <View style={styles.checkboxUnselectedCustom} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
                  {isActive && (
                    <TouchableOpacity
                      style={styles.deleteFolderBtn}
                      onPress={() => handleDeleteFolder(folder)}
                    >
                      <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M18 6L6 18M6 6L18 18"
                          stroke="#FFF"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </TouchableOpacity>
                  )}
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

        {activeFolder && activeFolder.workouts.length > 0 && (
          <View style={styles.workoutsContainer}>
            {activeFolder.workouts.map((workout, idx) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCardContainer}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate('FastWorkoutActive', {
                    level: selectedLevel,
                    duration: workout.duration || selectedDuration,
                    exercises: workout.exercises || [],
                    workoutName: workout.name,
                    folderName: activeFolder?.name,
                    templateId: workout.id,
                  })
                }
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
                    <Text style={styles.statText}>
                      {(!workout.calories || workout.calories === '60 kcal')
                        ? `${Math.round((parseInt(workout.duration) || 45) * 7.5)} kcal`
                        : workout.calories}
                    </Text>
                  </View>

                  <View style={styles.workoutChevronBtn}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M9 18L15 12L9 6"
                        stroke="#FFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isFolderModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoiding}
          >
            <View style={styles.modalContentLarge}>
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

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: hp(65) }}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>FOLDER NAME</Text>
                  <TextInput
                    style={styles.folderInput}
                    placeholder="Enter folder name"
                    placeholderTextColor="#666"
                    value={folderName}
                    onChangeText={setFolderName}
                  />
                </View>

                <Text style={styles.filterSectionTitle}>Level</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, folderLevel === 'BEGINNER' && styles.filterCardSelected]}
                    onPress={() => setFolderLevel('BEGINNER')}
                  >
                    <LevelIcon fillCount={1} selected={folderLevel === 'BEGINNER'} />
                    <Text style={[styles.filterCardText, folderLevel === 'BEGINNER' && styles.filterCardTextSelected]}>Beginner</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderLevel === 'INTERMEDIATE' && styles.filterCardSelected]}
                    onPress={() => setFolderLevel('INTERMEDIATE')}
                  >
                    <LevelIcon fillCount={2} selected={folderLevel === 'INTERMEDIATE'} />
                    <Text style={[styles.filterCardText, folderLevel === 'INTERMEDIATE' && styles.filterCardTextSelected]}>Medium</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderLevel === 'ADVANCED' && styles.filterCardSelected]}
                    onPress={() => setFolderLevel('ADVANCED')}
                  >
                    <LevelIcon fillCount={3} selected={folderLevel === 'ADVANCED'} />
                    <Text style={[styles.filterCardText, folderLevel === 'ADVANCED' && styles.filterCardTextSelected]}>Advanced</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterSectionTitle}>Goal</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, folderGoal === 'GAIN_MUSCLE' && styles.filterCardSelected]}
                    onPress={() => setFolderGoal(folderGoal === 'GAIN_MUSCLE' ? '' : 'GAIN_MUSCLE')}
                  >
                    <FlexArmIcon selected={folderGoal === 'GAIN_MUSCLE'} />
                    <Text style={[styles.filterCardText, folderGoal === 'GAIN_MUSCLE' && styles.filterCardTextSelected]}>Gain Muscle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderGoal === 'STRENGTH' && styles.filterCardSelected]}
                    onPress={() => setFolderGoal(folderGoal === 'STRENGTH' ? '' : 'STRENGTH')}
                  >
                    <StrengthIcon selected={folderGoal === 'STRENGTH'} />
                    <Text style={[styles.filterCardText, folderGoal === 'STRENGTH' && styles.filterCardTextSelected]}>Strength</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderGoal === 'LOSE_WEIGHT' && styles.filterCardSelected]}
                    onPress={() => setFolderGoal(folderGoal === 'LOSE_WEIGHT' ? '' : 'LOSE_WEIGHT')}
                  >
                    <WeightScaleIcon selected={folderGoal === 'LOSE_WEIGHT'} />
                    <Text style={[styles.filterCardText, folderGoal === 'LOSE_WEIGHT' && styles.filterCardTextSelected]}>Lose Weight</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.filterSectionTitle}>Equipment</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, folderEquipment === 'GYM' && styles.filterCardSelected]}
                    onPress={() => setFolderEquipment('GYM')}
                  >
                    <GymIcon selected={folderEquipment === 'GYM'} />
                    <Text style={[styles.filterCardText, folderEquipment === 'GYM' && styles.filterCardTextSelected]}>Gym</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderEquipment === 'DUMBBELLS' && styles.filterCardSelected]}
                    onPress={() => setFolderEquipment('DUMBBELLS')}
                  >
                    <DumbbellIcon selected={folderEquipment === 'DUMBBELLS'} />
                    <Text style={[styles.filterCardText, folderEquipment === 'DUMBBELLS' && styles.filterCardTextSelected]}>Dumbbells</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterCard, folderEquipment === 'NONE' && styles.filterCardSelected]}
                    onPress={() => setFolderEquipment('NONE')}
                  >
                    <StandingPersonIcon selected={folderEquipment === 'NONE'} />
                    <Text style={[styles.filterCardText, folderEquipment === 'NONE' && styles.filterCardTextSelected]}>None</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>WORKOUT DURATION</Text>
                <View style={[responsiveStyles.optionsRow, { flexWrap: 'wrap', marginBottom: 12 }]}>
                  {['45min', '60min', 'Custom'].map(dur => (
                    <OptionChip
                      styles={responsiveStyles}
                      key={dur}
                      title={dur}
                      isSelected={folderDuration === dur}
                      onSelect={() => setFolderDuration(dur)}
                    />
                  ))}
                </View>

                {folderDuration === 'Custom' && (
                  <View style={styles.customDurationContainer}>
                    <TextInput
                      style={styles.customDurationInput}
                      placeholder="Minutes (e.g. 75)"
                      placeholderTextColor="#555"
                      keyboardType="numeric"
                      value={folderCustomDuration}
                      onChangeText={setFolderCustomDuration}
                    />
                    <Text style={styles.customDurationSuffix}>min</Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  !isFolderFormValid && { backgroundColor: '#333333' }
                ]}
                onPress={handleCreateFolder}
                disabled={!isFolderFormValid}
                activeOpacity={0.8}
              >
                {isFolderFormValid ? (
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                ) : null}
                <Text style={[
                  styles.modalCreateButtonText,
                  !isFolderFormValid && { color: '#666666' }
                ]}>
                  Create Folder
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={isWorkoutModalVisible}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.editorHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setWorkoutModalVisible(false)}
            >
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <View style={styles.headerPillCustom}>
              <Text style={styles.headerPillTextCustom}>Create a Custom Workout</Text>
            </View>
          </View>

          <View style={styles.searchBarCustom}>
            <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <Path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <TextInput
              style={styles.searchInputCustom}
              placeholder="Search Exercise"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setIsEquipmentModalVisible(true)}
            >
              <Text style={styles.filterLabel}>Equipment</Text>
              <Text style={styles.filterValue} numberOfLines={1}>
                {selectedEquipment || 'All Equipment'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setIsMuscleModalVisible(true)}
            >
              <Text style={styles.filterLabel}>Muscle Group</Text>
              <Text style={styles.filterValue} numberOfLines={1}>
                {selectedMuscles.length > 0 ? selectedMuscles.join(', ') : 'All Muscles'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.workoutNameInputCustom}
            placeholder="Name your workout (optional)"
            placeholderTextColor="#555"
            value={workoutNameInput}
            onChangeText={setWorkoutNameInput}
          />

          <View style={styles.listArea}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <GlobalLoader size={60} />
                <Text style={styles.loadingText}>Loading exercises...</Text>
              </View>
            ) : displayedExercises.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No exercises found matching your filters.</Text>
              </View>
            ) : (
              <FlatList
                data={displayedExercises}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={styles.floatingButtonContainer}>
            {selectedExercises.length > 0 ? (
              <TouchableOpacity
                style={styles.addSelectedButtonCustom}
                onPress={handleSaveWorkout}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.addSelectedButtonTextCustom}>
                  Save Selected Exercises ({selectedExercises.length})
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.floatingButtonBg, { width: 240 }]}>
                <Text style={styles.floatingButtonTextBg}>Swipe to Save Workout</Text>
                <Animated.View
                  style={[
                    styles.swipeThumb,
                    {
                      transform: [{
                        translateX: pan.x.interpolate({
                          inputRange: [0, 240 - 46],
                          outputRange: [0, 240 - 46],
                          extrapolate: 'clamp',
                        }),
                      }],
                    },
                  ]}
                  {...panResponder.panHandlers}>
                  <View style={styles.floatingButtonIcon}>
                    {isSaving ? (
                      <GlobalLoader size={30} />
                    ) : (
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <Path d="M12 5V19M5 12H19" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" />
                      </Svg>
                    )}
                  </View>
                </Animated.View>
              </View>
            )}
          </View>
        </SafeAreaView>

        <Modal visible={isEquipmentModalVisible} animationType="slide" transparent>
          <View style={styles.bottomModalOverlay}>
            <View style={styles.bottomModalContentContainer}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Equipment</Text>
                <TouchableOpacity onPress={() => setIsEquipmentModalVisible(false)} style={styles.closeButton}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.modalDivider} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                {equipmentList.map((item, index) => {
                  const isSelected = selectedEquipment === item || (item === 'All Equipment' && !selectedEquipment);
                  return (
                    <View key={index}>
                      <TouchableOpacity style={styles.listItem} onPress={() => selectEquipmentAndClose(item)}>
                        <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>{item}</Text>
                        {isSelected && (
                          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <Path d="M5 13L9 17L19 7" stroke="#007AFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemDivider} />
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={isMuscleModalVisible} animationType="slide" transparent>
          <View style={styles.bottomModalOverlay}>
            <View style={styles.bottomModalContentContainer}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Select Muscle Group</Text>
                <TouchableOpacity onPress={() => setIsMuscleModalVisible(false)} style={styles.closeButton}>
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <Path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.modalDivider} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
                {musclesList.map((item, index) => {
                  const isSelected = selectedMuscles.includes(item) || (item === 'All Muscles' && selectedMuscles.length === 0);
                  return (
                    <View key={index}>
                      <TouchableOpacity style={styles.listItem} onPress={() => toggleMuscle(item)}>
                        <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>{item}</Text>
                        {isSelected && (
                          <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <Path d="M5 13L9 17L19 7" stroke="#007AFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemDivider} />
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalApplyBtn}
                  onPress={() => setIsMuscleModalVisible(false)}
                >
                  <Text style={styles.modalApplyBtnText}>Apply Selection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
      backgroundColor: '#1E2436', // Brand dark blue
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
                  stroke="#007AFF"
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
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  threedotIcon: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  createWorkoutPillText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderPillActive: {
    backgroundColor: '#2A0548',
    borderColor: '#E9D5FF', // Light purple/white border as in image
  },
  deleteFolderBtn: {
    marginLeft: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25, // Rounded pill
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContentLarge: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#15151F',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  modalKeyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
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
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
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
  // --- New modular select screen styles ---
  filtersContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16, marginTop: 10 },
  filterSectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  filterCard: {
    flex: 1,
    backgroundColor: '#1C1C24',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  filterCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#1E2436',
  },
  filterCardText: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '600',
  },
  filterCardTextSelected: {
    color: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#161224',
    borderWidth: 1,
    borderColor: '#48075F',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterLabel: { color: '#AEB4C0', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  filterValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  bottomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  bottomModalContentContainer: {
    backgroundColor: '#120F1A',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    maxHeight: '75%',
    paddingTop: 16,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
    width: '100%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
  modalList: { paddingHorizontal: 24, paddingTop: 12 },
  listItemTextSelected: { color: '#7C3AED', fontWeight: '800' },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalApplyBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginBottom: 8,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  customDurationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  customDurationInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontSize: 15,
  },
  customDurationSuffix: {
    color: '#AEB4C0',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutNameInputCustom: {
    backgroundColor: '#0A0A12',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
    color: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  // --- Redesigned exercise selector styles ---
  searchBarCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    height: 38,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 10,
  },
  searchInputCustom: { color: '#fff', marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '500' },
  listArea: {
    flex: 1,
    marginHorizontal: 16,
  },
  listContentContainer: { paddingBottom: 100 },
  exerciseCardCustom: {
    backgroundColor: '#1E1C2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  exerciseCardSelectedCustom: {
    borderColor: 'rgba(124, 58, 237, 0.4)', // Purple border
    backgroundColor: '#252136',
  },
  exerciseRowCustom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseThumbnailCustom: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  exerciseInfoCustom: { flex: 1, gap: 4 },
  exerciseNameCustom: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  badgeRowCustom: { flexDirection: 'row', gap: 6, marginTop: 4 },
  muscleBadgeCustom: { backgroundColor: '#EE822A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  equipmentBadgeCustom: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextCustom: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  checkboxContainerCustom: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  checkboxSelectedCustom: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E4D9F', // Brand blue selection color
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnselectedCustom: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
  },
  addSelectedButtonCustom: {
    width: '85%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSelectedButtonTextCustom: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#AEB4C0', fontSize: 12, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyText: { color: '#AEB4C0', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  headerPillCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2436', // Brand dark blue
    alignSelf: 'flex-start',
    paddingRight: 18,
    paddingLeft: 16,
    borderRadius: 22,
    minHeight: 44,
  },
  headerPillTextCustom: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
    color: '#EE822A', // Brand orange
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
    borderColor: '#2E4D9F', // Brand blue
    backgroundColor: '#1E2436', // Brand dark blue
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
    borderColor: '#EE822A', // Brand orange
    backgroundColor: '#2C221F', // Brand dark orange
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
    color: '#EE822A', // Brand orange
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
    backgroundColor: '#1E2436', // Brand dark blue
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
    backgroundColor: '#1E2436', // Brand dark blue
    borderWidth: 12,
    borderColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E4D9F', // Brand blue shadow
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
