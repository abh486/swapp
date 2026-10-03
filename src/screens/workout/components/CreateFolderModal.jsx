import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Pressable,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  FadeInDown,
  ZoomIn,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsiveMetrics } from '../../../utils/responsive';

const LevelIcon = ({ fillCount, selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="14" width="4" height="6" rx="1.5" fill={fillCount >= 1 ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} />
    <Rect x="10" y="10" width="4" height="10" rx="1.5" fill={fillCount >= 2 ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} />
    <Rect x="16" y="6" width="4" height="14" rx="1.5" fill={fillCount >= 3 ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} />
  </Svg>
);

const FlexArmIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.5 7.5c.3-1.6 1.4-2.8 2.7-3.3 1-.4 2.1-.2 2.9.4.8.6 1.2 1.5 1.2 2.6V8c1.3.4 2.3 1.5 2.5 2.8.2 1.4-.4 2.7-1.4 3.5-.8.6-1.8.8-2.7.7-.6 1-1.6 1.7-2.8 1.9-1.2.2-2.3-.2-3.1-1.1L5.5 14c-.6-.6-1-1.4-1.2-2.2-.2-1 .1-2 .7-2.8l1.5-1.5c1-1 2.6-1 3.6 0l1.4 1.4c-.6.6-1 .9-1.5.9-.6 0-1-.4-1-.8V7.5z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StrengthIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 19h20M5 19v-5h14v5M6 10h12M12 10v4M4 7h16M2 7v3M22 7v3"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WeightScaleIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="3" stroke="#FFFFFF" strokeWidth="2" />
    <Circle cx="12" cy="10" r="3" stroke="#FFFFFF" strokeWidth="2" />
    <Path d="M12 10l2-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const GymIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 3h12M6 3v18M18 3v18M6 8h12M12 8v10M10 18h4"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DumbbellIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 8H4v8h2V8zm12 0h-2v8h2V8zM6 12h12M3 10h1v4H3v-4zm17 0h1v4h-1v-4z"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StandingPersonIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="2.5" stroke="#FFFFFF" strokeWidth="2" />
    <Path
      d="M12 7.5v7.5M9 9h6M10.5 15v5M13.5 15v5"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const DurationClockIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" />
    <Path d="M12 7V12L15 13.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const CustomDurationIcon = ({ selected }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="13" r="7" stroke="#FFFFFF" strokeWidth="2" />
    <Path d="M12 3V6M9 3H15M12 10V13H15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const DURATION_OPTIONS = Array.from({ length: 34 }, (_, i) => 15 + i * 5); // 15 to 180 minutes

// Reanimated Input Component with per-character Top-to-Bottom (FadeInDown) typing animations
const AnimatedTextInputField = ({ value, onChangeText, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusScale = useSharedValue(1);
  const typingPulse = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value * typingPulse.value }],
  }));

  const handleFocus = () => {
    setIsFocused(true);
    focusScale.value = withSpring(1.015, { damping: 14, stiffness: 180 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    focusScale.value = withSpring(1, { damping: 14, stiffness: 180 });
  };

  const handleChangeText = (text) => {
    onChangeText(text);
    typingPulse.value = withSequence(
      withTiming(1.015, { duration: 40 }),
      withTiming(1, { duration: 80 })
    );
  };

  return (
    <Animated.View
      style={[
        styles.folderInputWrapper,
        isFocused && styles.folderInputWrapperFocused,
        containerStyle,
      ]}
    >
      <TextInput
        style={styles.folderTextInput}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.3)"
        value={value}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selectionColor="rgba(255, 255, 255, 0.6)"
      />

      {value.length > 0 && (
        <Animated.View entering={ZoomIn.duration(200).springify()} style={styles.inputCheckBadge}>
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}
    </Animated.View>
  );
};

// Reanimated Filter Card with spring gesture scaling & timing opacity transition
const ReanimatedCard = ({ selected, onPress, children }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(selected ? 1 : 0, { duration: 250 });
  }, [selected, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.93, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.filterCard,
          selected && styles.filterCardSelected,
          animatedStyle,
        ]}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'rgba(143, 93, 152, 0.15)', 'rgba(46, 77, 159, 0.15)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={18}
          />
        </Animated.View>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Reanimated Create Folder Button with validation pop spring & gesture scale animations
const ReanimatedCreateButton = ({ isValid, onPress }) => {
  const scale = useSharedValue(1);
  const validAnim = useSharedValue(isValid ? 1 : 0);

  useEffect(() => {
    if (isValid) {
      validAnim.value = withTiming(1, { duration: 250 });
      scale.value = withSequence(
        withSpring(1.05, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 12, stiffness: 180 })
      );
    } else {
      validAnim.value = withTiming(0, { duration: 250 });
    }
  }, [isValid, validAnim, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientOverlayStyle = useAnimatedStyle(() => ({
    opacity: validAnim.value,
  }));

  const handlePressIn = () => {
    if (!isValid) return;
    scale.value = withSpring(0.93, { damping: 15, stiffness: 220 });
  };

  const handlePressOut = () => {
    if (!isValid) return;
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  return (
    <Animated.View entering={FadeInDown.delay(380).duration(400).springify().stiffness(180)}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isValid}
        style={{ width: '100%' }}
      >
        <Animated.View style={[styles.modalCreateButton, !isValid && { backgroundColor: 'rgba(255,255,255,0.08)' }, animatedStyle]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, gradientOverlayStyle]} pointerEvents="none">
            <LinearGradient
              colors={['#EE822A', '#8F5D98', '#2E4D9F']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={[styles.modalCreateButtonText, !isValid && { color: 'rgba(255,255,255,0.3)' }]}>
              Create Folder
            </Text>
            {isValid && (
              <Animated.View entering={ZoomIn.duration(200).springify()}>
                <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M12 5l7 7-7 7" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const CreateFolderModal = ({ visible, onClose, onCreateFolder }) => {
  const { hp } = useResponsiveMetrics();

  const [folderName, setFolderName] = useState('');
  const [folderLevel, setFolderLevel] = useState('');
  const [folderGoal, setFolderGoal] = useState('');
  const [folderEquipment, setFolderEquipment] = useState('');
  const [folderDuration, setFolderDuration] = useState('');
  const [folderCustomDuration, setFolderCustomDuration] = useState('');

  const flatListRef = useRef(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setFolderName('');
      setFolderLevel('');
      setFolderGoal('');
      setFolderEquipment('');
      setFolderDuration('');
      setFolderCustomDuration('');
      setIsKeyboardVisible(false);
    }
  }, [visible]);

  const selectCustomDuration = (val) => {
    const numeric = parseInt(val) || 45;
    const clampedVal = Math.max(15, Math.min(180, Math.round(numeric / 5) * 5));
    setFolderCustomDuration(String(clampedVal));
    const index = DURATION_OPTIONS.indexOf(clampedVal);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current?.scrollToOffset({ offset: index * 40, animated: true });
    }
  };

  const handleStepDuration = (delta) => {
    const current = parseInt(folderCustomDuration) || 45;
    selectCustomDuration(current + delta);
  };

  useEffect(() => {
    if (folderDuration === 'Custom') {
      const val = parseInt(folderCustomDuration) || 45;
      const index = DURATION_OPTIONS.indexOf(val);
      if (index !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: index * 40, animated: false });
        }, 60);
      }
    }
  }, [folderDuration]);

  const onScrollEnd = (e) => {
    const yOffset = e.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / 40);
    const clampedIndex = Math.max(0, Math.min(index, DURATION_OPTIONS.length - 1));
    const selectedVal = DURATION_OPTIONS[clampedIndex];
    if (selectedVal) {
      setFolderCustomDuration(String(selectedVal));
    }
  };

  const isFolderFormValid =
    folderName.trim() !== '' &&
    folderLevel !== '' &&
    folderGoal !== '' &&
    folderEquipment !== '' &&
    (folderDuration === 'Custom' ? folderCustomDuration.trim() !== '' : folderDuration !== '');

  const handleCreate = () => {
    if (!isFolderFormValid) return;
    const newFolder = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      name: folderName.trim(),
      level: folderLevel,
      goal: folderGoal,
      equipment: folderEquipment,
      duration: folderDuration === 'Custom' ? `${folderCustomDuration}min` : folderDuration,
      workouts: [],
    };
    onCreateFolder(newFolder);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 0}
          style={styles.modalKeyboardAvoiding}
        >
          <Animated.View
            entering={ZoomIn.duration(280).springify()}
            style={[
              styles.modalContentLarge,
              isKeyboardVisible && { maxHeight: '80%' }
            ]}
          >
            <Animated.View entering={FadeInDown.delay(50).duration(280)} style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Create Folder</Text>
                <Text style={styles.modalSubtitle}>Configure your workout collection</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="#8E8E9A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </Animated.View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: isKeyboardVisible ? hp(38) : hp(62) }}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>FOLDER NAME</Text>
                <AnimatedTextInputField
                  placeholder="Enter folder name"
                  value={folderName}
                  onChangeText={setFolderName}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).duration(300)}>
                <Text style={styles.filterSectionTitle}>Level</Text>
                <View style={styles.cardRow}>
                  <ReanimatedCard
                    selected={folderLevel === 'BEGINNER'}
                    onPress={() => setFolderLevel('BEGINNER')}
                  >
                    <View style={[styles.iconBadge, folderLevel === 'BEGINNER' && styles.iconBadgeSelected]}>
                      <LevelIcon fillCount={1} selected={folderLevel === 'BEGINNER'} />
                    </View>
                    <Text style={[styles.filterCardText, folderLevel === 'BEGINNER' && styles.filterCardTextSelected]}>Beginner</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderLevel === 'INTERMEDIATE'}
                    onPress={() => setFolderLevel('INTERMEDIATE')}
                  >
                    <View style={[styles.iconBadge, folderLevel === 'INTERMEDIATE' && styles.iconBadgeSelected]}>
                      <LevelIcon fillCount={2} selected={folderLevel === 'INTERMEDIATE'} />
                    </View>
                    <Text style={[styles.filterCardText, folderLevel === 'INTERMEDIATE' && styles.filterCardTextSelected]}>Medium</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderLevel === 'ADVANCED'}
                    onPress={() => setFolderLevel('ADVANCED')}
                  >
                    <View style={[styles.iconBadge, folderLevel === 'ADVANCED' && styles.iconBadgeSelected]}>
                      <LevelIcon fillCount={3} selected={folderLevel === 'ADVANCED'} />
                    </View>
                    <Text style={[styles.filterCardText, folderLevel === 'ADVANCED' && styles.filterCardTextSelected]}>Advanced</Text>
                  </ReanimatedCard>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                <Text style={styles.filterSectionTitle}>Goal</Text>
                <View style={styles.cardRow}>
                  <ReanimatedCard
                    selected={folderGoal === 'GAIN_MUSCLE'}
                    onPress={() => setFolderGoal(folderGoal === 'GAIN_MUSCLE' ? '' : 'GAIN_MUSCLE')}
                  >
                    <View style={[styles.iconBadge, folderGoal === 'GAIN_MUSCLE' && styles.iconBadgeSelected]}>
                      <FlexArmIcon selected={folderGoal === 'GAIN_MUSCLE'} />
                    </View>
                    <Text style={[styles.filterCardText, folderGoal === 'GAIN_MUSCLE' && styles.filterCardTextSelected]}>Gain Muscle</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderGoal === 'STRENGTH'}
                    onPress={() => setFolderGoal(folderGoal === 'STRENGTH' ? '' : 'STRENGTH')}
                  >
                    <View style={[styles.iconBadge, folderGoal === 'STRENGTH' && styles.iconBadgeSelected]}>
                      <StrengthIcon selected={folderGoal === 'STRENGTH'} />
                    </View>
                    <Text style={[styles.filterCardText, folderGoal === 'STRENGTH' && styles.filterCardTextSelected]}>Strength</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderGoal === 'LOSE_WEIGHT'}
                    onPress={() => setFolderGoal(folderGoal === 'LOSE_WEIGHT' ? '' : 'LOSE_WEIGHT')}
                  >
                    <View style={[styles.iconBadge, folderGoal === 'LOSE_WEIGHT' && styles.iconBadgeSelected]}>
                      <WeightScaleIcon selected={folderGoal === 'LOSE_WEIGHT'} />
                    </View>
                    <Text style={[styles.filterCardText, folderGoal === 'LOSE_WEIGHT' && styles.filterCardTextSelected]}>Lose Weight</Text>
                  </ReanimatedCard>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(260).duration(300)}>
                <Text style={styles.filterSectionTitle}>Equipment</Text>
                <View style={styles.cardRow}>
                  <ReanimatedCard
                    selected={folderEquipment === 'GYM'}
                    onPress={() => setFolderEquipment('GYM')}
                  >
                    <View style={[styles.iconBadge, folderEquipment === 'GYM' && styles.iconBadgeSelected]}>
                      <GymIcon selected={folderEquipment === 'GYM'} />
                    </View>
                    <Text style={[styles.filterCardText, folderEquipment === 'GYM' && styles.filterCardTextSelected]}>Gym</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderEquipment === 'DUMBBELLS'}
                    onPress={() => setFolderEquipment('DUMBBELLS')}
                  >
                    <View style={[styles.iconBadge, folderEquipment === 'DUMBBELLS' && styles.iconBadgeSelected]}>
                      <DumbbellIcon selected={folderEquipment === 'DUMBBELLS'} />
                    </View>
                    <Text style={[styles.filterCardText, folderEquipment === 'DUMBBELLS' && styles.filterCardTextSelected]}>Dumbbells</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderEquipment === 'NONE'}
                    onPress={() => setFolderEquipment('NONE')}
                  >
                    <View style={[styles.iconBadge, folderEquipment === 'NONE' && styles.iconBadgeSelected]}>
                      <StandingPersonIcon selected={folderEquipment === 'NONE'} />
                    </View>
                    <Text style={[styles.filterCardText, folderEquipment === 'NONE' && styles.filterCardTextSelected]}>None</Text>
                  </ReanimatedCard>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(320).duration(300)}>
                <Text style={styles.filterSectionTitle}>Workout Duration</Text>
                <View style={[styles.cardRow, { marginBottom: 12 }]}>
                  <ReanimatedCard
                    selected={folderDuration === '45min'}
                    onPress={() => setFolderDuration('45min')}
                  >
                    <View style={[styles.iconBadge, folderDuration === '45min' && styles.iconBadgeSelected]}>
                      <DurationClockIcon selected={folderDuration === '45min'} />
                    </View>
                    <Text style={[styles.filterCardText, folderDuration === '45min' && styles.filterCardTextSelected]}>45 min</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderDuration === '60min'}
                    onPress={() => setFolderDuration('60min')}
                  >
                    <View style={[styles.iconBadge, folderDuration === '60min' && styles.iconBadgeSelected]}>
                      <DurationClockIcon selected={folderDuration === '60min'} />
                    </View>
                    <Text style={[styles.filterCardText, folderDuration === '60min' && styles.filterCardTextSelected]}>60 min</Text>
                  </ReanimatedCard>

                  <ReanimatedCard
                    selected={folderDuration === 'Custom'}
                    onPress={() => {
                      setFolderDuration('Custom');
                      if (!folderCustomDuration) {
                        setFolderCustomDuration('45');
                      }
                    }}
                  >
                    <View style={[styles.iconBadge, folderDuration === 'Custom' && styles.iconBadgeSelected]}>
                      <CustomDurationIcon selected={folderDuration === 'Custom'} />
                    </View>
                    <Text style={[styles.filterCardText, folderDuration === 'Custom' && styles.filterCardTextSelected]}>Custom</Text>
                  </ReanimatedCard>
                </View>

                {folderDuration === 'Custom' && (
                  <Animated.View entering={FadeInDown.duration(250)} style={styles.customDurationSection}>
                    {/* Stepper + Wheel Row */}
                    <View style={styles.wheelWithSteppersRow}>
                      <TouchableOpacity
                        style={styles.durationStepBtn}
                        onPress={() => handleStepDuration(-5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.durationStepBtnText}>-5</Text>
                      </TouchableOpacity>

                      <View style={styles.scrollerOuterContainer}>
                        <View style={styles.scrollerHighlightFrame} pointerEvents="none" />
                        <FlatList
                          ref={flatListRef}
                          data={DURATION_OPTIONS}
                          keyExtractor={(item) => item.toString()}
                          snapToInterval={40}
                          decelerationRate="fast"
                          showsVerticalScrollIndicator={false}
                          nestedScrollEnabled={true}
                          contentContainerStyle={{
                            paddingVertical: 40,
                          }}
                          initialScrollIndex={Math.max(0, DURATION_OPTIONS.indexOf(parseInt(folderCustomDuration) || 45))}
                          onScrollToIndexFailed={(info) => {
                            setTimeout(() => {
                              flatListRef.current?.scrollToOffset({ offset: info.index * 40, animated: false });
                            }, 50);
                          }}
                          getItemLayout={(_, index) => ({
                            length: 40,
                            offset: 40 * index,
                            index,
                          })}
                          onMomentumScrollEnd={onScrollEnd}
                          onScrollEndDrag={(e) => {
                            if (Platform.OS === 'android' || Math.abs(e.nativeEvent.velocity?.y || 0) < 0.1) {
                              onScrollEnd(e);
                            }
                          }}
                          renderItem={({ item }) => {
                            const isSelected = String(item) === folderCustomDuration;
                            return (
                              <TouchableOpacity
                                style={styles.scrollerItem}
                                activeOpacity={0.7}
                                onPress={() => selectCustomDuration(item)}
                              >
                                <Text
                                  style={[
                                    styles.scrollerItemText,
                                    isSelected && styles.scrollerItemTextSelected,
                                  ]}
                                >
                                  {item} min
                                </Text>
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.durationStepBtn}
                        onPress={() => handleStepDuration(5)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.durationStepBtnText}>+5</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Quick Preset Chips */}
                    <View style={styles.quickDurationChipsRow}>
                      {[30, 45, 60, 75, 90].map((preset) => {
                        const isChipSelected = folderCustomDuration === String(preset);
                        return (
                          <TouchableOpacity
                            key={preset}
                            style={[
                              styles.quickDurationChip,
                              isChipSelected && styles.quickDurationChipSelected,
                            ]}
                            onPress={() => selectCustomDuration(preset)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.quickDurationChipText,
                                isChipSelected && styles.quickDurationChipTextSelected,
                              ]}
                            >
                              {preset}m
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            </ScrollView>

            <ReanimatedCreateButton isValid={isFolderFormValid} onPress={handleCreate} />
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardAvoiding: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContentLarge: {
    width: '92%',
    maxHeight: '88%',
    backgroundColor: 'rgba(20, 20, 35, 0.85)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#8E8E9A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    paddingLeft: '4%',
  },
  folderInputWrapper: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: 'rgba(12, 12, 20, 0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 14,
    position: 'relative',
    height: 48,
  },
  folderInputWrapperFocused: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(12, 12, 20, 0.7)',
  },
  folderTextInput: {
    flex: 1,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  inputCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  filterCard: {
    backgroundColor: 'rgba(30, 30, 44, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  filterCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  filterCardText: {
    color: '#8E8E9A',
    fontSize: 11,
    fontWeight: '600',
  },
  filterCardTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  customDurationSection: {
    marginVertical: 14,
    alignItems: 'center',
  },
  wheelWithSteppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  durationStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#3A3A4E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationStepBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollerOuterContainer: {
    height: 120,
    width: 150,
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A3C',
  },
  scrollerHighlightFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
    height: 40,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(238, 130, 42, 0.5)',
    backgroundColor: 'rgba(238, 130, 42, 0.12)',
    borderRadius: 8,
  },
  scrollerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollerItemText: {
    color: '#666666',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollerItemTextSelected: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },
  quickDurationChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  quickDurationChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#1E1E2D',
    borderWidth: 1,
    borderColor: '#2E2E42',
  },
  quickDurationChipSelected: {
    backgroundColor: 'rgba(238, 130, 42, 0.2)',
    borderColor: '#EE822A',
  },
  quickDurationChipText: {
    color: '#8E8E9A',
    fontSize: 12,
    fontWeight: '600',
  },
  quickDurationChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalCreateButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});

export default CreateFolderModal;
