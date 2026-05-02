import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import { getAllMultiProviders, getMultiProviderCheckInHistory, multiProviderCheckIn, multiProviderCheckOut } from '../../../redux/actions/multiProviderActions';
import { formatLocalTime } from '../../../utils/dateUtils';
import { Strings } from '../../../config/config';

const theme = {
  colors: {
    background: '#121212',
    primary: '#452829',
    surface: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textOnSurface: '#000000',
    textSecondaryOnSurface: 'rgba(0, 0, 0, 0.6)',
    borderColorOnSurface: 'rgba(0, 0, 0, 0.1)',
    success: '#4caf50',
    error: '#ff5252',
  },
  spacing: { s: 8, m: 16, l: 24, xl: 32 },
  borderRadius: { sm: 8, md: 16, full: 9999 },
  fontFamily: { regular: 'System', bold: 'System' },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  }
};

const MultiProviderTab = ({ userProfile, refreshKey, onManageBilling, isBillingLoading }) => {
  const dispatch = useDispatch();
  const [multiProviderSubscription, setMultiProviderSubscription] = useState(null);
  const [allMultiProviders, setAllMultiProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchasingTier, setPurchasingTier] = useState(null);
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const fetchMultiProviderData = async () => {
    setLoading(true);
    try {
      if (userProfile && userProfile.subscriptions) {
        const activeMultiProviderSub = userProfile.subscriptions.find(
          sub => (sub.multiProviderTierId || sub.multiGymTierId) && sub.status === 'active'
        );
        setMultiProviderSubscription(activeMultiProviderSub || null);
      }

      const providersResponse = await dispatch(getAllMultiProviders());
      if (providersResponse.success) {
        setAllMultiProviders(providersResponse.data);
      }

      const historyResponse = await dispatch(getMultiProviderCheckInHistory());
      if (historyResponse.success) {
        const activeCheckInRecord = historyResponse.data.find(
          checkIn => !checkIn.checkOut
        );
        setActiveCheckIn(activeCheckInRecord || null);
      }
    } catch (err) {
      console.error('[MultiProviderTab] Failed to fetch data:', err);
      Alert.alert("Error", Strings.MultiProviderTab.alerts.loadFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (providerId) => {
    setCheckingIn(true);
    try {
      const response = await dispatch(multiProviderCheckIn(providerId));
      if (response.success) {
        Alert.alert("Success", Strings.MultiProviderTab.alerts.checkIn.success);
        fetchMultiProviderData();
      } else {
        Alert.alert("Error", response.message || Strings.MultiProviderTab.alerts.checkIn.failed);
      }
    } catch (error) {
      console.error('[MultiProviderTab] Failed to check in:', error);
      Alert.alert("Error", error.response?.data?.message || Strings.MultiProviderTab.alerts.checkIn.failed);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!activeCheckIn) return;
    setCheckingOut(true);
    try {
      const response = await dispatch(multiProviderCheckOut(activeCheckIn.id));
      if (response.success) {
        Alert.alert("Success", Strings.MultiProviderTab.alerts.checkOut.success);
        fetchMultiProviderData();
      } else {
        Alert.alert("Error", response.message || Strings.MultiProviderTab.alerts.checkOut.failed);
      }
    } catch (error) {
      console.error('[MultiProviderTab] Failed to check out:', error);
      Alert.alert("Error", error.response?.data?.message || Strings.MultiProviderTab.alerts.checkOut.failed);
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePurchaseTier = async (tierId) => {
    setPurchasingTier(tierId);
    try {
      const response = await dispatch(createCheckoutSession(tierId, 'MULTI_PROVIDER'));
      if (response.success && response.data.checkoutUrl) {
        await Linking.openURL(response.data.checkoutUrl);
      } else {
        Alert.alert(Strings.MultiProviderTab.alerts.purchase.failedTitle, response.message || Strings.MultiProviderTab.alerts.purchase.failedMessage);
      }
    } catch (error) {
      console.error('[MultiProviderTab] Failed to purchase tier:', error);
      Alert.alert(Strings.MultiProviderTab.alerts.purchase.failedTitle, error.response?.data?.message || Strings.MultiProviderTab.alerts.purchase.failedTier);
    } finally {
      setPurchasingTier(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMultiProviderData();
    }, [userProfile])
  );

  const accessibleProviders = multiProviderSubscription
    ? allMultiProviders.filter(p => (p.multiProviderTierId || p.multiGymTierId) === (multiProviderSubscription.multiProviderTierId || multiProviderSubscription.multiGymTierId))
    : [];

  const renderProviderCard = ({ item }) => {
    const isCheckedIn = activeCheckIn && (activeCheckIn.providerId === item.id || activeCheckIn.gymId === item.id);
    return (
      <View style={styles.providerCard}>
        <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.providerImage} />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          <View style={styles.providerLocation}>
            <Icon name="location-on" size={14} color={theme.colors.textSecondaryOnSurface} />
            <Text style={styles.providerAddress} numberOfLines={1}>{item.address}</Text>
          </View>
          <View style={styles.checkInStatusContainer}>
            {isCheckedIn ? (
              <View style={styles.checkedInStatus}>
                <Icon name="check-circle" size={16} color={theme.colors.success} />
                <Text style={styles.checkedInText}>{Strings.MultiProviderTab.subscription.checkIn.status}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.checkInButton}
                onPress={() => handleCheckIn(item.id)}
                disabled={checkingIn || !!activeCheckIn}
              >
                {checkingIn ? (
                  <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                ) : (
                  <Text style={styles.checkInButtonText}>{Strings.MultiProviderTab.subscription.checkIn.button}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderActiveSubscriptionView = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.card}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionTitle}>
            {Strings.MultiProviderTab.subscription.activeTitle(
              multiProviderSubscription.multiProviderTier?.badge || multiProviderSubscription.multiGymTier?.badge || '🏆', 
              multiProviderSubscription.multiProviderTier?.name || multiProviderSubscription.multiGymTier?.name || 'Partner'
            )}
          </Text>
        </View>
        {activeCheckIn && (
          <View style={styles.activeCheckInContainer}>
            <View style={styles.activeCheckInInfo}>
              <Text style={styles.activeCheckInTitle}>{Strings.MultiProviderTab.subscription.checkIn.title}</Text>
              <Text style={styles.activeCheckInProvider}>{activeCheckIn.provider?.name || activeCheckIn.gym?.name || 'Partner'}</Text>
              <Text style={styles.activeCheckInTime}>
                {Strings.MultiProviderTab.subscription.checkIn.since} {formatLocalTime(activeCheckIn.checkIn)}
              </Text>
            </View>
            <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut} disabled={checkingOut}>
              {checkingOut ? (
                <ActivityIndicator size="small" color={theme.colors.textPrimary} />
              ) : (
                <Text style={styles.checkOutButtonText}>Check Out</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity style={styles.manageButton} onPress={onManageBilling} disabled={isBillingLoading}>
          {isBillingLoading ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.manageButtonText}>{Strings.MultiProviderTab.subscription.manageButton}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.sectionTitle}>{Strings.MultiProviderTab.sections.accessibleProviders(accessibleProviders.length)}</Text>
      {accessibleProviders.length > 0 ? (
        <FlatList
          data={accessibleProviders}
          keyExtractor={(item) => item.id}
          renderItem={renderProviderCard}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={[styles.card, styles.emptyStateCard]}>
          <Icon name="business" size={48} color={theme.colors.textSecondaryOnSurface} />
          <Text style={styles.emptyText}>{Strings.MultiProviderTab.states.emptyProviders}</Text>
          <Text style={styles.emptySubtext}>{Strings.MultiProviderTab.states.emptyProvidersSubtext}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : multiProviderSubscription ? (
        renderActiveSubscriptionView()
      ) : (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{Strings.MultiProviderTab.sections.choosePlan}</Text>
          {Strings.MultiProviderTab.tiers.map((tier) => (
            <View key={tier.id} style={[styles.planCard, tier.popular && styles.popularPlanCard]}>
              {tier.popular && <View style={styles.popularBadge}><Text style={styles.popularBadgeText}>{Strings.MultiProviderTab.states.popularBadge}</Text></View>}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{tier.badge} {tier.name}</Text>
                <Text style={styles.planPrice}>${tier.price}/mo</Text>
              </View>
              <Text style={styles.planDescription}>{tier.description}</Text>
              <View style={styles.featuresList}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon name="check-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity 
                style={[styles.subscribeButton, purchasingTier === tier.id && styles.disabledButton]} 
                onPress={() => handlePurchaseTier(tier.id)}
                disabled={purchasingTier === tier.id}
              >
                {purchasingTier === tier.id ? (
                  <ActivityIndicator size="small" color={theme.colors.textPrimary} />
                ) : (
                  <Text style={styles.subscribeButtonText}>{Strings.MultiProviderTab.states.subscribeButton}</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.m },
  sectionContainer: { marginTop: theme.spacing.l, marginBottom: theme.spacing.l },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: theme.spacing.m, fontFamily: theme.fontFamily.bold },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: theme.spacing.xl },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m, ...theme.shadow },
  subscriptionHeader: { alignItems: 'center', marginBottom: theme.spacing.m },
  subscriptionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  manageButton: { backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: theme.borderRadius.full, alignItems: 'center' },
  manageButtonText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: theme.fontFamily.bold },
  activeCheckInContainer: { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: theme.borderRadius.sm, padding: theme.spacing.m, marginBottom: theme.spacing.m },
  activeCheckInInfo: { marginBottom: theme.spacing.m },
  activeCheckInTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textOnSurface, marginBottom: 4 },
  activeCheckInProvider: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textOnSurface },
  activeCheckInTime: { fontSize: 12, color: theme.colors.textSecondaryOnSurface, marginTop: 2 },
  checkOutButton: { backgroundColor: theme.colors.error, paddingVertical: 10, borderRadius: theme.borderRadius.full, alignItems: 'center' },
  checkOutButtonText: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  providerCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m, alignItems: 'center', ...theme.shadow },
  providerImage: { width: 80, height: 80, borderRadius: theme.borderRadius.sm, marginRight: theme.spacing.m },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  providerLocation: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s / 2 },
  providerAddress: { fontSize: 12, marginLeft: 4, flex: 1, color: theme.colors.textSecondaryOnSurface },
  checkInStatusContainer: { marginTop: theme.spacing.s },
  checkInButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full, alignSelf: 'flex-start' },
  checkInButtonText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: 'bold' },
  checkedInStatus: { flexDirection: 'row', alignItems: 'center' },
  checkedInText: { color: theme.colors.success, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  emptyStateCard: { alignItems: 'center', padding: theme.spacing.xl },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: theme.spacing.m, color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  emptySubtext: { fontSize: 14, textAlign: 'center', color: theme.colors.textSecondaryOnSurface, marginTop: theme.spacing.s },
  planCard: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.l, position: 'relative', ...theme.shadow },
  popularPlanCard: { borderColor: theme.colors.primary, borderWidth: 2 },
  popularBadge: { position: 'absolute', top: -12, left: '50%', transform: [{ translateX: -50 }], backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.m, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  popularBadgeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s },
  planName: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, fontFamily: theme.fontFamily.bold },
  planDescription: { fontSize: 14, color: theme.colors.textSecondaryOnSurface, marginBottom: theme.spacing.m, fontFamily: theme.fontFamily.regular },
  featuresList: { marginBottom: theme.spacing.m },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.s },
  featureText: { fontSize: 14, color: theme.colors.textOnSurface, marginLeft: theme.spacing.s, fontFamily: theme.fontFamily.regular },
  subscribeButton: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.full, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  subscribeButtonText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: theme.fontFamily.bold },
});

export default MultiProviderTab;
