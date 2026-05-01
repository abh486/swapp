import React, { useState, useRef } from 'react';
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
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { useSelector } from 'react-redux';

import { useLocationManager } from '../../../hooks/useLocationManager';
import { useProviderData } from '../../../hooks/useProviderData';

const { height: screenHeight } = Dimensions.get('window');

const SNAP_BOTTOM = screenHeight - 130;  // Sheet fully down, map fully exposed
const SNAP_MID = screenHeight * 0.55;    // Sheet half way
const SNAP_TOP = 130;                    // Sheet expanded

const INITIAL_SNAP = SNAP_MID;

// Categories are now dynamic from Redux

const DiscoverProvidersMapScreen = ({ navigation, route }) => {
  const initialVertical = route.params?.vertical;
  const initialCategoryId = route.params?.categoryId;

  const [activeCategory, setActiveCategory] = useState(initialCategoryId || 'all');
  const [activeVertical, setActiveVertical] = useState(initialVertical || null);
  const [searchQuery, setSearchQuery] = useState(route.params?.query || '');
  
  const { userLocation, permissionGranted } = useLocationManager();
  const { feed } = useSelector(state => state.home);

  React.useEffect(() => {
    if (route.params?.categoryId) {
      setActiveCategory(route.params.categoryId);
    }
    if (route.params?.vertical) {
      setActiveVertical(route.params.vertical);
    }
    if (route.params?.query) {
      setSearchQuery(route.params.query);
    }
  }, [route.params]);

  const categories = [
    { id: 'all', label: 'All', icon: 'apps' },
    ...(feed?.categories || []).map(c => ({ id: c.id, label: c.label, icon: c.icon, vertical: c.vertical }))
  ];

  const activeFilters = {
    ...(activeCategory !== 'all' ? { categoryId: activeCategory } : {}),
    ...(activeVertical ? { vertical: activeVertical } : {}),
    ...(searchQuery ? { query: searchQuery } : {})
  };

  const { providers, isLoading } = useProviderData(userLocation, permissionGranted, activeFilters);

  const translateY = useRef(new Animated.Value(INITIAL_SNAP)).current;
  const lastOffsetY = useRef(INITIAL_SNAP);

  React.useEffect(() => {
    const listenerId = translateY.addListener(({ value }) => {
      lastOffsetY.current = value;
    });
    return () => translateY.removeListener(listenerId);
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
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
        if (lastOffsetY.current < SNAP_TOP) {
          Animated.spring(translateY, {
            toValue: SNAP_TOP,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        } 
        else if (lastOffsetY.current > SNAP_BOTTOM) {
          Animated.spring(translateY, {
            toValue: SNAP_BOTTOM,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        }
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
          setActiveCategory(item.id);
          setActiveVertical(item.vertical || null);
        }}
      >
        <Icon
          name={item.icon}
          size={14}
          color={isActive ? '#e74c3c' : '#888'}
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProviderCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProviderDetails', { id: item.id })}
      style={styles.providerCard}
    >
      <Image source={{ uri: item.photos?.[0] || 'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400' }} style={styles.providerImage} />

      <View style={styles.providerContent}>
        <View style={styles.providerHeader}>
          <Text style={styles.providerName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        <Text style={styles.providerMeta}>
          {item.vertical?.[0] || 'Fitness'}{'   '}•{'   '}{item.distance ? `${item.distance.toFixed(1)} miles` : '0.5 miles'}
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

      <View style={StyleSheet.absoluteFillObject}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation?.latitude || 12.9716,
            longitude: userLocation?.longitude || 77.5946,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          {providers.map(provider => (
            <Marker
              key={provider.id}
              coordinate={{
                latitude: parseFloat(provider.latitude),
                longitude: parseFloat(provider.longitude)
              }}
              title={provider.name}
              description={`${provider.vertical?.[0] || 'Fitness'} • ${provider.address}`}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.topContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search providers, trainers, classes.."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

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
        <View {...panResponder.panHandlers} style={styles.draggableHeader}>
          <View style={styles.topRightGradientContainer}>
            <LinearGradient
              colors={['rgba(255,100,80,0.5)', 'rgba(0,0,0,0)']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topRightGradient}
            />
          </View>

          <View style={styles.topLine} />
          <Text style={styles.listTitle}>{providers.length}+ Partners Nearby</Text>
        </View>

        <FlatList
          data={providers}
          style={styles.providersList}
          renderItem={renderProviderCard}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={!isLoading && <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No partners found nearby</Text>}
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  topContainer: { backgroundColor: '#000', zIndex: 10, paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 10 : 0, paddingBottom: 10, backgroundColor: '#000' },
  backBtn: { marginRight: 10 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 20, borderWidth: 1, borderColor: '#333', height: 40, paddingHorizontal: 15 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, height: '100%' },
  filterBtn: { marginLeft: 15 },
  categoriesWrapper: { backgroundColor: '#000' },
  categoriesList: { paddingHorizontal: 15, alignItems: 'center' },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 10, height: 32 },
  categoryPillActive: { borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  categoryIcon: { marginRight: 6 },
  categoryText: { color: '#888', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  sheetContainer: { position: 'absolute', top: 0, left: 0, right: 0, height: screenHeight - SNAP_TOP, backgroundColor: '#000', borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 20, overflow: 'hidden' },
  draggableHeader: { alignItems: 'center', paddingTop: 14, paddingBottom: 20, backgroundColor: '#000' },
  topRightGradientContainer: { position: 'absolute', top: 0, right: 0, width: '60%', height: 120 },
  topRightGradient: { flex: 1, borderBottomLeftRadius: 100 },
  topLine: { width: 50, height: 4, backgroundColor: '#444', borderRadius: 2, marginBottom: 18 },
  listTitle: { color: '#fff', fontSize: 20, fontWeight: '500', letterSpacing: 1 },
  providersList: { flex: 1, backgroundColor: '#000' },
  providerCard: { flexDirection: 'row', backgroundColor: '#050505', borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  providerImage: { width: 80, height: 80, borderRadius: 8 },
  providerContent: { flex: 1, marginLeft: 15 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  providerName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginRight: 8, flexShrink: 1 },
  premiumBadge: { backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  premiumText: { color: '#000', fontSize: 8, fontWeight: 'bold' },
  providerMeta: { color: '#aaa', fontSize: 10, marginBottom: 4 },
  providerRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  providerRatingText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  starIcon: { marginHorizontal: 4 },
  providerReviewsText: { color: '#888', fontSize: 10 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tagPill: { backgroundColor: '#222', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginRight: 6, marginTop: 4 },
  tagText: { color: '#aaa', fontSize: 8 },
  providerRightActions: { justifyContent: 'space-between', alignItems: 'flex-end', marginLeft: 10 },
  bookmarkBtn: { padding: 4 },
  arrowBtn: { padding: 4 },
});

export default DiscoverProvidersMapScreen;
