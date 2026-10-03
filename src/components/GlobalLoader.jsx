import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export const GlobalLoader = ({
  size = 70,
  outerWidth,
  innerWidth,
  style,
  text,
  subtext,
}) => {
  // Normalize size if strings like 'large' or 'small' are passed
  const numericSize =
    typeof size === 'number'
      ? size
      : size === 'small'
      ? 24
      : size === 'large'
      ? 50
      : 50;

  const strokeOuter =
    outerWidth !== undefined
      ? outerWidth
      : Math.max(2, Math.round(numericSize * 0.075));
  const strokeInner =
    innerWidth !== undefined
      ? innerWidth
      : Math.max(1.5, Math.round(numericSize * 0.055));

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

  const center = numericSize / 2;
  const outerRadius = Math.max(2, numericSize / 2 - strokeOuter / 2 - 2);
  const innerRadius = Math.max(2, outerRadius - strokeOuter - numericSize * 0.08);

  return (
    <View style={[styles.loaderContainer, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: numericSize,
            height: numericSize,
            transform: [{ rotate: spinAngle }],
          },
        ]}
      >
        <Svg width={numericSize} height={numericSize} viewBox={`0 0 ${numericSize} ${numericSize}`}>
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
            strokeWidth={strokeOuter}
            fill="none"
          />
          {/* Inner Ring */}
          <Circle
            cx={center}
            cy={center}
            r={innerRadius}
            stroke="url(#innerGrad)"
            strokeWidth={strokeInner}
            fill="none"
          />
        </Svg>
      </Animated.View>
      {Boolean(text) && <Text style={styles.loaderText}>{text}</Text>}
      {Boolean(subtext) && <Text style={styles.loaderSubtext}>{subtext}</Text>}
    </View>
  );
};

export const FullScreenLoader = ({
  size = 70,
  outerWidth,
  innerWidth,
  style,
  text,
  subtext,
  backgroundColor = '#000000',
}) => {
  return (
    <View style={[styles.fullScreen, { backgroundColor }, style]}>
      <GlobalLoader
        size={size}
        outerWidth={outerWidth}
        innerWidth={innerWidth}
        text={text}
        subtext={subtext}
      />
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loaderSubtext: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default GlobalLoader;
