import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Modal, TouchableWithoutFeedback, FlatList, ImageBackground, Image} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { fetchExercises, clearSelectedFilters } from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

const ClockIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#8E8E9A" strokeWidth={1.8} />
    <Path d="M12 7V12L15 15" stroke="#8E8E9A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ChevronDownIcon = ({ open }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9L12 15L18 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
  const [selectedLevel, setSelectedLevel] = useState('BEGINNER');
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const { exercises, loading, nextCursor, hasNextPage, selectedEquipment, selectedMuscles } = useSelector((state) => state.workout);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Commented out to preserve user-selected filters when navigating from custom/fast workout screens
  // useEffect(() => {
  //   dispatch(clearSelectedFilters());
  // }, [dispatch]);

  const activeMuscles = selectedMuscles?.filter(m => m !== 'All Muscles') || [];
  const hasActiveFilters =
    (selectedEquipment && selectedEquipment !== 'All Equipement') ||
    activeMuscles.length > 0;

  const mapUiFiltersToApi = (eq, muscles) => {
    const UI_TO_API_MUSCLE_MAP = {
      'abdominals': { type: 'target', value: 'abs' },
      'abductors': { type: 'target', value: 'abductors' },
      'adductors': { type: 'target', value: 'adductors' },
      'biceps': { type: 'target', value: 'biceps' },
      'calves': { type: 'target', value: 'calves' },
      'cardio': { type: 'bodyPart', value: 'cardio' },
      'chest': { type: 'bodyPart', value: 'chest' },
      'forearms': { type: 'target', value: 'forearms' },
      'glutes': { type: 'target', value: 'glutes' },
      'hamstrings': { type: 'target', value: 'hamstrings' },
      'lats': { type: 'target', value: 'lats' },
      'lower back': { type: 'target', value: 'spine' },
      'neck': { type: 'bodyPart', value: 'neck' },
      'quadriceps': { type: 'target', value: 'quads' },
      'shoulders': { type: 'bodyPart', value: 'shoulders' },
      'traps': { type: 'target', value: 'traps' },
      'triceps': { type: 'target', value: 'triceps' },
      'upper back': { type: 'target', value: 'upper back' },
    };

    const UI_TO_API_EQUIPMENT_MAP = {
      'none': 'body weight',
      'machine': 'cable',
      'plate': 'weighted',
      'suspension band': 'leverage machine',
    };

    const selectedBodyParts = [];
    const selectedTargetMuscles = [];

    const cleanedMuscles = muscles ? muscles.filter(m => m !== 'All Muscles') : [];

    cleanedMuscles.forEach((m) => {
      const lowerM = m.toLowerCase();
      if (UI_TO_API_MUSCLE_MAP[lowerM]) {
        const mapping = UI_TO_API_MUSCLE_MAP[lowerM];
        if (mapping.type === 'bodyPart') {
          selectedBodyParts.push(mapping.value);
        } else {
          selectedTargetMuscles.push(mapping.value);
        }
      } else {
        selectedTargetMuscles.push(lowerM);
      }
    });

    const eqKey = eq ? eq.toLowerCase() : '';
    const apiEquipment = UI_TO_API_EQUIPMENT_MAP[eqKey] || (eq && eq !== 'All Equipement' ? eqKey : undefined);

    return {
      equipments: apiEquipment,
      bodyParts: selectedBodyParts.length > 0 ? selectedBodyParts : undefined,
      targetMuscles: selectedTargetMuscles.length > 0 ? selectedTargetMuscles : undefined,
    };
  };

  useEffect(() => {
    if (hasActiveFilters) {
      const apiFilters = mapUiFiltersToApi(selectedEquipment, selectedMuscles);
      dispatch(fetchExercises({
        limit: 50,
        ...apiFilters
      }));
    } else {
      const bodyPartsForLevel = LEVEL_BODY_PARTS_MAP[selectedLevel] || [];
      dispatch(fetchExercises({ limit: 50, bodyParts: bodyPartsForLevel }));
    }
  }, [selectedLevel, selectedEquipment, selectedMuscles, dispatch]);

  const loadMoreExercises = async () => {
    if (hasNextPage && !isLoadingMore && !loading) {
      setIsLoadingMore(true);
      if (hasActiveFilters) {
        const apiFilters = mapUiFiltersToApi(selectedEquipment, selectedMuscles);
        await dispatch(fetchExercises({
          limit: 50,
          after: nextCursor,
          ...apiFilters,
          isLoadMore: true
        }));
      } else {
        const bodyPartsForLevel = LEVEL_BODY_PARTS_MAP[selectedLevel] || [];
        await dispatch(fetchExercises({
          limit: 50,
          after: nextCursor,
          bodyParts: bodyPartsForLevel,
          isLoadMore: true
        }));
      }
      setIsLoadingMore(false);
    }
  };

  const handleSelectLevel = (level) => {
    if (level !== selectedLevel) {
      setSelectedLevel(level);
    }
    setDropdownVisible(false);
  };

  const handleClearFilters = () => {
    dispatch(clearSelectedFilters());
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
          onPress={() => navigation?.navigate?.('CreateFastWorkoutScreen')}
        >
          <LinearGradient colors={['#3B0764', '#581C87']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.actionTopRow}>
            <View style={{ flex: 1 }} />
            <Image source={require('../../assets/image/tender.png')} style={styles.actionIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.actionLabel}>Create a New{'\n'}Fast Workout</Text>
          <View style={styles.actionPill} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CreateCustomWorkoutScreen')}
        >
          <LinearGradient colors={['#3B0764', '#581C87']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.actionTopRow}>
            <View style={{ flex: 1 }} />
            {/* Removed background circle wrapper, increased image size */}
            <Image source={require('../../assets/image/plus.png')} style={styles.actionIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.actionLabel}>Create a Custom{'\n'}Workout</Text>
          <View style={styles.actionPill} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          activeOpacity={0.75}
          onPress={() => navigation?.navigate?.('CurrentWorkoutPlanScreen')}
        >
          <LinearGradient colors={['#3B0764', '#581C87']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.actionTopRow}>
            <View style={{ flex: 1 }} />
            {/* Removed background circle wrapper, increased image size */}
            <Image source={require('../../assets/image/threedot.png')} style={styles.actionIconImage} resizeMode="contain" />
          </View>
          <Text style={styles.actionLabel}>My Current{'\n'}Workout Plan</Text>
          <View style={styles.actionPill} />
        </TouchableOpacity>
      </View>

      {hasActiveFilters ? (
        <View style={styles.filterBanner}>
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterMainText}>Showing results for:</Text>
            <Text style={styles.filterSubText}>
              {selectedEquipment !== 'All Equipement' ? selectedEquipment : 'All Equipment'}
              {selectedMuscles.length > 0 ? ` • ${selectedMuscles.join(', ')}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.clearFilterBtn} onPress={handleClearFilters}>
            <Text style={styles.clearFilterText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionRow}>
          <TouchableOpacity
            style={styles.sectionTitleRow}
            activeOpacity={0.7}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={styles.sectionTitle}>WORKOUT PLANS FOR </Text>
            <Text style={styles.sectionTitleUnderline}>{selectedLevel}</Text>
            <View style={{ marginLeft: 4 }}>
              <ChevronDownIcon open={dropdownVisible} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderItem = ({ item: exercise }) => {
    return (
      <TouchableOpacity
        style={styles.exerciseCardLarge}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('FastWorkoutActive', {
          exercises: [{ ...exercise, sets: [] }],
          level: selectedLevel
        })}
      >
        <ImageBackground
          source={{ uri: exercise.gifUrl }}
          style={styles.cardImageBackground}
          imageStyle={styles.cardImageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{exercise.name}</Text>
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardSubtitle}>12 minutes | {selectedLevel === 'INTERMEDIATE' ? 'Intermediate' : selectedLevel.charAt(0) + selectedLevel.slice(1).toLowerCase()}</Text>
                <Svg width={18} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21L12 17.5L5 21V5Z" fill="#7C3AED" />
                </Svg>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownContainer}>
                {levels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.dropdownItem,
                      level === selectedLevel && styles.dropdownItemActive,
                    ]}
                    onPress={() => handleSelectLevel(level)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        level === selectedLevel && styles.dropdownTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  actionCard: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'flex-start', minHeight: 90, overflow: 'hidden', position: 'relative' },
  actionGradient: { ...StyleSheet.absoluteFillObject },
  actionTopRow: { flexDirection: 'row', width: '100%', paddingHorizontal: 8, paddingTop: 8 },
  // Removed actionIconCircleSmall style
  actionIconImage: { width: 28, height: 28 }, // Increased size from 16 to 28
  actionLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', lineHeight: 14, letterSpacing: 0.1, textAlign: 'center', marginTop: 8, paddingHorizontal: 4 },
  actionPill: { width: 30, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', position: 'absolute', bottom: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, zIndex: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: '#8E8E9A', fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  sectionTitleUnderline: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textDecorationLine: 'underline' },
  seeAll: { color: '#8E8E9A', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownContainer: { width: '70%', backgroundColor: '#1C1C2E', borderRadius: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#2D2D44' },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 20 },
  dropdownItemActive: { backgroundColor: 'rgba(124, 58, 237, 0.2)' },
  dropdownText: { color: '#8E8E9A', fontSize: 15, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  dropdownTextActive: { color: '#FFFFFF' },
  emptyText: { color: '#8E8E9A', fontSize: 16, textAlign: 'center', marginTop: 50 },
  filterBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C1C2E', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#2D2D44' },
  filterTextContainer: { flex: 1 },
  filterMainText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  filterSubText: { color: '#8E8E9A', fontSize: 13, textTransform: 'capitalize' },
  clearFilterBtn: { padding: 8, backgroundColor: 'rgba(255,90,95,0.1)', borderRadius: 8 },
  clearFilterText: { color: '#FF5A5F', fontSize: 12, fontWeight: '700' },
  exerciseCardLarge: { width: '100%', height: 200, borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  cardImageBackground: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  cardImageStyle: { borderRadius: 20 },
  cardGradient: { width: '100%', height: '100%', justifyContent: 'flex-end', borderRadius: 20 },
  cardContent: { padding: 20 },
  cardTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8, textTransform: 'capitalize' },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSubtitle: { color: '#D1D5DB', fontSize: 14 }
});

export default WorkoutsScreen;
