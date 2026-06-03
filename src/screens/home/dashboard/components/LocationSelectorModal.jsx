import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useResponsiveMetrics } from '../../../../utils/responsive';

const POPULAR_CITIES = [
  { id: '1', name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, icon: 'business' },
  { id: '2', name: 'Delhi / NCR', latitude: 28.7041, longitude: 77.1025, icon: 'location' },
  { id: '3', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, icon: 'boat' },
  { id: '4', name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, icon: 'cube' },
  { id: '5', name: 'Chennai', latitude: 13.0827, longitude: 80.2707, icon: 'sunny' },
  { id: '6', name: 'Pune', latitude: 18.5204, longitude: 73.8567, icon: 'leaf' },
];

const GOOGLE_MAPS_API_KEY = Platform.select({
  ios: 'AIzaSyDbCCPsto9OSDAYX7D9vm1ibB1VKVOoTeI',
  android: 'AIzaSyCYCaA0JTX_cpFbDbe3rlX764XyRsCUYPk',
  default: 'AIzaSyCYCaA0JTX_cpFbDbe3rlX764XyRsCUYPk',
});

export const LocationSelectorModal = ({ visible, onClose, onSelect, actions, activeLocationName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isSelectingPlace, setIsSelectingPlace] = useState(false);

  const metrics = useResponsiveMetrics();
  const { ms, sp, fs } = metrics;

  const filteredCities = POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debounced search for places
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPredictions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchPlaces(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchPlaces = async (query) => {
    setIsLoadingPredictions(true);
    try {
      const headers = Platform.select({
        ios: { 'X-Ios-Bundle-Identifier': 'com.swapp.swappfit' },
        android: { 'X-Android-Package': 'com.swappios' },
        default: {},
      });
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`,
        { headers }
      );
      const resJson = await response.json();
      console.log('[Autocomplete] Response:', resJson);
      if (resJson?.status === 'OK' && resJson?.predictions) {
        // Map Google predictions and add source: 'google'
        const googleResults = resJson.predictions.map(p => ({
          ...p,
          source: 'google'
        }));
        setPredictions(googleResults);
      } else if (resJson?.status === 'ZERO_RESULTS') {
        setPredictions([]);
      } else {
        console.warn('[Autocomplete] Google Places API failed, using Nominatim fallback:', resJson.status, resJson.error_message);
        await fetchNominatim(query);
      }
    } catch (error) {
      console.warn('[Autocomplete] Google fetch error, using Nominatim fallback:', error);
      await fetchNominatim(query);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  const fetchNominatim = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=8&countrycodes=in&accept-language=en`,
        {
          headers: {
            'User-Agent': 'SwappFitnessApp/1.0',
          }
        }
      );
      const resJson = await response.json();
      console.log('[Autocomplete] Nominatim Response:', resJson);
      if (Array.isArray(resJson)) {
        const nominatimResults = resJson.map((item, idx) => {
          const parts = item.display_name.split(',');
          const title = parts[0]?.trim() || item.display_name;
          const subtitle = parts.slice(1).map(p => p.trim()).join(', ');
          return {
            place_id: `nominatim-${item.place_id || idx}`,
            description: item.display_name,
            structured_formatting: {
              main_text: title,
              secondary_text: subtitle
            },
            source: 'nominatim',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon)
          };
        });
        setPredictions(nominatimResults);
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('[Autocomplete] Nominatim fetch error:', error);
      setPredictions([]);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      await actions.requestPermission();
      onClose();
    } catch (error) {
      console.warn('GPS location request failed:', error);
    }
  };

  const handleSelectCity = (city) => {
    actions.selectLocation(city.latitude, city.longitude, city.name);
    if (onSelect) {
      onSelect({ latitude: city.latitude, longitude: city.longitude, name: city.name });
    }
    onClose();
  };

  const handleSelectPrediction = async (prediction) => {
    if (prediction.source === 'nominatim') {
      const lat = prediction.latitude;
      const lng = prediction.longitude;
      const displayName = prediction.structured_formatting?.main_text || prediction.description;
      actions.selectLocation(lat, lng, displayName);
      if (onSelect) {
        onSelect({ latitude: lat, longitude: lng, name: displayName });
      }
      onClose();
      return;
    }

    setIsSelectingPlace(true);
    try {
      const headers = Platform.select({
        ios: { 'X-Ios-Bundle-Identifier': 'com.swapp.swappfit' },
        android: { 'X-Android-Package': 'com.swappios' },
        default: {},
      });
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`,
        { headers }
      );
      const resJson = await response.json();
      console.log('[PlaceDetails] Response:', resJson);
      if (resJson?.result?.geometry?.location) {
        const { lat, lng } = resJson.result.geometry.location;
        const displayName = prediction.structured_formatting?.main_text || prediction.description;
        actions.selectLocation(lat, lng, displayName);
        if (onSelect) {
          onSelect({ latitude: lat, longitude: lng, name: displayName });
        }
        onClose();
      } else {
        console.warn('[PlaceDetails] Google details failed, trying Nominatim geocode fallback', resJson);
        await geocodeWithNominatim(prediction.description);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      await geocodeWithNominatim(prediction.description);
    } finally {
      setIsSelectingPlace(false);
    }
  };

  const geocodeWithNominatim = async (description) => {
    setIsSelectingPlace(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          description
        )}&format=json&limit=1&countrycodes=in&accept-language=en`,
        {
          headers: {
            'User-Agent': 'SwappFitnessApp/1.0',
          }
        }
      );
      const resJson = await response.json();
      if (Array.isArray(resJson) && resJson.length > 0) {
        const item = resJson[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = description.split(',')[0] || description;
        actions.selectLocation(lat, lng, displayName);
        if (onSelect) {
          onSelect({ latitude: lat, longitude: lng, name: displayName });
        }
        onClose();
      } else {
        Alert.alert('Location Error', 'Could not resolve the selected location coordinates.');
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      Alert.alert('Location Error', 'Could not resolve the selected location coordinates.');
    } finally {
      setIsSelectingPlace(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.backdropTouch}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={[styles.bottomSheet, { maxHeight: metrics.hp(85) }]}>
          {/* Top Right Gradient Background */}
          <View style={styles.topRightGradientContainer}>
            <LinearGradient
              colors={['rgba(231,76,60,0.3)', 'rgba(0,0,0,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topRightGradient}
            />
          </View>

          {/* Pull handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: fs(20) }]}>Select Location</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={[styles.searchContainer, { marginVertical: sp(16) }]}>
            <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { fontSize: fs(14) }]}
              placeholder="Search city or area..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isLoadingPredictions && (
              <ActivityIndicator size="small" color="#e74c3c" style={{ marginRight: 8 }} />
            )}
            {searchQuery.length > 0 && !isLoadingPredictions && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Icon name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {/* Current Location Option */}
          <TouchableOpacity
            style={[styles.currentLocationRow, { paddingVertical: sp(14), marginBottom: sp(16) }]}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.8}
          >
            <View style={styles.gpsIconContainer}>
              <Icon name="locate" size={20} color="#e74c3c" />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.currentLocationText, { fontSize: fs(14) }]}>Use Current Location</Text>
              <Text style={[styles.currentLocationSub, { fontSize: fs(11) }]}>Find gym partners using GPS</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#555" />
          </TouchableOpacity>

          {isSelectingPlace ? (
            <View style={styles.selectingPlaceContainer}>
              <ActivityIndicator size="large" color="#e74c3c" />
              <Text style={[styles.emptyText, { fontSize: fs(12), marginTop: sp(12) }]}>
                Loading place details...
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionLabel, { fontSize: fs(11), marginBottom: sp(8) }]}>
                {searchQuery ? 'SEARCH RESULTS' : 'POPULAR CITIES'}
              </Text>

              {/* Cities / Predictions List */}
              <FlatList
                data={searchQuery ? predictions : filteredCities}
                keyExtractor={item => searchQuery ? item.place_id : item.id}
                renderItem={({ item }) => {
                  if (searchQuery) {
                    return (
                      <TouchableOpacity
                        style={[styles.cityRow, { paddingVertical: sp(14) }]}
                        onPress={() => handleSelectPrediction(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cityIconContainer}>
                          <Icon name="location-outline" size={18} color="#888" />
                        </View>
                        <View style={styles.flex1}>
                          <Text style={[styles.cityName, { fontSize: fs(14), color: '#fff' }]}>
                            {item.structured_formatting?.main_text || item.description}
                          </Text>
                          <Text style={[styles.currentLocationSub, { fontSize: fs(11) }]} numberOfLines={1}>
                            {item.structured_formatting?.secondary_text || ''}
                          </Text>
                        </View>
                        <Icon name="chevron-forward" size={16} color="#333" />
                      </TouchableOpacity>
                    );
                  }

                  const isSelected = activeLocationName?.toLowerCase() === item.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[
                        styles.cityRow, 
                        { paddingVertical: sp(14) },
                        isSelected && styles.cityRowSelected
                      ]}
                      onPress={() => handleSelectCity(item)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.cityIconContainer, isSelected && styles.cityIconContainerSelected]}>
                        <Icon name={item.icon} size={18} color={isSelected ? '#fff' : '#888'} />
                      </View>
                      <Text style={[
                        styles.cityName, 
                        { fontSize: fs(14) },
                        isSelected && styles.cityNameSelected
                      ]}>
                        {item.name}
                      </Text>
                      {isSelected ? (
                        <Icon name="checkmark-circle" size={20} color="#e74c3c" />
                      ) : (
                        <Icon name="chevron-forward" size={16} color="#333" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { fontSize: fs(12), marginVertical: sp(20) }]}>
                    {searchQuery ? 'No locations found matching search query' : 'No cities found'}
                  </Text>
                }
                contentContainerStyle={{ paddingBottom: sp(30) }}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  topRightGradientContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: 200,
    zIndex: 0,
  },
  topRightGradient: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    zIndex: 1,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    zIndex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  clearSearchBtn: {
    padding: 4,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.15)',
    zIndex: 1,
  },
  gpsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  flex1: {
    flex: 1,
  },
  currentLocationText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  currentLocationSub: {
    color: '#888',
    marginTop: 2,
  },
  sectionLabel: {
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
    zIndex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    zIndex: 1,
  },
  cityRowSelected: {
    borderBottomColor: 'rgba(231, 76, 60, 0.15)',
  },
  cityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cityIconContainerSelected: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  cityName: {
    color: '#aaa',
    fontWeight: '500',
    flex: 1,
  },
  cityNameSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
  },
  selectingPlaceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default LocationSelectorModal;
