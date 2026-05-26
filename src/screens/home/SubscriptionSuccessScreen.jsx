import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const PENDING_SUBSCRIPTION_KEY = '@pending_active_subscription';

const SubscriptionSuccessScreen = ({ route, navigation }) => {
  const {
    planName = 'Elite',
    price = '2499',
    pendingSubscription,
  } = route.params || {};
  const { refreshAuthStatus } = useAuth();

  useEffect(() => {
    if (pendingSubscription) {
      AsyncStorage.setItem(
        PENDING_SUBSCRIPTION_KEY,
        JSON.stringify(pendingSubscription),
      );
    }
    refreshAuthStatus?.().catch(err => console.log('Error refreshing user status:', err));
  }, [pendingSubscription, refreshAuthStatus]);

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
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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
        <Text style={styles.congratsText}>CONGRATULATIONS</Text>
        <Text style={styles.planActiveText}>
          Your{' '}
          {displayPlanName.charAt(0) + displayPlanName.slice(1).toLowerCase()}{' '}
          Plan is Active !!
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
                <Text style={styles.cardPlanTitle}>{displayPlanName} PLAN</Text>
                <Text style={styles.cardPlanSubtitle}>
                  All Access · Unlimited
                </Text>
              </View>
            </View>

            {/* Active Capsule Badge */}
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>

          {/* Card Bottom Row Grid */}
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Icon name="infinite-outline" size={20} color="#FFF" />
              </View>
              <Text style={styles.featureLabel}>Unlimited Visits</Text>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconBox}>
                <Icon name="people-outline" size={20} color="#FFF" />
              </View>
              <Text style={styles.featureLabel}>All Group Classes</Text>
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
          <View>
            <Text style={styles.receiptTitle}>Payment Successfull</Text>
            <Text style={styles.receiptSubtitle}>
              Payment of ₹{price} has been processed successfully
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Details Fields */}
        <View style={styles.receiptRow}>
          <Text style={styles.rowLabel}>Transaction ID</Text>
          <Text style={styles.rowValue}>{transactionId}</Text>
        </View>

        <View style={styles.receiptRow}>
          <Text style={styles.rowLabel}>Date & Time</Text>
          <Text style={styles.rowValue}>{currentDateTimeStr}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.letsStartBtn} onPress={handleStart}>
          <Text style={styles.letsStartBtnText}>Let's Start</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8}>
          <Text style={styles.downloadBtnText}>Download Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  confettiContainer: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  congratsText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  planActiveText: {
    fontSize: 16,
    color: '#2ecc71',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  planCard: {
    width: '100%',
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIconContainer: {
    marginRight: 12,
  },
  textColumn: {
    justifyContent: 'center',
  },
  cardPlanTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardPlanSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#2ecc71',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  receiptContainer: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginVertical: 10,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptCheckIcon: {
    marginRight: 16,
  },
  receiptTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  rowValue: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
  },
  letsStartBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  letsStartBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SubscriptionSuccessScreen;
