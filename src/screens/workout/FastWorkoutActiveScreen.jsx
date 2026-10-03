import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
  Alert,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Polyline } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { useDispatch, useSelector } from 'react-redux';
import { getMuscleImageUrl } from '../../utils/workoutIcons';
import * as Clarity from '../../utils/clarity';
import {
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { launchImageLibrary } from 'react-native-image-picker';
import { ImageCropperModal } from '../../components/ImageCropperModal';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import { updateCustomWorkoutTemplate, getCustomWorkoutTemplates, fetchExercises, fetchEquipments, fetchMuscles, resolveExerciseImageUri, resolveExerciseAnimationUri } from '../../redux/actions/workoutActions';
import {
  sortExercisesByAlreadyUsed,
  recordUsedExercises,
  recordExercisePerformance,
  recordPersonalBests,
  getExercisePerformanceHistory,
} from '../../utils/usedWorkoutsManager';
import WorkoutCameraModal from './components/WorkoutCameraModal';
import { ActiveWorkoutExerciseList } from './components/ActiveWorkoutExerciseList';
import { AddSetPickerModal } from './components/AddSetPickerModal';
import { SaveWorkoutSummaryModal } from './components/SaveWorkoutSummaryModal';
import { SearchExercisesModal } from './components/SearchExercisesModal';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';
import { calculateWorkoutCalories } from '../../utils/workoutCalorieCalculator';

const isTimeBasedExercise = (exercise) => {
  if (!exercise) return false;
  const name = String(exercise.name || '').toLowerCase();
  const eq = String(
    exercise.equipment ||
    (exercise.equipments && exercise.equipments[0]) ||
    exercise.equipments ||
    ''
  ).toLowerCase();

  const isBodyWeight =
    eq.includes('none') ||
    eq.includes('body weight') ||
    eq.includes('body only') ||
    eq.includes('equipment-free') ||
    eq === '' ||
    eq === 'null' ||
    eq === 'undefined';

  const cat = String(exercise.category || '').toLowerCase();
  if (cat === 'strength') return false;
  const isTimeBasedCategory = cat === 'stretching' || cat === 'cardio';

  const isTimeBasedName =
    name.includes('stretch') ||
    name.includes('warm') ||
    name.includes('reach') ||
    name.includes('bend') ||
    name.includes('yoga') ||
    name.includes('flex') ||
    name.includes('twist') ||
    name.includes('neck') ||
    name.includes('groin') ||
    name.includes('run') ||
    name.includes('jog') ||
    name.includes('cardio') ||
    name.includes('bike') ||
    name.includes('jump') ||
    name.includes('treadmill') ||
    name.includes('step') ||
    name.includes('plank') ||
    name.includes('hold') ||
    name.includes('lunge') ||
    name.includes('walk') ||
    name.includes('squat') ||
    name.includes('jack') ||
    name.includes('climb') ||
    name.includes('circle') ||
    name.includes('swing') ||
    name.includes('knee');

  return (isBodyWeight || isTimeBasedCategory) && (isTimeBasedName || isTimeBasedCategory);
};

const FastWorkoutActiveScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const {
    activeWorkout,
    startWorkout,
    updateWorkout,
    discardWorkout,
    finishWorkout,
  } = useActiveWorkout();

  const { exercises: paramExercises, addedExercises: paramAddedExercises, duration, level, workoutName, folderName, isSetupMode, source, isCustomWorkout: isCustomWorkoutParam } = route.params || {};
  const initialExercises = (paramExercises && paramExercises.length > 0) ? paramExercises : (paramAddedExercises || []);
  const isCustomWorkout = Boolean(isCustomWorkoutParam || source === 'custom_workout' || folderName);

  const [localSeconds, setLocalSeconds] = useState(0);
  const seconds = (activeWorkout && activeWorkout.isActive) ? activeWorkout.seconds : localSeconds;
  const [activeTimerSetIds, setActiveTimerSetIds] = useState([]);

  useEffect(() => {
    if (activeTimerSetIds.length === 0) return;

    const interval = setInterval(() => {
      setExercises(prev =>
        prev.map(ex => {
          const sets = ex.sets.map(s => {
            if (activeTimerSetIds.includes(s.id)) {
              const curTime = parseInt(s.weight) || 0;
              return { ...s, weight: (curTime + 1).toString() };
            }
            return s;
          });
          return { ...ex, sets };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerSetIds]);

  const isResuming = route.params?.resumeActive === true;
  const rawExercises = (initialExercises && initialExercises.length > 0)
    ? initialExercises
    : (route.params?.addedExercises || []);

  const [exercises, setExercises] = useState(() => {
    // 1. If explicitly resuming an ongoing workout from MiniBar
    if (isResuming && activeWorkout && activeWorkout.isActive && Array.isArray(activeWorkout.exercises) && activeWorkout.exercises.length > 0) {
      return activeWorkout.exercises;
    }
    // 2. If no new exercises were passed in route params, fallback to active workout if present
    if (rawExercises.length === 0 && activeWorkout && activeWorkout.isActive && Array.isArray(activeWorkout.exercises) && activeWorkout.exercises.length > 0) {
      return activeWorkout.exercises;
    }
    return (rawExercises || []).map((ex, index) => {
      const prePopulatedSets = [];
      const prevHistory = getExercisePerformanceHistory(ex);
      if (ex.setsArray && Array.isArray(ex.setsArray) && ex.setsArray.length > 0) {
        ex.setsArray.forEach((s, sIdx) => {
          const prevSet = prevHistory?.sets?.[sIdx] || prevHistory?.lastSet;
          const sReps = s.reps !== undefined && s.reps !== null ? Number(s.reps) : 0;
          const sWeight = s.weight !== undefined && s.weight !== null ? parseFloat(s.weight) : 0;
          prePopulatedSets.push({
            id: `set-${Date.now()}-${sIdx}-${Math.random()}`,
            reps: sReps,
            weight: sWeight,
            prevReps: prevSet?.reps !== undefined ? prevSet.reps : null,
            prevWeight: prevSet?.weight !== undefined ? prevSet.weight : null,
            completed: Boolean(s.completed),
            isSet: Boolean(s.completed || (sReps > 0 && sWeight > 0)),
          });
        });
      } else {
        const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 0);
        const actualCount = setsCount > 0 ? setsCount : (prevHistory?.sets?.length || 3);
        if (actualCount > 0) {
          for (let i = 0; i < actualCount; i++) {
            const s = Array.isArray(ex.sets) ? (ex.sets[i] || {}) : {};
            const prevSet = prevHistory?.sets?.[i] || prevHistory?.lastSet;
            const sReps = s?.reps !== undefined && s?.reps !== null ? Number(s.reps) : 0;
            const sWeight = s?.weight !== undefined && s?.weight !== null ? parseFloat(s.weight) : 0;
            prePopulatedSets.push({
              id: `set-${Date.now()}-${i}-${Math.random()}`,
              reps: sReps,
              weight: sWeight,
              prevReps: prevSet?.reps !== undefined ? prevSet.reps : null,
              prevWeight: prevSet?.weight !== undefined ? prevSet.weight : null,
              completed: Boolean(s?.completed),
              isSet: Boolean(s?.completed || (sReps > 0 && sWeight > 0)),
            });
          }
        }
      }
      return {
        ...ex,
        id: ex.id || ex._id || ex.exerciseId || `ex-${Date.now()}-${index}`,
        imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || null,
        gifUrl: ex.gifUrl || resolveExerciseImageUri(ex) || ex.imageUrl || null,
        sets: prePopulatedSets.length > 0 ? prePopulatedSets : [],
        previousSets: prevHistory?.sets || ex.previousSets || null,
      };
    });
  });

  const completedSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + validSets.filter(s => s.completed).length;
    }, 0);
  }, [exercises]);

  const totalSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + validSets.length;
    }, 0);
  }, [exercises]);

  const isEveryExerciseCompleted = useMemo(() => {
    if (!exercises || exercises.length === 0) return false;
    return exercises.every(ex => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return validSets.length > 0 && validSets.every(s => Boolean(s.completed));
    });
  }, [exercises]);

  const addedExercises = route.params?.addedExercises;
  useEffect(() => {
    if (addedExercises && addedExercises.length > 0) {
      setExercises(prev => {
        const newExercises = [...prev];
        addedExercises.forEach(ex => {
          const exId = ex.id || ex._id || ex.exerciseId;
          if (!newExercises.some(existing => (existing.id || existing._id || existing.exerciseId) === exId)) {
            const prevHistory = getExercisePerformanceHistory(ex);
            const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 0);
            const actualCount = setsCount > 0 ? setsCount : (prevHistory?.sets?.length || 3);
            const prePopulatedSets = [];
            if (actualCount > 0) {
              for (let i = 0; i < actualCount; i++) {
                const s = Array.isArray(ex.sets) ? (ex.sets[i] || {}) : {};
                const prevSet = prevHistory?.sets?.[i] || prevHistory?.lastSet;
                const sReps = s?.reps !== undefined && s?.reps !== null ? Number(s.reps) : 0;
                const sWeight = s?.weight !== undefined && s?.weight !== null ? parseFloat(s.weight) : 0;
                prePopulatedSets.push({
                  id: `set-${Date.now()}-${i}-${Math.random()}`,
                  reps: sReps,
                  weight: sWeight,
                  prevReps: prevSet?.reps !== undefined ? prevSet.reps : null,
                  prevWeight: prevSet?.weight !== undefined ? prevSet.weight : null,
                  completed: false,
                  isSet: false,
                });
              }
            }
            newExercises.push({
              ...ex,
              id: ex.id || ex._id || ex.exerciseId || `ex-${Date.now()}-${Math.random()}`,
              imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || null,
              gifUrl: ex.gifUrl || resolveExerciseImageUri(ex) || ex.imageUrl || null,
              sets: prePopulatedSets.length > 0 ? prePopulatedSets : [],
              previousSets: prevHistory?.sets || ex.previousSets || null,
            });
          }
        });
        return newExercises;
      });
      navigation.setParams({ addedExercises: null });
    }
  }, [addedExercises, navigation]);

  const volume = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      if (isTimeBasedExercise(ex)) return acc;
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + validSets.reduce((setAcc, s) => {
        if (s.completed) {
          return setAcc + (Number(s.reps || 0) * Number(s.weight || 0));
        }
        return setAcc;
      }, 0);
    }, 0);
  }, [exercises]);

  // ── Realistic Exercise Science Calorie Burn Formula ──
  // Considers Time (duration) and Workout (exercises, volume, sets, intensity, workout focus)
  const calories = useMemo(() => {
    if (completedSetsCount === 0 && volume === 0) {
      return 0;
    }
    return calculateWorkoutCalories({
      duration: seconds,
      exercises,
      volume,
      completedSetsCount,
      workoutTitle,
    });
  }, [seconds, volume, completedSetsCount, exercises, workoutTitle]);

  const [progressPhotos, setProgressPhotos] = useState([]);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [cropPhoto, setCropPhoto] = useState(null);
  const [uploadingCropPhoto, setUploadingCropPhoto] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [workoutTitle, setWorkoutTitle] = useState(() => {
    if (isResuming && activeWorkout && activeWorkout.isActive && activeWorkout.workoutTitle) {
      return activeWorkout.workoutTitle;
    }
    if (rawExercises.length === 0 && activeWorkout && activeWorkout.isActive && activeWorkout.workoutTitle) {
      return activeWorkout.workoutTitle;
    }
    return folderName
      ? (workoutName && !workoutName.toLowerCase().startsWith('day ')
        ? workoutName
        : `${folderName}${workoutName && workoutName.toLowerCase().startsWith('day ') ? ' ' + workoutName.substring(4) : ''}`)
      : (workoutName || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]);
  });

  // On mount: if no active workout session, or starting a new workout session with new exercises, start it
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.isActive || (!isResuming && rawExercises.length > 0)) {
      startWorkout({
        workoutTitle,
        workoutNotes: '',
        level,
        duration,
        source,
        folderName,
        templateId: route.params?.templateId,
        isCustomWorkout,
        isSetupMode,
        exercises,
        seconds: 0,
      });
    }
  }, []);

  // Synchronize exercises to active workout context
  useEffect(() => {
    if (activeWorkout?.isActive) {
      updateWorkout({ exercises });
    }
  }, [exercises, activeWorkout?.isActive, updateWorkout]);

  // Synchronize workout title
  useEffect(() => {
    if (activeWorkout?.isActive && workoutTitle) {
      updateWorkout({ workoutTitle });
    }
  }, [workoutTitle, activeWorkout?.isActive, updateWorkout]);
  const [failedImages, setFailedImages] = useState({});

  const [personalBests, setPersonalBests] = useState({});
  const sessionBestsRef = useRef({});

  const [isAddExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [reopenModalOnFocus, setReopenModalOnFocus] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && reopenModalOnFocus) {
      setAddExerciseModalVisible(true);
      setReopenModalOnFocus(false);
    }
  }, [isFocused, reopenModalOnFocus]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [isMuscleModalVisible, setIsMuscleModalVisible] = useState(false);

  const { equipments, muscles, exercises: apiExercises, loading: apiLoading } = useSelector(state => state.workout);

  useEffect(() => {
    if (isAddExerciseModalVisible) {
      if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
      if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
    }
  }, [isAddExerciseModalVisible, equipments, muscles, dispatch]);

  useEffect(() => {
    if (isAddExerciseModalVisible) {
      const apiFilters = {};
      if (selectedEquipment && selectedEquipment !== 'All Equipment' && selectedEquipment !== 'All Equipement') {
        if (selectedEquipment === 'None') {
          apiFilters.equipments = 'body weight';
        } else {
          apiFilters.equipments = selectedEquipment.toLowerCase();
        }
      }
      const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');
      if (cleanedMuscles.length > 0) {
        apiFilters.targetMuscles = cleanedMuscles.map(m => m.toLowerCase());
      }
      dispatch(fetchExercises({
        limit: 100,
        search: searchQuery,
        ...apiFilters
      }));
    }
  }, [isAddExerciseModalVisible, selectedEquipment, selectedMuscles, searchQuery, dispatch]);

  const displayedExercises = useMemo(() => {
    const list = (apiExercises || []).filter(ex =>
      (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.equipment || (ex.equipments && ex.equipments[0]) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.target || (ex.targetMuscles && ex.targetMuscles[0]) || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortExercisesByAlreadyUsed(list);
  }, [apiExercises, searchQuery]);

  const toggleExerciseSelection = (exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(ex => ex.id === exercise.id)) {
        return prev.filter(ex => ex.id !== exercise.id);
      }
      return [...prev, exercise];
    });
  };

  const toggleMuscle = (muscle) => {
    if (muscle === 'All Muscles') {
      setSelectedMuscles([]);
      return;
    }
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const triggerAddExerciseModal = () => {
    setSelectedExercises(exercises);
    setAddExerciseModalVisible(true);
  };

  const handleSaveSelectedExercises = async () => {
    if (selectedExercises && selectedExercises.length > 0) {
      recordUsedExercises(selectedExercises);
    }
    let nextExercises = [];
    setExercises(prev => {
      const updatedExercises = [];
      selectedExercises.forEach(selectedEx => {
        const exId = selectedEx.id || selectedEx._id || selectedEx.exerciseId;
        const existingEx = prev.find(ex => (ex.id || ex._id || ex.exerciseId) === exId);
        if (existingEx) {
          // Exercise is already in the workout, preserve its current state and sets
          updatedExercises.push(existingEx);
        } else {
          // This is a newly added exercise! Build its pre-populated sets from previous history
          const isTimeBased = isTimeBasedExercise(selectedEx);
          const prevHistory = getExercisePerformanceHistory(selectedEx);
          const setsCount = prevHistory?.sets?.length ? Math.max(3, prevHistory.sets.length) : 3;
          const prePopulatedSets = [];
          for (let i = 0; i < setsCount; i++) {
            const prevSet = prevHistory?.sets?.[i] || prevHistory?.lastSet;
            prePopulatedSets.push({
              id: `set-${Date.now()}-${i}-${Math.random()}`,
              reps: 0,
              weight: 0,
              prevReps: prevSet?.reps !== undefined ? prevSet.reps : null,
              prevWeight: prevSet?.weight !== undefined ? prevSet.weight : null,
              completed: false,
              isSet: false,
            });
          }
          const newlyAdded = {
            ...selectedEx,
            id: exId || `ex-${Date.now()}-${Math.random()}`,
            imageUrl: resolveExerciseImageUri(selectedEx) || selectedEx.imageUrl || null,
            gifUrl: resolveExerciseAnimationUri(selectedEx) || selectedEx.gifUrl || null,
            sets: prePopulatedSets,
            previousSets: prevHistory?.sets || null,
          };
          updatedExercises.push(newlyAdded);
        }
      });
      nextExercises = updatedExercises;
      return updatedExercises;
    });

    setAddExerciseModalVisible(false);
    setSelectedExercises([]);
    setSearchQuery('');
    setSelectedEquipment('');
    setSelectedMuscles([]);

    // Persist to custom workout template if in a custom workout
    const templateId = route.params?.templateId;
    if (templateId && nextExercises.length > 0) {
      try {
        const templateExercises = nextExercises.map(ex => ({
          ...ex,
          id: ex.id || ex._id,
          name: ex.name,
          imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || null,
          gifUrl: resolveExerciseAnimationUri(ex) || ex.gifUrl || null,
          sets: Array.isArray(ex.sets) ? ex.sets.length : 3,
          reps: (Array.isArray(ex.sets) && ex.sets[0]?.reps) ? parseInt(ex.sets[0].reps) || 0 : 0,
          weight: (Array.isArray(ex.sets) && ex.sets[0]?.weight) ? ex.sets[0].weight.toString() : '0',
        }));
        await dispatch(updateCustomWorkoutTemplate(templateId, templateExercises));
        await dispatch(getCustomWorkoutTemplates());
      } catch (err) {
        console.error('Failed to sync added exercises to custom template in backend:', err);
      }
    }
  };

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      const fetchBests = async () => {
        try {
          const names = exercises.map(ex => ex.name).join(',');
          const response = await apiClient.get(`/workouts/sessions/personal-bests?exerciseNames=${encodeURIComponent(names)}`);
          if (response.data && response.data.success) {
            recordPersonalBests(response.data.data);
            setPersonalBests(prev => {
              const merged = {
                ...response.data.data,
                ...prev
              };
              Object.keys(merged).forEach(key => {
                if (merged[key]) {
                  const w = parseFloat(merged[key].weight) || 0;
                  const r = parseInt(merged[key].reps) || 0;
                  const currRef = sessionBestsRef.current[key];
                  if (!currRef || w > currRef.weight || (w === currRef.weight && r > currRef.reps)) {
                    sessionBestsRef.current[key] = { weight: w, reps: r };
                  }
                }
              });
              return merged;
            });
          }
        } catch (error) {
          console.error('Failed to load personal bests:', error);
        }
      };
      fetchBests();
    }
  }, [exercises.length]);

  const [prNotification, setPrNotification] = useState({
    visible: false,
    exerciseName: '',
    curWeight: 0,
    curReps: 0,
    part: 0,
  });
  const prAnim = useRef(new Animated.Value(-120)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const prTimerRefs = useRef([]);

  useEffect(() => {
    return () => {
      prTimerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const showPRNotification = (exerciseName, weight, reps) => {
    prTimerRefs.current.forEach(clearTimeout);
    prTimerRefs.current = [];

    setPrNotification({
      visible: true,
      exerciseName,
      curWeight: weight,
      curReps: reps,
      part: 0,
    });
    textOpacity.setValue(1);
    prAnim.setValue(-120);

    const mountTimeout = setTimeout(() => {
      Animated.spring(prAnim, {
        toValue: 12,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    }, 50);
    prTimerRefs.current.push(mountTimeout);

    const t1 = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setPrNotification(prev => ({ ...prev, part: 1 }));
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);
    prTimerRefs.current.push(t1);

    const t2 = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setPrNotification(prev => ({ ...prev, part: 2 }));
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);
    prTimerRefs.current.push(t2);

    const t3 = setTimeout(() => {
      dismissPRNotification();
    }, 6000);
    prTimerRefs.current.push(t3);
  };

  const dismissPRNotification = () => {
    Animated.timing(prAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPrNotification(prev => ({ ...prev, visible: false }));
    });
  };

  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({ quality: 0.8 });
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);

  const [isSetModalVisible, setSetModalVisible] = useState(false);
  const [isSaveWorkoutModalVisible, setSaveWorkoutModalVisible] = useState(false);
  const [isVisibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [isRestTimerVisible, setRestTimerVisible] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);
  const [visibility, setVisibility] = useState('EVERYONE');

  const [tempReps, setTempReps] = useState(0);
  const [tempWeight, setTempWeight] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState(() => {
    return activeWorkout?.isActive && activeWorkout.workoutNotes ? activeWorkout.workoutNotes : '';
  });

  useEffect(() => {
    if (activeWorkout?.isActive && workoutNotes !== undefined) {
      updateWorkout({ workoutNotes });
    }
  }, [workoutNotes, activeWorkout?.isActive, updateWorkout]);

  useEffect(() => {
    if (activeWorkout?.isActive) {
      updateWorkout({ isRestTimerVisible, isPaused: isSaveWorkoutModalVisible });
    }
  }, [isRestTimerVisible, isSaveWorkoutModalVisible, activeWorkout?.isActive, updateWorkout]);

  const wasNavigatedToSummaryRef = useRef(false);

  // Automatically reopen the save workout modal when returning from WorkoutSummaryScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (wasNavigatedToSummaryRef.current) {
        wasNavigatedToSummaryRef.current = false;
        setSaveWorkoutModalVisible(true);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const activeExercise = exercises.find(e => e.id === activeExerciseId);
  const isTimeBased = activeExercise ? isTimeBasedExercise(activeExercise) : false;

  const stateRef = useRef({ activeExerciseId, tempReps, tempWeight });
  useEffect(() => {
    stateRef.current = { activeExerciseId, tempReps, tempWeight };
  }, [activeExerciseId, tempReps, tempWeight]);

  const repsScrollRef = useRef(null);
  const weightScrollRef = useRef(null);
  const ITEM_HEIGHT = 44;
  const WHEEL_HEIGHT = 150;
  const SPACER_HEIGHT = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

  useEffect(() => {
    if (isSetModalVisible) {
      setTimeout(() => {
        const repsIndex = tempReps;
        repsScrollRef.current?.scrollTo({ y: repsIndex * ITEM_HEIGHT, animated: false });

        const step = isTimeBased ? 5 : 0.5;
        const weightIndex = Math.round(tempWeight / step);
        weightScrollRef.current?.scrollTo({ y: weightIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [isSetModalVisible, isTimeBased]);

  const updateTempReps = (val) => {
    setTempReps(val);
    repsScrollRef.current?.scrollTo({ y: val * ITEM_HEIGHT, animated: true });
  };

  const updateTempWeight = (val) => {
    setTempWeight(val);
    const step = isTimeBased ? 5 : 0.5;
    weightScrollRef.current?.scrollTo({ y: Math.round(val / step) * ITEM_HEIGHT, animated: true });
  };

  const closeCameraAndRestoreSaveModal = useCallback(() => {
    setShowCameraOverlay(false);
    setTimeout(() => {
      setSaveWorkoutModalVisible(true);
    }, 400);
  }, []);

  const handleCameraShot = useCallback(async () => {
    try {
      if (!photoOutput) {
        Alert.alert('Camera Error', 'Camera output is not initialized.');
        return;
      }
      const photo = await photoOutput.capturePhotoToFile(
        { flashMode: 'off' },
        {},
      );
      if (photo && photo.filePath) {
        const imagePath = photo.filePath.startsWith('file://')
          ? photo.filePath
          : 'file://' + photo.filePath;
        setShowCameraOverlay(false);
        setTimeout(() => {
          setCropPhoto({ uri: imagePath });
          setCropperVisible(true);
        }, 300);
      } else {
        throw new Error('Captured photo had no file path.');
      }
    } catch (error) {
      Alert.alert(
        'Camera Not Ready',
        'Please wait a moment for the camera to initialize before taking a photo.',
      );
      console.error('Camera capture error:', error);
    }
  }, [photoOutput]);

  const handleUploadPhoto = useCallback(() => {
    setShowCameraOverlay(false);
    setTimeout(() => {
      try {
        launchImageLibrary({ mediaType: 'photo', quality: 0.9, selectionLimit: 1 }, response => {
          if (
            !response.didCancel &&
            !response.errorCode &&
            response.assets && response.assets.length > 0
          ) {
            setCropPhoto(response.assets[0]);
            setCropperVisible(true);
          } else {
            setSaveWorkoutModalVisible(true);
          }
        });
      } catch (err) {
        Alert.alert('Gallery Launch Failed', err.message || String(err));
        setSaveWorkoutModalVisible(true);
      }
    }, 450);
  }, []);

  const handlePressFinishWorkout = () => {
    if (!exercises || exercises.length === 0) {
      Alert.alert(
        'No Exercises',
        'Please add at least one exercise and complete all sets before finishing.',
        [{ text: 'OK' }]
      );
      return;
    }

    const incompleteExercises = exercises.filter(ex => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return validSets.length === 0 || !validSets.every(s => Boolean(s.completed));
    });

    if (incompleteExercises.length > 0) {
      const names = incompleteExercises.map(ex => ex.name).slice(0, 3).join(', ');
      const extra = incompleteExercises.length > 3 ? ` and ${incompleteExercises.length - 3} more` : '';
      Alert.alert(
        'Complete All Exercises',
        `You cannot finish the workout yet. Please mark all sets green for every exercise before finishing.\n\nIncomplete exercises:\n• ${names}${extra}`,
        [{ text: 'Got it' }]
      );
      return;
    }

    setSaveWorkoutModalVisible(true);
  };

  const handleLogWorkout = (customDuration, customCalories) => {
    // Strictly verify every exercise and set is completed (marked green)
    const incompleteExercises = exercises.filter(ex => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return validSets.length === 0 || !validSets.every(s => Boolean(s.completed));
    });

    if (incompleteExercises.length > 0 || exercises.length === 0) {
      const names = incompleteExercises.map(ex => ex.name).slice(0, 3).join(', ');
      const extra = incompleteExercises.length > 3 ? ` and ${incompleteExercises.length - 3} more` : '';
      Alert.alert(
        'Complete All Exercises',
        `Please mark all sets green for every exercise before finishing and posting your workout.${incompleteExercises.length > 0 ? `\n\nIncomplete:\n• ${names}${extra}` : ''}`,
        [{ text: 'OK' }]
      );
      return;
    }

    const finalDuration = typeof customDuration === 'number' && customDuration >= 0
      ? customDuration
      : seconds;

    const finalCalories = typeof customCalories === 'number' && customCalories >= 0
      ? customCalories
      : calculateWorkoutCalories({
          duration: finalDuration,
          exercises,
          volume,
          completedSetsCount,
          workoutTitle,
        });

    const sessionData = {
      level,
      duration: finalDuration,
      calories: finalCalories,
      volume,
      visibility,
      workoutName: workoutTitle.trim() || 'Workout',
      notes: workoutNotes.trim() || null,
      templateId: route.params?.templateId || null,
      exercises: exercises
        .filter(ex => ex.sets && ex.sets.length > 0)
        .map(ex => ({
          exerciseId: ex.exerciseId || ex.id,
          name: ex.name,
          imageUrl: ex.imageUrl || ex.gifUrl || resolveExerciseImageUri(ex) || null,
          gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseAnimationUri(ex) || null,
          imageUrls: ex.imageUrls || null,
          target: ex.target || null,
          bodyPart: ex.bodyPart || null,
          equipment: ex.equipment || null,
          sets: ex.sets.filter(s => s.completed),
        })),
      templateExercises: exercises.map(ex => {
        const completedSets = Array.isArray(ex.sets) ? ex.sets.filter(s => s.completed) : [];
        const firstSet = Array.isArray(ex.sets) && ex.sets.length > 0 ? ex.sets[0] : {};
        const bestSet = completedSets.length > 0 ? completedSets[0] : firstSet;
        return {
          id: ex.id,
          exerciseId: ex.exerciseId || ex.id,
          name: ex.name,
          imageUrl: ex.imageUrl || ex.gifUrl || resolveExerciseImageUri(ex) || null,
          gifUrl: ex.gifUrl || ex.imageUrl || resolveExerciseAnimationUri(ex) || null,
          imageUrls: ex.imageUrls || null,
          target: ex.target || null,
          bodyPart: ex.bodyPart || null,
          equipment: ex.equipment || null,
          sets: Array.isArray(ex.sets) ? ex.sets.length : (ex.sets || 3),
          reps: bestSet.reps !== undefined ? Number(bestSet.reps) : 10,
          weight: bestSet.weight !== undefined ? bestSet.weight.toString() : '0',
        };
      }),
    };
    recordUsedExercises(exercises);
    recordExercisePerformance(exercises);
    wasNavigatedToSummaryRef.current = true;
    setSaveWorkoutModalVisible(false);
    navigation.navigate('WorkoutSummary', { sessionData, progressPhotos });
  };

  const handleSaveTemplateSetup = async () => {
    try {
      const templateExercises = exercises.map(ex => {
        const setsCount = Array.isArray(ex.sets) ? ex.sets.length : 3;
        const firstSet = Array.isArray(ex.sets) && ex.sets.length > 0 ? ex.sets[0] : {};
        return {
          ...ex,
          id: ex.id || ex._id,
          name: ex.name,
          sets: setsCount,
          reps: firstSet.reps !== undefined ? parseInt(firstSet.reps) || 12 : 12,
          weight: firstSet.weight !== undefined ? firstSet.weight.toString() : '4.00',
        };
      });

      await dispatch(updateCustomWorkoutTemplate(route.params?.templateId, templateExercises));
      recordExercisePerformance(exercises);
      finishWorkout();
      Alert.alert('Success', 'Workout template saved successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save template setup:', err);
      Alert.alert('Error', err.message || 'Failed to save template setup. Please try again.');
    }
  };

  useEffect(() => {
    if (activeWorkout?.isActive) return undefined;
    if (isSaveWorkoutModalVisible || isRestTimerVisible) return undefined;

    const interval = setInterval(() => {
      setLocalSeconds(currentSeconds => currentSeconds + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSaveWorkoutModalVisible, isRestTimerVisible, activeWorkout?.isActive]);

  useEffect(() => {
    try {
      Clarity.sendCustomEvent('workout_opened');
    } catch (e) {
      console.error('[Clarity] Failed to send workout_opened:', e);
    }
  }, []);

  useEffect(() => {
    if (!isRestTimerVisible) return undefined;

    const interval = setInterval(() => {
      setRestSeconds(current => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRestTimerVisible]);

  const formatTime = totalSeconds => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handlePickImage = () => {
    if (typeof launchImageLibrary !== 'function') {
      Alert.alert('Module Error', 'Native image picker functions are not loaded.');
      return;
    }

    setSaveWorkoutModalVisible(false);

    setTimeout(() => {
      Alert.alert('Add Photo', 'Choose a photo for your workout summary', [
        {
          text: 'Take Photo',
          onPress: () => {
            if (!hasPermission) {
              requestPermission();
            }
            setShowCameraOverlay(true);
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            setTimeout(() => {
              try {
                launchImageLibrary(
                  {
                    mediaType: 'photo',
                    quality: 0.9,
                    selectionLimit: 1,
                  },
                  response => {
                    if (
                      !response.didCancel &&
                      !response.errorCode &&
                      response.assets &&
                      response.assets.length > 0
                    ) {
                      setCropPhoto(response.assets[0]);
                      setCropperVisible(true);
                    } else {
                      setSaveWorkoutModalVisible(true);
                    }
                  }
                );
              } catch (err) {
                Alert.alert('Gallery Launch Failed', err.message || String(err));
                setSaveWorkoutModalVisible(true);
              }
            }, 300);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setSaveWorkoutModalVisible(true);
          },
        },
      ]);
    }, 450);
  };

  const handleCropComplete = async ({ cropOptions }) => {
    if (!cropPhoto) return;
    setUploadingCropPhoto(true);
    try {
      const uploadedUrl = await uploadToCloudinary(cropPhoto, cropOptions);
      setProgressPhotos(prev => [...prev, uploadedUrl].slice(0, 5));
      setCropperVisible(false);
      setCropPhoto(null);
      setSaveWorkoutModalVisible(true);
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload the cropped image. Please try again.');
      setSaveWorkoutModalVisible(true);
    } finally {
      setUploadingCropPhoto(false);
    }
  };

  const openAddSetModal = exerciseId => {
    setActiveExerciseId(exerciseId);
    setEditingSetId(null);

    const exercise = exercises.find(ex => ex.id === exerciseId);
    const timeBased = exercise ? isTimeBasedExercise(exercise) : false;
    if (exercise && exercise.sets && exercise.sets.length > 0) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      const parsedReps = parseInt(lastSet.reps, 10);
      const parsedWeight = parseFloat(lastSet.weight);
      setTempReps(!isNaN(parsedReps) && parsedReps > 0 ? parsedReps : 15);
      setTempWeight(!isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : (timeBased ? 30.0 : 15.0));
    } else {
      const prev = getExercisePerformanceHistory(exercise);
      if (prev && prev.lastSet) {
        setTempReps(prev.lastSet.reps || (timeBased ? 0 : 15));
        setTempWeight(prev.lastSet.weight || (timeBased ? 30.0 : 15.0));
      } else {
        setTempReps(timeBased ? 0 : 15);
        setTempWeight(timeBased ? 30.0 : 15.0);
      }
    }

    setSetModalVisible(true);
  };

  const openEditSetModal = (exerciseId, setId, currentReps, currentWeight) => {
    setActiveExerciseId(exerciseId);
    setEditingSetId(setId);
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const timeBased = exercise ? isTimeBasedExercise(exercise) : false;
    const parsedReps = parseInt(currentReps, 10);
    const parsedWeight = parseFloat(currentWeight);
    let r = !isNaN(parsedReps) && parsedReps > 0 ? parsedReps : 0;
    let w = !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;

    if (r === 0 || w === 0) {
      const prev = getExercisePerformanceHistory(exercise);
      const setIdx = exercise?.sets?.findIndex(s => s.id === setId);
      const prevSet = (setIdx >= 0 && prev?.sets?.[setIdx]) || prev?.lastSet;
      if (r === 0) {
        r = prevSet?.reps && Number(prevSet.reps) > 0 ? Number(prevSet.reps) : (timeBased ? 0 : 15);
      }
      if (w === 0) {
        w = prevSet?.weight && parseFloat(prevSet.weight) > 0 ? parseFloat(prevSet.weight) : (timeBased ? 30.0 : 15.0);
      }
    }

    setTempReps(r);
    setTempWeight(w);
    setSetModalVisible(true);
  };

  const handleSaveSetModal = () => {
    const { activeExerciseId, tempReps, tempWeight } = stateRef.current;
    if (editingSetId) {
      const exercise = exercises.find(ex => ex.id === activeExerciseId);

      setExercises(prev =>
        prev.map(ex => {
          if (ex.id === activeExerciseId) {
            return {
              ...ex,
              sets: ex.sets.map(s => {
                if (s.id === editingSetId) {
                  return {
                    ...s,
                    reps: tempReps,
                    weight: tempWeight,
                    isSet: true,
                  };
                }
                return s;
              })
            };
          }
          return ex;
        })
      );
      if (exercise) {
        const editingSet = (exercise.sets || []).find(s => s.id === editingSetId);
        if (editingSet && editingSet.completed) {
          checkAndTriggerPR(exercise.name, tempWeight, tempReps, editingSetId);
        }
      }
      setSetModalVisible(false);
      setEditingSetId(null);
    } else {
      handleAddSet();
    }
  };

  const checkAndTriggerPR = (exerciseName, weightStr, repsStr, currentSetId) => {
    const curReps = parseInt(repsStr) || 0;
    const curWeight = parseFloat(weightStr ? weightStr.toString().replace(',', '.') : '0') || 0;

    if (curWeight < 0 || curReps <= 0) return;

    const normalizedExName = exerciseName.trim().toLowerCase();
    const histKey = Object.keys(personalBests).find(k => k.trim().toLowerCase() === normalizedExName);
    const histBest = histKey ? personalBests[histKey] : null;
    const histWeight = histBest && histBest.weight !== undefined && histBest.weight !== null ? parseFloat(histBest.weight) : 0;
    const histReps = histBest && histBest.reps !== undefined && histBest.reps !== null ? parseInt(histBest.reps) : 0;

    const sessKey = Object.keys(sessionBestsRef.current).find(k => k.trim().toLowerCase() === normalizedExName);
    const sessBest = sessKey ? sessionBestsRef.current[sessKey] : null;
    const sessWeight = sessBest ? sessBest.weight : 0;
    const sessReps = sessBest ? sessBest.reps : 0;

    let bestWeight = Math.max(histWeight, sessWeight);
    let bestReps = 0;
    if (bestWeight === histWeight) bestReps = Math.max(bestReps, histReps);
    if (bestWeight === sessWeight) bestReps = Math.max(bestReps, sessReps);

    const exercise = exercises.find(ex => ex.name.trim().toLowerCase() === normalizedExName);
    if (exercise && exercise.sets) {
      exercise.sets.forEach(s => {
        if (s.completed && s.id !== currentSetId) {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (w > bestWeight) {
            bestWeight = w;
            bestReps = r;
          } else if (w === bestWeight && r > bestReps) {
            bestReps = r;
          }
        }
      });
    }

    let isNewPR = false;
    let shouldUpdatePB = false;

    if (bestWeight === 0 && bestReps === 0) {
      shouldUpdatePB = true;
      isNewPR = false;
    } else if (curWeight > bestWeight) {
      isNewPR = true;
      shouldUpdatePB = true;
    } else if (curWeight === bestWeight && curReps > bestReps) {
      isNewPR = true;
      shouldUpdatePB = true;
    }

    if (isNewPR) {
      showPRNotification(exerciseName, curWeight, curReps);
    }

    if (shouldUpdatePB) {
      sessionBestsRef.current[exerciseName] = { weight: curWeight, reps: curReps };
      setPersonalBests(prev => ({
        ...prev,
        [exerciseName]: { weight: curWeight, reps: curReps }
      }));
    }
  };

  const handleAddSet = () => {
    const { activeExerciseId, tempReps, tempWeight } = stateRef.current;
    const exercise = exercises.find(ex => ex.id === activeExerciseId);
    const newSetId = Date.now().toString();

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === activeExerciseId) {
          return {
            ...ex,
            sets: [
              ...(Array.isArray(ex.sets) ? ex.sets : []),
              {
                id: newSetId,
                reps: tempReps,
                weight: tempWeight,
                isSet: true,
                completed: true,
              },
            ],
          };
        }
        return ex;
      }),
    );

    if (exercise) {
      checkAndTriggerPR(exercise.name, tempWeight, tempReps, newSetId);
      recordExercisePerformance({
        ...exercise,
        sets: [
          ...(Array.isArray(exercise.sets) ? exercise.sets : []),
          {
            id: newSetId,
            reps: tempReps,
            weight: tempWeight,
            isSet: true,
            completed: true,
          },
        ],
      });
    }

    setSetModalVisible(false);
  };

  const toggleSetCompletion = (exerciseId, setId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const set = exercise.sets.find(s => s.id === setId);
    if (!set) return;

    if (set.completed) {
      setExercises(prev =>
        prev.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: ex.sets.map(s =>
                s.id === setId ? { ...s, completed: false } : s,
              ),
            };
          }
          return ex;
        }),
      );
      return;
    }

    const timeBased = isTimeBasedExercise(exercise);
    const hasReps = Number(set.reps) > 0;
    const hasWeight = parseFloat(set.weight) > 0;
    const eq = String(exercise?.equipment || (exercise?.equipments && exercise.equipments[0]) || '').toLowerCase();
    const isBodyWeight = eq.includes('none') || eq.includes('body weight') || eq.includes('body only') || eq.includes('equipment-free');
    const isConfigured = timeBased ? (hasWeight || set.isSet) : (hasReps && (hasWeight || isBodyWeight || set.isSet));

    if (!isConfigured) {
      Alert.alert(
        'Set Incomplete',
        'Please set reps and weight first before giving the green tick.',
        [{ text: 'OK' }]
      );
      return;
    }

    checkAndTriggerPR(exercise.name, set.weight, set.reps, set.id);
    setActiveTimerSetIds(prev => prev.filter(id => id !== setId));
    recordExercisePerformance({
      ...exercise,
      sets: exercise.sets.map(s => s.id === setId ? { ...s, completed: true, isSet: true } : s),
    });

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, completed: true, isSet: true } : s,
            ),
          };
        }
        return ex;
      }),
    );
  };

  const handleMarkAllSets = (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise || !Array.isArray(exercise.sets) || exercise.sets.length === 0) return;

    const allCompleted = exercise.sets.every(s => s.completed);
    const targetStatus = !allCompleted;

    if (targetStatus) {
      const timeBased = isTimeBasedExercise(exercise);
      const eq = String(exercise?.equipment || (exercise?.equipments && exercise.equipments[0]) || '').toLowerCase();
      const isBodyWeight = eq.includes('none') || eq.includes('body weight') || eq.includes('body only') || eq.includes('equipment-free');
      const hasUnset = exercise.sets.some(s => {
        const hasReps = Number(s.reps) > 0;
        const hasWeight = parseFloat(s.weight) > 0;
        return !(timeBased ? (hasWeight || s.isSet) : (hasReps && (hasWeight || isBodyWeight || s.isSet)));
      });

      if (hasUnset) {
        Alert.alert(
          'Incomplete Sets',
          'Please set reps and weight for all sets first before marking all sets complete.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (targetStatus && !s.completed) {
                checkAndTriggerPR(ex.name, s.weight, s.reps, s.id);
              }
              return { ...s, completed: targetStatus, isSet: targetStatus ? true : s.isSet };
            }),
          };
        }
        return ex;
      }),
    );

    if (targetStatus) {
      const setIds = exercise.sets.map(s => s.id);
      setActiveTimerSetIds(prev => prev.filter(id => !setIds.includes(id)));
      recordExercisePerformance({
        ...exercise,
        sets: exercise.sets.map(s => ({ ...s, completed: true, isSet: true })),
      });
    }
  };

  const handleDeleteSet = (exerciseId, setId) => {
    setActiveTimerSetIds(prev => prev.filter(id => id !== setId));
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = (ex.sets || []).filter(s => s.id !== setId);
          return {
            ...ex,
            sets: updatedSets,
          };
        }
        return ex;
      })
    );
  };

  const activeExerciseName =
    exercises.find(e => e.id === activeExerciseId)?.name || '';

  const totalReps = exercises.reduce((acc, ex) => {
    if (isTimeBasedExercise(ex)) return acc;
    const validSets = Array.isArray(ex.sets) ? ex.sets : [];
    return acc + validSets.reduce((setAcc, set) => {
      if (set.completed) {
        return setAcc + (Number(set.reps) || 0);
      }
      return setAcc;
    }, 0);
  }, 0);
  const completedExercisesCount = exercises.filter(
    ex => Array.isArray(ex.sets) && ex.sets.length > 0 && ex.sets.every(s => Boolean(s.completed)),
  ).length;

  const handleDiscardWorkout = () => {
    Alert.alert(
      'Discard Workout?',
      'Are you sure you want to discard this workout? All progress will be lost.',
      [
        { text: 'Keep Workout', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
            navigation.reset({
              index: 1,
              routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
            });
          },
        },
      ]
    );
  };

  const closeWorkout = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {exercises.length === 0 ? (
          <View style={styles.topStatsRow}>
            <TouchableOpacity
              style={[styles.iconButton, { marginRight: 16 }]}
              onPress={closeWorkout}
              activeOpacity={0.8}
            >
              <Icon name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.topStatItem}>
              <Text style={styles.topStatLabel}>Duration</Text>
              <Text style={[styles.topStatValue, styles.blueText]}>{formatTime(seconds)}</Text>
            </View>
            <View style={styles.topStatItem}>
              <Text style={styles.topStatLabel}>Volume</Text>
              <Text style={styles.topStatValue}>{volume} kg</Text>
            </View>
            <View style={styles.topStatItem}>
              <Text style={styles.topStatLabel}>Sets</Text>
              <Text style={styles.topStatValue}>{completedSetsCount}</Text>
            </View>
            <View style={styles.muscleIconContainer}>
              <Svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <Path d="M12 2C11.45 2 11 2.45 11 3C11 3.55 11.45 4 12 4C12.55 4 13 3.55 13 3C13 2.45 12.55 2 12 2ZM9 6C8.45 6 8 6.45 8 7V10C8 10.55 8.45 11 9 11H10V18H7V20H17V18H14V11H15C15.55 11 16 10.55 16 10V7C16 6.45 15.55 6 15 6H9Z" fill="#8E8E9A" />
              </Svg>
            </View>
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={closeWorkout}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <TextInput
              style={styles.headerTitleInput}
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
              placeholder="Workout Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setRestSeconds(0);
                setRestTimerVisible(true);
              }}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2" />
                <Polyline
                  points="12 6 12 12 16 14"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {exercises.length > 0 && (
            <>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.durationHeader}>
                    <View style={[styles.greenDot, isRestTimerVisible && styles.pausedDot]} />
                    <Text style={styles.statValue}>{formatTime(seconds)}</Text>
                  </View>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{calories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{volume}</Text>
                  <Text style={styles.statLabel}>Volume (kg)</Text>
                </View>
              </View>

              <View style={styles.subHeaderRow}>
                <Text style={styles.exercisesCount}>
                  {exercises.length} EXERCISES
                </Text>
              </View>
            </>
          )}

          {/* Active Workout Exercises List */}
          <ActiveWorkoutExerciseList
            exercises={exercises}
            isTimeBasedExercise={isTimeBasedExercise}
            resolveExerciseImageUri={resolveExerciseImageUri}
            getMuscleImageUrl={getMuscleImageUrl}
            failedImages={failedImages}
            setFailedImages={setFailedImages}
            activeTimerSetIds={activeTimerSetIds}
            setActiveTimerSetIds={setActiveTimerSetIds}
            toggleSetCompletion={toggleSetCompletion}
            handleDeleteSet={handleDeleteSet}
            openEditSetModal={openEditSetModal}
            openAddSetModal={openAddSetModal}
            handleMarkAllSets={handleMarkAllSets}
            triggerAddExerciseModal={triggerAddExerciseModal}
            closeWorkout={closeWorkout}
            personalBests={personalBests}
          />

          {/* Finish Button at the very bottom of the workout */}
          {exercises.length > 0 && (
            <View style={styles.bottomFinishContainer}>
              {isSetupMode ? (
                <TouchableOpacity
                  style={styles.saveTemplateBtn}
                  onPress={handleSaveTemplateSetup}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.saveTemplateBtnText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.saveTemplateBtn,
                    !isEveryExerciseCompleted && { opacity: 0.65 }
                  ]}
                  onPress={handlePressFinishWorkout}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.saveTemplateBtnText}>
                    Finish Workout
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Add / Edit Set Picker Modal */}
        <AddSetPickerModal
          visible={isSetModalVisible}
          onClose={() => setSetModalVisible(false)}
          activeExerciseName={activeExerciseName}
          isTimeBased={isTimeBased}
          editingSetId={editingSetId}
          tempReps={tempReps}
          setTempReps={setTempReps}
          tempWeight={tempWeight}
          setTempWeight={setTempWeight}
          handleSaveSetModal={handleSaveSetModal}
          repsScrollRef={repsScrollRef}
          weightScrollRef={weightScrollRef}
          ITEM_HEIGHT={ITEM_HEIGHT}
          SPACER_HEIGHT={SPACER_HEIGHT}
          updateTempReps={updateTempReps}
          updateTempWeight={updateTempWeight}
        />

        {/* Rest Timer Modal */}
        <Modal visible={isRestTimerVisible} transparent animationType="slide" onRequestClose={() => setRestTimerVisible(false)}>
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
                <Text style={styles.restTimeValue}>
                  {formatTime(restSeconds)}
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

        {/* Save Workout Summary Modal */}
        <SaveWorkoutSummaryModal
          visible={isSaveWorkoutModalVisible}
          onClose={() => setSaveWorkoutModalVisible(false)}
          progressPhotos={progressPhotos}
          setProgressPhotos={setProgressPhotos}
          currentSlide={currentSlide}
          setCurrentSlide={setCurrentSlide}
          handlePickImage={handlePickImage}
          visibility={visibility}
          setVisibility={setVisibility}
          isVisibilityModalVisible={isVisibilityModalVisible}
          setVisibilityModalVisible={setVisibilityModalVisible}
          seconds={seconds}
          formatTime={formatTime}
          completedExercisesCount={completedExercisesCount}
          workoutTitle={workoutTitle}
          setWorkoutTitle={setWorkoutTitle}
          workoutNotes={workoutNotes}
          setWorkoutNotes={setWorkoutNotes}
          volume={volume}
          totalReps={totalReps}
          calories={calories}
          handleLogWorkout={handleLogWorkout}
          isEveryExerciseCompleted={isEveryExerciseCompleted}
          exercises={exercises}
        />

        {/* Camera Modal */}
        <WorkoutCameraModal
          showCameraOverlay={showCameraOverlay}
          setShowCameraOverlay={closeCameraAndRestoreSaveModal}
          cameraDevice={cameraDevice}
          handleCameraShot={handleCameraShot}
          handleUploadPhoto={handleUploadPhoto}
          hasPermission={hasPermission}
          requestPermission={requestPermission}
          photoOutput={photoOutput}
        />

        {/* Image Cropper Modal */}
        <ImageCropperModal
          visible={cropperVisible}
          image={cropPhoto}
          onClose={() => {
            if (!uploadingCropPhoto) {
              setCropperVisible(false);
              setCropPhoto(null);
              setSaveWorkoutModalVisible(true);
            }
          }}
          onCrop={handleCropComplete}
          onPickAnother={handlePickImage}
          isUploading={uploadingCropPhoto}
        />

        {/* PR Notification Banner */}
        {prNotification.visible && (
          <Animated.View
            style={[
              styles.prNotificationBanner,
              {
                transform: [{ translateY: prAnim }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={dismissPRNotification}
              style={styles.prNotificationContent}
            >
              <LinearGradient
                colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.prNotificationIconContainer}>
                <Text style={styles.prNotificationEmoji}>🥇</Text>
              </View>
              <Animated.View style={[styles.prNotificationTextContainer, { opacity: textOpacity }]}>
                <Text style={styles.prNotificationText}>
                  {prNotification.part === 0 && "New Personal Record! 🎉"}
                  {prNotification.part === 1 && `${prNotification.exerciseName} 💪`}
                  {prNotification.part === 2 && `${prNotification.curWeight} kg x ${prNotification.curReps} reps! 🥇`}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Search & Select Exercises Modal */}
        <SearchExercisesModal
          visible={isAddExerciseModalVisible}
          onClose={() => setAddExerciseModalVisible(false)}
          isCustomWorkout={isCustomWorkout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedExercises={selectedExercises}
          setSelectedExercises={setSelectedExercises}
          selectedEquipment={selectedEquipment}
          setSelectedEquipment={setSelectedEquipment}
          selectedMuscles={selectedMuscles}
          setSelectedMuscles={setSelectedMuscles}
          apiLoading={apiLoading}
          displayedExercises={displayedExercises}
          handleSaveSelectedExercises={handleSaveSelectedExercises}
          toggleExerciseSelection={toggleExerciseSelection}
          toggleMuscle={toggleMuscle}
          isEquipmentModalVisible={isEquipmentModalVisible}
          setIsEquipmentModalVisible={setIsEquipmentModalVisible}
          isMuscleModalVisible={isMuscleModalVisible}
          setIsMuscleModalVisible={setIsMuscleModalVisible}
          setReopenModalOnFocus={setReopenModalOnFocus}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  container: { flex: 1, backgroundColor: '#000000' },
  topStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topStatItem: {
    flex: 1,
  },
  topStatLabel: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  topStatValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  blueText: {
    color: '#EE822A',
  },
  muscleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E1C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleInput: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
    padding: 0,
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  statItem: { alignItems: 'center' },
  durationHeader: { flexDirection: 'row', alignItems: 'center' },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
    marginRight: 6,
  },
  pausedDot: {
    backgroundColor: '#EE822A',
  },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  exercisesCount: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  saveTemplateBtn: {
    height: 50,
    width: 250,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8F5D98',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  saveTemplateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bottomFinishContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 20,
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
  prNotificationBanner: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  prNotificationContent: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#EE822A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  prNotificationIconContainer: {
    marginRight: 10,
  },
  prNotificationEmoji: {
    fontSize: 22,
  },
  prNotificationTextContainer: {
    flex: 1,
  },
  prNotificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default FastWorkoutActiveScreen;
