// src/context/LocationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = 'userLocation';
const LOCATION_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

const GOOGLE_MAPS_API_KEY = Platform.select({
  ios: 'AIzaSyDbCCPsto9OSDAYX7D9vm1ibB1VKVOoTeI',
  android: 'AIzaSyCYCaA0JTX_cpFbDbe3rlX764XyRsCUYPk',
  default: 'AIzaSyCYCaA0JTX_cpFbDbe3rlX764XyRsCUYPk',
});

const reverseGeocodeLocation = async (latitude, longitude) => {
  try {
    const headers = Platform.select({
      ios: { 'X-Ios-Bundle-Identifier': 'com.swapp.swappfit' },
      android: { 'X-Android-Package': 'com.swappios' },
      default: {},
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
      { headers }
    );
    const json = await res.json();
    if (json?.status === 'OK' && json?.results?.length > 0) {
      let sublocality = '';
      let locality = '';
      let neighborhood = '';

      for (const result of json.results) {
        for (const comp of result.address_components) {
          if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) {
            if (!sublocality) sublocality = comp.long_name;
          }
          if (comp.types.includes('neighborhood')) {
            if (!neighborhood) neighborhood = comp.long_name;
          }
          if (comp.types.includes('locality')) {
            if (!locality) locality = comp.long_name;
          }
        }
        if (sublocality || locality) break;
      }
      return sublocality || neighborhood || locality || 'My Location';
    }
  } catch (err) {
    console.warn('[LocationContext] Google reverse geocode failed:', err);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
      {
        headers: { 'User-Agent': 'SwappFitnessApp/1.0' },
      }
    );
    const json = await res.json();
    if (json?.address) {
      const name = json.address.suburb || json.address.neighbourhood || json.address.city || json.address.town || json.address.county;
      if (name) return name;
    }
  } catch (err) {
    console.warn('[LocationContext] Nominatim reverse geocode failed:', err);
  }

  return 'My Location';
};

export const LocationProvider = ({ children }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const saveLocationToStorage = async (location, permission, name) => {
    try {
      if (location && permission) {
        const locationData = {
          ...location,
          timestamp: Date.now(),
          permission: true,
          name: name || 'My Location',
        };
        await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
      } else {
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save location to storage:', e);
    }
  };

  const restoreLocationFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (!storedData) return false;

      const locationData = JSON.parse(storedData);
      if (Date.now() - locationData.timestamp < LOCATION_EXPIRATION_MS) {
        setUserLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
        setPermissionGranted(locationData.permission);
        setLocationName(locationData.name || 'My Location');
        setIsLoading(false);
        return true;
      } else {
        await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to restore location from storage:', e);
    }
    return false;
  };

  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      setError('');
      Geolocation.getCurrentPosition(
        async (position) => {
          console.log('[LocationContext] Success:', position.coords);
          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          setUserLocation(newLocation);
          setPermissionGranted(true);

          let resolvedName = 'My Location';
          try {
            resolvedName = await reverseGeocodeLocation(latitude, longitude);
          } catch (geoErr) {
            console.warn('[LocationContext] Reverse geocode error:', geoErr);
          }

          setLocationName(resolvedName);
          await saveLocationToStorage(newLocation, true, resolvedName);
          setIsLoading(false);
          resolve(newLocation);
        },
        (e) => {
          console.error('[LocationContext] Error:', e);
          let errorMessage = 'Could not get your location. ';
          setError(errorMessage);
          setUserLocation(null);
          setPermissionGranted(false);
          setIsLoading(false);
          if (Platform.OS === 'ios' && e.code === 1) {
            setShowPermissionModal(true);
          }
          reject(e);
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 1000 * 60 * 5 }
      );
    });
  }, []);

  const requestPermission = useCallback(async () => {
    setShowPermissionModal(false);
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby gyms.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await getCurrentLocation();
        } else {
          setError('Location permission denied.');
          setPermissionGranted(false);
        }
      } catch (err) {
        console.warn(err);
        setError('Permission request failed.');
      }
    } else {
      try {
        Geolocation.requestAuthorization();
        await getCurrentLocation();
      } catch (err) {
        console.warn('[LocationContext] iOS requestAuthorization failed:', err);
        if (err.code === 1) {
          Alert.alert(
            'Location Permission Required',
            'Location access is disabled. Please enable location permissions in your iOS Settings to find nearby gyms.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }
    }
  }, [getCurrentLocation]);

  const checkPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (granted) {
        setPermissionGranted(true);
        await getCurrentLocation();
      } else {
        setShowPermissionModal(true);
        setIsLoading(false);
      }
    } else {
      try {
        Geolocation.requestAuthorization();
        await getCurrentLocation();
      } catch (err) {
        console.warn('[LocationContext] iOS checkPermission getCurrentLocation failed:', err);
      }
    }
  }, [getCurrentLocation]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    const restored = await restoreLocationFromStorage();
    if (!restored) {
      await checkPermission();
    } else {
      // Refresh current location in background to keep data fresh
      checkPermission().catch(() => {});
    }
  }, [checkPermission]);

  useEffect(() => {
    initialize();
  }, []); // Run once on mount

  const skipPermission = () => {
    setShowPermissionModal(false);
    setError('Location access is required to find nearby gyms.');
  };

  const selectLocation = useCallback(async (latitude, longitude, name) => {
    const newLocation = { latitude, longitude };
    setUserLocation(newLocation);
    setPermissionGranted(true);
    setLocationName(name);
    await saveLocationToStorage(newLocation, true, name);
  }, []);

  const value = {
    userLocation,
    locationName,
    permissionGranted,
    isLoading,
    error,
    showPermissionModal,
    actions: {
      requestPermission,
      skipPermission,
      retry: initialize,
      selectLocation,
    },
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
