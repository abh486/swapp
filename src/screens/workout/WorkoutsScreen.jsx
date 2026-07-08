import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Modal, TouchableWithoutFeedback, FlatList, ImageBackground, Image, ScrollView } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExercises, clearSelectedFilters } from '../../redux/actions/workoutActions';
import exercisesData from '../../assets/exercises.json';

const { width } = Dimensions.get('window');

const ClockIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#8E8E9A" strokeWidth={1.8} />
    <Path d="M12 7V12L15 15" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" />
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

const WorkoutsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [selectedEquipmentLocal, setSelectedEquipmentLocal] = useState('');

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
    let list = exercisesData.exercises || [];

    // 1. Filter by Level
    if (tempLevel) {
      const bodyParts = LEVEL_BODY_PARTS_MAP[tempLevel] || [];
      const filterMuscles = [];
      bodyParts.forEach(bp => {
        const cleaned = bp.trim().toLowerCase();
        if (cleaned === 'chest') filterMuscles.push('chest', 'pectorals');
        else if (cleaned === 'back') filterMuscles.push('lats', 'back', 'middle back', 'lower back', 'traps');
        else if (cleaned === 'shoulders') filterMuscles.push('shoulders', 'delts', 'deltoids');
        else if (cleaned === 'upper arms') filterMuscles.push('biceps', 'triceps');
        else if (cleaned === 'lower arms') filterMuscles.push('forearms');
        else if (cleaned === 'upper legs') filterMuscles.push('quads', 'hamstrings', 'glutes', 'adductors', 'abductors');
        else if (cleaned === 'lower legs') filterMuscles.push('calves');
        else if (cleaned === 'waist') filterMuscles.push('abs', 'abdominals');
        else filterMuscles.push(cleaned);
      });

      if (filterMuscles.length > 0) {
        list = list.filter(ex => {
          const prims = (ex.primaryMuscles || []).map(m => m.toLowerCase());
          return prims.some(m => filterMuscles.some(filterM => m.includes(filterM) || filterM.includes(m)));
        });
      }
    }

    // 2. Filter by Equipment
    if (tempEquipment === 'GYM') {
      const gymEquips = ['barbell', 'cable', 'machine', 'plate', 'leverage machine', 'bench'];
      list = list.filter(ex => ex.equipment && gymEquips.some(eq => ex.equipment.toLowerCase().includes(eq)));
    } else if (tempEquipment === 'DUMBBELLS') {
      list = list.filter(ex => ex.equipment && ex.equipment.toLowerCase().includes('dumbbell'));
    } else if (tempEquipment === 'NONE') {
      list = list.filter(ex => ex.equipment && ex.equipment.toLowerCase().includes('body only'));
    }

    // 3. Filter by Goal
    if (tempGoal === 'GAIN_MUSCLE') {
      const cats = ['strength', 'powerlifting', 'strongman'];
      list = list.filter(ex => ex.category && cats.includes(ex.category.toLowerCase()));
    } else if (tempGoal === 'STRENGTH') {
      const cats = ['strength', 'powerlifting'];
      list = list.filter(ex => ex.category && cats.includes(ex.category.toLowerCase()));
    } else if (tempGoal === 'LOSE_WEIGHT') {
      const cats = ['cardio', 'plyometrics'];
      list = list.filter(ex => ex.category && cats.includes(ex.category.toLowerCase()));
    }

    return list.length;
  }, [tempLevel, tempGoal, tempEquipment]);

  const mapFiltersToApi = (level, goal, eq) => {
    const apiFilters = {};

    // 1. Level body parts mapping
    if (level) {
      const bodyPartsForLevel = LEVEL_BODY_PARTS_MAP[level];
      if (bodyPartsForLevel) {
        apiFilters.bodyParts = bodyPartsForLevel;
      }
    }

    // 2. Equipment filter mapping
    if (eq === 'GYM') {
      apiFilters.equipments = 'barbell,cable,machine,plate,leverage machine,bench';
    } else if (eq === 'DUMBBELLS') {
      apiFilters.equipments = 'dumbbell';
    } else if (eq === 'NONE') {
      apiFilters.equipments = 'body weight';
    }

    // 3. Goal filter mapping
    if (goal === 'GAIN_MUSCLE') {
      apiFilters.categories = 'strength,powerlifting,strongman';
    } else if (goal === 'STRENGTH') {
      apiFilters.categories = 'strength,powerlifting';
    } else if (goal === 'LOSE_WEIGHT') {
      apiFilters.categories = 'cardio,plyometrics';
    }

    return apiFilters;
  };

  useEffect(() => {
    const apiFilters = mapFiltersToApi(selectedLevel, selectedGoal, selectedEquipmentLocal);
    dispatch(fetchExercises({
      limit: 50,
      ...apiFilters
    }));
  }, [selectedLevel, selectedGoal, selectedEquipmentLocal, dispatch]);

  const loadMoreExercises = async () => {
    if (hasNextPage && !isLoadingMore && !loading) {
      setIsLoadingMore(true);
      const apiFilters = mapFiltersToApi(selectedLevel, selectedGoal, selectedEquipmentLocal);
      await dispatch(fetchExercises({
        limit: 50,
        after: nextCursor,
        ...apiFilters,
        isLoadMore: true
      }));
      setIsLoadingMore(false);
    }
  };

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

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
        <TouchableOpacity style={styles.headerIcon}>
          <ClockIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('FastWorkoutActive')}
        >
          <LinearGradient colors={['#EE822A', '#8F5D98', '#2E4D9F']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.actionLabel}>Create a New{'\n'}Fast Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CreateCustomWorkoutScreen')}
        >
          <LinearGradient colors={['#EE822A', '#8F5D98', '#2E4D9F']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.actionLabel}>Create a Custom{'\n'}Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CurrentWorkoutPlanScreen')}
        >
          <LinearGradient colors={['#EE822A', '#8F5D98', '#2E4D9F']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.actionLabel}>AI{'\n'}Workout</Text>
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

    const folder = getFolderFromName(exercise.name);
    const gifUrl = `https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/${folder}/images/0.jpg`;

    const imageSource = failedImages[exercise.id]
      ? (isGym ? require('../../assets/image/gym_machine.png') : require('../../assets/image/yoga_mat.png'))
      : { uri: gifUrl };

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
          level: selectedLevel
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
        data={exercises}
        keyExtractor={(item, index) => item.id || item.exerciseId || index.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <GlobalLoader size={60} style={{ marginTop: 50 }} />
          ) : (
            <Text style={styles.emptyText}>No exercises found for {hasActiveFilters ? 'selected filters' : selectedLevel}.</Text>
          )
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={loadMoreExercises}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
            {isLoadingMore && <GlobalLoader size={30} />}
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
    gap: 8,
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
  }
});

export default WorkoutsScreen;
