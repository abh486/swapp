import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../../api/apiClient';
import { useDispatch } from 'react-redux';
import { getUserCheckIns, checkInToProvider, checkOutFromProvider } from '../../../redux/actions/subscriptionActions';
import { formatLocalTime } from '../../../utils/dateUtils';
import { useNavigation } from '@react-navigation/native';
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

const ProvidersTab = ({ userProfile, refreshKey }) => {
  const dispatch = useDispatch();
  const [subscribedProviders, setSubscribedProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [checkIns, setCheckIns] = useState([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const { navigate } = useNavigation();

  const fetchSubscribedProviders = async () => {
    setProvidersLoading(true);
    try {
      if (!userProfile?.subscriptions || userProfile.subscriptions.length === 0) {
        setSubscribedProviders([]);
        return;
      }
      const providerPlanIds = userProfile.subscriptions.filter(sub => sub.providerPlanId || sub.gymPlanId).map(sub => sub.providerPlanId || sub.gymPlanId);
      if (providerPlanIds.length === 0) {
        setSubscribedProviders([]);
        return;
      }
      const providersResponse = await apiClient.post('/providers/by-plan-ids', { planIds: providerPlanIds });
      if (providersResponse.data.success) {
        setSubscribedProviders(providersResponse.data.data);
      } else {
        throw new Error(providersResponse.data.message || Strings.ProvidersTab.alerts.error.loadProviders);
      }
    } catch (err) {
      console.error('[ProvidersTab] Failed to fetch subscribed providers:', err);
      Alert.alert(
        Strings.ProvidersTab.alerts.error.title, 
        err.response?.data?.message || Strings.ProvidersTab.alerts.error.loadProviders
      );
    } finally {
      setProvidersLoading(false);
    }
  };

  const fetchActiveCheckIns = async () => {
    setCheckInsLoading(true);
    try {
      const response = await dispatch(getUserCheckIns());
      const data = response?.data || response;
      if (response?.success || data) {
        const processedCheckIns = (Array.isArray(data) ? data : []).map(checkIn => {
          const processedCheckIn = { ...checkIn };
          if (checkIn.checkIn && typeof checkIn.checkIn === 'string') {
            processedCheckIn.checkIn = new Date(checkIn.checkIn);
          }
          if (checkIn.checkOut && typeof checkIn.checkOut === 'string') {
            processedCheckIn.checkOut = new Date(checkIn.checkOut);
          }
          return processedCheckIn;
        });
        setCheckIns(processedCheckIns);
      }
    } catch (err) {
      console.warn('[ProvidersTab] Failed to fetch check-ins:', err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  const handleViewProviderDetails = (provider) => {
    navigate('ProviderDetails', { id: provider.id });
  };

  const handleCheckInToProvider = async (provider) => {
    try {
      const response = await dispatch(checkInToProvider(provider.id));
      if (response.success) {
        Alert.alert(
          Strings.ProvidersTab.alerts.checkIn.successTitle, 
          Strings.ProvidersTab.alerts.checkIn.successMessage(provider.name)
        );
        fetchActiveCheckIns();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('[ProvidersTab] Check-in failed:', error);
      Alert.alert(
        Strings.ProvidersTab.alerts.error.checkInFailed, 
        error.response?.data?.message || Strings.ProvidersTab.alerts.error.generic
      );
    }
  };

  const handleCheckOutFromProvider = async (checkInId) => {
    try {
      const response = await dispatch(checkOutFromProvider(checkInId));
      if (response.success) {
        Alert.alert(
          Strings.ProvidersTab.alerts.checkOut.successTitle,
          Strings.ProvidersTab.alerts.checkOut.successMessage
        );
        fetchActiveCheckIns();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('[ProvidersTab] Check-out failed:', error);
      Alert.alert(
        Strings.ProvidersTab.alerts.error.checkOutFailed, 
        error.response?.data?.message || Strings.ProvidersTab.alerts.error.generic
      );
    }
  };

  const isCheckedInToProvider = (providerId) => {
    return checkIns.some(checkIn => (checkIn.providerId === providerId || checkIn.gymId === providerId) && !checkIn.checkOut);
  };

  const getCheckInForProvider = (providerId) => {
    return checkIns.find(checkIn => (checkIn.providerId === providerId || checkIn.gymId === providerId) && !checkIn.checkOut);
  };

  useEffect(() => {
    if (userProfile) {
      fetchSubscribedProviders();
      fetchActiveCheckIns();
    }
  }, [userProfile, refreshKey]);

  const safeUserProfile = userProfile || {};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{Strings.ProvidersTab.sections.myProviders}</Text>
        {providersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : subscribedProviders.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="business" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{Strings.ProvidersTab.emptyState.myProviders.title}</Text>
            <Text style={styles.emptySubtext}>{Strings.ProvidersTab.emptyState.myProviders.subtitle}</Text>
            {safeUserProfile.role === 'MEMBER' && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigate('Home')}>
                <Text style={styles.primaryButtonText}>{Strings.ProvidersTab.emptyState.myProviders.action}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={subscribedProviders}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isCheckedIn = isCheckedInToProvider(item.id);
              const checkInRecord = getCheckInForProvider(item.id);
              return (
                <View style={styles.providerCard}>
                  <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.providerImage} />
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{item.name}</Text>
                    <View style={styles.providerLocation}>
                      <Icon name="location-on" size={14} color={theme.colors.textSecondaryOnSurface} />
                      <Text style={styles.providerAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                    {isCheckedIn && (
                      <View style={styles.checkInStatus}>
                        <Icon name="check-circle" size={14} color={theme.colors.success} />
                        <Text style={styles.checkInStatusText}>
                          {Strings.ProvidersTab.providerCard.statusPrefix} {checkInRecord && checkInRecord.checkIn ?
                            formatLocalTime(checkInRecord.checkIn, "Active CheckIn Time") : 'Unknown time'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.providerActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleViewProviderDetails(item)}>
                      <Icon name="info" size={20} color={theme.colors.textSecondaryOnSurface} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.checkInOutButton, { backgroundColor: isCheckedIn ? theme.colors.error : theme.colors.success }]}
                      onPress={() => isCheckedIn ? handleCheckOutFromProvider(checkInRecord.id) : handleCheckInToProvider(item)}
                    >
                      <Icon name={isCheckedIn ? "logout" : "login"} size={16} color="#ffffff" />
                      <Text style={styles.checkInOutButtonText}>
                        {isCheckedIn ? Strings.ProvidersTab.providerCard.actions.checkOut : Strings.ProvidersTab.providerCard.actions.checkIn}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{Strings.ProvidersTab.sections.history}</Text>
        {checkInsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : checkIns.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{Strings.ProvidersTab.emptyState.history.title}</Text>
            <Text style={styles.emptySubtext}>{Strings.ProvidersTab.emptyState.history.subtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={checkIns}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.checkInHistoryCard}>
                <View style={styles.checkInHistoryInfo}>
                  <Text style={styles.checkInHistoryProviderName}>{item.provider?.name || item.gym?.name || 'Partner'}</Text>
                  <Text style={styles.checkInHistoryTime}>
                    {Strings.ProvidersTab.historyCard.labels.checkIn}{formatLocalTime(item.checkIn, "History CheckIn Time")}
                  </Text>
                  {item.checkOut ? (
                    <Text style={[styles.checkInHistoryTime, { color: theme.colors.success }]}>
                      {Strings.ProvidersTab.historyCard.labels.checkOut}{formatLocalTime(item.checkOut, "History CheckOut Time")}
                    </Text>
                  ) : (
                    <View style={styles.activeCheckInContainer}>
                      <Icon name="access-time" size={14} color={theme.colors.primary} />
                      <Text style={[styles.checkInHistoryTime, { color: theme.colors.primary }]}>
                        {Strings.ProvidersTab.historyCard.labels.active}
                      </Text>
                    </View>
                  )}
                </View>
                {!item.checkOut && (
                  <TouchableOpacity
                    style={[styles.checkInOutButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => handleCheckOutFromProvider(item.id)}
                  >
                    <Icon name="logout" size={16} color="#ffffff" />
                    <Text style={styles.checkInOutButtonText}>{Strings.ProvidersTab.providerCard.actions.checkOut}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.m },
  sectionContainer: { marginTop: theme.spacing.l, marginBottom: theme.spacing.l },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: theme.spacing.m, fontFamily: theme.fontFamily.bold },
  loadingContainer: { padding: theme.spacing.l, alignItems: 'center' },
  emptyState: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.xl, alignItems: 'center', ...theme.shadow },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: theme.spacing.m, color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  emptySubtext: { fontSize: 14, textAlign: 'center', color: theme.colors.textSecondaryOnSurface, marginTop: theme.spacing.s },
  primaryButton: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: theme.borderRadius.full, marginTop: theme.spacing.l, alignItems: 'center' },
  primaryButtonText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: theme.fontFamily.bold },
  providerCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m, alignItems: 'center', ...theme.shadow },
  providerImage: { width: 80, height: 80, borderRadius: theme.borderRadius.sm, marginRight: theme.spacing.m },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  providerLocation: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s / 2 },
  providerAddress: { fontSize: 12, marginLeft: 4, flex: 1, color: theme.colors.textSecondaryOnSurface },
  checkInStatus: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s },
  checkInStatusText: { fontSize: 12, marginLeft: 4, color: theme.colors.success },
  providerActions: { alignItems: 'center' },
  iconButton: { padding: theme.spacing.s },
  checkInOutButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.s, paddingVertical: theme.spacing.s / 2, borderRadius: theme.borderRadius.full, marginTop: theme.spacing.s },
  checkInOutButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  checkInHistoryCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m, alignItems: 'center', justifyContent: 'space-between', ...theme.shadow },
  checkInHistoryInfo: { flex: 1 },
  checkInHistoryProviderName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  checkInHistoryTime: { fontSize: 12, marginTop: theme.spacing.s / 2, color: theme.colors.textSecondaryOnSurface },
  activeCheckInContainer: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.s / 2 },
});

export default ProvidersTab;
