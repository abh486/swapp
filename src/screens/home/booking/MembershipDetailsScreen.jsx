import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';

import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';
import { useBarcodeScannerOutput } from 'react-native-vision-camera-barcode-scanner';
import apiClient from '../../../api/apiClient';
import QRCode from 'react-native-qrcode-svg';
import { generateBookingQr, getMyBookings, checkoutBooking, cancelBooking } from '../../../api/bookingApi';
import { getCheckInHistory, venueScanCheckIn } from '../../../api/checkinApi';
import { parseApiFailure } from '../../../api/apiUtils';
import { isOpenAccessMode, resolveAccessMode } from '../../../utils/accessMode';
import { useLocation } from '../../../context/LocationContext';
import { useAuth } from '../../../context/AuthContext';
import { identifyQrPayload, QR_TYPE } from '../../../utils/qrParser';
import { useResponsiveMetrics } from '../../../utils/responsive';

const IOSScannerCamera = ({ device, isActive, isScanLocked, onQrCodeScanned }) => {
  const objectOutput = useObjectOutput({
    types: ['qr', 'ean-13', 'code-128', 'code-39', 'pdf-417'],
    onObjectsScanned: objects => {
      if (isScanLocked || objects.length === 0) return;
      const value = objects.find(object => object.value)?.value;
      if (!value) return;
      onQrCodeScanned(value);
    },
  });

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      outputs={objectOutput ? [objectOutput] : undefined}
    />
  );
};

const AndroidScannerCamera = ({ device, isActive, isScanLocked, onQrCodeScanned }) => {
  const barcodeOutput = useBarcodeScannerOutput({
    barcodeFormats: ['qr-code', 'ean-13', 'code-128', 'code-39', 'pdf-417'],
    onBarcodeScanned: barcodes => {
      if (isScanLocked || barcodes.length === 0) return;
      const barcode = barcodes.find(b => b.rawValue || b.displayValue);
      const value = barcode ? (barcode.rawValue || barcode.displayValue) : null;
      if (!value) return;
      onQrCodeScanned(value);
    },
    onError: error => {
      console.warn('[AndroidScannerCamera] Barcode scan error:', error);
    },
  });

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={isActive}
      outputs={barcodeOutput ? [barcodeOutput] : undefined}
    />
  );
};

const QRScanner = ({ device, isActive, isScanLocked, onQrCodeScanned }) => {
  if (Platform.OS === 'ios') {
    return (
      <IOSScannerCamera
        device={device}
        isActive={isActive}
        isScanLocked={isScanLocked}
        onQrCodeScanned={onQrCodeScanned}
      />
    );
  }
  return (
    <AndroidScannerCamera
      device={device}
      isActive={isActive}
      isScanLocked={isScanLocked}
      onQrCodeScanned={onQrCodeScanned}
    />
  );
};

const FALLBACK_GYM_IMAGE =
  'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?q=80&w=600&auto=format&fit=crop';

const getDateText = value => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const formatBookingDate = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'UPCOMING';

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return 'TODAY';
  if (date.toDateString() === tomorrow.toDateString()) return 'TOMORROW';
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
};

const isActiveSubscription = sub => {
  if (!sub) return false;
  const status = String(sub.status || sub.subscriptionStatus || '').toUpperCase();
  if (['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(status)) return false;
  if (sub.isActive === false || sub.active === false) return false;
  return true;
};

const normalizePackageType = value => {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'BUNDLE') return 'GLOBAL_BUNDLE';
  if (raw === 'GLOBAL_BUNDLE') return 'GLOBAL_BUNDLE';
  if (raw === 'UPGRADE_ONLY') return 'UPGRADE_ONLY';
  return 'STANDALONE';
};

const MembershipDetailsScreen = ({ route, navigation }) => {
  const { subscription: routeSubscription = {}, membershipId, categoryId: routeCategoryId = '' } = route.params || {};
  const { user, refreshAuthStatus } = useAuth();
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const styles = createStyles(metrics, insets);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [qrPass, setQrPass] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [providerDetails, setProviderDetails] = useState(null);
  const [autoRenew, setAutoRenew] = useState(
    routeSubscription?.cancelAtPeriodEnd !== true
  );
  const didAutoOpenScannerRef = useRef(false);
  const isScanLockedRef = useRef(false);
  const isMounted = useRef(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const subscriptions = useMemo(() => {
    const profileData = user?.userProfile || user?.memberProfile || user || {};
    const fromUser = user?.subscriptions || profileData.subscriptions || [];
    const merged = [...fromUser];
    if (routeSubscription?.id && !merged.find(sub => sub?.id === routeSubscription.id)) {
      merged.unshift(routeSubscription);
    }
    return merged.filter(Boolean);
  }, [routeSubscription, user]);
  const [selectedMembershipId, setSelectedMembershipId] = useState(
    membershipId || routeSubscription?.id || subscriptions[0]?.id || null
  );

  useEffect(() => {
    if (membershipId && membershipId !== selectedMembershipId) {
      setSelectedMembershipId(membershipId);
    }
  }, [membershipId, selectedMembershipId]);

  const subscription = useMemo(() => {
    if (selectedMembershipId) {
      const matched = subscriptions.find(sub => sub?.id === selectedMembershipId);
      if (matched) return matched;
    }
    return routeSubscription;
  }, [routeSubscription, selectedMembershipId, subscriptions]);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { userLocation, actions: locationActions } = useLocation();
  const provider = useMemo(() => {
    const routeProvider =
      subscription.provider ||
      subscription.gym ||
      subscription.partner ||
      subscription.package?.provider ||
      {};
    return { ...routeProvider, ...providerDetails };
  }, [subscription, providerDetails]);
  const accessMode = useMemo(
    () =>
      resolveAccessMode(
        providerDetails?.accessConfig?.accessMode,
        provider?.accessConfig?.accessMode,
        subscription?.provider?.accessConfig?.accessMode,
        subscription?.accessConfig?.accessMode,
        subscription?.accessMode,
      ),
    [providerDetails, provider, subscription],
  );
  const isOpenAccess = isOpenAccessMode(accessMode);
  const plan =
    subscription.plan ||
    subscription.package ||
    subscription.membershipTier ||
    subscription.tier ||
    {};

  const gymName =
    provider.name ||
    subscription.providerName ||
    subscription.gymName ||
    'FitZone Premium';
  const planName =
    plan.name ||
    subscription.planName ||
    subscription.tierName ||
    'Premium Membership';
  const tierName =
    plan.tier ||
    subscription.tier ||
    subscription.membershipTierName ||
    '';
  const image =
    provider.photos?.[0] ||
    subscription.image ||
    subscription.photoUrl ||
    FALLBACK_GYM_IMAGE;
  const startDate =
    getDateText(subscription.currentTermStart || subscription.startDate || subscription.createdAt) ||
    'N/A';
  const endDate =
    getDateText(
      subscription.currentTermEnd ||
        subscription.endDate ||
        subscription.expiresAt ||
        subscription.expiryDate ||
        subscription.currentPeriodEnd,
    ) || 'N/A';
  const locationUrl = provider.locationLink || provider.mapUrl;
  const providerId =
    provider.id ||
    subscription.providerId ||
    subscription.gymId ||
    subscription.partnerId ||
    subscription.package?.providerId;

  const currentCheckedInBooking = useMemo(() => {
    return bookings.find(
      booking =>
        booking.providerId === providerId &&
        booking.bookingStatus === 'CHECKED_IN'
    );
  }, [bookings, providerId]);

  const packageType = useMemo(
    () =>
      normalizePackageType(
        subscription?.packageType ||
          subscription?.package?.package_type ||
          subscription?.package?.packageType ||
          subscription?.userPlan?.packageSubscription?.package?.package_type ||
          subscription?.userPlan?.packageSubscription?.package?.packageType ||
          ''
      ),
    [subscription]
  );
  const isUpgradeOnlyPackage = packageType === 'UPGRADE_ONLY';
  const isGlobalBundlePackage = packageType === 'GLOBAL_BUNDLE';
  
  const isOneTime = useMemo(() => {
    const model = subscription?.package?.commerce_model || 
                  subscription?.package?.commerceModel || 
                  subscription?.packageSubscription?.package?.commerce_model ||
                  subscription?.packageSubscription?.package?.commerceModel ||
                  subscription?.userPlan?.packageSubscription?.package?.commerce_model ||
                  subscription?.userPlan?.packageSubscription?.package?.commerceModel ||
                  subscription?.commerce_model ||
                  subscription?.commerceModel ||
                  plan?.commerce_model ||
                  plan?.commerceModel ||
                  '';
    return String(model).toUpperCase() === 'ONE_TIME';
  }, [subscription, plan]);

  const isAccessModeLoading = Boolean(providerId) && !providerDetails;
  const isAppointmentOnly = accessMode === 'APPOINTMENT_ONLY';
  const userPlanStatus = String(
    subscription?.userPlan?.status ||
      subscription?.userPlanStatus ||
      subscription?.status ||
      'UNKNOWN'
  ).toUpperCase();
  const matchedUserPlan = user?.userPlans?.find(
    up => up.packageSubscriptionId === subscription?.id || up.id === subscription?.userPlanId
  );

  const matchedEntitlement = user?.activeEntitlements?.find(
    ent => ent.package?.id === (subscription?.packageId || subscription?.package?.id) || ent.id === subscription?.entitlementId
  ) || user?.entitlements?.find(
    ent => ent.package?.id === (subscription?.packageId || subscription?.package?.id) || ent.id === subscription?.entitlementId
  );

  const activeEscrowed = useMemo(() => {
    return bookings.reduce((sum, b) => {
      const status = b.bookingStatus || b.status;
      if (['PENDING', 'PENDING_CONFIRMATION', 'CONFIRMED'].includes(status)) {
        if (matchedUserPlan && b.userPlanId === matchedUserPlan.id) {
          return sum + (Number(b.escrowedCredits) || 0);
        }
        if (matchedEntitlement && b.entitlementId === matchedEntitlement.id) {
          return sum + 1;
        }
      }
      return sum;
    }, 0);
  }, [bookings, matchedUserPlan, matchedEntitlement]);

  const remainingCredits = useMemo(() => {
    if (matchedUserPlan?.creditledger) {
      return Math.max(0, matchedUserPlan.creditledger.totalCredits - matchedUserPlan.creditledger.usedCredits - activeEscrowed);
    }
    if (matchedEntitlement) {
      return Math.max(0, matchedEntitlement.totalSessions - matchedEntitlement.usedSessions - activeEscrowed);
    }
    return Number(
      subscription?.creditLedger?.remainingCredits ??
        subscription?.creditLedger?.availableCredits ??
        subscription?.remainingCredits ??
        subscription?.remainingSessions ??
        0
    );
  }, [matchedUserPlan, matchedEntitlement, subscription, activeEscrowed]);
  const membershipChoices = useMemo(
    () =>
      subscriptions
        .filter(sub => isActiveSubscription(sub) && normalizePackageType(
          sub?.packageType ||
            sub?.package?.package_type ||
            sub?.package?.packageType ||
            sub?.userPlan?.packageSubscription?.package?.package_type ||
            ''
        ) !== 'UPGRADE_ONLY')
        .map(sub => {
          const subProvider = sub.provider || sub.gym || sub.partner || sub.package?.provider || {};
          const subPlan = sub.plan || sub.package || sub.membershipTier || sub.tier || {};
          return {
            id: sub.id,
            label: `${subProvider?.name || 'Provider'} - ${subPlan?.name || sub.tierName || 'Membership'}`,
          };
        }),
    [subscriptions]
  );
  const packageCategories = useMemo(() => {
    if (isUpgradeOnlyPackage) return [];
    const items =
      subscription?.package?.items ||
      subscription?.packageSubscription?.package?.items ||
      subscription?.userPlan?.packageSubscription?.package?.items ||
      [];
    return items
      .map(item => ({
        id: item.category?.id || item.categoryId || item.id,
        name: item.category?.name || item.name || 'Category',
      }))
      .filter(item => item.id && item.name);
  }, [isUpgradeOnlyPackage, subscription]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(routeCategoryId || '');

  useEffect(() => {
    setSelectedCategoryId(routeCategoryId || '');
  }, [routeCategoryId, subscription?.id, packageType]);

  const { daysLeft, progressPercent } = useMemo(() => {
    const startVal = subscription.currentTermStart || subscription.startDate || subscription.createdAt;
    const endVal =
      subscription.currentTermEnd ||
      subscription.endDate ||
      subscription.expiresAt ||
      subscription.expiryDate ||
      subscription.currentPeriodEnd;

    if (!startVal || !endVal) {
      return { daysLeft: 0, progressPercent: 0 };
    }

    const start = new Date(startVal);
    const end = new Date(endVal);
    const today = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { daysLeft: 0, progressPercent: 0 };
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const totalDuration = end.getTime() - start.getTime();
    const remaining = end.getTime() - today.getTime();

    const daysLeftVal = Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)));
    const totalDaysVal = Math.max(1, Math.ceil(totalDuration / (1000 * 60 * 60 * 24)));

    const percent = Math.max(0, Math.min(100, ((totalDaysVal - daysLeftVal) / totalDaysVal) * 100));

    return { daysLeft: daysLeftVal, progressPercent: percent };
  }, [subscription]);

  const streakDays = useMemo(() => {
    if (checkInHistory.length === 0) return 0;

    const checkInDates = Array.from(
      new Set(
        checkInHistory.map(item => {
          const d = new Date(item.date || item.checkedAt || item.startTime);
          return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
        }).filter(Boolean)
      )
    ).sort((a, b) => new Date(b) - new Date(a));

    if (checkInDates.length === 0) return 0;

    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const latestDateStr = checkInDates[0];
    if (latestDateStr !== todayStr && latestDateStr !== yesterdayStr) {
      return 0;
    }

    const expectedDate = new Date(latestDateStr);
    for (let i = 0; i < checkInDates.length; i++) {
      const currentDateStr = checkInDates[i];
      const expectedStr = expectedDate.toISOString().split('T')[0];

      if (currentDateStr === expectedStr) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [checkInHistory]);

  const avgDuration = useMemo(() => {
    const durations = checkInHistory
      .map(item => item.duration || item.durationMinutes || item.activeMinutes)
      .filter(Boolean);
    if (durations.length === 0) return 58;
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    return Math.round(avg);
  }, [checkInHistory]);

  const openingHours = provider.openTime && provider.closeTime
    ? `${provider.openTime} - ${provider.closeTime}`
    : '05:00 - 23:00';

  const crowdLevel = provider.crowdLevel || '• Low';

  const parkingText = provider.parking || provider.parkingInfo ||
    (provider.amenity_tags?.includes('Parking') ? 'Available' : 'Limited Spots');

  const lockersText = provider.lockersInfo ||
    (provider.amenity_tags?.includes('Locker Rooms') || provider.amenity_tags?.includes('Locker') ? 'Available' : 'Not Available');

  const amenities = provider.amenity_tags && provider.amenity_tags.length > 0
    ? provider.amenity_tags
    : ['Pool', 'Spa', 'Boxing', 'Sauna', 'Cafe', 'Wi-Fi'];

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter(booking => {
        const status = booking.bookingStatus || booking.status;
        return (
          (!providerId || booking.providerId === providerId) &&
          ['CONFIRMED', 'PENDING_CONFIRMATION', 'CHECKED_IN'].includes(status) &&
          new Date(booking.endTime || booking.startTime) >= now
        );
      })
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 3);
  }, [bookings, providerId]);

  const latestCheckIn = checkInHistory[0];
  const visitsThisMonth = useMemo(() => {
    const now = new Date();
    return checkInHistory.filter(item => {
      const date = new Date(item.date || item.checkedAt || item.startTime);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }, [checkInHistory]);

  const fetchLifecycleData = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [bookingRows, historyRows, providerDataResp] = await Promise.all([
        getMyBookings(),
        getCheckInHistory(providerId ? { providerId } : undefined),
        providerId ? apiClient.get(`/providers/profile/${providerId}`) : Promise.resolve(null),
        refreshAuthStatus?.()
      ]);

      if (isMounted.current) {
        setBookings(bookingRows || []);
        setCheckInHistory(historyRows || []);
        if (providerDataResp?.data?.success && providerDataResp?.data?.data) {
          setProviderDetails(providerDataResp.data.data);
        }
      }
    } catch (error) {
      console.warn('[MembershipDetails] Lifecycle load failed:', parseApiFailure(error));
    } finally {
      if (isMounted.current) {
        setIsLoadingHistory(false);
      }
    }
  }, [providerId, refreshAuthStatus]);

  useEffect(() => {
    fetchLifecycleData();
  }, [fetchLifecycleData]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const openDirections = () => {
    if (locationUrl) {
      Linking.openURL(locationUrl);
      return;
    }
    navigation.navigate('DiscoverProvidersMap', { query: gymName });
  };

  const openBooking = () => {
    if (isUpgradeOnlyPackage) {
      Alert.alert(
        'Upgrade Package',
        'This package is for upgrades only and cannot be used as an active access package.',
      );
      return;
    }

    if (isGlobalBundlePackage && !selectedCategoryId && packageCategories.length > 0) {
      Alert.alert('Select Category', 'Choose a category before continuing.');
      return;
    }

    if (isOpenAccess) {
      if (currentCheckedInBooking) {
        handleCheckout();
      } else {
        openScanner();
      }
      return;
    }

    if (subscription.trainer || packageType === 'TRAINER_PACKAGE') {
      navigation.navigate('TrainerBooking', {
        gymName,
        subscription,
        packageType,
        categoryId: selectedCategoryId || null,
        trainerId: subscription.trainer?.id || subscription.trainerId || providerId,
      });
    } else {
      navigation.navigate('MembershipBooking', {
        gymName,
        subscription,
        packageType,
        categoryId: selectedCategoryId || null,
      });
    }
  };

  const [isTogglingRenew, setIsTogglingRenew] = useState(false);

  const handleToggleAutoRenew = async () => {
    if (!subscription.id) {
      Alert.alert('Unavailable', 'No subscription ID is associated with this membership.');
      return;
    }

    const nextState = !autoRenew;
    Alert.alert(
      nextState ? 'Enable Auto-Renew' : 'Disable Auto-Renew',
      nextState
        ? 'Are you sure you want to enable auto-renew for this membership subscription?'
        : 'Are you sure you want to disable auto-renew? Your membership will not automatically renew at the end of the current term.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsTogglingRenew(true);
            try {
              const resp = await apiClient.post(`/subscriptions/${subscription.id}/toggle-auto-renew`, {
                autoRenew: nextState
              });
              if (resp.data?.success) {
                setAutoRenew(nextState);
                Alert.alert('Success', `Auto-renew has been ${nextState ? 'enabled' : 'disabled'} successfully.`);
              } else {
                throw new Error(resp.data?.message || 'Failed to update auto-renew status.');
              }
            } catch (error) {
              Alert.alert(
                'Error',
                parseApiFailure(error, 'Could not update auto-renew state. Please try again later.')
              );
            } finally {
              setIsTogglingRenew(false);
            }
          }
        }
    ]
  );
  };

  const openScanner = useCallback(async () => {
    const granted = hasPermission || (await requestPermission());
    if (!granted) {
      Alert.alert(
        'Camera Permission',
        'Camera access is needed to scan gym QR codes.',
      );
      return;
    }

    if (!device) {
      Alert.alert(
        'Camera Unavailable',
        'Camera hardware is not ready yet. Please try again in a moment.',
      );
      return;
    }

    isScanLockedRef.current = false;
    setIsScanLocked(false);
    setScannerVisible(true);
  }, [device, hasPermission, requestPermission]);

  const closeScanner = useCallback(() => {
    setScannerVisible(false);
    isScanLockedRef.current = false;
    setIsScanLocked(false);
    setIsCheckingIn(false);
  }, []);

  const handleQrCodeScanned = useCallback(async value => {
    const payload = identifyQrPayload(value);

    if (payload.type !== QR_TYPE.VENUE_QR) {
      setScannerVisible(false);
      Alert.alert(
        'Unsupported QR Code',
        'Please scan the venue QR poster displayed at the facility.',
        [
          { text: 'Scan Again', onPress: () => {
            isScanLockedRef.current = false;
            setIsScanLocked(false);
            setScannerVisible(true);
          } },
          { text: 'Done', style: 'cancel' },
        ],
      );
      return;
    }

    setIsCheckingIn(true);
    setScannerVisible(false);

    try {
      const result = await venueScanCheckIn({
        providerId: payload.providerId,
        sig: payload.sig,
        categoryId: selectedCategoryId || undefined,
      });

      Alert.alert(
        'Check-in Successful',
        result.message || 'You have successfully checked in.',
        [{ text: 'Done', style: 'default' }],
      );
      fetchLifecycleData();
    } catch (error) {
      Alert.alert(
        'Check-in Failed',
        parseApiFailure(error, 'Unable to complete check-in. Please try again.'),
        [
          { text: 'Scan Again', onPress: () => {
            isScanLockedRef.current = false;
            setIsScanLocked(false);
            setScannerVisible(true);
          } },
          { text: 'Done', style: 'cancel' },
        ],
      );
    } finally {
      setIsCheckingIn(false);
    }
  }, [selectedCategoryId, fetchLifecycleData]);

  const handleCheckout = useCallback(async () => {
    if (!currentCheckedInBooking) return;

    Alert.alert(
      'Confirm Checkout',
      'Are you sure you want to checkout from this facility?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Checkout',
          style: 'destructive',
          onPress: async () => {
            setIsCheckingOut(true);
            try {
              const result = await checkoutBooking(currentCheckedInBooking.id);

              Alert.alert(
                'Checkout Successful',
                result.message || 'You have successfully checked out.',
                [{ text: 'Done', style: 'default' }],
              );

              fetchLifecycleData();
            } catch (error) {
              Alert.alert(
                'Checkout Failed',
                parseApiFailure(error, 'Unable to complete checkout. Please try again.'),
              );
            } finally {
              setIsCheckingOut(false);
            }
          }
        }
      ]
    );
  }, [currentCheckedInBooking, fetchLifecycleData]);

  const handleCancelBooking = useCallback((booking) => {
    const noticeHrs = providerDetails?.accessConfig?.cancelNoticeHrs || booking.provider?.accessConfig?.cancelNoticeHrs || 12;
    const now = new Date();
    const start = new Date(booking.startTime);
    const diffHrs = (start - now) / (1000 * 60 * 60);
    const isLateCancel = diffHrs < noticeHrs;
    
    const warningText = isLateCancel 
      ? `\n\n⚠️ WARNING: This is a late cancellation (less than ${noticeHrs} hours notice). You will not be refunded your session/credit and it cannot be rescheduled.`
      : `\n\nYou will be fully refunded and can reschedule another time.`;

    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.provider?.name || gymName}?${warningText}`,
      [
        { text: 'No, Keep it', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoadingHistory(true);
              await cancelBooking(booking.id);
              fetchLifecycleData();
              Alert.alert('Success', 'Booking cancelled successfully.');
            } catch (err) {
              const msg = parseApiFailure(err);
              Alert.alert('Error', msg || 'Failed to cancel booking.');
            } finally {
              setIsLoadingHistory(false);
            }
          }
        }
      ]
    );
  }, [gymName, fetchLifecycleData]);

  const handleGenerateBookingQr = useCallback(async booking => {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      Alert.alert(
        'Location Required',
        'Location is required to generate a booking check-in pass.',
        [
          { text: 'Enable Location', onPress: () => locationActions?.requestPermission?.() },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    setIsGeneratingQr(true);
    try {
      const result = await generateBookingQr(booking.id, userLocation);
      setQrPass({
        booking,
        qrToken: result.qrToken,
        expiresInSeconds: result.expiresInSeconds,
      });
    } catch (error) {
      Alert.alert(
        'QR Pass Failed',
        parseApiFailure(error, 'Unable to generate a booking check-in pass.'),
      );
    } finally {
      setIsGeneratingQr(false);
    }
  }, [locationActions, userLocation]);

  useEffect(() => {
    if (
      isOpenAccess &&
      route?.params?.openAccessAutoOpenScanner &&
      (!isGlobalBundlePackage || selectedCategoryId) &&
      device &&
      !didAutoOpenScannerRef.current
    ) {
      didAutoOpenScannerRef.current = true;
      openScanner();
    }
  }, [device, isGlobalBundlePackage, isOpenAccess, openScanner, route?.params?.openAccessAutoOpenScanner, selectedCategoryId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#170B20" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroArc} />
          <Image source={{ uri: image }} style={styles.gymImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.qrMark}
            onPress={openBooking}
            activeOpacity={0.85}
          >
            <Icon name="qr-code-outline" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.gymName}>{gymName}</Text>
          <Text style={styles.planName}>{planName}</Text>
          {!!tierName && <Text style={styles.tierName}>{tierName}</Text>}
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.curveLayer}>
          <Svg height="90" width="100%" viewBox="0 0 360 90">
            <Path
              d="M0 22 C90 110 270 110 360 22"
              stroke="#FFFFFF"
              strokeWidth="2"
              fill="none"
            />
          </Svg>
          <View style={[styles.orbitDot, styles.orbitLeft]} />
          <View style={[styles.orbitDot, styles.orbitCenter]} />
          <View style={[styles.orbitDot, styles.orbitRight]} />
        </View>

        <View style={styles.dateRow}>
          <View>
            <Text style={styles.metaLabel}>START DATE</Text>
            <Text style={styles.metaValue}>{startDate}</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>EXPIRES ON</Text>
            <Text style={styles.metaValue}>{endDate}</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Membership Duration</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#744194', '#4F276B']}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
            <Text style={styles.daysLeft}>
              {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
            </Text>
          </View>
        </View>

        <View style={styles.renewRow}>
          <Icon name="sync" size={22} color="#FFF" />
          <View style={styles.renewCopy}>
            <Text style={styles.renewTitle}>Auto-Renew</Text>
            <Text style={styles.renewSub}>
              {autoRenew ? `Renews ${endDate}` : `Expires ${endDate} (Auto-Renew Off)`}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleTrack,
              {
                backgroundColor: autoRenew ? '#6A3C91' : '#281E31',
                alignItems: autoRenew ? 'flex-end' : 'flex-start',
                opacity: isTogglingRenew ? 0.6 : 1,
              },
            ]}
            onPress={handleToggleAutoRenew}
            disabled={isTogglingRenew}
            activeOpacity={0.8}
          >
            <View style={styles.toggleKnob} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statMain}>
              {latestCheckIn ? formatBookingDate(latestCheckIn.date || latestCheckIn.checkedAt) : 'NONE'}
            </Text>
            <Text style={styles.statSub}>Last Check-in</Text>
            <Text style={styles.statTiny}>
              {latestCheckIn ? formatTime(latestCheckIn.date || latestCheckIn.checkedAt) : 'No visits yet'}
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Icon name="flame" size={28} color="#FF6B4A" style={{ marginBottom: 2 }} />
            <Text style={[styles.statNumber, { fontWeight: '700' }]}>{streakDays}</Text>
            <Text style={styles.statSub}>Day Streak</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{avgDuration} M</Text>
            <Text style={styles.statSub}>Avg Duration</Text>
            <Text style={styles.statTiny}>Based on visits</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>{remainingCredits}</Text>
            <Text style={styles.statSub}>Credits Left</Text>
            <Text style={styles.statTiny}>{userPlanStatus}</Text>
          </LinearGradient>
        </View>

        {isGlobalBundlePackage && packageCategories.length > 0 && (
          <View style={styles.categoryPickerBlock}>
            <Text style={styles.sectionKicker}>CHOOSE ACCESS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membershipChoicesRow}
            >
              {packageCategories.map(category => {
                const isSelected = selectedCategoryId === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.membershipChoicePill, isSelected && styles.membershipChoicePillActive]}
                    onPress={() => setSelectedCategoryId(category.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.membershipChoiceText, isSelected && styles.membershipChoiceTextActive]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {console.log('[DEBUG_CTA] Values:', {
          isAccessModeLoading,
          isUpgradeOnlyPackage,
          isCheckingOut,
          isOpenAccess,
          currentCheckedInBooking: !!currentCheckedInBooking,
          remainingCredits,
          matchedUserPlan: !!matchedUserPlan,
          baseCredits: matchedUserPlan?.creditledger ? (matchedUserPlan.creditledger.totalCredits - matchedUserPlan.creditledger.usedCredits) : 0,
          activeEscrowed,
          subscriptionId: subscription?.id,
          userPlanCount: user?.userPlans?.length
        })}
        {!isOneTime && false} 
          <TouchableOpacity
            style={[
              styles.bookNowButton,
              (isAccessModeLoading || isUpgradeOnlyPackage || isCheckingOut || (isOpenAccess ? (!currentCheckedInBooking && remainingCredits <= 0) : remainingCredits <= 0)) && { opacity: 0.5 }
            ]}
            onPress={isAccessModeLoading || isCheckingOut ? undefined : openBooking}
            activeOpacity={0.88}
            disabled={isAccessModeLoading || isUpgradeOnlyPackage || isCheckingOut || (isOpenAccess ? (!currentCheckedInBooking && remainingCredits <= 0) : remainingCredits <= 0)}
          >
            {isCheckingOut ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Icon
                name={
                  isUpgradeOnlyPackage
                    ? 'lock-closed-outline'
                    : isOpenAccess
                    ? currentCheckedInBooking
                      ? 'log-out-outline'
                      : 'qr-code-outline'
                    : 'calendar-outline'
                }
                size={22}
                color="#FFF"
              />
            )}
            <Text style={styles.bookNowText}>
              {isAccessModeLoading
                ? 'Loading...'
                : isCheckingOut
                ? 'Checking out...'
                : isUpgradeOnlyPackage
                ? 'Upgrade Only'
                : isOpenAccess
                ? currentCheckedInBooking
                  ? 'Checkout'
                  : 'Scan Venue QR'
                : isAppointmentOnly
                ? 'Request Appointment'
                : 'Book Session'}
            </Text>
          </TouchableOpacity>

        {!isOpenAccess && (
          <>
            <Text style={styles.sectionKicker}>UPCOMING BOOKINGS</Text>
            {isLoadingHistory ? (
              <View style={styles.historyLoadingRow}>
                <ActivityIndicator color="#FFF" />
                <Text style={styles.historyLoadingText}>Loading bookings...</Text>
              </View>
            ) : upcomingBookings.length === 0 ? (
              <View style={styles.emptySessionRow}>
                <Text style={styles.emptySessionText}>No upcoming bookings yet.</Text>
              </View>
            ) : upcomingBookings.map(booking => {
              const status = booking.bookingStatus || booking.status;
              const canGenerateQr = status === 'CONFIRMED';
              return (
                <View style={styles.sessionRow} key={booking.id}>
                  <View style={styles.sessionTime}>
                    <Text style={styles.sessionHour}>{formatTime(booking.startTime)}</Text>
                    <Text style={styles.sessionDay}>{formatBookingDate(booking.startTime)}</Text>
                  </View>
                  <View style={styles.sessionCopy}>
                    <Text style={styles.sessionTitle}>{booking.provider?.name || gymName}</Text>
                    <Text style={styles.sessionSub}>{status}</Text>
                  </View>
                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={[styles.sessionPill, styles.sessionPillCancel]}
                      onPress={() => handleCancelBooking(booking)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.sessionPillText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sessionPill, (!canGenerateQr || isGeneratingQr) && styles.sessionPillDisabled]}
                      onPress={() => handleGenerateBookingQr(booking)}
                      disabled={!canGenerateQr || isGeneratingQr}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.sessionPillText}>{isGeneratingQr ? '...' : 'QR'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}




        <View style={styles.infoPanel}>
          <InfoRow title="Opening Hours" value={openingHours} styles={styles} />
          <InfoRow title="Current Crowd" value={crowdLevel} valuePill styles={styles} />
          <InfoRow title="Parking" value={parkingText} styles={styles} />
          <InfoRow title="Lockers" value={lockersText} styles={styles} />

          <View style={styles.amenityWrap}>
            {amenities.map(item => (
              <View key={item} style={styles.amenityPill}>
                <Text style={styles.amenityText}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.navigateButton}
            onPress={openDirections}
          >
            <Icon name="navigate" size={22} color="#FFF" />
            <Text style={styles.navigateText}>Navigate to Gym</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <SafeAreaView style={styles.scannerContainer} edges={['top', 'bottom', 'left', 'right']}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerCloseButton}
              onPress={closeScanner}
            >
              <Icon name="close" size={26} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Venue QR</Text>
        <View style={styles.scannerCloseButton} />
          </View>

          <View style={styles.cameraWrap}>
            {device && hasPermission ? (
              <QRScanner
                device={device}
                isActive={scannerVisible}
                isScanLocked={isScanLocked}
                onQrCodeScanned={value => {
                  if (isScanLockedRef.current) return;
                  isScanLockedRef.current = true;
                  setIsScanLocked(true);
                  handleQrCodeScanned(value);
                }}
              />
            ) : (
              <View style={styles.cameraUnavailable}>
                <Icon name="camera-outline" size={34} color="#FFF" />
                <Text style={styles.cameraUnavailableText}>
                  Camera is not available
                </Text>
              </View>
            )}

            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.scanCornerTopLeft]} />
              <View style={[styles.scanCorner, styles.scanCornerTopRight]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomLeft]} />
              <View style={[styles.scanCorner, styles.scanCornerBottomRight]} />
            </View>
          </View>

          <Text style={styles.scanHint}>
            {isCheckingIn ? 'Checking you in...' : 'Place the venue QR inside the frame'}
          </Text>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={Boolean(qrPass)}
        animationType="fade"
        transparent
        onRequestClose={() => setQrPass(null)}
      >
        <View style={styles.qrPassBackdrop}>
          <View style={styles.qrPassCard}>
            <Text style={styles.qrPassTitle}>Booking Check-in Pass</Text>
            <Text style={styles.qrPassMeta}>
              {qrPass?.booking ? `${formatBookingDate(qrPass.booking.startTime)} · ${formatTime(qrPass.booking.startTime)}` : ''}
            </Text>
            <View style={styles.qrCodeWrapper}>
              {qrPass?.qrToken ? (
                <QRCode
                  value={qrPass.qrToken}
                  size={160}
                  color="#000"
                  backgroundColor="#FFF"
                />
              ) : (
                <Text style={styles.qrTokenText}>No token generated</Text>
              )}
            </View>
            <Text style={styles.qrPassHint}>
              Expires in {qrPass?.expiresInSeconds || 60}s. Keep this pass open while staff completes the scan.
            </Text>
            <TouchableOpacity
              style={styles.qrPassClose}
              onPress={() => setQrPass(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.qrPassCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow = ({ title, value, valuePill, styles }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon} />
    <Text style={styles.infoTitle}>{title}</Text>
    <View style={styles.infoSpacer} />
    {valuePill ? (
      <View style={styles.infoValuePill}>
        <Text style={styles.infoValuePillText}>{value}</Text>
      </View>
    ) : (
      <Text style={styles.infoValue}>{value}</Text>
    )}
  </View>
);

const createStyles = ({ fs, sp, ms, wp, isTablet, isLandscape, maxContentWidth, shortest }, insets) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  content: {
    paddingBottom: Math.max(insets.bottom, sp(18)) + sp(16),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  hero: {
    minHeight: ms(isLandscape ? 150 : 190),
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: sp(12),
    left: sp(18),
    zIndex: 3,
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArc: {
    position: 'absolute',
    top: -ms(190),
    width: Math.max(wp(138), ms(420)),
    height: ms(330),
    borderBottomLeftRadius: ms(260),
    borderBottomRightRadius: ms(260),
    backgroundColor: '#1B0D27',
  },
  gymImage: {
    width: ms(112),
    height: ms(112),
    borderRadius: ms(56),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  qrMark: { position: 'absolute', right: 28, bottom: 26 },
  titleBlock: { alignItems: 'center', marginTop: 18 },
  membershipChoicesRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 8,
  },
  membershipChoicePill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#140B1D',
  },
  membershipChoicePillActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#2C1640',
  },
  membershipChoiceText: {
    color: '#C8C3CE',
    fontSize: 12,
    fontWeight: '600',
  },
  membershipChoiceTextActive: {
    color: '#FFFFFF',
  },
  categoryPickerBlock: {
    marginTop: 18,
    marginBottom: 2,
  },
  gymName: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  planName: { color: '#B8B1C2', fontSize: 14, marginTop: 3 },
  tierName: { color: '#D8D1E1', fontSize: 13, marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#158028',
    borderRadius: ms(10),
    paddingHorizontal: sp(8),
    paddingVertical: sp(3),
    marginTop: sp(6),
  },
  activeDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(2.5),
    backgroundColor: '#FFF',
    marginRight: sp(5),
  },
  activeText: { color: '#FFF', fontSize: fs(7, { min: 7, max: 9 }), fontWeight: '900' },
  curveLayer: { height: ms(112), justifyContent: 'center', marginTop: -sp(6) },
  orbitDot: {
    position: 'absolute',
    width: ms(66),
    height: ms(66),
    borderRadius: ms(33),
    backgroundColor: '#E4E4E4',
  },
  orbitLeft: { left: sp(26), top: sp(36) },
  orbitCenter: { alignSelf: 'center', top: sp(72) },
  orbitRight: { right: sp(26), top: sp(36) },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: sp(isTablet ? 48 : 34),
    marginTop: sp(18),
  },
  metaLabel: {
    color: '#777183',
    fontSize: fs(10),
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: sp(8),
  },
  metaValue: { color: '#FFF', fontSize: fs(16), fontWeight: '800' },
  progressBlock: { paddingHorizontal: sp(isTablet ? 48 : 34), marginTop: sp(28) },
  progressHeader: { marginBottom: sp(10) },
  progressTitle: { color: '#A9A0B3', fontSize: fs(13), fontWeight: '800' },
  progressTrack: {
    minHeight: ms(22),
    borderRadius: ms(11),
    backgroundColor: '#1B1720',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '66%',
  },
  daysLeft: {
    color: '#C5BED0',
    fontSize: fs(10),
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginRight: sp(12),
  },
  renewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(isTablet ? 48 : 34),
    marginTop: sp(20),
  },
  renewCopy: { flex: 1, marginLeft: sp(18), minWidth: 0 },
  renewTitle: { color: '#FFF', fontSize: fs(16), fontWeight: '900' },
  renewSub: { color: '#777183', fontSize: fs(11), marginTop: sp(2) },
  toggleTrack: {
    width: ms(58),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: '#6A3C91',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: sp(3),
  },
  toggleKnob: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(12),
    paddingHorizontal: sp(isTablet ? 48 : 34),
    marginTop: sp(20),
  },
  statCard: {
    flexBasis: isTablet ? '23%' : '47%',
    flexGrow: 1,
    minHeight: ms(76),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMain: { color: '#FFF', fontSize: fs(16), fontWeight: '800' },
  statNumber: { color: '#FFF', fontSize: fs(20), fontWeight: '300' },
  statSub: { color: '#BFB5CC', fontSize: fs(9), marginTop: sp(4), textAlign: 'center' },
  statTiny: { color: '#776E82', fontSize: fs(8), marginTop: sp(3), textAlign: 'center' },
  bookNowButton: {
    minHeight: ms(58),
    borderRadius: ms(16),
    backgroundColor: '#4A2666',
    marginHorizontal: sp(isTablet ? 48 : 34),
    marginTop: sp(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(10),
  },
  bookNowText: {
    color: '#FFF',
    fontSize: fs(18),
    fontWeight: '900',
  },
  sessionPillText: {
    color: '#000',
    fontSize: fs(12),
    fontWeight: '800',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionPillCancel: {
    backgroundColor: '#FF4A4A',
  },
  sectionKicker: {
    color: '#7E7788',
    fontSize: fs(12),
    letterSpacing: 1.5,
    marginTop: sp(42),
    marginBottom: sp(22),
    paddingHorizontal: sp(isTablet ? 48 : 34),
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(isTablet ? 48 : 34),
    marginBottom: sp(28),
    gap: sp(12),
  },
  sessionTime: { width: ms(78) },
  sessionHour: { color: '#FFF', fontSize: fs(20), fontWeight: '900' },
  sessionDay: { color: '#777183', fontSize: fs(10), fontWeight: '800' },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionTitle: { color: '#FFF', fontSize: fs(16), fontWeight: '900' },
  sessionSub: { color: '#8F8797', fontSize: fs(10), marginTop: sp(4) },
  sessionPill: {
    backgroundColor: '#24112F',
    paddingHorizontal: sp(13),
    paddingVertical: sp(6),
    borderRadius: ms(14),
  },
  sessionPillDisabled: {
    opacity: 0.45,
  },
  sessionPillText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  historyLoadingRow: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    gap: 8,
  },
  historyLoadingText: {
    color: '#AFA7B8',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySessionRow: {
    marginHorizontal: 34,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySessionText: {
    color: '#AFA7B8',
    fontSize: 13,
    fontWeight: '700',
  },
  infoPanel: {
    marginHorizontal: sp(isTablet ? 48 : 26),
    borderRadius: ms(22),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: sp(22),
    paddingTop: sp(18),
    paddingBottom: sp(26),
    backgroundColor: '#030303',
  },
  infoRow: {
    minHeight: ms(74),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(8),
    backgroundColor: '#FFF',
    marginRight: sp(16),
  },
  infoTitle: { color: '#AFA7B8', fontSize: fs(15), fontWeight: '700', flexShrink: 1 },
  infoSpacer: { flex: 1 },
  infoValue: { color: '#FFF', fontSize: fs(16), fontWeight: '900', textAlign: 'right', flexShrink: 1 },
  infoValuePill: {
    backgroundColor: '#1F0D2C',
    borderRadius: ms(12),
    paddingHorizontal: sp(14),
    paddingVertical: sp(7),
  },
  infoValuePillText: { color: '#FFF', fontSize: fs(12), fontWeight: '900' },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp(10),
    paddingTop: sp(20),
    paddingBottom: sp(26),
  },
  amenityPill: {
    backgroundColor: '#1D0E28',
    borderRadius: ms(10),
    paddingHorizontal: sp(15),
    paddingVertical: sp(10),
  },
  amenityText: { color: '#D9D1E4', fontSize: fs(12), fontWeight: '800' },
  navigateButton: {
    minHeight: ms(58),
    borderRadius: 2,
    backgroundColor: '#24102E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(12),
  },
  navigateText: { color: '#FFF', fontSize: fs(18), fontWeight: '900' },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    minHeight: ms(58),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(16),
  },
  scannerCloseButton: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    color: '#FFF',
    fontSize: fs(17),
    fontWeight: '900',
  },
  cameraWrap: {
    flex: 1,
    margin: sp(18),
    borderRadius: ms(26),
    overflow: 'hidden',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraUnavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp(12),
  },
  cameraUnavailableText: {
    color: '#FFF',
    fontSize: fs(14),
    fontWeight: '700',
  },
  scanFrame: {
    width: Math.min(ms(240), shortest - sp(72)),
    height: Math.min(ms(240), shortest - sp(72)),
    position: 'absolute',
  },
  scanCorner: {
    position: 'absolute',
    width: ms(48),
    height: ms(48),
    borderColor: '#FFF',
  },
  scanCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  scanCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  scanCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  scanCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  scanHint: {
    color: '#CFC7D8',
    textAlign: 'center',
    fontSize: fs(14),
    fontWeight: '700',
    paddingHorizontal: sp(24),
    paddingBottom: Math.max(insets.bottom, sp(18)),
  },
  qrPassBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  qrPassCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#08050C',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 22,
    alignItems: 'center',
  },
  qrPassTitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '900',
  },
  qrPassMeta: {
    color: '#AFA7B8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  qrCodeWrapper: {
    width: 196,
    height: 196,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  qrTokenText: {
    color: '#D9D1E4',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 14,
  },
  qrPassHint: {
    color: '#8F8797',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 14,
  },
  qrPassClose: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4A2666',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
  },
  qrPassCloseText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default MembershipDetailsScreen;
