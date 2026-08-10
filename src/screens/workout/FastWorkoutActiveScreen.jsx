import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  PanResponder,
  Animated,
  Modal,
  Image,
  Alert,
  TextInput,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { useDispatch, useSelector } from 'react-redux';
import { EquipmentModal } from '../../components/EquipmentModal';
import { MuscleModal } from '../../components/MuscleModal';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getMuscleImageUrl } from '../../utils/workoutIcons';
import * as Clarity from '../../utils/clarity';
import {
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { logWorkoutSession, updateCustomWorkoutTemplate, fetchExercises, fetchEquipments, fetchMuscles, resolveExerciseImageUri } from '../../redux/actions/workoutActions';
import WorkoutCameraModal from './components/WorkoutCameraModal';
import InteractiveMuscleMap from '../../components/workout/InteractiveMuscleMap';

const { width } = Dimensions.get('window');

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

const SwipeableSetRow = ({ set, idx, exercise, isTimeBasedExercise, activeTimerSetIds, setActiveTimerSetIds, handleUpdateSet, checkAndTriggerPR, toggleSetCompletion, onDeleteSet, openEditSetModal }) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;
        if (isSwipedOpen.current) {
          newX = -70 + gestureState.dx;
        }
        if (newX > 0) newX = 0;
        if (newX < -100) newX = -100;
        swipeAnim.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -30) {
          Animated.spring(swipeAnim, {
            toValue: -70,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = true;
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const closeRow = () => {
    Animated.spring(swipeAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    isSwipedOpen.current = false;
  };

  return (
    <View style={styles.swipeRowWrapper}>
      <TouchableOpacity
        style={styles.deleteSetActionBtn}
        onPress={() => {
          closeRow();
          onDeleteSet(set.id);
        }}
      >
        <Text style={styles.deleteSetActionText}>Delete</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.setRow,
          {
            transform: [{ translateX: swipeAnim }],
            marginBottom: 0,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.setNumText}>{idx + 1}</Text>
        <Text style={styles.setPrevText}>
          {(() => {
            const prevReps = exercise.reps !== undefined && exercise.reps !== null ? Number(exercise.reps) : 0;
            const prevWeight = exercise.weight !== undefined && exercise.weight !== null ? parseFloat(exercise.weight) || 0 : 0;
            if (prevReps === 0 && prevWeight === 0) return '—';
            if (isTimeBasedExercise(exercise)) {
              return `${prevWeight}s`;
            }
            return `${prevWeight}kg x ${prevReps}`;
          })()}
        </Text>

        {/* Touchable Reps Picker Input */}
        <TouchableOpacity
          style={[styles.setInputField, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          onPress={() => openEditSetModal && openEditSetModal(exercise.id, set.id, set.reps, set.weight)}
          activeOpacity={0.7}
        >
          <Text style={{ color: set.reps !== undefined && set.reps !== 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>
            {set.reps !== undefined && set.reps !== 0 ? set.reps.toString() : '0'}
          </Text>
        </TouchableOpacity>

        {isTimeBasedExercise(exercise) ? (
          <View style={styles.timerContainer}>
            <TouchableOpacity
              onPress={() => {
                const isRunning = activeTimerSetIds.includes(set.id);
                if (isRunning) {
                  setActiveTimerSetIds(prev => prev.filter(id => id !== set.id));
                } else {
                  setActiveTimerSetIds(prev => [...prev, set.id]);
                }
              }}
              style={styles.playButton}
            >
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {activeTimerSetIds.includes(set.id) ? (
                  <>
                    <Circle cx="12" cy="12" r="10" stroke="#EE822A" strokeWidth="2" />
                    <Rect x="9" y="8" width="2" height="8" fill="#EE822A" rx="1" />
                    <Rect x="13" y="8" width="2" height="8" fill="#EE822A" rx="1" />
                  </>
                ) : (
                  <>
                    <Circle cx="12" cy="12" r="10" stroke="#EE822A" strokeWidth="2" />
                    <Path d="M10 8l6 4-6 4V8z" fill="#EE822A" />
                  </>
                )}
              </Svg>
            </TouchableOpacity>
            <Text style={styles.timerText}>
              {(() => {
                const totalSeconds = parseInt(set.weight) || 0;
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              })()}
            </Text>
          </View>
        ) : (
          /* Touchable Weight Picker Input */
          <TouchableOpacity
            style={[styles.setInputField, { flex: 1.5, justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => openEditSetModal && openEditSetModal(exercise.id, set.id, set.reps, set.weight)}
            activeOpacity={0.7}
          >
            <Text style={{ color: set.weight !== undefined && parseFloat(set.weight) !== 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>
              {set.weight !== undefined && parseFloat(set.weight) !== 0 ? set.weight.toString() : '0.0'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.checkCircle,
            set.completed ? styles.checkCircleActive : null,
          ]}
          onPress={() => toggleSetCompletion(exercise.id, set.id)}
        >
          <Svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M20 6L9 17l-5-5"
              stroke={set.completed ? '#FFF' : '#888'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const FastWorkoutActiveScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  // Extract params passed from CreateFastWorkoutScreen / CreateCustomWorkoutScreen
  const { exercises: initialExercises, duration, level, workoutName, folderName, isSetupMode, source, isCustomWorkout: isCustomWorkoutParam } = route.params || {};
  const isCustomWorkout = Boolean(isCustomWorkoutParam || source === 'custom_workout' || folderName);

  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [calories, setCalories] = useState(0);

  // Active running set timers
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

  // Exercises state - initialized from route params, pre-populating sets if custom template exists
  const [exercises, setExercises] = useState(() => {
    return (initialExercises || []).map((ex, index) => {
      const prePopulatedSets = [];
      if (ex.setsArray && Array.isArray(ex.setsArray) && ex.setsArray.length > 0) {
        ex.setsArray.forEach((s, sIdx) => {
          prePopulatedSets.push({
            id: `set-${Date.now()}-${sIdx}-${Math.random()}`,
            reps: s.reps !== undefined && s.reps !== null ? Number(s.reps) : 0,
            weight: s.weight !== undefined && s.weight !== null ? parseFloat(s.weight) : 0,
            completed: false
          });
        });
      } else {
        const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 0);
        if (setsCount > 0) {
          for (let i = 0; i < setsCount; i++) {
            const s = Array.isArray(ex.sets) ? ex.sets[i] : {};
            prePopulatedSets.push({
              id: `set-${Date.now()}-${i}-${Math.random()}`,
              reps: s.reps !== undefined && s.reps !== null ? Number(s.reps) : 0,
              weight: s.weight !== undefined && s.weight !== null ? parseFloat(s.weight) : 0,
              completed: false
            });
          }
        }
      }
      return {
        ...ex,
        id: ex.id || ex._id || ex.exerciseId || `ex-${Date.now()}-${index}`,
        imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || null,
        sets: prePopulatedSets.length > 0 ? prePopulatedSets : [],
      };
    });
  });

  // Derived completed sets count
  const completedSetsCount = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const validSets = Array.isArray(ex.sets) ? ex.sets : [];
      return acc + validSets.filter(s => s.completed).length;
    }, 0);
  }, [exercises]);

  // Effect to catch added exercises from CreateFastWorkoutScreen
  const addedExercises = route.params?.addedExercises;
  useEffect(() => {
    if (addedExercises && addedExercises.length > 0) {
      setExercises(prev => {
        const newExercises = [...prev];
        addedExercises.forEach(ex => {
          if (!newExercises.some(existing => existing.id === ex.id)) {
            const setsCount = typeof ex.sets === 'number' ? ex.sets : (Array.isArray(ex.sets) ? ex.sets.length : 0);
            const prePopulatedSets = [];
            if (setsCount > 0) {
              for (let i = 0; i < setsCount; i++) {
                const s = Array.isArray(ex.sets) ? ex.sets[i] : {};
                prePopulatedSets.push({
                  id: `set-${Date.now()}-${i}-${Math.random()}`,
                  reps: s.reps !== undefined && s.reps !== null ? Number(s.reps) : 0,
                  weight: s.weight !== undefined && s.weight !== null ? parseFloat(s.weight) : 0,
                  completed: false
                });
              }
            }
            newExercises.push({
              ...ex,
              id: ex.id || ex._id || ex.exerciseId || `ex-${Date.now()}-${Math.random()}`,
              imageUrl: resolveExerciseImageUri(ex) || ex.imageUrl || null,
              sets: prePopulatedSets.length > 0 ? prePopulatedSets : [],
            });
          }
        });
        return newExercises;
      });
      navigation.setParams({ addedExercises: null });
    }
  }, [addedExercises, navigation]);

  // Derived reactive volume based on completed sets (excluding time-based exercises)
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

  // Image state
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [workoutTitle, setWorkoutTitle] = useState(
    folderName
      ? (workoutName && !workoutName.toLowerCase().startsWith('day ')
        ? workoutName
        : `${folderName}${workoutName && workoutName.toLowerCase().startsWith('day ') ? ' ' + workoutName.substring(4) : ''}`)
      : (workoutName || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()])
  );
  const [failedImages, setFailedImages] = useState({});

  // Personal Records (PR) Tracking States
  const [personalBests, setPersonalBests] = useState({});
  const sessionBestsRef = useRef({});

  // Inline Exercise Modal States
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

  const displayedExercises = (apiExercises || []).filter(ex =>
    (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.equipment || (ex.equipments && ex.equipments[0]) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.target || (ex.targetMuscles && ex.targetMuscles[0]) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    // Preset selected exercises with the exercises currently in the active workout!
    setSelectedExercises(exercises);
    setAddExerciseModalVisible(true);
  };

  const handleSaveSelectedExercises = () => {
    setExercises(prev => {
      const updatedExercises = [];
      selectedExercises.forEach(selectedEx => {
        // Check if this exercise already existed in the active workout session
        const existingEx = prev.find(ex => ex.id === selectedEx.id);
        if (existingEx) {
          // Preserve the existing exercise with all its progress/sets!
          updatedExercises.push(existingEx);
        } else {
          // Initialize new exercise with default sets
          const setsCount = 3;
          const prePopulatedSets = [];
          for (let i = 0; i < setsCount; i++) {
            prePopulatedSets.push({
              id: `set-${Date.now()}-${i}-${Math.random()}`,
              reps: 0,
              weight: 0,
              completed: false
            });
          }
          updatedExercises.push({
            ...selectedEx,
            id: selectedEx.id || selectedEx._id || `ex-${Date.now()}-${Math.random()}`,
            sets: prePopulatedSets,
          });
        }
      });
      return updatedExercises;
    });

    setAddExerciseModalVisible(false);
    setSelectedExercises([]);
    setSearchQuery('');
    setSelectedEquipment('');
    setSelectedMuscles([]);
  };

  const renderExerciseItem = ({ item }) => {
    const target = item.target || (item.targetMuscles && item.targetMuscles[0]) || '';
    const equipment = item.equipment || (item.equipments && item.equipments[0]) || '';
    const rawImg = item.imageUrl || item.gifUrl || (item.exerciseId ? `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/image/${item.exerciseId}` : null);
    const imageSource = rawImg
      ? { uri: rawImg, headers: { 'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com', 'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d' } }
      : null;
    const isSelected = selectedExercises.some(ex => ex.id === item.id);

    return (
      <View
        style={[styles.exerciseCardCustom, isSelected && styles.exerciseCardSelectedCustom]}
      >
        <View style={styles.exerciseRowCustom}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.75}
            onPress={() => toggleExerciseSelection(item)}
          >
            <Image source={imageSource} style={styles.exerciseThumbnailCustom} resizeMode="cover" />
            <View style={[styles.exerciseInfoCustom, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.exerciseNameCustom}>{item.name}</Text>
              <View style={styles.badgeRowCustom}>
                {target ? (
                  <View style={styles.badgeCustom}>
                    <Text style={styles.badgeTextCustom}>{target.toUpperCase()}</Text>
                  </View>
                ) : null}
                {equipment ? (
                  <View style={[styles.badgeCustom, { backgroundColor: '#1C1C1E' }]}>
                    <Text style={[styles.badgeTextCustom, { color: '#AEAEB2' }]}>{equipment.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('[FastWorkoutActive] Navigating to ExerciseDetail with item:', item.name);
              try {
                setReopenModalOnFocus(true);
                setAddExerciseModalVisible(false);
                navigation.navigate('ExerciseDetail', { exercise: item });
              } catch (err) {
                console.error('[FastWorkoutActive] Navigation failed:', err);
                Alert.alert('Navigation Error', err.message);
              }
            }}
            style={{ padding: 10, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}
            activeOpacity={0.7}
          >
            <Icon name="play-circle-outline" size={24} color="#EE822A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleExerciseSelection(item)}
            style={styles.checkboxCustom}
            activeOpacity={0.75}
          >
            {isSelected && <Icon name="checkmark" size={16} color="#EE822A" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (exercises && exercises.length > 0) {
      const fetchBests = async () => {
        try {
          const names = exercises.map(ex => ex.name).join(',');
          const response = await apiClient.get(`/workouts/sessions/personal-bests?exerciseNames=${encodeURIComponent(names)}`);
          if (response.data && response.data.success) {
            setPersonalBests(prev => {
              const merged = {
                ...response.data.data,
                ...prev
              };
              // Synchronize database historical personal bests to session ref
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

  // PR Notification states
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
    console.log(`[PR_DEBUG] showPRNotification called for ex=${exerciseName}, w=${weight}, r=${reps}`);
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

    // Give React Native 50ms to mount the conditionally rendered absolute View on iOS
    const mountTimeout = setTimeout(() => {
      Animated.spring(prAnim, {
        toValue: 12, // Slide down to 12px from top of container
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    }, 50);
    prTimerRefs.current.push(mountTimeout);

    // Transition to Part 1 (after 2s)
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

    // Transition to Part 2 (after 4s)
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

    // Dismiss (after 6s)
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

  // Camera Hooks & States
  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({ quality: 0.8 });
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);

  // Modal States
  const [isSetModalVisible, setSetModalVisible] = useState(false);
  const [isSaveWorkoutModalVisible, setSaveWorkoutModalVisible] =
    useState(false);
  const [isVisibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [isRestTimerVisible, setRestTimerVisible] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [editingSetId, setEditingSetId] = useState(null);
  const [visibility, setVisibility] = useState('EVERYONE');

  // Picker temporary states
  const [tempReps, setTempReps] = useState(0);
  const [tempWeight, setTempWeight] = useState(0);
  const [workoutNotes, setWorkoutNotes] = useState('');

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
        setProgressPhotos(prev => [...prev, imagePath]);
        setShowCameraOverlay(false);
        // Restore Save Workout modal after camera closes
        setTimeout(() => {
          setSaveWorkoutModalVisible(true);
        }, 400);
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
    // Hide camera overlay first
    setShowCameraOverlay(false);
    // Wait for camera modal dismiss transition before showing image picker
    setTimeout(() => {
      try {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 5 }, response => {
          if (
            !response.didCancel &&
            !response.errorCode &&
            response.assets && response.assets.length > 0
          ) {
            const uris = response.assets.map(a => a.uri);
            setProgressPhotos(prev => [...prev, ...uris].slice(0, 5));
          }
          // Restore Save Workout modal
          setSaveWorkoutModalVisible(true);
        });
      } catch (err) {
        Alert.alert('Gallery Launch Failed', err.message || String(err));
        setSaveWorkoutModalVisible(true);
      }
    }, 450);
  }, []);
  // Swipe to finish logic
  const pan = useRef(new Animated.ValueXY()).current;
  const swipeWidth = 250;
  const sliderWidth = 50;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > swipeWidth - sliderWidth - 20) {
          Animated.spring(pan, {
            toValue: { x: swipeWidth - sliderWidth, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            if (isSetupMode) {
              handleSaveTemplateSetup();
            } else {
              setSaveWorkoutModalVisible(true);
            }
            pan.setValue({ x: 0, y: 0 });
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

  // Save Set Swipe logic
  const savePan = useRef(new Animated.ValueXY()).current;
  const saveSwipeWidth = 200;
  const saveSliderWidth = 40;

  const savePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: savePan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > saveSwipeWidth - saveSliderWidth - 10) {
          Animated.spring(savePan, {
            toValue: { x: saveSwipeWidth - saveSliderWidth, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            handleAddSet();
            savePan.setValue({ x: 0, y: 0 });
          }, 200);
        } else {
          Animated.spring(savePan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  // Log Workout Swipe logic
  const logPan = useRef(new Animated.ValueXY()).current;
  const logSwipeWidth = 220;
  const logSliderWidth = 50;

  const handleLogWorkout = () => {
    const sessionData = {
      level,
      duration: seconds,
      calories,
      volume,
      visibility,
      workoutName: workoutTitle.trim() || 'Workout',
      notes: workoutNotes.trim() || null,
      templateId: route.params?.templateId || null,
      exercises: exercises
        .filter(ex => ex.sets && ex.sets.some(s => s.completed))
        .map(ex => ({
          exerciseId: ex.id,
          name: ex.name,
          sets: ex.sets.filter(s => s.completed),
        })),
      templateExercises: exercises
        .filter(ex => ex.sets && ex.sets.some(s => s.completed))
        .map(ex => {
          const completedSets = ex.sets.filter(s => s.completed);
          return {
            id: ex.id,
            name: ex.name,
            sets: completedSets.length,
            reps: completedSets[0].reps,
            weight: completedSets[0].weight.toString(),
          };
        }),
    };
    // Navigate to WorkoutSummary to review, add a picture, and save
    setSaveWorkoutModalVisible(false);
    logPan.setValue({ x: 0, y: 0 });
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
      Alert.alert('Success', 'Workout template saved successfully!');
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save template setup:', err);
      Alert.alert('Error', err.message || 'Failed to save template setup. Please try again.');
    }
  };

  const handleLogWorkoutRef = useRef(handleLogWorkout);
  useEffect(() => {
    handleLogWorkoutRef.current = handleLogWorkout;
  });

  const logPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: logPan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > logSwipeWidth - logSliderWidth - 10) {
          Animated.spring(logPan, {
            toValue: { x: logSwipeWidth - logSliderWidth, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            handleLogWorkoutRef.current();
          }, 300);
        } else {
          Animated.spring(logPan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (isSaveWorkoutModalVisible) return undefined;

    const interval = setInterval(() => {
      setSeconds(currentSeconds => {
        const nextSeconds = currentSeconds + 1;
        if (nextSeconds % 30 === 0) {
          setCalories(currentCalories => currentCalories + 2);
        }
        return nextSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSaveWorkoutModalVisible]);

  useEffect(() => {
    console.log('[Clarity] Workout opened');
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
    console.log('[FastWorkoutActiveScreen] handlePickImage triggered');
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
                    quality: 0.8,
                    selectionLimit: 5,
                  },
                  response => {
                    if (!response.didCancel && !response.errorCode && response.assets && response.assets.length > 0) {
                      const uris = response.assets.map(a => a.uri);
                      setProgressPhotos(prev => [...prev, ...uris].slice(0, 5));
                    }
                    setSaveWorkoutModalVisible(true);
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

  const openAddSetModal = exerciseId => {
    setActiveExerciseId(exerciseId);
    setEditingSetId(null);

    // Find the last set of this exercise to default picker values
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const timeBased = exercise ? isTimeBasedExercise(exercise) : false;
    if (exercise && exercise.sets && exercise.sets.length > 0) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      setTempReps(lastSet.reps !== undefined ? Number(lastSet.reps) : 12);
      setTempWeight(lastSet.weight !== undefined ? parseFloat(lastSet.weight) || (timeBased ? 30.0 : 4.0) : (timeBased ? 30.0 : 4.0));
    } else {
      setTempReps(12);
      setTempWeight(timeBased ? 30.0 : 4.0);
    }

    setSetModalVisible(true);
  };

  const openEditSetModal = (exerciseId, setId, currentReps, currentWeight) => {
    setActiveExerciseId(exerciseId);
    setEditingSetId(setId);
    const r = currentReps !== undefined && currentReps !== null ? parseInt(currentReps) || 0 : 0;
    const w = currentWeight !== undefined && currentWeight !== null ? parseFloat(currentWeight) || 0.0 : 0.0;
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

  const handleUpdateSet = (exerciseId, setId, field, text) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id === setId) {
                return { ...s, [field]: text };
              }
              return s;
            })
          };
        }
        return ex;
      })
    );
  };

  const checkAndTriggerPR = (exerciseName, weightStr, repsStr, currentSetId) => {
    const curReps = parseInt(repsStr) || 0;
    const curWeight = parseFloat(weightStr ? weightStr.toString().replace(',', '.') : '0') || 0;
    console.log(`[PR_DEBUG] checkAndTriggerPR input: ex=${exerciseName}, w=${curWeight}, r=${curReps}, setId=${currentSetId}`);

    if (curWeight < 0 || curReps <= 0) {
      console.log(`[PR_DEBUG] curWeight < 0 or curReps <= 0, skipping check`);
      return;
    }

    const normalizedExName = exerciseName.trim().toLowerCase();

    // 1. Get historical personal best with case-insensitive / trim matching
    const histKey = Object.keys(personalBests).find(k => k.trim().toLowerCase() === normalizedExName);
    const histBest = histKey ? personalBests[histKey] : null;
    const histWeight = histBest && histBest.weight !== undefined && histBest.weight !== null ? parseFloat(histBest.weight) : 0;
    const histReps = histBest && histBest.reps !== undefined && histBest.reps !== null ? parseInt(histBest.reps) : 0;
    console.log(`[PR_DEBUG] histBest loaded: w=${histWeight}, r=${histReps}`);

    // 2. Get session personal best (from ref) with case-insensitive / trim matching
    const sessKey = Object.keys(sessionBestsRef.current).find(k => k.trim().toLowerCase() === normalizedExName);
    const sessBest = sessKey ? sessionBestsRef.current[sessKey] : null;
    const sessWeight = sessBest ? sessBest.weight : 0;
    const sessReps = sessBest ? sessBest.reps : 0;
    console.log(`[PR_DEBUG] sessBest loaded: w=${sessWeight}, r=${sessReps}`);

    // The current baseline best to beat is the max of historical and session bests
    let bestWeight = Math.max(histWeight, sessWeight);
    let bestReps = 0;
    if (bestWeight === histWeight) {
      bestReps = Math.max(bestReps, histReps);
    }
    if (bestWeight === sessWeight) {
      bestReps = Math.max(bestReps, sessReps);
    }
    console.log(`[PR_DEBUG] base best calculated: w=${bestWeight}, r=${bestReps}`);

    // 3. Synchronously check other completed sets in this session to prevent state lag
    const exercise = exercises.find(ex => ex.name.trim().toLowerCase() === normalizedExName);
    if (exercise && exercise.sets) {
      exercise.sets.forEach(s => {
        if (s.completed && s.id !== currentSetId) {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          console.log(`[PR_DEBUG] checking sibling set: id=${s.id}, w=${w}, r=${r}`);
          if (w > bestWeight) {
            bestWeight = w;
            bestReps = r;
          } else if (w === bestWeight && r > bestReps) {
            bestReps = r;
          }
        }
      });
    }
    console.log(`[PR_DEBUG] final best to beat: w=${bestWeight}, r=${bestReps}`);

    let isNewPR = false;
    let shouldUpdatePB = false;

    if (bestWeight === 0 && bestReps === 0) {
      console.log(`[PR_DEBUG] baseline is 0 - checking baseline PR`);
      shouldUpdatePB = true;
      isNewPR = false;
    } else if (curWeight > bestWeight) {
      console.log(`[PR_DEBUG] curWeight > bestWeight`);
      isNewPR = true;
      shouldUpdatePB = true;
    } else if (curWeight === bestWeight && curReps > bestReps) {
      console.log(`[PR_DEBUG] curWeight === bestWeight and curReps > bestReps`);
      isNewPR = true;
      shouldUpdatePB = true;
    }

    console.log(`[PR_DEBUG] result isNewPR=${isNewPR}, shouldUpdatePB=${shouldUpdatePB}`);

    if (isNewPR) {
      console.log(`[PR_DEBUG] Calling showPRNotification...`);
      showPRNotification(exerciseName, curWeight, curReps);
    }

    if (shouldUpdatePB) {
      // Update ref synchronously!
      sessionBestsRef.current[exerciseName] = { weight: curWeight, reps: curReps };

      // Update state for next renders
      setPersonalBests(prev => ({
        ...prev,
        [exerciseName]: { weight: curWeight, reps: curReps }
      }));
    }
  };

  const handleAddSet = () => {
    const { activeExerciseId, tempReps, tempWeight } = stateRef.current;

    // Note: checkAndTriggerPR will be triggered when the user ticks/completes the set (or via Mark All Sets)

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === activeExerciseId) {
          return {
            ...ex,
            sets: [
              ...(Array.isArray(ex.sets) ? ex.sets : []),
              {
                id: Date.now().toString(),
                reps: tempReps,
                weight: tempWeight,
                completed: true, // Mark as completed immediately since user manually added this set
              },
            ],
          };
        }
        return ex;
      }),
    );
    setSetModalVisible(false);
  };

  const toggleSetCompletion = (exerciseId, setId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const set = exercise.sets.find(s => s.id === setId);
    if (!set) return;

    const willBeCompleted = !set.completed;

    if (willBeCompleted) {
      checkAndTriggerPR(exercise.name, set.weight, set.reps, set.id);
      // Remove from active timers if completed
      setActiveTimerSetIds(prev => prev.filter(id => id !== setId));
    }

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s =>
              s.id === setId ? { ...s, completed: !s.completed } : s,
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

    setExercises(prev =>
      prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (targetStatus && !s.completed) {
                checkAndTriggerPR(ex.name, s.weight, s.reps, s.id);
              }
              return { ...s, completed: targetStatus };
            }),
          };
        }
        return ex;
      }),
    );

    if (targetStatus) {
      const setIds = exercise.sets.map(s => s.id);
      setActiveTimerSetIds(prev => prev.filter(id => !setIds.includes(id)));
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
    const validSets = Array.isArray(ex.sets) ? ex.sets : [];
    return acc + validSets.reduce((setAcc, set) => setAcc + (set.reps || 0), 0);
  }, 0);
  const completedExercisesCount = exercises.filter(
    ex => Array.isArray(ex.sets) && ex.sets.length > 0,
  ).length;

  const closeWorkout = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {exercises.length === 0 ? (
          /* Stats Row at Top (as seen in the image) */
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
          /* Standard Header */
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
          {exercises.length === 0 ? (
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
                <TouchableOpacity style={styles.settingsBtn} onPress={() => { /* Settings action placeholder */ }}>
                  <Text style={styles.settingsBtnText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.discardBtn} onPress={closeWorkout}>
                  <Text style={styles.discardBtnText}>Discard Workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.durationHeader}>
                    <View style={styles.greenDot} />
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

              {/* Subheader */}
              <View style={styles.subHeaderRow}>
                <Text style={styles.exercisesCount}>
                  {exercises.length} EXERCISES
                </Text>
              </View>
            </>
          )}

          {/* Exercises List */}
          {exercises.map((exercise, index) => (
            <View
              key={exercise.id || exercise.exerciseId || `exercise-${index}`}
              style={[styles.exerciseContainer, index > 0 && { marginTop: 20 }]}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseImagePlaceholder}>
                  {(() => {
                    const target = (exercise.targetMuscles && exercise.targetMuscles[0]) || (exercise.bodyParts && exercise.bodyParts[0]) || 'triceps';
                    const rawImg = resolveExerciseImageUri(exercise);
                    if (rawImg && !failedImages[exercise.id]) {
                      return (
                        <Image
                          source={{
                            uri: rawImg,
                            headers: rawImg.includes('rapidapi') ? {
                              'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
                              'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
                            } : undefined,
                          }}
                          style={{ width: 60, height: 60, borderRadius: 30 }}
                          resizeMode="cover"
                          onError={() => setFailedImages((prev) => ({ ...prev, [exercise.id]: true }))}
                        />
                      );
                    }
                    const muscleAvatar = getMuscleImageUrl(target);
                    return (
                      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#1C2430', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <Image source={{ uri: muscleAvatar }} style={{ width: 44, height: 44 }} resizeMode="contain" />
                      </View>
                    );
                  })()}
                </View>
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
                          ? ` . ${parseFloat(totalVal.toFixed(2))}s`
                          : ` . ${parseFloat(totalVal.toFixed(2))}kg`)
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

              {(Array.isArray(exercise.sets) ? exercise.sets : []).length >
                0 && (
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
                    handleUpdateSet={handleUpdateSet}
                    checkAndTriggerPR={checkAndTriggerPR}
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

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Finish Button */}
        {exercises.length > 0 && (
          <View style={styles.floatingFinishContainer}>
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
                style={styles.saveTemplateBtn}
                onPress={() => setSaveWorkoutModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.saveTemplateBtnText}>Finish Workout</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Add Set Modal */}
        <Modal visible={isSetModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeExerciseName}</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSetModalVisible(false)}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="#FFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.pickerArea}>
                {/* Reps Column */}
                <View style={styles.pickerColumn}>
                  <ScrollView
                    ref={repsScrollRef}
                    style={styles.wheelScrollView}
                    contentContainerStyle={styles.wheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const y = e.nativeEvent.contentOffset.y;
                      const index = Math.round(y / ITEM_HEIGHT);
                      const val = Math.max(0, Math.min(100, index));
                      setTempReps(val);
                    }}
                  >
                    <View style={{ height: SPACER_HEIGHT }} />
                    {Array.from({ length: 101 }, (_, i) => i).map((num) => {
                      const isActive = num === tempReps;
                      return (
                        <TouchableOpacity
                          key={num}
                          style={styles.wheelItem}
                          activeOpacity={0.7}
                          onPress={() => updateTempReps(num)}
                        >
                          <Text style={isActive ? styles.activePickerValue : styles.fadedPickerText}>
                            {num}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={{ height: SPACER_HEIGHT }} />
                  </ScrollView>
                  <Text style={styles.absolutePickerLabel}>Reps</Text>
                </View>

                {/* Weight Column */}
                <View style={styles.pickerColumn}>
                  <ScrollView
                    ref={weightScrollRef}
                    style={styles.wheelScrollView}
                    contentContainerStyle={styles.wheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const y = e.nativeEvent.contentOffset.y;
                      const index = Math.round(y / ITEM_HEIGHT);
                      const val = isTimeBased
                        ? Math.max(0, index * 5)
                        : Math.max(0, index * 0.5);
                      setTempWeight(val);
                    }}
                  >
                    <View style={{ height: SPACER_HEIGHT }} />
                    {(isTimeBased
                      ? Array.from({ length: 121 }, (_, i) => i * 5)
                      : Array.from({ length: 601 }, (_, i) => i * 0.5)
                    ).map((val) => {
                      const isActive = isTimeBased
                        ? Math.abs(val - tempWeight) < 0.1
                        : Math.abs(val - tempWeight) < 0.01;
                      return (
                        <TouchableOpacity
                          key={val}
                          style={styles.wheelItem}
                          activeOpacity={0.7}
                          onPress={() => updateTempWeight(val)}
                        >
                          <Text style={isActive ? styles.activePickerValue : styles.fadedPickerText}>
                            {isTimeBased ? `${val}s` : val.toFixed(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={{ height: SPACER_HEIGHT }} />
                  </ScrollView>
                  <Text style={styles.absolutePickerLabelKg}>{isTimeBased ? 'sec' : 'kg'}</Text>
                </View>

                <View style={styles.highlightOverlay} pointerEvents="none" />
              </View>

              <View style={styles.saveBtnContainer}>
                <TouchableOpacity
                  style={styles.gradientSaveBtn}
                  activeOpacity={0.8}
                  onPress={handleSaveSetModal}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={styles.gradientSaveBtnFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.gradientSaveBtnText}>{editingSetId ? 'SAVE SET' : 'ADD SET'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Rest Timer Modal */}
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
        <Modal
          visible={isSaveWorkoutModalVisible}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ready To Save Workout ?</Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSaveWorkoutModalVisible(false)}
                >
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="#FFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.saveSummaryContent}>
                <View style={styles.uploadPhotoBox}>
                  {progressPhotos.length > 0 ? (
                    <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={{ flex: 1 }}
                        onScroll={(event) => {
                          const slide = Math.round(
                            event.nativeEvent.contentOffset.x /
                            event.nativeEvent.layoutMeasurement.width
                          );
                          if (slide !== currentSlide) {
                            setCurrentSlide(slide);
                          }
                        }}
                        scrollEventThrottle={16}
                      >
                        {progressPhotos.map((uri, index) => (
                          <Image
                            key={index}
                            source={{ uri }}
                            style={{
                              width: width - 80,
                              height: 180,
                              borderRadius: 15,
                            }}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>

                      {progressPhotos.length > 1 && (
                        <View style={styles.dotsContainer}>
                          {progressPhotos.map((_, index) => (
                            <View
                              key={index}
                              style={[
                                styles.dot,
                                index === currentSlide && styles.activeDot,
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                      onPress={handlePickImage}
                    >
                      <LinearGradient
                        colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cameraIconCircle}
                      >
                        <Icon name="camera-outline" size={24} color="#FFF" />
                      </LinearGradient>
                      <Text style={styles.uploadPhotoText}>
                        Upload Progress Photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {progressPhotos.length > 0 && (
                  <View style={styles.modalThumbnailsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {progressPhotos.map((uri, index) => (
                        <View key={index} style={styles.modalThumbnailWrapper}>
                          <Image source={{ uri }} style={styles.modalThumbnailImage} />
                          <TouchableOpacity
                            style={styles.modalDeleteThumbnailBtn}
                            onPress={() => {
                              setProgressPhotos(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <Svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                              <Path d="M18 6L6 18M6 6L18 18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                            </Svg>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {progressPhotos.length < 5 && (
                        <TouchableOpacity style={styles.modalAddThumbnailBtn} onPress={handlePickImage}>
                          <Icon name="camera-outline" size={18} color="#EE822A" />
                        </TouchableOpacity>
                      )}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.visibilityRow}>
                  <Text style={styles.visibilityText}>VISIBILITY </Text>
                  <TouchableOpacity
                    style={styles.visibilityDropdown}
                    onPress={() => setVisibilityModalVisible(true)}
                  >
                    <Text style={styles.visibilityDropdownText}>
                      {visibility}
                    </Text>
                    <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M6 9L12 15L18 9"
                        stroke="#FFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelLeft}>
                      {formatTime(seconds).replace(':', ' Min ')}
                    </Text>
                    <View style={styles.progressLabelRight}>
                      <Text style={styles.progressLabelRightText}>
                        {completedExercisesCount} Exercise
                      </Text>
                      <Svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ marginLeft: 4 }}
                      >
                        <Circle cx="12" cy="12" r="10" fill="#00FF00" />
                        <Path
                          d="M8 12L11 15L16 9"
                          stroke="#000"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: '30%' }]}
                    />
                  </View>
                  <TextInput
                    value={workoutTitle}
                    onChangeText={setWorkoutTitle}
                    style={styles.progressSubLabelInput}
                    placeholder="Workout Title"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                  <TextInput
                    value={workoutNotes}
                    onChangeText={setWorkoutNotes}
                    style={[styles.progressSubLabelInput, { marginTop: 10, height: 60, textAlignVertical: 'top' }]}
                    placeholder="Description / Notes"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                  />
                </View>

                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{volume}</Text>
                    <Text style={styles.summaryStatLabel}>
                      Total Weight (Kg)
                    </Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{totalReps}</Text>
                    <Text style={styles.summaryStatLabel}>Total Reps</Text>
                  </View>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{calories}</Text>
                    <Text style={styles.summaryStatLabel}>Calories</Text>
                  </View>
                </View>

                <View style={styles.logBtnContainer}>
                  <TouchableOpacity
                    style={styles.saveTemplateBtn}
                    onPress={handleLogWorkout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.saveTemplateBtnText}>Log Workout</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isVisibilityModalVisible && (
                <View style={styles.visibilityOverlay}>
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={() => setVisibilityModalVisible(false)}
                  />
                  <View style={styles.visibilityPopup}>
                    <Text style={styles.visibilityPopupTitle}>Visibility</Text>

                    <TouchableOpacity
                      style={styles.visibilityOptionRow}
                      onPress={() => {
                        setVisibility('EVERYONE');
                        setVisibilityModalVisible(false);
                      }}
                    >
                      <View style={styles.visibilityOptionTexts}>
                        <Text style={styles.visibilityOptionTitle}>
                          Everyone
                        </Text>
                        <Text style={styles.visibilityOptionDesc}>
                          This workout is publicly available to all users on
                          Hevy.
                        </Text>
                      </View>
                      {visibility === 'EVERYONE' && (
                        <Svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <Path
                            d="M20 6L9 17l-5-5"
                            stroke="#007BFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>

                    <View style={styles.visibilityPopupDivider} />

                    <TouchableOpacity
                      style={styles.visibilityOptionRow}
                      onPress={() => {
                        setVisibility('PRIVATE');
                        setVisibilityModalVisible(false);
                      }}
                    >
                      <View style={styles.visibilityOptionTexts}>
                        <Text style={styles.visibilityOptionTitle}>
                          Private
                        </Text>
                        <Text style={styles.visibilityOptionDesc}>
                          Keep this workout private and visible only to you for
                          personal use.
                        </Text>
                      </View>
                      {visibility === 'PRIVATE' && (
                        <Svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <Path
                            d="M20 6L9 17l-5-5"
                            stroke="#007BFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

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

        {/* 9. Inline Search & Select Exercises Modal */}
        <Modal
          visible={isAddExerciseModalVisible}
          animationType="slide"
          transparent={false}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.editorHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setAddExerciseModalVisible(false)}
              >
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              <View style={styles.headerPillCustom}>
                <Text style={styles.headerPillTextCustom}>
                  {isCustomWorkout ? 'Create a Custom Workout' : 'Add Exercises'}
                </Text>
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

            {/* Horizontal scroll list of selected exercises */}
            {selectedExercises.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.selectedExercisesRow}
                contentContainerStyle={styles.selectedExercisesRowContent}
              >
                {selectedExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.selectedExercisePill}
                    onPress={() => {
                      setSelectedExercises(prev => prev.filter(ex => ex.id !== exercise.id));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectedExercisePillText} numberOfLines={1}>
                      {exercise.name}
                    </Text>
                    <Svg width="8" height="8" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
                      <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

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
                <Text style={styles.filterLabel}>MUSCLE GROUP</Text>
                <Text style={styles.filterValue} numberOfLines={1}>
                  {selectedMuscles.length > 0 ? selectedMuscles.join(', ') : (isCustomWorkout ? 'Interactive Body Map' : 'All Muscles')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listArea}>
              {apiLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading exercises...</Text>
                </View>
              ) : displayedExercises.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No exercises found matching your filters.</Text>
                  {(selectedEquipment !== '' || selectedMuscles.length > 0) && (
                    <TouchableOpacity
                      style={styles.clearFiltersBtn}
                      onPress={() => {
                        setSelectedEquipment('');
                        setSelectedMuscles([]);
                      }}
                    >
                      <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
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
                  onPress={handleSaveSelectedExercises}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.addSelectedButtonTextCustom}>
                    {isCustomWorkout
                      ? `Save Selected Exercises (${selectedExercises.length})`
                      : `Add Selected Exercises (${selectedExercises.length})`}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.addSelectedButtonCustom, styles.addSelectedButtonDisabledCustom]}>
                  <Text style={styles.addSelectedButtonTextCustom}>
                    {isCustomWorkout
                      ? 'Save Selected Exercises (0)'
                      : 'Add Selected Exercises (0)'}
                  </Text>
                </View>
              )}
            </View>
          </SafeAreaView>

          {/* Equipment Selector Modal */}
          <EquipmentModal
            visible={isEquipmentModalVisible}
            onClose={() => setIsEquipmentModalVisible(false)}
            selectedEquipment={selectedEquipment}
            onSelectEquipment={(eq) => setSelectedEquipment(eq)}
          />

          {/* Muscle Selector Modal */}
          <MuscleModal
            visible={isMuscleModalVisible}
            onClose={() => setIsMuscleModalVisible(false)}
            selectedMuscles={selectedMuscles}
            onSelectMuscle={(muscle) => toggleMuscle(muscle)}
          />
        </Modal>
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
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
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
    backgroundColor: '#CCC',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  placeholderIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#000',
    borderTopLeftRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  moreOptionsBtn: { padding: 10 },
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
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  swipeRowWrapper: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 25,
    overflow: 'hidden',
  },
  deleteSetActionBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSetActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  setNumText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  setValText: { flex: 1, color: '#FFF', fontSize: 15, textAlign: 'center' },
  setInputField: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 8,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  checkCircleActive: { backgroundColor: '#008000' },
  colPrevious: {
    flex: 2,
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  setPrevText: {
    flex: 2,
    color: '#8E8E9A',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  timerContainer: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    marginRight: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
  floatingFinishContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  finishWorkoutBg: {
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  finishWorkoutTextBg: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    position: 'absolute',
    zIndex: 0,
  },
  arrowsContainer: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    zIndex: 0,
  },
  finishSwipeThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  finishCheckCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2E4D9F',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  pickerArea: {
    height: 150,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 0,
    position: 'relative',
  },
  pickerColumn: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%',
    position: 'relative',
  },
  wheelScrollView: {
    width: '100%',
    height: '100%',
  },
  wheelContent: {
    alignItems: 'center',
  },
  wheelItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fadedPickerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 20,
  },
  activePickerValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  absolutePickerLabel: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 16,
    right: 15,
    top: '50%',
    marginTop: -10,
    fontWeight: '600',
  },
  absolutePickerLabelKg: {
    position: 'absolute',
    color: '#FFF',
    fontSize: 16,
    right: 5,
    top: '50%',
    marginTop: -10,
    fontWeight: '600',
  },
  highlightOverlay: {
    position: 'absolute',
    top: '50%',
    left: 10,
    right: 10,
    height: 50,
    marginTop: -25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    zIndex: -1,
  },
  pickerTouchTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  pickerTouchBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  saveBtnContainer: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  gradientSaveBtn: {
    width: '60%',
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  gradientSaveBtnFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientSaveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  saveSwipeBg: {
    backgroundColor: '#2D1B4E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4A148C',
    overflow: 'hidden',
  },
  saveSwipeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    position: 'absolute',
    zIndex: 0,
  },
  saveArrows: {
    position: 'absolute',
    right: 15,
    flexDirection: 'row',
    zIndex: 0,
  },
  saveSwipeThumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  saveCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#A855F7',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
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
  saveSummaryContent: { paddingHorizontal: 20, paddingTop: 20 },
  uploadPhotoBox: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 15,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadPhotoText: { color: '#FFF', fontSize: 14 },
  visibilityRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  visibilityText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF',
  },
  visibilityDropdownText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  progressContainer: { marginBottom: 30 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabelLeft: { color: '#FFF', fontSize: 14 },
  progressLabelRight: { flexDirection: 'row', alignItems: 'center' },
  progressLabelRightText: { color: '#FFF', fontSize: 14 },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSubLabel: { color: '#FFF', fontSize: 14 },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#D8B4E2',
  },
  modalThumbnailsContainer: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  modalThumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 8,
  },
  modalThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  modalDeleteThumbnailBtn: {
    position: 'absolute',
    top: 1,
    right: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddThumbnailBtn: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8B4E2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(216, 180, 226, 0.1)',
  },
  progressSubLabelInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 2,
    marginTop: 8,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryStatLabel: { color: '#888', fontSize: 11 },
  logBtnContainer: { alignItems: 'center', marginBottom: 10 },
  visibilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  visibilityPopup: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#222',
  },
  visibilityPopupTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
  },
  visibilityOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  visibilityOptionTexts: { flex: 1, paddingRight: 20 },
  visibilityOptionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  visibilityOptionDesc: { color: '#888', fontSize: 13, lineHeight: 18 },
  visibilityPopupDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 5,
  },
  prNotificationBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
  },
  prNotificationContent: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    maxWidth: '90%',
    overflow: 'hidden',
    position: 'relative',
  },
  prNotificationIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  prNotificationEmoji: {
    fontSize: 11,
  },
  prNotificationTextContainer: {
    justifyContent: 'center',
  },
  prNotificationText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPillCustom: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  headerPillTextCustom: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchBarCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInputCustom: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 8,
    paddingVertical: 8,
  },
  selectedExercisesRow: {
    maxHeight: 50,
    marginTop: 12,
    marginHorizontal: 20,
  },
  selectedExercisesRowContent: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 20,
  },
  selectedExercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedExercisePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 120,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 15,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  filterLabel: {
    color: '#8E8E93',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  filterValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listArea: {
    flex: 1,
    marginTop: 15,
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
  },
  clearFiltersBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  clearFiltersBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseCardCustom: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    overflow: 'hidden',
  },
  exerciseCardSelectedCustom: {
    borderColor: '#EE822A',
    backgroundColor: 'rgba(238, 130, 42, 0.08)',
  },
  exerciseRowCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  exerciseThumbnailCustom: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
  },
  exerciseInfoCustom: {
    flex: 1,
    marginLeft: 12,
  },
  exerciseNameCustom: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeRowCustom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeCustom: {
    backgroundColor: 'rgba(238, 130, 42, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeTextCustom: {
    color: '#EE822A',
    fontSize: 10,
    fontWeight: '700',
  },
  checkboxCustom: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  addSelectedButtonCustom: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EE822A',
  },
  addSelectedButtonDisabledCustom: {
    backgroundColor: '#2C2C2E',
  },
  addSelectedButtonTextCustom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  selectorModalContent: {
    backgroundColor: '#15151F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 30,
  },
  selectorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  selectorModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  selectorItemText: {
    color: '#AEAEB2',
    fontSize: 15,
  },
  selectorItemTextActive: {
    color: '#EE822A',
    fontWeight: 'bold',
  },
});

export default FastWorkoutActiveScreen;
