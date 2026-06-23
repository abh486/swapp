import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ScrollView, Dimensions, StatusBar, Alert } from 'react-native';
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

  const { sessionData, progressPhoto } = route.params || {};
  // Use a fallback image if no progress photo is provided to match the mockup aesthetic
  const [selectedImage, setSelectedImage] = useState(
    progressPhoto ||
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
  );

  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = () => {
    console.log('[WorkoutSummaryScreen] handlePickImage triggered');
    if (typeof launchCamera !== 'function' || typeof launchImageLibrary !== 'function') {
      Alert.alert('Module Error', 'Native image picker functions are not loaded. Please ensure npm install and pod install were run, and the app was completely rebuilt.');
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
                    setSelectedImage(response.assets[0].uri);
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
                  selectionLimit: 1,
                },
                response => {
                  if (response.didCancel) {
                    console.log('[handlePickImage] User cancelled gallery');
                  } else if (response.errorCode) {
                    Alert.alert('Gallery Error', response.errorMessage || `Error code: ${response.errorCode}`);
                  } else if (response.assets && response.assets.length > 0) {
                    setSelectedImage(response.assets[0].uri);
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
    setIsSaving(true);
    try {
      let finalImageUrl =
        typeof selectedImage === 'string' ? selectedImage : selectedImage?.uri;

      // If the image is a local URI from device (e.g. file:// or content://), upload it to Cloudinary
      if (selectedImage) {
        let isLocal = false;
        let imageObj = null;

        if (typeof selectedImage === 'string') {
          if (!selectedImage.startsWith('http')) {
            isLocal = true;
            imageObj = { uri: selectedImage };
          }
        } else if (selectedImage.uri && !selectedImage.uri.startsWith('http')) {
          isLocal = true;
          imageObj = selectedImage;
        }

        if (isLocal && imageObj) {
          const uploadedUrl = await uploadToCloudinary(imageObj);
          if (uploadedUrl) {
            finalImageUrl = uploadedUrl;
          }
        }
      }

      // Include imageUrl in sessionData for the community post
      const finalData = { ...sessionData, imageUrl: finalImageUrl };

      // Save to AsyncStorage as a fallback
      try {
        await AsyncStorage.setItem(
          'latestWorkoutData',
          JSON.stringify(finalData),
        );
      } catch (e) {
        console.error('Error saving fallback data:', e);
      }

      // Dispatch the workout log action
      dispatch(logWorkoutSession(finalData));

      // If this was from a custom template, update the template with completed exercises
      if (
        sessionData.templateId &&
        sessionData.templateExercises &&
        sessionData.templateExercises.length > 0
      ) {
        try {
          await dispatch(
            updateCustomWorkoutTemplate(
              sessionData.templateId,
              sessionData.templateExercises,
            ),
          );
        } catch (err) {
          console.error('Failed to update custom template:', err);
        }
      }

      navigation.reset({
        index: 1,
        routes: [{ name: 'MainTabs' }, { name: 'Workouts' }],
      });
    } catch (error) {
      console.error('Error saving workout:', error);
    } finally {
      setIsSaving(false);
    }
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
            Nice work ! Lets keep the momentum going .
          </Text>
        </View>

        {/* Polaroid/Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={handlePickImage} activeOpacity={0.9}>
          <Image
            source={{
              uri:
                typeof selectedImage === 'string'
                  ? selectedImage
                  : selectedImage?.uri,
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          <View style={styles.overlay} />

          <Text style={styles.cardDate}>
            {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.cardBottomSection}>
            <Text style={styles.cardTitle}>Workout{'\n'}Complete !</Text>

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

            <Text style={styles.usernameText}>@username</Text>
          </View>

          {/* Edit Badge */}
          <View style={styles.cardEditBadge}>
            <Icon name="camera" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>

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
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  title: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 14,
  },
  cardContainer: {
    width: width - 40,
    height: width * 1.15, // Aspect ratio to match the portrait card
    alignSelf: 'center',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#FFF',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 40,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Darken image so text pops out
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
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: 'bold',
    lineHeight: 40,
    marginBottom: 20,
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
  shareToTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
    backgroundColor: '#888',
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
    backgroundColor: '#2A0042', // Dark purple from the image
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
  },
  cardEditBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default WorkoutSummaryScreen;
