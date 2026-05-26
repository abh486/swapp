import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  PanResponder,
  Animated,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExercises,
  fetchEquipments,
  fetchMuscles,
  setSelectedFilters,
} from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

const LIGHTNING_ICON = require('../../assets/image/tender.png');
const PLUS_ICON = require('../../assets/image/plus.png');

const swipeWidth = 240;
const sliderWidth = 46;

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const LEVEL_BODY_PARTS_MAP = {
  Beginner: ['Cardio', 'Neck', 'Full Body'],
  Intermediate: ['Chest', 'Back', 'Shoulders', 'Upper Arms', 'Upper Legs'],
  Advanced: ['Waist', 'Lower Arms', 'Lower Legs'],
};

const CreateFastWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { equipments, muscles } = useSelector(state => state.workout);

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles || muscles.length === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [selectedEnv, setSelectedEnv] = useState('BASIC GYM');
  const [selectedDuration, setSelectedDuration] = useState('45min');
  const [isModalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('Equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipement');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const equipmentList = equipments?.length
    ? ['All Equipement', ...equipments.map(e => e.name || e)]
    : ['All Equipement', 'None', 'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other'];

  const musclesList = muscles?.length
    ? ['All Muscles', ...muscles.map(m => m.name || m)]
    : ['All Muscles', 'Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Cardio', 'Chest', 'Forearms', 'Full Body', 'Glutes', 'Hamstrings', 'Lats', 'Lower back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps', 'Upper Back', 'Other'];

  const toggleMuscle = muscle => {
    if (muscle === 'All Muscles') { setSelectedMuscles([]); return; }
    setSelectedMuscles(prev =>
      prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle],
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
        barbell: 'barbell',
        dumbbell: 'dumbbell',
        kettlebell: 'kettlebell',
        machine: 'cable',
        plate: 'weighted',
        'resistance band': 'resistance band',
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
      const apiEquipment =
        UI_TO_API_EQUIPMENT_MAP[eqKey] ||
        (selectedEquipment !== 'All Equipement' ? eqKey : undefined);
      const levelBodyParts = LEVEL_BODY_PARTS_MAP[selectedLevel] || [];

      const fetchedExercises = await dispatch(fetchExercises({
        limit: 30,
        equipments: apiEquipment,
        bodyParts: selectedBodyParts.length > 0 ? selectedBodyParts : levelBodyParts,
        targetMuscles: selectedTargetMuscles.length > 0 ? selectedTargetMuscles : undefined,
      }));

      const formattedExercises = (fetchedExercises || []).slice(0, 1).map(ex => ({
        ...ex,
        id: ex.id || ex._id,
        gifUrl: ex.gifUrl,
        sets: 3,
        reps: 12,
        weight: '4.00',
      }));

      setModalVisible(false);
      navigation.replace('FastWorkoutActive', {
        level: selectedLevel,
        environment: selectedEnv,
        duration: selectedDuration,
        equipment: selectedEquipment,
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
        if (gesture.dx > swipeWidth - sliderWidth - 20) {
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
        <View style={styles.headerPill}>
          <Image source={LIGHTNING_ICON} style={styles.lightningIcon} resizeMode="contain" />
          <Text style={styles.headerTitle}>Create a New Fast Workout</Text>
        </View>
      </View>

      {/* Card — flex:1, no scroll, everything fits on screen */}
      <View style={styles.card}>

        <Text style={styles.sectionLabel}>LEVEL</Text>
        <View style={styles.optionsRow}>
          {LEVEL_OPTIONS.map(level => (
            <OptionChip key={level} title={level} isSelected={selectedLevel === level} onSelect={() => setSelectedLevel(level)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>TRAINING ENVIRONMENT</Text>
        <View style={styles.optionsRow}>
          {['ADVANCED GYM', 'BASIC GYM', 'AT-HOME GYM', 'ZERO EQUIPMENT', 'PERSONALISED'].map(env => (
            <OptionChip key={env} title={env} isSelected={selectedEnv === env} onSelect={() => setSelectedEnv(env)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>WORKOUT DURATION</Text>
        <View style={styles.optionsRow}>
          {['30min', '45min', '50min', 'Choose Duration'].map(dur => (
            <OptionChip key={dur} title={dur} isSelected={selectedDuration === dur} onSelect={() => setSelectedDuration(dur)} />
          ))}
        </View>

        {/* Add Exercise — vertically centred in remaining space */}
        <View style={styles.addExerciseArea}>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
            <View style={styles.plusCircle}>
              <Image source={PLUS_ICON} style={styles.plusIcon} resizeMode="contain" />
            </View>
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.selectorBackButton}
            onPress={() => setModalVisible(false)}
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
              <Path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Exercise"
              placeholderTextColor="#444"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

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

          <View style={styles.modalContentContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {activeTab === 'Equipment' ? 'Equipment' : 'Muscles'}
            </Text>
            <View style={styles.modalDivider} />

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
                        {index === 0 && (
                          <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <Path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
                          </Svg>
                        )}
                      </View>
                      <Text style={styles.listItemText}>{item}</Text>
                      {isChecked && (
                        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

          {/* Swipe to create */}
          <View style={styles.floatingButtonContainer}>
            <View style={[styles.floatingButtonBg, { width: swipeWidth }]}>
              <Text style={styles.floatingButtonTextBg}>Create Fast Workout</Text>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', right: 12 }}>
                <Path d="M9 18L15 12L9 6"  stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  {isCreating
                    ? <ActivityIndicator color="#48075F" />
                    : (
                      <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#48075F" />
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

const OptionChip = ({ title, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onSelect}
    activeOpacity={0.7}>
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // Screen
  container: { flex: 1, backgroundColor: '#000000' },

  // Header
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A0751',
    alignSelf: 'flex-start',
    paddingRight: 18,
    paddingLeft: 0,
    borderRadius: 22,
    minHeight: 44,
  },
  lightningIcon: { width: 48, height: 48, marginLeft: -2, marginRight: 6 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },

  // Card (flex:1 = fills remaining screen, no scroll needed)
  card: {
    flex: 1,
    borderRadius: 44,
    marginHorizontal: 10,
    marginBottom: 14,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.88)',
    backgroundColor: 'transparent',
  },

  // Labels
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2.2,
    marginBottom: 10,
  },

  // Chips
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

  // Add button
  addExerciseArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButton: {
    backgroundColor: '#2D063F',
    flexDirection: 'row',
    height: 52,
    borderRadius: 26,
    paddingLeft: 6,
    paddingRight: 26,
    alignItems: 'center',
    gap: 8,
  },
  plusCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  plusIcon: { width: 50, height: 50 },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#000', paddingTop: 128 },
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
  searchInput: { color: '#fff', marginLeft: 12, flex: 1, fontSize: 15, fontWeight: '500' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 26, marginBottom: 50, gap: 8 },
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
  modalContentContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 54,
    borderTopRightRadius: 54,
    borderBottomWidth: 0,
    marginHorizontal: 24,
    paddingTop: 24,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  modalHandle: { width: 54, height: 6, backgroundColor: '#D9DDE2', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  modalDivider: { height: 1, backgroundColor: '#B8B8B8' },
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
  itemDivider: { height: 1, backgroundColor: '#A8A8A8' },

  // Swipe button
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
});

export default CreateFastWorkoutScreen;
