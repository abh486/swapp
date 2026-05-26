import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useAuth } from '../context/AuthContext';

// NOTE: For SVG support, ensure you have react-native-svg and react-native-svg-transformer installed.
// In metro.config.js add the svg transformer. Then you can import SVGs as components:
// import RingsGraphic from '../assets/image/grop 20000260.svg';

const { width, height } = Dimensions.get('window');

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
const SwipeButton = ({ onSwipeComplete, loading, text, onSwipeStart, onSwipeEnd }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const triggered = useRef(false);
  const trackWidth = width - 60;
  const iconWidth = 50;
  const padding = 6;
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
      style={styles.swipeTrack}
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
        style={[styles.swipeThumb, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 30 }}
      >
        {loading ? (
          <ActivityIndicator color="#000" size="small" />
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
const RingsGraphic = () => {
  return (
    <Image 
      source={require('../assets/image/Group 20000347.png')} // Clean version without any baked-in text
      style={styles.ringsImage}
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
  const { login, isLoggingIn: loading } = useAuth();

  const handleLogin = () => {
    console.log('Initiating login from onboarding...');
    setTimeout(async () => {
      try {
        await login();
      } catch (err) {
        console.error('Login failed full error:', JSON.stringify(err, null, 2));
        if (err.message && err.message.includes('mismatch')) {
          Alert.alert(
            'Configuration Error',
            'There is a URL mismatch between your App and Auth0 Dashboard. Check your console logs for the Redirect URI.'
          );
        } else {
          Alert.alert('Login Error', err.message || 'An unexpected error occurred.');
        }
      }
    }, 100);
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
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderSlide = ({ item }) => {
    // ── Watch / Apple Health slide ──────────────────────────
    if (item.type === 'watch_layout') {
      return (
        <View style={[styles.slide, { backgroundColor: '#CDCDCD' }]}>
          {/* Watch — top (flipped 180°) */}
          <Image
            source={require('../assets/image/watch.png')}
            style={styles.watchTop}
            resizeMode="contain"
          />

          {/* Centre content */}
          <View style={styles.watchMiddleContent}>
            {/* Activity rings + labels */}
            <View style={styles.activityRingsContainer}>
              <RingsGraphic />
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
            style={styles.watchBottom}
            resizeMode="contain"
          />
        </View>
      );
    }

    // ── Image-background slides (slide 1 & 3) ───────────────
    return (
      <View style={styles.slide}>
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
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.startButton}
                      onPress={handleNext}
                      disabled={loading}
                    >
                      <View style={styles.buttonIconContainer}>
                        {loading ? (
                          <ActivityIndicator color="#000" size="small" />
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
const styles = StyleSheet.create({
  // ── Shared ──────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height,
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
    paddingHorizontal: 30,
    paddingBottom: 80,
  },
  spacer: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 56,
    fontFamily: 'BRLNSR',
    fontWeight: 'normal',
    fontStyle: 'italic',
    lineHeight: 64,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(70, 70, 70, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 40,
    width: '100%',
    justifyContent: 'space-between',
  },
  buttonIconContainer: {
    backgroundColor: '#FFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 10,
  },
  chevronGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Swipe button ─────────────────────────────
  swipeTrack: {
    width: '100%',
    height: 62,
    backgroundColor: 'rgba(70, 70, 70, 0.8)',
    borderRadius: 31,
    justifyContent: 'center',
    padding: 6,
  },
  swipeThumb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 6,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  swipeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    position: 'absolute',
    width: '100%',
    zIndex: 1,
  },
  swipeChevronGroup: {
    flexDirection: 'row',
    position: 'absolute',
    right: 20,
    zIndex: 1,
    opacity: 0.8,
  },

  // ── Pagination ───────────────────────────────
  paginationContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 30,
    backgroundColor: '#FFF',
  },
  inactiveDot: {
    width: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // ── Watch layout (slide 2) ───────────────────
  watchTop: {
    width: width * 1.4,
    height: height * 0.30,
    position: 'absolute',
    top: height * 0.02,
    alignSelf: 'center',
    transform: [{ rotate: '180deg' }],
  },
  watchBottom: {
    width: width * 1.4,
    height: height * 0.30,
    position: 'absolute',
    bottom: height * 0.02,
    alignSelf: 'center',
  },
  watchMiddleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    // Offset so content sits in the gap between the two watch images
    marginTop: height * 0.26,
    marginBottom: height * 0.26,
  },

  // ── Activity rings ───────────────────────────
  activityRingsContainer: {
    width: width * 0.95,
    height: 280,
    alignSelf: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ringsImage: {
    width: width * 0.95,
    height: 280,
    alignSelf: 'center',
  },





  // ── Health text block ────────────────────────
  healthTextContainer: {
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 10,
  },
  healthTitle: {
    fontSize: 42,
    fontFamily: 'BRLNSR',
    fontWeight: 'normal',
    color: '#000',
    marginBottom: 12,
    lineHeight: 50,
  },
  healthSubtitle: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    fontWeight: '400',
  },
});

export default OnboardingScreen;