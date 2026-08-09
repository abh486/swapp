import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Modal, TouchableWithoutFeedback, FlatList, ImageBackground, Image, ScrollView } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExercises, clearSelectedFilters } from '../../redux/actions/workoutActions';
import { PRESET_ROUTINES } from './presetRoutinesData';

const { width } = Dimensions.get('window');

const FAST_WORKOUT_IMG = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=300&auto=format&fit=crop';
const CUSTOM_WORKOUT_IMG = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=300&auto=format&fit=crop';
const AI_WORKOUT_IMG = 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=300&auto=format&fit=crop';

[FAST_WORKOUT_IMG, CUSTOM_WORKOUT_IMG, AI_WORKOUT_IMG].forEach(uri => {
  Image.prefetch(uri).catch(() => {});
});

const ClockIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#8E8E9A" strokeWidth={1.8} />
    <Path d="M12 7V12L15 15" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19L5 12L12 5" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

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

const ChevronDownIcon = ({ open }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6, transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9L12 15L18 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 6 }}>
    <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LEVEL_BODY_PARTS_MAP = {
  'BEGINNER': ['cardio', 'neck'],
  'INTERMEDIATE': ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  'ADVANCED': ['waist', 'lower arms', 'lower legs'],
};

const PlayIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const AtHomeIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Path d="M6 22L24 6L42 22" stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 20V42C10 43.1046 10.8954 44 12 44H36C37.1046 44 38 43.1046 38 42V20" stroke="#4F46E5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 44V32H28V44" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="15" y="12" width="18" height="10" rx="2" fill="#3B82F6" opacity="0.8" />
    <Rect x="16" y="24" width="6" height="6" rx="1" fill="#EAB308" />
    <Rect x="26" y="24" width="6" height="6" rx="1" fill="#EAB308" />
  </Svg>
);

const TravelIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="16" width="32" height="22" rx="6" fill="#4B5563" />
    <Path d="M14 16V10C14 8.89543 14.8954 8 16 8H32C33.1046 8 34 8.89543 34 10V16" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 24H36" stroke="#1F2937" strokeWidth="4" strokeLinecap="round" />
    <Circle cx="14" cy="38" r="3" fill="#111827" />
    <Circle cx="34" cy="38" r="3" fill="#111827" />
  </Svg>
);

const DumbbellCategoryIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="18" width="6" height="12" rx="3" fill="#6B7280" />
    <Rect x="34" y="18" width="6" height="12" rx="3" fill="#6B7280" />
    <Rect x="12" y="16" width="4" height="16" rx="2" fill="#4B5563" />
    <Rect x="32" y="16" width="4" height="16" rx="2" fill="#4B5563" />
    <Rect x="14" y="22" width="20" height="4" rx="1" fill="#9CA3AF" />
  </Svg>
);

const BandIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Path d="M8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24" stroke="#3B82F6" strokeWidth="4.5" strokeLinecap="round" />
    <Path d="M12 28C12 21.3726 17.3726 16 24 16C30.6274 16 36 21.3726 36 28" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
    <Rect x="4" y="24" width="8" height="8" rx="2" fill="#1E40AF" />
    <Rect x="36" y="24" width="8" height="8" rx="2" fill="#1E40AF" />
  </Svg>
);

const CardioIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect x="16" y="14" width="16" height="20" rx="3" fill="#374151" />
    <Path d="M20 14V6H28V14" stroke="#9CA3AF" strokeWidth="3" />
    <Path d="M20 34V42H28V34" stroke="#9CA3AF" strokeWidth="3" />
    <Circle cx="24" cy="24" r="6" fill="#EF4444" />
    <Path d="M24 21V24H27" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const GymCategoryIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="16" width="32" height="24" rx="4" fill="#374151" stroke="#4B5563" strokeWidth="2.5" />
    <Path d="M6 16H42" stroke="#4B5563" strokeWidth="4.5" strokeLinecap="round" />
    <Rect x="18" y="28" width="12" height="12" fill="#111827" />
    <Path d="M12 20H16V24H12V20Z" fill="#EAB308" />
    <Path d="M32 20H36V24H32V20Z" fill="#EAB308" />
    <Rect x="14" y="8" width="20" height="8" rx="2" fill="#EE822A" />
    <Path d="M18 12H30" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const BodyweightIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="14" width="32" height="20" rx="10" fill="#10B981" />
    <Circle cx="16" cy="24" r="6" fill="#047857" />
    <Circle cx="16" cy="24" r="2" fill="#10B981" />
    <Path d="M30 14V34" stroke="#059669" strokeWidth="2" strokeDasharray="4 4" />
  </Svg>
);

const SuspensionIcon = () => (
  <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <Path d="M24 6V18" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
    <Path d="M24 18L14 36" stroke="#374151" strokeWidth="3" />
    <Path d="M24 18L34 36" stroke="#374151" strokeWidth="3" />
    <Rect x="10" y="34" width="8" height="6" rx="2" fill="#1F2937" stroke="#EE822A" strokeWidth="2" />
    <Rect x="30" y="34" width="8" height="6" rx="2" fill="#1F2937" stroke="#EE822A" strokeWidth="2" />
  </Svg>
);



const WorkoutsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedEquipmentLocal, setSelectedEquipmentLocal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllRoutines, setShowAllRoutines] = useState(false);

  useEffect(() => {
    if (selectedEquipmentLocal === 'GYM') {
      setSelectedCategory('Gym');
    } else if (selectedEquipmentLocal === 'DUMBBELLS') {
      setSelectedCategory('Dumbbells Only');
    } else if (selectedEquipmentLocal === 'NONE') {
      setSelectedCategory('Bodyweight');
    } else if (selectedGoal === 'LOSE_WEIGHT') {
      setSelectedCategory('Cardio & HIIT');
    } else if (!selectedEquipmentLocal && !selectedGoal) {
      setSelectedCategory('');
    }
  }, [selectedEquipmentLocal, selectedGoal]);

  useEffect(() => {
    setShowAllRoutines(false);
  }, [selectedLevel, selectedGoal, selectedEquipmentLocal]);

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryWorkoutsScreen', { category });
  };

  const filteredRoutines = useMemo(() => {
    let list = PRESET_ROUTINES;
    if (selectedLevel) {
      list = list.filter(r => r.level === selectedLevel);
    }
    if (selectedGoal) {
      list = list.filter(r => r.goal === selectedGoal);
    }
    if (selectedEquipmentLocal) {
      list = list.filter(r => r.equipment === selectedEquipmentLocal);
    }
    return list;
  }, [selectedLevel, selectedGoal, selectedEquipmentLocal]);

  const renderRoutineItem = ({ item: routine }) => {
    return (
      <TouchableOpacity
        style={styles.routineCard}
        activeOpacity={0.85}
        onPress={() => {
          navigation.navigate('RoutineDetailScreen', { program: routine });
        }}
      >
        <View style={styles.routineCardBody}>
          <Text style={styles.routineTitle} numberOfLines={2}>
            {routine.name}
          </Text>
          <Text style={styles.routineSubtitle}>
            {routine.routinesCount} routines
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => {
            navigation.navigate('RoutineDetailScreen', { program: routine });
          }}
        >
          <PlayIcon />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const getLevelLabel = (level) => {
    if (level === 'BEGINNER') return 'Beginner';
    if (level === 'INTERMEDIATE') return 'Medium';
    if (level === 'ADVANCED') return 'Advanced';
    return 'Level';
  };

  const getGoalLabel = (goal) => {
    if (goal === 'GAIN_MUSCLE') return 'Gain Muscle';
    if (goal === 'STRENGTH') return 'Strength';
    if (goal === 'LOSE_WEIGHT') return 'Lose Weight';
    return 'Goal';
  };

  const getEquipmentLabel = (eq) => {
    if (eq === 'GYM') return 'Gym';
    if (eq === 'DUMBBELLS') return 'Dumbbells';
    if (eq === 'NONE') return 'None';
    return 'Equipment';
  };

  // Local temporary states inside the Filters Bottom Sheet modal
  const [tempLevel, setTempLevel] = useState('');
  const [tempGoal, setTempGoal] = useState('');
  const [tempEquipment, setTempEquipment] = useState('');

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const { exercises, loading, nextCursor, hasNextPage } = useSelector((state) => state.workout);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [failedImages, setFailedImages] = useState({});

  const hasActiveFilters = selectedGoal !== '' || selectedEquipmentLocal !== '';

  const activeFiltersCount =
    (selectedLevel !== '' ? 1 : 0) +
    (selectedGoal !== '' ? 1 : 0) +
    (selectedEquipmentLocal !== '' ? 1 : 0);

  const isLevelActive = selectedLevel !== '';
  const isGoalActive = selectedGoal !== '';
  const isEquipmentActive = selectedEquipmentLocal !== '';

  // Dynamic matching results count for bottom sheet "Show X results" button
  const resultsCount = useMemo(() => {
    let list = PRESET_ROUTINES;
    if (tempLevel) {
      list = list.filter(r => r.level === tempLevel);
    }
    if (tempGoal) {
      list = list.filter(r => r.goal === tempGoal);
    }
    if (tempEquipment) {
      list = list.filter(r => r.equipment === tempEquipment);
    }
    return list.length;
  }, [tempLevel, tempGoal, tempEquipment]);

  const handleApplyFilters = () => {
    setSelectedLevel(tempLevel);
    setSelectedGoal(tempGoal);
    setSelectedEquipmentLocal(tempEquipment);
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setTempLevel('');
    setTempGoal('');
    setTempEquipment('');
    setSelectedLevel('');
    setSelectedGoal('');
    setSelectedEquipmentLocal('');
    setFilterModalVisible(false);
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('Home');
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workouts</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon}>
          <ClockIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('FastWorkoutActive', { source: 'fast_workout', isCustomWorkout: false })}
        >
          <ImageBackground
            source={{ uri: FAST_WORKOUT_IMG }}
            style={styles.actionGradient}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.actionOverlay} />
            <Text style={styles.actionLabel}>Create a New{'\n'}Fast Workout</Text>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CreateCustomWorkoutScreen')}
        >
          <ImageBackground
            source={{ uri: CUSTOM_WORKOUT_IMG }}
            style={styles.actionGradient}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.actionOverlay} />
            <Text style={styles.actionLabel}>Create a Custom{'\n'}Workout</Text>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CurrentWorkoutPlanScreen')}
        >
          <ImageBackground
            source={{ uri: AI_WORKOUT_IMG }}
            style={styles.actionGradient}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.actionOverlay} />
            <Text style={styles.actionLabel}>AI{'\n'}Workout</Text>
          </ImageBackground>
        </TouchableOpacity>
      </View>
      {/* Horizontal Filter Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topFilterScroll}
        contentContainerStyle={styles.topFilterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.topFilterButton,
            activeFiltersCount > 0 && styles.topFilterButtonActive
          ]}
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
        >
          <FiltersIcon />
          <Text style={[
            styles.topFilterButtonText,
            activeFiltersCount > 0 && styles.topFilterButtonTextActive
          ]}>
            Filters
          </Text>
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topFilterButton,
            isLevelActive && styles.topFilterButtonActive
          ]}
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={[
            styles.topFilterButtonText,
            isLevelActive && styles.topFilterButtonTextActive
          ]}>
            {getLevelLabel(selectedLevel)}
          </Text>
          {isLevelActive ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedLevel('');
                setTempLevel('');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topFilterButton,
            isGoalActive && styles.topFilterButtonActive
          ]}
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={[
            styles.topFilterButtonText,
            isGoalActive && styles.topFilterButtonTextActive
          ]}>
            {getGoalLabel(selectedGoal)}
          </Text>
          {isGoalActive ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedGoal('');
                setTempGoal('');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topFilterButton,
            isEquipmentActive && styles.topFilterButtonActive
          ]}
          activeOpacity={0.7}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={[
            styles.topFilterButtonText,
            isEquipmentActive && styles.topFilterButtonTextActive
          ]}>
            {getEquipmentLabel(selectedEquipmentLocal)}
          </Text>
          {isEquipmentActive ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedEquipmentLocal('');
                setTempEquipment('');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CloseIcon />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const getFolderFromName = (name) => {
    if (!name) return '';
    return name
      .trim()
      .replace(/[\s\/]+/g, '_')
      .split('_')
      .map(word => {
        if (word.includes('-')) {
          return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('_');
  };

  const renderItem = ({ item: exercise }) => {
    const nameLower = (exercise.name || '').toLowerCase();
    const eqLower = (exercise.equipment || (exercise.equipments && exercise.equipments[0]) || '').toLowerCase();
    const isGym = !(nameLower.includes('cardio') || nameLower.includes('run') || nameLower.includes('jump') || nameLower.includes('yoga') || nameLower.includes('stretch') || eqLower.includes('body only') || eqLower.includes('none') || eqLower.includes('free') || nameLower.includes('free'));

    const mediaUrl = exercise.imageUrl || exercise.gifUrl || exercise.videoUrl;

    const imageSource = (mediaUrl && !failedImages[exercise.id])
      ? { uri: mediaUrl }
      : require('../../assets/image/gym_machine.png');

    let formattedLevel = 'Beginner';
    if (selectedLevel) {
      formattedLevel = selectedLevel === 'INTERMEDIATE' ? 'Intermediate' : selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1).toLowerCase();
    } else {
      const prims = (exercise.targetMuscles || []).map(m => m.toLowerCase());
      const isIntermediate = prims.some(m => ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes'].includes(m));
      const isAdvanced = prims.some(m => ['abs', 'forearms', 'calves'].includes(m));
      if (isAdvanced) formattedLevel = 'Advanced';
      else if (isIntermediate) formattedLevel = 'Intermediate';
    }
    const formattedEquipment = exercise.equipment || (exercise.equipments && exercise.equipments[0]) || 'Gym Equipment';
    const capitalizedEquipment = formattedEquipment.charAt(0).toUpperCase() + formattedEquipment.slice(1);

    return (
      <TouchableOpacity
        style={styles.exerciseCardLarge}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('FastWorkoutActive', {
          exercises: [{ ...exercise, sets: [] }],
          level: selectedLevel,
          source: 'fast_workout',
          isCustomWorkout: false
        })}
      >
        <View style={styles.cardLeft}>
          <Image
            source={imageSource}
            style={styles.cardLeftImageFull}
            resizeMode="cover"
            onError={() => {
              setFailedImages(prev => ({ ...prev, [exercise.id]: true }));
            }}
          />
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardRightTitle} numberOfLines={2}>
            {exercise.name}
          </Text>
          <Text style={styles.cardRightSubtitle}>
            {formattedLevel} • {capitalizedEquipment}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />

      <Modal visible={filterModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheetContainer}>
                <View style={styles.bottomSheetHandle} />
                <Text style={styles.bottomSheetTitle}>Filters</Text>

                {/* Level Section */}
                <Text style={styles.filterSectionTitle}>Level</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, tempLevel === 'BEGINNER' && styles.filterCardSelected]}
                    onPress={() => setTempLevel(tempLevel === 'BEGINNER' ? '' : 'BEGINNER')}
                  >
                    <LevelIcon fillCount={1} selected={tempLevel === 'BEGINNER'} />
                    <Text style={[styles.filterCardText, tempLevel === 'BEGINNER' && styles.filterCardTextSelected]}>Beginner</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempLevel === 'INTERMEDIATE' && styles.filterCardSelected]}
                    onPress={() => setTempLevel(tempLevel === 'INTERMEDIATE' ? '' : 'INTERMEDIATE')}
                  >
                    <LevelIcon fillCount={2} selected={tempLevel === 'INTERMEDIATE'} />
                    <Text style={[styles.filterCardText, tempLevel === 'INTERMEDIATE' && styles.filterCardTextSelected]}>Medium</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempLevel === 'ADVANCED' && styles.filterCardSelected]}
                    onPress={() => setTempLevel(tempLevel === 'ADVANCED' ? '' : 'ADVANCED')}
                  >
                    <LevelIcon fillCount={3} selected={tempLevel === 'ADVANCED'} />
                    <Text style={[styles.filterCardText, tempLevel === 'ADVANCED' && styles.filterCardTextSelected]}>Advanced</Text>
                  </TouchableOpacity>
                </View>

                {/* Goal Section */}
                <Text style={styles.filterSectionTitle}>Goal</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, tempGoal === 'GAIN_MUSCLE' && styles.filterCardSelected]}
                    onPress={() => setTempGoal(tempGoal === 'GAIN_MUSCLE' ? '' : 'GAIN_MUSCLE')}
                  >
                    <FlexArmIcon selected={tempGoal === 'GAIN_MUSCLE'} />
                    <Text style={[styles.filterCardText, tempGoal === 'GAIN_MUSCLE' && styles.filterCardTextSelected]}>Gain Muscle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempGoal === 'STRENGTH' && styles.filterCardSelected]}
                    onPress={() => setTempGoal(tempGoal === 'STRENGTH' ? '' : 'STRENGTH')}
                  >
                    <StrengthIcon selected={tempGoal === 'STRENGTH'} />
                    <Text style={[styles.filterCardText, tempGoal === 'STRENGTH' && styles.filterCardTextSelected]}>Strength</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempGoal === 'LOSE_WEIGHT' && styles.filterCardSelected]}
                    onPress={() => setTempGoal(tempGoal === 'LOSE_WEIGHT' ? '' : 'LOSE_WEIGHT')}
                  >
                    <WeightScaleIcon selected={tempGoal === 'LOSE_WEIGHT'} />
                    <Text style={[styles.filterCardText, tempGoal === 'LOSE_WEIGHT' && styles.filterCardTextSelected]}>Lose Weight</Text>
                  </TouchableOpacity>
                </View>

                {/* Equipment Section */}
                <Text style={styles.filterSectionTitle}>Equipment</Text>
                <View style={styles.cardRow}>
                  <TouchableOpacity
                    style={[styles.filterCard, tempEquipment === 'GYM' && styles.filterCardSelected]}
                    onPress={() => setTempEquipment(tempEquipment === 'GYM' ? '' : 'GYM')}
                  >
                    <GymIcon selected={tempEquipment === 'GYM'} />
                    <Text style={[styles.filterCardText, tempEquipment === 'GYM' && styles.filterCardTextSelected]}>Gym</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempEquipment === 'DUMBBELLS' && styles.filterCardSelected]}
                    onPress={() => setTempEquipment(tempEquipment === 'DUMBBELLS' ? '' : 'DUMBBELLS')}
                  >
                    <DumbbellIcon selected={tempEquipment === 'DUMBBELLS'} />
                    <Text style={[styles.filterCardText, tempEquipment === 'DUMBBELLS' && styles.filterCardTextSelected]}>Dumbbells</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.filterCard, tempEquipment === 'NONE' && styles.filterCardSelected]}
                    onPress={() => setTempEquipment(tempEquipment === 'NONE' ? '' : 'NONE')}
                  >
                    <StandingPersonIcon selected={tempEquipment === 'NONE'} />
                    <Text style={[styles.filterCardText, tempEquipment === 'NONE' && styles.filterCardTextSelected]}>None</Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Row Buttons */}
                <View style={styles.bottomRow}>
                  <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilters}>
                    <Text style={styles.clearBtnText}>Clear Filters</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.showResultsBtn} onPress={handleApplyFilters}>
                    <Text style={styles.showResultsBtnText}>Show {resultsCount} results</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={showAllRoutines ? filteredRoutines : filteredRoutines.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No routines found for selected filters.</Text>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListFooterComponent={
          <View style={{ marginTop: filteredRoutines.length > 5 ? 4 : 24 }}>
            {filteredRoutines.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreBtn}
                activeOpacity={0.8}
                onPress={() => setShowAllRoutines(!showAllRoutines)}
              >
                <Text style={styles.showMoreBtnText}>
                  {showAllRoutines ? 'Show Less' : 'Show More'}
                </Text>
                <ChevronDownIcon open={showAllRoutines} />
              </TouchableOpacity>
            )}

            {/* Categories Grid */}
            <View style={styles.categoriesGrid}>
              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'At home' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('At home')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>At home</Text>
                  <AtHomeIcon />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Travel' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Travel')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Travel</Text>
                  <TravelIcon />
                </TouchableOpacity>
              </View>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Dumbbells Only' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Dumbbells Only')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Dumbbells{'\n'}Only</Text>
                  <DumbbellCategoryIcon />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Band' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Band')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Band</Text>
                  <BandIcon />
                </TouchableOpacity>
              </View>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Cardio & HIIT' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Cardio & HIIT')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Cardio &{'\n'}HIIT</Text>
                  <CardioIcon />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Gym' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Gym')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Gym</Text>
                  <GymCategoryIcon />
                </TouchableOpacity>
              </View>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Bodyweight' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Bodyweight')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Bodyweight</Text>
                  <BodyweightIcon />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.categoryCard, selectedCategory === 'Suspension Band' && styles.categoryCardSelected]}
                  onPress={() => handleCategoryPress('Suspension Band')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryCardText}>Suspension{'\n'}Band</Text>
                  <SuspensionIcon />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ height: 100 }} />
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { padding: 4, marginRight: 2 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  headerIcon: { padding: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  actionCard: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 64, overflow: 'hidden', position: 'relative' },
  actionGradient: { ...StyleSheet.absoluteFillObject },
  actionTopRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 8, paddingTop: 8 },
  // Removed actionIconCircleSmall style
  actionIconImage: { width: 28, height: 28 }, // Increased size from 16 to 28
  actionLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '600', lineHeight: 13, letterSpacing: 0.1, textAlign: 'center', paddingHorizontal: 2 },
  actionPill: { width: 20, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.3)', position: 'absolute', bottom: 6 },
  topFilterScroll: {
    marginBottom: 20,
    maxHeight: 40,
  },
  topFilterScrollContent: {
    gap: 12,
  },
  topFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 38,
  },
  topFilterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  topFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  topFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#FFFFFF',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  bottomSheetContainer: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: 20,
    width: '100%',
    maxHeight: '90%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#383842',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bottomSheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
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
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
    width: '100%',
  },
  clearBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  showResultsBtn: {
    flex: 1.2,
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showResultsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: { color: '#8E8E9A', fontSize: 16, textAlign: 'center', marginTop: 50 },
  exerciseCardLarge: {
    width: '100%',
    height: 110,
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardLeft: {
    width: 110,
    height: '100%',
    backgroundColor: '#121216',
    position: 'relative',
    overflow: 'hidden',
  },
  cardLeftText: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardLeftTextBlue: {
    color: '#007AFF',
  },
  cardLeftTextDark: {
    color: '#1C1C24',
  },
  cardLeftImage: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 60,
    height: 60,
  },
  cardLeftImageFull: {
    width: '100%',
    height: '100%',
  },
  cardRight: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardRightTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardRightSubtitle: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '500',
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1E1E26',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  routineCard: {
    width: '100%',
    padding: 18,
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  routineCardBody: {
    flex: 1,
    paddingRight: 10,
  },
  routineTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  routineSubtitle: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '500',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EE822A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  showMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    marginBottom: 24,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    height: 84,
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryCardSelected: {
    borderColor: '#EE822A',
    backgroundColor: 'rgba(238, 130, 42, 0.08)',
  },
  categoryCardText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
  },
});

export default WorkoutsScreen;
