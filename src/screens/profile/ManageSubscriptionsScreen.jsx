import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import Chargebee from '@chargebee/react-native-chargebee';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import {
  getSubscriptionDetails as getAIDietSubscription,
  cancelSubscription as cancelAIDietSubscription,
} from '../../services/aiDieticianService';

const { width } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (val) => {
  if (!val) return 'N/A';
  const d = new Date(val);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysLeft = (endVal) => {
  if (!endVal) return null;
  const end = new Date(endVal);
  if (isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24)));
};

const getProgressPct = (startVal, endVal) => {
  if (!startVal || !endVal) return 0;
  const start = new Date(startVal).getTime();
  const end = new Date(endVal).getTime();
  const now = Date.now();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
};

const STATUS_CONFIG = {
  active: { label: 'ACTIVE', color: '#2ecc71', dot: '#2ecc71' },
  in_trial: { label: 'FREE TRIAL', color: '#f39c12', dot: '#f39c12' },
  non_renewing: { label: 'ENDS SOON', color: '#e67e22', dot: '#e67e22' },
  cancelled: { label: 'CANCELLED', color: '#e74c3c', dot: '#e74c3c' },
  canceled: { label: 'CANCELLED', color: '#e74c3c', dot: '#e74c3c' },
  expired: { label: 'EXPIRED', color: '#888', dot: '#888' },
};
const getStatus = (s) => STATUS_CONFIG[String(s || '').toLowerCase()] || { label: String(s || 'UNKNOWN').toUpperCase(), color: '#888', dot: '#888' };

// ─── Small reusable pieces ────────────────────────────────────────────────────

const Pill = ({ label, color }) => (
  <View style={[styles.pill, { borderColor: color + '40', backgroundColor: color + '18' }]}>
    <View style={[styles.pillDot, { backgroundColor: color }]} />
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const SmallActionBtn = ({ label, icon, onPress, variant = 'ghost', loading = false, disabled = false }) => {
  const colors = {
    ghost: { border: 'rgba(255,255,255,0.12)', text: '#ccc', bg: 'rgba(255,255,255,0.05)' },
    destructive: { border: 'rgba(231,76,60,0.3)', text: '#e74c3c', bg: 'rgba(231,76,60,0.08)' },
    positive: { border: 'rgba(46,204,113,0.3)', text: '#2ecc71', bg: 'rgba(46,204,113,0.08)' },
    primary: { border: 'rgba(184,115,240,0.3)', text: '#b873f0', bg: 'rgba(184,115,240,0.08)' },
  };
  const c = colors[variant] || colors.ghost;
  return (
    <TouchableOpacity
      style={[styles.smallBtn, { borderColor: c.border, backgroundColor: c.bg }, (loading || disabled) && { opacity: 0.45 }]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading
        ? <ActivityIndicator size="small" color={c.text} />
        : <>
          {icon ? <Icon name={icon} size={13} color={c.text} style={{ marginRight: 5 }} /> : null}
          <Text style={[styles.smallBtnText, { color: c.text }]}>{label}</Text>
        </>
      }
    </TouchableOpacity>
  );
};

// ─── Gym Subscription Card ────────────────────────────────────────────────────

const GymSubCard = ({ sub, navigation, onRefresh }) => {
  const [toggling, setToggling] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [autoRenew, setAutoRenew] = useState(sub?.cancelAtPeriodEnd !== true);

  const status = String(sub?.status || '').toLowerCase();
  const isActive = status === 'active' || status === 'in_trial';
  const isEnding = status === 'non_renewing';
  const sc = getStatus(status);

  const endDate = sub?.currentTermEnd || sub?.endDate || sub?.expiresAt;
  const startDate = sub?.currentTermStart || sub?.startDate || sub?.createdAt;
  const days = getDaysLeft(endDate);
  const pct = getProgressPct(startDate, endDate);

  const providerName =
    sub?.provider?.name || sub?.gym?.name || sub?.package?.provider?.name ||
    sub?.providerName || sub?.gymName || 'Gym Membership';
  const planName =
    sub?.plan?.name || sub?.package?.name || sub?.planName || sub?.tierName || 'Active Plan';

  const handleToggle = () => {
    const next = !autoRenew;
    Alert.alert(
      next ? 'Enable Auto-Renew' : 'Disable Auto-Renew',
      next
        ? 'Your membership will renew automatically at period end.'
        : 'Your membership will NOT auto-renew. You keep access until the end of the current term.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', onPress: async () => {
            setToggling(true);
            try {
              const r = await apiClient.post(`/subscriptions/${sub.id}/toggle-auto-renew`, { autoRenew: next });
              if (r.data?.success) { setAutoRenew(next); onRefresh(); }
              else throw new Error(r.data?.message);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || e.message || 'Could not update.');
            } finally { setToggling(false); }
          }
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Membership',
      `You'll keep access to ${providerName} until ${formatDate(endDate)}, then it won't renew.`,
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
            setCancelling(true);
            try {
              const r = await apiClient.patch(`/subscriptions/${sub.id}/cancel`);
              if (r.data?.success) { Alert.alert('Done', 'Membership cancelled at period end.'); onRefresh(); }
              else throw new Error(r.data?.message);
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || e.message || 'Could not cancel.');
            } finally { setCancelling(false); }
          }
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <LinearGradient colors={['#1a1a1a', '#111']} style={styles.iconCircle}>
          <Icon name="barbell-outline" size={18} color="#e74c3c" />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{providerName}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{planName}</Text>
        </View>
        <Pill label={sc.label} color={sc.color} />
      </View>

      <Divider />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Renews / Ends</Text>
          <Text style={styles.statValue}>{formatDate(endDate)}</Text>
        </View>
        {days !== null && (
          <View style={[styles.statBlock, { alignItems: 'flex-end' }]}>
            <Text style={styles.statLabel}>Days Remaining</Text>
            <Text style={[styles.statValue, { color: days <= 7 ? '#e74c3c' : '#FFF' }]}>{days} days</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {endDate && startDate && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: days <= 7 ? '#e74c3c' : '#2ecc71' }]} />
        </View>
      )}

      {/* Notices */}
      {isEnding && (
        <View style={styles.notice}>
          <Icon name="alert-circle-outline" size={12} color="#e67e22" style={{ marginRight: 5 }} />
          <Text style={styles.noticeText}>Cancels on {formatDate(endDate)} — no further charges.</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        {(isActive || isEnding) && (
          <SmallActionBtn
            label={autoRenew ? 'Auto-Renew On' : 'Auto-Renew Off'}
            icon={autoRenew ? 'sync-outline' : 'sync-outline'}
            onPress={handleToggle}
            loading={toggling}
            variant={autoRenew ? 'ghost' : 'positive'}
          />
        )}
        {isActive && (
          <SmallActionBtn
            label="Cancel"
            icon="close-circle-outline"
            onPress={handleCancel}
            loading={cancelling}
            variant="destructive"
          />
        )}
        <SmallActionBtn
          label="Details"
          icon="arrow-forward-outline"
          onPress={() => navigation.navigate('MembershipDetails', { subscription: sub })}
          variant="ghost"
        />
      </View>
    </View>
  );
};

// ─── AI Dietician Card ────────────────────────────────────────────────────────

const AIDietCard = ({ subDetails, navigation, onRefresh }) => {
  const [cancelling, setCancelling] = useState(false);

  const noSub = !subDetails;
  const isTrial = subDetails?.accessSource === 'TRIAL';
  const isPaid = subDetails?.accessSource === 'SUBSCRIPTION';
  const isNonRenew = String(subDetails?.status || '').toLowerCase() === 'non_renewing';
  const sc = getStatus(subDetails?.status);
  const endDate = subDetails?.currentTermEnd;
  const days = getDaysLeft(endDate);

  const handleCancel = () => {
    if (!subDetails?.subscriptionId) {
      Alert.alert('Cannot Cancel', 'Free trials expire automatically — no action needed.');
      return;
    }
    Alert.alert(
      'Cancel AI Dietician',
      `You'll keep access until ${formatDate(endDate)}, then the plan ends.`,
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
            setCancelling(true);
            try {
              await cancelAIDietSubscription(subDetails.subscriptionId);
              Alert.alert('Done', 'AI Dietician plan cancelled at period end.');
              onRefresh();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || e.message || 'Could not cancel.');
            } finally { setCancelling(false); }
          }
        },
      ],
    );
  };

  return (
    <View style={[styles.card, styles.aiCard]}>
      {/* Top row */}
      <View style={styles.cardTopRow}>
        <LinearGradient colors={['#1a0a0a', '#110505']} style={styles.iconCircle}>
          <Icon name="nutrition-outline" size={18} color="#e74c3c" />
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>AI Dietician</Text>
          <Text style={styles.cardSubtitle}>
            {noSub ? 'Not subscribed' : (subDetails.planName || 'Active Plan')}
          </Text>
        </View>
        {!noSub && <Pill label={sc.label} color={sc.color} />}
      </View>

      <Divider />

      {noSub ? (
        /* ── No subscription state ── */
        <>
          <Text style={styles.aiFeatureText}>
            Personalised meal plans · Food scanner · 24/7 nutrition AI
          </Text>
          <View style={styles.aiFeatureRow}>
            {['camera-outline', 'restaurant-outline', 'stats-chart-outline', 'chatbubbles-outline'].map((ic, i) => (
              <View key={i} style={styles.aiFeatureIcon}>
                <Icon name={ic} size={16} color="#e74c3c" />
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.unlockBtn} onPress={() => navigation.navigate('AIDieticianPaywall')} activeOpacity={0.85}>
            <LinearGradient
              colors={['#e74c3c', '#c0392b']}
              style={styles.unlockBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.unlockBtnInner}>
                <Icon name="sparkles-outline" size={15} color="#FFF" style={{ marginRight: 7 }} />
                <Text style={styles.unlockBtnText}>Unlock AI Dietician</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        /* ── Has subscription state ── */
        <>
          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>{isTrial ? 'Trial Ends' : 'Renews / Ends'}</Text>
              <Text style={styles.statValue}>{formatDate(endDate)}</Text>
            </View>
            {days !== null && (
              <View style={[styles.statBlock, { alignItems: 'flex-end' }]}>
                <Text style={styles.statLabel}>Days Left</Text>
                <Text style={[styles.statValue, { color: days <= 5 ? '#e74c3c' : '#FFF' }]}>{days}</Text>
              </View>
            )}
          </View>

          {isTrial && (
            <View style={[styles.notice, { borderColor: 'rgba(243,156,18,0.25)', backgroundColor: 'rgba(243,156,18,0.07)' }]}>
              <Icon name="information-circle-outline" size={12} color="#f39c12" style={{ marginRight: 5 }} />
              <Text style={[styles.noticeText, { color: '#f39c12' }]}>
                You're on a free trial. Upgrade to keep access after {formatDate(endDate)}.
              </Text>
            </View>
          )}
          {isNonRenew && (
            <View style={styles.notice}>
              <Icon name="alert-circle-outline" size={12} color="#e67e22" style={{ marginRight: 5 }} />
              <Text style={styles.noticeText}>Plan scheduled to end on {formatDate(endDate)}.</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            {isTrial && (
              <SmallActionBtn
                label="Upgrade to Paid"
                icon="sparkles-outline"
                onPress={() => navigation.navigate('AIDieticianPaywall')}
                variant="primary"
              />
            )}
            {isPaid && !isNonRenew && (
              <SmallActionBtn
                label="Cancel Plan"
                icon="close-circle-outline"
                onPress={handleCancel}
                loading={cancelling}
                variant="destructive"
              />
            )}
            <SmallActionBtn
              label="Plan Details"
              icon="arrow-forward-outline"
              onPress={() => navigation.navigate('AIDieticianSubscription')}
              variant="ghost"
            />
          </View>
        </>
      )}
    </View>
  );
};

// ─── Empty full-screen state ──────────────────────────────────────────────────

const EmptyState = ({ navigation }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIconCircle}>
      <Icon name="file-tray-outline" size={36} color="#333" />
    </View>
    <Text style={styles.emptyTitle}>No Active Subscriptions</Text>
    <Text style={styles.emptyBody}>Start with a free AI Dietician trial or browse gym partners to get going.</Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AIDieticianPaywall')} activeOpacity={0.85}>
      <LinearGradient
        colors={['#e74c3c', '#c0392b']}
        style={styles.emptyBtnGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.emptyBtnInner}>
          <Icon name="nutrition-outline" size={15} color="#FFF" style={{ marginRight: 7 }} />
          <Text style={styles.emptyBtnText}>Try AI Dietician Free</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ManageSubscriptionsScreen = ({ navigation }) => {
  const { user, refreshAuthStatus } = useAuth();
  const [aiSub, setAiSub] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleRestorePurchases = async () => {
    setLoading(true);
    try {
      console.log('[ManageSubscriptions] Restoring purchases...');
      const customer = {
        id: user?.id || user?.userProfile?.id || '',
        email: user?.email || user?.userProfile?.email || '',
        firstName: user?.firstName || user?.userProfile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || '',
        lastName: user?.lastName || user?.userProfile?.name?.split(' ').slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || '',
      };

      const restored = await Chargebee.restorePurchases(true, customer);
      console.log('[ManageSubscriptions] Restored purchases list:', restored);

      await loadData(true);
      Alert.alert(
        'Restore Completed',
        'Your App Store purchases have been checked and restored successfully.'
      );
    } catch (e) {
      console.error('[ManageSubscriptions] Restore error:', e);
      Alert.alert('Restore Failed', e.message || 'Could not contact App Store to restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [, aiData] = await Promise.all([
        refreshAuthStatus?.(),
        getAIDietSubscription().catch(() => null),
      ]);
      setAiSub(aiData?.accessSource ? aiData : null);
    } catch { setAiSub(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [refreshAuthStatus]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const rawSubs = user?.subscriptions || user?.userProfile?.subscriptions || [];
  const gymSubs = rawSubs.filter(s => {
    const st = String(s?.status || s?.subscriptionStatus || '').toUpperCase();
    return !['CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(st) || s?.isActive || s?.active;
  });

  const totalActive = gymSubs.length + (aiSub ? 1 : 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          {!loading && <Text style={styles.headerCount}>{totalActive} active plan{totalActive !== 1 ? 's' : ''}</Text>}
        </View>
        <TouchableOpacity onPress={() => loadData(true)} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="refresh-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#e74c3c" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#e74c3c" />}
        >
          {/* Gym subscription cards — rendered directly, no heading */}
          {gymSubs.map((sub, i) => (
            <GymSubCard key={sub?.id || i} sub={sub} navigation={navigation} onRefresh={() => loadData(true)} />
          ))}

          {/* AI Dietician card */}
          <AIDietCard subDetails={aiSub} navigation={navigation} onRefresh={() => loadData(true)} />

          {/* Full empty state (only when truly nothing) */}
          {gymSubs.length === 0 && aiSub === null && <EmptyState navigation={navigation} />}

          {/* Footer note */}
          <View style={styles.footer}>
            <Icon name="information-circle-outline" size={12} color="#3a3a3a" style={{ marginRight: 5 }} />
            <Text style={styles.footerText}>
              Cancellations apply at the end of the current billing period. Contact support for billing disputes.
            </Text>
          </View>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={handleRestorePurchases}
              activeOpacity={0.7}
            >
              <Icon name="sync-outline" size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
              <Text style={styles.restoreBtnText}>Restore App Store Purchases</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  headerCount: { color: '#555', fontSize: 11, marginLeft: 8, marginTop: 1 },

  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 18 },

  // ── Card shell
  card: {
    backgroundColor: '#0c0c0c',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    marginBottom: 14,
  },
  aiCard: {
    borderColor: 'rgba(231,76,60,0.15)',
  },

  // ── Card top row
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cardSubtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },

  // ── Status pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },

  // ── Divider
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 14 },

  // ── Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBlock: {},
  statLabel: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 3 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // ── Progress bar
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 1 },

  // ── Notice strip
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(230,126,34,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(230,126,34,0.2)',
    borderRadius: 8,
    padding: 9,
    marginBottom: 12,
  },
  noticeText: { color: '#e67e22', fontSize: 11, flex: 1, lineHeight: 16 },

  // ── Action row
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
  },
  smallBtnText: { fontSize: 12, fontWeight: '600' },

  // ── AI feature display (no-sub state)
  aiFeatureText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  aiFeatureRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  aiFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(231,76,60,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Unlock button
  unlockBtn: { width: '100%' },
  unlockBtnGradient: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  unlockBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
  },
  unlockBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // ── Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 52, paddingHorizontal: 24 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  emptyBtn: { width: '100%' },
  emptyBtnGradient: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  emptyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // ── Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  footerText: { color: '#2e2e2e', fontSize: 11, flex: 1, lineHeight: 16 },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  restoreBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ManageSubscriptionsScreen;
