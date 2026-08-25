import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Platform, Linking, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { useResponsiveMetrics } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrainerById, startConversationWithTrainer } from '../../../redux/actions/trainerActions';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import { useAuth } from '../../../context/AuthContext';
import * as Clarity from '../../../utils/clarity';
import { getToken } from '../../../api/apiClient';
import { ChatScreen } from '../dashboard/components/ChatScreen';

import { FullScreenLoader } from '../../../components/GlobalLoader';

const { width } = Dimensions.get('window');
const PENDING_SUBSCRIPTION_KEY = '@pending_active_subscription';

// Map backend amenity tags to icons
const getAmenityIcon = label => {
  const map = {
    'Air Conditioning': 'snow-outline',
    AC: 'snow-outline',
    'Locker Rooms': 'cube-outline',
    Shower: 'water-outline',
    Showers: 'water-outline',
    Parking: 'car-outline',
    'Wi-Fi': 'wifi-outline',
    'Steam Room': 'thermometer-outline',
    'Nutrition Bar': 'pint-outline',
    'Towel Service': 'layers-outline',
    Cafe: 'cafe-outline',
    Cafeteria: 'cafe-outline',
    Pool: 'water-outline',
    Sauna: 'flame-outline',
    'Robes & Slippers': 'shirt-outline',
  };
  return map[label] || 'checkmark-circle-outline';
};

const getFacilityIcon = label => {
  const map = {
    'Indoor Court': 'basketball-outline',
    Floodlights: 'sunny-outline',
    'Free Weights': 'barbell-outline',
    'Cardio Machines': 'bicycle-outline',
    'Functional Area': 'body-outline',
    'Therapy Rooms': 'medical-outline',
    'Relaxation Lounge': 'leaf-outline',
    Treadmills: 'walk-outline',
    'Squat Racks': 'barbell-outline',
  };
  return map[label] || 'construct-outline';
};

const TrainerDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isViewerVisible, setViewerVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [token, setToken] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { wp, hp, ms, sp, fs, isTablet } = useResponsiveMetrics();
  const styles = useMemo(
    () => createStyles({ wp, hp, ms, sp, fs, isTablet }),
    [wp, hp, ms, sp, fs, isTablet]
  );

  // Vertical-aware flags — derived once provider loads
  const primaryVertical = (() => {
    const v = trainer?.vertical || [];
    return Array.isArray(v) ? v[0] : v;
  })();
  const isGymLike = ['GYM', 'BOXING', 'YOGA', 'MARTIAL_ARTS'].includes(primaryVertical) || !primaryVertical;
  const isSports = primaryVertical === 'SPORTS_FACILITY';
  const isClinic = ['WELLNESS', 'CLINIC'].includes(primaryVertical);
  const professionalLabel = isClinic ? 'Professionals' : 'Trainers';
  const resourceCount = trainer?.resources?.length || 0;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dispatch(getTrainerById(id));
      if (response) {
        setTrainer(response);
        if (response.packages && response.packages.length > 0) {
          setSelectedPlan(response.packages[0]);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch trainer details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('[TrainerDetail] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, dispatch, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    const getTokenFromStorage = async () => {
      try {
        const userToken = await getToken();
        setToken(userToken);
      } catch (error) {
        console.error('[TrainerDetail] Error getting token:', error);
      }
    };
    getTokenFromStorage();
  }, []);

  const handleChatPress = async () => {
    if (!isAuthenticated || !user || !user.id) {
      Alert.alert(
        'Authentication Required',
        'You must be logged in to chat with trainers.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation?.navigate('Login') }
        ]
      );
      return;
    }

    setIsCheckingAuth(true);
    try {
      let userToken = token || await getToken();
      if (!userToken) {
        Alert.alert(
          'Session Expired',
          'Authentication token not found. Please login again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation?.navigate('Login') }
          ]
        );
        setIsCheckingAuth(false);
        return;
      }
      setToken(userToken);

      const response = await dispatch(startConversationWithTrainer(trainer.user?.id || id));
      if (response && response.id) {
        setConversationId(response.id);
        setShowChat(true);
      }
    } catch (err) {
      console.error("[TrainerDetail] Error starting conversation:", err);
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem('accessToken');
        setToken(null);
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation?.navigate('Login') }
          ]
        );
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Could not start conversation.';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (loading) {
    return <FullScreenLoader />;
  }
  if (!trainer) return null;

  const isPlanActive = (planId) => {
    if (!planId) return false;
    const activeSubs = user?.subscriptions || [];
    const activePkgs = user?.activePackages || [];
    const activeEnts = user?.activeEntitlements || [];

    const isSubForPlan = s => {
      if (!s) return false;
      const sPkgId = s.packageId || s.planId || s.package?.id || s.packageSubscription?.packageId || s.packageSubscription?.package?.id;
      const status = String(s.status || s.userPlanStatus || '').toUpperCase();
      return sPkgId && String(sPkgId) === String(planId) && !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(status);
    };

    const isPkgForPlan = p => {
      if (!p) return false;
      const pPkgId = p.packageId || p.planId || p.package?.id;
      const status = String(p.status || '').toUpperCase();
      return pPkgId && String(pPkgId) === String(planId) && status === 'ACTIVE';
    };

    const isEntForPlan = e => {
      if (!e) return false;
      const ePkgId = e.packageId || e.package?.id;
      const status = String(e.status || '').toUpperCase();
      const hasRemaining = ((e.totalSessions || 0) - (e.usedSessions || 0)) > 0;
      return ePkgId && String(ePkgId) === String(planId) && status === 'ACTIVE' && hasRemaining;
    };

    return activeSubs.some(isSubForPlan) || activePkgs.some(isPkgForPlan) || activeEnts.some(isEntForPlan);
  };

  const getPackageCTA = (plan, trainer) => {
    if (!plan) return 'Choose Plan';

    const accessMode = plan.accessMode || trainer.accessConfig?.accessMode || 'SLOT_BASED';
    const flow = plan.consumptionFlow || (() => {
      const totalSessions = (plan.items || []).reduce((sum, item) => sum + (item.softLimit || 0), 0);
      if ((accessMode === 'SLOT_BASED' || accessMode === 'APPOINTMENT') && totalSessions === 1) {
        return 'RESERVATION_CHECKOUT';
      }
      return 'PURCHASE_FIRST';
    })();

    if (isPlanActive(plan.id)) {
      if (accessMode === 'APPOINTMENT') return 'Book Appointment';
      return 'Book Slot';
    }

    if (flow === 'RESERVATION_CHECKOUT') {
      if (accessMode === 'APPOINTMENT') return 'Book Appointment';
      return 'Book Slot';
    } else {
      if (plan.commerce_model === 'ONE_TIME' || plan.commerceModel === 'ONE_TIME') {
        return 'Buy Package';
      }
      return 'Subscribe Now';
    }
  };

  const renderHeaderGallery = () => (
    <View style={styles.galleryContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setViewerVisible(true)}
      >
        <Image
          source={{
            uri:
              (trainer.photos || [])[selectedPhotoIndex] ||
              'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
          }}
          style={styles.mainImage}
        />
        <View style={styles.zoomIndicator}>
          <Icon name="expand-outline" size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailScroll}
      >
        {(trainer.photos || []).map((photo, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => setSelectedPhotoIndex(i)}
            style={[
              styles.thumbnailWrapper,
              selectedPhotoIndex === i && styles.activeThumbnailWrapper,
            ]}
          >
            <Image source={{ uri: photo }} style={styles.thumbnailImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={isViewerVisible} transparent={true} animationType="fade">
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.closeViewerBtn}
            onPress={() => setViewerVisible(false)}
          >
            <Icon name="close" size={32} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: (trainer.photos || [])[selectedPhotoIndex] }}
            style={styles.viewerImage}
            resizeMode="contain"
          />

          <View style={styles.viewerFooter}>
            <Text style={styles.viewerText}>
              Photo {selectedPhotoIndex + 1} of {trainer.photos?.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderTitleBlock = () => {
    const isVerified =
      trainer.status === 'APPROVED' ||
      trainer.status === 'approved' ||
      trainer.isSwappPartner;

    return (
      <View style={styles.titleBlockContainer}>
        {trainer.badges?.is_swapp_partner && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Swapp Partner</Text>
          </View>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.gymTitle} numberOfLines={2}>
            {trainer.name}
          </Text>
          {isVerified && (
            <Icon
              name="checkmark-circle"
              size={22}
              color="#3498db"
              style={styles.verifiedIcon}
            />
          )}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingScore}>
              {trainer.rating?.toFixed(1) || '4.5'}
            </Text>
            <Icon
              name="star"
              size={20}
              color="#FFD700"
              style={styles.starIcon}
            />
          </View>
        </View>
        <View style={styles.subtitleRow}>
          <Text style={styles.gymSubtitle} numberOfLines={1}>
            {trainer.address || 'Location Details'}
          </Text>
          <Text style={styles.reviewsText}>
            ({trainer.review?.length || 0} reviews)
          </Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.openNowText}>Open Now</Text>
          <Text style={styles.closesText}>
            {' '}
            • Closes at {trainer.closeTime || '10:00 PM'}
          </Text>
        </View>
      </View>
    );
  };

  const renderActionBar = () => (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(trainer.locationLink || '')}>
        <Icon name="location-outline" size={24} color="#aaa" />
        <Text style={styles.actionText}>Directions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleChatPress}
        disabled={isCheckingAuth}
      >
        <Icon name="chatbubble-ellipses-outline" size={24} color="#aaa" />
        <Text style={styles.actionText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (trainer.instagram || trainer.facebook || trainer.website) {
            Linking.openURL(trainer.instagram || trainer.facebook || trainer.website);
          } else {
            Alert.alert('Social accounts not available.');
          }
        }}
      >
        <Icon name="logo-instagram" size={24} color="#aaa" />
        <Text style={styles.actionText}>Social</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['Overview', 'Plans', professionalLabel, 'Reviews'].map(tab => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={styles.tabItem}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {trainer.about ||
            'Swapp partner venue providing premier fitness experiences. Access premium amenities, professional trainers, and state of the art equipment.'}
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Expertise</Text>
        <View style={styles.amenitiesGrid}>
          {(() => {
            const expList = trainer.specialties ? (Array.isArray(trainer.specialties) ? trainer.specialties : [trainer.specialties]) : (trainer.expertise ? [trainer.expertise] : []);
            if (expList.length === 0) {
              return (
                <Text style={{ color: '#666', fontSize: 14 }}>
                  Expertise not specified.
                </Text>
              );
            }
            return expList.map((item, index) => (
              <View key={index} style={styles.amenityBox}>
                <Icon name="star-outline" size={24} color="#aaa" />
                <Text style={styles.amenityLabel}>{item}</Text>
              </View>
            ));
          })()}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Years of Experience</Text>
        <View style={styles.amenitiesGrid}>
          <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4, lineHeight: 22 }}>
            {trainer.experienceYears ? `${trainer.experienceYears} Years` : (trainer.experience ? `${trainer.experience} Years` : 'Not specified')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPlans = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Membership Plans</Text>
      {(trainer.packages || []).map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan?.id === plan.id && styles.selectedPlanCard,
          ]}
          onPress={() => setSelectedPlan(plan)}
          activeOpacity={0.8}
        >
          {Boolean(plan.imageUrl) && (
            <View style={styles.planCardLeft}>
              <View style={styles.planImagePlaceholder}>
                <Image
                  source={{ uri: plan.imageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                />
              </View>
            </View>
          )}
          <View style={styles.planCardRight}>
            <View style={styles.planCardHeaderRow}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}
              >
                <Text style={[styles.planTitle, { color: '#fff' }]}>
                  {plan.name}
                </Text>
                {plan.is_popular && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>Popular</Text>
                  </View>
                )}
                {isPlanActive(plan.id) && (
                  <View style={[styles.planBadge, { backgroundColor: '#2ecc71' }]}>
                    <Text style={styles.planBadgeText}>Active Access</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>
                ₹{plan.basePrice}
                <Text style={styles.planPriceMonth}>
                  /
                  {plan.billingCycle?.toLowerCase().replace('ly', '') ||
                    'month'}
                </Text>
              </Text>
            </View>
            <Text style={styles.planSubtitle}>
              {plan.description || 'All Access'}
            </Text>

            {(() => {
              const accessMode = plan.accessMode || trainer.accessConfig?.accessMode || 'SLOT_BASED';
              const totalSessions = (plan.items || []).reduce((sum, item) => sum + (item.softLimit || 0), 0);
              const flow = plan.consumptionFlow || (() => {
                if ((accessMode === 'SLOT_BASED' || accessMode === 'APPOINTMENT') && totalSessions === 1) {
                  return 'RESERVATION_CHECKOUT';
                }
                return 'PURCHASE_FIRST';
              })();

              const sessionsLabel = totalSessions > 0 ? `${totalSessions} Sessions Included` : 'Unlimited Sessions';
              const flowLabel = flow === 'RESERVATION_CHECKOUT' ? 'Booking Required Immediately' : 'Book Sessions Later';
              const validityLabel = plan.validityDays ? `Valid for ${plan.validityDays} Days` : 'Monthly Cycle';

              return (
                <View style={{ marginVertical: 4 }}>
                  <Text style={{ color: '#A78BFA', fontSize: 11, fontWeight: 'bold' }}>
                    {sessionsLabel} • {validityLabel}
                  </Text>
                  <Text style={{ color: '#34d399', fontSize: 10, marginTop: 2 }}>
                    {flowLabel} ({accessMode.replace('_', ' ')})
                  </Text>
                </View>
              );
            })()}

            <View style={styles.planFeatures}>
              {(plan.features || []).map((feat, idx) => (
                <View key={idx} style={styles.planFeatureRow}>
                  <Icon name="chevron-forward" size={12} color="#fff" />
                  <Text style={styles.planFeatureText}>{feat}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[
                styles.choosePlanBtn,
                selectedPlan?.id === plan.id && { backgroundColor: '#4d94ff' },
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              <Text style={styles.choosePlanText}>
                {selectedPlan?.id === plan.id ? 'Selected' : 'Choose Plan'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {(trainer.packages?.length === 0 || !trainer.packages) && (
        <Text style={{ color: '#666', textAlign: 'center' }}>
          No plans available at the moment.
        </Text>
      )}
    </View>
  );

  const renderTrainers = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{professionalLabel}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.trainersScroll}
      >
        {(trainer.trainers || []).map(trainer => (
          <View key={trainer.id} style={styles.trainerCard}>
            <View style={styles.trainerImageContainer}>
              <Image
                source={{
                  uri:
                    trainer.profilePhoto || 'https://via.placeholder.com/150',
                }}
                style={styles.trainerImage}
              />
            </View>
            <Text style={styles.trainerName}>
              {trainer.name || (isClinic ? 'Professional' : 'Trainer')}
            </Text>
            <Text style={styles.trainerExp}>
              {trainer.experienceYears}+ Yrs Exp
            </Text>
            <Text style={styles.trainerCategory}>
              {Array.isArray(trainer.specialties)
                ? trainer.specialties[0]
                : trainer.specialties || (isClinic ? 'Specialist' : 'Trainer')}
            </Text>
            <View style={styles.trainerRatingRow}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.trainerRating}>
                {trainer.rating?.toFixed(1) || '4.8'}({trainer.reviewCount || 0}
                )
              </Text>
            </View>
          </View>
        ))}
        {(trainer.trainers?.length === 0 || !trainer.trainers) && (
          <Text style={{ color: '#666', fontSize: 12 }}>
            No {professionalLabel.toLowerCase()} listed for this location.
          </Text>
        )}
      </ScrollView>
    </View>
  );

  const renderReviews = () => {
    const reviews = trainer.review || [];
    const avgRating = trainer.rating || 4.5;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.reviewHeaderRow}>
          <View style={styles.reviewScoreBlock}>
            <Text style={styles.reviewScoreMain}>
              {avgRating}
              <Icon name="star" size={24} color="#FFD700" />
            </Text>
            <Text style={styles.reviewCount}>({reviews.length} Reviews)</Text>
          </View>
          <View style={styles.reviewBarsBlock}>
            {[
              { stars: 5, pct: '78%' },
              { stars: 4, pct: '15%' },
              { stars: 3, pct: '5%' },
              { stars: 2, pct: '1%' },
              { stars: 1, pct: '1%' },
            ].map(row => (
              <View key={row.stars} style={styles.reviewBarRow}>
                <Text style={styles.reviewBarStar}>
                  {row.stars} <Icon name="star" size={8} color="#FFD700" />
                </Text>
                <View style={styles.reviewBarTrack}>
                  <View style={[styles.reviewBarFill, { width: row.pct }]} />
                </View>
                <Text style={styles.reviewBarPct}>{row.pct}</Text>
              </View>
            ))}
          </View>
        </View>

        {reviews.map((rev, idx) => (
          <View
            key={rev.id || idx}
            style={[styles.reviewCard, { marginBottom: 15 }]}
          >
            <View style={styles.reviewCardHeader}>
              <Image
                source={{
                  uri:
                    rev.user?.userProfile?.profilePhoto ||
                    'https://via.placeholder.com/100',
                }}
                style={styles.reviewerAvatar}
              />
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>
                  {rev.user?.userProfile?.name || 'Swapp User'}{' '}
                  <Text style={styles.verifiedMemberText}>Verified Member</Text>
                </Text>
                <View style={styles.reviewCardStars}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Icon
                      key={i}
                      name="star"
                      size={10}
                      color={i <= rev.rating ? '#FFD700' : '#444'}
                    />
                  ))}
                  <Text style={styles.reviewCardScore}>
                    {rev.rating?.toFixed(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.reviewDate}>
                {new Date(rev.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.reviewCardText}>{rev.content}</Text>
            <View style={styles.reviewCardFooter}>
              <Icon name="thumbs-up-outline" size={14} color="#b873f0" />
              <Text style={styles.helpfulText}>Helpful</Text>
            </View>
          </View>
        ))}
        {reviews.length === 0 && (
          <Text style={{ color: '#666', textAlign: 'center' }}>
            No reviews yet. Be the first to review!
          </Text>
        )}
      </View>
    );
  };

  // ─── FOOTER ──────────────────────────────────────────────────────────────────
  const renderFooter = () => {
    // Derive lowest price from packages if trainer.lowest_price is missing
    const lowestPackagePrice =
      trainer.packages && trainer.packages.length > 0
        ? Math.min(...trainer.packages.map(p => p.basePrice || 0))
        : null;
    const price = selectedPlan
      ? selectedPlan.basePrice
      : trainer.lowest_price || lowestPackagePrice || null;
    const isSubscribe = !!selectedPlan;

    const activePkgForUnit = selectedPlan || (trainer.packages && trainer.packages.find(p => p.basePrice === price));
    let priceUnit = '/month';
    if (activePkgForUnit) {
      if (activePkgForUnit.commerce_model === 'ONE_TIME' || activePkgForUnit.commerceModel === 'ONE_TIME') {
        priceUnit = '';
      } else if (activePkgForUnit.billingCycle) {
        priceUnit = `/${activePkgForUnit.billingCycle.toLowerCase().replace('ly', '')}`;
      }
    }

    return (
      <View style={styles.footerWrapper}>
        <LinearGradient
          colors={['#7a3f35', '#c27060', '#b56858', '#7a3f35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerGradient}
        >
          {selectedPlan && isPlanActive(selectedPlan.id) ? (
            <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Active Plan ✓</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 }}>Manage bookings from your Home Screen</Text>
            </View>
          ) : (
            <>
              {/* Left: price block */}
              <View style={styles.footerLeft}>
                {price ? (
                  <>
                    <Text style={styles.footerPrice}>
                      ₹{price} <Text style={styles.footerPriceUnit}>{priceUnit}</Text>
                    </Text>
                    <Text style={styles.footerGst}>+ GST extra</Text>
                  </>
                ) : (
                  <Text style={styles.footerPrice}>Select a plan</Text>
                )}
              </View>

              {/* Right: action button — translucent lighter rectangle */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.footerBtn}
                onPress={async () => {
                  if (isSubscribe) {
                    console.log('[Clarity] Subscription clicked');
                    try {
                      Clarity.sendCustomEvent('subscription_clicked');
                      Clarity.setCustomTag('clicked_plan', selectedPlan ? selectedPlan.name : 'Unknown');
                    } catch (e) {
                      console.error('[Clarity] Failed to send subscription_clicked:', e);
                    }
                    try {
                      const pendingSubscription = {
                        status: 'ACTIVE',
                        provider: {
                          id: trainer.id,
                          name: trainer.name,
                          photos: trainer.photos,
                        },
                        package: selectedPlan,
                        planName: selectedPlan.name,
                        providerName: trainer.name,
                        gymName: trainer.name,
                        tier: selectedPlan.tier || selectedPlan.name,
                        image: trainer.photos?.[0] || selectedPlan.imageUrl,
                        isActive: true,
                      };

                      if (isPlanActive(selectedPlan.id)) {
                        navigation.navigate('TrainerBooking', {
                          gymName: trainer.name,
                          subscription: {
                            provider: {
                              id: trainer.id,
                              name: trainer.name,
                              photos: trainer.photos,
                            },
                            package: selectedPlan,
                          },
                          isReservationCheckout: false,
                          targetType: 'TRAINER',
                          trainerId: trainer.id,
                          selectedPlan,
                          packageType: selectedPlan.package_type || selectedPlan.packageType || 'STANDALONE',
                        });
                        return;
                      }

                      const flow = selectedPlan.consumptionFlow || (() => {
                        const accessMode = trainer.accessConfig?.accessMode || 'SLOT_BASED';
                        const totalSessions = (selectedPlan.items || []).reduce((sum, item) => sum + (item.softLimit || 0), 0);
                        if ((accessMode === 'SLOT_BASED' || accessMode === 'APPOINTMENT') && totalSessions === 1) {
                          return 'RESERVATION_CHECKOUT';
                        }
                        return 'PURCHASE_FIRST';
                      })();

                      if (flow === 'RESERVATION_CHECKOUT') {
                        navigation.navigate('TrainerBooking', {
                          gymName: trainer.name,
                          subscription: {
                            provider: {
                              id: trainer.id,
                              name: trainer.name,
                              photos: trainer.photos,
                            },
                            package: selectedPlan,
                          },
                          isReservationCheckout: true,
                          targetType: 'TRAINER',
                          trainerId: trainer.id,
                          selectedPlan,
                          packageType: selectedPlan.package_type || selectedPlan.packageType || 'STANDALONE',
                        });
                        return;
                      }

                      const response = await dispatch(
                        createCheckoutSession(selectedPlan.id, 'PARTNER_PACKAGE'),
                      );
                      if (
                        response &&
                        response.success &&
                        response.data?.checkoutUrl
                      ) {
                        navigation.navigate('CheckoutBrowser', {
                          url: response.data.checkoutUrl,
                          planId: selectedPlan.id,
                          planName: selectedPlan.name,
                          price: selectedPlan.basePrice,
                          pendingSubscription,
                        });
                      } else {
                        Alert.alert(
                          'Error',
                          response?.message || 'Failed to initiate subscription.',
                        );
                      }
                    } catch (err) {
                      console.error('Subscription error:', err);
                    }
                  } else {
                    setActiveTab('Plans');
                  }
                }}
              >
                <Text style={styles.footerBtnText} numberOfLines={1} adjustsFontSizeToFit={true}>
                  {selectedPlan ? getPackageCTA(selectedPlan, trainer) : 'Choose Plan'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {renderHeaderGallery()}
        {renderTitleBlock()}
        {renderActionBar()}
        {renderTabs()}
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Plans' && renderPlans()}
        {activeTab === professionalLabel && renderTrainers()}
        {activeTab === 'Reviews' && renderReviews()}
        {renderFooter()}
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={showChat} transparent animationType="slide" onRequestClose={() => setShowChat(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ width: '100%', height: '90%', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}>
            <ChatScreen
              trainer={trainer}
              user={user}
              onBack={() => setShowChat(false)}
              onClose={() => setShowChat(false)}
              conversationId={conversationId}
              token={token}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const createStyles = ({ wp, hp, ms, sp, fs, isTablet }) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000' },
    container: { flex: 1 },
    galleryContainer: { marginBottom: sp(15) },
    backButton: {
      position: 'absolute',
      top: sp(15),
      left: sp(15),
      zIndex: 10,
      width: ms(40),
      height: ms(40),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: ms(20),
    },
    mainImage: { width: '100%', height: ms(isTablet ? 320 : 260), resizeMode: 'cover' },
    thumbnailScroll: {
      flexDirection: 'row',
      marginTop: sp(5),
      paddingHorizontal: sp(15),
    },
    thumbnailWrapper: {
      marginRight: sp(10),
      borderRadius: ms(8),
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    activeThumbnailWrapper: { borderColor: '#e74c3c' },
    thumbnailImage: { width: ms(isTablet ? 90 : 70), height: ms(isTablet ? 90 : 70), resizeMode: 'cover' },
    zoomIndicator: {
      position: 'absolute',
      bottom: sp(15),
      right: sp(15),
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: sp(8),
      borderRadius: ms(20),
    },

    viewerOverlay: {
      flex: 1,
      backgroundColor: '#000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeViewerBtn: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 10,
    },
    viewerImage: { width: '100%', height: '80%' },
    viewerFooter: {
      position: 'absolute',
      bottom: sp(50),
      width: '100%',
      alignItems: 'center',
    },
    viewerText: { color: '#fff', fontSize: fs(14), fontWeight: '500' },

    titleBlockContainer: { paddingHorizontal: sp(20), marginBottom: sp(20) },
    premiumBadge: {
      backgroundColor: '#FFD700',
      alignSelf: 'flex-start',
      paddingHorizontal: sp(10),
      paddingVertical: sp(4),
      borderRadius: ms(12),
      marginBottom: sp(10),
    },
    premiumText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    gymTitle: { color: '#fff', fontSize: fs(24), fontWeight: 'bold', flex: 1 },
    verifiedIcon: { marginLeft: sp(8), marginTop: sp(2) },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
    },
    ratingScore: {
      color: '#FFD700',
      fontSize: 22,
      fontWeight: 'bold',
      marginRight: 4,
    },
    starIcon: { marginTop: -2 },
    subtitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: sp(5),
    },
    gymSubtitle: { color: '#aaa', fontSize: fs(14) },
    reviewsText: { color: '#666', fontSize: fs(12) },
    hoursRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    openNowText: { color: '#2ecc71', fontSize: 14, fontWeight: '500' },
    closesText: { color: '#aaa', fontSize: 14 },
    chevronIcon: { marginLeft: 5, marginTop: 2 },

    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: sp(20),
      paddingVertical: sp(15),
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#222',
      marginBottom: sp(20),
    },
    actionButton: { alignItems: 'center', flex: 1 },
    actionText: { color: '#aaa', fontSize: 12, marginTop: 5 },

    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: sp(20),
      marginBottom: sp(20),
    },
    tabItem: { marginRight: 30 },
    tabText: { color: '#666', fontSize: 16, fontWeight: '500' },
    tabTextActive: { color: '#fff', fontWeight: 'bold' },

    sectionContainer: { paddingHorizontal: sp(20), marginBottom: sp(35) },
    sectionTitle: {
      color: '#fff',
      fontSize: fs(18),
      fontWeight: 'bold',
      marginBottom: sp(15),
    },
    aboutText: { color: '#aaa', fontSize: fs(14), lineHeight: fs(22) },

    amenitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    amenityBox: {
      width: '23%',
      aspectRatio: 1,
      backgroundColor: '#0a0a0a',
      borderWidth: 1,
      borderColor: '#222',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      marginRight: '2%',
      padding: 5,
    },
    amenityLabel: {
      color: '#666',
      fontSize: 8,
      textAlign: 'center',
      marginTop: 8,
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 15,
    },

    planCard: {
      flexDirection: 'row',
      backgroundColor: '#0a0a0a',
      borderWidth: 1,
      borderColor: '#222',
      borderRadius: ms(12),
      padding: sp(15),
      marginBottom: sp(15),
    },
    selectedPlanCard: {
      borderColor: '#FF7369',
      backgroundColor: 'rgba(255, 115, 105, 0.05)',
    },
    planCardLeft: { width: ms(50), marginRight: sp(15) },
    planImagePlaceholder: {
      width: ms(50),
      height: ms(50),
      backgroundColor: '#fff',
      borderRadius: ms(8),
    },
    planCardRight: { flex: 1 },
    planCardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    planTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
    planBadge: {
      backgroundColor: '#4d94ff',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    planBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    planPrice: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 10,
    },
    planPriceMonth: { fontSize: 10, color: '#aaa', fontWeight: 'normal' },
    planSubtitle: { color: '#fff', fontSize: 12, marginBottom: 10 },
    planFeatures: { marginBottom: 15 },
    planFeatureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    planFeatureText: { color: '#ddd', fontSize: 12, marginLeft: 8 },
    choosePlanBtn: {
      backgroundColor: '#FF7369',
      paddingVertical: sp(10),
      borderRadius: ms(8),
      alignItems: 'center',
      alignSelf: 'flex-end',
      paddingHorizontal: sp(20),
    },
    choosePlanText: { color: '#fff', fontWeight: 'bold', fontSize: fs(12) },

    trainersScroll: { flexDirection: 'row' },
    trainerCard: {
      width: Math.min(ms(140), wp(42)),
      backgroundColor: '#0a0a0a',
      borderWidth: 1,
      borderColor: '#222',
      borderRadius: ms(12),
      padding: sp(15),
      marginRight: sp(15),
      alignItems: 'flex-start',
    },
    trainerImageContainer: {
      width: ms(80),
      height: ms(80),
      borderRadius: ms(40),
      borderWidth: 2,
      borderColor: '#2ecc71',
      marginBottom: sp(10),
      alignSelf: 'center',
      overflow: 'hidden',
    },
    trainerImage: { width: '100%', height: '100%' },
    trainerName: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    trainerExp: { color: '#4d94ff', fontSize: 10, marginBottom: 4 },
    trainerCategory: { color: '#fff', fontSize: 10, marginBottom: 6 },
    trainerRatingRow: { flexDirection: 'row', alignItems: 'center' },
    trainerRating: { color: '#fff', fontSize: 10, marginLeft: 4 },

    reviewHeaderRow: { flexDirection: 'row', marginBottom: 30 },
    reviewScoreBlock: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderColor: '#222',
    },
    reviewScoreMain: { color: '#fff', fontSize: fs(48), fontWeight: 'bold' },
    reviewCount: { color: '#666', fontSize: fs(12), marginTop: sp(5) },
    reviewBarsBlock: { flex: 1.5, paddingLeft: 20, justifyContent: 'center' },
    reviewBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    reviewBarStar: { color: '#aaa', fontSize: fs(10), width: ms(25) },
    reviewBarTrack: {
      flex: 1,
      height: 4,
      backgroundColor: '#222',
      borderRadius: 2,
      marginHorizontal: 10,
    },
    reviewBarFill: { height: '100%', backgroundColor: '#aaa', borderRadius: 2 },
    reviewBarPct: { color: '#aaa', fontSize: fs(10), width: ms(30), textAlign: 'right' },

    reviewCard: {
      backgroundColor: '#050505',
      borderWidth: 1,
      borderColor: '#222',
      borderRadius: 12,
      padding: 15,
    },
    reviewCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    reviewerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
    reviewerInfo: { flex: 1 },
    reviewerName: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    verifiedMemberText: { color: '#2ecc71', fontSize: 9, fontWeight: 'normal' },
    reviewCardStars: { flexDirection: 'row', alignItems: 'center' },
    reviewCardScore: { color: '#fff', fontSize: 10, marginLeft: 5 },
    reviewDate: { color: '#666', fontSize: 10 },
    reviewCardText: {
      color: '#ddd',
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 15,
    },
    reviewCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
    },
    helpfulText: { color: '#b873f0', fontSize: 10, marginLeft: 5 },

    // ─── FOOTER ────────────────────────────────────────────────────────────────
    footerWrapper: {
      paddingHorizontal: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      paddingTop: 8,
    },
    footerGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 16,
      paddingLeft: 20,
      paddingRight: 0, // button handles its own right edge flush
      overflow: 'hidden',
    },
    footerLeft: {
      flex: 1,
      paddingVertical: 14,
    },
    footerPrice: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    footerPriceUnit: {
      fontSize: 13,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.85)',
    },
    footerGst: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 11,
      marginTop: 2,
    },
    footerBtn: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderTopRightRadius: 16,
      borderBottomRightRadius: 16,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderLeftWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      alignSelf: 'stretch',
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 130,
    },
    footerBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });

export default TrainerDetailScreen;
