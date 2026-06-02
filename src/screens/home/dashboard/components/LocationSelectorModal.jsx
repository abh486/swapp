import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
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

export const LocationSelectorModal = ({ visible, onClose, onSelect, actions, activeLocationName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const metrics = useResponsiveMetrics();
  const { ms, sp, fs } = metrics;

  const filteredCities = POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            {searchQuery.length > 0 && (
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

          <Text style={[styles.sectionLabel, { fontSize: fs(11), marginBottom: sp(8) }]}>POPULAR CITIES</Text>

          {/* Cities List */}
          <FlatList
            data={filteredCities}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
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
                No cities found matching search query
              </Text>
            }
            contentContainerStyle={{ paddingBottom: sp(30) }}
            showsVerticalScrollIndicator={false}
          />
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
});

export default LocationSelectorModal;
