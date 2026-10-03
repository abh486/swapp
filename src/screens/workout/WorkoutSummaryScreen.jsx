import { GlobalLoader } from '../../components/GlobalLoader';
import PostedSuccessPopup from '../../components/PostedSuccessPopup';
import { ImageCropperModal } from '../../components/ImageCropperModal';
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, Dimensions, StatusBar, Alert, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  logWorkoutSession,
  updateCustomWorkoutTemplate,
  getCustomWorkoutTemplates,
  resolveExerciseImageUri,
  getExerciseMuscleFallback,
} from '../../redux/actions/workoutActions';
import { recordUsedExercises, recordExercisePerformance } from '../../utils/usedWorkoutsManager';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import { calculateWorkoutCalories } from '../../utils/workoutCalorieCalculator';
import { useAuth } from '../../context/AuthContext';
import { useActiveWorkout } from '../../context/ActiveWorkoutContext';

const { width } = Dimensions.get('window');
const WorkoutSummaryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { sessionData, progressPhoto, progressPhotos } = route.params || {};
  const { user } = useAuth() || {};
  const { finishWorkout } = useActiveWorkout() || {};
  const currentUid = user?.id || user?.userId || user?.user_id || sessionData?.userId;

  // State for multiple images
  const [selectedImages, setSelectedImages] = useState(
    progressPhotos && progressPhotos.length > 0
      ? progressPhotos
      : progressPhoto
        ? [progressPhoto]
        : []
  );

  const [cropperVisible, setCropperVisible] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [uploadingCropImage, setUploadingCropImage] = useState(false);

  const exerciseImages = (sessionData?.exercises || sessionData?.templateExercises || [])
    .map(ex => resolveExerciseImageUri(ex?.exercise || ex))
    .filter(Boolean);

  const displayImages = selectedImages.length > 0
    ? selectedImages
    : (exerciseImages.length > 0 ? exerciseImages : ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500']);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  const [workoutTitle, setWorkoutTitle] = useState(
    sessionData?.workoutName || sessionData?.workoutType || 'Workout'
  );
  const [workoutNotes, setWorkoutNotes] = useState(
    sessionData?.notes || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Duration & Calories consideration
  const [duration, setDuration] = useState(() => {
    if (sessionData?.duration !== undefined && sessionData?.duration !== null) {
      return Number(sessionData.duration);
    }
    return 60;
  });

  const [customCalories, setCustomCalories] = useState(null);
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [isCalorieModalVisible, setIsCalorieModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [tempHours, setTempHours] = useState('0');
  const [tempMinutes, setTempMinutes] = useState('0');
  const [tempCaloriesInput, setTempCaloriesInput] = useState('');

  const computedCalories = useMemo(() => {
    return calculateWorkoutCalories({
      duration,
      exercises: sessionData?.exercises || sessionData?.templateExercises || [],
      volume: sessionData?.volume || 0,
      totalReps: sessionData?.totalReps || 0,
      workoutTitle,
    });
  }, [duration, workoutTitle, sessionData]);

  const activeCalories = customCalories !== null
    ? customCalories
    : (sessionData?.calories && sessionData.calories > 0 && duration === sessionData.duration && workoutTitle === (sessionData.workoutName || sessionData.workoutType)
        ? sessionData.calories
        : computedCalories);

  const openTimeEditor = () => {
    const s = Math.max(0, parseInt(duration, 10) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    setTempHours(String(h));
    setTempMinutes(String(m));
    setIsTimeModalVisible(true);
  };

  const applyTime = () => {
    const h = parseInt(tempHours || '0', 10) || 0;
    const m = parseInt(tempMinutes || '0', 10) || 0;
    const totalSecs = Math.max(0, h * 3600 + m * 60);
    setDuration(totalSecs);
    setCustomCalories(null); // allow auto-recalculation
    setIsTimeModalVisible(false);
  };

  const openCalorieEditor = () => {
    setTempCaloriesInput(String(activeCalories));
    setIsCalorieModalVisible(true);
  };

  const applyCalories = () => {
    const val = parseInt(tempCaloriesInput, 10);
    if (!isNaN(val) && val >= 0) {
      setCustomCalories(val);
    }
    setIsCalorieModalVisible(false);
  };

  const openImagePicker = (type = 'library') => {
    if (typeof launchCamera !== 'function' || typeof launchImageLibrary !== 'function') {
      Alert.alert('Module Error', 'Native image picker functions are not loaded. Please rebuild the app.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.9,
      saveToPhotos: true,
      selectionLimit: 1,
    };

    const handlePickerResponse = response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Image Error', response.errorMessage || `Error code: ${response.errorCode}`);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setPhotoToCrop(response.assets[0]);
        setCropperVisible(true);
      }
    };

    if (type === 'camera') {
      try {
        launchCamera(options, handlePickerResponse);
      } catch (err) {
        Alert.alert('Camera Launch Failed', err.message || String(err));
      }
    } else {
      try {
        launchImageLibrary(options, handlePickerResponse);
      } catch (err) {
        Alert.alert('Gallery Launch Failed', err.message || String(err));
      }
    }
  };

  const handlePickImage = () => {
    if (selectedImages.length >= 5) {
      Alert.alert('Photo Limit Reached', 'You can attach up to 5 photos per workout.');
      return;
    }

    Alert.alert('Add Photo', 'Choose a photo for your workout summary', [
      {
        text: 'Take Photo',
        onPress: () => setTimeout(() => openImagePicker('camera'), 200),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => setTimeout(() => openImagePicker('library'), 200),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const handleCropComplete = async ({ cropOptions }) => {
    if (!photoToCrop) return;
    setUploadingCropImage(true);
    try {
      const uploadedUrl = await uploadToCloudinary(photoToCrop, cropOptions);
      setSelectedImages(prev => [...prev, uploadedUrl].slice(0, 5));
      setCropperVisible(false);
      setPhotoToCrop(null);
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload the cropped image. Please try again.');
    } finally {
      setUploadingCropImage(false);
    }
  };

  const formatTime = totalSeconds => {
    const s = Math.max(0, parseInt(totalSeconds, 10) || 0);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}min`;
  };

  const handleSave = async () => {
    // 1. Show celebratory Posted Success pop up 🎉
    setIsSuccessModalVisible(true);

    // 2. Perform background uploading, caching, and dispatching unblocked
    setTimeout(async () => {
      try {
        let finalImageUrl = '';

        const validImages = selectedImages;
        if (validImages.length > 0) {
          const uploadPromises = validImages.map(async (imageUri) => {
            if (imageUri.startsWith('http')) {
              return imageUri;
            }
            const imageObj = { uri: imageUri };
            return await uploadToCloudinary(imageObj);
          });

          const uploadedUrls = await Promise.all(uploadPromises);
          const validUrls = uploadedUrls.filter(Boolean);
          finalImageUrl = JSON.stringify(validUrls);
        }

        const finalData = {
          ...sessionData,
          duration,
          calories: activeCalories,
          workoutName: workoutTitle.trim() || sessionData?.workoutName || 'Workout',
          notes: workoutNotes.trim() || null,
          imageUrl: finalImageUrl || null,
        };

        if (currentUid) {
          AsyncStorage.setItem(`latestWorkoutData_${currentUid}`, JSON.stringify(finalData)).catch(() => { });
        }

        recordUsedExercises(finalData.exercises || finalData.templateExercises || []);
        recordExercisePerformance(finalData.exercises || finalData.templateExercises || []);
        dispatch(logWorkoutSession(finalData));

        if (
          sessionData?.templateId &&
          sessionData?.templateExercises &&
          sessionData.templateExercises.length > 0
        ) {
          dispatch(
            updateCustomWorkoutTemplate(
              sessionData.templateId,
              sessionData.templateExercises,
            ),
          ).then(() => {
            dispatch(getCustomWorkoutTemplates()).then(backendFolders => {
              if (backendFolders && currentUid) {
                AsyncStorage.setItem(`@cached_custom_workout_folders_${currentUid}`, JSON.stringify(backendFolders)).catch(() => { });
              }
            }).catch(() => { });
          }).catch(() => { });
        }
      } catch (error) {
        console.error('Error saving background workout log:', error);
      }
    }, 50);
  };

  const totalSets =
    sessionData?.exercises?.reduce(
      (acc, ex) => acc + (ex.sets?.length || 0),
      0,
    ) || 0;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Texts */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Share Your Workout</Text>
          <Text style={styles.subtitle}>
            Nice work! Let's keep the momentum going.
          </Text>
        </View>

        {/* Polaroid/Card */}
        <View style={styles.cardContainer}>
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
            {displayImages.filter(uri => typeof uri === 'string' && uri.trim().length > 0).map((uri, index) => {
              const currentEx = (sessionData?.exercises || sessionData?.templateExercises || [])[index] || {};
              const isFailed = Boolean(failedImages[uri]);
              const imageSource = !isFailed
                ? { uri }
                : getExerciseMuscleFallback(currentEx);

              return (
                <Image
                  key={index}
                  source={imageSource}
                  onError={() => {
                    if (uri && uri.startsWith('http')) {
                      setFailedImages(prev => ({ ...prev, [uri]: true }));
                    }
                  }}
                  style={[styles.cardImage, { width: width - 40 }]}
                  resizeMode="cover"
                />
              );
            })}
          </ScrollView>

          {/* Dots Indicator inside the card */}
          {displayImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {displayImages.map((_, index) => (
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

          <View style={styles.overlay} />

          <Text style={styles.cardDate}>
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.cardBottomSection}>
            <Text style={styles.cardTitle}>{workoutTitle || 'Workout'}{'\n'}Complete!</Text>

            <View style={styles.statsContainer}>
              <TouchableOpacity
                style={styles.statRow}
                onPress={openTimeEditor}
                activeOpacity={0.7}
              >
                <View style={styles.statIcon}>
                  <Icon name="time-outline" size={14} color="#111" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={styles.statLabel}>DURATION</Text>
                    <Icon name="pencil" size={8} color="#666" />
                  </View>
                  <Text style={styles.statVal}>
                    {formatTime(duration)}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Icon name="barbell-outline" size={14} color="#111" />
                </View>
                <View>
                  <Text style={styles.statLabel}>VOLUME</Text>
                  <Text style={styles.statVal}>
                    {sessionData?.volume || 0} kg
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Icon name="list-outline" size={14} color="#111" />
                </View>
                <View>
                  <Text style={styles.statLabel}>SETS</Text>
                  <Text style={styles.statVal}>{totalSets || 3}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.statRow}
                onPress={openCalorieEditor}
                activeOpacity={0.7}
              >
                <View style={styles.statIcon}>
                  <Icon name="flame-outline" size={14} color="#111" />
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Text style={styles.statLabel}>CALORIES</Text>
                    <Icon name="pencil" size={8} color="#666" />
                  </View>
                  <Text style={styles.statVal}>
                    {activeCalories} kcal
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.usernameText}>@workout_complete</Text>
          </View>
        </View>

        {/* Thumbnail row below polaroid */}
        <View style={styles.thumbnailsContainer}>
          <Text style={styles.sectionTitle}>Workout Photos ({selectedImages.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsScroll}>
            {selectedImages.map((uri, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.deleteThumbnailBtn}
                  onPress={() => {
                    setSelectedImages(prev => prev.filter((_, i) => i !== index));
                  }}
                >
                  <Icon name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}

            {selectedImages.length > 0 && selectedImages.length < 5 && (
              <TouchableOpacity style={styles.addThumbnailBtn} onPress={handlePickImage}>
                <Icon name="camera-outline" size={22} color="#8E8E93" />
                <Text style={styles.addThumbnailText}>Add</Text>
              </TouchableOpacity>
            )}

            {selectedImages.length === 0 && (
              <TouchableOpacity style={styles.addFirstPhotoBtn} onPress={handlePickImage}>
                <Icon name="camera-outline" size={24} color="#5E5CE6" />
                <Text style={styles.addFirstPhotoText}>Add Photos</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Workout Title Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Workout Title</Text>
          <TextInput
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
            placeholder="e.g. Chest & Triceps, Leg Day..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.textInput}
          />
        </View>

        {/* Description / Notes Input */}
        <View style={[styles.inputContainer, { marginTop: 15 }]}>
          <Text style={styles.inputLabel}>Description / Notes</Text>
          <TextInput
            value={workoutNotes}
            onChangeText={setWorkoutNotes}
            placeholder="e.g. Felt strong today, pushed harder on bench..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
          />
        </View>

        {/* Share To */}
        <Text style={styles.shareToTitle}>Share to</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shareRow}
        >
          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  stroke="#222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>whatsapp</Text>
          </View>

          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  ry="5"
                  stroke="#222"
                  strokeWidth="2"
                />
                <Circle cx="12" cy="12" r="4" stroke="#222" strokeWidth="2" />
                <Circle cx="18" cy="6" r="1" fill="#222" />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>Instagram</Text>
          </View>

          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                  stroke="#222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>Facebook</Text>
          </View>

          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                  stroke="#222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>Twitter</Text>
          </View>

          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  stroke="#222"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>Save to Gallery</Text>
          </View>

          <View style={styles.shareItem}>
            <View style={styles.shareBox}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="1.5" stroke="#222" strokeWidth="2" />
                <Circle cx="19" cy="12" r="1.5" stroke="#222" strokeWidth="2" />
                <Circle cx="5" cy="12" r="1.5" stroke="#222" strokeWidth="2" />
              </Svg>
            </View>
            <Text style={styles.shareLabel}>More</Text>
          </View>
        </ScrollView>
      </ScrollView>

      {/* Done Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <GlobalLoader size={30} />
          ) : (
            <Text style={styles.doneBtnText}>DONE</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Time Editor Modal */}
      <Modal
        visible={isTimeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsTimeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.timeEditorCard}>
                <Text style={styles.timeModalTitle}>Edit Workout Time</Text>
                <Text style={styles.timeModalSubtitle}>Adjust duration; calories will auto-recalculate</Text>

                <View style={styles.timeInputsRow}>
                  <View style={styles.timeInputCol}>
                    <TextInput
                      style={styles.timeInputBox}
                      value={tempHours}
                      onChangeText={setTempHours}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeInputLabel}>Hours</Text>
                  </View>
                  <Text style={styles.timeInputColon}>:</Text>
                  <View style={styles.timeInputCol}>
                    <TextInput
                      style={styles.timeInputBox}
                      value={tempMinutes}
                      onChangeText={setTempMinutes}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.timeInputLabel}>Minutes</Text>
                  </View>
                </View>

                {/* Quick Presets */}
                <View style={styles.quickChipsRow}>
                  {[15, 30, 45, 60, 90].map(mins => (
                    <TouchableOpacity
                      key={mins}
                      style={styles.quickChip}
                      onPress={() => {
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        setTempHours(String(h));
                        setTempMinutes(String(m));
                      }}
                    >
                      <Text style={styles.quickChipText}>{mins}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setIsTimeModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={applyTime}
                  >
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={12}
                    />
                    <Text style={styles.modalSaveText}>Apply Time</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Calorie Editor Modal */}
      <Modal
        visible={isCalorieModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCalorieModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCalorieModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.timeEditorCard}>
                <Text style={styles.timeModalTitle}>Adjust Calories</Text>
                <Text style={styles.timeModalSubtitle}>Estimated based on time ({formatTime(duration)}) and workout</Text>

                <View style={[styles.timeInputsRow, { marginVertical: 15 }]}>
                  <View style={[styles.timeInputCol, { width: 140 }]}>
                    <TextInput
                      style={[styles.timeInputBox, { width: 140, fontSize: 24 }]}
                      value={tempCaloriesInput}
                      onChangeText={setTempCaloriesInput}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                    <Text style={styles.timeInputLabel}>kcal</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.autoCalcBtn}
                  onPress={() => {
                    setTempCaloriesInput(String(computedCalories));
                    setCustomCalories(null);
                  }}
                >
                  <Icon name="refresh" size={14} color="#EE822A" style={{ marginRight: 6 }} />
                  <Text style={styles.autoCalcText}>Reset to Auto ({computedCalories} kcal)</Text>
                </TouchableOpacity>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setIsCalorieModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={applyCalories}
                  >
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={12}
                    />
                    <Text style={styles.modalSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Posted Success Pop Up 🎉 (Automatically vanishes after 3 seconds) */}
      <PostedSuccessPopup
        visible={isSuccessModalVisible}
        title="Posted Successfully! 🎉"
        message={`Your workout "${workoutTitle}" has been shared!`}
        duration={3000}
        onDismiss={() => {
          setIsSuccessModalVisible(false);
          finishWorkout?.();
          try {
            navigation.reset({
              index: 1,
              routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
            });
          } catch (e) {
            navigation.navigate('Workouts');
          }
        }}
      />

      {/* Image Cropper Modal */}
      <ImageCropperModal
        visible={cropperVisible}
        image={photoToCrop}
        onClose={() => {
          if (!uploadingCropImage) {
            setCropperVisible(false);
            setPhotoToCrop(null);
          }
        }}
        onCrop={handleCropComplete}
        onPickAnother={handlePickImage}
        isUploading={uploadingCropImage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  header: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 20,
    paddingHorizontal: 48,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: -2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    textAlign: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  cardContainer: {
    width: width - 40,
    height: width * 1.15,
    alignSelf: 'center',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#FFF',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#1C1C1E',
  },
  cardImage: {
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardDate: {
    position: 'absolute',
    top: 20,
    right: 20,
    color: '#CCC',
    fontSize: 14,
    fontWeight: '600',
  },
  cardBottomSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    lineHeight: 36,
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 10,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    color: '#AAA',
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  statVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  usernameText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 10,
  },
  dotsContainer: {
    position: 'absolute',
    top: 24,
    left: 20,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    backgroundColor: '#5E5CE6',
  },
  thumbnailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 10,
  },
  thumbnailsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  deleteThumbnailBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addThumbnailBtn: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  addThumbnailText: {
    color: '#8E8E93',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  addFirstPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5E5CE6',
    backgroundColor: 'rgba(94, 92, 230, 0.1)',
  },
  addFirstPhotoText: {
    color: '#5E5CE6',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  inputLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  shareToTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginLeft: 20,
    marginBottom: 15,
  },
  shareRow: {
    paddingHorizontal: 20,
  },
  shareItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  shareBox: {
    width: 60,
    height: 60,
    backgroundColor: '#1C1C1E',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    color: '#AAA',
    fontSize: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  doneBtn: {
    backgroundColor: '#5E5CE6',
    width: 220,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    fontFamily: 'BRLNSR',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timeEditorCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timeModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
    marginBottom: 4,
    textAlign: 'center',
  },
  timeModalSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  timeInputCol: {
    alignItems: 'center',
  },
  timeInputBox: {
    width: 75,
    height: 56,
    backgroundColor: '#121214',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeInputColon: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  timeInputLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  autoCalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 130, 42, 0.1)',
    marginVertical: 6,
  },
  autoCalcText: {
    color: '#EE822A',
    fontSize: 12,
    fontWeight: '600',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#EE822A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EE822A',
  },
  successTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#121214',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 22,
  },
  successStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  successStatVal: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  successStatLbl: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  successStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  viewInCommunityBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  viewInCommunityBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneDismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  doneDismissBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WorkoutSummaryScreen;
