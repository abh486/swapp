import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  FlatList,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../context/LocationContext';
import { getHomeFeed } from '../../../redux/actions/homeActions';
import MembershipPlanModal from './MembershipPlanModal';
import { RefreshControl } from 'react-native';
import { setActiveCategory as setGlobalCategory } from '../../../redux/actions/homeActions';
import FindTrainers from './components/FindTrainers';
import { useResponsiveMetrics } from '../../../utils/responsive';
import LocationSelectorModal from './components/LocationSelectorModal';
import { browseTrainers, getTrainerById } from '../../../redux/actions/trainerActions';
import { TrainerDetailsModal } from './components/TrainerDetailsModal';

const PROMOS = [
  {
    id: '1',
    title: 'PERSONAL\nAI DIETICIAN',
    subtitle: 'Unlock customized meal plans & scan insights',
    image:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    ctaText: 'ACTIVATE NOW',
    navigateTo: 'AIDieticianSubscription',
  },
  {
    id: '2',
    title: 'BUILD YOUR\nCORE STRENGTH',
    subtitle: 'Join our new intensive program',
    image:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop',
    ctaText: 'BOOK NOW',
  },
];

const SUBSCRIPTION_CARD_SPACING = 14;
const SUBSCRIPTION_CARD_WIDTH = 330;
const SUBSCRIPTION_SIDE_PADDING = 14;
const PENDING_SUBSCRIPTION_KEY = '@pending_active_subscription';

export const HomeDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, refreshAuthStatus } = useAuth();
  const { activeCategory, activeVertical } = useSelector(state => state.home);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMembershipModalVisible, setMembershipModalVisible] = useState(false);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [isTrainersLoading, setIsTrainersLoading] = useState(false);
  const [selectedTrainerDetails, setSelectedTrainerDetails] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const subscriptionCarouselRef = useRef(null);

  const {
    userLocation,
    locationName,
    showPermissionModal,
    actions: locationActions,
  } = useLocation();
  const { feed, loading } = useSelector(state => state.home);
  const metrics = useResponsiveMetrics();
  const { ms, sp, wp, hp } = metrics;
  const subscriptionCardWidth = wp(92);
  const subscriptionCardHeight = Math.min(ms(168), hp(22));
  const subscriptionCardSpacing = sp(SUBSCRIPTION_CARD_SPACING);
  const subscriptionSidePadding = wp(4);
  const promoCardWidth = Math.min(wp(92), ms(462));
  const promoCardHeight = Math.min(hp(27), ms(204));
  const promoCardSpacing = sp(20);
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const userName = profileData.name?.split(' ')[0] || 'Member';
  const userAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.avatar;
  const subscriptions = user?.subscriptions || profileData.subscriptions || [];
  const serverActiveSubscription = useMemo(() => {
    return subscriptions.find(sub => {
      const status = String(
        sub.status || sub.subscriptionStatus || '',
      ).toUpperCase();
      return (
        !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(status) ||
        sub.isActive ||
        sub.active
      );
    });
  }, [subscriptions]);

  const activeAccessItems = useMemo(() => {
    // 1. Core Platform Subscriptions (Filter out GYM_PACKAGE duplicates if needed, though they shouldn't be here)
    const fromUser = subscriptions.filter(sub => {
      const status = String(sub.status || sub.subscriptionStatus || '').toUpperCase();
      const isActive = !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(status) || sub.isActive || sub.active;
      // Exclude Partner Packages that will be handled by activePackages
      const isProviderPlan = sub.packageId || sub.package || sub.productId;
      return isActive && !isProviderPlan;
    });

    // Count upcoming bookings by package / entitlement
    const upcomingByPackage = {};
    const upcomingByEntitlement = {};
    (user?.upcomingBookings || []).forEach(b => {
      if (b.packageSubscriptionId) {
        upcomingByPackage[b.packageSubscriptionId] = (upcomingByPackage[b.packageSubscriptionId] || 0) + 1;
      }
      if (b.entitlementId) {
        upcomingByEntitlement[b.entitlementId] = (upcomingByEntitlement[b.entitlementId] || 0) + 1;
      }
    });

    const upcoming = (user?.upcomingBookings || []).map(b => ({
      ...b,
      type: 'UPCOMING_BOOKING',
      isBooking: true
    }));

    const pkgs = (user?.activePackages || [])
      .map(p => {
        const pPkgId = p.packageId || p.package?.id;
        const matchingEnt = (user?.activeEntitlements || user?.entitlements || []).find(e => {
          const ePkgId = e.packageId || e.package?.id;
          const samePackage = ePkgId && ePkgId === pPkgId;
          const samePayment = e.paymentReference && p.chargebeeSubscriptionId && e.paymentReference === p.chargebeeSubscriptionId;
          return samePackage || samePayment;
        });
        return {
          ...p,
          type: 'GYM_PACKAGE',
          package: p.package,
          totalSessions: matchingEnt ? matchingEnt.totalSessions : p.totalSessions,
          usedSessions: matchingEnt ? matchingEnt.usedSessions : p.usedSessions,
          entitlementId: matchingEnt ? matchingEnt.id : undefined,
        };
      })
      .filter(p => {
        // If it has session limits, hide only if all available sessions are used/booked
        if (p.totalSessions > 0) {
          const upcomingCount = upcomingByPackage[p.id] || 0;
          const available = p.totalSessions - (p.usedSessions || 0) - upcomingCount;
          return available > 0;
        }
        // Unlimited or non-session packages never hide
        return true;
      });

    const ents = (user?.activeEntitlements || [])
      .filter(e => {
        // Front-end deduplication: if this entitlement matches an activePackage, skip it
        const ePkgId = e.packageId || e.package?.id;
        if (!ePkgId) return true;

        const isDupe = (user?.activePackages || []).some(p => {
          const pPkgId = p.packageId || p.package?.id;
          const samePackage = pPkgId === ePkgId;
          const samePayment = e.paymentReference && p.chargebeeSubscriptionId && e.paymentReference === p.chargebeeSubscriptionId;
          return samePackage || samePayment;
        });
        if (isDupe) return false;

        if (e.totalSessions > 0) {
          const upcomingCount = upcomingByEntitlement[e.id] || 0;
          const available = e.totalSessions - (e.usedSessions || 0) - upcomingCount;
          return available > 0;
        }
        return true;
      })
      .map(e => ({
        ...e,
        type: 'ENTITLEMENT',
        package: e.package
      }));

    const list = [...fromUser, ...pkgs, ...ents, ...upcoming];
    
    // Deduplicate the final list by type and ID/packageId to be absolutely safe
    const seen = new Set();
    const uniqueList = [];
    list.forEach(item => {
      // Create a unique key for each item
      let key = '';
      if (item.isBooking) {
        key = `booking_${item.id}`;
      } else if (item.type === 'GYM_PACKAGE') {
        key = `pkg_${item.id}`;
      } else if (item.type === 'ENTITLEMENT') {
        key = `ent_${item.id}`;
      } else {
        key = `sub_${item.id || item.subscriptionId || item.chargebeeSubscriptionId}`;
      }

      // Also generate a business-key based on packageId to prevent cross-type duplicate rendering
      const pkgId = item.packageId || item.package?.id;
      const bizKey = pkgId ? `biz_${pkgId}` : '';

      if (!seen.has(key) && (!bizKey || !seen.has(bizKey))) {
        seen.add(key);
        if (bizKey) seen.add(bizKey);
        uniqueList.push(item);
      }
    });

    if (pendingSubscription) {
      const alreadyExists = uniqueList.some(item => {
        if (pendingSubscription.id && item.id === pendingSubscription.id) return true;
        const pendingPkgId = pendingSubscription.packageId || pendingSubscription.package?.id;
        if (pendingPkgId) {
          const itemPkgId = item.packageId || item.package?.id;
          if (itemPkgId === pendingPkgId) return true;
        }
        return false;
      });

      if (!alreadyExists) {
        uniqueList.push(pendingSubscription);
      }
    }
    return uniqueList;
  }, [subscriptions, pendingSubscription, user]);

  const hasActiveSubscription = activeAccessItems.length > 0;

  useEffect(() => {
    fetchFeed();
  }, [userLocation, activeCategory, activeVertical]);

  const loadPendingSubscription = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_SUBSCRIPTION_KEY);
      setPendingSubscription(stored ? JSON.parse(stored) : null);
    } catch (error) {
      console.warn(
        '[HomeDashboard] Could not load pending subscription:',
        error,
      );
    }
  }, []);

  useEffect(() => {
    loadPendingSubscription();
  }, [loadPendingSubscription]);

  useEffect(() => {
    if (serverActiveSubscription && pendingSubscription) {
      // Server has confirmed the subscription — clear local optimistic state
      AsyncStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
      setPendingSubscription(null);
    }
  }, [serverActiveSubscription, pendingSubscription]);

  useFocusEffect(
    useCallback(() => {
      refreshAuthStatus?.();
      loadPendingSubscription();
    }, [refreshAuthStatus, loadPendingSubscription]),
  );


  // Center active card scroll removed since hardcoded cards are deleted

  const fetchFeed = async () => {
    const vertical = activeVertical || undefined;
    if (userLocation) {
      await dispatch(
        getHomeFeed(userLocation.latitude, userLocation.longitude, vertical),
      );
    } else {
      await dispatch(getHomeFeed(undefined, undefined, vertical));
    }
  };

  const fetchTrainersData = useCallback(async () => {
    setIsTrainersLoading(true);
    try {
      const result = await dispatch(browseTrainers());
      const trainersList = Array.isArray(result) ? result : (result?.trainers || result?.data || []);
      setTrainers(trainersList);
    } catch (err) {
      console.error("HomeDashboard - Fetch Trainers Error:", err);
    } finally {
      setIsTrainersLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (activeCategory === 'trainer') {
      fetchTrainersData();
    }
  }, [activeCategory, fetchTrainersData]);

  const handleViewTrainerProfile = async (trainerFromList) => {
    setIsModalLoading(true);
    setSelectedTrainerDetails(trainerFromList);
    try {
      const fullProfile = await dispatch(getTrainerById(trainerFromList.user.id));
      setSelectedTrainerDetails(fullProfile);
    } catch (err) {
      console.error("Failed to load full trainer profile:", err);
      setSelectedTrainerDetails(null);
    } finally {
      setIsModalLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeCategory === 'trainer') {
      await Promise.all([fetchFeed(), fetchTrainersData()]);
    } else {
      await fetchFeed();
    }
    setRefreshing(false);
  };

  const renderCategory = ({ item }) => {
    const isActive = activeCategory === item.id;

    if (isActive) {
      return (
        <TouchableOpacity
          style={styles.categoryItemActive}
          activeOpacity={0.9}
          onPress={() => {
            dispatch(setGlobalCategory(item.id, item.vertical));
          }}
        >
          <View style={styles.svgWrapper}>
            <Svg width={85} height={46} viewBox="0 0 110 60">
              <Path
                d="M 0 55 C 8 55, 12 15, 20 15 L 90 15 C 98 15, 102 55, 110 55"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1.5}
              />
            </Svg>
          </View>

          <View style={styles.activeCircleIcon}>
            <Icon
              name={item.icon || 'apps'}
              size={14}
              color="#e74c3c"
            />
          </View>

          <Text style={styles.activeCategoryText}>{item.label}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.categoryItemInactive}
        activeOpacity={0.8}
        onPress={() => {
          dispatch(setGlobalCategory(item.id, item.vertical));
        }}
      >
        <View style={styles.inactiveCircleIcon}>
          <Icon
            name={item.icon || 'apps'}
            size={14}
            color="#A5A5A5"
          />
        </View>
        <Text style={styles.inactiveCategoryText}>{item.label}</Text>
        <View style={styles.inactiveBottomLine} />
      </TouchableOpacity>
    );
  };

  const renderOffering = ({ item }) => (
    <TouchableOpacity
      style={styles.offeringCard}
      onPress={() =>
        navigation.navigate('ProviderDetails', { id: item.provider?.id })
      }
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.offeringImage}
        imageStyle={styles.offeringImageStyle}
      >
        <View style={styles.badgeContainer}>
          {item.discount && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{item.discount}</Text>
            </View>
          )}
          {item.badges?.is_recommended && (
            <View style={[styles.badge, styles.recommendedBadge]}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          )}
        </View>
      </ImageBackground>
      <View style={styles.offeringDetails}>
        <Text style={styles.offeringTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.offeringMeta}>
          {item.duration} • {item.level}
        </Text>
        <View style={styles.offeringPriceRow}>
          <Text style={styles.offeringPrice}>{item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.offeringOriginalPrice}>
              {item.originalPrice}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProvider = ({ item: provider }) => {
    if (!provider) return null;
    const distanceValue =
      typeof provider.distance === 'number'
        ? provider.distance.toFixed(1)
        : null;
    const distanceText = distanceValue ? `${distanceValue} miles` : null;

    const verticalLabel = Array.isArray(provider.vertical)
      ? provider.vertical[0].charAt(0) +
      provider.vertical[0].slice(1).toLowerCase()
      : provider.vertical
        ? provider.vertical.charAt(0) + provider.vertical.slice(1).toLowerCase()
        : 'Fitness';

    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() =>
          navigation.navigate('ProviderDetails', { id: provider.id })
        }
      >
        <ImageBackground
          source={{
            uri:
              provider.photos?.[0] ||
              'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400',
          }}
          style={styles.providerImage}
          imageStyle={styles.providerImageStyle}
        >
          <View style={styles.badgeContainer}>
            {provider.badges?.is_popular && (
              <View style={[styles.badge, styles.popularBadge]}>
                <Text style={styles.badgeText}>POPULAR</Text>
              </View>
            )}
            {provider.badges?.is_new && (
              <View style={[styles.badge, styles.newBadge]}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}
            {provider.badges?.is_swapp_partner && (
              <View style={[styles.badge, styles.partnerBadge]}>
                <Icon
                  name="checkmark-circle"
                  size={8}
                  color="#fff"
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.badgeText}>PARTNER</Text>
              </View>
            )}
          </View>
        </ImageBackground>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName} numberOfLines={1}>
            {provider.name}
          </Text>
          <Text style={styles.providerDistance}>
            {verticalLabel} {distanceText ? `• ${distanceText}` : ''}
          </Text>
          <Text style={styles.providerPrice}>
            {provider.lowest_price
              ? `₹${provider.lowest_price}/mo*`
              : 'View Plans'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTrainerCard = ({ item: trainer }) => {
    if (!trainer) return null;
    const distanceValue =
      typeof trainer.distance === 'number'
        ? trainer.distance.toFixed(1)
        : null;
    const distanceText = distanceValue ? `${distanceValue} miles` : null;
    const verticalLabel = 'Trainer';

    const trainerPlans = Array.isArray(trainer.plans) ? trainer.plans : [];
    const lowestPrice = trainerPlans.length > 0 
      ? Math.min(...trainerPlans.map(p => parseFloat(p.price) || 0)) 
      : null;

    const trainerName = trainer.name || trainer.user?.name || trainer.user?.email?.split('@')[0] || 'Trainer';

    return (
      <TouchableOpacity
        style={styles.providerCard}
        onPress={() => handleViewTrainerProfile(trainer)}
      >
        <ImageBackground
          source={{
            uri:
              trainer.gallery?.[0] ||
              'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400',
          }}
          style={styles.providerImage}
          imageStyle={styles.providerImageStyle}
        >
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, styles.partnerBadge]}>
              <Icon
                name="star"
                size={8}
                color="#fff"
                style={{ marginRight: 2 }}
              />
              <Text style={styles.badgeText}>{trainer.rating || 4.8}</Text>
            </View>
          </View>
        </ImageBackground>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName} numberOfLines={1}>
            {trainerName}
          </Text>
          <Text style={styles.providerDistance}>
            {verticalLabel} {distanceText ? `• ${distanceText}` : ''}
          </Text>
          <Text style={styles.providerPrice}>
            {lowestPrice
              ? `₹${lowestPrice}/mo*`
              : 'View Profile'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const dashboardCategories = [
    { id: 'all', label: 'All', icon: 'apps', vertical: null },
    ...(feed?.categories || []).map(c => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      vertical: c.vertical,
    })),
    {
      id: 'trainer',
      label: 'Train',
      icon: 'barbell-outline',
      vertical: 'TRAINER',
    },
  ];

  const renderActiveSubscriptionCard = (sub, index) => {
    const isBooking = sub.isBooking;
    const isPackage = sub.type === 'GYM_PACKAGE' || sub.type === 'ENTITLEMENT' || sub.package;

    const subscribedProvider =
      isBooking ? sub.provider :
      sub?.provider ||
      sub?.gym ||
      sub?.partner ||
      sub?.package?.provider ||
      null;

    const subscribedPlan =
      isBooking ? null :
      sub?.plan ||
      sub?.package ||
      sub?.membershipTier ||
      sub?.tier ||
      null;

    const subscribedGymName =
      subscribedProvider?.name ||
      sub?.providerName ||
      sub?.gymName ||
      'FitZone Premium';

    let subscribedPlanName =
      subscribedPlan?.name ||
      sub?.planName ||
      sub?.tierName ||
      'Premium Membership';

    let subscribedTierName =
      subscribedPlan?.tier?.name ||
      sub?.tier ||
      sub?.membershipTierName ||
      'Gold Tier';

    if (isBooking) {
      subscribedPlanName = 'Upcoming Session';
      subscribedTierName = new Date(sub.startTime).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } else if (isPackage && sub.totalSessions > 0) {
      const upcomingCount = sub.type === 'GYM_PACKAGE' 
        ? (user?.upcomingBookings || []).filter(b => b.packageSubscriptionId === sub.id).length
        : sub.type === 'ENTITLEMENT' 
          ? (user?.upcomingBookings || []).filter(b => b.entitlementId === sub.id).length 
          : 0;
      const remaining = sub.totalSessions - (sub.usedSessions || 0) - upcomingCount;
      subscribedTierName = `${remaining} Sessions Left`;
    } else if (sub.currentTermEnd) {
      subscribedTierName = `Renews ${new Date(sub.currentTermEnd).toLocaleDateString()}`;
    }

    const subscribedImage =
      isBooking ? (sub.provider?.images?.[0]?.url || sub.provider?.photos?.[0] || 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?q=80&w=600&auto=format&fit=crop') :
      subscribedProvider?.photos?.[0] ||
      sub?.image ||
      sub?.photoUrl ||
      'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?q=80&w=600&auto=format&fit=crop';

    const statusText = isBooking ? 'UPCOMING' : 'ACTIVE';

    const arcOneWidth = subscriptionCardWidth * 1.2;
    const arcTwoWidth = subscriptionCardWidth * 1.35;
    const arcThreeWidth = subscriptionCardWidth * 1.5;

    return (
      <TouchableOpacity
        key={sub.id || index}
        style={[styles.carouselCard, styles.activeCarouselCard, { width: subscriptionCardWidth, height: subscriptionCardHeight }]}
        activeOpacity={0.9}
        onPress={() => {
          if (sub.isBooking) {
            navigation.navigate('BookingDetails', { bookingId: sub.id });
          } else {
            navigation.navigate('MembershipDetails', {
              subscription: sub,
            });
          }
        }}
      >
        <LinearGradient
          colors={['#030303', '#09050D', '#160420']}
          style={styles.membershipGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View
            style={[
              styles.membershipArcOne,
              {
                width: arcOneWidth,
                height: arcOneWidth * 0.48,
                borderRadius: arcOneWidth / 2,
                left: -subscriptionCardWidth * 0.24,
                bottom: -subscriptionCardHeight * 0.85,
              },
            ]}
          />
          <View
            style={[
              styles.membershipArcTwo,
              {
                width: arcTwoWidth,
                height: arcTwoWidth * 0.47,
                borderRadius: arcTwoWidth / 2,
                left: -subscriptionCardWidth * 0.28,
                bottom: -subscriptionCardHeight * 0.95,
              },
            ]}
          />
          <View
            style={[
              styles.membershipArcThree,
              {
                width: arcThreeWidth,
                height: arcThreeWidth * 0.46,
                borderRadius: arcThreeWidth / 2,
                left: -subscriptionCardWidth * 0.3,
                bottom: -subscriptionCardHeight * 1.05,
              },
            ]}
          />
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>{statusText}</Text>
          </View>

          <View style={styles.membershipImageWrap}>
            <Image
              source={{ uri: subscribedImage }}
              style={styles.membershipImage}
            />
            <View style={styles.qrBadge}>
              <Icon name="qr-code-outline" size={20} color="#FFF" />
            </View>
          </View>

          <View style={styles.membershipCopy}>
            <Text style={styles.membershipTitle} numberOfLines={1}>
              {subscribedGymName}
            </Text>
            <Text style={styles.membershipSubtitle} numberOfLines={1}>
              {subscribedPlanName}
            </Text>
            <Text style={styles.membershipTier} numberOfLines={1}>
              {subscribedTierName}
            </Text>
          </View>

          <View style={styles.membershipArrow}>
            <Icon
              name="arrow-up-outline"
              size={20}
              color="#FFF"
              style={{ transform: [{ rotate: '45deg' }] }}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleScroll = (event) => {
    const slideSize = subscriptionCardWidth + subscriptionCardSpacing;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveCardIndex(Math.round(index));
  };

  const renderSubscribedTop = () => (
    <View style={styles.subscribedTop}>
      <ScrollView
        ref={subscriptionCarouselRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={subscriptionCardWidth + subscriptionCardSpacing}
        snapToAlignment="start"
        contentContainerStyle={[styles.subscriptionCarouselContent, { paddingHorizontal: subscriptionSidePadding }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {activeAccessItems.map((sub, index) => renderActiveSubscriptionCard(sub, index))}
      </ScrollView>
      {activeAccessItems.length > 1 && (
        <View style={styles.paginationContainer}>
          {Array.from({ length: activeAccessItems.length }).map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.paginationDot, 
                activeCardIndex === i ? styles.paginationDotActive : null
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e74c3c"
          />
        }
      >
        {/* Location Permission Modal */}
        <Modal
          visible={showPermissionModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.permissionModal}>
              <View style={styles.modalIconContainer}>
                <Icon name="location" size={40} color="#e74c3c" />
              </View>
              <Text style={styles.modalTitle}>Enable Location</Text>
              <Text style={styles.modalSub}>
                To find the best partners nearby, we need access to your
                location.
              </Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => locationActions.requestPermission()}
              >
                <Text style={styles.modalBtnText}>ALLOW ACCESS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSkipBtn}
                onPress={() => locationActions.skipPermission()}
              >
                <Text style={styles.modalSkipText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Unified Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome {userName} !</Text>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.profilePic} />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Icon name="person-circle" size={44} color="#888" />
            </View>
          )}
        </View>

        {/* Unified Search */}
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers, trainers, classes..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() =>
              navigation.navigate('DiscoverProvidersMap', {
                query: searchQuery,
              })
            }
          />
        </View>

        {hasActiveSubscription && renderSubscribedTop()}

        {/* Promos Carousel */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.promoCarousel}
        >
          {PROMOS.map((promo, index) => (
            <ImageBackground
              key={promo.id}
              source={{ uri: promo.image }}
              style={[styles.promoCard, { width: promoCardWidth, height: promoCardHeight, marginHorizontal: promoCardSpacing }]}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={styles.promoContent}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                <TouchableOpacity
                  style={styles.promoButton}
                  onPress={() => {
                    if (promo.navigateTo) {
                      navigation.navigate(promo.navigateTo);
                    } else {
                      setMembershipModalVisible(true);
                    }
                  }}
                >
                  <Text style={styles.promoButtonText}>{promo.ctaText || 'BOOK NOW'}</Text>
                </TouchableOpacity>
                <View style={styles.pagination}>
                  {PROMOS.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === index && styles.dotActive]}
                    />
                  ))}
                </View>
              </View>
            </ImageBackground>
          ))}
        </ScrollView>

        {/* Categories */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dashboardCategories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
        />

        {feed && feed.top_offerings?.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOP OFFERINGS FOR YOU</Text>
              <Icon name="arrow-forward-circle" size={28} color="#555" />
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={feed.top_offerings}
              renderItem={renderOffering}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.offeringsList}
            />
          </>
        )}

        {/* Discover Fitness Near You */}
        <View style={styles.discoverSection}>
          <Text style={styles.discoverBold}>Discover</Text>
          <Text style={styles.discoverThin}>
            {activeCategory === 'trainer' ? 'Trainers Near You' : 'Partners Near You'}
          </Text>
          <TouchableOpacity
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
          >
            <Text style={styles.partnersText}>
              {activeCategory === 'trainer' 
                ? `100+ Trainers In ${locationName || 'Bangalore'}`
                : `100+ Partners In ${locationName || 'Bangalore'}`}
            </Text>
            <Icon name="chevron-down" size={14} color="#888" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Centers Near You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'trainer' ? 'TRAINERS NEAR' : 'PARTNERS NEAR'}{' '}
            <Text
              style={{ textDecorationLine: 'underline', color: '#e74c3c' }}
              onPress={() => setLocationModalVisible(true)}
            >
              {locationName ? locationName.toUpperCase() : 'YOU'}
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('DiscoverProvidersMap')}
          >
            <Icon name="arrow-forward-circle" size={28} color="#555" />
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={activeCategory === 'trainer' ? trainers : (feed?.nearby_providers || [])}
          renderItem={activeCategory === 'trainer' ? renderTrainerCard : renderProvider}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.providersList}
          ListEmptyComponent={
            (activeCategory === 'trainer' ? isTrainersLoading : loading) ? null : (
              <Text style={{ color: '#888', marginLeft: 16 }}>
                {activeCategory === 'trainer' ? 'No trainers found nearby' : 'No partners found nearby'}
              </Text>
            )
          }
        />

        {/* Trending Partners */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {activeCategory === 'trainer' ? 'TRENDING TRAINERS' : 'TRENDING PARTNERS'}
          </Text>
          <Icon name="arrow-forward-circle" size={28} color="#555" />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={activeCategory === 'trainer' ? trainers : (feed?.trending_providers || [])}
          renderItem={activeCategory === 'trainer' ? renderTrainerCard : renderProvider}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.providersList}
          ListEmptyComponent={
            (activeCategory === 'trainer' ? isTrainersLoading : loading) ? null : (
              <Text style={{ color: '#888', marginLeft: 16 }}>
                {activeCategory === 'trainer' ? 'No trending trainers found' : 'No trending partners found for this category'}
              </Text>
            )
          }
        />

        {/* Spacer for bottom banner */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <MembershipPlanModal
        visible={isMembershipModalVisible}
        onClose={() => setMembershipModalVisible(false)}
      />
      <LocationSelectorModal
        visible={isLocationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        actions={locationActions}
        activeLocationName={locationName}
        onSelect={(newLoc) => {
          navigation.navigate('DiscoverProvidersMap', { selectedLocation: newLoc });
        }}
      />
      <TrainerDetailsModal
        trainer={selectedTrainerDetails}
        isVisible={!!selectedTrainerDetails}
        isLoading={isModalLoading}
        onClose={() => setSelectedTrainerDetails(null)}
        user={user}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: '#8B5CF6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  workoutButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 5,
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePicPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribedTop: {
    paddingBottom: 20,
    backgroundColor: '#050505',
  },
  subscribedHeader: {
    paddingHorizontal: 30,
  },
  subscribedHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  heroProfilePic: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  heroProfilePicPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#18151C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  roundIconButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginTop: 6,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  welcomeBlock: {
    flex: 1,
    paddingRight: 18,
  },
  welcomeText: {
    color: '#FFF',
    fontSize: 38,
    lineHeight: 48,
    fontWeight: '300',
    letterSpacing: 0,
  },
  subscriptionCarouselContent: {
    paddingHorizontal: SUBSCRIPTION_SIDE_PADDING,
  },
  carouselCard: {
    width: SUBSCRIPTION_CARD_WIDTH,
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: SUBSCRIPTION_CARD_SPACING,
  },
  activeCarouselCard: {
    borderRadius: 18,
  },
  sideCarouselCard: {
    opacity: 0.96,
  },
  sideCardGradient: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(150,93,190,0.32)',
    padding: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  membershipGradient: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(128,66,168,0.5)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  membershipArcOne: {
    position: 'absolute',
    width: 470,
    height: 220,
    borderRadius: 235,
    borderWidth: 1,
    borderColor: 'rgba(145,76,190,0.45)',
    left: -80,
    bottom: -140,
    transform: [{ rotate: '-8deg' }],
  },
  membershipArcTwo: {
    position: 'absolute',
    width: 520,
    height: 240,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: 'rgba(145,76,190,0.32)',
    left: -94,
    bottom: -158,
    transform: [{ rotate: '-8deg' }],
  },
  membershipArcThree: {
    position: 'absolute',
    width: 570,
    height: 260,
    borderRadius: 285,
    borderWidth: 1,
    borderColor: 'rgba(145,76,190,0.2)',
    left: -108,
    bottom: -176,
    transform: [{ rotate: '-8deg' }],
  },
  activeBadge: {
    position: 'absolute',
    top: 22,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F7D1F',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    zIndex: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  activeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  membershipImageWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#FFF',
    marginRight: 14,
  },
  membershipImage: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
  },
  qrBadge: {
    position: 'absolute',
    right: -10,
    bottom: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  membershipCopy: {
    flex: 1,
    paddingRight: 44,
  },
  membershipTitle: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 4,
  },
  membershipSubtitle: {
    color: '#BAB3C6',
    fontSize: 15,
    marginBottom: 3,
  },
  membershipTier: {
    color: '#D8D1E2',
    fontSize: 14,
  },
  membershipArrow: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7D3CED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#35303D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideCardKicker: {
    color: '#9D93AA',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  sideCardTitle: {
    color: '#FFF',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 6,
  },
  sideCardSub: {
    color: '#C9C0D4',
    fontSize: 13,
    lineHeight: 18,
    maxWidth: '78%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },

  // ── Category pill styles (updated to match image) ──
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    height: 75,
  },
  categoryItemActive: {
    width: 85,
    height: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  svgWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 85,
    height: 46,
  },
  activeCircleIcon: {
    position: 'absolute',
    top: 7,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  activeCategoryText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 5,
  },
  categoryItemInactive: {
    width: 75,
    height: 70,
    alignItems: 'center',
    position: 'relative',
  },
  inactiveCircleIcon: {
    position: 'absolute',
    top: 7,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveCategoryText: {
    color: '#888888',
    fontSize: 9,
    fontWeight: '500',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  inactiveBottomLine: {
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
  },

  promoCarousel: {
    marginBottom: 40,
  },
  promoCard: {
    width: 462,
    height: 204,
    marginHorizontal: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  promoSubtitle: {
    color: '#ddd',
    fontSize: 13,
    marginBottom: 10,
  },
  promoButton: {
    backgroundColor: '#FF6F61',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#e74c3c',
    width: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  offeringsList: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  offeringCard: {
    width: 160,
    marginRight: 15,
  },
  offeringImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  offeringImageStyle: {
    borderRadius: 12,
  },
  offeringDetails: {},
  offeringTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offeringMeta: {
    color: '#888',
    fontSize: 10,
    marginBottom: 6,
  },
  offeringPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offeringPrice: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  offeringOriginalPrice: {
    color: '#555',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discoverSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  discoverBold: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  discoverThin: {
    color: '#888',
    fontSize: 36,
    fontWeight: '200',
    marginBottom: 10,
  },
  partnersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  providersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  providerCard: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  providerImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
  },
  providerImageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  popularBadge: {
    backgroundColor: '#e74c3c',
  },
  newBadge: {
    backgroundColor: '#2ecc71',
  },
  partnerBadge: {
    backgroundColor: '#3498db',
  },
  recommendedBadge: {
    backgroundColor: '#9b59b6',
  },
  discountBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  providerDetails: {
    paddingHorizontal: 12,
  },
  providerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerDistance: {
    color: '#888',
    fontSize: 10,
    marginBottom: 6,
  },
  providerPrice: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  proBannerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 0,
    left: 20,
    right: 20,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  proIcon: {
    marginRight: 15,
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  proSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  joinBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSub: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: '#e74c3c',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSkipBtn: {
    paddingVertical: 10,
  },
  modalSkipText: {
    color: '#666',
    fontSize: 14,
  },
});

export default HomeDashboard;
