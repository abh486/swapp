
// src/screens/home/location/LocationMain.jsx
import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Animated, AppState, ImageBackground } from 'react-native';
import { useDispatch } from 'react-redux';
import { getGymDetails } from '../../../redux/actions/gymsActions';
import { useAuth } from '../../../context/AuthContext';
import { useLocationManager } from '../../../hooks/useLocationManager';
import { useGymData } from '../../../hooks/useGymData';
import { LocationContent } from './LocationContent';
import { Strings } from '../../../config/config'; // Import Config

export const LocationMain = () => {
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const { List, Filter } = Strings.Location;

  // Get -> LIVE user object from context at the TOP LEVEL.
  const { user, refreshAuthStatus } = useAuth();
  
  const [selectedGymDetails, setSelectedGymDetails] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  
  const { 
    userLocation, 
    permissionGranted, 
    isLoading: isLocationLoading, 
    error: locationError, 
    actions: locationActions 
  } = useLocationManager();

  const { 
    gyms, 
    isLoading: areGymsLoading, 
    error: gymError, 
    hasMore,
    actions: gymActions 
  } = useGymData(userLocation, permissionGranted);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ UPDATED: Using config strings for filter and sort options
  const filterOptions = [
    { label: Filter.options.all, value: 'all' },
    { label: Filter.options.premium, value: 'premium' }
  ];
  const sortOptions = [
    { label: Filter.sortOptions.distance, value: 'distance' },
    { label: Filter.sortOptions.rating, value: 'rating' }
  ];
  const [selectedFilter, setSelectedFilter] = useState(filterOptions[0].value);
  const [selectedSort, setSelectedSort] = useState(sortOptions[0].value);

  // This AppState listener is correct.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[AppState] App has come to the foreground! Refreshing user data...');
        await refreshAuthStatus();
      }
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); };
  }, [refreshAuthStatus]);

  const onMyLocation = () => {
    if (mapRef.current && userLocation) {
        mapRef.current.animateToRegion({ ...userLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }, 1000);
    }
  };

  const handleOpenGymDetails = async (gymFromList) => {
    setSelectedGymDetails(gymFromList);
    setIsModalLoading(true);
    try {
      const response = await dispatch(getGymDetails(gymFromList.id));
      if (response.success) {
        setSelectedGymDetails(response.data);
      } else {
        console.error("Failed to fetch gym details:", response.message);
        // Note: UI Error handling is usually done by the Modal or a Toast, 
        // but since this is the main orchestrator, we just log it for now.
      }
    } catch (error) {
      console.error("API error fetching gym details:", error);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedGymDetails(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmNbAOg1cnAkW28hFHJi019Bn0z0Pnodyay8M1FhM4s5fW-TKkkFUftREv-H-DK3tXcqRFXUrDi6RZdo851MaDFfbSZwTtyHsIn3IZqS24YnewD2UucbCnXrlckk-Lfl2vvDNAW9P0J7UqwL9n5BBDaNON_z6KQAvq1a4Od-FrtEJETA2kjiCzMkof5hb4kHAN8Agb4PuibK7K-BAyY7xbs8pbhWC3GZqTjuAfbM_zQllyJYPZpd57A1ryO_UGHLODKUW6rvwg4HI' }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LocationContent
          // PASS THE LIVE, FRESH USER OBJECT DOWN AS A PROP
          user={user}
          gyms={gyms}
          userLocation={userLocation}
          permissionGranted={permissionGranted}
          selectedGym={selectedGymDetails}
          isModalLoading={isModalLoading}
          isLoading={areGymsLoading}
          isLoadingLocation={isLocationLoading}
          error={locationError || gymError}
          mapRef={mapRef}
          pulseAnim={useRef(new Animated.Value(1)).current}
          onGymPress={handleOpenGymDetails}
          onMapMarkerPress={handleOpenGymDetails}
          onCloseGymModal={handleCloseModal}
          onMyLocation={onMyLocation}
          onCameraPress={() => console.log('Camera pressed')}
          onRequestLocationPermission={locationActions.requestPermission}
          onSkipPermission={locationActions.skipPermission}
          showSearchModal={showSearchModal}
          onSearchPress={() => setShowSearchModal(true)}
          onSearchModalClose={() => setShowSearchModal(false)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          showFilterModal={showFilterModal}
          onFilterPress={() => setShowFilterModal(true)}
          onFilterModalClose={() => setShowFilterModal(false)}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          selectedSort={selectedSort}
          onSortChange={setSelectedSort}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000000' },
    backgroundImage: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    backgroundImageStyle: {
      resizeMode: 'cover',
    },
});

export default LocationMain;