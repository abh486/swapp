import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, Dimensions, StatusBar, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  logWorkoutSession,
  updateCustomWorkoutTemplate,
} from '../../redux/actions/workoutActions';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';

const { width } = Dimensions.get('window');
const WorkoutSummaryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const { sessionData, progressPhoto, progressPhotos } = route.params || {};

  // State for multiple images
  const [selectedImages, setSelectedImages] = useState(
    progressPhotos && progressPhotos.length > 0
      ? progressPhotos
      : progressPhoto
        ? [progressPhoto]
        : []
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [workoutTitle, setWorkoutTitle] = useState(
    sessionData?.workoutName || sessionData?.workoutType || 'Workout'
  );
  const [workoutNotes, setWorkoutNotes] = useState(
    sessionData?.notes || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = () => {
    if (typeof launchCamera !== 'function' || typeof launchImageLibrary !== 'function') {
      Alert.alert('Module Error', 'Native image picker functions are not loaded. Please rebuild the app.');
      return;
    }
    Alert.alert('Add Photo', 'Choose a photo for your workout summary', [
      {
        text: 'Take Photo',
        onPress: () => {
          setTimeout(() => {
            try {
              launchCamera(
                {
                  mediaType: 'photo',
                  quality: 0.8,
                  saveToPhotos: true,
                },
                response => {
                  if (response.didCancel) {
                    console.log('[handlePickImage] User cancelled camera');
                  } else if (response.errorCode) {
                    Alert.alert('Camera Error', response.errorMessage || `Error code: ${response.errorCode}`);
                  } else if (response.assets && response.assets.length > 0) {
                    setSelectedImages(prev => [...prev, response.assets[0].uri]);
                  }
                }
              );
            } catch (err) {
              Alert.alert('Camera Launch Failed', err.message || String(err));
            }
          }, 300);
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          setTimeout(() => {
            try {
              launchImageLibrary(
                {
                  mediaType: 'photo',
                  quality: 0.8,
                  selectionLimit: 5 - selectedImages.length,
                },
                response => {
                  if (response.didCancel) {
                    console.log('[handlePickImage] User cancelled gallery');
                  } else if (response.errorCode) {
                    Alert.alert('Gallery Error', response.errorMessage || `Error code: ${response.errorCode}`);
                  } else if (response.assets && response.assets.length > 0) {
                    const newUris = response.assets.map(asset => asset.uri);
                    setSelectedImages(prev => [...prev, ...newUris].slice(0, 5));
                  }
                }
              );
            } catch (err) {
              Alert.alert('Gallery Launch Failed', err.message || String(err));
            }
          }, 300);
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const formatTime = totalSeconds => {
    const mins = Math.floor(totalSeconds / 60);
    return `${mins}min`;
  };

  const handleSave = async () => {
    // 1. Immediately reset navigation back to MainTabs (0ms delay for user)
    navigation.reset({
      index: 1,
      routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
    });

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
          workoutName: workoutTitle.trim() || sessionData?.workoutName || 'Workout',
          notes: workoutNotes.trim() || null,
          imageUrl: finalImageUrl || null,
        };

        AsyncStorage.setItem('latestWorkoutData', JSON.stringify(finalData)).catch(() => {});

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
          );
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Texts */}
        <View style={styles.header}>
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
            {selectedImages.filter(uri => typeof uri === 'string' && uri.trim().length > 0).map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={[styles.cardImage, { width: width - 40 }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Dots Indicator inside the card */}
          {selectedImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {selectedImages.map((_, index) => (
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
              <View style={styles.statRow}>
                <View style={styles.statIcon}>
                  <Icon name="time-outline" size={14} color="#111" />
                </View>
                <View>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statVal}>
                    {formatTime(sessionData?.duration || 60)}
                  </Text>
                </View>
              </View>

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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 6,
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
});

export default WorkoutSummaryScreen;
