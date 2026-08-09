import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MuscleIcon } from './MuscleIcon';
import InteractiveMuscleMap from './workout/InteractiveMuscleMap';

export const MUSCLE_SECTIONS = [
  {
    title: 'Upper Body',
    data: [
      'Abdominals',
      'Biceps',
      'Chest',
      'Forearms',
      'Lats',
      'Lower Back',
      'Neck',
      'Shoulders',
      'Traps',
      'Triceps',
      'Upper Back',
    ],
  },
  {
    title: 'Lower Body',
    data: [
      'Abductors',
      'Adductors',
      'Calves',
      'Glutes',
      'Hamstrings',
      'Quadriceps',
    ],
  },
  {
    title: 'Other',
    data: [
      'Cardio',
      'Full Body',
      'Other',
    ],
  },
];

export const MuscleModal = ({
  visible,
  onClose,
  selectedMuscles,
  onSelectMuscle,
}) => {
  const isMuscleSelected = (item) => {
    if (!selectedMuscles) return false;
    if (Array.isArray(selectedMuscles)) {
      return selectedMuscles.some(
        (m) => (m || '').toLowerCase().trim() === item.toLowerCase().trim()
      );
    }
    return (selectedMuscles || '').toLowerCase().trim() === item.toLowerCase().trim();
  };

  const handleSelect = (item) => {
    onSelectMuscle(item);
  };

  const handleMapToggle = (muscleId) => {
    const formatMap = {
      abs: 'Abdominals',
      chest: 'Chest',
      shoulders: 'Shoulders',
      deltoids: 'Shoulders',
      biceps: 'Biceps',
      triceps: 'Triceps',
      forearms: 'Forearms',
      forearm: 'Forearms',
      lats: 'Lats',
      'upper-back': 'Upper Back',
      lower_back: 'Lower Back',
      'lower-back': 'Lower Back',
      traps: 'Traps',
      trapezius: 'Traps',
      glutes: 'Glutes',
      gluteal: 'Glutes',
      quads: 'Quadriceps',
      quadriceps: 'Quadriceps',
      hamstrings: 'Hamstrings',
      hamstring: 'Hamstrings',
      calves: 'Calves',
      obliques: 'Abdominals',
      abductors: 'Abductors',
      adductors: 'Adductors',
      neck: 'Neck',
      cardio: 'Cardio',
      full_body: 'Full Body',
    };
    const targetName = formatMap[muscleId] || muscleId;
    onSelectMuscle(targetName);
  };

  const formattedSelectedSlugs = Array.isArray(selectedMuscles)
    ? selectedMuscles.map(m => (m || '').toLowerCase().replace(/\s+/g, '_'))
    : selectedMuscles ? [(selectedMuscles || '').toLowerCase().replace(/\s+/g, '_')] : [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContentContainer}>
            {/* Handle Bar */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Target Muscles</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {/* Main Scroll Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Instruction Text */}
              <Text style={styles.mapInstructionText}>
                Select muscles on the interactive body map or choose from the list below.
              </Text>

              {/* Interactive Anatomy Body Map SVG */}
              <View style={styles.mapContainer}>
                <InteractiveMuscleMap
                  selectedMuscles={formattedSelectedSlugs}
                  onToggleMuscle={handleMapToggle}
                />
              </View>

              {/* Section List (Upper Body, Lower Body, Other) */}
              {MUSCLE_SECTIONS.map((section, sectionIdx) => (
                <View key={sectionIdx} style={styles.sectionContainer}>
                  {/* Section Title */}
                  <Text style={styles.sectionTitle}>{section.title}</Text>

                  {/* 2-Column Grid */}
                  <View style={styles.gridContainer}>
                    {section.data.map((item, itemIdx) => {
                      const selected = isMuscleSelected(item);
                      return (
                        <TouchableOpacity
                          key={itemIdx}
                          style={[
                            styles.muscleCard,
                            selected && styles.muscleCardSelected,
                          ]}
                          onPress={() => handleSelect(item)}
                          activeOpacity={0.8}
                        >
                          {/* Circular Avatar / Badge */}
                          <View style={styles.iconCircle}>
                            <MuscleIcon name={item} size={34} />
                          </View>

                          {/* Muscle Label */}
                          <Text
                            style={[
                              styles.cardText,
                              selected && styles.cardTextSelected,
                            ]}
                            numberOfLines={2}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Apply / Close Button */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    justifyContent: 'flex-end',
  },
  modalContentContainer: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 12,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mapInstructionText: {
    color: '#EBEBF5',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 4,
    opacity: 0.85,
  },
  mapContainer: {
    backgroundColor: '#1A1D24',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  muscleCard: {
    width: '48.5%',
    backgroundColor: '#242426',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  muscleCardSelected: {
    borderColor: '#EE822A',
    backgroundColor: '#2D2622',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  cardTextSelected: {
    color: '#FF9F43',
    fontWeight: '700',
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161618',
  },
  applyBtn: {
    backgroundColor: '#EE822A',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
