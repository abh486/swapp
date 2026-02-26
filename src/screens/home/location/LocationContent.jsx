import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Platform, Animated, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient'; // 1. Import LinearGradient

import { SearchModal } from './SearchModal';
import { FilterModal } from './FilterModal';
import { GymDetailsModal } from '../gym/GymDetailsModal'; 
import { Strings } from '../../../config/config'; 

export const LocationContent = ({
  user,
  gyms,
  isLoading,
  error,
  userLocation,
  pulseAnim,
  permissionGranted,
  isLoadingLocation,
  mapRef,
  mapSelectedGym,
  selectedGym,
  isModalLoading,
  onGymPress,
  onMapMarkerPress,
  onMyLocation,
  onCameraPress,
  onCloseGymModal,
  searchQuery, onSearchQueryChange, showSearchModal, onSearchModalClose, onSearchPress,
  filterOptions, sortOptions, selectedFilter, selectedSort, onFilterChange, onSortChange, showFilterModal, onFilterModalClose, onFilterPress,
  onRequestLocationPermission, onSkipPermission
}) => {
  // Destructure strings safely
  const { List, Permission, Status } = Strings.Location || {};

  const isSubscribedToThisGym = useMemo(() => {
    if (!user?.subscriptions || !selectedGym?.plans) return false;
    const gymPlanIds = new Set(selectedGym.plans.map(p => p.id));
    return user.subscriptions.some(sub => sub.gymPlanId && gymPlanIds.has(sub.gymPlanId));
  }, [user?.subscriptions, selectedGym?.plans]);
  
  useEffect(() => {
    if (userLocation && mapRef.current) {
      onMyLocation();
    }
  }, [userLocation, mapRef, onMyLocation]);

  const mapRegion = userLocation ? { ...userLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 } : null;

  const renderGymList = () => {
    if (isLoading) {
      return <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#442728" />;
    }
    if (error && (!gyms || gyms.length === 0)) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (!gyms || gyms.length === 0) {
      return <Text style={styles.emptyText}>{List?.empty || 'No gyms found.'}</Text>;
    }
    return (
      <ScrollView style={styles.gymList} showsVerticalScrollIndicator={false}>
        {gyms.map((gym) => {
          if (!gym || !gym.id) return null;
          
          // 2. FIXED: Safely handle undefined distance
          const distanceValue = typeof gym.distance === 'number' ? gym.distance.toFixed(1) : null;
          const distanceText = distanceValue 
            ? `${distanceValue} ${List?.card?.milesAway || 'miles away'}` 
            : List?.card?.distanceNotAvailable || 'Distance not available';

          return (
            <TouchableOpacity
              key={gym.id}
              style={styles.gymCard}
              onPress={() => onGymPress(gym)}
            >
              <Image
                source={{ uri: gym.photos?.[0] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' }}
                style={styles.gymImage}
                resizeMode="cover"
              />
              
              {/* 3. FIXED: Use LinearGradient component instead of View with CSS gradient */}
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
                style={styles.gymInfo}
              >
                <Text style={styles.gymName} numberOfLines={1}>{gym.name || List?.card?.unknownGym || 'Unknown Gym'}</Text>
                
                <View style={styles.gymRating}>
                  <View style={styles.starsContainer}>
                    {Array(5).fill(0).map((_, i) => (
                      <Text key={i} style={styles.star}>
                        {i < Math.floor(gym.rating || 4.5) ? '★' : '☆'}
                      </Text>
                    ))}
                    <Text style={styles.ratingValue}>{gym.rating || '4.5'} (128 reviews)</Text>
                  </View>
                </View>
                
                <Text style={styles.gymDistance}>{distanceText}</Text>
              </LinearGradient>

              <TouchableOpacity style={styles.favoriteButton}>
                <Text style={styles.favoriteIcon}>♡</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <>
      <GymDetailsModal
        gym={selectedGym}
        isVisible={!!selectedGym}
        isLoading={isModalLoading}
        onClose={onCloseGymModal}
        isSubscribed={isSubscribedToThisGym} 
        userSubscriptions={user?.subscriptions || []}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onSearchPress}>
          <Icon name="search" size={24} color="#442728" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={onCameraPress}>
          <Icon name="camera" size={24} color="#442728" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {!permissionGranted && !isLoadingLocation && (
          <View style={styles.locationPermissionOverlay}>
            <View style={styles.permissionCard}>
              <Icon name="location" size={48} color="#442728" />
              <Text style={styles.permissionTitle}>{Status?.nearYou || 'Find Gyms Near You'}</Text>
              <Text style={styles.permissionMessage}>{Permission?.requiredMsg || 'Enable location access to discover nearby gyms.'}</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={onRequestLocationPermission} activeOpacity={0.8}>
                <Text style={styles.permissionButtonText}>{Permission?.buttons?.enable || 'Enable Location Access'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={onSkipPermission}>
                <Text style={styles.skipButtonText}>{Permission?.buttons?.skip || 'Skip for now'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoadingLocation && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#442728" />
              <Text style={styles.loadingText}>{Status?.loading || 'Getting your location...'}</Text>
            </View>
          </View>
        )}

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{ latitude: 28.7041, longitude: 77.1025, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
          region={mapRegion}
        >
          {userLocation && (
            <Marker coordinate={userLocation} title="You are here">
              <View style={styles.userLocationMarker}>
                <Animated.View style={[styles.userLocationPulse, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.userLocationDot} />
              </View>
            </Marker>
          )}
          {gyms && gyms.map((gym) => {
            if (!gym || !gym.id || !gym.coordinates) return null;
            return (
              <Marker
                key={gym.id}
                coordinate={gym.coordinates}
                title={gym.name || 'Gym'}
                pinColor={mapSelectedGym?.id === gym.id ? "#e74c3c" : "#442728"}
                onPress={() => onMapMarkerPress(gym)}
              />
            );
          })}
        </MapView>

        <View style={styles.myLocationButtonContainer}>
          <TouchableOpacity style={styles.myLocationButton} onPress={onMyLocation} activeOpacity={0.8}>
            <Icon name="locate" size={24} color="#442728" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapFilterContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
            <Icon name="filter" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHandle} />
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>Gyms Nearby</Text>
            <Text style={styles.subtitleText}>{gyms ? gyms.length : 0} fitness centers found</Text>
          </View>
          {renderGymList()}
        </View>
      </View>

      <SearchModal isVisible={showSearchModal} onClose={onSearchModalClose} query={searchQuery} onQueryChange={onSearchQueryChange} />
      <FilterModal 
        isVisible={showFilterModal} 
        onClose={onFilterModalClose}
        filterOptions={filterOptions}
        sortOptions={sortOptions}
        selectedFilter={selectedFilter}
        onFilterChange={onFilterChange}
        selectedSort={selectedSort}
        onSortChange={onSortChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainContent: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject, height: '55%' },
  userLocationMarker: { alignItems: 'center', justifyContent: 'center' },
  userLocationDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#442728', borderWidth: 3, borderColor: '#fff' },
  userLocationPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(68, 39, 40, 0.3)' },
  myLocationButtonContainer: { position: 'absolute', right: 16, bottom: '58%', zIndex: 10 },
  myLocationButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapFilterContainer: { position: 'absolute', left: 16, bottom: '58%', zIndex: 10 },
  filterButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#442728', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheet: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#ffffff', 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    paddingTop: 8, 
    height: '45%', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetHandle: { 
    width: 40, 
    height: 6, 
    backgroundColor: '#e0e0e0', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginVertical: 8 
  },
  bottomSheetHeader: { 
    paddingHorizontal: 20, 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  bottomSheetTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  subtitleText: { 
    fontSize: 14, 
    color: '#6b7280', 
    marginTop: 2 
  },
  gymList: { paddingHorizontal: 16, paddingTop: 10 },
  gymCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    marginBottom: 16, 
    flexDirection: 'column',
    overflow: 'hidden',
    height: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gymImage: { 
    width: '100%', 
    height: 160,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Removed the CSS gradient string here; it is now handled by the LinearGradient component
  gymInfo: { 
    flex: 1, 
    padding: 16, 
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gymName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#ffffff', 
    marginBottom: 4 
  },
  gymRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#fbbf24', // Gold color for stars
    fontSize: 16,
  },
  ratingValue: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 8,
  },
  gymDistance: {
    fontSize: 14,
    color: '#d1d5db',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  errorText: { 
    textAlign: 'center', 
    marginTop: 50, 
    color: '#ef4444', 
    fontSize: 16, 
    paddingHorizontal: 20 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 50, 
    color: '#6b7280', 
    fontSize: 16 
  },
  locationPermissionOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 2000 
  },
  permissionCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    padding: 24, 
    margin: 20, 
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#111827', 
    marginTop: 15, 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  permissionMessage: { 
    fontSize: 16, 
    color: '#6b7280', 
    textAlign: 'center', 
    lineHeight: 22, 
    marginBottom: 25 
  },
  permissionButton: { 
    backgroundColor: '#442728', 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 20, 
    width: '100%', 
    alignItems: 'center' 
  },
  permissionButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  skipButton: { 
    marginTop: 15 
  },
  skipButtonText: { 
    color: '#6b7280', 
    fontSize: 14, 
    textDecorationLine: 'underline' 
  },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1500 
  },
  loadingCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: { 
    fontSize: 16, 
    color: '#111827', 
    marginLeft: 15, 
    fontWeight: '600' 
  },
});