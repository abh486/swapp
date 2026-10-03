import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useMemo } from 'react';
import { calculateWorkoutCalories } from '../../../utils/workoutCalorieCalculator';

const { width } = Dimensions.get('window');

export const SaveWorkoutSummaryModal = ({
  visible,
  onClose,
  progressPhotos,
  setProgressPhotos,
  currentSlide,
  setCurrentSlide,
  handlePickImage,
  visibility,
  setVisibility,
  isVisibilityModalVisible,
  setVisibilityModalVisible,
  seconds,
  formatTime,
  completedExercisesCount,
  workoutTitle,
  setWorkoutTitle,
  workoutNotes,
  setWorkoutNotes,
  volume,
  totalReps,
  calories,
  handleLogWorkout,
  isEveryExerciseCompleted,
  exercises = [],
}) => {
  const [editedSeconds, setEditedSeconds] = useState(seconds || 0);
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [tempHours, setTempHours] = useState('0');
  const [tempMinutes, setTempMinutes] = useState('0');
  const [tempSecs, setTempSecs] = useState('0');
  const [photoBoxWidth, setPhotoBoxWidth] = useState(width - 40);

  useEffect(() => {
    if (typeof seconds === 'number') {
      setEditedSeconds(seconds);
    }
  }, [seconds]);

  const displayedCalories = useMemo(() => {
    return calculateWorkoutCalories({
      duration: editedSeconds,
      exercises,
      volume,
      totalReps,
      workoutTitle,
    });
  }, [editedSeconds, exercises, volume, totalReps, workoutTitle]);

  const openTimeEditor = () => {
    const s = Math.max(0, parseInt(editedSeconds, 10) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    setTempHours(String(h));
    setTempMinutes(String(m));
    setTempSecs(String(sec));
    setIsTimeModalVisible(true);
  };

  const applyTime = () => {
    const h = parseInt(tempHours || '0', 10) || 0;
    const m = parseInt(tempMinutes || '0', 10) || 0;
    const s = parseInt(tempSecs || '0', 10) || 0;
    const total = Math.max(0, h * 3600 + m * 60 + s);
    setEditedSeconds(total);
    setIsTimeModalVisible(false);
  };

  const formatDisplayTime = totalSecs => {
    const s = Math.max(0, parseInt(totalSecs, 10) || 0);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')} Hr ${mins.toString().padStart(2, '0')} Min`;
    }
    return `${mins.toString().padStart(2, '0')} Min ${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ready To Save Workout ?</Text>
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

          <View style={styles.saveSummaryContent}>
            <View 
              style={styles.uploadPhotoBox}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && Math.abs(w - photoBoxWidth) > 1) {
                  setPhotoBoxWidth(w);
                }
              }}
            >
              {progressPhotos.length > 0 ? (
                <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1 }}
                    onScroll={(event) => {
                      const slide = Math.round(
                        event.nativeEvent.contentOffset.x /
                        (photoBoxWidth || event.nativeEvent.layoutMeasurement.width || 1)
                      );
                      if (slide !== currentSlide) {
                        setCurrentSlide(slide);
                      }
                    }}
                    scrollEventThrottle={16}
                  >
                    {progressPhotos.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={{
                          width: photoBoxWidth,
                          height: '100%',
                        }}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>

                  {progressPhotos.length > 1 && (
                    <View style={styles.dotsContainer}>
                      {progressPhotos.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            index === currentSlide && styles.activeDot,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  onPress={handlePickImage}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cameraIconCircle}
                  >
                    <Icon name="camera-outline" size={24} color="#FFF" />
                  </LinearGradient>
                  <Text style={styles.uploadPhotoText}>
                    Upload Progress Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {progressPhotos.length > 0 && (
              <View style={styles.modalThumbnailsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {progressPhotos.map((uri, index) => (
                    <View key={index} style={styles.modalThumbnailWrapper}>
                      <Image source={{ uri }} style={styles.modalThumbnailImage} />
                      <TouchableOpacity
                        style={styles.modalDeleteThumbnailBtn}
                        onPress={() => {
                          setProgressPhotos(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <Svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                          <Path d="M18 6L6 18M6 6L18 18" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {progressPhotos.length < 5 && (
                    <TouchableOpacity style={styles.modalAddThumbnailBtn} onPress={handlePickImage}>
                      <Icon name="camera-outline" size={18} color="#EE822A" />
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.visibilityRow}>
              <Text style={styles.visibilityText}>VISIBILITY </Text>
              <TouchableOpacity
                style={styles.visibilityDropdown}
                onPress={() => setVisibilityModalVisible(true)}
              >
                <Text style={styles.visibilityDropdownText}>
                  {visibility}
                </Text>
                <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 9L12 15L18 9"
                    stroke="#FFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabels}>
                <TouchableOpacity
                  style={styles.progressLabelLeftContainer}
                  onPress={openTimeEditor}
                  activeOpacity={0.7}
                >
                  <Text style={styles.progressLabelLeft}>
                    {formatDisplayTime(editedSeconds)}
                  </Text>
                  <View style={styles.editTimePencilBadge}>
                    <Icon name="pencil" size={10} color="#FFF" />
                  </View>
                </TouchableOpacity>
                <View style={styles.progressLabelRight}>
                  <Text style={styles.progressLabelRightText}>
                    {completedExercisesCount} Exercise
                  </Text>
                  <Svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginLeft: 4 }}
                  >
                    <Circle cx="12" cy="12" r="10" fill="#00FF00" />
                    <Path
                      d="M8 12L11 15L16 9"
                      stroke="#000"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: '30%' }]}
                />
              </View>
              <TextInput
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
                style={styles.progressSubLabelInput}
                placeholder="Workout Title"
                placeholderTextColor="rgba(255,255,255,0.4)"
              />
              <TextInput
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                style={[styles.progressSubLabelInput, { marginTop: 10, height: 60, textAlignVertical: 'top' }]}
                placeholder="Description / Notes"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
              />
            </View>

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{volume}</Text>
                <Text style={styles.summaryStatLabel}>
                  Total Weight (Kg)
                </Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totalReps}</Text>
                <Text style={styles.summaryStatLabel}>Total Reps</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{displayedCalories}</Text>
                <Text style={styles.summaryStatLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.logBtnContainer}>
              <TouchableOpacity
                style={[
                  styles.saveTemplateBtn,
                  isEveryExerciseCompleted === false && { opacity: 0.6 }
                ]}
                onPress={() => {
                  if (isEveryExerciseCompleted === false) {
                    Alert.alert(
                      'Complete All Exercises',
                      'Please mark all sets green for every exercise before posting your workout.'
                    );
                    return;
                  }
                  handleLogWorkout(editedSeconds, displayedCalories);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.saveTemplateBtnText}>Log Workout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isVisibilityModalVisible && (
            <View style={styles.visibilityOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => setVisibilityModalVisible(false)}
              />
              <View style={styles.visibilityPopup}>
                <Text style={styles.visibilityPopupTitle}>Visibility</Text>

                <TouchableOpacity
                  style={styles.visibilityOptionRow}
                  onPress={() => {
                    setVisibility('EVERYONE');
                    setVisibilityModalVisible(false);
                  }}
                >
                  <View style={styles.visibilityOptionTexts}>
                    <Text style={styles.visibilityOptionTitle}>
                      Everyone
                    </Text>
                    <Text style={styles.visibilityOptionDesc}>
                      This workout is publicly available to all users.
                    </Text>
                  </View>
                  {visibility === 'EVERYONE' && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke="#007BFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>

                <View style={styles.visibilityPopupDivider} />

                <TouchableOpacity
                  style={styles.visibilityOptionRow}
                  onPress={() => {
                    setVisibility('PRIVATE');
                    setVisibilityModalVisible(false);
                  }}
                >
                  <View style={styles.visibilityOptionTexts}>
                    <Text style={styles.visibilityOptionTitle}>
                      Private
                    </Text>
                    <Text style={styles.visibilityOptionDesc}>
                      Keep this workout private and visible only to you for
                      personal use.
                    </Text>
                  </View>
                  {visibility === 'PRIVATE' && (
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 6L9 17l-5-5"
                        stroke="#007BFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isTimeModalVisible && (
            <View style={styles.visibilityOverlay}>
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={() => setIsTimeModalVisible(false)}
              />
              <View style={styles.timeModalPopup}>
                <View style={styles.timeModalHeader}>
                  <Text style={styles.timeModalTitle}>Edit Workout Time</Text>
                  <TouchableOpacity
                    onPress={() => setIsTimeModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={20} color="#AAA" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputBox}>
                    <TextInput
                      style={styles.timeInputField}
                      value={tempHours}
                      onChangeText={t => setTempHours(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="0"
                      placeholderTextColor="#555"
                      selectTextOnFocus
                    />
                    <Text style={styles.timeInputLabel}>Hours</Text>
                  </View>

                  <Text style={styles.timeInputColon}>:</Text>

                  <View style={styles.timeInputBox}>
                    <TextInput
                      style={styles.timeInputField}
                      value={tempMinutes}
                      onChangeText={t => setTempMinutes(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#555"
                      selectTextOnFocus
                    />
                    <Text style={styles.timeInputLabel}>Mins</Text>
                  </View>

                  <Text style={styles.timeInputColon}>:</Text>

                  <View style={styles.timeInputBox}>
                    <TextInput
                      style={styles.timeInputField}
                      value={tempSecs}
                      onChangeText={t => setTempSecs(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#555"
                      selectTextOnFocus
                    />
                    <Text style={styles.timeInputLabel}>Secs</Text>
                  </View>
                </View>

                {/* Quick Presets */}
                <View style={styles.timePresetRow}>
                  {[
                    { label: '-5m', delta: -300 },
                    { label: '+5m', delta: 300 },
                    { label: '15m', setVal: 900 },
                    { label: '30m', setVal: 1800 },
                    { label: '45m', setVal: 2700 },
                    { label: '60m', setVal: 3600 },
                  ].map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.timePresetChip}
                      onPress={() => {
                        let cur = (parseInt(tempHours || '0', 10) * 3600) +
                                  (parseInt(tempMinutes || '0', 10) * 60) +
                                  (parseInt(tempSecs || '0', 10));
                        if (preset.setVal !== undefined) {
                          cur = preset.setVal;
                        } else if (preset.delta !== undefined) {
                          cur = Math.max(0, cur + preset.delta);
                        }
                        const h = Math.floor(cur / 3600);
                        const m = Math.floor((cur % 3600) / 60);
                        const s = cur % 60;
                        setTempHours(String(h));
                        setTempMinutes(String(m));
                        setTempSecs(String(s));
                      }}
                    >
                      <Text style={styles.timePresetChipText}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Actions */}
                <View style={styles.timeModalActions}>
                  <TouchableOpacity
                    style={styles.timeCancelBtn}
                    onPress={() => setIsTimeModalVisible(false)}
                  >
                    <Text style={styles.timeCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeSaveBtn}
                    onPress={applyTime}
                  >
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={12}
                    />
                    <Text style={styles.timeSaveBtnText}>Set Time</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  saveSummaryContent: {},
  uploadPhotoBox: {
    height: 180,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 15,
  },
  cameraIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadPhotoText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#EE822A',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalThumbnailsContainer: {
    marginBottom: 15,
  },
  modalThumbnailWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  modalThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  modalDeleteThumbnailBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    padding: 2,
  },
  modalAddThumbnailBtn: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EE822A',
    backgroundColor: 'rgba(238, 130, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  visibilityText: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  visibilityDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  visibilityDropdownText: { color: '#FFF', fontSize: 12, marginRight: 6 },
  progressContainer: { marginBottom: 20 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabelLeft: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  progressLabelRight: { flexDirection: 'row', alignItems: 'center' },
  progressLabelRightText: { color: '#888', fontSize: 12 },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: { height: '100%' },
  progressSubLabelInput: {
    backgroundColor: '#111',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  summaryStatItem: { alignItems: 'center', flex: 1 },
  summaryStatValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  summaryStatLabel: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' },
  logBtnContainer: { alignItems: 'center' },
  saveTemplateBtn: {
    height: 50,
    width: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  saveTemplateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  visibilityOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  visibilityPopup: {
    width: '85%',
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 20,
  },
  visibilityPopupTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  visibilityOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  visibilityOptionTexts: { flex: 1, marginRight: 10 },
  visibilityOptionTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  visibilityOptionDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  visibilityPopupDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  progressLabelLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 130, 42, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(238, 130, 42, 0.4)',
  },
  editTimePencilBadge: {
    marginLeft: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EE822A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalPopup: {
    width: '88%',
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  timeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timeModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeInputsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeInputBox: {
    alignItems: 'center',
  },
  timeInputField: {
    backgroundColor: '#111',
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    width: 58,
    height: 50,
    borderRadius: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeInputColon: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 8,
    paddingBottom: 16,
  },
  timeInputLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  timePresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  timePresetChip: {
    backgroundColor: '#2A2A32',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  timePresetChipText: {
    color: '#EEE',
    fontSize: 12,
    fontWeight: '600',
  },
  timeModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  timeCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2A2A32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCancelBtnText: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  timeSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  timeSaveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SaveWorkoutSummaryModal;
