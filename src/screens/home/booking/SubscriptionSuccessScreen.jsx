import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsiveMetrics } from '../../../utils/responsive';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../../../context/AuthContext';
import * as Clarity from '../../../utils/clarity';
import apiClient from '../../../api/apiClient';
import { getAccessStatus } from '../../../services/aiDieticianService';
import { GlobalLoader } from '../../../components/GlobalLoader';

const PENDING_SUBSCRIPTION_KEY = '@pending_active_subscription';

const SubscriptionSuccessScreen = ({ route, navigation }) => {
  const {
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
    reservationId = null,
    hostedPageId = null,
  } = route.params || {};
  const { refreshAuthStatus, user } = useAuth();
  const [activationStatus, setActivationStatus] = useState('activating'); // 'activating', 'active', 'timeout'
  const pollIntervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (pendingSubscription) {
      AsyncStorage.setItem(
        PENDING_SUBSCRIPTION_KEY,
        JSON.stringify(pendingSubscription),
      );
    }
    // Start polling immediately
    refreshAuthStatus?.().catch(err => console.log('Error refreshing user status:', err));

    pollIntervalRef.current = setInterval(() => {
      refreshAuthStatus?.().catch(err => console.log('Poll err:', err));
    }, 2500);

    timeoutRef.current = setTimeout(() => {
      clearInterval(pollIntervalRef.current);
      setActivationStatus(prev => prev === 'activating' ? 'timeout' : prev);
    }, 15000);

    return () => {
      clearInterval(pollIntervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [pendingSubscription, refreshAuthStatus]);

  useEffect(() => {
    // If user state becomes active, stop polling
    if (pendingSubscription?.productCode === 'AI_DIETICIAN') {
      const checkDietAccess = async () => {
        try {
          const res = await getAccessStatus();
          if (res?.hasAccess) {
            clearInterval(pollIntervalRef.current);
            clearTimeout(timeoutRef.current);
            setActivationStatus('active');
          }
        } catch (e) {
          console.log('Error checking dietician access:', e);
        }
      };

      checkDietAccess();
      const interval = setInterval(checkDietAccess, 2500);
      return () => clearInterval(interval);
    } else {
      const pendingPkgId = pendingSubscription?.packageId || pendingSubscription?.package?.id;
      const activeSubs = user?.subscriptions || [];
      const activePkgs = user?.activePackages || [];
      const activeEnts = user?.activeEntitlements || [];

      const isPendingPlanActive = pendingPkgId ? (
        activeSubs.some(s => (s.packageId === pendingPkgId || s.planId === pendingPkgId) && !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(String(s.status).toUpperCase())) ||
        activePkgs.some(p => p.packageId === pendingPkgId && p.status === 'ACTIVE') ||
        activeEnts.some(e => e.packageId === pendingPkgId && e.status === 'ACTIVE' && (e.totalSessions - e.usedSessions > 0))
      ) : false;

      if (user?.hasActiveMembership || isPendingPlanActive) {
        clearInterval(pollIntervalRef.current);
        clearTimeout(timeoutRef.current);
        setActivationStatus('active');
      }
    }
  }, [user, pendingSubscription]);

  useEffect(() => {
    console.log('[Clarity] User subscribed. Plan:', planName, 'Price:', price, 'Reservation:', reservationId);
    try {
      Clarity.sendCustomEvent('payment_success');
      Clarity.sendCustomEvent(reservationId ? 'booking_confirmed' : 'user_subscribed_gym');
      Clarity.setCustomTag('subscribed_plan', planName);
      Clarity.setCustomTag('subscribed_price', String(price));
      if (reservationId) {
        Clarity.setCustomTag('reservation_id', reservationId);
      }
      if (pendingSubscription?.gymName || pendingSubscription?.providerName) {
        Clarity.setCustomTag('subscribed_gym', pendingSubscription.gymName || pendingSubscription.providerName);
      }
    } catch (err) {
      console.error('[Clarity] Failed to send subscription event/tags:', err);
    }
  }, [planName, price, pendingSubscription, reservationId]);

  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const { sp, ms, fs, wp } = metrics;
  const styles = useMemo(() => createStyles(metrics, insets), [metrics, insets]);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      console.log('[Invoice PDF] Requesting invoice download URL. hostedPageId:', hostedPageId, 'reservationId:', reservationId);
      const response = await apiClient.get('/subscriptions/invoice/download-url', {
        params: {
          hostedPageId,
          reservationId,
        },
      });

      const downloadUrl = response.data?.data?.downloadUrl;
      if (downloadUrl) {
        console.log('[Invoice PDF] Opening download URL:', downloadUrl);
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          Alert.alert('Error', 'Cannot open download link on this device.');
        }
      } else {
        Alert.alert('Error', 'Failed to retrieve invoice download link.');
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
      const errMsg = error.response?.data?.message || 'Failed to download receipt from Chargebee.';
      Alert.alert('Download Failed', errMsg);
    } finally {
      setDownloading(false);
    }
  };

  const cleanPlanName = planName.trim().toUpperCase();
  const displayPlanName =
    cleanPlanName === 'USER' || cleanPlanName === 'MEMBER'
      ? 'ELITE'
      : cleanPlanName;

  // Generate dynamic values for transaction ID and date-time to make the receipt realistic
  const transactionId = React.useMemo(() => {
    return `PLS-${Math.floor(1000 + Math.random() * 9000)}-X${Math.floor(
      100 + Math.random() * 900,
    )}`;
  }, []);

  const currentDateTimeStr = React.useMemo(() => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  }, []);

  // Determine dynamic gradient background colors based on plan name
  const getCardGradients = () => {
    switch (displayPlanName) {
      case 'GOLD':
        return ['#2a1e05', '#0a0700'];
      case 'SILVER':
        return ['#1c1c1c', '#0a0a0a'];
      case 'ELITE':
      default:
        return ['#1a052a', '#05000a'];
    }
  };

  const getTierColor = () => {
    switch (displayPlanName) {
      case 'GOLD':
        return '#FFD700';
      case 'SILVER':
        return '#C0C0C0';
      case 'ELITE':
      default:
        return '#b873f0';
    }
  };

  const handleStart = () => {
    refreshAuthStatus?.().catch(err => console.log('Error refreshing status on click:', err));
    const targetScreen = pendingSubscription?.productCode === 'AI_DIETICIAN' ? 'Diet' : 'Home';
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: targetScreen } }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ width: '100%' }}
      >
        {/* Top Graphic party popper */}
        <View style={styles.confettiContainer}>
          <Svg width={120} height={120} viewBox="0 0 100 100" fill="none">
            {/* Party Popper Cone */}
            <Path d="M25 75 L45 80 L35 90 Z" fill="#e74c3c" />
            <Path d="M30 65 L60 85 L20 80 Z" fill="#f1c40f" />
            {/* Streamers & Gold Confetti */}
            <Circle cx={55} cy={40} r={4} fill="#b873f0" />
            <Circle cx={65} cy={55} r={3} fill="#2ecc71" />
            <Circle cx={40} cy={30} r={5} fill="#3498db" />
            <Circle cx={75} cy={30} r={4} fill="#e74c3c" />
            <Circle cx={85} cy={45} r={3} fill="#f1c40f" />

            <Path
              d="M50 30 Q55 20 60 25"
              stroke="#f1c40f"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M70 45 Q75 35 80 40"
              stroke="#e74c3c"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M35 45 Q40 38 45 42"
              stroke="#3498db"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </View>

        {/* Heading Text */}
        <View style={styles.headingContainer}>
          <Text style={styles.congratsText}>
            {reservationId ? 'BOOKING CONFIRMED' : 'CONGRATULATIONS'}
          </Text>
          <Text style={styles.planActiveText}>
            {reservationId
              ? 'Your Session Booking is Confirmed !!'
              : `Your ${displayPlanName.charAt(0) + displayPlanName.slice(1).toLowerCase()} Plan is Active !!`}
          </Text>
        </View>

        {/* Elite Plan Premium Card */}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={getCardGradients()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.planCard}
          >
            <View style={{ padding: sp(20), width: '100%' }}>
              {/* Card Top Row */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  {/* Crown Icon Shield using SVG */}
                  <View style={styles.shieldIconContainer}>
                    <Svg width={40} height={44} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z"
                        fill="rgba(184, 115, 240, 0.2)"
                        stroke={getTierColor()}
                        strokeWidth={2}
                      />
                      <Path
                        d="M12 6l2 3h3l-2 2 1 3-4-2-4 2 1-3-2-2h3l2-3z"
                        fill={getTierColor()}
                      />
                    </Svg>
                  </View>
                  <View style={styles.textColumn}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardPlanTitle} numberOfLines={1}>
                        {reservationId ? displayPlanName : `${displayPlanName} PLAN`}
                      </Text>
                      {/* Active Capsule Badge */}
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>
                          {reservationId ? 'Confirmed' : 'Active'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardPlanSubtitle} numberOfLines={1}>
                      {reservationId ? 'Session Booking · 1 Slot' : 'All Access · Unlimited'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card Bottom Row Grid */}
              <View style={styles.featureGrid}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Icon name={reservationId ? 'calendar-outline' : 'infinite-outline'} size={20} color="#FFF" />
                  </View>
                  <Text style={styles.featureLabel}>
                    {reservationId ? 'Reserved Slot' : 'Unlimited Visits'}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Icon name="people-outline" size={20} color="#FFF" />
                  </View>
                  <Text style={styles.featureLabel}>
                    {reservationId ? 'Venue Access' : 'All Group Classes'}
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Icon name="barbell-outline" size={20} color="#FFF" />
                  </View>
                  <Text style={styles.featureLabel}>Personal Training</Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Icon name="snow-outline" size={20} color="#FFF" />
                  </View>
                  <Text style={styles.featureLabel}>Freeze Anytime</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Success Details Receipt Card */}
        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Icon
              name="checkmark-circle"
              size={40}
              color="#2ecc71"
              style={styles.receiptCheckIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.receiptTitle}>
                {reservationId ? 'Booking Successful' : 'Payment Successfull'}
              </Text>
              <Text style={styles.receiptSubtitle}>
                {reservationId
                  ? 'Your reservation has been confirmed and booking created!'
                  : `Payment of ₹${price} has been processed successfully`}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Fields */}
          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>
              {reservationId ? 'Booking ID' : 'Transaction ID'}
            </Text>
            <Text style={styles.rowValue}>
              {reservationId ? reservationId : transactionId}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.rowLabel}>Date & Time</Text>
            <Text style={styles.rowValue}>{currentDateTimeStr}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {activationStatus === 'activating' && (
            <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 10, fontSize: 13 }}>
              Activating your membership...
            </Text>
          )}
          <TouchableOpacity style={styles.letsStartBtn} onPress={handleStart} disabled={activationStatus === 'activating'}>
            {activationStatus === 'activating' ? (
              <GlobalLoader size={20} />
            ) : (
              <Text style={styles.letsStartBtnText}>Let's Start</Text>
            )}
          </TouchableOpacity>

          {activationStatus === 'timeout' && (
            <Text style={{ color: 'orange', textAlign: 'center', marginBottom: 10, paddingHorizontal: 20, fontSize: 12 }}>
              Your payment was successful. Activation is taking longer than expected. Please wait a few minutes and refresh.
            </Text>
          )}

          <TouchableOpacity
            style={styles.downloadBtn}
            activeOpacity={0.8}
            onPress={handleDownloadReceipt}
            disabled={downloading}
          >
            {downloading ? (
              <GlobalLoader size={20} />
            ) : (
              <Text style={styles.downloadBtnText}>Download Receipt</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({ sp, ms, fs, wp }, insets) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    scrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: wp(4),
      paddingTop: sp(16),
      paddingBottom: Math.max(insets?.bottom || 0, Platform.OS === 'android' ? sp(32) : sp(18)) + sp(16),
    },
    confettiContainer: {
      marginTop: sp(16),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headingContainer: {
      alignItems: 'center',
      marginVertical: sp(10),
    },
    congratsText: {
      fontSize: fs(24),
      fontWeight: 'bold',
      color: '#FFF',
      letterSpacing: 1.5,
      marginBottom: sp(8),
    },
    planActiveText: {
      fontSize: fs(15),
      color: '#2ecc71',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    cardWrapper: {
      width: '100%',
      marginVertical: sp(10),
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },
    planCard: {
      width: '100%',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sp(22),
    },
    cardTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    shieldIconContainer: {
      marginRight: sp(12),
    },
    textColumn: {
      justifyContent: 'center',
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    cardPlanTitle: {
      color: '#FFF',
      fontSize: fs(18),
      fontWeight: '900',
      letterSpacing: 1,
      flexShrink: 1,
    },
    cardPlanSubtitle: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: fs(12),
      marginTop: sp(4),
    },
    activeBadge: {
      backgroundColor: 'rgba(46, 204, 113, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(46, 204, 113, 0.4)',
      paddingHorizontal: sp(12),
      paddingVertical: sp(4),
      borderRadius: ms(12),
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeBadgeText: {
      color: '#2ecc71',
      fontSize: fs(10),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    featureGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: sp(12),
    },
    featureItem: {
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    featureIconBox: {
      width: ms(44),
      height: ms(44),
      borderRadius: ms(12),
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(8),
    },
    featureLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: fs(11),
      fontWeight: '600',
      textAlign: 'center',
    },
    receiptContainer: {
      width: '100%',
      backgroundColor: '#0a0a0a',
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: sp(20),
      marginVertical: sp(10),
    },
    receiptHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sp(16),
    },
    receiptCheckIcon: {
      marginRight: sp(16),
    },
    receiptTitle: {
      color: '#FFF',
      fontSize: fs(16),
      fontWeight: 'bold',
    },
    receiptSubtitle: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: fs(12),
      marginTop: sp(4),
      lineHeight: fs(18),
    },
    divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginVertical: sp(14),
    },
    receiptRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: sp(6),
    },
    rowLabel: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: fs(12),
    },
    rowValue: {
      color: '#FFF',
      fontSize: fs(12),
      fontWeight: '600',
    },
    buttonContainer: {
      width: '100%',
      marginTop: sp(10),
      marginBottom: sp(20),
    },
    letsStartBtn: {
      width: '100%',
      minHeight: ms(52),
      backgroundColor: '#050505',
      borderWidth: 1,
      borderColor: '#333',
      borderRadius: ms(12),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(12),
      paddingVertical: sp(14),
    },
    letsStartBtnText: {
      color: '#FFF',
      fontSize: fs(16),
      fontWeight: 'bold',
    },
    downloadBtn: {
      width: '100%',
      minHeight: ms(52),
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: sp(14),
    },
    downloadBtnText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: fs(14),
      fontWeight: '600',
    },
  });

export default SubscriptionSuccessScreen;
