import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { EquipmentIcon } from './EquipmentIcon';

const { width } = Dimensions.get('window');

export const EQUIPMENT_OPTIONS = [
  'None',
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Plate',
  'Resistance Band',
  'Suspension Band',
  'Other',
];

export const EquipmentModal = ({
  visible,
  onClose,
  selectedEquipment,
  onSelectEquipment,
}) => {
  const isEquipSelected = (item) => {
    if (!selectedEquipment) return false;
    return selectedEquipment.toLowerCase().trim() === item.toLowerCase().trim();
  };

  const handleSelect = (item) => {
    onSelectEquipment(item);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContentContainer}>
            {/* Top Handle Indicator */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Equipment</Text>
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

            {/* Equipment Grid (2 columns) */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
            >
              {EQUIPMENT_OPTIONS.map((item, index) => {
                const selected = isEquipSelected(item);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.equipmentCard,
                      selected && styles.equipmentCardSelected,
                    ]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.8}
                  >
                    {/* Circle Icon Container */}
                    <View style={styles.iconCircle}>
                      <EquipmentIcon name={item} size={32} />
                    </View>

                    {/* Equipment Text Label */}
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
            </ScrollView>
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
    maxHeight: '85%',
    paddingTop: 12,
    paddingBottom: 24,
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
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  equipmentCard: {
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
  equipmentCardSelected: {
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
});
