import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { Modal } from 'react-native';
import { setActiveCategory as setGlobalCategory } from '../../../redux/actions/homeActions';

import { useLocation } from '../../../context/LocationContext';
import { useProviderData } from '../../../hooks/useProviderData';
import { useResponsiveMetrics } from '../../../utils/responsive';
import LocationSelectorModal from './components/LocationSelectorModal';

// Categories are now dynamic from Redux

const DiscoverProvidersMapScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { activeCategory, activeVertical } = useSelector(state => state.home);
  const [searchQuery, setSearchQuery] = useState((route.params && route.params.query) || '');
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const SNAP_TOP = insets.top + metrics.sp(104);
  const SNAP_BOTTOM = metrics.height - insets.bottom - metrics.sp(116);
  const SNAP_MID = metrics.isLandscape ? metrics.height * 0.48 : metrics.height * 0.55;
  const styles = useMemo(
    () => createStyles({ ...metrics, wp: metrics.wp }, insets, SNAP_TOP),
    [metrics, insets, SNAP_TOP],
  );

  const { userLocation, locationName, permissionGranted, showPermissionModal, actions: locationActions } = useLocation();
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const { feed } = useSelector(state => state.home);
  const mapRef = React.useRef(null);

  const targetLoc = useMemo(() => {
    if (route.params && route.params.selectedLocation && route.params.selectedLocation.latitude && route.params.selectedLocation.longitude) {
      return route.params.selectedLocation;
    }
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      return userLocation;
    }
    return userLocation;
  }, [route.params && route.params.selectedLocation, userLocation]);

  React.useEffect(() => {
    // If targetLoc is specified (e.g. user selected Mumbai or Bangalore or GPS location), center map on targetLoc
    if (targetLoc && targetLoc.latitude && targetLoc.longitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: parseFloat(targetLoc.latitude),
        longitude: parseFloat(targetLoc.longitude),
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }, 800);
      return;
    }

    // Otherwise, if no location is selected, frame all regional gyms on the map
    if (providers && providers.length > 0 && mapRef.current) {
      const validCoords = providers
        .map(p => {
          const lat = parseFloat((p.coordinates && p.coordinates.latitude) || p.latitude || p.lat);
          const lng = parseFloat((p.coordinates && p.coordinates.longitude) || p.longitude || p.lng);
          return (lat && lng) ? { latitude: lat, longitude: lng } : null;
        })
        .filter(Boolean);

      if (validCoords.length > 0) {
        // Filter coordinates within Indian subcontinent so Middle East doesn't stretch camera
        const regionalCoords = validCoords.filter(c => c.latitude >= 8 && c.latitude <= 36 && c.longitude >= 68 && c.longitude <= 96);
        const coordsToFit = regionalCoords.length > 0 ? regionalCoords : validCoords;

        if (coordsToFit.length === 1) {
          mapRef.current.animateToRegion({
            latitude: coordsToFit[0].latitude,
            longitude: coordsToFit[0].longitude,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }, 800);
        } else {
          mapRef.current.fitToCoordinates(coordsToFit, {
            edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
            animated: true,
          });
        }
      }
    }
  }, [providers, targetLoc, route.params]);

  React.useEffect(() => {
    if (route.params && (route.params.categoryId || route.params.vertical)) {
      dispatch(setGlobalCategory(route.params.categoryId || 'all', route.params.vertical || null));
    }
    if (route.params && route.params.query) {
      setSearchQuery(route.params.query);
    }
  }, [route.params]);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    ...((feed && feed.categories) || []).map(c => {
      const isCompatSport = c.label && (
        c.label.toLowerCase() === 'combat sports' ||
        c.label.toLowerCase() === 'combat sport' ||
        c.label.toLowerCase() === 'combat' ||
        c.label.toLowerCase() === 'compat sports' ||
        c.label.toLowerCase() === 'compat sport' ||
        c.label.toLowerCase() === 'compat'
      );
      const isWellnessSpa = c.label && (
        c.label.toLowerCase() === 'wellness & spa' ||
        c.label.toLowerCase() === 'wellness and spa' ||
        c.label.toLowerCase() === 'wellness' ||
        c.label.toLowerCase() === 'spa & wellness' ||
        c.label.toLowerCase() === 'spa and wellness'
      );
      const isYoga = c.label && (
        c.label.toLowerCase() === 'yoga' ||
        c.label.toLowerCase() === 'yoya' ||
        c.label.toLowerCase() === 'plaints' ||
        c.label.toLowerCase() === 'yoga and plaints' ||
        c.label.toLowerCase() === 'yoga & plaints' ||
        c.label.toLowerCase() === 'yoga and pilates' ||
        c.label.toLowerCase() === 'yoga & pilates'
      );
      const isGym = c.label && (
        c.label.toLowerCase() === 'gym' ||
        c.label.toLowerCase() === 'genaral gym' ||
        c.label.toLowerCase() === 'general gym' ||
        c.label.toLowerCase() === 'genaral' ||
        c.label.toLowerCase() === 'general'
      );
      return {
        id: c.id,
        label: isWellnessSpa ? 'Wellnest' : (isYoga ? 'Yoga' : (isGym ? 'Gym' : (isCompatSport ? 'Arena' : c.label))),
        icon: c.icon,
        vertical: c.vertical,
      };
    }),
    {
      id: 'trainer',
      label: 'Trainers',
      icon: 'barbell-outline',
      vertical: 'TRAINER',
    },
  ];

  const activeFilters = useMemo(() => ({
    ...(activeCategory !== 'all' ? { categoryId: activeCategory } : {}),
    ...(activeVertical ? { vertical: activeVertical } : {}),
    ...(searchQuery ? { search: searchQuery } : {})
  }), [activeCategory, activeVertical, searchQuery]);

  const { providers, isLoading, actions: providerActions } = useProviderData(targetLoc, permissionGranted, activeFilters);

  const translateY = useRef(new Animated.Value(SNAP_MID)).current;
  const lastOffsetY = useRef(SNAP_MID);
  const snapPointsRef = useRef({ top: SNAP_TOP, bottom: SNAP_BOTTOM });

  React.useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      lastOffsetY.current = value;
    });
    return () => translateY.removeListener(listenerId);
  }, [translateY]);

  React.useEffect(() => {
    snapPointsRef.current = { top: SNAP_TOP, bottom: SNAP_BOTTOM };
    translateY.setValue(SNAP_MID);
    lastOffsetY.current = SNAP_MID;
  }, [SNAP_BOTTOM, SNAP_MID, SNAP_TOP, translateY]);

  const collapseSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SNAP_MID,
      duration: 320,
      useNativeDriver: false,
    }).start(() => {
      lastOffsetY.current = SNAP_MID;
    });
  }, [SNAP_MID, translateY]);

  const expandSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SNAP_TOP,
      duration: 320,
      useNativeDriver: false,
    }).start(() => {
      lastOffsetY.current = SNAP_TOP;
    });
  }, [SNAP_TOP, translateY]);

  const toggleSheet = useCallback(() => {
    const isExpanded = Math.abs(lastOffsetY.current - SNAP_TOP) < 40;
    const target = isExpanded ? SNAP_MID : SNAP_TOP;

    Animated.timing(translateY, {
      toValue: target,
      duration: 320,
      useNativeDriver: false,
    }).start(() => {
      lastOffsetY.current = target;
    });
  }, [SNAP_MID, SNAP_TOP, translateY]);

  const flatListRef = useRef(null);
  const [selectedProviderId, setSelectedProviderId] = useState(null);

  // Filter gym cards so only NEARBY providers (within 30 miles) are shown in the bottom sheet
  const nearbyProviders = useMemo(() => {
    if (!providers || providers.length === 0) return [];
    if (!targetLoc || !targetLoc.latitude || !targetLoc.longitude) {
      return providers;
    }

    const MAX_NEARBY_MILES = 30; // Approx 48 km
    const nearby = providers.filter(p => p.distance != null && p.distance <= MAX_NEARBY_MILES);

    // If the user tapped a marker on the map that is further away, include it so its card is shown
    if (selectedProviderId) {
      const selected = providers.find(p => p.id === selectedProviderId);
      if (selected && !nearby.some(p => p.id === selected.id)) {
        return [selected, ...nearby];
      }
    }

    return nearby;
  }, [providers, targetLoc, selectedProviderId]);

  const handleMarkerPress = useCallback((provider) => {
    if (!provider) return;
    setSelectedProviderId(provider.id);

    const lat = parseFloat((provider.coordinates && provider.coordinates.latitude) || provider.latitude || provider.lat);
    const lng = parseFloat((provider.coordinates && provider.coordinates.longitude) || provider.longitude || provider.lng);

    if (lat && lng && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 500);
    }

    expandSheet();

    const index = nearbyProviders.findIndex(p => p.id === provider.id);
    if (index !== -1 && flatListRef.current) {
      setTimeout(() => {
        try {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.1,
            });
          }
        } catch (err) {
          if (flatListRef.current) {
            flatListRef.current.scrollToOffset({
              offset: index * 135,
              animated: true,
            });
          }
        }
      }, 150);
    }
  }, [nearbyProviders, expandSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 2,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        translateY.setOffset(lastOffsetY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dy: translateY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gs) => {
        translateY.flattenOffset();
        if (Math.abs(gs.dy) < 8) {
          toggleSheet();
          return;
        }

        const dy = gs.dy;
        const vy = gs.vy;
        const currentPos = lastOffsetY.current;

        let target = SNAP_MID;

        if (dy > 30 || vy > 0.2) {
          if (currentPos > (SNAP_MID + SNAP_BOTTOM) / 2) {
            target = SNAP_BOTTOM;
          } else {
            target = SNAP_MID;
          }
        } else if (dy < -30 || vy < -0.2) {
          target = SNAP_TOP;
        } else {
          const distToTop = Math.abs(currentPos - SNAP_TOP);
          const distToMid = Math.abs(currentPos - SNAP_MID);
          const distToBottom = Math.abs(currentPos - SNAP_BOTTOM);

          if (distToTop < distToMid && distToTop < distToBottom) {
            target = SNAP_TOP;
          } else if (distToBottom < distToMid && distToBottom < distToTop) {
            target = SNAP_BOTTOM;
          } else {
            target = SNAP_MID;
          }
        }

        Animated.timing(translateY, {
          toValue: target,
          duration: 280,
          useNativeDriver: false,
        }).start(() => {
          lastOffsetY.current = target;
        });
      },
    })
  ).current;

  const clampedTranslateY = translateY.interpolate({
    inputRange: [SNAP_TOP, SNAP_BOTTOM],
    outputRange: [SNAP_TOP, SNAP_BOTTOM],
    extrapolate: 'clamp',
  });

  const renderCategory = ({ item }) => {
    const isActive = activeCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
        onPress={() => {
          dispatch(setGlobalCategory(item.id, item.vertical || null));
        }}
      >
        <Icon
          name={item.icon || 'apps'}
          size={14}
          color={isActive ? '#3498db' : '#888'}
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProviderCard = ({ item }) => {
    const isTrainer = item.vertical === 'TRAINER' || (Array.isArray(item.vertical) && item.vertical.includes('TRAINER'));
    const isSelected = selectedProviderId === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          setSelectedProviderId(item.id);
          const lat = parseFloat((item.coordinates && item.coordinates.latitude) || item.latitude || item.lat);
          const lng = parseFloat((item.coordinates && item.coordinates.longitude) || item.longitude || item.lng);
          if (lat && lng && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }, 500);
          }
          if (isTrainer) {
            navigation.navigate('TrainerDetailScreen', { id: item.ownerId || item.id });
          } else {
            navigation.navigate('ProviderDetails', { id: item.id });
          }
        }}
        style={[styles.providerCard, isSelected && styles.providerCardSelected]}
      >
        <Image source={{ uri: (item.photos && item.photos[0]) || 'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400' }} style={styles.providerImage} />

        <View style={styles.providerContent}>
          <View style={styles.providerHeader}>
            <Text style={styles.providerName} numberOfLines={1}>
              {item.name}
            </Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Icon name="location-sharp" size={9} color="#fff" />
                <Text style={styles.selectedBadgeText}>ON MAP</Text>
              </View>
            )}
            {item.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <Text style={styles.providerMeta}>
            {(() => {
              const v = (item.vertical && item.vertical[0]) || 'Fitness';
              const vLower = v.toLowerCase();
              if (
                vLower === 'wellness' ||
                vLower === 'wellness and spa' ||
                vLower === 'wellness & spa' ||
                vLower === 'spa & wellness' ||
                vLower === 'spa and wellness'
              ) {
                return 'Wellnest';
              } else if (
                vLower === 'yoya' ||
                vLower === 'plaints' ||
                vLower === 'yoga' ||
                vLower === 'yoga and plaints' ||
                vLower === 'yoga & plaints' ||
                vLower === 'yoga and pilates' ||
                vLower === 'yoga & pilates'
              ) {
                return 'Yoga';
              } else if (
                vLower === 'genaral gym' ||
                vLower === 'general gym' ||
                vLower === 'genaral' ||
                vLower === 'general'
              ) {
                return 'Gym';
              }
              return v.charAt(0) + v.slice(1).toLowerCase();
            })()}{'   '}•{'   '}{item.distance ? `${item.distance.toFixed(1)} miles` : '0.5 miles'}
          </Text>

          <View style={styles.providerRatingRow}>
            <Text style={styles.providerRatingText}>{item.rating}</Text>
            <Icon name="star" size={10} color="#FFD700" style={styles.starIcon} />
            <Text style={styles.providerReviewsText}>({item.reviews})</Text>
          </View>

          <View style={styles.tagsContainer}>
            {Array.isArray(item.amenities) && item.amenities.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.providerRightActions}>
          <TouchableOpacity
            style={{ marginRight: 6 }}
            onPress={(e) => {
              e.stopPropagation();
              navigation.navigate('LiveGymNavigationScreen', {
                gym: item,
                origin: targetLoc,
                destination: item.coordinates || { latitude: item.latitude || item.lat, longitude: item.longitude || item.lng }
              });
            }}
          >
            <Icon name="navigate-circle" size={34} color="#00E5FF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn}>
            <Icon name="arrow-forward-circle" size={28} color="#aaa" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={StyleSheet.absoluteFillObject}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: (route.params && route.params.selectedLocation && route.params.selectedLocation.latitude) || (targetLoc && targetLoc.latitude) || (userLocation && userLocation.latitude) || 20.5937,
            longitude: (route.params && route.params.selectedLocation && route.params.selectedLocation.longitude) || (targetLoc && targetLoc.longitude) || (userLocation && userLocation.longitude) || 78.9629,
            latitudeDelta: 0.15,
            longitudeDelta: 0.15,
          }}
        >
          {providers
            .map(provider => {
              const lat = parseFloat((provider.coordinates && provider.coordinates.latitude) || provider.latitude || provider.lat);
              const lng = parseFloat((provider.coordinates && provider.coordinates.longitude) || provider.longitude || provider.lng);
              if (!lat || !lng) return null;

              const isTrainer = provider.vertical === 'TRAINER' || (Array.isArray(provider.vertical) && provider.vertical.includes('TRAINER'));
              return (
                <Marker
                  key={provider.id}
                  coordinate={{ latitude: lat, longitude: lng }}
                  tracksViewChanges={false}
                  title={provider.name}
                  description={`${(() => {
                    const v = (provider.vertical && provider.vertical[0]) || 'Fitness';
                    const vLower = typeof v === 'string' ? v.toLowerCase() : '';
                    if (
                      vLower === 'wellness' ||
                      vLower === 'wellness and spa' ||
                      vLower === 'wellness & spa' ||
                      vLower === 'spa & wellness' ||
                      vLower === 'spa and wellness'
                    ) {
                      return 'Wellnest';
                    } else if (
                      vLower === 'yoya' ||
                      vLower === 'plaints' ||
                      vLower === 'yoga' ||
                      vLower === 'yoga and plaints' ||
                      vLower === 'yoga & plaints' ||
                      vLower === 'yoga and pilates' ||
                      vLower === 'yoga & pilates'
                    ) {
                      return 'Yoga';
                    } else if (
                      vLower === 'genaral gym' ||
                      vLower === 'general gym' ||
                      vLower === 'genaral' ||
                      vLower === 'general'
                    ) {
                      return 'Gym';
                    }
                    return v;
                  })()} • ${provider.address || 'Fitness Partner'}`}
                  pinColor={selectedProviderId === provider.id ? '#FF3B30' : '#E74C3C'}
                  onPress={() => {
                    handleMarkerPress(provider);
                  }}
                />
              );
            })
            .filter(Boolean)}
          {userLocation && userLocation.latitude && userLocation.longitude && (
            <Marker
              key="user-location"
              coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              tracksViewChanges={false}
              title="Me"
              description="Your location"
              pinColor="blue"
            />
          )}
        </MapView>
      </View>

      <View style={styles.topContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search providers or partners..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Location Selector Bar */}
        <View style={styles.locationBar}>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="location" size={14} color="#e74c3c" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationName || 'Select Location'}
            </Text>
            <Icon name="chevron-down" size={10} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Location Permission Modal */}
        <Modal
          visible={showPermissionModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.permissionModal}>
              <View style={styles.modalIconContainer}>
                <Icon name="location" size={40} color="#e74c3c" />
              </View>
              <Text style={styles.modalTitle}>Enable Location</Text>
              <Text style={styles.modalSub}>
                To show you partners and studios on the map, we need access to your location.
              </Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => locationActions.requestPermission()}
              >
                <Text style={styles.modalBtnText}>ALLOW ACCESS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSkipBtn}
                onPress={() => locationActions.skipPermission()}
              >
                <Text style={styles.modalSkipText}>Not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Location Selector Modal */}
        <LocationSelectorModal
          visible={isLocationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          actions={locationActions}
          activeLocationName={locationName}
        />

        <View style={styles.categoriesWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
      </View>

      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY: clampedTranslateY }] },
        ]}
      >
        <View
          {...panResponder.panHandlers}
          style={styles.draggableHeader}
        >
          <View style={styles.topRightGradientContainer} pointerEvents="none">
            <LinearGradient
              colors={['rgba(255,100,80,0.5)', 'rgba(0,0,0,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topRightGradient}
            />
          </View>

          <View style={styles.topLine} pointerEvents="none" />
          <Text style={styles.listTitle} pointerEvents="none">
            {nearbyProviders.length === 0
              ? 'No Providers Nearby'
              : nearbyProviders.length === 1
              ? '1 Provider Nearby'
              : `${nearbyProviders.length} Providers Nearby`}
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={nearbyProviders}
          style={styles.providersList}
          renderItem={renderProviderCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          onScrollToIndexFailed={info => {
            if (flatListRef.current) {
              flatListRef.current.scrollToOffset({
                offset: info.index * 135,
                animated: true,
              });
            }
          }}
          onScroll={e => {
            const y = e.nativeEvent.contentOffset.y;
            if (y < -15 && Math.abs(lastOffsetY.current - SNAP_TOP) < 40) {
              collapseSheet();
            }
          }}
          onScrollBeginDrag={() => {
            if (Math.abs(lastOffsetY.current - SNAP_TOP) > 30) {
              expandSheet();
            }
          }}
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          ListEmptyComponent={!isLoading && (
            <View style={{ alignItems: 'center', marginTop: 35, paddingHorizontal: 25 }}>
              <Icon name="location-outline" size={40} color="#555" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 6 }}>No Partners Found Nearby</Text>
              <Text style={{ color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                There are currently no fitness partners registered in this area.
              </Text>
            </View>
          )}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const createStyles = ({ fs, sp, ms, wp, height, isTablet }, insets, SNAP_TOP) => StyleSheet.create({

  safeArea: { flex: 1, backgroundColor: '#000' },
  topContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    paddingTop: insets.top + sp(6),
    paddingBottom: sp(10),
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: sp(15), paddingBottom: sp(10), backgroundColor: 'transparent' },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(15),
    paddingBottom: sp(8),
    backgroundColor: 'transparent',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: sp(12),
    paddingVertical: sp(6),
    borderRadius: ms(15),
    borderWidth: 1,
    borderColor: '#333',
  },
  locationText: {
    color: '#fff',
    fontSize: fs(12),
    fontWeight: '600',
    marginHorizontal: sp(6),
  },
  backBtn: { marginRight: sp(10), minWidth: ms(40), minHeight: ms(40), alignItems: 'center', justifyContent: 'center' },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: ms(20), borderWidth: 1, borderColor: '#333', minHeight: ms(40), paddingHorizontal: sp(15) },
  searchIcon: { marginRight: sp(8) },
  searchInput: { flex: 1, color: '#fff', fontSize: fs(14), minHeight: ms(40), minWidth: 0, paddingVertical: 0 },
  filterBtn: { marginLeft: sp(15), minWidth: ms(40), minHeight: ms(40), alignItems: 'center', justifyContent: 'center' },
  categoriesWrapper: { backgroundColor: '#000' },
  categoriesList: { paddingHorizontal: sp(15), alignItems: 'center' },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: sp(16), paddingVertical: sp(6), borderRadius: ms(20), backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: sp(10), minHeight: ms(32) },
  categoryPillActive: { borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.1)' },
  categoryIcon: { marginRight: sp(6) },
  categoryText: { color: '#888', fontSize: fs(12), fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  sheetContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: height, backgroundColor: '#000', borderTopLeftRadius: ms(20), borderTopRightRadius: ms(20), zIndex: 20, overflow: 'hidden' },
  draggableHeader: { alignItems: 'center', paddingTop: sp(14), paddingBottom: sp(20), backgroundColor: '#000' },
  topRightGradientContainer: { position: 'absolute', top: 0, right: 0, width: '60%', height: ms(120) },
  topRightGradient: { flex: 1, borderBottomLeftRadius: ms(100) },
  topLine: { width: ms(50), height: ms(4), backgroundColor: '#444', borderRadius: ms(2), marginBottom: sp(18) },
  listTitle: { color: '#fff', fontSize: fs(20), fontWeight: '500', letterSpacing: 1 },
  providersList: { flex: 1, backgroundColor: '#000' },
  providerCard: { flexDirection: 'row', backgroundColor: '#050505', borderRadius: ms(12), padding: sp(12), marginHorizontal: sp(isTablet ? 28 : 20), marginBottom: sp(15), borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  providerCardSelected: {
    borderColor: '#e74c3c',
    borderWidth: 1.5,
    backgroundColor: '#160808',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: sp(6),
    paddingVertical: sp(2),
    borderRadius: ms(8),
    marginRight: sp(6),
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: fs(8),
    fontWeight: 'bold',
    marginLeft: sp(2),
  },
  providerImage: { width: ms(isTablet ? 96 : 80), height: ms(isTablet ? 96 : 80), borderRadius: ms(8) },
  providerContent: { flex: 1, marginLeft: sp(15), minWidth: 0 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(4) },
  providerName: { color: '#fff', fontSize: fs(14), fontWeight: 'bold', marginRight: sp(8), flexShrink: 1 },
  premiumBadge: { backgroundColor: '#FFD700', paddingHorizontal: sp(6), paddingVertical: sp(2), borderRadius: ms(10) },
  premiumText: { color: '#000', fontSize: fs(8), fontWeight: 'bold' },
  providerMeta: { color: '#aaa', fontSize: fs(10), marginBottom: sp(4) },
  providerRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: sp(8) },
  providerRatingText: { color: '#fff', fontSize: fs(10), fontWeight: 'bold' },
  starIcon: { marginHorizontal: sp(4) },
  providerReviewsText: { color: '#888', fontSize: fs(10) },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagPill: { backgroundColor: '#222', paddingHorizontal: sp(8), paddingVertical: sp(4), borderRadius: ms(10), marginRight: sp(6), marginTop: sp(4) },
  tagText: { color: '#aaa', fontSize: fs(8) },
  providerRightActions: { justifyContent: 'space-between', alignItems: 'flex-end', marginLeft: sp(10) },
  bookmarkBtn: { padding: 4 },
  arrowBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: ms(20),
    padding: ms(24),
    width: wp(90),
    maxWidth: 520,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIconContainer: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sp(20),
  },
  modalTitle: {
    color: '#fff',
    fontSize: fs(20),
    fontWeight: 'bold',
    marginBottom: sp(10),
  },
  modalSub: {
    color: '#aaa',
    fontSize: fs(14),
    textAlign: 'center',
    marginBottom: sp(30),
    lineHeight: fs(18),
  },
  modalBtn: {
    backgroundColor: '#e74c3c',
    width: '100%',
    paddingVertical: sp(14),
    borderRadius: ms(12),
    alignItems: 'center',
    marginBottom: sp(15),
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSkipBtn: {
    paddingVertical: 10,
  },
  modalSkipText: {
    color: '#666',
    fontSize: 14,
  },
});

export default DiscoverProvidersMapScreen;
