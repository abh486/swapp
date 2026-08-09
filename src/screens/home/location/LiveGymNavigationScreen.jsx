import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsiveMetrics } from '../../../utils/responsive';

// Helper to calculate distance in KM between two lat/lng points
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to calculate bearing / compass heading angle (0-360 degrees)
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const rad = Math.PI / 180;
  const y = Math.sin((lon2 - lon1) * rad) * Math.cos(lat2 * rad);
  const x =
    Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
    Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lon2 - lon1) * rad);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

const LiveGymNavigationScreen = ({ route, navigation }) => {
  const {
    gym = {},
    origin: initialOrigin = {},
    destination: paramDestination = {},
  } = route.params || {};

  const insets = useSafeAreaInsets();
  const metrics = useResponsiveMetrics();
  const { sp, fs, ms } = metrics;

  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Extract destination coordinates
  const destLat = parseFloat(
    paramDestination.latitude ||
      (gym.coordinates && gym.coordinates.latitude) ||
      gym.latitude ||
      gym.lat ||
      12.9716,
  );
  const destLng = parseFloat(
    paramDestination.longitude ||
      (gym.coordinates && gym.coordinates.longitude) ||
      gym.longitude ||
      gym.lng ||
      77.5946,
  );

  // Extract initial user origin coordinates
  const initLat = parseFloat(initialOrigin.latitude || 12.9352);
  const initLng = parseFloat(initialOrigin.longitude || 77.6245);

  const [currentLoc, setCurrentLoc] = useState({
    latitude: initLat,
    longitude: initLng,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);
  const [heading, setHeading] = useState(0);
  const [isArrived, setIsArrived] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);

  // Pulsing radar animation for user pin
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Fetch OSRM driving route polyline points
  const fetchRoutePolyline = useCallback(async (startLat, startLng, endLat, endLng) => {
    try {
      setIsLoadingRoute(true);
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        const coords = routeData.geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoordinates(coords);

        const distKm = (routeData.distance || 0) / 1000;
        const durationMins = Math.ceil((routeData.duration || 0) / 60);

        setRemainingDistance(distKm);
        setEtaMinutes(durationMins);
      } else {
        // Fallback straight line
        setRouteCoordinates([
          { latitude: startLat, longitude: startLng },
          { latitude: endLat, longitude: endLng },
        ]);
        const distKm = calculateDistanceKm(startLat, startLng, endLat, endLng);
        setRemainingDistance(distKm);
        setEtaMinutes(Math.ceil((distKm / 30) * 60)); // Assumes 30km/h avg speed
      }
    } catch (err) {
      console.warn('[LiveGymNavigation] Route fetch fallback:', err.message);
      setRouteCoordinates([
        { latitude: startLat, longitude: startLng },
        { latitude: endLat, longitude: endLng },
      ]);
      const distKm = calculateDistanceKm(startLat, startLng, endLat, endLng);
      setRemainingDistance(distKm);
      setEtaMinutes(Math.ceil((distKm / 30) * 60));
    } finally {
      setIsLoadingRoute(false);
    }
  }, []);

  // Initial route fetch
  useEffect(() => {
    fetchRoutePolyline(initLat, initLng, destLat, destLng);
  }, [initLat, initLng, destLat, destLng, fetchRoutePolyline]);

  // Real-time location tracking & 3D camera updating (Swiggy/Zomato style)
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude, heading: phoneHeading } = position.coords;
          if (!latitude || !longitude) return;

          setCurrentLoc(prev => {
            const calculatedHead = calculateBearing(
              prev.latitude,
              prev.longitude,
              latitude,
              longitude,
            );
            const finalHeading = phoneHeading || calculatedHead || heading;
            setHeading(finalHeading);

            // Calculate updated remaining distance
            const distKm = calculateDistanceKm(latitude, longitude, destLat, destLng);
            setRemainingDistance(distKm);
            setEtaMinutes(Math.max(1, Math.ceil((distKm / 25) * 60)));

            if (distKm <= 0.08) {
              setIsArrived(true);
            }

            // Animate 3D Swiggy/Zomato map camera following the user
            if (mapRef.current) {
              mapRef.current.animateCamera(
                {
                  center: { latitude, longitude },
                  pitch: 45,
                  heading: finalHeading,
                  zoom: 17,
                },
                { duration: 1000 },
              );
            }

            return { latitude, longitude };
          });
        },
        error => console.warn('[LiveNavigation] Geolocation watch error:', error.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000, distanceFilter: 5 },
      );
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [destLat, destLng, heading]);

  // Initial camera setup
  const onMapReady = () => {
    if (mapRef.current) {
      const calcHeading = calculateBearing(initLat, initLng, destLat, destLng);
      mapRef.current.animateCamera(
        {
          center: { latitude: initLat, longitude: initLng },
          pitch: 40,
          heading: calcHeading,
          zoom: 16.5,
        },
        { duration: 1200 },
      );
    }
  };

  const handleOpenExternalMaps = () => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${destLat},${destLng}`;
    const label = encodeURIComponent(gym.name || 'Gym Partner');
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    Linking.openURL(url);
  };

  const handleArrivalCheckIn = () => {
    Alert.alert(
      'Arrived at Gym!',
      `Welcome to ${gym.name || 'your gym'}. Would you like to check in now?`,
      [
        {
          text: 'Check-In Now',
          onPress: () => {
            navigation.navigate('MembershipDetails', {
              providerId: gym.id,
              openAccessAutoOpenScanner: true,
            });
          },
        },
        { text: 'Later', style: 'cancel' },
      ],
    );
  };

  const gymName = gym.name || 'Gym Partner';
  const gymAddress = gym.address || 'Fitness Location';
  const gymPhoto =
    (gym.photos && gym.photos[0]) ||
    gym.image ||
    'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 3D Moving Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        onMapReady={onMapReady}
        initialRegion={{
          latitude: initLat,
          longitude: initLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsBuildings={true}
        showsIndoors={false}
        showsCompass={false}
      >
        {/* Glowing Neon Route Polyline */}
        {routeCoordinates.length > 0 && (
          <React.Fragment>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="rgba(0, 168, 255, 0.4)"
              strokeWidth={12}
            />
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#00E5FF"
              strokeWidth={6}
            />
          </React.Fragment>
        )}

        {/* User Swiggy/Zomato Vehicle / Pin Marker */}
        <Marker
          coordinate={currentLoc}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true}
          rotation={heading}
          tracksViewChanges={false}
        >
          <View style={styles.userMarkerContainer}>
            <Animated.View
              style={[
                styles.userMarkerPulse,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.userMarkerCenter}>
              <Icon name="navigate-circle" size={32} color="#00E5FF" />
            </View>
          </View>
        </Marker>

        {/* Destination Gym Marker */}
        <Marker
          coordinate={{ latitude: destLat, longitude: destLng }}
          title={gymName}
          description={gymAddress}
          tracksViewChanges={false}
        >
          <View style={styles.gymMarkerBadge}>
            <Icon name="barbell" size={18} color="#FFF" />
          </View>
        </Marker>
      </MapView>

      {/* Top Floating Swiggy/Zomato Navigation HUD */}
      <View style={[styles.topHud, { top: (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 50 : 24)) + sp(4) }]}>
        <LinearGradient
          colors={['#0F141C', '#1E2638']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topHudCard}
        >
          <View style={styles.topHudRow}>
            <TouchableOpacity
              style={styles.hudBackBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Icon name="chevron-back" size={20} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.hudLeftIcon}>
              <Icon name="arrow-up-circle" size={28} color="#00E5FF" />
            </View>

            <View style={styles.hudTextWrap}>
              <Text style={styles.hudKicker} numberOfLines={1}>
                {isArrived ? 'YOU HAVE ARRIVED' : 'EN ROUTE TO GYM'}
              </Text>
              <Text style={styles.hudTitle} numberOfLines={1}>
                {gymName}
              </Text>
            </View>

            <View style={styles.hudMetrics}>
              <Text style={styles.etaText}>{etaMinutes} MINS</Text>
              <Text style={styles.distText}>
                {remainingDistance.toFixed(1)} km
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Bottom Swiggy/Zomato Ride Action Bar */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + sp(12) }]}>
        <View style={styles.gymCardRow}>
          <Image source={{ uri: gymPhoto }} style={styles.gymThumb} />
          <View style={styles.gymInfoWrap}>
            <Text style={styles.gymCardTitle} numberOfLines={1}>
              {gymName}
            </Text>
            <Text style={styles.gymCardSub} numberOfLines={1}>
              {gymAddress}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.externalAppBtn}
            onPress={handleOpenExternalMaps}
            activeOpacity={0.8}
          >
            <Icon name="compass-outline" size={22} color="#00E5FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Icon name="close-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.exitBtnText}>Exit Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.arrivedBtn, isArrived && styles.arrivedBtnActive]}
            onPress={handleArrivalCheckIn}
            activeOpacity={0.85}
          >
            <Icon name="checkmark-done-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.arrivedBtnText}>
              {isArrived ? 'Check In Now' : 'I Have Arrived'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (metrics, insets) => {};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  userMarkerContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  userMarkerCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F141C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  gymMarkerBadge: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  topHud: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 100,
  },
  topHudCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    backgroundColor: '#0F141C',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  topHudRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hudLeftIcon: {
    marginRight: 8,
  },
  hudTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  hudKicker: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hudTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  hudMetrics: {
    alignItems: 'flex-end',
  },
  etaText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '900',
  },
  distText: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F141C',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 100,
  },
  gymCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gymThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  gymInfoWrap: {
    flex: 1,
    marginRight: 10,
  },
  gymCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  gymCardSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  externalAppBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2638',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exitBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2C1B24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  exitBtnText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '800',
  },
  arrivedBtn: {
    flex: 1.5,
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivedBtnActive: {
    backgroundColor: '#34C759',
  },
  arrivedBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default LiveGymNavigationScreen;
