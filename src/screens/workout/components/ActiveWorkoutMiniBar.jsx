import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveWorkout } from '../../../context/ActiveWorkoutContext';

const formatTime = (totalSeconds) => {
  const s = Math.max(0, parseInt(totalSeconds, 10) || 0);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ActiveWorkoutMiniBar = ({ navigationRef, currentRouteName }) => {
  const insets = useSafeAreaInsets();
  const { activeWorkout, discardWorkout, completedSetsCount } = useActiveWorkout();

  // Pulse animation for the green indicator dot
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!activeWorkout || !activeWorkout.isActive) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [activeWorkout?.isActive, pulseAnim]);

  // Don't display if workout is not active or user is currently on the workout/summary screens
  if (!activeWorkout || !activeWorkout.isActive) return null;
  if (currentRouteName === 'FastWorkoutActive' || currentRouteName === 'WorkoutSummary') {
    return null;
  }

  // Determine bottom offset: sits right above bottom tab bar on tab screens, or above safe area on full screens
  const isTabScreen = [
    'Home',
    'Diet',
    'Workouts',
    'Feed',
    'Store',
    'MainTabs',
  ].includes(currentRouteName);

  const bottomPosition = isTabScreen
    ? (Platform.OS === 'ios' ? 84 : 76)
    : Math.max(insets.bottom + 12, 20);

  const handlePressBar = () => {
    if (navigationRef?.current) {
      navigationRef.current.navigate('FastWorkoutActive', { resumeActive: true });
    }
  };

  const handleDiscardPress = () => {
    Alert.alert(
      'Discard Workout?',
      'Are you sure you want to discard this active workout? All progress will be lost.',
      [
        { text: 'Keep Workout', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            discardWorkout();
          },
        },
      ]
    );
  };

  const exerciseCount = Array.isArray(activeWorkout.exercises)
    ? activeWorkout.exercises.length
    : 0;

  return (
    <View style={[styles.container, { bottom: bottomPosition }]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={handlePressBar}
      >
        {/* Left Glowing Indicator Dot */}
        <View style={styles.indicatorContainer}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.4],
                  outputRange: [0.6, 0.1],
                }),
              },
            ]}
          />
          <View style={styles.dot} />
        </View>

        {/* Center Workout Info */}
        <View style={styles.infoCol}>
          <Text style={styles.titleText} numberOfLines={1}>
            {activeWorkout.workoutTitle || 'Workout in Progress'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.durationText}>{formatTime(activeWorkout.seconds)}</Text>
            <Text style={styles.dotDivider}>•</Text>
            <Text style={styles.metaText}>{exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}</Text>
            <Text style={styles.dotDivider}>•</Text>
            <Text style={styles.metaText}>{completedSetsCount} {completedSetsCount === 1 ? 'set' : 'sets'}</Text>
          </View>
        </View>

        {/* Right Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.resumePill}
            onPress={handlePressBar}
            activeOpacity={0.8}
          >
            <Text style={styles.resumeText}>Resume</Text>
            <Icon name="chevron-forward" size={13} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardBtn}
            onPress={handleDiscardPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  indicatorContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  durationText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  dotDivider: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    marginHorizontal: 5,
  },
  metaText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  resumeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  discardBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActiveWorkoutMiniBar;
