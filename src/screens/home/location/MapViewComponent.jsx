// src/screens/home/location/MapViewComponent.jsx
import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps'; // ✅ removed PROVIDER_GOOGLE
import { useNavigation } from '@react-navigation/native';

export const MapViewComponent = ({ userLocation, gyms }) => {
  const mapRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [mapReady, setMapReady] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const centerMapOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
    }
  };

  useEffect(() => {
    if (userLocation && mapReady) {
      centerMapOnUser();
    }
  }, [userLocation, mapReady]);

  const initialRegion = {
    latitude: 28.7041,
    longitude: 77.1025,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onMapReady={() => setMapReady(true)}
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userLocationMarker}>
              <Animated.View
                style={[
                  styles.userLocationPulse,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}

        {gyms &&
          gyms.map((gym) => {
            if (!gym || !gym.id || !gym.coordinates) return null;

            return (
              <Marker
                key={gym.id}
                coordinate={gym.coordinates}
                title={gym.name}
                pinColor="#27ae60"
                onPress={() =>
                  navigation.navigate('GymDetails', { gymId: gym.id })
                }
              />
            );
          })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { height: '55%' },
  map: { flex: 1 },
  userLocationMarker: { alignItems: 'center', justifyContent: 'center' },
  userLocationDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#27ae60',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(39, 174, 96, 0.3)',
  },
});