import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, PanResponder, Animated, Modal, Image, Alert, TextInput
} from 'react-native';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { logWorkoutSession } from '../../redux/actions/workoutActions'; // Adjust path if needed

const FastWorkoutActiveScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  // Extract params passed from CreateFastWorkoutScreen
  const { exercises: initialExercises, duration, level } = route.params;

  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [calories, setCalories] = useState(0);
  const [volume, setVolume] = useState(0);

  // Exercises state - initialized from route params, guaranteeing unique IDs
  const [exercises, setExercises] = useState(() => {
    return (initialExercises || []).map((ex, index) => ({
      ...ex,
      id: ex.id || ex._id || ex.exerciseId || `ex-${Date.now()}-${index}`,
      sets: Array.isArray(ex.sets) ? ex.sets : []
    }));
  });

  // Image state
  const [progressPhoto, setProgressPhoto] = useState(null);

  // Modal States
  const [isSetModalVisible, setSetModalVisible] = useState(false);
  const [isSaveWorkoutModalVisible, setSaveWorkoutModalVisible] = useState(false);
  const [isVisibilityModalVisible, setVisibilityModalVisible] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState(null);
  const [visibility, setVisibility] = useState('EVERYONE');

  // Picker temporary states
  const [tempReps, setTempReps] = useState(12);
  const [tempWeight, setTempWeight] = useState(4.0);

  const stateRef = useRef({ activeExerciseId, tempReps, tempWeight });
  useEffect(() => {
    stateRef.current = { activeExerciseId, tempReps, tempWeight };
  }, [activeExerciseId, tempReps, tempWeight]);
  // Swipe to finish logic
  const pan = useRef(new Animated.ValueXY()).current;
  const swipeWidth = 250;
  const sliderWidth = 50;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > swipeWidth - sliderWidth - 20) {
          Animated.spring(pan, { toValue: { x: swipeWidth - sliderWidth, y: 0 }, useNativeDriver: false }).start();
          setTimeout(() => { setSaveWorkoutModalVisible(true); pan.setValue({ x: 0, y: 0 }); }, 300);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  // Save Set Swipe logic
  const savePan = useRef(new Animated.ValueXY()).current;
  const saveSwipeWidth = 200;
  const saveSliderWidth = 40;

  const savePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: savePan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > saveSwipeWidth - saveSliderWidth - 10) {
          Animated.spring(savePan, { toValue: { x: saveSwipeWidth - saveSliderWidth, y: 0 }, useNativeDriver: false }).start();
          setTimeout(() => { handleAddSet(); savePan.setValue({ x: 0, y: 0 }); }, 200);
        } else {
          Animated.spring(savePan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;


  // Log Workout Swipe logic
  const logPan = useRef(new Animated.ValueXY()).current;
  const logSwipeWidth = 220;
  const logSliderWidth = 50;

  const handleLogWorkout = () => {
    const sessionData = {
      level,
      duration: seconds,
      calories,
      volume,
      templateId: route.params.templateId, // Add this
      exercises: exercises.map(ex => ({
        exerciseId: ex.id,
        name: ex.name,
        sets: ex.sets
      })),
      templateExercises: exercises
        .filter(ex => ex.sets && ex.sets.some(s => s.completed))
        .map(ex => {
          const completedSets = ex.sets.filter(s => s.completed);
          return {
            id: ex.id,
            name: ex.name,
            sets: completedSets.length,
            reps: completedSets[0].reps,
            weight: completedSets[0].weight.toString()
          };
        })
    };
    // Navigate to WorkoutSummary to review, add a picture, and save
    setSaveWorkoutModalVisible(false);
    logPan.setValue({ x: 0, y: 0 });
    navigation.navigate("WorkoutSummary", { sessionData, progressPhoto });
  };

  const handleLogWorkoutRef = useRef(handleLogWorkout);
  useEffect(() => {
    handleLogWorkoutRef.current = handleLogWorkout;
  });

  const logPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: logPan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dx > logSwipeWidth - logSliderWidth - 10) {
          Animated.spring(logPan, { toValue: { x: logSwipeWidth - logSliderWidth, y: 0 }, useNativeDriver: false }).start();
          setTimeout(() => { handleLogWorkoutRef.current(); }, 300);
        } else {
          Animated.spring(logPan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
      if (seconds > 0 && seconds % 30 === 0) setCalories(c => c + 2);
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickImage = () => {
    Alert.alert(
      "Add Photo",
      "Choose a photo for your workout summary",
      [
        {
          text: "Take Photo",
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
              if (response.assets && response.assets.length > 0) {
                setProgressPhoto(response.assets[0].uri);
              }
            });
          }
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
              if (response.assets && response.assets.length > 0) {
                setProgressPhoto(response.assets[0].uri);
              }
            });
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const openAddSetModal = (exerciseId) => {
    setActiveExerciseId(exerciseId);
    setTempReps(12);
    setTempWeight(4.0);
    setSetModalVisible(true);
  };

  const handleAddSet = () => {
    const { activeExerciseId, tempReps, tempWeight } = stateRef.current;

    setExercises(prev => prev.map(ex => {
      if (ex.id === activeExerciseId) {
        return {
          ...ex,
          sets: [...(Array.isArray(ex.sets) ? ex.sets : []), { id: Date.now().toString(), reps: tempReps, weight: tempWeight, completed: false }]
        };
      }
      return ex;
    }));
    setVolume(v => v + (tempReps * tempWeight));
    setSetModalVisible(false);
  };

  const toggleSetCompletion = (exerciseId, setId) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
        };
      }
      return ex;
    }));
  };

  const activeExerciseName = exercises.find(e => e.id === activeExerciseId)?.name || '';

  const totalReps = exercises.reduce((acc, ex) => {
    const validSets = Array.isArray(ex.sets) ? ex.sets : [];
    return acc + validSets.reduce((setAcc, set) => setAcc + (set.reps || 0), 0);
  }, 0);
  const completedExercisesCount = exercises.filter(ex => Array.isArray(ex.sets) && ex.sets.length > 0).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Friday</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="10" stroke="#FFFFFF" strokeWidth="2" />
              <Polyline points="12 6 12 12 16 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.durationHeader}>
                <View style={styles.greenDot} />
                <Text style={styles.statValue}>{formatTime(seconds)}</Text>
              </View>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{volume}</Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
          </View>

          {/* Subheader */}
          <View style={styles.subHeaderRow}>
            <Text style={styles.exercisesCount}>{exercises.length} EXERCISES</Text>
            <TouchableOpacity style={styles.addExerciseBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.addExerciseText}>Add exercise +</Text>
            </TouchableOpacity>
          </View>

          {/* Exercises List */}
          {exercises.map((exercise, index) => (
            <View key={exercise.id || exercise.exerciseId || `exercise-${index}`} style={[styles.exerciseContainer, index > 0 && { marginTop: 20 }]}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseImagePlaceholder}>
                  {exercise.gifUrl ? (
                    <Image source={{ uri: exercise.gifUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderIconContainer}>
                      <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#444" strokeWidth="2" />
                        <Circle cx="8.5" cy="8.5" r="1.5" fill="#444" />
                        <Path d="M21 15l-5-5L5 21" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  )}
                </View>
                <View style={styles.exerciseHeaderTextContainer}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {(() => {
                    const validSets = Array.isArray(exercise.sets) ? exercise.sets : [];
                    const totalSets = validSets.length;
                    const completedSets = validSets.filter(s => s.completed).length;
                    
                    if (totalSets > 0 && completedSets > 0) {
                      const weightStr = (validSets[0] && validSets[0].weight) ? ` . ${validSets[0].weight}kg` : '';
                      return (
                        <Text style={[styles.exerciseSubtitle, { color: '#008000', fontWeight: '500' }]}>
                          {completedSets}/{totalSets} logged{weightStr}
                        </Text>
                      );
                    }
                    return <Text style={styles.exerciseSubtitle}>{totalSets} sets</Text>;
                  })()}
                </View>
                {(() => {
                   const validSets = Array.isArray(exercise.sets) ? exercise.sets : [];
                   const totalSets = validSets.length;
                   const completedSets = validSets.filter(s => s.completed).length;
                   const isAllCompleted = totalSets > 0 && completedSets === totalSets;

                   if (isAllCompleted) {
                     return (
                       <View style={styles.allCompletedCheckCircle}>
                         <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                           <Path d="M20 6L9 17l-5-5" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                         </Svg>
                       </View>
                     );
                   }

                   return (
                     <TouchableOpacity style={styles.moreOptionsBtn}>
                       <Svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                         <Circle cx="2" cy="2" r="2" fill="#888" />
                         <Circle cx="2" cy="8" r="2" fill="#888" />
                         <Circle cx="2" cy="14" r="2" fill="#888" />
                       </Svg>
                     </TouchableOpacity>
                   );
                })()}
              </View>

              <Text style={styles.addNoteText}>Add note...</Text>

              {(Array.isArray(exercise.sets) ? exercise.sets : []).length > 0 && (
                <View style={styles.tableHeader}>
                  <Text style={styles.colSet}>SET</Text>
                  <Text style={styles.colReps}>REPS</Text>
                  <Text style={styles.colWeight}>WEIGHT (KG)</Text>
                </View>
              )}

              {(Array.isArray(exercise.sets) ? exercise.sets : []).map((set, idx) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNumText}>{idx + 1}</Text>
                  <Text style={styles.setValText}>{set.reps}</Text>
                  <Text style={styles.setValText}>{set.weight.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={[styles.checkCircle, set.completed ? styles.checkCircleActive : null]}
                    onPress={() => toggleSetCompletion(exercise.id, set.id)}
                  >
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke={set.completed ? "#FFF" : "#888"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.exerciseFooter}>
                <TouchableOpacity style={styles.addSetBtn} onPress={() => openAddSetModal(exercise.id)}>
                  <View style={styles.addSetPlusIcon}>
                    <Svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <Path d="M12 5v14M5 12h14" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.addSetText}>ADD SET</Text>
                </TouchableOpacity>

                {(Array.isArray(exercise.sets) ? exercise.sets : []).length > 0 && (
                  <TouchableOpacity style={styles.markAllBtn}>
                    <Text style={styles.markAllText}>MARK ALL SETS</Text>
                    <View style={styles.doubleCheckCircle}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <Path d="M20 6L9 17l-5-5" stroke="#888" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Finish Button */}
        <View style={styles.floatingFinishContainer}>
          <View style={[styles.finishWorkoutBg, { width: 250 }]}>
            <Text style={styles.finishWorkoutTextBg}>FINISH WORKOUT</Text>
            <View style={styles.arrowsContainer}>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -8 }}><Path d="M9 18l6-6-6-6" stroke="#AAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -8 }}><Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
            </View>

            <Animated.View
              style={[styles.finishSwipeThumb, { transform: [{ translateX: pan.x.interpolate({ inputRange: [0, 200], outputRange: [0, 200], extrapolate: 'clamp' }) }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.finishCheckCircle}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
              </View>
            </Animated.View>
          </View>
        </View>


        {/* Add Set Modal */}
        <Modal visible={isSetModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{activeExerciseName}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSetModalVisible(false)}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6L18 18" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.pickerArea}>
                <View style={styles.pickerColumn}>
                  <Text style={styles.fadedPickerText}>{tempReps - 1}</Text>
                  <View style={styles.activePickerRow}>
                    <Text style={styles.activePickerValue}>{tempReps}</Text>
                    <Text style={styles.pickerLabel}>Reps</Text>
                  </View>
                  <Text style={styles.fadedPickerText}>{tempReps + 1}</Text>
                  <Text style={styles.fadedPickerText}>{tempReps + 2}</Text>
                  <TouchableOpacity style={styles.pickerTouchTop} onPress={() => setTempReps(r => Math.max(1, r - 1))} />
                  <TouchableOpacity style={styles.pickerTouchBottom} onPress={() => setTempReps(r => r + 1)} />
                </View>

                <View style={styles.pickerColumn}>
                  <Text style={styles.fadedPickerText}>{(tempWeight - 1.0).toFixed(1)}</Text>
                  <Text style={styles.fadedPickerText}>{(tempWeight - 0.5).toFixed(1)}</Text>
                  <View style={styles.activePickerRow}>
                    <Text style={styles.activePickerValue}>{tempWeight.toFixed(1)}</Text>
                    <Text style={styles.pickerLabel}>kg</Text>
                  </View>
                  <Text style={styles.fadedPickerText}>{(tempWeight + 0.5).toFixed(1)}</Text>
                  <Text style={styles.fadedPickerText}>{(tempWeight + 1.0).toFixed(1)}</Text>
                  <TouchableOpacity style={styles.pickerTouchTop} onPress={() => setTempWeight(w => Math.max(0, w - 0.5))} />
                  <TouchableOpacity style={styles.pickerTouchBottom} onPress={() => setTempWeight(w => w + 0.5)} />
                </View>
                <View style={styles.highlightOverlay} pointerEvents="none" />
              </View>

              <View style={styles.saveBtnContainer}>
                <View style={[styles.saveSwipeBg, { width: saveSwipeWidth }]}>
                  <Text style={styles.saveSwipeText}>SAVE</Text>
                  <View style={styles.saveArrows}>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -6 }}><Path d="M9 18l6-6-6-6" stroke="#AAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -6 }}><Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  </View>

                  <Animated.View
                    style={[styles.saveSwipeThumb, { transform: [{ translateX: savePan.x.interpolate({ inputRange: [0, 160], outputRange: [0, 160], extrapolate: 'clamp' }) }] }]}
                    {...savePanResponder.panHandlers}
                  >
                    <View style={styles.saveCheckCircle}>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    </View>
                  </Animated.View>
                </View>
              </View>

            </View>
          </View>
        </Modal>

        {/* Save Workout Summary Modal */}
        <Modal visible={isSaveWorkoutModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ready To Save Workout ?</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSaveWorkoutModalVisible(false)}>
                  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6L18 18" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                </TouchableOpacity>
              </View>

              <View style={styles.modalDivider} />

              <View style={styles.saveSummaryContent}>

                <TouchableOpacity style={styles.uploadPhotoBox} onPress={handlePickImage}>
                  {progressPhoto ? (
                    <Image source={{ uri: progressPhoto }} style={{ width: '100%', height: '100%', borderRadius: 15 }} resizeMode="cover" />
                  ) : (
                    <>
                      <View style={styles.cameraIconCircle}>
                        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <Path d="M3 8L5 5H19L21 8V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V8Z" stroke="#1E1030" strokeWidth="2" strokeLinejoin="round" fill="#D8B4E2" />
                          <Circle cx="12" cy="14" r="3" fill="#1E1030" />
                          <Path d="M16 11H18" stroke="#1E1030" strokeWidth="2" strokeLinecap="round" />
                        </Svg>
                      </View>
                      <Text style={styles.uploadPhotoText}>Upload Progress Photo</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.visibilityRow}>
                  <Text style={styles.visibilityText}>VISIBILITY </Text>
                  <TouchableOpacity style={styles.visibilityDropdown} onPress={() => setVisibilityModalVisible(true)}>
                    <Text style={styles.visibilityDropdownText}>{visibility}</Text>
                    <Svg width="10" height="10" viewBox="0 0 24 24" fill="none"><Path d="M6 9L12 15L18 9" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabelLeft}>{formatTime(seconds).replace(':', ' Min ')}</Text>
                    <View style={styles.progressLabelRight}>
                      <Text style={styles.progressLabelRightText}>{completedExercisesCount} Exercise</Text>
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4 }}>
                        <Circle cx="12" cy="12" r="10" fill="#00FF00" />
                        <Path d="M8 12L11 15L16 9" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: '30%' }]} />
                  </View>
                  <Text style={styles.progressSubLabel}>Chest</Text>
                </View>

                <View style={styles.summaryStatsRow}>
                  <View style={styles.summaryStatItem}>
                    <Text style={styles.summaryStatValue}>{volume}</Text>
                    <Text style={styles.summaryStatLabel}>Total Weight (Kg)</Text>
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
                  <View style={[styles.finishWorkoutBg, { width: logSwipeWidth }]}>
                    <Text style={styles.finishWorkoutTextBg}>LOG WORKOUT</Text>
                    <View style={styles.arrowsContainer}>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M9 18l6-6-6-6" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -8 }}><Path d="M9 18l6-6-6-6" stroke="#AAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                      <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -8 }}><Path d="M9 18l6-6-6-6" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                    </View>

                    <Animated.View
                      style={[styles.finishSwipeThumb, { transform: [{ translateX: logPan.x.interpolate({ inputRange: [0, logSwipeWidth - logSliderWidth], outputRange: [0, logSwipeWidth - logSliderWidth], extrapolate: 'clamp' }) }] }]}
                      {...logPanResponder.panHandlers}
                    >
                      <View style={styles.finishCheckCircle}>
                        <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M20 6L9 17l-5-5" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></Svg>
                      </View>
                    </Animated.View>
                  </View>
                </View>

              </View>

              {isVisibilityModalVisible && (
                <View style={styles.visibilityOverlay}>
                  <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setVisibilityModalVisible(false)} />
                  <View style={styles.visibilityPopup}>
                    <Text style={styles.visibilityPopupTitle}>Visibility</Text>
                    
                    <TouchableOpacity style={styles.visibilityOptionRow} onPress={() => { setVisibility('EVERYONE'); setVisibilityModalVisible(false); }}>
                      <View style={styles.visibilityOptionTexts}>
                        <Text style={styles.visibilityOptionTitle}>Everyone</Text>
                        <Text style={styles.visibilityOptionDesc}>This workout is publicly available to all users on Hevy.</Text>
                      </View>
                      {visibility === 'EVERYONE' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#007BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>

                    <View style={styles.visibilityPopupDivider} />

                    <TouchableOpacity style={styles.visibilityOptionRow} onPress={() => { setVisibility('PRIVATE'); setVisibilityModalVisible(false); }}>
                      <View style={styles.visibilityOptionTexts}>
                        <Text style={styles.visibilityOptionTitle}>Private</Text>
                        <Text style={styles.visibilityOptionDesc}>Keep this workout private and visible only to you for personal use.</Text>
                      </View>
                      {visibility === 'PRIVATE' && (
                        <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17l-5-5" stroke="#007BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingHorizontal: 10 },
  statItem: { alignItems: 'center' },
  durationHeader: { flexDirection: 'row', alignItems: 'center' },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FF00', marginRight: 6 },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  exercisesCount: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  addExerciseBtn: { borderWidth: 1, borderColor: '#444', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  addExerciseText: { color: '#AAA', fontSize: 13 },
  exerciseContainer: { marginBottom: 10 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  exerciseImagePlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#CCC', justifyContent: 'flex-end', alignItems: 'flex-end' },
  placeholderIconContainer: { width: 24, height: 24, backgroundColor: '#000', borderTopLeftRadius: 8, justifyContent: 'center', alignItems: 'center' },
  exerciseHeaderTextContainer: { flex: 1, marginLeft: 15 },
  exerciseName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  exerciseSubtitle: { color: '#AAA', fontSize: 13 },
  allCompletedCheckCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#008000', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  moreOptionsBtn: { padding: 10 },
  addNoteText: { color: '#888', fontSize: 14, marginBottom: 20 },
  tableHeader: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 10 },
  colSet: { flex: 1, color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  colReps: { flex: 1, color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  colWeight: { flex: 1.5, color: '#888', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 25, paddingVertical: 15, paddingHorizontal: 20, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  setNumText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  setValText: { flex: 1, color: '#FFF', fontSize: 15, textAlign: 'center' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginLeft: 'auto' },
  checkCircleActive: { backgroundColor: '#008000' },
  exerciseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingHorizontal: 5 },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  addSetPlusIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  addSetText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center' },
  markAllText: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginRight: 8 },
  doubleCheckCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  floatingFinishContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
  finishWorkoutBg: { backgroundColor: '#2A0A3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 25, borderWidth: 1, borderColor: '#3D1A54', overflow: 'hidden' },
  finishWorkoutTextBg: { color: '#FFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, position: 'absolute', zIndex: 0 },
  arrowsContainer: { position: 'absolute', right: 20, flexDirection: 'row', zIndex: 0 },
  finishSwipeThumb: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 50, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  finishCheckCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#7C3AED', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1030', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 25, paddingBottom: 40, borderWidth: 1, borderColor: '#3D1A54', borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%' },
  pickerArea: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 30, position: 'relative' },
  pickerColumn: { alignItems: 'center', width: '40%' },
  fadedPickerText: { color: 'rgba(255,255,255,0.3)', fontSize: 20, marginVertical: 8 },
  activePickerRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 12 },
  activePickerValue: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  pickerLabel: { color: '#FFF', fontSize: 18, marginLeft: 8 },
  highlightOverlay: { position: 'absolute', top: '50%', left: 20, right: 20, height: 60, marginTop: -30, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, zIndex: -1 },
  pickerTouchTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%' },
  pickerTouchBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' },
  saveBtnContainer: { alignItems: 'center', marginTop: 20 },
  saveSwipeBg: { backgroundColor: '#2D1B4E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#4A148C', overflow: 'hidden' },
  saveSwipeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, position: 'absolute', zIndex: 0 },
  saveArrows: { position: 'absolute', right: 15, flexDirection: 'row', zIndex: 0 },
  saveSwipeThumb: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  saveCheckCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#A855F7', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  saveSummaryContent: { paddingHorizontal: 20, paddingTop: 20 },
  uploadPhotoBox: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed', borderRadius: 15, height: 180, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.1)' },
  cameraIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D8B4E2', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadPhotoText: { color: '#FFF', fontSize: 14 },
  visibilityRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 },
  visibilityText: { color: '#888', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  visibilityDropdown: { flexDirection: 'row', alignItems: 'center', marginLeft: 5, borderBottomWidth: 1, borderBottomColor: '#FFF' },
  visibilityDropdownText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginRight: 4 },
  progressContainer: { marginBottom: 30 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabelLeft: { color: '#FFF', fontSize: 14 },
  progressLabelRight: { flexDirection: 'row', alignItems: 'center' },
  progressLabelRightText: { color: '#FFF', fontSize: 14 },
  progressBarTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#A855F7', borderRadius: 3 },
  progressSubLabel: { color: '#FFF', fontSize: 14 },
  summaryStatsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  summaryStatLabel: { color: '#888', fontSize: 11 },
  logBtnContainer: { alignItems: 'center', marginBottom: 10 },
  visibilityOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  visibilityPopup: { backgroundColor: '#0A0A0A', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, paddingBottom: 40, borderWidth: 1, borderColor: '#222' },
  visibilityPopupTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
  visibilityOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  visibilityOptionTexts: { flex: 1, paddingRight: 20 },
  visibilityOptionTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  visibilityOptionDesc: { color: '#888', fontSize: 13, lineHeight: 18 },
  visibilityPopupDivider: { height: 1, backgroundColor: '#222', marginVertical: 5 },
});

export default FastWorkoutActiveScreen;