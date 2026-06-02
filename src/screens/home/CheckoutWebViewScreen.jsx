import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useRef, useEffect } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Text, Alert} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Clarity from '@microsoft/react-native-clarity';

const CheckoutWebViewScreen = ({ route, navigation }) => {
  const {
    url,
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
  } = route.params || {};
  const [loading, setLoading] = useState(true);
  const successHandledRef = useRef(false);

  useEffect(() => {
    console.log('[Clarity] Checkout started');
    try {
      Clarity.sendCustomEvent('checkout_started');
    } catch (e) {
      console.error('[Clarity] Failed to send checkout_started:', e);
    }
  }, []);

  const handleNavigationStateChange = navState => {
    const currentUrl = navState.url;
    console.log('[CheckoutWebView] Navigating to:', currentUrl);

    // Detect redirect to success/thank you/localhost page or ngrok/swapp domains
    const isSuccess =
      currentUrl.includes('/checkout-success') ||
      currentUrl.includes('success') ||
      currentUrl.includes('thank_you') ||
      currentUrl.includes('thank-you') ||
      currentUrl.includes('thankyou') ||
      currentUrl.includes('localhost:5000') ||
      currentUrl.includes('localhost:') ||
      currentUrl.includes('ngrok-free.dev');

    if (isSuccess && !successHandledRef.current) {
      successHandledRef.current = true;
      console.log(
        '[CheckoutWebView] Success URL detected! Transitioning to Payment Processing Screen.',
      );
      navigation.replace('PaymentProcessing', {
        planName,
        price,
        pendingSubscription,
      });
    }
  };

  const handleShouldStartLoadWithRequest = request => {
    const currentUrl = request.url;
    console.log('[CheckoutWebView] ShouldStartLoadWithRequest:', currentUrl);

    // Always allow about: and data: URLs as they are used internally/inline by WebViews
    if (currentUrl.startsWith('about:') || currentUrl.startsWith('data:')) {
      return true;
    }

    // Intercept custom deep link schemes (like swapp://)
    if (
      currentUrl.startsWith('swapp://') ||
      (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://'))
    ) {
      console.log('[CheckoutWebView] Custom URL Scheme detected:', currentUrl);

      const isSuccess =
        currentUrl.includes('subscription=success') ||
        currentUrl.includes('success');
      const isCancel =
        currentUrl.includes('subscription=cancel') ||
        currentUrl.includes('cancel');

      if (isSuccess && !successHandledRef.current) {
        successHandledRef.current = true;
        console.log(
          '[CheckoutWebView] Deep link Success! Transitioning to Payment Processing Screen.',
        );
        navigation.replace('PaymentProcessing', {
          planName,
          price,
          pendingSubscription,
        });
      } else if (isCancel) {
        console.log('[CheckoutWebView] Deep link Cancelled! Going back.');
        navigation.goBack();
      }

      return false; // Prevent WebView from trying to load this custom scheme
    }

    return true; // Allow loading standard HTTP/HTTPS links
  };

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

      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: url }}
          originWhitelist={['*']}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <GlobalLoader size={60} />
            </View>
          )}
        />
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
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#1E1E2A',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1E2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckoutWebViewScreen;
