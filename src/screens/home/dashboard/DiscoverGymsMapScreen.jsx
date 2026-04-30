import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker } from 'react-native-maps';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'train', label: 'Train', icon: 'barbell' },
  { id: 'combat', label: 'Combat', icon: 'medical' }, 
  { id: 'mind_body', label: 'Mind & Body', icon: 'body' },
  { id: 'recovery', label: 'Recovery', icon: 'medkit' }
];

const GYMS_DATA = [
  {
    id: '1',
    name: 'Cult Koramangala',
    isPremium: true,
    category: 'Gym',
    distance: '0.8 km',
    rating: '4.6',
    reviews: 120,
    tags: ['Gym', 'Group Classes', 'Personal Trainer'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    coordinate: { latitude: 12.9352, longitude: 77.6245 }
  },
  {
    id: '2',
    name: 'Fitbox Jayanagar',
    isPremium: false,
    category: 'Boxing',
    distance: '1.2 km',
    rating: '4.8',
    reviews: 98,
    tags: ['Boxing', 'Strength', 'Cardio'],
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400',
    coordinate: { latitude: 12.9299, longitude: 77.5834 }
  },
  {
    id: '3',
    name: 'Yoga House Indiranagar',
    isPremium: false,
    category: 'Yoga',
    distance: '1.7 km',
    rating: '4.5',
    reviews: 110,
    tags: ['Gym', 'Crossfit', 'Strength'],
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
    coordinate: { latitude: 12.9784, longitude: 77.6408 }
  },
  {
    id: '4',
    name: 'Flex Studio Koramangala',
    isPremium: false,
    category: 'Pilates',
    distance: '2.1 km',
    rating: '4.5',
    reviews: 60,
    tags: ['Mobility', 'Rehab', 'Pilates'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    coordinate: { latitude: 12.9340, longitude: 77.6100 }
  }
];

const DiscoverGymsMapScreen = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const renderCategory = ({ item }) => {
    const isActive = activeCategory === item.id;
    return (
      <TouchableOpacity 
        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
        onPress={() => setActiveCategory(item.id)}
      >
        <Icon name={item.icon} size={14} color={isActive ? '#e74c3c' : '#888'} style={styles.categoryIcon} />
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderGymCard = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('GymDetail')} style={styles.gymCard}>
      <Image source={{ uri: item.image }} style={styles.gymImage} />
      
      <View style={styles.gymContent}>
        <View style={styles.gymHeader}>
          <Text style={styles.gymName} numberOfLines={1}>{item.name}</Text>
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        <Text style={styles.gymMeta}>
          {item.category}   •   {item.distance}
        </Text>
        
        <View style={styles.gymRatingRow}>
          <Text style={styles.gymRatingText}>{item.rating}</Text>
          <Icon name="star" size={10} color="#FFD700" style={styles.starIcon} />
          <Text style={styles.gymReviewsText}>({item.reviews})</Text>
        </View>

        <View style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gymRightActions}>
        <TouchableOpacity style={styles.bookmarkBtn}>
          <Icon name="bookmark-outline" size={24} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrowBtn}>
          <Icon name="arrow-forward-circle" size={32} color="#aaa" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search gyms, trainers, classes.."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Icon name="filter-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 12.9716, // Bangalore center roughly
            longitude: 77.5946,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {GYMS_DATA.map(gym => (
            <Marker 
              key={gym.id}
              coordinate={gym.coordinate}
              title={gym.name}
              description={`${gym.category} • ${gym.distance}`}
            />
          ))}
        </MapView>
      </View>

      {/* Bottom List Section */}
      <View style={styles.bottomSection}>
        <View style={styles.topRightGradientContainer}>
          <LinearGradient
            colors={['rgba(255,100,80,0.6)', 'rgba(0,0,0,0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topRightGradient}
          />
        </View>
        
        <View style={styles.listHeader}>
          <View style={styles.topLine} />
          <Text style={styles.listTitle}>25+ Fitness Centers Nearby</Text>
        </View>

        <FlatList
          data={GYMS_DATA}
          renderItem={renderGymCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gymsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#000',
  },
  backBtn: {
    marginRight: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    height: 40,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    height: '100%',
  },
  filterBtn: {
    marginLeft: 15,
  },
  categoriesWrapper: {
    backgroundColor: '#000',
    paddingVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
    height: 32,
  },
  categoryPillActive: {
    borderColor: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  mapContainer: {
    flex: 0.45,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSection: {
    flex: 0.55,
    backgroundColor: '#000',
  },
  topRightGradientContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: 250,
  },
  topRightGradient: {
    flex: 1,
    borderBottomLeftRadius: 200,
  },
  listHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 25,
  },
  topLine: {
    width: 80,
    height: 1,
    backgroundColor: '#555',
    marginBottom: 20,
  },
  listTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 1,
  },
  gymsList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  gymCard: {
    flexDirection: 'row',
    backgroundColor: '#050505',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gymImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  gymContent: {
    flex: 1,
    marginLeft: 15,
  },
  gymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gymName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  premiumText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  gymMeta: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 4,
  },
  gymRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gymRatingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  starIcon: {
    marginHorizontal: 4,
  },
  gymReviewsText: {
    color: '#888',
    fontSize: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginTop: 4,
  },
  tagText: {
    color: '#aaa',
    fontSize: 8,
  },
  gymRightActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  bookmarkBtn: {
    padding: 4,
  },
  arrowBtn: {
    padding: 4,
  },
});

export default DiscoverGymsMapScreen;
