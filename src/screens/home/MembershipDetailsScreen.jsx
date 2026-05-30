import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
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
import * as Clarity from '@microsoft/react-native-clarity';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';
import { useResponsiveMetrics } from '../../utils/responsive';

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

const MembershipDetailsScreen = ({ route, navigation }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isScanLocked, setIsScanLocked] = useState(false);
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(metrics, insets), [metrics, insets]);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const { subscription = {} } = route.params || {};
  const provider =
    subscription.provider ||
    subscription.gym ||
    subscription.partner ||
    subscription.package?.provider ||
    {};
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
    'Gold Tier';
  const image =
    provider.photos?.[0] ||
    subscription.image ||
    subscription.photoUrl ||
    FALLBACK_GYM_IMAGE;
  const startDate =
    getDateText(subscription.startDate || subscription.createdAt) ||
    'Jan 20, 2026';
  const endDate =
    getDateText(
      subscription.endDate ||
        subscription.expiresAt ||
        subscription.expiryDate ||
        subscription.currentPeriodEnd,
    ) || 'Jan 20, 2027';
  const locationUrl = provider.locationLink || provider.mapUrl;

  const openDirections = () => {
    if (locationUrl) {
      Linking.openURL(locationUrl);
      return;
    }
    navigation.navigate('DiscoverProvidersMap', { query: gymName });
  };

  const openBooking = () => {
    navigation.navigate('MembershipBooking', {
      gymName,
      subscription,
    });
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

    setIsScanLocked(false);
    setScannerVisible(true);
  }, [hasPermission, requestPermission]);

  const closeScanner = useCallback(() => {
    setScannerVisible(false);
    setIsScanLocked(false);
  }, []);

  const objectOutput = useObjectOutput({
    types: ['qr', 'ean-13', 'code-128', 'code-39', 'pdf-417'],
    onObjectsScanned: objects => {
      if (isScanLocked || objects.length === 0) return;

      const value = objects.find(object => object.value)?.value;
      if (!value) return;

      setIsScanLocked(true);
      setScannerVisible(false);
      console.log('[Clarity] Gym checked in:', gymName);
      try {
        Clarity.sendCustomEvent('gym_checked_in');
        if (gymName) {
          Clarity.setCustomTag('checked_in_gym', gymName);
        }
      } catch (e) {
        console.error('[Clarity] Failed to send gym_checked_in:', e);
      }
      Alert.alert('QR Scanned', value, [
        { text: 'Scan Again', onPress: () => setScannerVisible(true) },
        { text: 'Done', style: 'cancel' },
      ]);
    },
  });

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
            onPress={openScanner}
            activeOpacity={0.85}
          >
            <Icon name="qr-code-outline" size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.gymName}>{gymName}</Text>
          <Text style={styles.planName}>{planName}</Text>
          <Text style={styles.tierName}>{tierName}</Text>
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
              style={styles.progressFill}
            />
            <Text style={styles.daysLeft}>239 Days Left</Text>
          </View>
        </View>

        <View style={styles.renewRow}>
          <Icon name="sync" size={22} color="#FFF" />
          <View style={styles.renewCopy}>
            <Text style={styles.renewTitle}>Auto-Renew</Text>
            <Text style={styles.renewSub}>Renews Jan 20, 2027</Text>
          </View>
          <View style={styles.toggleTrack}>
            <View style={styles.toggleKnob} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statMain}>TODAY</Text>
            <Text style={styles.statSub}>Last Check-in</Text>
            <Text style={styles.statTiny}>7:42 AM · 53 min</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Icon name="flame" size={34} color="#FFF" />
            <Text style={styles.statSub}>Day Streak</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>58 M</Text>
            <Text style={styles.statSub}>Avg Duration</Text>
            <Text style={styles.statTiny}>+12% vs last month</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#100714', '#251032']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statSub}>Visits this month</Text>
          </LinearGradient>
        </View>

        <TouchableOpacity
          style={styles.bookNowButton}
          onPress={openBooking}
          activeOpacity={0.88}
        >
          <Icon name="calendar-outline" size={22} color="#FFF" />
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>

        <Text style={styles.sectionKicker}>UPCOMING FIT7 SESSIONS</Text>
        <View style={styles.sessionRow}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionHour}>06:30</Text>
            <Text style={styles.sessionDay}>TOMORROW</Text>
          </View>
          <View style={styles.sessionCopy}>
            <Text style={styles.sessionTitle}>HIIT Burn Circuit</Text>
            <Text style={styles.sessionSub}>Studio B · 45 min · 8 spots</Text>
          </View>
          <View style={styles.sessionPill}>
            <Text style={styles.sessionPillText}>HIIT</Text>
          </View>
        </View>
        <View style={styles.sessionRow}>
          <View style={styles.sessionTime}>
            <Text style={styles.sessionHour}>09:00</Text>
            <Text style={styles.sessionDay}>THU</Text>
          </View>
          <View style={styles.sessionCopy}>
            <Text style={styles.sessionTitle}>Flow & Restore Yoga</Text>
            <Text style={styles.sessionSub}>Zen Room · 60 min</Text>
          </View>
          <View style={styles.sessionPill}>
            <Text style={styles.sessionPillText}>YOGA</Text>
          </View>
        </View>

        <View style={styles.infoPanel}>
          <InfoRow title="Opening Hours" value="05:00 - 23:00" />
          <InfoRow title="Current Crowd" value="• Low" valuePill />
          <InfoRow title="Parking" value="12 spots free" />
          <InfoRow title="Lockers" value="Available" />

          <View style={styles.amenityWrap}>
            {['Pool', 'Spa', 'Boxing', 'Sauna', 'Cafe', 'Wi-Fi'].map(item => (
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
            <Text style={styles.scannerTitle}>Scan Gym QR</Text>
            <View style={styles.scannerCloseButton} />
          </View>

          <View style={styles.cameraWrap}>
            {device && hasPermission ? (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scannerVisible}
                outputs={[objectOutput]}
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

          <Text style={styles.scanHint}>Place the gym QR inside the frame</Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const InfoRow = ({ title, value, valuePill }) => (
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
  qrMark: { position: 'absolute', right: sp(28), bottom: sp(26) },
  titleBlock: { alignItems: 'center', marginTop: sp(18), paddingHorizontal: sp(24) },
  gymName: { color: '#FFF', fontSize: fs(24), fontWeight: '900', textAlign: 'center' },
  planName: { color: '#B8B1C2', fontSize: fs(14), marginTop: sp(3), textAlign: 'center' },
  tierName: { color: '#D8D1E1', fontSize: fs(13), marginTop: sp(2), textAlign: 'center' },
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
  sessionPillText: { color: '#FFF', fontSize: fs(8), fontWeight: '900' },
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
});

export default MembershipDetailsScreen;
