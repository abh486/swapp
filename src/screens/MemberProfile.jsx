import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalLoader } from '../components/GlobalLoader';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  I18nManager,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  PanResponder,
} from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import * as Clarity from '../utils/clarity';
import { useResponsiveMetrics } from '../utils/responsive';
import HealthKit from 'react-native-health';

if (I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}


// ─── Animated Progress Line with Circle Thumb ────────────────────────
const SegmentedStepHeader = ({ currentStep, totalSteps = 8, sp }) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const targetRatio = (currentStep + 1) / totalSteps;
  const fillWidth = useSharedValue(0);
  const CIRCLE_SIZE = sp(10);

  useEffect(() => {
    if (trackWidth > 0) {
      fillWidth.value = withSpring(targetRatio * trackWidth, {
        damping: 20,
        stiffness: 160,
      });
    }
  }, [targetRatio, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fillWidth.value - CIRCLE_SIZE / 2 }],
  }));

  return (
    <View
      style={{
        width: '100%',
        height: CIRCLE_SIZE,
        justifyContent: 'center',
      }}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {/* Track */}
      <View
        style={{
          width: '100%',
          height: sp(2),
          backgroundColor: 'rgba(255,255,255,0.12)',
        }}
      />
      {/* Fill */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            height: sp(2),
            backgroundColor: '#FFFFFF',
            left: 0,
          },
          fillStyle,
        ]}
      />
      {/* Circle thumb */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
            borderRadius: CIRCLE_SIZE / 2,
            backgroundColor: '#FFFFFF',
            left: 0,
          },
          thumbStyle,
        ]}
      />
    </View>
  );
};

// ─── Individual Animated Character Component ─────────────────────────────────
const AnimatedChar = ({ char, index, isPlaceholder, fs }) => {
  return (
    <Animated.Text
      entering={ZoomIn.duration(180).springify().damping(11)}
      exiting={ZoomOut.duration(140)}
      style={{
        fontSize: fs(54),
        fontWeight: '700',
        color: isPlaceholder ? '#444444' : '#FFFFFF',
        letterSpacing: -0.5,
      }}
    >
      {char}
    </Animated.Text>
  );
};

// ─── Hero Minimal Typing Display (Minimalist Centered Design) ─────────────────
const HeroMinimalTypingDisplay = ({
  value,
  onChangeText,
  placeholder,
  prefix = '',
  suffix = '',
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoFocus = true,
  maxLength = 30,
}) => {
  const { sp, fs } = useResponsiveMetrics();
  const cursorOpacity = useSharedValue(1);
  const textScale = useSharedValue(1);
  const inputRef = useRef(null);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 450 }),
        withTiming(1, { duration: 450 })
      ),
      -1,
      true
    );

    // Auto-focus keyboard on step entry
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(focusTimer);
  }, []);

  const handleChangeText = (t) => {
    textScale.value = withSequence(
      withTiming(1.05, { duration: 40 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    onChangeText(t);
  };

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
  }));

  const chars = value ? value.split('') : (placeholder ? placeholder.split('') : []);
  const isPlaceholder = !value;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={{
        width: '100%',
        paddingVertical: sp(25),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextInput
        ref={inputRef}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.01, zIndex: 10 }]}
        value={value}
        onChangeText={handleChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoFocus={autoFocus}
        maxLength={maxLength}
      />

      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, textAnimatedStyle]}>
        {prefix ? (
          <Text style={{ fontSize: fs(42), color: '#888888', fontWeight: '600', marginRight: sp(4) }}>
            {prefix}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {chars.map((char, index) => (
            <AnimatedChar
              key={`${index}-${char}`}
              char={char}
              index={index}
              isPlaceholder={isPlaceholder}
              fs={fs}
            />
          ))}
        </View>

        <Animated.View
          style={[
            {
              width: sp(2.5),
              height: sp(40),
              backgroundColor: '#FFFFFF',
              borderRadius: sp(1.5),
              marginHorizontal: sp(6),
            },
            cursorStyle,
          ]}
        />

        {suffix ? (
          <Text style={{ fontSize: fs(24), color: '#777777', fontWeight: '500', marginLeft: sp(6) }}>
            {suffix}
          </Text>
        ) : null}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Age Ruler ───────────────────────────────────────────────────────────────
const AgeRuler = ({ value, onChange }) => {
  const { sp, fs, height: screenHeight } = useResponsiveMetrics();
  const ages = Array.from({ length: 80 }, (_, i) => 15 + i);

  const isSmallScreen = screenHeight < 700;
  const ITEM_HEIGHT = isSmallScreen ? sp(50) : sp(65);
  const RULER_HEIGHT = isSmallScreen ? sp(220) : sp(320);
  const PADDING_VERTICAL = isSmallScreen ? sp(85) : sp(120);
  const TEXT_SIZE_SELECTED = isSmallScreen ? fs(52) : fs(66);
  const TEXT_SIZE_UNSELECTED = isSmallScreen ? fs(30) : fs(38);

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const initialOffset = useMemo(() => {
    const idx = ages.findIndex(a => String(a) === String(value));
    return idx > 0 ? idx * ITEM_HEIGHT : 0;
  }, [value, ITEM_HEIGHT]);

  return (
    <View style={{ height: RULER_HEIGHT, width: '100%', alignItems: 'center' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialOffset }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const index = Math.round(y / ITEM_HEIGHT);
          if (index >= 0 && index < ages.length) {
            const nextVal = ages[index].toString();
            if (nextVal !== localValue) {
              setLocalValue(nextVal);
            }
          }
        }}
        onMomentumScrollEnd={() => {
          onChange(localValue);
        }}
        onScrollEndDrag={() => {
          onChange(localValue);
        }}
        scrollEventThrottle={16}
      >
        {ages.map((age) => {
          const isSelected = String(age) === String(localValue);
          return (
            <View key={age} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontSize: isSelected ? TEXT_SIZE_SELECTED : TEXT_SIZE_UNSELECTED,
                fontWeight: isSelected ? '700' : '400',
                color: isSelected ? '#FFFFFF' : '#444444',
                letterSpacing: isSelected ? -0.5 : 0,
              }}>
                {age}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Reanimated Interactive Slider ───────────────────────────────────────────
// ─── Reanimated Interactive Slider ───────────────────────────────────────────
const ReanimatedSlider = ({ min, max, value, onChange }) => {
  const { sp, width: screenWidth } = useResponsiveMetrics();
  const trackWidth = screenWidth - sp(110);
  const containerPageX = useRef(0);
  const sliderRef = useRef(null);

  const numVal = Math.min(Math.max(Number(value) || min, min), max);
  const ratio = (numVal - min) / (max - min);

  const thumbScale = useSharedValue(1);
  const animatedRatio = useSharedValue(ratio);

  useEffect(() => {
    animatedRatio.value = withTiming(ratio, { duration: 60 });
  }, [ratio]);

  const updateFromPageX = (pageX) => {
    const relativeX = pageX - containerPageX.current;
    const clampedX = Math.min(Math.max(relativeX, 0), trackWidth);
    const newRatio = clampedX / trackWidth;
    const rawVal = min + newRatio * (max - min);
    const roundedVal = Math.round(rawVal);
    if (String(roundedVal) !== String(value)) {
      onChange(String(roundedVal));
    }
  };

  const handleStepChange = (delta) => {
    const nextVal = Math.min(Math.max(numVal + delta, min), max);
    onChange(String(nextVal));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        thumbScale.value = withSpring(1.3, { damping: 12, stiffness: 260 });
        sliderRef.current?.measure((x, y, width, height, pageX) => {
          containerPageX.current = pageX;
          updateFromPageX(gestureState.moveX || evt.nativeEvent.pageX);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        updateFromPageX(gestureState.moveX || evt.nativeEvent.pageX);
      },
      onPanResponderRelease: () => {
        thumbScale.value = withSpring(1, { damping: 14, stiffness: 200 });
      },
    })
  ).current;

  const activeTrackStyle = useAnimatedStyle(() => ({
    width: `${animatedRatio.value * 100}%`,
  }));

  const thumbTranslateX = -sp(18);

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${animatedRatio.value * 100}%`,
    transform: [{ translateX: thumbTranslateX }, { scale: thumbScale.value }],
  }));

  return (
    <View style={{ width: '100%', alignItems: 'center', marginVertical: sp(25) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '92%' }}>
        {/* Decrement Button */}
        <TouchableOpacity
          onPress={() => handleStepChange(-1)}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          style={{
            width: sp(42),
            height: sp(42),
            borderRadius: sp(21),
            backgroundColor: '#1C1C1F',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#333338',
          }}
        >
          <Feather name="minus" size={sp(20)} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Interactive Slider Track */}
        <View
          ref={sliderRef}
          onLayout={() => {
            sliderRef.current?.measure((x, y, width, height, pageX) => {
              containerPageX.current = pageX;
            });
          }}
          {...panResponder.panHandlers}
          style={{
            width: trackWidth,
            height: sp(50),
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <View
            style={{
              width: '100%',
              height: sp(8),
              backgroundColor: '#1E1E22',
              borderRadius: sp(4),
            }}
          />

          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                height: sp(8),
                backgroundColor: '#FFFFFF',
                borderRadius: sp(4),
              },
              activeTrackStyle,
            ]}
          />

          <Animated.View
            style={[
              {
                position: 'absolute',
                width: sp(36),
                height: sp(24),
                borderRadius: sp(12),
                backgroundColor: '#FFFFFF',
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 8,
                elevation: 6,
              },
              thumbStyle,
            ]}
          />
        </View>

        {/* Increment Button */}
        <TouchableOpacity
          onPress={() => handleStepChange(1)}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          style={{
            width: sp(42),
            height: sp(42),
            borderRadius: sp(21),
            backgroundColor: '#1C1C1F',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#333338',
          }}
        >
          <Feather name="plus" size={sp(20)} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Animated Segmented Control ───────────────────────────────────────────────
const AnimatedSegmentedControl = ({ options, selectedOption, onSelect, style }) => {
  const { sp, fs } = useResponsiveMetrics();
  const activeIndex = options.indexOf(selectedOption);
  const containerWidth = sp(260);
  const tabWidth = (containerWidth - sp(8)) / options.length;

  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, { damping: 15, stiffness: 220 });
  }, [activeIndex, tabWidth]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = {
    flexDirection: 'row',
    backgroundColor: '#161618',
    borderRadius: sp(30),
    padding: sp(4),
    width: sp(260),
    alignSelf: 'center',
    marginTop: sp(24),
    position: 'relative',
  };

  const highlightContainerStyle = {
    position: 'absolute',
    top: sp(4),
    bottom: sp(4),
    left: sp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: sp(26),
  };

  const tabStyle = {
    flex: 1,
    paddingVertical: sp(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sp(26),
    zIndex: 2,
  };

  return (
    <View style={[containerStyle, style]}>
      <Animated.View
        style={[
          highlightContainerStyle,
          { width: tabWidth },
          highlightStyle,
        ]}
      />
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={tabStyle}
          onPress={() => onSelect(opt)}
          activeOpacity={0.8}
        >
          <Text style={{
            color: selectedOption === opt ? '#FFFFFF' : '#8E8E93',
            fontSize: fs(15),
            fontWeight: selectedOption === opt ? '700' : '600',
            letterSpacing: 0.5,
          }}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


// ─── Animated Choice Card Wrapper ─────────────────────────────────────────────
const AnimatedChoiceCard = ({ children, isSelected, onPress, style, index = 0 }) => {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.03 : 1, { damping: 14, stiffness: 220 });
    checkScale.value = withSpring(isSelected ? 1 : 0, { damping: 12, stiffness: 200 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(300).springify()}
      style={[style, animatedStyle]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
        {isSelected && (
          <Animated.View style={[{ position: 'absolute', top: 12, right: 12, zIndex: 10 }, checkStyle]}>
            <Feather name="check-circle" size={20} color="#FFFFFF" />
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Animated Interest Chip ───────────────────────────────────────────────────
const AnimatedInterestChip = ({ item, isSelected, onPress, index = 0 }) => {
  const { sp, fs } = useResponsiveMetrics();
  const scale = useSharedValue(1);
  const selectProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.06 : 1, { damping: 12, stiffness: 250 });
    selectProgress.value = withTiming(isSelected ? 1 : 0, { duration: 220 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      selectProgress.value,
      [0, 1],
      ['#0A0A0A', '#1E1E22']
    );
    const borderColor = interpolateColor(
      selectProgress.value,
      [0, 1],
      ['#2A2A2A', '#FFFFFF']
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const chipStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    borderRadius: sp(25),
    borderWidth: 1,
    marginRight: sp(10),
    marginBottom: sp(12),
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 25).duration(220)}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Animated.View style={[chipStyle, animatedStyle]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={sp(18)}
            color={isSelected ? '#FFFFFF' : '#888888'}
            style={{ marginRight: sp(8) }}
          />
          <Text style={{
            color: '#FFFFFF',
            fontSize: fs(14),
            fontWeight: isSelected ? '600' : '500',
          }}>
            {item.label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Animated Pressable Button ────────────────────────────────────────────────
const AnimatedButton = ({ onPress, disabled, style, children }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
  };

  return (
    <Animated.View style={[style?.flex ? { flex: style.flex } : null, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Ambient Motion Background ───────────────────────────────────────────────
const AmbientMotionBackground = ({ sp }) => {
  const floatY1 = useSharedValue(0);
  const floatX1 = useSharedValue(0);

  useEffect(() => {
    floatY1.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3200 }),
        withTiming(20, { duration: 3600 })
      ),
      -1,
      true
    );
    floatX1.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 2600 }),
        withTiming(-15, { duration: 2900 })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY1.value },
      { translateX: floatX1.value },
    ],
  }));

  const orbSize = sp ? sp(240) : 240;
  const orbRadius = sp ? sp(120) : 120;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: '8%',
            right: '-10%',
            width: orbSize,
            height: orbSize,
            borderRadius: orbRadius,
            backgroundColor: 'rgba(255, 255, 255, 0.035)',
          },
          orb1Style,
        ]}
      />
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MemberProfile = () => {
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigation = useNavigation();
  const { refreshAuthStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepDirection, setStepDirection] = useState('next');

  const { wp, hp, ms, mvs, sp, fs, width: screenWidth, height: screenHeight } = useResponsiveMetrics();
  const styles = useMemo(
    () => createStyles({ wp, hp, ms, mvs, sp, fs, screenWidth, screenHeight }),
    [wp, hp, ms, mvs, sp, fs, screenWidth, screenHeight]
  );

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    age: '',
    gender: 'Male',
    height: '176',
    weight: '70',
    fitnessGoal: [],
    interests: [],
    simpleGoals: [],
    activityLevel: '',
    focusAreas: [],
  });
  const [healthConnected, setHealthConnected] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);

  const [heightUnit, setHeightUnit] = useState('CM');
  const [weightUnit, setWeightUnit] = useState('KG');

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameError, setUsernameError] = useState('');

  const inputShake = useSharedValue(0);

  useEffect(() => {
    console.log('[Clarity] Sign up started');
    try {
      Clarity.sendCustomEvent('signup_started');
    } catch (e) {
      console.error('[Clarity] Failed to send signup_started:', e);
    }
  }, []);

  // ── Username Availability Check ──────────────────────────────────────────
  useEffect(() => {
    if (currentStep !== 1) return;

    const rawUsername = formData.username.trim().toLowerCase();

    if (!rawUsername) {
      setUsernameAvailable(null);
      setUsernameError('');
      setCheckingUsername(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(rawUsername)) {
      setUsernameAvailable(false);
      if (rawUsername.length < 3) {
        setUsernameError('Username must be at least 3 characters long.');
      } else if (rawUsername.length > 30) {
        setUsernameError('Username cannot exceed 30 characters.');
      } else {
        setUsernameError('Only letters, numbers, and underscores are allowed.');
      }
      setCheckingUsername(false);
      return;
    }

    setUsernameError('');
    setCheckingUsername(true);
    setUsernameAvailable(null);

    const timer = setTimeout(async () => {
      try {
        const reservedJSON = await AsyncStorage.getItem('reserved_usernames');
        const reservedList = reservedJSON ? JSON.parse(reservedJSON) : ['admin', 'swapp', 'test', 'user'];
        if (reservedList.includes(rawUsername)) {
          setUsernameAvailable(false);
          setUsernameError('This username is already taken. Please pick another.');
          setCheckingUsername(false);
          inputShake.value = withSequence(
            withTiming(-10, { duration: 40 }),
            withTiming(10, { duration: 40 }),
            withTiming(-6, { duration: 40 }),
            withTiming(6, { duration: 40 }),
            withSpring(0)
          );
          return;
        }

        const res = await apiClient.get('/v1/auth/check-username', {
          params: { username: rawUsername },
        });

        const isAvail = res.data?.available ?? (res.data?.taken !== undefined ? !res.data.taken : !res.data?.exists);
        if (isAvail === false) {
          setUsernameAvailable(false);
          setUsernameError('This username is already taken. Please pick another.');
          inputShake.value = withSequence(
            withTiming(-10, { duration: 40 }),
            withTiming(10, { duration: 40 }),
            withTiming(-6, { duration: 40 }),
            withTiming(6, { duration: 40 }),
            withSpring(0)
          );
        } else {
          setUsernameAvailable(true);
          setUsernameError('');
        }
      } catch (err) {
        if (err.response?.status === 409 || err.response?.data?.taken || err.response?.data?.available === false) {
          setUsernameAvailable(false);
          setUsernameError('This username is already taken. Please pick another.');
          inputShake.value = withSequence(
            withTiming(-10, { duration: 40 }),
            withTiming(10, { duration: 40 }),
            withTiming(-6, { duration: 40 }),
            withTiming(6, { duration: 40 }),
            withSpring(0)
          );
        } else {
          setUsernameAvailable(true);
          setUsernameError('');
        }
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData.username, currentStep]);

  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: inputShake.value }],
  }));

  // ── Image Picker ────────────────────────────────────────────────────────────
  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 600,
        maxWidth: 600,
        quality: 0.8,
        selectionLimit: 1,
      },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Image Error', response.errorMessage || 'Could not pick image.');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const selectedImage = response.assets[0];
          setUploadingImage(true);
          try {
            const uploadedUrl = await uploadToCloudinary(selectedImage);
            setProfileImage(uploadedUrl);
          } catch (error) {
            Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCurrentStep = () => {
    if (currentStep === 0 && !formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return false;
    }
    if (currentStep === 1) {
      const u = formData.username.trim().toLowerCase();
      if (!u) {
        Alert.alert('Required Field', 'Please enter a username.');
        return false;
      }
      if (u.length < 3) {
        Alert.alert('Invalid Username', 'Username must be at least 3 characters long.');
        return false;
      }
      if (checkingUsername) {
        Alert.alert('Please Wait', 'Checking username availability...');
        return false;
      }
      if (usernameAvailable === false || usernameError) {
        Alert.alert('Username Unavailable', usernameError || 'This username is already taken. Please choose another.');
        return false;
      }
    }
    if (currentStep === 3 && (!formData.age || Number(formData.age) <= 0)) {
      Alert.alert('Required Field', 'Please enter your age.');
      return false;
    }
    if (currentStep === 6 && formData.fitnessGoal.length === 0) {
      Alert.alert('Required Field', 'Please select at least one goal.');
      return false;
    }
    if (currentStep === 7 && formData.interests.length === 0) {
      Alert.alert('Required Field', 'Please select at least one interest.');
      return false;
    }
    if (currentStep === 8 && formData.simpleGoals.length === 0) {
      Alert.alert('Required Field', 'Please select at least one goal.');
      return false;
    }
    if (currentStep === 9 && !formData.activityLevel) {
      Alert.alert('Required Field', 'Please select your activity level.');
      return false;
    }
    return true;
  };

  const isLastStep = currentStep === 11;

  const handleNext = () => {
    if (currentStep === 11) {
      // Apple Health step — Authorize button triggers HealthKit permission
      handleHealthAuthorize();
      return;
    }
    if (validateCurrentStep()) {
      setStepDirection('next');
      isLastStep ? handleSubmit() : setCurrentStep(currentStep + 1);
    }
  };

  // ── Apple Health Authorization ──────────────────────────────────────────────
  const handleHealthAuthorize = async () => {
    if (Platform.OS !== 'ios' || typeof HealthKit?.initHealthKit !== 'function') {
      // HealthKit unavailable (Android, simulator, or not linked) — skip and submit
      handleSubmit();
      return;
    }
    setHealthLoading(true);
    const permissions = {
      permissions: {
        read: [
          HealthKit.Constants.Permissions.Steps,
          HealthKit.Constants.Permissions.HeartRate,
          HealthKit.Constants.Permissions.ActiveEnergyBurned,
          HealthKit.Constants.Permissions.DistanceWalkingRunning,
          HealthKit.Constants.Permissions.Weight,
          HealthKit.Constants.Permissions.Height,
          HealthKit.Constants.Permissions.DateOfBirth,
          HealthKit.Constants.Permissions.SleepAnalysis,
        ],
        write: [
          HealthKit.Constants.Permissions.Steps,
          HealthKit.Constants.Permissions.Weight,
          HealthKit.Constants.Permissions.ActiveEnergyBurned,
        ],
      },
    };
    HealthKit.initHealthKit(permissions, (err) => {
      setHealthLoading(false);
      if (!err) {
        setHealthConnected(true);
      }
      // Whether user accepts or declines, proceed to submit
      handleSubmit();
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setStepDirection('back');
      setCurrentStep(currentStep - 1);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setCurrentStep(12);
    try {
      const cleanUsername = formData.username.trim().toLowerCase();
      await apiClient.post('/v1/auth/create-user-profile', {
        name: formData.name.trim(),
        username: cleanUsername,
        age: Number(formData.age),
        gender: formData.gender,
        weight: { value: Number(formData.weight), unit: weightUnit },
        height: { value: Number(formData.height), unit: heightUnit },
        fitnessGoal: formData.fitnessGoal.join(', '),
        healthConditions: formData.interests.join(', ') || 'None',
        profileImage: profileImage ? profileImage : undefined,
        profilePicture: profileImage ? profileImage : undefined,
      });

      try {
        const reservedJSON = await AsyncStorage.getItem('reserved_usernames');
        const reservedList = reservedJSON ? JSON.parse(reservedJSON) : ['admin', 'swapp', 'test', 'user'];
        if (!reservedList.includes(cleanUsername)) {
          reservedList.push(cleanUsername);
          await AsyncStorage.setItem('reserved_usernames', JSON.stringify(reservedList));
        }
      } catch (e) {
        console.log('Error caching reserved username locally:', e);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[Clarity] Sign up completed');
      try {
        Clarity.sendCustomEvent('signup_completed');
      } catch (e) {
        console.error('[Clarity] Failed to send signup_completed:', e);
      }
      await refreshAuthStatus();
    } catch (err) {
      setCurrentStep(11);
      console.error('Profile Setup Failed:', err.response ? err.response.data : err.message);
      Alert.alert('Profile Setup Failed', err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggles ─────────────────────────────────────────────────────────────────
  const toggleGoal = (goal) => {
    const goals = formData.fitnessGoal;
    setFormData({
      ...formData,
      fitnessGoal: goals.includes(goal) ? goals.filter(g => g !== goal) : [...goals, goal],
    });
  };

  const toggleInterest = (interest) => {
    const interests = formData.interests;
    setFormData({
      ...formData,
      interests: interests.includes(interest) ? interests.filter(i => i !== interest) : [...interests, interest],
    });
  };

  // ── Step Renders ─────────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {

      // ── Step 0: Name + Profile Photo ────────────────────────────────────────
      case 0:
        return (
          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingTop: sp(60), paddingBottom: sp(20) }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={ZoomIn.duration(400).springify()} style={{ alignItems: 'center', marginBottom: sp(50) }}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
                <View style={styles.avatarCircle}>
                  {uploadingImage ? (
                    <GlobalLoader size={sp(60)} />
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <View style={styles.avatarHead} />
                      <View style={styles.avatarBody} />
                    </View>
                  )}
                </View>

                <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.editBadge}>
                  <Feather name="edit" size={sp(18)} color="#0055FF" />
                </Animated.View>
              </TouchableOpacity>

              <Animated.Text entering={FadeInUp.delay(150).duration(300)} style={styles.addProfileLabel}>
                Add Your Profile
              </Animated.Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(250).duration(300)} style={{ width: '100%' }}>
              <Text style={styles.stepTitle}>What do you want to be called ?</Text>
              <HeroMinimalTypingDisplay
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Name"
                autoCapitalize="words"
                autoFocus={true}
              />
            </Animated.View>
          </ScrollView>
        );

      // ── Step 1: Username ──────────────────────────────────────────────────
      case 1:
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={styles.stepHeading}>
              {"Choose your\nUsername"}
            </Animated.Text>

            <Animated.View entering={FadeInUp.delay(120).duration(300)} style={[{ marginTop: sp(10) }, animatedShakeStyle]}>
              <HeroMinimalTypingDisplay
                value={formData.username}
                onChangeText={(text) => {
                  const sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
                  setFormData({ ...formData, username: sanitized });
                }}
                prefix="@"
                placeholder="username"
                autoCapitalize="none"
                autoFocus={true}
              />

              <View style={{ marginTop: sp(12), paddingHorizontal: sp(4), alignItems: 'center' }}>
                {checkingUsername && (
                  <Text style={styles.usernameHelperChecking}>
                    Checking username availability...
                  </Text>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <Animated.Text entering={FadeInUp.duration(200)} style={styles.usernameHelperSuccess}>
                    ✓ @{formData.username.trim().toLowerCase()} is available!
                  </Animated.Text>
                )}
                {!checkingUsername && usernameError ? (
                  <Animated.Text entering={FadeInUp.duration(200)} style={styles.usernameHelperError}>
                    ✕ {usernameError}
                  </Animated.Text>
                ) : null}
                {!checkingUsername && usernameAvailable === null && !usernameError && (
                  <Text style={styles.usernameHelperText}>
                    Must include letters, numbers, and underscores (e.g. john_1). 3–30 chars.
                  </Text>
                )}
              </View>
            </Animated.View>
          </ScrollView>
        );

      // ── Step 2: Gender ──────────────────────────────────────────────────────
      case 2:
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={styles.stepHeading}>
              {"what's your\nGender?"}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(300)} style={styles.stepSubtitle}>
              please select your gender
            </Animated.Text>

            <View style={{ marginTop: sp(10), gap: sp(16) }}>
              <AnimatedChoiceCard
                index={0}
                isSelected={formData.gender === 'Female'}
                onPress={() => setFormData({ ...formData, gender: 'Female' })}
                style={[
                  styles.genderCard,
                  formData.gender === 'Female' && styles.genderCardActive,
                ]}
              >
                <Text style={styles.genderLabel}>Female</Text>
                <Image
                  source={require('../assets/image/girl 1.png')}
                  style={styles.genderImageRight}
                  resizeMode="contain"
                />
              </AnimatedChoiceCard>

              <AnimatedChoiceCard
                index={1}
                isSelected={formData.gender === 'Male'}
                onPress={() => setFormData({ ...formData, gender: 'Male' })}
                style={[
                  styles.genderCard,
                  formData.gender === 'Male' && styles.genderCardActive,
                ]}
              >
                <Text style={[styles.genderLabel, { marginLeft: 'auto', marginRight: sp(30) }]}>Male</Text>
                <Image
                  source={require('../assets/image/male 1.png')}
                  style={styles.genderImageLeft}
                  resizeMode="contain"
                />
              </AnimatedChoiceCard>
            </View>
          </ScrollView>
        );

      // ── Step 3: Age ─────────────────────────────────────────────────────────
      case 3:
        return (
          <View style={{ width: '100%', alignItems: 'center', paddingVertical: sp(20), flex: 1 }}>
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={[styles.stepHeading, { textAlign: 'center' }]}>
              Your age
            </Animated.Text>

            <Animated.View entering={ZoomIn.delay(150).duration(350).springify()} style={{ width: '100%', marginTop: sp(30) }}>
              <HeroMinimalTypingDisplay
                value={formData.age}
                onChangeText={(v) => {
                  const numeric = v.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, age: numeric });
                }}
                placeholder="Age"
                suffix="years"
                keyboardType="numeric"
                maxLength={3}
                autoFocus={true}
              />
            </Animated.View>
          </View>
        );

      // ── Step 4: Your height ─────────────────────────────────────────────────
      case 4: {
        const heightNum = Number(formData.height) || 176;
        let displayHeightVal = String(heightNum);
        let displayHeightUnit = 'cm';

        if (heightUnit === 'FT') {
          const totalInches = Math.round(heightNum / 2.54);
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          displayHeightVal = `${feet}' ${inches}"`;
          displayHeightUnit = 'ft';
        }

        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: sp(10) }}>
            <Animated.View entering={FadeInDown.duration(300).springify()} style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.screenMainTitle}>Your height</Text>

              <AnimatedSegmentedControl
                options={['CM', 'FT']}
                selectedOption={heightUnit}
                onSelect={(opt) => setHeightUnit(opt)}
              />
            </Animated.View>

            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}
            >
              <Text style={styles.massiveValueText}>{displayHeightVal}</Text>
              <Text style={styles.massiveUnitText}>{displayHeightUnit}</Text>
            </View>

            <ReanimatedSlider
              min={100}
              max={230}
              value={formData.height}
              onChange={(v) => setFormData({ ...formData, height: v })}
            />
          </View>
        );
      }

      // ── Step 5: Your weight ─────────────────────────────────────────────────
      case 5: {
        const weightNum = Number(formData.weight) || 70;
        let displayWeightVal = String(weightNum);
        let displayWeightUnit = 'kg';

        if (weightUnit === 'LBS') {
          displayWeightVal = String(Math.round(weightNum * 2.20462));
          displayWeightUnit = 'lbs';
        }

        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: sp(10) }}>
            <Animated.View entering={FadeInDown.duration(300).springify()} style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.screenMainTitle}>Your weight</Text>

              <AnimatedSegmentedControl
                options={['KG', 'LBS']}
                selectedOption={weightUnit}
                onSelect={(opt) => setWeightUnit(opt)}
              />
            </Animated.View>

            <View
              style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}
            >
              <Text style={styles.massiveValueText}>{displayWeightVal}</Text>
              <Text style={styles.massiveUnitText}>{displayWeightUnit}</Text>
            </View>

            <ReanimatedSlider
              min={30}
              max={200}
              value={formData.weight}
              onChange={(v) => setFormData({ ...formData, weight: v })}
            />
          </View>
        );
      }

      // ── Step 6: Fitness Goals ────────────────────────────────────────────────
      case 6: {
        const goals = ['Lose Weight', 'Build muscle', 'Boost energy', 'Stress relief', 'Sports performance', 'Flexibility'];
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={styles.stepHeading}>
              What are you here for?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(300)} style={styles.stepSubtitle}>
              Select all that apply
            </Animated.Text>
            <View style={{ marginTop: sp(20), gap: sp(14) }}>
              {goals.map((g, idx) => {
                const isSelected = formData.fitnessGoal.includes(g);
                return (
                  <Animated.View
                    key={g}
                    entering={FadeInDown.delay(idx * 110).duration(350).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => toggleGoal(g)}
                      style={[styles.simpleGoalRow, isSelected && styles.simpleGoalRowActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.simpleGoalText, isSelected && { color: '#FFFFFF' }]}>{g}</Text>
                      {isSelected && (
                        <Feather name="check-circle" size={sp(20)} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        );
      }

      // ── Step 7: Interests ────────────────────────────────────────────────────
      case 7: {
        const interests = [
          'Gym Workouts', 'Running', 'Yoga', 'Cycling',
          'Swimming', 'HIIT', 'Pilates', 'Hiking',
          'Football', 'Basketball', 'Meditation', 'Boxing',
        ];
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={styles.stepHeading}>
              What do you enjoy?
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(80).duration(300)} style={styles.stepSubtitle}>
              Tap all that interest you
            </Animated.Text>
            <View style={{ marginTop: sp(20), gap: sp(14) }}>
              {interests.map((item, idx) => {
                const isSelected = formData.interests.includes(item);
                return (
                  <Animated.View
                    key={item}
                    entering={FadeInDown.delay(idx * 80).duration(350).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => toggleInterest(item)}
                      style={[styles.simpleGoalRow, isSelected && styles.simpleGoalRowActive]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.simpleGoalText, isSelected && { color: '#FFFFFF' }]}>{item}</Text>
                      {isSelected && (
                        <Feather name="check-circle" size={sp(20)} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        );
      }

      // ── Step 8: Your Goals (simple) ──────────────────────────────────────────────
      case 8: {
        const simpleGoalOptions = ['Weight Loss', 'Strength & Muscle', 'Endurance', 'Mobility'];
        return (
          <ScrollView contentContainerStyle={{ paddingVertical: sp(40) }} showsVerticalScrollIndicator={false}>
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={[styles.stepHeading, { textAlign: 'center', marginBottom: sp(40) }]}>
              Your goals
            </Animated.Text>
            <View style={{ gap: sp(14) }}>
              {simpleGoalOptions.map((g) => {
                const isSelected = formData.simpleGoals.includes(g);
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      const current = formData.simpleGoals;
                      setFormData({ ...formData, simpleGoals: isSelected ? current.filter(x => x !== g) : [...current, g] });
                    }}
                    style={[styles.simpleGoalRow, isSelected && styles.simpleGoalRowActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.simpleGoalText, isSelected && { color: '#FFFFFF' }]}>{g}</Text>
                    {isSelected && <Feather name="check" size={sp(18)} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );
      }

      // ── Step 9: Activity Level ────────────────────────────────────────────────
      case 9: {
        const activityOptions = [
          { key: 'sedentary', label: 'Sedentary', sub: 'Little or no exercise', icon: 'human-wheelchair' },
          { key: 'light', label: 'Light', sub: '1-3 days / week', icon: 'walk' },
          { key: 'moderate', label: 'Moderate', sub: '3-5 days / week', icon: 'run' },
          { key: 'active', label: 'Active', sub: '6-7 days / week', icon: 'weight-lifter' },
          { key: 'very_active', label: 'Very Active', sub: 'Athlete / 2x daily', icon: 'bike' },
        ];
        return (
          <ScrollView contentContainerStyle={{ paddingVertical: sp(40) }} showsVerticalScrollIndicator={false}>
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={[styles.stepHeading, { textAlign: 'center', marginBottom: sp(40) }]}>
              Activity level
            </Animated.Text>
            <View style={{ gap: sp(12) }}>
              {activityOptions.map((opt) => {
                const isSelected = formData.activityLevel === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setFormData({ ...formData, activityLevel: opt.key })}
                    style={[styles.activityRow, isSelected && styles.activityRowActive]}
                    activeOpacity={0.75}
                  >
                    <View style={styles.activityIconBox}>
                      <MaterialCommunityIcons name={opt.icon} size={sp(22)} color={isSelected ? '#FFFFFF' : '#666666'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activityLabel, isSelected && { color: '#FFFFFF' }]}>{opt.label}</Text>
                      <Text style={styles.activitySub}>{opt.sub}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.activityCheck}>
                        <Feather name="check" size={sp(14)} color="#000000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );
      }

      // ── Step 10: Focus Areas ──────────────────────────────────────────────────
      case 10: {
        const focusOptions = ['Shoulders', 'Arms', 'Legs', 'Core', 'Back', 'Chest', 'Full Body'];
        return (
          <ScrollView contentContainerStyle={{ paddingVertical: sp(40) }} showsVerticalScrollIndicator={false}>
            <Animated.Text entering={FadeInDown.duration(300).springify()} style={[styles.stepHeading, { textAlign: 'center', marginBottom: sp(40) }]}>
              Focus areas
            </Animated.Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: sp(12) }}>
              {focusOptions.map((area) => {
                const isSelected = formData.focusAreas.includes(area);
                return (
                  <TouchableOpacity
                    key={area}
                    onPress={() => {
                      const current = formData.focusAreas;
                      setFormData({ ...formData, focusAreas: isSelected ? current.filter(x => x !== area) : [...current, area] });
                    }}
                    style={[styles.focusChip, isSelected && styles.focusChipActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.focusChipText, isSelected && { color: '#FFFFFF' }]}>{area}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );
      }

      // ── Step 11: Connect Apple Health ─────────────────────────────────────────
      case 11:
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: sp(20) }}>
            <Animated.Text
              entering={FadeInDown.duration(300).springify()}
              style={[styles.stepHeading, { textAlign: 'center', marginBottom: sp(60) }]}
            >
              Connect Apple Health
            </Animated.Text>

            <Animated.View entering={ZoomIn.delay(100).duration(350).springify()} style={{ flexDirection: 'row', alignItems: 'center', gap: sp(20), marginBottom: sp(50) }}>
              <View style={styles.healthAppIcon}>
                <Text style={{ color: '#FFFFFF', fontSize: fs(16), fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', lineHeight: fs(18) }}>{'Swa\npp'}</Text>
              </View>
              <View style={{ alignItems: 'center', gap: sp(6) }}>
                <MaterialCommunityIcons name="arrow-right" size={sp(20)} color="#666666" />
                <MaterialCommunityIcons name="arrow-left" size={sp(20)} color="#666666" />
              </View>
              <View style={styles.healthAppleIcon}>
                <MaterialCommunityIcons name="heart" size={sp(36)} color="#FF375F" />
              </View>
            </Animated.View>

            <Animated.Text
              entering={FadeInUp.delay(200).duration(300)}
              style={{ color: '#888888', fontSize: fs(15), textAlign: 'center', lineHeight: fs(22), paddingHorizontal: sp(10) }}
            >
              Connect your health data to the YouCan app for seamless syncing and personalized health insights.
            </Animated.Text>

            <TouchableOpacity onPress={handleSubmit} style={{ marginTop: sp(30) }} activeOpacity={0.7}>
              <Text style={{ color: '#555555', fontSize: fs(15), textDecorationLine: 'underline' }}>Not now</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (currentStep === 12) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Animated.Text entering={ZoomIn.duration(400).springify()} style={{ color: '#FFFFFF', fontSize: fs(32), fontWeight: '600', letterSpacing: 0.5 }}>
          Get ready !!
        </Animated.Text>
        <GlobalLoader size={sp(60)} style={{ marginTop: sp(30), opacity: loading ? 1 : 0 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <AmbientMotionBackground sp={sp} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ paddingHorizontal: sp(20), paddingVertical: sp(14) }}>
          <SegmentedStepHeader currentStep={currentStep} totalSteps={12} sp={sp} />
        </View>

        {/* Directional Slide & Fade Reanimated Step Transition */}
        <Animated.View
          key={currentStep}
          entering={stepDirection === 'next' ? SlideInRight.duration(320).springify().damping(15) : FadeInLeft.duration(280)}
          exiting={stepDirection === 'next' ? FadeOutLeft.duration(200) : FadeOutRight.duration(200)}
          style={styles.content}
        >
          {renderStepContent()}
        </Animated.View>

        {/* Bottom Navigation Footer */}
        <View style={styles.bottomFooterRow}>
          <AnimatedButton
            style={[styles.circularBackButton, { opacity: currentStep === 0 ? 0.3 : 1 }]}
            onPress={handleBack}
            disabled={currentStep === 0}
          >
            <Feather name="chevron-left" size={sp(24)} color="#FFFFFF" />
          </AnimatedButton>

          <AnimatedButton
            style={styles.continuePillButton}
            onPress={handleNext}
            disabled={loading || uploadingImage || healthLoading}
          >
            {(loading || healthLoading) ? (
              <GlobalLoader size={sp(32)} color="#000000" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.continuePillText}>
                  {currentStep === 11 ? '✦ Authorize' : 'Continue'}
                </Text>
                {currentStep !== 11 && <Feather name="arrow-right" size={sp(20)} color="#000000" style={{ marginLeft: sp(8) }} />}
              </View>
            )}
          </AnimatedButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = ({ wp, hp, ms, mvs, sp, fs, screenWidth, screenHeight }) => {
  const isSmallScreen = screenHeight < 700;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },


    // Content
    content: {
      flex: 1,
      paddingHorizontal: sp(20),
    },

    // Bottom Navigation Footer
    bottomFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sp(20),
      paddingBottom: Platform.OS === 'ios' ? sp(30) : sp(20),
      paddingTop: sp(10),
      gap: sp(14),
    },
    circularBackButton: {
      width: sp(54),
      height: sp(54),
      borderRadius: sp(27),
      backgroundColor: '#161618',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    continuePillButton: {
      flex: 1,
      height: sp(54),
      borderRadius: sp(27),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    continuePillText: {
      color: '#000000',
      fontSize: fs(18),
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // Screen Title
    screenMainTitle: {
      color: '#FFFFFF',
      fontSize: fs(24),
      fontWeight: '700',
      textAlign: 'center',
      marginTop: sp(10),
    },

    // Segmented Pill Container
    segmentedPillContainer: {
      flexDirection: 'row',
      backgroundColor: '#161618',
      borderRadius: sp(30),
      padding: sp(4),
      width: sp(260),
      alignSelf: 'center',
      marginTop: sp(24),
      position: 'relative',
    },
    segmentedPillHighlight: {
      position: 'absolute',
      top: sp(4),
      bottom: sp(4),
      left: sp(4),
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
      borderRadius: sp(26),
    },
    segmentedPillTab: {
      flex: 1,
      paddingVertical: sp(12),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: sp(26),
      zIndex: 2,
    },
    segmentedPillText: {
      color: '#8E8E93',
      fontSize: fs(15),
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    segmentedPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    // Massive Display Value
    massiveValueText: {
      color: '#FFFFFF',
      fontSize: fs(76),
      fontWeight: 'bold',
      letterSpacing: -1,
    },
    massiveUnitText: {
      color: '#8E8E93',
      fontSize: fs(30),
      fontWeight: '600',
      marginLeft: sp(10),
    },

    // Step 0 — Avatar
    avatarCircle: {
      width: sp(140),
      height: sp(140),
      borderRadius: sp(70),
      borderWidth: 3,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1A1A1A',
      overflow: 'hidden',
    },
    avatarImage: {
      width: sp(140),
      height: sp(140),
      borderRadius: sp(70),
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarHead: {
      width: sp(46),
      height: sp(46),
      borderRadius: sp(23),
      backgroundColor: '#3A3A3A',
      marginBottom: sp(6),
    },
    avatarBody: {
      width: sp(70),
      height: sp(38),
      borderRadius: sp(35),
      backgroundColor: '#3A3A3A',
    },
    editBadge: {
      position: 'absolute',
      bottom: sp(2),
      right: sp(2),
      backgroundColor: '#FFF',
      width: sp(36),
      height: sp(36),
      borderRadius: sp(18),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    addProfileLabel: {
      color: '#AAAAAA',
      fontSize: fs(16),
      marginTop: sp(18),
      letterSpacing: 0.3,
    },
    stepTitle: {
      color: '#FFF',
      fontSize: fs(20),
      textAlign: 'center',
      marginBottom: sp(20),
    },

    // Inputs
    nameInputContainer: {
      width: '82%',
      alignSelf: 'center',
      height: sp(46),
      borderRadius: sp(10),
      borderWidth: 1.5,
      paddingHorizontal: sp(14),
      justifyContent: 'center',
    },
    nameInputText: {
      color: '#FFF',
      fontSize: fs(16),
      height: '100%',
    },
    usernameInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '82%',
      alignSelf: 'center',
      height: sp(46),
      borderRadius: sp(10),
      borderWidth: 1.5,
      paddingHorizontal: sp(14),
    },
    usernamePrefix: {
      color: '#888888',
      fontSize: fs(17),
      fontWeight: '600',
      marginRight: sp(6),
    },
    usernameInput: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: fs(16),
      height: '100%',
    },
    usernameHelperChecking: {
      color: '#9CA3AF',
      fontSize: fs(14),
    },
    usernameHelperSuccess: {
      color: '#10B981',
      fontSize: fs(14),
      fontWeight: '500',
    },
    usernameHelperError: {
      color: '#EF4444',
      fontSize: fs(14),
      fontWeight: '500',
    },
    usernameHelperText: {
      color: '#6B7280',
      fontSize: fs(13),
    },

    // Step Headings
    stepHeading: {
      color: '#FFF',
      fontSize: isSmallScreen ? fs(28) : fs(34),
      fontWeight: '500',
      marginBottom: isSmallScreen ? sp(8) : sp(12),
    },
    stepSubtitle: {
      color: '#777',
      fontSize: isSmallScreen ? fs(13) : fs(15),
      marginBottom: isSmallScreen ? sp(16) : sp(24),
    },

    // Gender
    genderCard: {
      width: '100%',
      height: sp(160),
      backgroundColor: '#0D0D0D',
      borderRadius: sp(20),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    genderCardActive: {
      borderColor: '#FFFFFF',
      backgroundColor: '#141414',
    },
    genderLabel: {
      color: '#FFFFFF',
      fontSize: fs(26),
      fontWeight: '400',
      letterSpacing: 0.5,
      zIndex: 2,
      paddingLeft: sp(30),
    },
    genderImageRight: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: sp(160),
      height: sp(160),
    },
    genderImageLeft: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: sp(160),
      height: sp(160),
    },

    // Goals
    goalCard: {
      width: '47%',
      height: sp(110),
      backgroundColor: '#0D0D0D',
      borderRadius: sp(14),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(16),
      position: 'relative',
    },
    goalCardActive: {
      backgroundColor: '#1A1A1A',
      borderColor: '#FFFFFF',
    },
    goalText: {
      color: '#FFF',
      fontSize: fs(15),
      textAlign: 'center',
    },

    // Interests
    sectionLabel: {
      color: '#666',
      fontSize: fs(11),
      fontWeight: 'bold',
      marginBottom: sp(14),
      letterSpacing: 1.5,
    },
    interestChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sp(16),
      paddingVertical: sp(12),
      borderRadius: sp(25),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      backgroundColor: '#0A0A0A',
      marginRight: sp(10),
      marginBottom: sp(12),
    },
    interestChipActive: {
      borderColor: '#FFFFFF',
      backgroundColor: '#1E1E22',
    },
    interestText: {
      color: '#FFF',
      fontSize: fs(14),
      fontWeight: '500',
    },

    // Step 8 — Simple Goals
    simpleGoalRow: {
      width: '100%',
      paddingVertical: sp(18),
      paddingHorizontal: sp(20),
      borderRadius: sp(14),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      backgroundColor: '#0D0D0D',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    simpleGoalRowActive: {
      borderColor: '#FFFFFF',
      backgroundColor: '#141414',
    },
    simpleGoalText: {
      color: '#888888',
      fontSize: fs(17),
      fontWeight: '500',
    },

    // Step 9 — Activity Level
    activityRow: {
      width: '100%',
      paddingVertical: sp(16),
      paddingHorizontal: sp(16),
      borderRadius: sp(14),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      backgroundColor: '#0D0D0D',
      flexDirection: 'row',
      alignItems: 'center',
      gap: sp(14),
    },
    activityRowActive: {
      borderColor: '#FFFFFF',
      backgroundColor: '#141414',
    },
    activityIconBox: {
      width: sp(38),
      alignItems: 'center',
    },
    activityLabel: {
      color: '#888888',
      fontSize: fs(16),
      fontWeight: '600',
    },
    activitySub: {
      color: '#555555',
      fontSize: fs(13),
      marginTop: sp(2),
    },
    activityCheck: {
      width: sp(24),
      height: sp(24),
      borderRadius: sp(12),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Step 10 — Focus Areas
    focusChip: {
      paddingVertical: sp(14),
      paddingHorizontal: sp(20),
      borderRadius: sp(30),
      borderWidth: 1,
      borderColor: '#2A2A2A',
      backgroundColor: '#0D0D0D',
    },
    focusChipActive: {
      borderColor: '#FFFFFF',
      backgroundColor: '#141414',
    },
    focusChipText: {
      color: '#888888',
      fontSize: fs(15),
      fontWeight: '500',
    },

    // Step 11 — Apple Health
    healthAppIcon: {
      width: sp(80),
      height: sp(80),
      borderRadius: sp(18),
      backgroundColor: '#1A1A1A',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#333333',
    },
    healthAppleIcon: {
      width: sp(80),
      height: sp(80),
      borderRadius: sp(18),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default MemberProfile;