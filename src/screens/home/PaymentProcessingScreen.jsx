import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const PaymentProcessingScreen = ({ route, navigation }) => {
  const {
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
  } = route.params || {};
  const { refreshAuthStatus } = useAuth();

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
  const pollIntervalRef = useRef(null);

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

  // 2. Animate step transitions and verify payment via backend polling
  useEffect(() => {
    let isMounted = true;
    let pollCountLocal = 0;

    // Step 1: Secure Connection (instantly loads, takes 1.5s to succeed)
    setStep1Status('loading');

    const t1 = setTimeout(() => {
      if (!isMounted) return;
      setStep1Status('success');
      Animated.spring(bounce1, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Start Step 2: Verifying payment (starts polling)
      setStep2Status('loading');
      setActiveStep(1);

      // Start polling
      pollIntervalRef.current = setInterval(async () => {
        if (!isMounted) return;

        pollCountLocal += 1;
        console.log(`[PaymentProcessing] Polling verification attempt #${pollCountLocal}`);

        try {
          const resp = await apiClient.post('/subscriptions/sync');
          if (resp.data?.success && resp.data.data) {
            const userObj = resp.data.data.user;
            const subs = userObj?.subscriptions || [];
            
            // Check if there is an active subscription on the server
            const serverActiveSub = subs.find(sub => {
              const status = String(sub.status || sub.subscriptionStatus || '').toUpperCase();
              return !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(status);
            });

            if (serverActiveSub) {
              // Found active subscription! Stop polling.
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;

              // Step 2 Success
              setStep2Status('success');
              Animated.spring(bounce2, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
              }).start();

              // Start Step 3: Confirming details
              setStep3Status('loading');
              setActiveStep(2);

              // Wait 1.5s to finish step 3 visual transition
              setTimeout(async () => {
                if (!isMounted) return;
                setStep3Status('success');
                Animated.spring(bounce3, {
                  toValue: 1,
                  friction: 4,
                  tension: 40,
                  useNativeDriver: true,
                }).start();
                setActiveStep(3);

                // Wait 1s and replace screen
                setTimeout(async () => {
                  if (!isMounted) return;
                  await refreshAuthStatus?.();
                  navigation.replace('SubscriptionSuccess', {
                    planName,
                    price,
                    pendingSubscription,
                  });
                }, 1000);
              }, 1500);

              return;
            }
          }
        } catch (error) {
          console.warn('[PaymentProcessing] Polling error:', error?.message);
        }

        // Handle timeout (12 attempts * 2.5s = 30 seconds)
        if (pollCountLocal >= 12) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;

          Alert.alert(
            'Verification Pending',
            'We are still waiting for payment confirmation from Chargebee/your bank. If your payment went through, it will be updated in the background shortly.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
                  });
                },
              },
            ],
          );
        }
      }, 2500);

    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(t1);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Rotating Spinner */}
      <View style={styles.spinnerContainer}>
        <Animated.View
          style={[styles.spinnerRing, { transform: [{ rotate: spinAngle }] }]}
        >
          <View style={styles.spinnerGapCover} />
        </Animated.View>
      </View>

      {/* Processing Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Processing Payment</Text>
        <Text style={styles.subtitle}>
          Please wait while we confirm{'\n'}your transaction....
        </Text>
      </View>

      {/* Step Checklist List */}
      <View style={styles.checklistContainer}>
        {/* Step 1 */}
        <View style={[styles.checkRow, activeStep >= 0 && styles.activeRow]}>
          <Text
            style={[
              styles.checkLabel,
              step1Status === 'success' && styles.successLabel,
              step1Status === 'loading' && styles.loadingLabel,
            ]}
          >
            Secure connection
          </Text>
          {renderCheckmark(step1Status, bounce1)}
        </View>

        {/* Step 2 */}
        <View style={[styles.checkRow, activeStep >= 1 && styles.activeRow]}>
          <Text
            style={[
              styles.checkLabel,
              step2Status === 'success' && styles.successLabel,
              step2Status === 'loading' && styles.loadingLabel,
            ]}
          >
            Verifying payment
          </Text>
          {renderCheckmark(step2Status, bounce2)}
        </View>

        {/* Step 3 */}
        <View style={[styles.checkRow, activeStep >= 2 && styles.activeRow]}>
          <Text
            style={[
              styles.checkLabel,
              step3Status === 'success' && styles.successLabel,
              step3Status === 'loading' && styles.loadingLabel,
            ]}
          >
            Confirming details
          </Text>
          {renderCheckmark(step3Status, bounce3)}
        </View>
      </View>

      {/* Footer Secure Info */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>
          This is a secure 256-bit encrypted payment
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
  },
  spinnerContainer: {
    marginTop: 60,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: '#2ecc71',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerGapCover: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#000',
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  checklistContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    opacity: 0.3,
  },
  activeRow: {
    opacity: 1,
  },
  checkLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 18,
    fontWeight: '500',
  },
  successLabel: {
    color: '#FFF',
  },
  loadingLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loadingDotContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDotSpin: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallSpinnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71',
    position: 'absolute',
    top: 0,
  },
  successCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
});

export default PaymentProcessingScreen;
