import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useObjectOutput,
} from 'react-native-vision-camera';

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
      Alert.alert('QR Scanned', value, [
        { text: 'Scan Again', onPress: () => setScannerVisible(true) },
        { text: 'Done', style: 'cancel' },
      ]);
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <Image source={{ uri: image }} style={styles.gymImage} />
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
        <SafeAreaView style={styles.scannerContainer}>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 34 },
  hero: { height: 190, alignItems: 'center', justifyContent: 'flex-end' },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 18,
    zIndex: 3,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArc: {
    position: 'absolute',
    top: -190,
    width: 520,
    height: 330,
    borderBottomLeftRadius: 260,
    borderBottomRightRadius: 260,
    backgroundColor: '#1B0D27',
  },
  gymImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  qrMark: { position: 'absolute', right: 28, bottom: 26 },
  titleBlock: { alignItems: 'center', marginTop: 18 },
  gymName: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  planName: { color: '#B8B1C2', fontSize: 14, marginTop: 3 },
  tierName: { color: '#D8D1E1', fontSize: 13, marginTop: 2 },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#158028',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  activeText: { color: '#FFF', fontSize: 7, fontWeight: '900' },
  curveLayer: { height: 112, justifyContent: 'center', marginTop: -6 },
  orbitDot: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#E4E4E4',
  },
  orbitLeft: { left: 26, top: 36 },
  orbitCenter: { alignSelf: 'center', top: 72 },
  orbitRight: { right: 26, top: 36 },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
    marginTop: 18,
  },
  metaLabel: {
    color: '#777183',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  metaValue: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  progressBlock: { paddingHorizontal: 34, marginTop: 28 },
  progressHeader: { marginBottom: 10 },
  progressTitle: { color: '#A9A0B3', fontSize: 13, fontWeight: '800' },
  progressTrack: {
    height: 22,
    borderRadius: 11,
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
    fontSize: 10,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  renewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 34,
    marginTop: 20,
  },
  renewCopy: { flex: 1, marginLeft: 18 },
  renewTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  renewSub: { color: '#777183', fontSize: 11, marginTop: 2 },
  toggleTrack: {
    width: 58,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#6A3C91',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 34,
    marginTop: 20,
  },
  statCard: {
    width: '47.5%',
    height: 76,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMain: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  statNumber: { color: '#FFF', fontSize: 20, fontWeight: '300' },
  statSub: { color: '#BFB5CC', fontSize: 9, marginTop: 4 },
  statTiny: { color: '#776E82', fontSize: 8, marginTop: 3 },
  bookNowButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#4A2666',
    marginHorizontal: 34,
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bookNowText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionKicker: {
    color: '#7E7788',
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: 42,
    marginBottom: 22,
    paddingHorizontal: 34,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 34,
    marginBottom: 28,
  },
  sessionTime: { width: 78 },
  sessionHour: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  sessionDay: { color: '#777183', fontSize: 10, fontWeight: '800' },
  sessionCopy: { flex: 1 },
  sessionTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  sessionSub: { color: '#8F8797', fontSize: 10, marginTop: 4 },
  sessionPill: {
    backgroundColor: '#24112F',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sessionPillText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  infoPanel: {
    marginHorizontal: 26,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 26,
    backgroundColor: '#030303',
  },
  infoRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 16,
  },
  infoTitle: { color: '#AFA7B8', fontSize: 15, fontWeight: '700' },
  infoSpacer: { flex: 1 },
  infoValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  infoValuePill: {
    backgroundColor: '#1F0D2C',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  infoValuePillText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  amenityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 26,
  },
  amenityPill: {
    backgroundColor: '#1D0E28',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  amenityText: { color: '#D9D1E4', fontSize: 12, fontWeight: '800' },
  navigateButton: {
    height: 58,
    borderRadius: 2,
    backgroundColor: '#24102E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  navigateText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  scannerCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
  cameraWrap: {
    flex: 1,
    margin: 18,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraUnavailable: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraUnavailableText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'absolute',
  },
  scanCorner: {
    position: 'absolute',
    width: 48,
    height: 48,
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
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default MembershipDetailsScreen;
