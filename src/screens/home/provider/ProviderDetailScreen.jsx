import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, Platform, Linking, Alert, Modal} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { useResponsiveMetrics } from '../../../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProviderDetails } from '../../../redux/actions/providersActions';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import { useAuth } from '../../../context/AuthContext';
import * as Clarity from '../../../utils/clarity';

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

const ProviderDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isViewerVisible, setViewerVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { wp, hp, ms, sp, fs, isTablet } = useResponsiveMetrics();
  const styles = createStyles({ wp, hp, ms, sp, fs, isTablet });

  // Vertical-aware flags — derived once provider loads
  const primaryVertical = (() => {
    const v = provider?.vertical || [];
    return Array.isArray(v) ? v[0] : v;
  })();
  const isGymLike = ['GYM', 'BOXING', 'YOGA', 'MARTIAL_ARTS'].includes(primaryVertical) || !primaryVertical;
  const isSports  = primaryVertical === 'SPORTS_FACILITY';
  const isClinic  = ['WELLNESS', 'CLINIC'].includes(primaryVertical);
  const professionalLabel = isClinic ? 'Professionals' : 'Trainers';
  const resourceCount = provider?.resources?.length || 0;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dispatch(getProviderDetails(id));
      if (response && response.success) {
        setProvider(response.data);
        if (response.data.packages && response.data.packages.length > 0) {
          setSelectedPlan(response.data.packages[0]);
        }
      } else {
        Alert.alert('Error', 'Failed to fetch partner details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('[ProviderDetail] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, dispatch, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return <FullScreenLoader />;
  }
  if (!provider) return null;

  const isPlanActive = (planId) => {
    const activeSubs = user?.subscriptions || [];
    const activePkgs = user?.activePackages || [];
    const activeEnts = user?.activeEntitlements || [];
    
    return activeSubs.some(s => (s.packageId === planId || s.planId === planId) && !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(String(s.status).toUpperCase())) ||
           activePkgs.some(p => p.packageId === planId && p.status === 'ACTIVE') ||
           activeEnts.some(e => e.packageId === planId && e.status === 'ACTIVE' && (e.totalSessions - e.usedSessions > 0));
  };

  const getPackageCTA = (plan, provider) => {
    if (!plan) return 'Choose Plan';
    
    const accessMode = plan.accessMode || provider.accessConfig?.accessMode || 'SLOT_BASED';
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
              (provider.photos || [])[selectedPhotoIndex] ||
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
        {(provider.photos || []).map((photo, i) => (
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
            source={{ uri: (provider.photos || [])[selectedPhotoIndex] }}
            style={styles.viewerImage}
            resizeMode="contain"
          />

          <View style={styles.viewerFooter}>
            <Text style={styles.viewerText}>
              Photo {selectedPhotoIndex + 1} of {provider.photos?.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderTitleBlock = () => {
    const isVerified =
      provider.status === 'APPROVED' ||
      provider.status === 'approved' ||
      provider.isSwappPartner;

    return (
      <View style={styles.titleBlockContainer}>
        {provider.badges?.is_swapp_partner && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Swapp Partner</Text>
          </View>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.gymTitle} numberOfLines={2}>
            {provider.name}
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
              {provider.rating?.toFixed(1) || '4.5'}
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
            {provider.address || 'Location Details'}
          </Text>
          <Text style={styles.reviewsText}>
            ({provider.review?.length || 0} reviews)
          </Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.openNowText}>Open Now</Text>
          <Text style={styles.closesText}>
            {' '}
            • Closes at {provider.closeTime || '10:00 PM'}
          </Text>
        </View>
      </View>
    );
  };

  const renderActionBar = () => (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(provider.locationLink || '')}>
        <Icon name="location-outline" size={24} color="#aaa" />
        <Text style={styles.actionText}>Directions</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (provider.phone) {
            Linking.openURL(`tel:${provider.phone}`);
          } else {
            Alert.alert('Contact info not available.');
          }
        }}
      >
        <Icon name="call-outline" size={24} color="#aaa" />
        <Text style={styles.actionText}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => {
          if (provider.website) {
            Linking.openURL(provider.website);
          } else {
            Alert.alert('Website not available.');
          }
        }}
      >
        <Icon name="globe-outline" size={24} color="#aaa" />
        <Text style={styles.actionText}>Website</Text>
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
          {provider.about ||
            'Swapp partner venue providing premier fitness experiences. Access premium amenities, professional trainers, and state of the art equipment.'}
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {(provider.amenities || []).map((item, index) => {
            const isObject = typeof item === 'object' && item !== null;
            const title = isObject ? item.title || item.name : item;

            return (
              <View key={index} style={styles.amenityBox}>
                <Icon name={getAmenityIcon(title)} size={24} color="#aaa" />
                <Text style={styles.amenityLabel}>{title}</Text>
              </View>
            );
          })}
          {(!provider.amenities || provider.amenities.length === 0) && (
            <Text style={{ color: '#666', fontSize: 12, marginLeft: 0 }}>
              Amenities list not available.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Facilities</Text>
        <View style={styles.amenitiesGrid}>
          {(provider.facilities || []).map((item, index) => {
            const isObject = typeof item === 'object' && item !== null;
            const title = isObject ? item.title || item.name : item;

            return (
              <View key={index} style={styles.amenityBox}>
                <Icon name={getFacilityIcon(title)} size={24} color="#aaa" />
                <Text style={styles.amenityLabel}>{title}</Text>
              </View>
            );
          })}
          {(!provider.facilities || provider.facilities.length === 0) && (
            <Text style={{ color: '#666', fontSize: 12, marginLeft: 0 }}>
              Facilities list not available.
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderPlans = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Membership Plans</Text>
      {(provider.packages || []).map(plan => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan?.id === plan.id && styles.selectedPlanCard,
          ]}
          onPress={() => setSelectedPlan(plan)}
          activeOpacity={0.8}
        >
          <View style={styles.planCardLeft}>
            <View
              style={[
                styles.planImagePlaceholder,
                { backgroundColor: plan.imageUrl ? 'transparent' : '#fff' },
              ]}
            >
              {plan.imageUrl && (
                <Image
                  source={{ uri: plan.imageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                />
              )}
            </View>
          </View>
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
              const accessMode = plan.accessMode || provider.accessConfig?.accessMode || 'SLOT_BASED';
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
      {(provider.packages?.length === 0 || !provider.packages) && (
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
        {(provider.trainers || []).map(trainer => (
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
        {(provider.trainers?.length === 0 || !provider.trainers) && (
          <Text style={{ color: '#666', fontSize: 12 }}>
            No {professionalLabel.toLowerCase()} listed for this location.
          </Text>
        )}
      </ScrollView>
    </View>
  );

  const renderReviews = () => {
    const reviews = provider.review || [];
    const avgRating = provider.rating || 4.5;

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
    // Derive lowest price from packages if provider.lowest_price is missing
    const lowestPackagePrice =
      provider.packages && provider.packages.length > 0
        ? Math.min(...provider.packages.map(p => p.basePrice || 0))
        : null;
    const price = selectedPlan
      ? selectedPlan.basePrice
      : provider.lowest_price || lowestPackagePrice || null;
    const isSubscribe = !!selectedPlan;

    const activePkgForUnit = selectedPlan || (provider.packages && provider.packages.find(p => p.basePrice === price));
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
          <View style={styles.footerGradientInner}>
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
                            id: provider.id,
                            name: provider.name,
                            photos: provider.photos,
                          },
                          package: selectedPlan,
                          planName: selectedPlan.name,
                          providerName: provider.name,
                          gymName: provider.name,
                          tier: selectedPlan.tier || selectedPlan.name,
                          image: provider.photos?.[0] || selectedPlan.imageUrl,
                          isActive: true,
                        };
    
                        if (isPlanActive(selectedPlan.id)) {
                          navigation.navigate('MembershipBooking', {
                            gymName: provider.name,
                            subscription: {
                              provider: {
                                id: provider.id,
                                name: provider.name,
                                photos: provider.photos,
                              },
                              package: selectedPlan,
                            },
                            isReservationCheckout: false,
                            selectedPlan,
                          });
                          return;
                        }
    
                        const flow = selectedPlan.consumptionFlow || (() => {
                          const accessMode = provider.accessConfig?.accessMode || 'SLOT_BASED';
                          const totalSessions = (selectedPlan.items || []).reduce((sum, item) => sum + (item.softLimit || 0), 0);
                          if ((accessMode === 'SLOT_BASED' || accessMode === 'APPOINTMENT') && totalSessions === 1) {
                            return 'RESERVATION_CHECKOUT';
                          }
                          return 'PURCHASE_FIRST';
                        })();
    
                        if (flow === 'RESERVATION_CHECKOUT') {
                          navigation.navigate('MembershipBooking', {
                            gymName: provider.name,
                            subscription: {
                              provider: {
                                id: provider.id,
                                name: provider.name,
                                photos: provider.photos,
                              },
                              package: selectedPlan,
                            },
                            isReservationCheckout: true,
                            selectedPlan,
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
                          navigation.navigate('CheckoutWebView', {
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
                  <Text style={styles.footerBtnText} numberOfLines={1}>
                    {selectedPlan ? getPackageCTA(selectedPlan, provider) : 'Choose Plan'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  footerGradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 0, // button handles its own right edge flush
    width: '100%',
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

export default ProviderDetailScreen;
