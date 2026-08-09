import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { createBooking, createReservation, getMyBookings } from '../../../api/bookingApi';
import { useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import { parseApiFailure } from '../../../api/apiUtils';
import apiClient from '../../../api/apiClient';
import { fetchMemberProviderAvailability } from '../../../api/scheduleApi';
import { isOpenAccessMode, resolveAccessMode } from '../../../utils/accessMode';
import { useResponsiveMetrics } from '../../../utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const SLOT_CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;



const formatSlotTime = slot => {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return slot.time || 'Available slot';
  }

  const options = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString('en-US', options)} - ${end.toLocaleTimeString('en-US', options)}`;
};

const getSlotStatusText = slot => {
  switch (slot.availabilityState) {
    case 'FILLING_FAST':
      return 'Filling Fast';
    case 'FULL':
      return 'Full';
    case 'PAST':
      return 'Unavailable';
    default:
      return slot.isPeak ? 'Peak Slot' : 'Available';
  }
};

const normalizePackageType = value => {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'BUNDLE') return 'GLOBAL_BUNDLE';
  if (raw === 'GLOBAL_BUNDLE') return 'GLOBAL_BUNDLE';
  if (raw === 'UPGRADE_ONLY') return 'UPGRADE_ONLY';
  return 'STANDALONE';
};

const MembershipBookingScreen = ({ route, navigation }) => {
  const {
    gymName = 'FitZone Premium',
    subscription = {},
    categoryId: routeCategoryId = null,
    packageType: routePackageType = null,
    isReservationCheckout = false,
    selectedPlan = null,
  } = route?.params || {};
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const styles = useMemo(() => createStyles(metrics, insets), [metrics, insets]);
  const packageType = useMemo(
    () =>
      normalizePackageType(
        routePackageType ||
        subscription?.packageType ||
        subscription?.package?.package_type ||
        subscription?.package?.packageType ||
        subscription?.userPlan?.packageSubscription?.package?.package_type ||
        ''
      ),
    [routePackageType, subscription],
  );
  const isTrainer = useMemo(() => {
    const prov = subscription.provider || subscription.gym || subscription.partner || subscription.package?.provider || {};
    return (
      packageType === 'TRAINER_PACKAGE' ||
      subscription.trainer ||
      subscription.trainerId ||
      subscription.trainerPlanId ||
      subscription.package?.trainerId ||
      prov.isTrainer ||
      prov.vertical === 'TRAINER' ||
      route?.params?.targetType === 'TRAINER' ||
      route?.params?.subscription?.trainer ||
      route?.params?.subscription?.trainerId ||
      route?.params?.subscription?.trainerPlanId ||
      route?.params?.subscription?.package?.trainerId ||
      route?.params?.subscription?.provider?.isTrainer ||
      route?.params?.subscription?.provider?.vertical === 'TRAINER'
    );
  }, [packageType, subscription, route?.params]);
  const isGlobalBundlePackage = packageType === 'GLOBAL_BUNDLE';
  const isUpgradeOnlyPackage = packageType === 'UPGRADE_ONLY';
  const entitlements = useMemo(() => {
    return (
      subscription.package?.items ||
      subscription.packageSubscription?.package?.items ||
      subscription.userPlan?.packageSubscription?.package?.items ||
      []
    );
  }, [subscription]);

  const categories = useMemo(() => {
    return entitlements
      .map(item => ({
        id: item.category?.id || item.categoryId || item.id,
        name: item.category?.name || item.name || 'Category',
      }))
      .filter(item => item.id && item.name);
  }, [entitlements]);

  const [activeCategoryId, setActiveCategoryId] = useState(
    routeCategoryId || (categories.length > 0 ? categories[0].id : '')
  );

  useEffect(() => {
    if (!isGlobalBundlePackage) {
      setActiveCategoryId('');
      return;
    }
    if (routeCategoryId && categories.some(category => category.id === routeCategoryId)) {
      setActiveCategoryId(routeCategoryId);
    } else if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, isGlobalBundlePackage, routeCategoryId, activeCategoryId]);

  const activeEntitlement = useMemo(() => {
    return entitlements.find(item => {
      const itemCategoryId = item.category?.id || item.categoryId || item.id;
      return itemCategoryId === activeCategoryId;
    });
  }, [entitlements, activeCategoryId]);
  const activeCategory = useMemo(
    () => categories.find(category => category.id === activeCategoryId),
    [categories, activeCategoryId],
  );
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingSlotKey, setBookingSlotKey] = useState(null);
  const [bookedSlotKeys, setBookedSlotKeys] = useState(new Set());
  const [slots, setSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [slotRefreshTick, setSlotRefreshTick] = useState(0);

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      const year = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      return {
        key: `${year}-${monthStr}-${dayStr}`,
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        day: dayStr,
        date,
      };
    });
  }, []);

  const activeDateKey = selectedDate || dates[0]?.key;

  const provider =
    subscription.provider ||
    subscription.gym ||
    subscription.partner ||
    subscription.package?.provider ||
    {};

  const providerId =
    provider.id ||
    subscription.providerId ||
    subscription.gymId ||
    subscription.partnerId ||
    subscription.package?.providerId;
  const accessMode = useMemo(
    () =>
      resolveAccessMode(
        subscription?.provider?.accessConfig?.accessMode,
        subscription?.accessConfig?.accessMode,
        provider?.accessConfig?.accessMode,
      ),
    [provider, subscription],
  );
  const isOpenAccess = isOpenAccessMode(accessMode);
  const isAppointmentOnly = accessMode === 'APPOINTMENT_ONLY';

  // Only pass a real UserPlan ID. If none is available, send null so the
  // backend resolves the correct plan from the user's active subscription.
  const userPlanId =
    subscription.userPlanId ||
    subscription.userPlan?.id ||
    subscription.planSubscriptionId ||
    null;

  useEffect(() => {
    if (isUpgradeOnlyPackage) {
      navigation.replace('MembershipDetails', { subscription });
      return;
    }
    if (!isOpenAccess) return;
    navigation.replace('MembershipDetails', {
      subscription,
      categoryId: activeCategoryId || routeCategoryId || null,
      openAccessAutoOpenScanner: true,
    });
  }, [activeCategoryId, isOpenAccess, isUpgradeOnlyPackage, navigation, routeCategoryId, subscription]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isOpenAccess || isUpgradeOnlyPackage) return;
    if (isGlobalBundlePackage && !activeCategoryId) {
      setSlots([]);
      return;
    }

    let isActive = true;

    const loadSlots = async () => {
      if (!providerId || !activeDateKey) {
        setSlots([]);
        return;
      }

      console.log('[MembershipBookingScreen] Loading slots for providerId:', providerId, 'isTrainer:', isTrainer);

      setIsLoadingSlots(true);
      setSlotError('');

      try {
        let userBookings = [];
        try {
          userBookings = await getMyBookings();
        } catch (err) {
          console.warn('[MembershipBookingScreen] getMyBookings error:', err);
        }

        const activeUserBookings = (userBookings || []).filter(b => {
          const status = String(b.bookingStatus || b.status || '').toUpperCase();
          return status !== 'CANCELLED' && status !== 'CANCELED' && status !== 'REJECTED';
        });

        const userBookedKeys = new Set(bookedSlotKeys);
        activeUserBookings.forEach(b => {
          if (b.slotId) userBookedKeys.add(b.slotId);
          if (b.startTime) {
            const bStartIso = new Date(b.startTime).toISOString();
            userBookedKeys.add(bStartIso);
            const bDateStr = bStartIso.split('T')[0];
            userBookedKeys.add(`${bDateStr}-${bStartIso}`);
            userBookedKeys.add(`${bDateStr}-${b.startTime}`);
          }
        });

        let mappedSlots = [];
        if (isTrainer) {
          const res = await apiClient.get(`/trainers/${providerId}/available-slots`, {
            params: {
              date: activeDateKey,
              categoryId: activeCategoryId || undefined,
            }
          });
          const [y, m, d] = activeDateKey.split('-');
          const selectedDayOfWeek = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).getDay();
          const slotsData = res.data?.data?.slots || res.data?.slots || [];
          mappedSlots = slotsData
            .filter(s => {
              if (s.availDate) {
                const sDateStr = new Date(s.availDate).toISOString().split('T')[0];
                return sDateStr === activeDateKey;
              }
              return s.dayOfWeek === selectedDayOfWeek;
            })
            .map(s => {
              let startTime = s.startTime;
              let endTime = s.endTime;
              if (typeof s.startTime === 'string' && !s.startTime.includes('T')) {
                const startDt = new Date(`${activeDateKey}T${s.startTime}:00`);
                startTime = startDt.toISOString();
              }
              if (typeof s.endTime === 'string' && !s.endTime.includes('T')) {
                const endDt = new Date(`${activeDateKey}T${s.endTime}:00`);
                endTime = endDt.toISOString();
              }

              const slotStart = new Date(startTime);
              const now = new Date();
              const isPast = slotStart <= now;

              const slotKey = s.id || s.slotId || `${activeDateKey}-${startTime}`;
              const isUserBooked =
                userBookedKeys.has(slotKey) ||
                userBookedKeys.has(s.id) ||
                userBookedKeys.has(s.slotId) ||
                userBookedKeys.has(startTime) ||
                userBookedKeys.has(`${activeDateKey}-${startTime}`) ||
                s.isBooked;

              return {
                ...s,
                id: s.id || s.slotId,
                slotId: s.slotId || s.id,
                startTime,
                endTime,
                isAvailable: !isPast && !isUserBooked,
                availabilityState: isUserBooked ? 'BOOKED' : isPast ? 'PAST' : 'AVAILABLE',
              };
            });
        } else {
          const result = await fetchMemberProviderAvailability({
            providerId,
            date: activeDateKey,
            categoryId: activeCategoryId || undefined,
          });
          mappedSlots = (result.slots || []).map(s => {
            const slotStart = new Date(s.startTime);
            const now = new Date();
            const isPast = slotStart <= now;
            const sStartIso = slotStart.toISOString();
            const slotKey = s.slotId || s.id || `${activeDateKey}-${s.startTime}`;

            const isUserBooked =
              userBookedKeys.has(slotKey) ||
              userBookedKeys.has(s.id) ||
              userBookedKeys.has(s.slotId) ||
              userBookedKeys.has(s.startTime) ||
              userBookedKeys.has(sStartIso) ||
              userBookedKeys.has(`${activeDateKey}-${s.startTime}`) ||
              userBookedKeys.has(`${activeDateKey}-${sStartIso}`) ||
              s.isBooked;

            return {
              ...s,
              isAvailable: !isPast && !isUserBooked && s.isAvailable,
              availabilityState: isUserBooked ? 'BOOKED' : isPast ? 'PAST' : (s.availabilityState || 'AVAILABLE'),
            };
          });
        }

        if (isActive) {
          setSlots(mappedSlots);
        }
      } catch (error) {
        if (isActive) {
          setSlots([]);
          setSlotError(parseApiFailure(error, 'Availability is not available for this date.'));
        }
      } finally {
        if (isActive) setIsLoadingSlots(false);
      }
    };

    loadSlots();

    return () => {
      isActive = false;
    };
  }, [activeCategoryId, activeDateKey, isGlobalBundlePackage, isOpenAccess, isUpgradeOnlyPackage, providerId, slotRefreshTick, isFocused]);

  if (isOpenAccess) {
    return null;
  }

  const buildSlotTimes = slot => ({
    startTime: new Date(slot.startTime).toISOString(),
    endTime: new Date(slot.endTime).toISOString(),
  });

  const bookSlot = async slot => {
    if (!providerId) {
      Alert.alert(
        'Booking Unavailable',
        'This membership does not include a provider ID yet. Please reopen the provider from your active membership.',
      );
      return;
    }
    if (isUpgradeOnlyPackage) {
      Alert.alert('Upgrade Package', 'This package is for upgrades only and cannot create bookings.');
      return;
    }
    if (isGlobalBundlePackage && !activeCategoryId) {
      Alert.alert('Select Category', 'Choose a category before creating this booking.');
      return;
    }

    const slotKey = slot.slotId || `${activeDateKey}-${slot.startTime}`;
    setBookingSlotKey(slotKey);

    try {
      const { startTime, endTime } = buildSlotTimes(slot);

      if (isReservationCheckout) {
        // Create reservation hold first
        const result = await createReservation({
          providerId: providerId,
          targetType: isTrainer ? 'TRAINER' : 'PROVIDER',
          startTime,
          endTime,
          selectedPackageId: selectedPlan?.id || subscription.package?.id,
        });

        const reservation = result.reservation;

        if (!reservation || !reservation.id) {
          throw new Error('Unable to create reservation hold.');
        }

        const pendingSubscription = {
          status: 'ACTIVE',
          provider: {
            id: providerId,
            name: gymName,
            photos: [],
          },
          package: selectedPlan,
          planName: selectedPlan?.name,
          providerName: gymName,
          gymName: gymName,
          tier: selectedPlan?.tier || selectedPlan?.name,
          image: selectedPlan?.imageUrl,
          isActive: true,
        };

        const checkoutResponse = await dispatch(
          createCheckoutSession(selectedPlan?.id || subscription.package?.id, 'PARTNER_PACKAGE', reservation.id, selectedPlan?.commerce_model || 'ONE_TIME'),
        );

        if (
          checkoutResponse &&
          checkoutResponse.success &&
          checkoutResponse.data?.checkoutUrl
        ) {
          navigation.navigate('CheckoutBrowser', {
            url: checkoutResponse.data.checkoutUrl,
            planId: selectedPlan?.id || subscription.package?.id,
            planName: selectedPlan?.name,
            price: selectedPlan?.basePrice,
            pendingSubscription,
            reservationId: reservation.id,
          });
        } else {
          Alert.alert(
            'Error',
            checkoutResponse?.message || 'Failed to initiate subscription checkout.',
          );
        }
        return;
      }

      const result = await createBooking({
        targetId: providerId,
        targetType: isTrainer ? 'TRAINER' : 'PROVIDER',
        startTime,
        endTime,
        userPlanId,
        categoryId: activeCategoryId || undefined,
        bookingMode: isAppointmentOnly ? 'APPOINTMENT' : 'SLOT_BASED',
      });

      const status = result.booking?.bookingStatus || result.booking?.status || 'CONFIRMED';

      // Optimistically mark slot as booked, then re-fetch to get server state
      setBookedSlotKeys(prev => new Set(prev).add(slotKey));
      setSlotRefreshTick(t => t + 1);

      Alert.alert(
        status === 'PENDING_CONFIRMATION'
          ? 'Appointment Requested'
          : isAppointmentOnly
            ? 'Appointment Confirmed'
            : 'Booking Confirmed',
        `${gymName}\n${formatSlotTime(slot)}\nStatus: ${status}`,
      );
    } catch (error) {
      Alert.alert(
        'Booking Failed',
        parseApiFailure(error, 'Unable to create this booking. Please try another slot.'),
      );
    } finally {
      setBookingSlotKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#050209" />

      {/* Deep purple/black gradient background top glow */}
      <View style={styles.headerGlow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{isAppointmentOnly ? 'Appointments' : 'Bookings'}</Text>
        <TouchableOpacity style={styles.calendarButton} activeOpacity={0.8}>
          <Icon name="calendar-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Date Strip */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {dates.map(date => {
            const isActive = activeDateKey === date.key;
            return (
              <TouchableOpacity
                key={date.key}
                style={[
                  styles.dateChip,
                  isActive && styles.dateChipActive,
                ]}
                onPress={() => setSelectedDate(date.key)}
                activeOpacity={0.85}
              >
                {isActive ? (
                  <View style={styles.activeContent}>
                    <View style={styles.activeDayCircle}>
                      <Text style={styles.activeDayText}>{date.day}</Text>
                      <View style={styles.activeDot} />
                    </View>
                    <Text style={styles.activeBottomMonth}>{date.month}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.dateMonth}>{date.month}</Text>
                    <Text style={styles.dateDay}>{date.day}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Pills */}
      {isGlobalBundlePackage && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryStrip}
          >
            {categories.map(category => {
              const isActive = activeCategoryId === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                  onPress={() => setActiveCategoryId(category.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Slot List */}
      <ScrollView
        style={styles.slotScroll}
        contentContainerStyle={styles.slotContent}
        showsVerticalScrollIndicator={false}
      >
        {activeEntitlement && (
          <View style={styles.entitlementCard}>
            <View style={styles.entitlementHeader}>
              <Icon name="shield-checkmark" size={18} color="#A78BFA" />
              <Text style={styles.entitlementTitle}>{activeCategory?.name || 'Category'} Entitlements</Text>
            </View>

            <View style={styles.entitlementGrid}>
              <View style={styles.entitlementItem}>
                <Text style={styles.entitlementLabel}>Soft Limit</Text>
                <Text style={styles.entitlementValue}>{activeEntitlement.softLimit ?? 'N/A'}</Text>
              </View>
              <View style={styles.entitlementItem}>
                <Text style={styles.entitlementLabel}>Premium Slots</Text>
                <Text style={styles.entitlementValue}>{activeEntitlement.premiumSlots ?? 0}</Text>
              </View>
              <View style={styles.entitlementItem}>
                <Text style={styles.entitlementLabel}>Surcharge %</Text>
                <Text style={styles.entitlementValue}>
                  {activeEntitlement.premiumSurchargePct ? `${parseFloat(activeEntitlement.premiumSurchargePct)}%` : '0%'}
                </Text>
              </View>
              <View style={styles.entitlementItem}>
                <Text style={styles.entitlementLabel}>Trainer Settlement %</Text>
                <Text style={styles.entitlementValue}>
                  {activeEntitlement.trainer_settlement_pct ? `${parseFloat(activeEntitlement.trainer_settlement_pct)}%` : '0%'}
                </Text>
              </View>
            </View>

            <View style={styles.entitlementPreviewDivider} />
            <Text style={styles.entitlementPreviewText}>
              Preview: Standard: {activeEntitlement.softLimit ?? 'N/A'} sessions | Premium: {activeEntitlement.premiumSlots ?? 0} slots at +{activeEntitlement.premiumSurchargePct ? parseFloat(activeEntitlement.premiumSurchargePct) : 0}% surcharge
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          {isAppointmentOnly ? 'REQUEST WINDOWS' : 'AVAILABLE SLOTS'}
        </Text>
        {isGlobalBundlePackage && !activeCategoryId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Choose a category to see availability.</Text>
          </View>
        ) : isLoadingSlots ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#FFF" />
            <Text style={styles.emptyStateText}>Loading availability...</Text>
          </View>
        ) : slotError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{slotError}</Text>
          </View>
        ) : slots.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No available slots for this date.</Text>
          </View>
        ) : slots.map(slot => {
          const slotKey = slot.slotId || `${activeDateKey}-${slot.startTime}`;
          const isBooking = bookingSlotKey === slotKey;
          const isBooked = bookedSlotKeys.has(slotKey) || slot.availabilityState === 'BOOKED';
          const isDisabled = Boolean(bookingSlotKey) || !slot.isAvailable || isBooked;
          return (
            <View key={slotKey} style={[styles.slotCard, isBooked && styles.slotCardBooked]}>
              <View style={styles.slotInfo}>
                <Text style={styles.slotTime}>{formatSlotTime(slot)}</Text>
                <Text
                  style={[
                    styles.slotStatus,
                    isBooked
                      ? styles.slotStatusBooked
                      : slot.availabilityState === 'FILLING_FAST' || slot.isPeak
                        ? styles.slotStatusWarning
                        : slot.isAvailable
                          ? styles.slotStatusAvailable
                          : styles.slotStatusUnavailable,
                  ]}
                >
                  {isBooked ? 'Booked ✓' : getSlotStatusText(slot)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.bookButton, isDisabled && styles.bookButtonDisabled, isBooked && styles.bookButtonBooked]}
                onPress={() => bookSlot(slot)}
                disabled={isDisabled}
                activeOpacity={0.85}
              >
                <Text style={styles.bookButtonText}>
                  {isBooking
                    ? (isAppointmentOnly ? 'Requesting...' : 'Booking...')
                    : isBooked
                      ? (isAppointmentOnly ? 'Requested' : 'Booked')
                      : slot.isAvailable
                        ? (isAppointmentOnly ? 'Request' : 'Book')
                        : 'Closed'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({ fs, sp, ms, isTablet, isLandscape, maxContentWidth }, insets) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ms(isLandscape ? 128 : 180),
    backgroundColor: '#130421',
    opacity: 0.4,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  header: {
    minHeight: ms(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(20),
    marginTop: sp(6),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  backButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: fs(20),
    fontWeight: 'bold',
  },
  calendarButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStrip: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(isLandscape ? 12 : 20),
    alignItems: 'center',
    flexDirection: 'row',
  },
  dateChip: {
    width: ms(52),
    minHeight: ms(72),
    borderRadius: ms(26),
    marginHorizontal: sp(5),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0E13',
    paddingVertical: sp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  dateChipActive: {
    width: ms(56),
    minHeight: ms(86),
    borderRadius: ms(28),
    backgroundColor: '#FFFFFF',
    paddingVertical: sp(8),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  activeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    color: '#5E5D62',
    fontSize: fs(11),
    fontWeight: '500',
  },
  dateDay: {
    color: '#A2A1A6',
    fontSize: fs(16),
    fontWeight: '700',
  },
  activeDayCircle: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#6A3C91',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: sp(4),
  },
  activeDayText: {
    color: '#FFF',
    fontSize: fs(18),
    fontWeight: 'bold',
  },
  activeDot: {
    width: ms(3),
    height: ms(3),
    borderRadius: ms(1.5),
    backgroundColor: '#FFF',
    position: 'absolute',
    bottom: sp(6),
  },
  activeBottomMonth: {
    color: '#6A3C91',
    fontSize: fs(11),
    fontWeight: 'bold',
  },
  categoryStrip: {
    paddingHorizontal: sp(20),
    paddingBottom: sp(isLandscape ? 14 : 25),
    alignItems: 'center',
  },
  categoryPill: {
    minHeight: ms(36),
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(10),
    backgroundColor: '#000',
  },
  categoryPillActive: {
    borderColor: '#FFF',
    backgroundColor: '#0F0E13',
  },
  categoryText: {
    color: '#727177',
    fontSize: fs(14),
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  slotScroll: {
    flex: 1,
  },
  slotContent: {
    paddingHorizontal: sp(isTablet ? 28 : 20),
    paddingBottom: Math.max(insets.bottom, sp(18)) + sp(12),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  sectionTitle: {
    color: '#727177',
    fontSize: fs(12),
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: sp(16),
  },
  slotCard: {
    width: '100%',
    minHeight: ms(76),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    marginBottom: sp(12),
    gap: sp(12),
  },
  slotInfo: {
    flex: 1,
    minWidth: 0,
  },
  slotTime: {
    color: '#FFF',
    fontSize: fs(16),
    fontWeight: 'bold',
    marginBottom: sp(6),
  },
  slotStatus: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  slotStatusAvailable: {
    color: '#00E96A',
  },
  slotStatusWarning: {
    color: '#E07538',
  },
  slotStatusUnavailable: {
    color: '#777177',
  },
  slotStatusBooked: {
    color: '#00E96A',
    fontWeight: '700',
  },
  slotCardBooked: {
    borderColor: 'rgba(0, 233, 106, 0.25)',
    backgroundColor: 'rgba(0, 233, 106, 0.05)',
  },
  bookButtonBooked: {
    backgroundColor: '#1A5C35',
  },
  emptyState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 18,
  },
  emptyStateText: {
    color: '#A2A1A6',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  bookButton: {
    minWidth: ms(76),
    minHeight: ms(38),
    borderRadius: ms(10),
    paddingHorizontal: sp(14),
    backgroundColor: '#4E266E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.65,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: fs(14),
    fontWeight: 'bold',
  },
  entitlementCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#08030B',
  },
  entitlementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  entitlementTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  entitlementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  entitlementItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  entitlementLabel: {
    color: '#A2A1A6',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  entitlementValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  entitlementPreviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  entitlementPreviewText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});

export default MembershipBookingScreen;
