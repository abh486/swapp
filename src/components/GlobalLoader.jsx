import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export const GlobalLoader = ({ size = 70, outerWidth = 5, innerWidth = 4 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinValue.setValue(0);
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const spinAngle = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const center = size / 2;
  const outerRadius = (size / 2) - (outerWidth / 2) - 2;
  const innerRadius = Math.max(4, outerRadius - outerWidth - (size * 0.08));

  return (
    <View style={styles.loaderContainer}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            transform: [{ rotate: spinAngle }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {/* Outer circle gradient */}
            <LinearGradient id="outerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#DB5C54" />
              <Stop offset="50%" stopColor="#914B96" />
              <Stop offset="100%" stopColor="#2D3269" />
            </LinearGradient>
            {/* Inner circle gradient */}
            <LinearGradient id="innerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#4E266E" />
              <Stop offset="50%" stopColor="#6C3E91" />
              <Stop offset="100%" stopColor="#7E53B0" />
            </LinearGradient>
          </Defs>
          {/* Outer Ring */}
          <Circle
            cx={center}
            cy={center}
            r={outerRadius}
            stroke="url(#outerGrad)"
            strokeWidth={outerWidth}
            fill="none"
          />
          {/* Inner Ring */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="url(#innerGrad)"
            strokeWidth={innerWidth}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export const FullScreenLoader = ({ size = 70, outerWidth = 5, innerWidth = 4 }) => {
  return (
    <View style={styles.fullScreen}>
      <GlobalLoader size={size} outerWidth={outerWidth} innerWidth={innerWidth} />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

export default GlobalLoader;
