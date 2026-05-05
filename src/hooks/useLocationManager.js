// src/hooks/useLocationManager.js
import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const LOCATION_STORAGE_KEY = 'userLocation';
const LOCATION_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes

export const useLocationManager = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const saveLocationToStorage = async (location, permission) => {
    try {
      if (location && permission) {
        const locationData = { ...location, timestamp: Date.now(), permission: true };
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
          console.log('[LocationManager] Success:', position.coords);
          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          setUserLocation(newLocation);
          setPermissionGranted(true);
          await saveLocationToStorage(newLocation, true);
          setIsLoading(false);
          resolve(newLocation);
        },
        (e) => {
          console.error('[LocationManager] Error:', e);
          let errorMessage = 'Could not get your location. ';
          switch (e.code) {
            case 1: errorMessage += 'Permission denied.'; break;
            case 2: errorMessage += 'Location unavailable.'; break;
            case 3: errorMessage += 'Request timed out.'; break;
            default: errorMessage += 'Please check settings.';
          }
          setError(errorMessage);
          setUserLocation(null);
          setPermissionGranted(false);
          setIsLoading(false);
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
      await getCurrentLocation(); // iOS handles this in the getCurrentPosition call
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
       await getCurrentLocation();
    }
  }, [getCurrentLocation]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    const restored = await restoreLocationFromStorage();
    if (!restored) {
      await checkPermission();
    }
  }, [checkPermission]);

  useFocusEffect(useCallback(() => {
      initialize();
  }, [initialize]));
  
  const skipPermission = () => {
    setShowPermissionModal(false);
    setError('Location access is required to find nearby gyms.');
  }

  return {
    userLocation,
    permissionGranted,
    isLoading,
    error,
    showPermissionModal,
    actions: {
      requestPermission,
      skipPermission,
      retry: initialize,
    },
  };
};