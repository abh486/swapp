import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, PanResponder, Animated, Image, ScrollView } from 'react-native';
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

const LIGHTNING_ICON = require('../../assets/image/tender.png');

const LEVEL_BODY_PARTS_MAP = {
  Beginner: ['cardio', 'neck'],
  Intermediate: ['chest', 'back', 'shoulders', 'upper arms', 'upper legs'],
  Advanced: ['waist', 'lower arms', 'lower legs'],
};

const CreateFastWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { equipments, muscles } = useSelector(state => state.workout);
  const { wp, hp, ms, sp, fs } = useResponsiveMetrics();
  const styles = createFastWorkoutStyles({ wp, hp, ms, sp, fs });
  const swipeWidth = wp(65);
  const sliderWidth = ms(46);

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  // Default workout settings (running behind the scenes)
  const selectedLevel = 'Intermediate';
  const selectedEnv = 'BASIC GYM';
  const selectedDuration = '45min';

  const [activeTab, setActiveTab] = useState('Equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const equipmentList = equipments?.length
    ? ['All Equipement', ...equipments.map(e => e.name || e)]
    : ['All Equipement', 'None', 'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other'];

  const musclesList = muscles?.length
    ? ['All Muscles', ...muscles.map(m => m.name || m)]
    : ['All Muscles', 'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Cardio', 'Chest', 'Forearms', 'Full Body', 'Glutes', 'Hamstrings', 'Lats', 'Lower back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back', 'Other'];

  const toggleMuscle = muscle => {
    if (muscle === 'All Muscles') {
      setSelectedMuscles(prev => prev.includes(muscle) ? [] : [muscle]);
      return;
    }
    setSelectedMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev.filter(m => m !== 'All Muscles'), muscle],
    );
  };

  const pan = React.useRef(new Animated.ValueXY()).current;

  const handleCreateWorkout = async () => {
    setIsCreating(true);
    try {
      dispatch(setSelectedFilters(selectedEquipment, selectedMuscles));
      const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');

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

      const formattedExercises = shuffledExercises.slice(0, exerciseLimit).map(ex => ({
        ...ex,
        id: ex.id || ex._id,
        gifUrl: ex.gifUrl,
        sets: 3,
        reps: 12,
        weight: '4.00',
      }));

      navigation.replace('FastWorkoutActive', {
        level: selectedLevel,
        environment: selectedEnv,
        duration: selectedDuration,
        equipment: selectedEquipment || 'All Equipement',
        muscles: cleanedMuscles,
        exercises: formattedExercises,
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
            handleCreateWorkoutRef.current?.();
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

  const filteredList = (activeTab === 'Equipment' ? equipmentList : musclesList)
    .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));

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
            <Image source={LIGHTNING_ICON} style={styles.lightningIcon} resizeMode="contain" />
            <Text style={styles.headerTitle}>Create a New Fast Workout</Text>
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
          placeholder={activeTab === 'Equipment' ? "Search Equipment" : "Search Muscles"}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['Equipment', 'Muscles'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => { setActiveTab(tab); setSearchQuery(''); }}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Equipment' ? 'All Equipment' : 'All Muscles'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main List Area */}
      <View style={styles.listArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
          {filteredList.map((item, index) => {
            const isChecked = activeTab === 'Equipment'
              ? selectedEquipment === item
              : selectedMuscles.includes(item);
            return (
              <View key={index}>
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => activeTab === 'Equipment' ? setSelectedEquipment(item) : toggleMuscle(item)}>
                  <View style={styles.iconCircle}>
                    {isChecked ? (
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : index === 0 ? (
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <Path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z" stroke="#48075F" strokeWidth="2" strokeLinejoin="round" />
                      </Svg>
                    ) : null}
                  </View>
                  <Text style={[styles.listItemText, isChecked && styles.listItemTextSelected]}>{item}</Text>
                  {isChecked && (
                    <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <Path d="M5 13L9 17L19 7" stroke="#007AFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  )}
                </TouchableOpacity>
                <View style={styles.itemDivider} />
              </View>
            );
          })}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Swipe to Create */}
      <View style={styles.floatingButtonContainer}>
        <View style={[styles.floatingButtonBg, { width: swipeWidth }]}>
          <Text style={styles.floatingButtonTextBg}>Create Fast Workout</Text>
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: 12 }}>
            <Path d="M9 18L15 12L9 6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13 18L19 12L13 6" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M17 18L23 12L17 6" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Animated.View
            style={[
              styles.swipeThumb,
              {
                transform: [{
                  translateX: pan.x.interpolate({
                    inputRange: [0, swipeWidth - sliderWidth],
                    outputRange: [0, swipeWidth - sliderWidth],
                    extrapolate: 'clamp',
                  }),
                }],
              },
            ]}
            {...panResponder.panHandlers}>
            <View style={styles.floatingButtonIcon}>
              {isCreating ? (
                <GlobalLoader size={50} />
              ) : (
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#48075F" />
                </Svg>
              )}
            </View>
          </Animated.View>
        </View>
      </View>
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
      backgroundColor: '#3A0751',
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
      borderColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: 14,
      marginHorizontal: 20,
      height: 38,
      marginBottom: 16,
      backgroundColor: '#000000',
      marginTop: sp(10),
    },
    searchInput: { color: '#fff', marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '500' },
    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 6 },
    tabButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#FFFFFF',
      borderRadius: 18,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: '#000000',
    },
    tabButtonActive: { borderColor: '#FFFFFF', backgroundColor: '#3A0751' },
    tabText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
    tabTextActive: { color: '#FFFFFF' },
    listArea: {
      flex: 1,
      marginHorizontal: 16,
      borderWidth: 1.3,
      borderColor: 'rgba(255,255,255,0.88)',
      borderRadius: 36,
      backgroundColor: '#000000',
      overflow: 'hidden',
    },
    listContainer: { paddingHorizontal: 20, paddingTop: 12 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 52 },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#FFFFFF',
      marginRight: 12,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listItemText: { color: '#fff', fontSize: 14, flex: 1, fontWeight: '700' },
    listItemTextSelected: { color: '#FFFFFF' },
    itemDivider: { height: 1, backgroundColor: '#A8A8A8' },
    floatingButtonContainer: { alignItems: 'center', paddingVertical: 16 },
    floatingButtonBg: {
      backgroundColor: '#2A0A3A',
      flexDirection: 'row',
      alignItems: 'center',
      height: ms(46),
      borderRadius: ms(23),
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
  });

export default CreateFastWorkoutScreen;
