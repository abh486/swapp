import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { EquipmentModal } from '../../../components/EquipmentModal';
import { MuscleModal } from '../../../components/MuscleModal';

export const SearchExercisesModal = ({
  visible,
  onClose,
  isCustomWorkout,
  searchQuery,
  setSearchQuery,
  selectedExercises,
  setSelectedExercises,
  selectedEquipment,
  setSelectedEquipment,
  selectedMuscles,
  setSelectedMuscles,
  apiLoading,
  displayedExercises,
  handleSaveSelectedExercises,
  toggleExerciseSelection,
  toggleMuscle,
  isEquipmentModalVisible,
  setIsEquipmentModalVisible,
  isMuscleModalVisible,
  setIsMuscleModalVisible,
  setReopenModalOnFocus,
}) => {
  const navigation = useNavigation();

  const renderExerciseItem = ({ item }) => {
    const target = item.target || (item.targetMuscles && item.targetMuscles[0]) || '';
    const equipment = item.equipment || (item.equipments && item.equipments[0]) || '';
    const rawImg = item.imageUrl || item.gifUrl || (item.exerciseId ? `https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com/api/v1/exercises/image/${item.exerciseId}` : null);
    const imageSource = rawImg
      ? { uri: rawImg, headers: { 'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com', 'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d' } }
      : null;
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
              console.log('[SearchExercisesModal] Navigating to ExerciseDetail with item:', item.name);
              try {
                if (setReopenModalOnFocus) setReopenModalOnFocus(true);
                onClose();
                navigation.navigate('ExerciseDetail', { exercise: item });
              } catch (err) {
                console.error('[SearchExercisesModal] Navigation failed:', err);
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
            style={styles.backButton}
            onPress={onClose}
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
  backButton: {
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
  badgeCustom: {
    backgroundColor: '#EE822A',
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
  checkboxCustom: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#EE822A',
    justifyContent: 'center',
    alignItems: 'center',
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
  addSelectedButtonDisabledCustom: {
    backgroundColor: '#333',
  },
  addSelectedButtonTextCustom: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default SearchExercisesModal;
