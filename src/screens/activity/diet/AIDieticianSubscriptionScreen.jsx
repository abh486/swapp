import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getSubscriptionDetails, cancelSubscription } from '../services/aiDieticianService';
import { FullScreenLoader } from '../../../components/GlobalLoader';

const AIDieticianSubscriptionScreen = ({ navigation }) => {
  const [subDetails, setSubDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchDetails = async () => {
    try {
      const data = await getSubscriptionDetails();
      setSubDetails(data);
    } catch (err) {
      console.error('[AIDieticianSubscription] Fetch failed:', err);
      Alert.alert('Error', 'Failed to retrieve subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleCancel = () => {
    if (!subDetails || !subDetails.subscriptionId) {
      Alert.alert('Cannot Cancel', 'This subscription cannot be cancelled (e.g. Free Trial or inactive).');
      return;
    }

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? Your access remains active until the end of the current billing cycle.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              await cancelSubscription(subDetails.subscriptionId);
              Alert.alert('Subscription Cancelled', 'Your subscription will not renew at the end of the term.');
              await fetchDetails();
            } catch (err) {
              console.error('[AIDieticianSubscription] Cancel failed:', err);
              Alert.alert('Error', err.response?.data?.message || err.message);
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  const isNonRenewing = subDetails?.status === 'non_renewing';
  const showCancelBtn = subDetails && subDetails.accessSource === 'SUBSCRIPTION' && !isNonRenewing;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.75}
        >
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage AI Subscription</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {subDetails ? (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan Name</Text>
                <Text style={styles.infoValue}>{subDetails.planName}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Access Source</Text>
                <Text style={styles.infoValue}>{subDetails.accessSource}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: isNonRenewing ? '#e67e22' : '#2ecc71', textTransform: 'uppercase' }]}>
                  {isNonRenewing ? 'NON RENEWING' : subDetails.status}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expiry / Term End</Text>
                <Text style={styles.infoValue}>{formatDate(subDetails.currentTermEnd)}</Text>
              </View>
            </View>

            {isNonRenewing && (
              <View style={styles.warningCard}>
                <Icon name="information-circle" size={20} color="#e67e22" style={{ marginRight: 8 }} />
                <Text style={styles.warningText}>
                  Your subscription remains active until {formatDate(subDetails.currentTermEnd)}.
                </Text>
              </View>
            )}

            {showCancelBtn && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isCancelling}
              >
                <Text style={styles.cancelButtonText}>
                  {isCancelling ? 'Processing...' : 'Cancel Subscription'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.noSubContainer}>
            <Icon name="nutrition-outline" size={60} color="#555" style={{ marginBottom: 16 }} />
            <Text style={styles.noSubText}>No active subscription found.</Text>
            <TouchableOpacity
              style={styles.subscribeLink}
              onPress={() => navigation.navigate('AIDieticianPaywall')}
            >
              <Text style={styles.subscribeLinkText}>Browse Subscription Plans</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 26 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  detailsCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  warningCard: {
    backgroundColor: 'rgba(230, 126, 34, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 126, 34, 0.2)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningText: {
    color: '#e67e22',
    fontSize: 12,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: 'bold',
  },
  noSubContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noSubText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 16,
  },
  subscribeLink: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  subscribeLinkText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AIDieticianSubscriptionScreen;
