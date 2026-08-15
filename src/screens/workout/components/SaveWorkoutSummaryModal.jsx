import React from 'react';
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
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

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
}) => {
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
            <View style={styles.uploadPhotoBox}>
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
                        event.nativeEvent.layoutMeasurement.width
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
                          width: width - 80,
                          height: 180,
                          borderRadius: 15,
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
                <Text style={styles.progressLabelLeft}>
                  {formatTime(seconds).replace(':', ' Min ')}
                </Text>
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
                <Text style={styles.summaryStatValue}>{calories}</Text>
                <Text style={styles.summaryStatLabel}>Calories</Text>
              </View>
            </View>

            <View style={styles.logBtnContainer}>
              <TouchableOpacity
                style={styles.saveTemplateBtn}
                onPress={handleLogWorkout}
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
});

export default SaveWorkoutSummaryModal;
