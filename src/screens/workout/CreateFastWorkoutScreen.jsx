import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  PanResponder,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchExercises,
  fetchEquipments,
  fetchMuscles,
  setSelectedFilters,
} from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

// ─── Local asset paths ───────────────────────────────────────────────────────
const LIGHTNING_ICON = require('../../assets/image/tender.png');
const PLUS_ICON      = require('../../assets/image/plus.png');
// ─────────────────────────────────────────────────────────────────────────────

const CreateFastWorkoutScreen = () => {
  const navigation = useNavigation();
  const dispatch   = useDispatch();

  const { exercises, loading, equipments, muscles } = useSelector(
    (state) => state.workout,
  );

  useEffect(() => {
    if (!equipments || equipments.length === 0) dispatch(fetchEquipments());
    if (!muscles    || muscles.length    === 0) dispatch(fetchMuscles());
  }, [dispatch, equipments, muscles]);

  // ── selection state ──────────────────────────────────────────────────────
  const [selectedLevel,    setSelectedLevel]    = useState('Intermediate');
  const [selectedEnv,      setSelectedEnv]      = useState('BASIC GYM');
  const [selectedDuration, setSelectedDuration] = useState('45min');

  // ── modal state ──────────────────────────────────────────────────────────
  const [isModalVisible, setModalVisible]   = useState(false);
  const [activeTab,      setActiveTab]      = useState('Equipment');
  const [searchQuery,    setSearchQuery]    = useState('');

  const [selectedEquipment, setSelectedEquipment] = useState('All Equipement');
  const [selectedMuscles,   setSelectedMuscles]   = useState([]);

  const equipmentList =
    equipments && equipments.length > 0
      ? ['All Equipement', ...equipments.map((e) => e.name || e)]
      : [
          'All Equipement', 'None', 'Barbell', 'Dumbbell', 'Kettlebell',
          'Machine', 'Plate', 'Resistance Band', 'Suspension Band', 'Other',
        ];

  const musclesList =
    muscles && muscles.length > 0
      ? ['All Muscles', ...muscles.map((m) => m.name || m)]
      : [
          'All Muscles', 'Abdominals', 'Abductors', 'Adductors', 'Biceps',
          'Calves', 'Cardio', 'Chest', 'Forearms', 'Full Body', 'Glutes',
          'Hamstrings', 'Lats', 'Lower back', 'Neck', 'Quadriceps',
          'Shoulders', 'Traps', 'Triceps', 'Upper Back', 'Other',
        ];

  const toggleMuscle = (muscle) => {
    if (muscle === 'All Muscles') { setSelectedMuscles([]); return; }
    setSelectedMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle],
    );
  };

  // ── swipe button ─────────────────────────────────────────────────────────
  const pan        = React.useRef(new Animated.ValueXY()).current;
  const swipeWidth = 250;
  const sliderWidth = 50;

  const handleCreateWorkout = async () => {
    dispatch(setSelectedFilters(selectedEquipment, selectedMuscles));
    setModalVisible(false);

    const cleanedMuscles = selectedMuscles.filter((m) => m !== 'All Muscles');
    const knownBodyParts = [
      'back', 'cardio', 'chest', 'lower arms', 'lower legs',
      'neck', 'shoulders', 'upper arms', 'upper legs', 'waist',
    ];
    const selectedBodyParts   = [];
    const selectedTargetMuscles = [];

    cleanedMuscles.forEach((m) => {
      const lowerM = m.toLowerCase();
      if (knownBodyParts.includes(lowerM)) selectedBodyParts.push(lowerM);
      else selectedTargetMuscles.push(lowerM);
    });

    const fetchedExercises = await dispatch(
      fetchExercises({
        limit: 30,
        equipments:
          selectedEquipment !== 'All Equipement'
            ? selectedEquipment.toLowerCase()
            : undefined,
        bodyParts:     selectedBodyParts.length     > 0 ? selectedBodyParts     : undefined,
        targetMuscles: selectedTargetMuscles.length > 0 ? selectedTargetMuscles : undefined,
      }),
    );

    const formattedExercises = (fetchedExercises || []).map((ex) => ({
      ...ex,
      id:   ex.id || ex._id,
      sets: [],
    }));

    navigation.replace('FastWorkoutActive', {
      level:       selectedLevel,
      environment: selectedEnv,
      duration:    selectedDuration,
      equipment:   selectedEquipment,
      muscles:     cleanedMuscles,
      exercises:   formattedExercises,
    });
  };

  const handleCreateWorkoutRef    = React.useRef();
  handleCreateWorkoutRef.current  = handleCreateWorkout;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > swipeWidth - sliderWidth - 20) {
          Animated.spring(pan, {
            toValue:       { x: swipeWidth - sliderWidth, y: 0 },
            useNativeDriver: false,
          }).start();
          setTimeout(() => {
            handleCreateWorkoutRef.current?.();
            Animated.timing(pan, {
              toValue:       { x: 0, y: 0 },
              duration:      0,
              useNativeDriver: false,
            }).start();
          }, 300);
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 }, useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Lightning icon pill (matches top-left in screenshot) */}
          <View style={styles.headerPill}>
            <Image source={LIGHTNING_ICON} style={styles.lightningIcon} resizeMode="contain" />
            <Text style={styles.headerTitle}>Create a New Fast Workout</Text>
          </View>
        </View>

        {/* White rounded card wrapping all sections */}
        <View style={styles.card}>

          {/* LEVEL */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LEVEL</Text>
            <View style={styles.optionsRow}>
              {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                <OptionChip
                  key={level}
                  title={level}
                  isSelected={selectedLevel === level}
                  onSelect={() => setSelectedLevel(level)}
                />
              ))}
            </View>
          </View>

          {/* TRAINING ENVIRONMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRAINING ENVIRONMENT</Text>
            <View style={styles.optionsWrap}>
              {['ADVANCED GYM', 'BASIC GYM', 'AT-HOME GYM', 'ZERO EQUIPEMENT', 'PERSONALISED'].map(
                (env) => (
                  <OptionChip
                    key={env}
                    title={env}
                    isSelected={selectedEnv === env}
                    onSelect={() => setSelectedEnv(env)}
                  />
                ),
              )}
            </View>
          </View>

          {/* WORKOUT DURATION */}
          <View style={[styles.section, { marginBottom: 0 }]}>
            <Text style={styles.sectionLabel}>WORKOUT DURATION</Text>
            <View style={styles.optionsRow}>
              {['30min', '45min', '50min', 'Choose Duration'].map((dur) => (
                <OptionChip
                  key={dur}
                  title={dur}
                  isSelected={selectedDuration === dur}
                  onSelect={() => setSelectedDuration(dur)}
                />
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Add Exercise Button ── */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          {/* Circle with + icon from assets */}
          <View style={styles.plusCircle}>
            <Image source={PLUS_ICON} style={styles.plusIcon} resizeMode="contain" />
          </View>
          <Text style={styles.addButtonText}>Add Exercise</Text>
        </TouchableOpacity>
      </View>

      {/* ── Equipment / Muscles Modal ── */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="#888"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Exercise"
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {['Equipment', 'Muscles'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'Equipment' ? 'All Equipment' : 'All Muscles'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <View style={styles.modalContentContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {activeTab === 'Equipment' ? 'Equipment' : 'Muscles'}
            </Text>
            <View style={styles.modalDivider} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            >
              {(activeTab === 'Equipment' ? equipmentList : musclesList).map(
                (item, index) => {
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
                        <View style={styles.iconCircle} />
                        <Text style={styles.listItemText}>{item}</Text>
                        {isChecked && (
                          <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M5 13L9 17L19 7"
                              stroke="#007AFF"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        )}
                      </TouchableOpacity>
                      <View style={styles.itemDivider} />
                    </View>
                  );
                },
              )}
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>

          {/* Swipe-to-create button */}
          <View style={styles.floatingButtonContainer}>
            <View style={[styles.floatingButtonBg, { width: swipeWidth }]}>
              <Text style={styles.floatingButtonTextBg}>Create Fast Workout</Text>
              <Svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ position: 'absolute', right: 15 }}
              >
                <Path d="M9 18L15 12L9 6"  stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M13 18L19 12L13 6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M17 18L23 12L17 6" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>

              <Animated.View
                style={[
                  styles.swipeThumb,
                  {
                    transform: [
                      {
                        translateX: pan.x.interpolate({
                          inputRange:  [0, swipeWidth - sliderWidth],
                          outputRange: [0, swipeWidth - sliderWidth],
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.floatingButtonIcon}>
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#000" />
                    </Svg>
                  )}
                </View>
              </Animated.View>
            </View>
          </View>

        </View>
      </Modal>
    </View>
  );
};

// ─── OptionChip ──────────────────────────────────────────────────────────────
const OptionChip = ({ title, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipSelected]}
    onPress={onSelect}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
      {title}
    </Text>
  </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Screen ──────────────────────────────────────────────────────────────
  container: {
    flex:            1,
    backgroundColor: '#0A0A12',
  },

  // ── Header pill (top of screen) ─────────────────────────────────────────
  header: {
    paddingHorizontal: 20,
    paddingTop:        55,
    paddingBottom:     20,
  },
  headerPill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#2D1B4E',
    alignSelf:       'flex-start',
    paddingVertical:   10,
    paddingHorizontal: 16,
    borderRadius:      30,
  },
  lightningIcon: {
    width:       68,       // ⬅️ INCREASED from 28 to 38
    height:      68,       // ⬅️ INCREASED from 28 to 38
    marginRight: 10,
  },
  headerTitle: {
    fontSize:   13,        // ⬅️ DECREASED from 16 to 13
    fontWeight: '700',
    color:      '#FFFFFF',
  },

  // ── White rounded card ───────────────────────────────────────────────────
  card: {
   
    borderRadius:      28,
    marginHorizontal:  14,
    marginBottom:      20,
    paddingHorizontal: 20,
    paddingTop:        28,
    paddingBottom:     28,
    borderWidth:       1,
   
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    color:        '#8E8E9A',
    fontSize:     12,
    fontWeight:   '700',
    letterSpacing: 1.2,
    marginBottom:  14,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chip: {
    backgroundColor: '#0A0A12',
    paddingVertical:   10,
    paddingHorizontal: 18,
    borderRadius:      25,
    marginRight:       8,
    marginBottom:      10,
    borderWidth:       1,
    borderColor:       '#2A2A40',
  },
  chipSelected: {
    backgroundColor: '#2D1B4E',
    borderColor:     '#A855F7',
  },
  chipText: {
    color:      '#8E8E9A',
    fontSize:   14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // ── Add Exercise button ──────────────────────────────────────────────────
  bottomContainer: {
    paddingHorizontal: 50,
    paddingBottom:     40,
    paddingTop:        10,
    backgroundColor:   '#0A0A12',
    alignItems:        'center',
  },
  addButton: {
    backgroundColor: '#3D1A6E',
    flexDirection:   'row',
    height:           56,
    borderRadius:     28,
    paddingHorizontal: 24,
    justifyContent:  'center',
    alignItems:      'center',
    // subtle glow
    shadowColor:    '#7C3AED',
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:   0.35,
    shadowRadius:    10,
    elevation:        8,
  },
  plusCircle: {
       // ⬅️ INCREASED from 17 to 21 to match half width/height
   
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     10,
  },
  plusIcon: {
    width:     74,             // ⬅️ INCREASED from 18 to 24
    height:    74,             // ⬅️ INCREASED from 18 to 24
  },
  addButtonText: {
    color:      '#FFFFFF',
    fontSize:   14,            // ⬅️ DECREASED from 17 to 14
    fontWeight: '700',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalContainer: {
    flex:            1,
    backgroundColor: '#000',
    paddingTop:       50,
  },
  searchBar: {
    flexDirection:    'row',
    alignItems:       'center',
    borderWidth:       1,
    borderColor:      '#333',
    borderRadius:     20,
    paddingHorizontal: 15,
    marginHorizontal:  20,
    height:            40,
    marginBottom:      20,
  },
  searchInput: {
    color:       '#fff',
    marginLeft:   10,
    flex:          1,
    fontSize:     13,
  },
  tabsContainer: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    paddingHorizontal: 20,
    marginBottom:      20,
  },
  tabButton: {
    flex:            1,
    borderWidth:     1,
    borderColor:    '#333',
    borderRadius:    20,
    paddingVertical: 10,
    alignItems:      'center',
    marginHorizontal: 5,
  },
  tabButtonActive: {
    borderColor:     '#4A148C',
    backgroundColor: '#2D1B4E',
  },
  tabText: {
    color:    '#888',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#D8B4E2',
  },
  modalContentContainer: {
    flex:                1,
    borderWidth:          1,
    borderColor:         '#444',
    borderTopLeftRadius:  30,
    borderTopRightRadius: 30,
    paddingTop:           15,
    borderBottomWidth:    0,
    marginHorizontal:     10,
  },
  modalHandle: {
    width:         40,
    height:         4,
    backgroundColor: '#ccc',
    borderRadius:    2,
    alignSelf:      'center',
    marginBottom:    15,
  },
  modalTitle: {
    color:        '#fff',
    fontSize:     16,
    fontWeight:   'bold',
    textAlign:    'center',
    marginBottom: 15,
  },
  modalDivider: {
    height:          1,
    backgroundColor: '#333',
    width:           '100%',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop:        10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingVertical: 15,
  },
  iconCircle: {
    width:        36,
    height:       36,
    borderRadius: 18,
    borderWidth:   1,
    borderColor:  '#666',
    marginRight:   15,
  },
  listItemText: {
    color:    '#fff',
    fontSize: 15,
    flex:      1,
  },
  itemDivider: {
    height:          1,
    backgroundColor: '#333',
    width:           '100%',
  },

  // ── Swipe button ──────────────────────────────────────────────────────────
  floatingButtonContainer: {
    position:    'absolute',
    bottom:       30,
    left:          0,
    right:         0,
    alignItems:  'center',
  },
  floatingButtonBg: {
    backgroundColor: '#2A0A3A',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    height:           50,
    borderRadius:     25,
    borderWidth:       1,
    borderColor:     '#3D1A54',
    overflow:        'hidden',
  },
  floatingButtonTextBg: {
    color:      '#fff',
    fontSize:   12,
    fontWeight: 'bold',
    position:   'absolute',
    zIndex:      0,
  },
  swipeThumb: {
    position:       'absolute',
    left:            0,
    top:             0,
    bottom:          0,
    width:           50,
    justifyContent: 'center',
    alignItems:     'center',
    zIndex:          1,
  },
  floatingButtonIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#fff',
    justifyContent:  'center',
    alignItems:      'center',
    marginLeft:       5,
  },
});

export default CreateFastWorkoutScreen;