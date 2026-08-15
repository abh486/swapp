import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

export const AddSetPickerModal = ({
  visible,
  onClose,
  activeExerciseName,
  isTimeBased,
  editingSetId,
  tempReps,
  setTempReps,
  tempWeight,
  setTempWeight,
  handleSaveSetModal,
  repsScrollRef,
  weightScrollRef,
  ITEM_HEIGHT = 44,
  SPACER_HEIGHT = 53,
  updateTempReps,
  updateTempWeight,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeExerciseName}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
            >
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#FFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          <View style={styles.pickerArea}>
            {/* Reps Column */}
            <View style={styles.pickerColumn}>
              <ScrollView
                ref={repsScrollRef}
                style={styles.wheelScrollView}
                contentContainerStyle={styles.wheelContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const index = Math.round(y / ITEM_HEIGHT);
                  const val = Math.max(0, Math.min(100, index));
                  setTempReps(val);
                }}
              >
                <View style={{ height: SPACER_HEIGHT }} />
                {Array.from({ length: 101 }, (_, i) => i).map((num) => {
                  const isActive = num === tempReps;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={styles.wheelItem}
                      activeOpacity={0.7}
                      onPress={() => updateTempReps(num)}
                    >
                      <Text style={isActive ? styles.activePickerValue : styles.fadedPickerText}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: SPACER_HEIGHT }} />
              </ScrollView>
              <Text style={styles.absolutePickerLabel}>Reps</Text>
            </View>

            {/* Weight / Time Column */}
            <View style={styles.pickerColumn}>
              <ScrollView
                ref={weightScrollRef}
                style={styles.wheelScrollView}
                contentContainerStyle={styles.wheelContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  const index = Math.round(y / ITEM_HEIGHT);
                  const val = isTimeBased
                    ? Math.max(0, index * 5)
                    : Math.max(0, index * 0.5);
                  setTempWeight(val);
                }}
              >
                <View style={{ height: SPACER_HEIGHT }} />
                {(isTimeBased
                  ? Array.from({ length: 121 }, (_, i) => i * 5)
                  : Array.from({ length: 601 }, (_, i) => i * 0.5)
                ).map((val) => {
                  const isActive = isTimeBased
                    ? Math.abs(val - tempWeight) < 0.1
                    : Math.abs(val - tempWeight) < 0.01;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={styles.wheelItem}
                      activeOpacity={0.7}
                      onPress={() => updateTempWeight(val)}
                    >
                      <Text style={isActive ? styles.activePickerValue : styles.fadedPickerText}>
                        {isTimeBased ? `${val}s` : val.toFixed(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: SPACER_HEIGHT }} />
              </ScrollView>
              <Text style={styles.absolutePickerLabelKg}>{isTimeBased ? 'sec' : 'kg'}</Text>
            </View>

            <View style={styles.highlightOverlay} pointerEvents="none" />
          </View>

          <View style={styles.saveBtnContainer}>
            <TouchableOpacity
              style={styles.gradientSaveBtn}
              activeOpacity={0.8}
              onPress={handleSaveSetModal}
            >
              <LinearGradient
                colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                style={styles.gradientSaveBtnFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.gradientSaveBtnText}>{editingSetId ? 'SAVE SET' : 'ADD SET'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  pickerArea: {
    flexDirection: 'row',
    height: 150,
    position: 'relative',
    justifyContent: 'space-around',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  wheelScrollView: {
    width: '100%',
  },
  wheelContent: {
    alignItems: 'center',
  },
  wheelItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePickerValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  fadedPickerText: {
    color: '#555',
    fontSize: 20,
  },
  absolutePickerLabel: {
    position: 'absolute',
    right: 30,
    top: 58,
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  absolutePickerLabelKg: {
    position: 'absolute',
    right: 30,
    top: 58,
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightOverlay: {
    position: 'absolute',
    top: 53,
    left: 0,
    right: 0,
    height: 44,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EE822A',
    backgroundColor: 'rgba(238, 130, 42, 0.05)',
  },
  saveBtnContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  gradientSaveBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientSaveBtnFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientSaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

export default AddSetPickerModal;
