import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const SwipeableSetRow = ({
  set,
  idx,
  exercise,
  isTimeBasedExercise,
  activeTimerSetIds,
  setActiveTimerSetIds,
  toggleSetCompletion,
  onDeleteSet,
  openEditSetModal,
}) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const isSwipedOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newX = gestureState.dx;
        if (isSwipedOpen.current) {
          newX = -70 + gestureState.dx;
        }
        if (newX > 0) newX = 0;
        if (newX < -100) newX = -100;
        swipeAnim.setValue(newX);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -30) {
          Animated.spring(swipeAnim, {
            toValue: -70,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = true;
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          isSwipedOpen.current = false;
        }
      },
    })
  ).current;

  const closeRow = () => {
    Animated.spring(swipeAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    isSwipedOpen.current = false;
  };

  return (
    <View style={styles.swipeRowWrapper}>
      <TouchableOpacity
        style={styles.deleteSetActionBtn}
        onPress={() => {
          closeRow();
          onDeleteSet(set.id);
        }}
      >
        <Text style={styles.deleteSetActionText}>Delete</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.setRow,
          {
            transform: [{ translateX: swipeAnim }],
            marginBottom: 0,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.setNumText}>{idx + 1}</Text>
        <Text style={styles.setPrevText}>
          {(() => {
            const prevReps = exercise.reps !== undefined && exercise.reps !== null ? Number(exercise.reps) : 0;
            const prevWeight = exercise.weight !== undefined && exercise.weight !== null ? parseFloat(exercise.weight) || 0 : 0;
            if (prevReps === 0 && prevWeight === 0) return '—';
            if (isTimeBasedExercise(exercise)) {
              return `${prevWeight}s`;
            }
            return `${prevWeight}kg x ${prevReps}`;
          })()}
        </Text>

        {/* Touchable Reps Picker Input */}
        <TouchableOpacity
          style={[styles.setInputField, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
          onPress={() => openEditSetModal && openEditSetModal(exercise.id, set.id, set.reps, set.weight)}
          activeOpacity={0.7}
        >
          <Text style={{ color: set.reps !== undefined && set.reps !== 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>
            {set.reps !== undefined && set.reps !== 0 ? set.reps.toString() : '0'}
          </Text>
        </TouchableOpacity>

        {isTimeBasedExercise(exercise) ? (
          <View style={styles.timerContainer}>
            <TouchableOpacity
              onPress={() => {
                const isRunning = activeTimerSetIds.includes(set.id);
                if (isRunning) {
                  setActiveTimerSetIds(prev => prev.filter(id => id !== set.id));
                } else {
                  setActiveTimerSetIds(prev => [...prev, set.id]);
                }
              }}
              style={styles.playButton}
            >
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                {activeTimerSetIds.includes(set.id) ? (
                  <>
                    <Circle cx="12" cy="12" r="10" stroke="#EE822A" strokeWidth="2" />
                    <Rect x="9" y="8" width="2" height="8" fill="#EE822A" rx="1" />
                    <Rect x="13" y="8" width="2" height="8" fill="#EE822A" rx="1" />
                  </>
                ) : (
                  <>
                    <Circle cx="12" cy="12" r="10" stroke="#EE822A" strokeWidth="2" />
                    <Path d="M10 8l6 4-6 4V8z" fill="#EE822A" />
                  </>
                )}
              </Svg>
            </TouchableOpacity>
            <Text style={styles.timerText}>
              {(() => {
                const totalSeconds = parseInt(set.weight) || 0;
                const mins = Math.floor(totalSeconds / 60);
                const secs = totalSeconds % 60;
                return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
              })()}
            </Text>
          </View>
        ) : (
          /* Touchable Weight Picker Input */
          <TouchableOpacity
            style={[styles.setInputField, { flex: 1.5, justifyContent: 'center', alignItems: 'center' }]}
            onPress={() => openEditSetModal && openEditSetModal(exercise.id, set.id, set.reps, set.weight)}
            activeOpacity={0.7}
          >
            <Text style={{ color: set.weight !== undefined && parseFloat(set.weight) !== 0 ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>
              {set.weight !== undefined && parseFloat(set.weight) !== 0 ? set.weight.toString() : '0.0'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.checkCircle,
            set.completed ? styles.checkCircleActive : null,
          ]}
          onPress={() => toggleSetCompletion(exercise.id, set.id)}
        >
          <Svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M20 6L9 17l-5-5"
              stroke={set.completed ? '#FFF' : '#888'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeRowWrapper: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 25,
    overflow: 'hidden',
  },
  deleteSetActionBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteSetActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  setNumText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  setPrevText: {
    flex: 2,
    color: '#8E8E9A',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  setInputField: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 8,
  },
  timerContainer: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    marginRight: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  checkCircleActive: { backgroundColor: '#008000' },
});

export default SwipeableSetRow;
