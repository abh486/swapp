import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSelector, useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import * as Clarity from '@microsoft/react-native-clarity';

const { width } = Dimensions.get('window');
const PENDING_SUBSCRIPTION_KEY = '@pending_active_subscription';

const MembershipPlanModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { feed } = useSelector(state => state.home);
  const [activeTab, setActiveTab] = useState('Monthly');
  const [selectedTier, setSelectedTier] = useState(null);

  const tabs = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  const tiers = feed?.membership_tiers || [];

  const getTierColor = name => {
    switch (name.toUpperCase()) {
      case 'SILVER':
        return '#C0C0C0';
      case 'GOLD':
        return '#FFD700';
      case 'ELITE':
        return '#b873f0';
      default:
        return '#E74C3C';
    }
  };

  const getTierIcon = name => {
    switch (name.toUpperCase()) {
      case 'SILVER':
        return 'shield-checkmark';
      case 'GOLD':
        return 'trophy';
      case 'ELITE':
        return 'medal';
      default:
        return 'star';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.bottomSheet}>
          {/* Top Right Gradient Background */}
          <View style={styles.topRightGradientContainer}>
            <LinearGradient
              colors={['rgba(231,76,60,0.5)', 'rgba(0,0,0,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topRightGradient}
            />
          </View>

          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon
                name="close"
                size={20}
                color="#000"
                style={{ fontWeight: 'bold' }}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.titleContainer}>
              <View style={styles.topLine} />
              <Text style={styles.titleChoose}>Choose Your</Text>
              <Text style={styles.titleMembership}>Membership Plan</Text>
              <Text style={styles.subtitle}>Unlock Premium Swapp Access</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <LinearGradient
                colors={['#1a1a1a', '#0a0a0a']}
                style={styles.tabsBackground}
              >
                {tabs.map(tab => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={styles.tabButton}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </LinearGradient>
            </View>

            {/* Dynamic Tiers */}
            {tiers.length > 0 ? (
              tiers.map(tier => {
                const isSelected = selectedTier?.id === tier.id;
                return (
                  <TouchableOpacity
                    key={tier.id}
                    onPress={() => setSelectedTier(tier)}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={
                        tier.name.toUpperCase() === 'GOLD'
                          ? ['#2a1e05', '#0a0700']
                          : tier.name.toUpperCase() === 'ELITE'
                          ? ['#18052a', '#05000a']
                          : ['#1a1a1a', '#050505']
                      }
                      style={[
                        styles.planCard,
                        tier.name.toUpperCase() === 'GOLD' &&
                          styles.goldCardBorder,
                        isSelected && {
                          borderColor: getTierColor(tier.name),
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <View style={styles.planIconContainer}>
                        <Icon
                          name={getTierIcon(tier.name)}
                          size={60}
                          color={getTierColor(tier.name)}
                        />
                      </View>
                      <View style={styles.planDetails}>
                        <View style={styles.planHeaderRow}>
                          <Text
                            style={[
                              styles.planTitle,
                              { color: getTierColor(tier.name) },
                            ]}
                          >
                            {tier.name.toUpperCase()}
                          </Text>
                          <Text style={styles.planPrice}>
                            ₹{tier.price}{' '}
                            <Text style={styles.planPriceMonth}>/month</Text>
                          </Text>
                        </View>
                        {(tier.features || []).map((feature, idx) => (
                          <Text key={idx} style={styles.planFeature}>
                            {feature}
                          </Text>
                        ))}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ color: '#888', textAlign: 'center' }}>
                Loading plans...
              </Text>
            )}

            {/* Bottom Info */}
            <View style={styles.bottomInfoContainer}>
              <Text style={styles.bottomInfoText}>
                Flexible Plans Cancel Anytime No Hidden Charges Secure Payments
              </Text>
            </View>

            {/* Free Trial Offer */}
            <LinearGradient
              colors={['#1a1a1a', '#0a0a0a']}
              style={styles.offerContainer}
            >
              <Text style={styles.offerTitle}>
                🎁 1 Month Free Trial On All Plans
              </Text>
              <Text style={styles.offerSubtitle}>
                Cancel Anytime Before 28 May 2026
              </Text>
            </LinearGradient>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, !selectedTier && { opacity: 0.5 }]}
              disabled={!selectedTier}
              onPress={async () => {
                if (selectedTier) {
                  console.log('[Clarity] Subscription clicked');
                  try {
                    Clarity.sendCustomEvent('subscription_clicked');
                    Clarity.setCustomTag('clicked_plan', selectedTier ? selectedTier.name : 'Unknown');
                  } catch (e) {
                    console.error('[Clarity] Failed to send subscription_clicked:', e);
                  }
                  try {
                    const pendingSubscription = {
                      status: 'ACTIVE',
                      planName: selectedTier.name,
                      tier: selectedTier.name,
                      membershipTierName: selectedTier.name,
                      image: selectedTier.imageUrl,
                      isActive: true,
                    };
                    const response = await dispatch(
                      createCheckoutSession(selectedTier.id, 'MULTI_GYM'),
                    );
                    if (
                      response &&
                      response.success &&
                      response.data?.checkoutUrl
                    ) {
                      onClose();
                      navigation.navigate('CheckoutWebView', {
                        url: response.data.checkoutUrl,
                        planName: selectedTier.name,
                        price: selectedTier.price,
                        pendingSubscription,
                      });
                    } else {
                      Alert.alert(
                        'Error',
                        response?.message || 'Failed to initiate checkout.',
                      );
                    }
                  } catch (err) {
                    console.error('Checkout error:', err);
                  }
                }
              }}
            >
              <Text style={styles.actionButtonText}>
                {selectedTier
                  ? `Get ${selectedTier.name} Membership`
                  : 'Select a Membership Plan'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#000',
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  topRightGradientContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width,
    height: 300,
    opacity: 0.7,
  },
  topRightGradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  topLine: {
    width: 60,
    height: 2,
    backgroundColor: '#444',
    marginBottom: 20,
  },
  titleChoose: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 2,
  },
  titleMembership: {
    color: '#E74C3C',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
  },
  tabsContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  tabsBackground: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#333',
    width: '100%',
    justifyContent: 'space-between',
  },
  tabButton: {
    paddingVertical: 8,
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  planCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  goldCardBorder: {
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  planIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDetails: {
    flex: 1,
    marginLeft: 15,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  planPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planPriceMonth: {
    fontSize: 10,
    color: '#888',
    fontWeight: 'normal',
  },
  planFeature: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 4,
  },
  bottomInfoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  bottomInfoText: {
    color: '#666',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  offerContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 15,
  },
  offerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offerSubtitle: {
    color: '#888',
    fontSize: 10,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#0a0a0a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MembershipPlanModal;
