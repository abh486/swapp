import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
  BackHandler,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getPlans, createCheckout, activateTrial, getSubscriptionDetails, getAccessStatus } from '../../../services/aiDieticianService';
import { useAuth } from '../../../context/AuthContext';
import Chargebee from '@chargebee/react-native-chargebee';
import { FullScreenLoader } from '../../../components/GlobalLoader';

const { width } = Dimensions.get('window');

const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const AIDieticianPaywallScreen = ({ navigation, route, onUnlock }) => {
  const { user, refreshAuthStatus } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const initScreen = async () => {
      try {
        const [plansData, subData, accessData] = await Promise.all([
          getPlans(),
          getSubscriptionDetails(),
          getAccessStatus()
        ]);
        setPlans(plansData || []);
        if (plansData && plansData.length > 0) {
          setSelectedPlan(plansData[0]);
        }
        setSubscriptionDetails(subData && subData.accessSource ? subData : null);
        setHasAccess(!!(accessData && accessData.hasAccess));
      } catch (err) {
        console.error('[AIDieticianPaywall] Failed to initialize paywall:', err);
        Alert.alert('Error', 'Failed to load subscription details.');
      } finally {
        setLoading(false);
      }
    };
    initScreen();
  }, []);

  useEffect(() => {
    const fromDietTab = route.params?.fromDietTab;
    if (fromDietTab) {
      const backAction = () => {
        navigation.navigate('MainTabs', { screen: 'Home' });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', (e) => {
        if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
          e.preventDefault();
          navigation.navigate('MainTabs', { screen: 'Home' });
        }
      });

      return () => {
        backHandler.remove();
        unsubscribeBeforeRemove();
      };
    }
  }, [route.params, navigation]);

  const handleClose = () => {
    if (route.params?.fromDietTab) {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }
    }
  };

  const handleStartTrial = async () => {
    setIsSubmitting(true);
    try {
      await activateTrial();
      try {
        await refreshAuthStatus?.();
      } catch (refreshErr) {
        console.warn('Failed to refresh auth status after trial activation:', refreshErr);
      }
      Alert.alert(
        'Success',
        'Your 7-day free trial has been activated!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              if (onUnlock) {
                onUnlock();
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs', params: { screen: 'Diet' } }],
                });
              }
            },
          },
        ]
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not activate trial.';
      Alert.alert('Trial Activation Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      const res = await createCheckout(selectedPlan.id);
      if (res && res.checkoutUrl) {
        const pendingSubscription = {
          status: 'in_trial',
          planName: selectedPlan.name,
          tier: 'Premium',
          membershipTierName: selectedPlan.name,
          image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400',
          isActive: true,
          productCode: 'AI_DIETICIAN',
        };

        navigation.navigate('CheckoutBrowser', {
          url: res.checkoutUrl,
          planId: selectedPlan.id,
          isNativeIAP: true,
          planName: selectedPlan.name,
          price: selectedPlan.price || '999',
          pendingSubscription,
        });
      } else {
        Alert.alert('Error', 'Could not initiate checkout.');
      }
    } catch (err) {
      console.error('[AIDieticianPaywall] Checkout failed:', err);
      Alert.alert('Checkout Failed', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsSubmitting(true);
    try {
      console.log('[AIDieticianPaywall] Restoring purchases...');
      const customer = {
        id: user?.id || user?.userProfile?.id || '',
        email: user?.email || user?.userProfile?.email || '',
        firstName: user?.firstName || user?.userProfile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || '',
        lastName: user?.lastName || user?.userProfile?.name?.split(' ').slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || '',
      };

      const restoredSubscriptions = await Chargebee.restorePurchases(true, customer);
      console.log('[AIDieticianPaywall] Restored subscriptions:', restoredSubscriptions);

      await refreshAuthStatus?.();

      Alert.alert(
        'Restore Completed',
        'Your purchases have been successfully restored. If you have an active subscription, your access is now unlocked.',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (err) {
      console.error('[AIDieticianPaywall] Restore failed:', err);
      Alert.alert('Restore Failed', err.message || 'Could not restore purchases from the App Store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        {!onUnlock ? (
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.75}>
            <Icon name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
        <Text style={styles.headerTitle}>AI Dietician Premium</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title / Description */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleChoose}>Unlock Your Personal</Text>
          <Text style={styles.titleMembership}>AI Dietician</Text>
          <Text style={styles.subtitle}>Get customized meal plans & instant scan insights</Text>
        </View>

        {/* AI Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="camera-outline" size={22} color="#e74c3c" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Instant Food Scanner</Text>
              <Text style={styles.featureDesc}>Snap a photo of your food to instantly detect items and calculate accurate calories & macro nutrients.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="restaurant-outline" size={22} color="#e74c3c" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Tailored Diet Suggestions</Text>
              <Text style={styles.featureDesc}>Receive personalized meal recommendations and calorie targets customized for your goals.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="stats-chart-outline" size={22} color="#e74c3c" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Daily Macro Dashboard</Text>
              <Text style={styles.featureDesc}>Track proteins, carbs, fats, and water intake limits with interactive, user-friendly graphs.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Icon name="chatbubbles-outline" size={22} color="#e74c3c" />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>24/7 AI Nutrition Coach</Text>
              <Text style={styles.featureDesc}>Ask questions and get immediate expert advice on healthy alternatives, ingredients, or food swapping.</Text>
            </View>
          </View>
        </View>

        {/* Trial Card */}
        {!hasAccess && !subscriptionDetails && (
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.trialCard}>
            <View style={styles.trialCardInner}>
              <Text style={styles.trialTitle}>🎁 Free Trial Available</Text>
              <Text style={styles.trialSubtitle}>Try AI Dietician features free for 7 days.</Text>
              <TouchableOpacity
                style={styles.trialButton}
                onPress={handleStartTrial}
                disabled={isSubmitting}
              >
                <Text style={styles.trialButtonText}>Start Free 7-Day Trial</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}


        {/* Plans List */}
        {plans.map((plan) => {
          const isSelected = selectedPlan?.id === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.selectedPlanCard]}
              onPress={() => setSelectedPlan(plan)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isSelected ? ['#EE822A', '#8F5D98', '#2E4D9F'] : ['#1a1a1a', '#050505']}
                style={styles.planGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, isSelected && { color: '#EE822A' }]}>
                    {plan.name.toUpperCase()}
                  </Text>
                  <Text style={styles.planPrice}>
                    ₹{plan.price || '999'}<Text style={styles.planPeriod}>/mo</Text>
                  </Text>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
                {plan.features && (
                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Icon name="checkmark-circle-outline" size={14} color="#e74c3c" style={{ marginRight: 6 }} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Container */}
      <View style={styles.bottomButtonContainer}>
        {subscriptionDetails?.accessSource === 'SUBSCRIPTION' ? (
          <View style={styles.activeSubInfo}>
            <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginRight: 8 }} />
            <Text style={styles.activeSubText}>
              Your plan ends on {formatDate(subscriptionDetails.currentTermEnd)}
            </Text>
          </View>
        ) : (
          Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.restoreLink}
              onPress={handleRestorePurchases}
              disabled={isSubmitting}
            >
              <Text style={styles.restoreLinkText}>Restore Purchases</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  titleChoose: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 1,
  },
  titleMembership: {
    color: '#E74C3C',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  trialCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    overflow: 'hidden',
  },
  trialCardInner: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  trialTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  trialSubtitle: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  trialButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  trialButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedPlanCard: {
    borderColor: '#2E4D9F',
    borderWidth: 2,
  },
  planGradient: {
    padding: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planPeriod: {
    fontSize: 12,
    color: '#888',
  },
  planDescription: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 12,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    color: '#DDD',
    fontSize: 11,
  },
  subscribeButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
    paddingTop: 10,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  featuresSection: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  activeSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeSubText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  restoreLink: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 4,
  },
  restoreLinkText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});

export default AIDieticianPaywallScreen;
