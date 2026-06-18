import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { getPlans, createCheckout, activateTrial, getSubscriptionDetails } from '../services/aiDieticianService';

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

const AIDieticianPaywallScreen = ({ navigation, onUnlock }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    const initScreen = async () => {
      try {
        const [plansData, subData] = await Promise.all([
          getPlans(),
          getSubscriptionDetails()
        ]);
        setPlans(plansData || []);
        if (plansData && plansData.length > 0) {
          setSelectedPlan(plansData[0]);
        }
        setSubscriptionDetails(subData && subData.accessSource ? subData : null);
      } catch (err) {
        console.error('[AIDieticianPaywall] Failed to initialize paywall:', err);
        Alert.alert('Error', 'Failed to load subscription details.');
      } finally {
        setLoading(false);
      }
    };
    initScreen();
  }, []);

  const handleStartTrial = async () => {
    setIsSubmitting(true);
    try {
      await activateTrial();
      Alert.alert('Success', 'Your 7-day free trial has been activated!');
      if (onUnlock) {
        onUnlock();
      } else {
        navigation.navigate('MainTabs', { screen: 'Diet' });
      }
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

        navigation.navigate('CheckoutWebView', {
          url: res.checkoutUrl,
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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        {!onUnlock ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Icon name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>AI Dietician Premium</Text>
        <View style={{ width: 24 }} />
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
        {!subscriptionDetails && (
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.trialCard}>
            <Text style={styles.trialTitle}>🎁 Free Trial Available</Text>
            <Text style={styles.trialSubtitle}>Try AI Dietician features free for 7 days.</Text>
            <TouchableOpacity
              style={styles.trialButton}
              onPress={handleStartTrial}
              disabled={isSubmitting}
            >
              <Text style={styles.trialButtonText}>Start Free 7-Day Trial</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        <Text style={styles.sectionTitle}>Choose Subscription Plan</Text>

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
                colors={isSelected ? ['#18052a', '#05000a'] : ['#1a1a1a', '#050505']}
                style={styles.planGradient}
              >
                <View style={styles.planHeader}>
                  <Text style={[styles.planName, isSelected && { color: '#b873f0' }]}>
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

      {/* Sticky Subscribe Button at Bottom */}
      <View style={styles.bottomButtonContainer}>
        {subscriptionDetails?.accessSource === 'SUBSCRIPTION' ? (
          <View style={styles.activeSubInfo}>
            <Icon name="checkmark-circle" size={20} color="#2ecc71" style={{ marginRight: 8 }} />
            <Text style={styles.activeSubText}>
              Your plan ends on {formatDate(subscriptionDetails.currentTermEnd)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.subscribeButton, !selectedPlan && { opacity: 0.5 }]}
            onPress={handleSubscribe}
            disabled={!selectedPlan || isSubmitting}
          >
            <Text style={styles.subscribeButtonText}>
              {isSubmitting ? 'Processing...' : 'Subscribe Now'}
            </Text>
          </TouchableOpacity>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  closeButton: {
    padding: 4,
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
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    alignItems: 'center',
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
    borderColor: '#b873f0',
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
});

export default AIDieticianPaywallScreen;
