import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  FlatList,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { GlobalLoader } from '../../../components/GlobalLoader';
import { EquipmentModal } from '../../../components/EquipmentModal';
import { MuscleModal } from '../../../components/MuscleModal';
import { fetchExercises } from '../../../redux/actions/workoutActions';

export const CustomWorkoutModal = ({
  visible,
  onClose,
  onSaveWorkout,
  editingWorkout,
  setReopenModalOnFocus,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { exercises, loading } = useSelector(state => state.workout);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutNameInput, setWorkoutNameInput] = useState('');
  const [isEquipmentModalVisible, setIsEquipmentModalVisible] = useState(false);
  const [isMuscleModalVisible, setIsMuscleModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingWorkout) {
        setWorkoutNameInput(editingWorkout.name || '');
        setSelectedExercises(editingWorkout.exercises || []);
      } else {
        setWorkoutNameInput('');
        setSelectedExercises([]);
      }
      setSelectedEquipment('All Equipment');
      setSelectedMuscles([]);
      setSearchQuery('');
    }
  }, [visible, editingWorkout]);

  useEffect(() => {
    if (!visible) return;

    const apiFilters = {};
    const UI_TO_API_EQUIPMENT_MAP = {
      none: 'body weight',
      machine: 'cable',
      plate: 'weighted',
      'suspension band': 'leverage machine',
    };

    if (selectedEquipment && selectedEquipment !== 'All Equipment' && selectedEquipment !== 'All Equipement') {
      const eqKey = selectedEquipment.toLowerCase();
      apiFilters.equipments = UI_TO_API_EQUIPMENT_MAP[eqKey] || eqKey;
    }
    const cleanedMuscles = selectedMuscles.filter(m => m !== 'All Muscles');
    if (cleanedMuscles.length > 0) {
      apiFilters.targetMuscles = cleanedMuscles.map(m => m.toLowerCase());
    }

    dispatch(fetchExercises({
      limit: 200,
      search: searchQuery,
      ...apiFilters,
    }));
  }, [selectedEquipment, selectedMuscles, visible, searchQuery, dispatch]);

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

  const handleSave = () => {
    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise for your custom workout.');
      return;
    }
    onSaveWorkout({
      workoutNameInput,
      selectedExercises,
      selectedEquipment,
      editingWorkoutId: editingWorkout ? editingWorkout.id : null,
    });
  };

  const displayedExercises = (exercises || []).filter(ex =>
    (ex.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.equipment || (ex.equipments && ex.equipments[0]) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ex.target || (ex.targetMuscles && ex.targetMuscles[0]) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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

    return (
      <View style={[styles.exerciseCardCustom, isSelected && styles.exerciseCardSelectedCustom]}>
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
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              console.log('[CustomWorkoutModal] Navigating to ExerciseDetail with item:', item.name);
              try {
                if (setReopenModalOnFocus) setReopenModalOnFocus(true);
                onClose();
                navigation.navigate('ExerciseDetail', { exercise: item });
              } catch (err) {
                console.error('[CustomWorkoutModal] Navigation failed:', err);
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
            style={styles.checkboxContainerCustom}
            activeOpacity={0.75}
          >
            {isSelected ? (
              <View style={styles.checkboxSelectedCustom}>
                <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            ) : (
              <View style={styles.checkboxUnselectedCustom} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.editorHeader}>
          <TouchableOpacity
            style={styles.closeButtonCustom}
            onPress={() => {
              onClose();
              setSearchQuery('');
              setSelectedEquipment('');
              setSelectedMuscles([]);
            }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerPillCustom}>
            <Text style={styles.headerPillTextCustom}>
              {editingWorkout ? 'Edit Workout' : 'Create a Custom Workout'}
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

        {/* Selected Exercises Chips */}
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
            <Text style={styles.filterLabel}>Muscle Group</Text>
            <Text style={styles.filterValue} numberOfLines={1}>
              {selectedMuscles.length > 0 ? selectedMuscles.join(', ') : 'Interactive Body Map'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listArea}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <GlobalLoader size={60} />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : displayedExercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises found matching your filters.</Text>
              {(selectedEquipment !== 'All Equipment' || selectedMuscles.length > 0 || searchQuery !== '') && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => {
                    setSelectedEquipment('All Equipment');
                    setSelectedMuscles([]);
                    setSearchQuery('');
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
          <TouchableOpacity
            style={styles.addSelectedButtonCustom}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#EE822A', '#8F5D98', '#2E4D9F']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.addSelectedButtonTextCustom}>
              {selectedExercises.length > 0
                ? `Save Selected Exercises (${selectedExercises.length})`
                : 'Save Workout'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <EquipmentModal
        visible={isEquipmentModalVisible}
        onClose={() => setIsEquipmentModalVisible(false)}
        selectedEquipment={selectedEquipment}
        onSelectEquipment={(eq) => setSelectedEquipment(eq)}
      />

      <MuscleModal
        visible={isMuscleModalVisible}
        onClose={() => setIsMuscleModalVisible(false)}
        selectedMuscles={selectedMuscles}
        onSelectMuscle={(muscle) => toggleMuscle(muscle)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 12,
  },
  closeButtonCustom: {
    padding: 4,
  },
  headerPillCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2436',
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
  searchInputCustom: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
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
    backgroundColor: '#007AFF',
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
    marginTop: 10,
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
  filterLabel: {
    color: '#AEB4C0',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listArea: {
    flex: 1,
    marginHorizontal: 16,
  },
  listContentContainer: {
    paddingBottom: 100,
  },
  exerciseCardCustom: {
    backgroundColor: '#1E1C2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  exerciseCardSelectedCustom: {
    borderColor: 'rgba(124, 58, 237, 0.4)',
    backgroundColor: '#252136',
  },
  exerciseRowCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exerciseThumbnailCustom: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  exerciseInfoCustom: {
    flex: 1,
    gap: 4,
  },
  exerciseNameCustom: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  badgeRowCustom: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  muscleBadgeCustom: {
    backgroundColor: '#EE822A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equipmentBadgeCustom: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTextCustom: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  checkboxContainerCustom: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  checkboxSelectedCustom: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2E4D9F',
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
  floatingButtonContainer: {
    alignItems: 'center',
    paddingVertical: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#AEB4C0',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#AEB4C0',
    fontSize: 13,
    fontWeight: '600',
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
});

export default CustomWorkoutModal;
