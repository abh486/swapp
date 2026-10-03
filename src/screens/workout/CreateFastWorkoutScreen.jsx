import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, PanResponder, Animated, Image, ScrollView, Modal, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveMetrics } from '../../utils/responsive';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExercises,
  fetchEquipments,
  fetchMuscles,
  setSelectedFilters,
} from '../../redux/actions/workoutActions';
import {
  sortExercisesByAlreadyUsed,
  isExerciseUsed,
  recordUsedExercises,
  getExercisePerformanceHistory,
  initUsedWorkouts,
} from '../../utils/usedWorkoutsManager';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { getEquipmentImageUrl, getMuscleImageUrl } from '../../utils/workoutIcons';
import InteractiveMuscleMap from '../../components/workout/InteractiveMuscleMap';
import { EquipmentModal } from '../../components/EquipmentModal';
import { MuscleModal } from '../../components/MuscleModal';

const LIGHTNING_ICON = require('../../assets/image/tender.png');

const LEVEL_BODY_PARTS_MAP = {
  Beginner: ['cardio', 'neck'],
  Intermediate: ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  Advanced: ['waist', 'lower arms', 'lower legs'],
};

const CreateFastWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { equipments, muscles, exercises, loading } = useSelector(state => state.workout);
  const { wp, hp, ms, sp, fs } = useResponsiveMetrics();
  const styles = createFastWorkoutStyles({ wp, hp, ms, sp, fs });
  const swipeWidth = wp(65);
  const sliderWidth = ms(46);

  const { user } = useAuth() || {};

  useEffect(() => {
    if (user?.id) {
      initUsedWorkouts(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  // Default workout settings (running behind the scenes)
  const selectedLevel = 'Intermediate';
  const selectedEnv = 'BASIC GYM';
  const selectedDuration = '45min';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [isMuscleModalVisible, setIsMuscleModalVisible] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState([]);

  const toggleExerciseSelection = (exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(ex => ex.id === exercise.id)) {
        return prev.filter(ex => ex.id !== exercise.id);
      }
      return [...prev, exercise];
    });
  };

  const handleAddSelectedExercises = () => {
    if (selectedExercises && selectedExercises.length > 0) {
      recordUsedExercises(selectedExercises, Date.now(), user?.id);
    }
    navigation.navigate('FastWorkoutActive', {
      exercises: selectedExercises,
      addedExercises: selectedExercises,
      source: 'fast_workout',
      isCustomWorkout: false,
    });
  };

  useEffect(() => {
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
  }, [selectedEquipment, selectedMuscles, searchQuery, dispatch]);

  const selectEquipmentAndClose = (equipment) => {
    setSelectedEquipment(equipment === 'All Equipment' || equipment === 'All Equipement' ? '' : equipment);
    setIsEquipmentModalVisible(false);
  };

  const selectMuscleAndClose = (muscle) => {
    toggleMuscle(muscle);
    setIsMuscleModalVisible(false);
  };

  const equipmentList = [
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

  const musclesList = [
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
    'Lower Back',
    'Neck',
    'Quadriceps',
    'Shoulders',
    'Traps',
    'Triceps',
    'Upper Back',
    'Other',
  ];

  const toggleMuscle = muscle => {
    if (muscle === 'All Muscles') {
      setSelectedMuscles(prev => prev.includes(muscle) ? [] : [muscle]);
      return;
    }
    setSelectedMuscles(prev => {
      const cleanPrev = prev.filter(m => m !== 'All Muscles');
      const exists = cleanPrev.some(
        m => m.toLowerCase() === muscle.toLowerCase()
      );
      if (exists) {
        return cleanPrev.filter(
          m => m.toLowerCase() !== muscle.toLowerCase()
        );
      } else {
        return [...cleanPrev, muscle];
      }
    });
  };

  const pan = React.useRef(new Animated.ValueXY()).current;

  const handleCreateWorkout = async () => {
    setIsCreating(true);
    try {
      dispatch(setSelectedFilters(selectedEquipment, selectedMuscles));
      const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');

      const UI_TO_API_MUSCLE_MAP = {
        abdominals: { type: 'target', value: 'abdominals' },
        abs: { type: 'target', value: 'abdominals' },
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
          mapping.type === 'bodyPart'
            ? selectedBodyParts.push(mapping.value)
            : selectedTargetMuscles.push(mapping.value);
        } else {
          selectedTargetMuscles.push(lowerM);
        }
      });

      const eqKey = selectedEquipment.toLowerCase();
      let apiEquipment =
        UI_TO_API_EQUIPMENT_MAP[eqKey] ||
        (selectedEquipment && selectedEquipment !== 'All Equipement'
          ? eqKey
          : undefined);

      // If no specific equipment selection is made, fallback to environment parameters
      if (!apiEquipment) {
        if (selectedEnv === 'ZERO EQUIPMENT') {
          apiEquipment = 'body weight';
        } else if (selectedEnv === 'AT-HOME GYM') {
          apiEquipment = 'dumbbell,resistance band,body weight,kettlebell';
        } else if (selectedEnv === 'BASIC GYM') {
          apiEquipment = 'barbell,dumbbell,cable,body weight,kettlebell,plate,bench';
        }
      }

      let exerciseLimit = 5;
      if (selectedDuration === '30min') {
        exerciseLimit = 4;
      } else if (selectedDuration === '45min') {
        exerciseLimit = 5;
      } else if (selectedDuration === '50min') {
        exerciseLimit = 6;
      }

      const levelBodyParts = LEVEL_BODY_PARTS_MAP[selectedLevel] || [];
      const hasSelectedMuscleFilter =
        selectedBodyParts.length > 0 || selectedTargetMuscles.length > 0;

      const fetchedExercises = await dispatch(fetchExercises({
        limit: 40,
        equipments: apiEquipment,
        bodyParts: selectedBodyParts.length > 0
          ? selectedBodyParts
          : hasSelectedMuscleFilter
            ? undefined
            : levelBodyParts,
        targetMuscles: selectedTargetMuscles.length > 0 ? selectedTargetMuscles : undefined,
      }));

      const shuffledExercises = (fetchedExercises || []).sort(() => 0.5 - Math.random());

      const formattedExercises = shuffledExercises.slice(0, exerciseLimit).map(ex => {
        const prev = getExercisePerformanceHistory(ex);
        return {
          ...ex,
          id: ex.id || ex._id,
          gifUrl: ex.gifUrl,
          sets: prev?.sets?.length || 3,
          reps: prev?.lastSet?.reps || 0,
          weight: prev?.lastSet?.weight ? String(prev.lastSet.weight) : '0',
          previousSets: prev?.sets || null,
        };
      });

      navigation.replace('FastWorkoutActive', {
        level: selectedLevel,
        environment: selectedEnv,
        duration: selectedDuration,
        equipment: selectedEquipment || 'All Equipement',
        muscles: cleanedMuscles,
        exercises: formattedExercises,
        source: 'fast_workout',
        isCustomWorkout: false,
      });
    } catch (error) {
      console.error('Failed to create fast workout:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateWorkoutRef = React.useRef();
  handleCreateWorkoutRef.current = handleCreateWorkout;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > swipeWidth - sliderWidth - sp(20)) {
          Animated.spring(pan, {
            toValue: { x: swipeWidth - sliderWidth, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            if (handleCreateWorkoutRef.current) handleCreateWorkoutRef.current();
            Animated.timing(pan, {
              toValue: { x: 0, y: 0 },
              duration: 0,
              useNativeDriver: false,
            }).start();
          }, 300);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const displayedExercises = React.useMemo(() => {
    const list = (exercises || []).filter(ex =>
      (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.equipment || (ex.equipments && ex.equipments[0]) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.target || (ex.targetMuscles && ex.targetMuscles[0]) || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return sortExercisesByAlreadyUsed(list);
  }, [exercises, searchQuery]);

  const formatDisplayName = (str) => {
    if (!str) return '';
    const s = String(str).trim().toLowerCase();
    if (s === 'body weight' || s === 'bodyweight' || s === 'none') return 'Body Weight';
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const renderExerciseItem = ({ item }) => {
    const rawTarget = item.target || (item.targetMuscles && item.targetMuscles[0]) || '';
    const rawEquipment = item.equipment || (item.equipments && item.equipments[0]) || '';
    const target = formatDisplayName(rawTarget);
    const equipment = formatDisplayName(rawEquipment);

    const rawImg = item.imageUrl || item.gifUrl;
    const imageSource = rawImg ? { uri: rawImg } : null;

    const isSelected = selectedExercises.some(ex => ex.id === item.id);
    const usedInfo = item.isAlreadyUsed ? { isUsed: true } : isExerciseUsed(item);

    return (
      <View
        style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}
      >
        <View style={styles.exerciseRow}>
          <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.75}
            onPress={() => toggleExerciseSelection(item)}
          >
            <Image source={imageSource} style={styles.exerciseThumbnail} resizeMode="cover" />
            <View style={[styles.exerciseInfo, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.badgeRow}>
                {usedInfo?.isUsed ? (
                  <View style={styles.recentBadge}>
                    <Text style={styles.recentBadgeText}>RECENT</Text>
                  </View>
                ) : null}
                {target ? (
                  <View style={styles.muscleBadge}>
                    <Text style={styles.badgeText}>{target}</Text>
                  </View>
                ) : null}
                {equipment ? (
                  <View style={styles.equipmentBadge}>
                    <Text style={styles.badgeText}>{equipment}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('[CreateFastWorkout] Navigating to ExerciseDetail with item:', item.name);
              try {
                navigation.navigate('ExerciseDetail', { exercise: item });
              } catch (err) {
                console.error('[CreateFastWorkout] Navigation failed:', err);
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
            style={styles.checkboxContainer}
            activeOpacity={0.75}
          >
            {isSelected ? (
              <View style={styles.checkboxSelected}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            ) : (
              <View style={styles.checkboxUnselected} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={[styles.headerTitle, { paddingLeft: 16 }]}>Create a New Fast Workout</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <Path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <TextInput
          style={styles.searchInput}
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

      {/* Filters Row */}
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
            {selectedMuscles.length > 0 ? selectedMuscles.join(', ') : 'Interactive Body Map'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List Area */}
      <View style={styles.listArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <GlobalLoader size={60} />
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
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>

      {/* Floating Actions at Bottom */}
      {selectedExercises.length > 0 && (
        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.addSelectedButton}
            onPress={handleAddSelectedExercises}
            activeOpacity={0.85}
          >
            <Text style={styles.addSelectedButtonText}>
              Add Selected Exercises ({selectedExercises.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Equipment Modal */}
      <EquipmentModal
        visible={isEquipmentModalVisible}
        onClose={() => setIsEquipmentModalVisible(false)}
        selectedEquipment={selectedEquipment}
        onSelectEquipment={(eq) => setSelectedEquipment(eq)}
      />

      {/* Muscle Modal */}
      <MuscleModal
        visible={isMuscleModalVisible}
        onClose={() => setIsMuscleModalVisible(false)}
        selectedMuscles={selectedMuscles}
        onSelectMuscle={(muscle) => toggleMuscle(muscle)}
      />
    </SafeAreaView>
  );
};

const createFastWorkoutStyles = ({ wp, hp, ms, sp, fs }) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000000' },
    header: { paddingHorizontal: sp(18), paddingTop: sp(14), paddingBottom: sp(10) },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    headerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1E2436',
      alignSelf: 'flex-start',
      paddingRight: sp(18),
      paddingLeft: 0,
      borderRadius: ms(22),
      minHeight: ms(44),
    },
    lightningIcon: { width: ms(48), height: ms(48), marginLeft: -ms(2), marginRight: sp(6) },
    headerTitle: { fontSize: fs(13), fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
    searchBar: {
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
      marginTop: sp(10),
    },
    searchInput: { color: '#fff', marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '500' },

    // Selected Exercises Row
    selectedExercisesRow: {
      maxHeight: 36,
      marginBottom: 12,
    },
    selectedExercisesRowContent: {
      gap: 8,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    selectedExercisePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#EE822A', // Solid orange brand color
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      height: 28,
    },
    selectedExercisePillText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      maxWidth: 160,
    },

    // Filters Row
    filtersContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
    filterButton: {
      flex: 1,
      backgroundColor: '#161224',
      borderWidth: 1,
      borderColor: '#2E4D9F',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    filterLabel: { color: '#AEB4C0', fontSize: 10, fontWeight: '600', marginBottom: 2 },
    filterValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

    // Exercise List
    listArea: {
      flex: 1,
      marginHorizontal: 16,
    },
    listContentContainer: { paddingBottom: 100 },
    exerciseCard: {
      backgroundColor: '#1E1C2E',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    },
    exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    exerciseThumbnail: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
    exerciseInfo: { flex: 1, gap: 4 },
    exerciseName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
    recentBadge: {
      backgroundColor: 'rgba(238, 130, 42, 0.15)',
      borderWidth: 1,
      borderColor: '#EE822A',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    recentBadgeText: {
      color: '#EE822A',
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    muscleBadge: { backgroundColor: '#EE822A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    equipmentBadge: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
    arrowContainer: {
      paddingLeft: 6,
      paddingRight: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#AEB4C0', fontSize: 12, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyText: { color: '#AEB4C0', fontSize: 13, fontWeight: '600', textAlign: 'center' },
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

    // Swipe Slider
    floatingButtonContainer: { alignItems: 'center', paddingVertical: 16 },
    floatingButtonBg: {
      backgroundColor: '#1E2436',
      flexDirection: 'row',
      alignItems: 'center',
      height: ms(46),
      borderRadius: ms(23),
      borderWidth: 1,
      borderColor: '#2E4D9F',
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
      width: ms(46),
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
    exerciseCardSelected: {
      borderColor: 'rgba(0, 122, 255, 0.4)',
      backgroundColor: '#232135',
    },
    checkboxContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 10,
    },
    checkboxSelected: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#EE822A',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxUnselected: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      backgroundColor: 'transparent',
    },
    addSelectedButton: {
      width: '85%',
      height: 50,
      backgroundColor: '#EE822A',
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addSelectedButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    modalContentContainer: {
      backgroundColor: '#120F1A',
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      maxHeight: hp(75),
      paddingTop: 16,
      paddingBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderBottomWidth: 0,
    },
    modalHandle: { width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
    modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.06)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    modalList: { paddingHorizontal: 24, paddingTop: 12 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 64 },
    listItemText: { color: '#AEB4C0', fontSize: 14, flex: 1, fontWeight: '600', marginLeft: 10 },
    listItemTextSelected: { color: '#FFFFFF', fontWeight: '800' },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleImage: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    itemDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  });

export default CreateFastWorkoutScreen;
