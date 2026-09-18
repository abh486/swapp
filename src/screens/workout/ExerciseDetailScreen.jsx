import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import Video from 'react-native-video';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsiveMetrics } from '../../utils/responsive';
import exerciseApi from '../../redux/actions/exerciseActions';
import {
  resolveExerciseImageUri,
  resolveExerciseAnimationUri,
  getExerciseMuscleFallback
} from '../../redux/actions/workoutActions';

const isVideoMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase().trim();
  return clean.endsWith('.mp4') || clean.endsWith('.mov') || clean.endsWith('.m3u8') || clean.endsWith('.webm');
};

const isGifMedia = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.split('?')[0].toLowerCase().trim();
  return clean.endsWith('.gif');
};

const ExerciseDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exercise: initialExercise } = route.params || {};

  const { width, wp, hp, ms, sp, fs } = useResponsiveMetrics();

  const [exercise, setExercise] = useState(initialExercise || null);
  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  // Fetch full details if exerciseId is present
  useEffect(() => {
    let active = true;
    const exId = String(initialExercise?.exerciseId || initialExercise?.id || '');
    if (exId) {
      exerciseApi.getExerciseById(exId)
        .then(res => {
          if (active && res && res.data) {
            setExercise(prev => ({
              ...prev,
              ...res.data,
              videoUrl: res.data.videoUrl || prev?.videoUrl,
              imageUrl: res.data.imageUrl || prev?.imageUrl,
              gifUrl: res.data.gifUrl || prev?.gifUrl,
              instructions: res.data.instructions || prev?.instructions,
              exerciseTips: res.data.exerciseTips || prev?.exerciseTips,
              overview: res.data.overview || prev?.overview,
              variations: res.data.variations || prev?.variations,
            }));
          }
        })
        .catch(err => console.log('[ExerciseDetailScreen] Error loading exercise details:', err?.message));
    }
    return () => { active = false; };
  }, [initialExercise]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F12" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Exercise Info</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ color: '#FFFFFF', marginTop: 12 }}>Loading exercise details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 1. Playable Video stream (MP4 / MOV / M3U8)
  const playableVideoUrl = isVideoMedia(exercise?.videoUrl) ? exercise.videoUrl : null;

  // 2. Animated demonstration GIF
  const animatedGifUri =
    resolveExerciseAnimationUri(exercise) ||
    (isGifMedia(exercise?.gifUrl) ? exercise.gifUrl : null) ||
    (isGifMedia(exercise?.videoUrl) ? exercise.videoUrl : null) ||
    (exercise?.gifUrl && typeof exercise.gifUrl === 'string' && exercise.gifUrl.startsWith('http') ? exercise.gifUrl : null) ||
    null;

  // 3. Static preview frame (used when paused or as fallback)
  const staticImageUri =
    (exercise?.imageUrl && !isGifMedia(exercise.imageUrl) ? exercise.imageUrl : null) ||
    resolveExerciseImageUri(exercise) ||
    null;

  const hasRealVideo = !!playableVideoUrl && !videoError;
  const hasAnimatedGif = !!animatedGifUri && !imageError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F12" />

      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path d="M15 19L8 12L15 5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Exercise Info</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Video Player / Animated Demonstration */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => setIsPlaying(prev => !prev)}
          style={[
            styles.videoWrapper,
            { height: Math.min(width * 0.92, 380) },
            !hasRealVideo && { backgroundColor: '#FFFFFF' }
          ]}
        >
          {hasRealVideo ? (
            <Video
              ref={videoRef}
              source={{ uri: playableVideoUrl }}
              style={styles.videoPlayer}
              resizeMode="contain"
              repeat={true}
              paused={!isPlaying}
              muted={isMuted}
              playInBackground={false}
              playWhenInactive={false}
              onError={(e) => {
                console.log('[ExerciseDetailScreen] Video player error:', e);
                setVideoError(true);
              }}
            />
          ) : (
            <Image
              source={
                hasAnimatedGif
                  ? { uri: isPlaying ? animatedGifUri : (staticImageUri || animatedGifUri) }
                  : (staticImageUri ? { uri: staticImageUri } : getExerciseMuscleFallback(exercise))
              }
              style={styles.videoPlayer}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}

          {/* Media Type Badge */}
          <View style={styles.demoBadge}>
            <View style={[styles.demoDot, !isPlaying && { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.demoText}>
              {hasRealVideo ? 'VIDEO' : 'DEMO'}
            </Text>
          </View>

          {/* Video / Animation Controls */}
          {(hasRealVideo || hasAnimatedGif) && (
            <View style={styles.videoOverlay}>
              <TouchableOpacity
                style={styles.controlBadge}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
                    <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </Svg>
                ) : (
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF">
                    <Path d="M8 5v14l11-7z" />
                  </Svg>
                )}
              </TouchableOpacity>

              {hasRealVideo && (
                <TouchableOpacity
                  style={styles.controlBadge}
                  onPress={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? (
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <Path d="M11 5L6 9H2v6h4l5 4V5z" fill="#FFFFFF" />
                      <Path d="M23 9l-6 6M17 9l6 6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  ) : (
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <Path d="M11 5L6 9H2v6h4l5 4V5z" fill="#FFFFFF" />
                      <Path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Content Section */}

        {/* Content Section */}
        <View style={styles.contentBody}>
          <Text style={styles.exerciseTitle}>{exercise?.name || 'Exercise'}</Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {exercise?.targetMuscles && exercise.targetMuscles[0] ? (
              <View style={[styles.badge, styles.muscleBadge]}>
                <Text style={[styles.badgeText, styles.muscleBadgeText]}>
                  {String(exercise.targetMuscles[0]).toUpperCase()}
                </Text>
              </View>
            ) : null}

            {exercise?.equipments && exercise.equipments[0] ? (
              <View style={[styles.badge, styles.equipmentBadge]}>
                <Text style={[styles.badgeText, styles.equipmentBadgeText]}>
                  {String(exercise.equipments[0]).toUpperCase()}
                </Text>
              </View>
            ) : null}

            {exercise?.category ? (
              <View style={[styles.badge, styles.categoryBadge]}>
                <Text style={[styles.badgeText, styles.categoryBadgeText]}>
                  {String(exercise.category).toUpperCase()}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Instructions Block */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {Array.isArray(exercise?.instructions) && exercise.instructions.length > 0 ? (
              exercise.instructions.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noInstructionsText}>No step-by-step instructions available for this exercise.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F12',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F0F12',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#8E8E9A',
    fontSize: 16,
    marginBottom: 20
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 8
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F0F12',
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E24'
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1E1E24'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center'
  },
  scrollContent: {
    paddingBottom: 40
  },
  videoWrapper: {
    width: '100%',
    height: 340,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  videoPlayer: {
    width: '100%',
    height: '100%'
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  controlBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  demoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)'
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6
  },
  demoText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  exerciseTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  muscleBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)'
  },
  muscleBadgeText: {
    color: '#A78BFA'
  },
  equipmentBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  equipmentBadgeText: {
    color: '#34D399'
  },
  categoryBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)'
  },
  categoryBadgeText: {
    color: '#FBBF24'
  },
  instructionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E24',
    paddingTop: 24
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  stepNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  stepText: {
    color: '#8E8E9A',
    fontSize: 15,
    lineHeight: 22,
    flex: 1
  },
  noInstructionsText: {
    color: '#8E8E9A',
    fontSize: 14,
    fontStyle: 'italic'
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F12',
  },
  loaderText: {
    color: '#8E8E9A',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  }
});

export default ExerciseDetailScreen;
