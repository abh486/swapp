import { GlobalLoader } from '../../../components/GlobalLoader';
import React, { useState, useRef, useEffect } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Text, Alert, Platform, Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import Chargebee from '@chargebee/react-native-chargebee';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../context/AuthContext';
import * as Clarity from '../../../utils/clarity';

const CheckoutBrowserScreen = ({ route, navigation }) => {
  const {
    url,
    planId,
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
    reservationId = null,
    isNativeIAP = false,
  } = route.params || {};

  const { user } = useAuth();
  const successHandledRef = useRef(false);
  const [browserOpened, setBrowserOpened] = useState(false);
  const [statusText, setStatusText] = useState('Initiating secure purchase...');

  useEffect(() => {
    console.log('[Clarity] Checkout started. Plan ID:', planId, 'isNativeIAP:', isNativeIAP);
    try {
      Clarity.sendCustomEvent('checkout_started');
      if (planId) {
        Clarity.setCustomTag('checkout_plan_id', planId);
      }
    } catch (e) {
      console.error('[Clarity] Failed to send checkout_started:', e);
    }
  }, [planId, isNativeIAP]);

  const handleCallbackUrl = (currentUrl) => {
    console.log('[Checkout] Processing web callback URL:', currentUrl);
    
    const isSuccess =
      currentUrl.includes('/checkout-success') ||
      currentUrl.includes('subscription=success') ||
      currentUrl.includes('success') ||
      currentUrl.includes('thank_you') ||
      currentUrl.includes('thank-you') ||
      currentUrl.includes('thankyou') ||
      currentUrl.includes('localhost:') ||
      currentUrl.includes('ngrok-free.dev');

    const isCancel =
      currentUrl.includes('subscription=cancel') ||
      currentUrl.includes('cancel');

    if (isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;
      console.log(
        '[Checkout] Success URL detected! Transitioning to Payment Processing Screen.',
      );
      let hostedPageId = null;
      const match = currentUrl.match(/[?&]id=([^&]+)/);
      if (match) {
        hostedPageId = match[1];
      }
      navigation.replace('PaymentProcessing', {
        planName,
        price,
        pendingSubscription,
        reservationId,
        hostedPageId,
      });
    } else if (isCancel) {
      console.log('[Checkout] Cancel URL detected. Going back.');
      navigation.goBack();
    } else {
      console.log('[Checkout] Callback did not match success or cancel. Going back.');
      navigation.goBack();
    }
  };

  const startInAppBrowserCheckout = async (reason) => {
    if (browserOpened) return;
    setBrowserOpened(true);
    setStatusText('Opening secure browser...');
    console.log(`[Checkout] Launching InAppBrowser checkout. Reason: ${reason}`);

    try {
      if (await InAppBrowser.isAvailable()) {
        const redirectUrl = 'swapp://';
        const result = await InAppBrowser.openAuth(url, redirectUrl, {
          ephemeralWebSession: false,
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        });

        if (result.type === 'success' && result.url) {
          console.log('[Checkout] InAppBrowser callback received:', result.url);
          handleCallbackUrl(result.url);
        } else {
          console.log('[Checkout] InAppBrowser flow cancelled or closed. Result type:', result.type);
          navigation.goBack();
        }
      } else {
        console.log('[Checkout] InAppBrowser not available. Falling back to Linking.');
        Linking.openURL(url);
        navigation.goBack();
      }
    } catch (e) {
      console.error('🔴 [Checkout] InAppBrowser failed:', e.message);
      Alert.alert('Error', 'Failed to open secure checkout page.');
      navigation.goBack();
    } finally {
      setBrowserOpened(false);
    }
  };

  const startCheckout = async () => {
    if (!isNativeIAP) {
      await startInAppBrowserCheckout('Standard partner/gym package checkout (web)');
      return;
    }

    if (!planId) {
      await startInAppBrowserCheckout('Native IAP requested but planId was missing');
      return;
    }

    try {
      setStatusText('Contacting App Store...');
      
      const customer = {
        id: user?.id || user?.userProfile?.id || '',
        email: user?.email || user?.userProfile?.email || '',
        firstName: user?.firstName || user?.userProfile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || '',
        lastName: user?.lastName || user?.userProfile?.name?.split(' ').slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || '',
      };

      console.log('[Checkout] Initiating native Chargebee purchase for product ID:', planId);
      
      // Native Chargebee Purchase
      const result = await Chargebee.purchaseProduct(planId, customer);
      
      console.log('[Checkout] Native Chargebee purchase result:', result);
      
      if (result && result.subscriptionId) {
        successHandledRef.current = true;
        console.log('[Checkout] Native purchase successful! Redirecting to processing screen.');
        
        navigation.replace('PaymentProcessing', {
          planName,
          price,
          pendingSubscription,
          reservationId,
          hostedPageId: result.subscriptionId,
        });
      } else {
        throw new Error('Native purchase returned an invalid or empty subscriptionId.');
      }

    } catch (error) {
      console.error('[Checkout] Native purchase failed or threw error:', error);
      
      // Check if user cancelled the StoreKit payment sheet explicitly so we don't force open the browser
      const isUserCancel = 
        error?.message?.includes('user') || 
        error?.message?.includes('cancel') || 
        error?.message?.includes('cancelled') ||
        error?.code === 'E_USER_CANCELLED';

      if (isUserCancel) {
        console.log('[Checkout] User explicitly cancelled native App Store payment sheet. Navigating back.');
        navigation.goBack();
      } else {
        // Otherwise, fallback gracefully to the web checkout URL
        await startInAppBrowserCheckout(`Native purchase error: ${error.message || error}`);
      }
    }
  };

  useEffect(() => {
    startCheckout();
  }, [url, planId, isNativeIAP]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Subscription Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.loaderContainer}>
        <GlobalLoader size={60} />
        <Text style={styles.loadingText}>{statusText}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={startCheckout}>
          <Text style={styles.retryButtonText}>Retry Purchase</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C3E',
    backgroundColor: '#1E1E2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#1E1E2A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: '#AAA',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4d94ff',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CheckoutBrowserScreen;
