import { GlobalLoader } from '../components/GlobalLoader';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, Image, SafeAreaView, Alert, Animated, PanResponder, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';
import { useResponsiveMetrics } from '../utils/responsive';

const slides = [
  {
    id: '1',
    image: require('../assets/image/welcome1.png'),
    type: 'image_bg',
    title: 'Stay In\nThe Loop.\nAlways.',
  },
  {
    id: '2',
    type: 'watch_layout',
    title: 'Connect to\nApple Health',
    subtitle:
      'Get the full picture — connect Cal AI and Apple Health to automatically sync your daily activity',
  },
  {
    id: '3',
    image: require('../assets/image/welcome2.jpg'),
    type: 'image_bg',
    title: 'Push Past\nLimits,\nChase\nResults',
    buttonText: 'Lets start',
    isSwipeButton: true,
  },
];

// ─────────────────────────────────────────────
// SwipeButton
// ─────────────────────────────────────────────
const SwipeButton = ({ onSwipeComplete, loading, text, onSwipeStart, onSwipeEnd, styles, wp, ms, sp }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const triggered = useRef(false);
  const trackWidth = wp(90);
  const iconWidth = ms(50);
  const padding = ms(6);
  const maxTravel = trackWidth - iconWidth - padding * 2;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pan.stopAnimation();
        if (onSwipeStart) onSwipeStart();
        triggered.current = false;
        pan.setOffset({ x: pan.x._value, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (e, gesture) => {
        pan.flattenOffset();
        if (onSwipeEnd) onSwipeEnd();

        if (pan.x._value > maxTravel * 0.50 || gesture.vx > 1.5) {
          if (!triggered.current) {
            triggered.current = true;
            onSwipeComplete();
          }

          Animated.spring(pan, {
            toValue: { x: maxTravel, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            setTimeout(() => {
              Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
              triggered.current = false; // Reset trigger state
            }, 1000);
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            triggered.current = false;
          });
        }
      },
      onPanResponderTerminate: () => {
        if (onSwipeEnd) onSwipeEnd();
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        triggered.current = false;
      },
    })
  ).current;

  const translateX = pan.x.interpolate({
    inputRange: [0, maxTravel],
    outputRange: [0, maxTravel],
    extrapolate: 'clamp',
  });

  return (
    <View 
      style={[styles.swipeTrack, { padding: padding, borderRadius: ms(31), height: ms(62) }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => { if (onSwipeStart) onSwipeStart(); }}
      onResponderRelease={() => { if (onSwipeEnd) onSwipeEnd(); }}
      onResponderTerminate={() => { if (onSwipeEnd) onSwipeEnd(); }}
    >
      <Text style={styles.swipeText}>{text}</Text>
      <View style={styles.swipeChevronGroup}>
        <Icon name="chevron-right" size={24} color="#A0A0A0" />
        <Icon name="chevron-right" size={24} color="#D0D0D0" />
        <Icon name="chevron-right" size={24} color="#FFFFFF" />
      </View>
      <Animated.View
        style={[
          styles.swipeThumb,
          {
            width: iconWidth,
            height: iconWidth,
            borderRadius: iconWidth / 2,
            left: padding,
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
        hitSlop={{ top: ms(20), bottom: ms(20), left: ms(20), right: ms(30) }}
      >
        {loading ? (
          <GlobalLoader size={30} />
        ) : (
          <Icon name="chevron-right" size={28} color="#000" />
        )}
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────
// RingsGraphic — Static SVG rings
// ─────────────────────────────────────────────
const RingsGraphic = ({ style }) => {
  return (
    <Image 
      source={require('../assets/image/Group 20000347.png')} // Clean version without any baked-in text
      style={style}
      resizeMode="contain"
    />
  );
};

// ─────────────────────────────────────────────
// OnboardingScreen
// ─────────────────────────────────────────────
const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollX = useRef(0);
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const { isLoggingIn: loading } = useAuth();
  const { width: screenWidth, height: screenHeight, wp, hp, ms, fs, sp } = useResponsiveMetrics();
  const isSmallScreen = screenHeight < 720;
  const styles = createStyles({ screenWidth, screenHeight, wp, hp, ms, fs, sp });

  const handleLogin = () => {
    console.log('Navigating from onboarding to LoginScreen...');
    navigation.navigate('LoginScreen');
  };
  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleLogin();
    }
  };

  const handleScroll = (event) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  const renderSlide = ({ item }) => {
    // ── Watch / Apple Health slide ──────────────────────────
    if (item.type === 'watch_layout') {
      return (
        <View style={[styles.slide, { width: screenWidth, height: screenHeight, backgroundColor: '#CDCDCD' }]}>
          {/* Watch — top (flipped 180°) */}
          <Image
            source={require('../assets/image/watch.png')}
            style={[styles.watchTop, { width: screenWidth * 1.4, height: isSmallScreen ? screenHeight * 0.20 : screenHeight * 0.30, top: screenHeight * 0.02 }]}
            resizeMode="contain"
          />

          {/* Centre content */}
          <View style={[styles.watchMiddleContent, { paddingHorizontal: sp(20), marginTop: isSmallScreen ? screenHeight * 0.14 : screenHeight * 0.26, marginBottom: isSmallScreen ? screenHeight * 0.14 : screenHeight * 0.26 }]}>
            {/* Activity rings + labels */}
            <View style={[styles.activityRingsContainer, { width: screenWidth * 0.95, height: isSmallScreen ? ms(180) : ms(280) }]}> 
              <RingsGraphic style={[styles.ringsImage, { width: screenWidth * 0.95, height: isSmallScreen ? ms(180) : ms(280) }]} />
            </View>
            {/* Text block */}
            <View style={styles.healthTextContainer}>
              <Text style={styles.healthTitle}>{item.title}</Text>
              <Text style={styles.healthSubtitle}>{item.subtitle}</Text>
            </View>
          </View>

          {/* Watch — bottom (normal orientation) */}
          <Image
            source={require('../assets/image/watch.png')}
            style={[styles.watchBottom, { width: screenWidth * 1.4, height: isSmallScreen ? screenHeight * 0.20 : screenHeight * 0.30, bottom: screenHeight * 0.02 }]}
            resizeMode="contain"
          />
        </View>
      );
    }

    // ── Image-background slides (slide 1 & 3) ───────────────
    return (
      <View style={[styles.slide, { width: screenWidth, height: screenHeight }]}> 
        <ImageBackground source={item.image} style={styles.imageBackground} resizeMode="cover">
          <View style={styles.overlay} />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.textContent}>
              <View style={styles.spacer} />
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{item.title}</Text>
              </View>

              {item.buttonText && (
                <View style={styles.buttonContainer}>
                  {item.isSwipeButton ? (
                    <SwipeButton
                      text={item.buttonText}
                      onSwipeComplete={handleLogin}
                      loading={loading}
                      onSwipeStart={() => setScrollEnabled(false)}
                      onSwipeEnd={() => setScrollEnabled(true)}
                      styles={styles}
                      wp={wp}
                      ms={ms}
                      sp={sp}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={handleNext}
                      disabled={loading}
                    >
                      <View style={styles.buttonIconContainer}>
                        {loading ? (
                          <GlobalLoader size={30} />
                        ) : (
                          <Icon name="chevron-right" size={24} color="#000" />
                        )}
                      </View>
                      <Text style={styles.startButtonText}>{item.buttonText}</Text>
                      <View style={styles.chevronGroup}>
                        <Icon name="chevron-right" size={20} color="#A0A0A0" />
                        <Icon name="chevron-right" size={20} color="#D0D0D0" />
                        <Icon name="chevron-right" size={20} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </SafeAreaView>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const createStyles = ({ screenWidth, screenHeight, wp, hp, ms, fs, sp }) => {
  const isSmallScreen = screenHeight < 720;
  return StyleSheet.create({
    // ── Shared ──────────────────────────────────
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    slide: {
      overflow: 'hidden',
    },

    // ── Image-bg slides ─────────────────────────
    imageBackground: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    safeArea: {
      flex: 1,
    },
    textContent: {
      flex: 1,
      paddingHorizontal: sp(30),
      paddingBottom: isSmallScreen ? sp(45) : sp(80),
    },
    spacer: {
      flex: 1,
    },
    titleContainer: {
      marginBottom: isSmallScreen ? sp(20) : sp(40),
    },
    title: {
      color: '#FFFFFF',
      fontSize: isSmallScreen ? fs(38) : fs(56),
      fontFamily: 'BRLNSR',
      fontWeight: 'normal',
      fontStyle: 'italic',
      lineHeight: isSmallScreen ? fs(44) : fs(64),
    },
    buttonContainer: {
      alignItems: 'center',
      marginBottom: sp(20),
    },
    startButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(70, 70, 70, 0.8)',
      paddingVertical: sp(12),
      paddingHorizontal: sp(16),
      borderRadius: ms(40),
      width: '100%',
      justifyContent: 'space-between',
    },
    buttonIconContainer: {
      backgroundColor: '#FFF',
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    startButtonText: {
      color: '#FFF',
      fontSize: fs(18),
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginRight: sp(10),
    },
    chevronGroup: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    // ── Swipe button ─────────────────────────────
    swipeTrack: {
      width: '100%',
      height: ms(62),
      backgroundColor: 'rgba(70, 70, 70, 0.8)',
      borderRadius: ms(31),
      justifyContent: 'center',
      padding: ms(6),
    },
    swipeThumb: {
      width: ms(50),
      height: ms(50),
      borderRadius: ms(25),
      backgroundColor: '#FFF',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      left: ms(6),
      zIndex: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    },
    swipeText: {
      color: '#FFF',
      fontSize: fs(18),
      fontWeight: '600',
      textAlign: 'center',
      position: 'absolute',
      width: '100%',
      zIndex: 1,
    },
    swipeChevronGroup: {
      flexDirection: 'row',
      position: 'absolute',
      right: sp(20),
      zIndex: 1,
      opacity: 0.8,
    },

    // ── Pagination ───────────────────────────────
    paginationContainer: {
      position: 'absolute',
      bottom: isSmallScreen ? sp(20) : sp(40),
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      height: ms(4),
      borderRadius: ms(2),
      marginHorizontal: sp(4),
    },
    activeDot: {
      width: ms(30),
      backgroundColor: '#FFF',
    },
    inactiveDot: {
      width: ms(20),
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },

    // ── Watch layout (slide 2) ───────────────────
    watchTop: {
      position: 'absolute',
      alignSelf: 'center',
      transform: [{ rotate: '180deg' }],
    },
    watchBottom: {
      position: 'absolute',
      alignSelf: 'center',
    },
    watchMiddleContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: sp(20),
    },

    // ── Activity rings ───────────────────────────
    activityRingsContainer: {
      alignSelf: 'center',
      justifyContent: 'center',
      marginVertical: sp(10),
    },
    ringsImage: {
      alignSelf: 'center',
    },

    // ── Health text block ────────────────────────
    healthTextContainer: {
      alignItems: 'flex-start',
      width: '100%',
      paddingHorizontal: 10,
    },
    healthTitle: {
      fontSize: isSmallScreen ? fs(30) : fs(42),
      fontFamily: 'BRLNSR',
      fontWeight: 'normal',
      color: '#000',
      marginBottom: sp(12),
      lineHeight: isSmallScreen ? fs(36) : fs(50),
    },
    healthSubtitle: {
      fontSize: fs(15),
      color: '#555',
      lineHeight: 22,
      fontWeight: '400',
    },
  });
};

export default OnboardingScreen;