import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import InteractiveMuscleMap from '../../components/workout/InteractiveMuscleMap';

const MUSCLE_LIST = [
  { id: 'abs', name: 'Abdominals', category: 'Front' },
  { id: 'chest', name: 'Chest', category: 'Front' },
  { id: 'shoulders', name: 'Shoulders', category: 'Front/Back' },
  { id: 'biceps', name: 'Biceps', category: 'Front' },
  { id: 'obliques', name: 'Obliques', category: 'Front' },
  { id: 'quads', name: 'Quadriceps', category: 'Front' },
  { id: 'lats', name: 'Lats', category: 'Back' },
  { id: 'upper_back', name: 'Upper Back', category: 'Back' },
  { id: 'lower_back', name: 'Lower Back', category: 'Back' },
  { id: 'traps', name: 'Traps', category: 'Back' },
  { id: 'triceps', name: 'Triceps', category: 'Back' },
  { id: 'glutes', name: 'Glutes', category: 'Back' },
  { id: 'hamstrings', name: 'Hamstrings', category: 'Back' },
  { id: 'calves', name: 'Calves', category: 'Front/Back' },
  { id: 'forearms', name: 'Forearms', category: 'Front/Back' },
];

const normalizeInitial = (arr) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return ['abs', 'lower_back'];
  return arr.map((m) => {
    const str = String(m).toLowerCase();
    if (str.includes('ab') || str.includes('waist')) return 'abs';
    if (str.includes('chest')) return 'chest';
    if (str.includes('shoulder')) return 'shoulders';
    if (str.includes('hamstring') || str.includes('biceps femoris')) return 'hamstrings';
    if (str.includes('tricep')) return 'triceps';
    if (str.includes('bicep')) return 'biceps';
    if (str.includes('lower') || str.includes('lumbar')) return 'lower_back';
    if (str.includes('upper back') || str.includes('upper_back') || str.includes('rhomboid')) return 'upper_back';
    if (str.includes('latissimus') || str.includes('lats') || (str.includes('lat') && !str.includes('lateral') && !str.includes('flat') && !str.includes('platform'))) return 'lats';
    if (str.includes('quad') || str.includes('upper leg')) return 'quads';
    if (str.includes('glute')) return 'glutes';
    if (str.includes('calf') || str.includes('calves') || str.includes('lower leg')) return 'calves';
    if (str.includes('forearm') || str.includes('lower arm')) return 'forearms';
    if (str.includes('oblique')) return 'obliques';
    if (str.includes('trap') || str.includes('neck')) return 'traps';
    if (str.includes('back')) return 'upper_back';
    return str;
  });
};

export const MuscleSelectionScreen = ({ navigation, route }) => {
  const [selectedMuscles, setSelectedMuscles] = useState(() =>
    normalizeInitial(route?.params?.initialSelected)
  );
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'front' | 'back'

  const toggleMuscle = (rawId) => {
    const normalized = normalizeInitial([rawId])[0] || rawId;
    setSelectedMuscles((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((id) => id !== normalized);
      } else {
        return [...prev, normalized];
      }
    });
  };

  const handleReset = () => {
    setSelectedMuscles([]);
  };

  const handleConfirm = () => {
    const selectedDetails = MUSCLE_LIST.filter((m) => selectedMuscles.includes(m.id));

    if (route?.params?.onSelectMuscles) {
      route.params.onSelectMuscles(selectedMuscles, selectedDetails);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Target Muscles</Text>
        {selectedMuscles.length > 0 ? (
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Instructional Prompt (Matches uploaded image exactly) */}
        <Text style={styles.instructionText}>
          Select the muscles you would like to train. (2-3 recommended)
        </Text>

        {/* View Mode Segmented Control Switcher */}
        <View style={styles.viewSegmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'both' && styles.segmentBtnActive]}
            onPress={() => setViewMode('both')}
          >
            <Text style={[styles.segmentText, viewMode === 'both' && styles.segmentTextActive]}>
              Both Views
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'front' && styles.segmentBtnActive]}
            onPress={() => setViewMode('front')}
          >
            <Text style={[styles.segmentText, viewMode === 'front' && styles.segmentTextActive]}>
              Front Only
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'back' && styles.segmentBtnActive]}
            onPress={() => setViewMode('back')}
          >
            <Text style={[styles.segmentText, viewMode === 'back' && styles.segmentTextActive]}>
              Back Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Anatomy Vector Body Map */}
        <View style={styles.mapCard}>
          <InteractiveMuscleMap
            selectedMuscles={selectedMuscles}
            onToggleMuscle={toggleMuscle}
            viewMode={viewMode}
          />
        </View>

        {/* Selected Muscle Pills & Quick Toggle List */}
        <View style={styles.chipSection}>
          <Text style={styles.sectionHeading}>
            All Muscle Groups ({selectedMuscles.length} selected)
          </Text>
          <View style={styles.chipWrap}>
            {MUSCLE_LIST.map((muscle) => {
              const active = selectedMuscles.includes(muscle.id);
              return (
                <TouchableOpacity
                  key={muscle.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleMuscle(muscle.id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={active ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={active ? '#FFFFFF' : '#6366F1'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {muscle.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomCount}>
            {selectedMuscles.length} Muscle{selectedMuscles.length !== 1 ? 's' : ''} Selected
          </Text>
          <Text style={styles.bottomSubtext}>
            {selectedMuscles.length >= 2 && selectedMuscles.length <= 3
              ? 'Ideal target range achieved!'
              : '2-3 recommended per session'}
          </Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>Continue</Text>
          <Icon name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  headerBar: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEF',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  scrollContent: {
    paddingBottom: 110,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    color: '#2C2C2E',
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  viewSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFEFF4',
    borderRadius: 20,
    padding: 3,
    marginBottom: 10,
    width: '88%',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 17,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#636366',
  },
  segmentTextActive: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '95%',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 18,
  },
  chipSection: {
    width: '92%',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3A3A3C',
    marginBottom: 10,
    marginLeft: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF1F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E6EC',
  },
  chipActive: {
    backgroundColor: '#1E88E5',
    borderColor: '#1565C0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 10,
  },
  bottomInfo: {
    flex: 1,
  },
  bottomCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  bottomSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MuscleSelectionScreen;
