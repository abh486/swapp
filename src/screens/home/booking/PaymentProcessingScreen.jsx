import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import { useResponsiveMetrics } from '../../../utils/responsive';

const PaymentProcessingScreen = ({ route, navigation }) => {
  const {
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
  } = route.params || {};
  const { refreshAuthStatus } = useAuth();
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(metrics, insets), [metrics, insets]);

  // Step state: 0 = secure connection, 1 = verifying, 2 = confirming, 3 = done
  const [activeStep, setActiveStep] = useState(0);
  const [step1Status, setStep1Status] = useState('pending'); // pending, loading, success
  const [step2Status, setStep2Status] = useState('pending');
  const [step3Status, setStep3Status] = useState('pending');

  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const bounce1 = useRef(new Animated.Value(0)).current;
  const bounce2 = useRef(new Animated.Value(0)).current;
  const bounce3 = useRef(new Animated.Value(0)).current;

  // 1. Rotate loading spinner continuously
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinValue]);

  // 2. Animate step transitions sequentially
  useEffect(() => {
    // Step 1: Secure Connection (instantly loads, takes 1.2s to succeed)
    setStep1Status('loading');

    const t1 = setTimeout(() => {
      setStep1Status('success');
      // Trigger checkmark pop animation
      Animated.spring(bounce1, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Start Step 2
      setStep2Status('loading');
      setActiveStep(1);
    }, 1500);

    // Step 2: Verifying Payment (starts after step 1 succeeds, takes 1.5s to succeed)
    const t2 = setTimeout(() => {
      setStep2Status('success');
      Animated.spring(bounce2, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Start Step 3
      setStep3Status('loading');
      setActiveStep(2);
    }, 3200);

    // Step 3: Confirming Details (starts after step 2 succeeds, takes 1.5s to succeed)
    const t3 = setTimeout(() => {
      setStep3Status('success');
      Animated.spring(bounce3, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      setActiveStep(3);
    }, 4900);

    // Final navigation to Congratulations screen (starts after step 3 succeeds)
    const t4 = setTimeout(async () => {
      await refreshAuthStatus?.();
      navigation.replace('SubscriptionSuccess', {
        planName,
        price,
        pendingSubscription,
      });
    }, 5900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [planName, price, pendingSubscription, navigation, refreshAuthStatus]);

  // Interpolate rotation angle
  const spinAngle = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper to render checkmark icons with dynamic status styles
  const renderCheckmark = (status, bounceAnim) => {
    if (status === 'success') {
      return (
        <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
          <View style={styles.successCheckCircle}>
            <Icon name="checkmark-sharp" size={16} color="#FFF" />
          </View>
        </Animated.View>
      );
    }
    if (status === 'loading') {
      return (
        <View style={styles.loadingDotContainer}>
          <Animated.View
            style={[
              styles.loadingDotSpin,
              { transform: [{ rotate: spinAngle }] },
            ]}
          >
            <View style={styles.smallSpinnerDot} />
          </Animated.View>
        </View>
      );
    }
    return <View style={styles.emptyCircle} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[styles.spinnerRing, { transform: [{ rotate: spinAngle }] }]}
          >
            <View style={styles.spinnerGapCover} />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>
            Processing Payment
          </Text>
          <Text style={styles.subtitle}>
            Please wait while we confirm{'\n'}your transaction....
          </Text>
        </View>

        <View style={styles.checklistContainer}>
          <View style={[styles.checkRow, activeStep >= 0 && styles.activeRow]}>
            <Text
              style={[
                styles.checkLabel,
                step1Status === 'success' && styles.successLabel,
                step1Status === 'loading' && styles.loadingLabel,
              ]}
              numberOfLines={2}
            >
              Secure connection
            </Text>
            {renderCheckmark(step1Status, bounce1)}
          </View>

          <View style={[styles.checkRow, activeStep >= 1 && styles.activeRow]}>
            <Text
              style={[
                styles.checkLabel,
                step2Status === 'success' && styles.successLabel,
                step2Status === 'loading' && styles.loadingLabel,
              ]}
              numberOfLines={2}
            >
              Verifying payment
            </Text>
            {renderCheckmark(step2Status, bounce2)}
          </View>

          <View style={[styles.checkRow, activeStep >= 2 && styles.activeRow]}>
            <Text
              style={[
                styles.checkLabel,
                step3Status === 'success' && styles.successLabel,
                step3Status === 'loading' && styles.loadingLabel,
              ]}
              numberOfLines={2}
            >
              Confirming details
            </Text>
            {renderCheckmark(step3Status, bounce3)}
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            This is a secure 256-bit encrypted payment
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({ fs, sp, ms, isLandscape, maxContentWidth }, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: isLandscape ? 'flex-start' : 'space-around',
    paddingHorizontal: sp(30),
    paddingTop: sp(isLandscape ? 18 : 36),
    paddingBottom: Math.max(insets.bottom, sp(18)) + sp(16),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  spinnerContainer: {
    marginTop: sp(isLandscape ? 8 : 24),
    width: ms(isLandscape ? 112 : 140),
    height: ms(isLandscape ? 112 : 140),
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    width: ms(isLandscape ? 96 : 120),
    height: ms(isLandscape ? 96 : 120),
    borderRadius: ms(isLandscape ? 48 : 60),
    borderWidth: ms(6),
    borderColor: '#2ecc71',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerGapCover: {
    width: ms(isLandscape ? 84 : 108),
    height: ms(isLandscape ? 84 : 108),
    borderRadius: ms(isLandscape ? 42 : 54),
    backgroundColor: '#000',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: sp(10),
  },
  title: {
    fontSize: fs(24),
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: sp(10),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: fs(16),
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: fs(22),
  },
  checklistContainer: {
    width: '100%',
    paddingHorizontal: sp(20),
    marginVertical: sp(10),
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sp(16),
    gap: sp(14),
    opacity: 0.3,
  },
  activeRow: {
    opacity: 1,
  },
  checkLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: fs(18),
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  successLabel: {
    color: '#FFF',
  },
  loadingLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyCircle: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingDotContainer: {
    width: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDotSpin: {
    width: ms(24),
    height: ms(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallSpinnerDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: '#2ecc71',
    position: 'absolute',
    top: 0,
  },
  successCheckCircle: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    // Glossy overlay styling
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 4,
  },
  footerContainer: {
    marginBottom: sp(4),
  },
  footerText: {
    fontSize: fs(12),
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});

export default PaymentProcessingScreen;
