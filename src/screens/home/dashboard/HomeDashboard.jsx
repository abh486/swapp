import React, { useState, useRef, useEffect } from 'react';
import { 
  SafeAreaView, 
  StatusBar, 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ImageBackground,
  FlatList,
  Platform,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../context/LocationContext';
import { useProviderData } from '../../../hooks/useProviderData';
import { getHomeFeed } from '../../../redux/actions/homeActions';
import MembershipPlanModal from './MembershipPlanModal';
import { RefreshControl } from 'react-native';
import { setActiveCategory as setGlobalCategory } from '../../../redux/actions/homeActions';

const PROMOS = [
  {
    id: '1',
    title: 'TRAIN LIKE\nAN ATHLETE',
    subtitle: 'Unlock your true potential',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'BUILD YOUR\nCORE STRENGTH',
    subtitle: 'Join our new intensive program',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop',
  }
];

export const HomeDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { activeCategory, activeVertical } = useSelector(state => state.home);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMembershipModalVisible, setMembershipModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { userLocation, permissionGranted, showPermissionModal, actions: locationActions } = useLocation();
  const { feed, loading } = useSelector(state => state.home);

  useEffect(() => {
    fetchFeed();
  }, [userLocation, activeCategory, activeVertical]);

  const fetchFeed = async () => {
    const vertical = activeVertical || undefined;
    if (userLocation) {
      await dispatch(getHomeFeed(userLocation.latitude, userLocation.longitude, vertical));
    } else {
      await dispatch(getHomeFeed(undefined, undefined, vertical));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  const renderCategory = ({ item }) => {
    const isActive = activeCategory === item.id;
    return (
      <TouchableOpacity 
        style={[styles.categoryPill, isActive && styles.categoryPillActive]}
        onPress={() => {
          dispatch(setGlobalCategory(item.id, item.vertical));
        }}
      >
        <Icon name={item.icon || 'apps'} size={14} color={isActive ? '#e74c3c' : '#888'} style={styles.categoryIcon} />
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  const renderOffering = ({ item }) => (
    <TouchableOpacity style={styles.offeringCard} onPress={() => navigation.navigate('ProviderDetails', { id: item.provider?.id })}>
      <ImageBackground source={{ uri: item.image }} style={styles.offeringImage} imageStyle={styles.offeringImageStyle}>
        <View style={styles.badgeContainer}>
          {item.discount && (
            <View style={[styles.badge, styles.discountBadge]}>
              <Text style={styles.badgeText}>{item.discount}</Text>
            </View>
          )}
          {item.badges?.is_recommended && (
            <View style={[styles.badge, styles.recommendedBadge]}>
              <Text style={styles.badgeText}>RECOMMENDED</Text>
            </View>
          )}
        </View>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.offeringOverlay} />
      </ImageBackground>
      <View style={styles.offeringDetails}>
        <Text style={styles.offeringTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.offeringMeta}>{item.duration} • {item.level}</Text>
        <View style={styles.offeringPriceRow}>
          <Text style={styles.offeringPrice}>{item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.offeringOriginalPrice}>{item.originalPrice}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProvider = ({ item: provider }) => {
    if (!provider) return null;
    const distanceValue = typeof provider.distance === 'number' ? provider.distance.toFixed(1) : null;
    const distanceText = distanceValue ? `${distanceValue} miles` : null;
    
    // Vertical Label (e.g., GYM -> Gym, BOXING -> Boxing Studio)
    const verticalLabel = Array.isArray(provider.vertical) 
      ? provider.vertical[0].charAt(0) + provider.vertical[0].slice(1).toLowerCase()
      : (provider.vertical ? provider.vertical.charAt(0) + provider.vertical.slice(1).toLowerCase() : 'Fitness');

    return (
      <TouchableOpacity 
        style={styles.providerCard} 
        onPress={() => navigation.navigate('ProviderDetails', { id: provider.id })}
      >
        <ImageBackground 
          source={{ uri: provider.photos?.[0] || 'https://images.unsplash.com/photo-1571019613454-1cb9f99b2d8b?w=400' }} 
          style={styles.providerImage} 
          imageStyle={styles.providerImageStyle}
        >
          <View style={styles.badgeContainer}>
            {provider.badges?.is_popular && (
              <View style={[styles.badge, styles.popularBadge]}>
                <Text style={styles.badgeText}>POPULAR</Text>
              </View>
            )}
            {provider.badges?.is_new && (
              <View style={[styles.badge, styles.newBadge]}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            )}
            {provider.badges?.is_swapp_partner && (
              <View style={[styles.badge, styles.partnerBadge]}>
                <Icon name="checkmark-circle" size={8} color="#fff" style={{marginRight: 2}} />
                <Text style={styles.badgeText}>PARTNER</Text>
              </View>
            )}
          </View>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.providerOverlay} />
        </ImageBackground>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName} numberOfLines={1}>{provider.name}</Text>
          <Text style={styles.providerDistance}>{verticalLabel} {distanceText ? `• ${distanceText}` : ''}</Text>
          <Text style={styles.providerPrice}>{provider.lowest_price ? `₹${provider.lowest_price}/mo*` : 'View Plans'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const dashboardCategories = [
    { id: 'all', label: 'All', icon: 'apps', vertical: null },
    ...(feed?.categories || []).map(c => ({ id: c.id, label: c.label, icon: c.icon, vertical: c.vertical }))
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e74c3c" />
        }
      >
        
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
                To find the best partners nearby, we need access to your location.
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome {user?.userProfile?.name?.split(' ')[0] || 'Member'} !
          </Text>
          {user?.userProfile?.profileImage ? (
            <Image 
              source={{ uri: user.userProfile.profileImage }} 
              style={styles.profilePic} 
            />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Icon name="person-circle" size={44} color="#888" />
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search providers, trainers, classes..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => navigation.navigate('DiscoverProvidersMap', { query: searchQuery })}
          />
        </View>

        {/* Categories */}
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dashboardCategories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
        />

        {/* Promos Carousel (Kept static as per user request) */}
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.promoCarousel}>
          {PROMOS.map((promo, index) => (
             <ImageBackground key={promo.id} source={{ uri: promo.image }} style={styles.promoCard} imageStyle={{borderRadius: 16}}>
               <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.promoOverlay}>
                 <Text style={styles.promoTitle}>{promo.title}</Text>
                 <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                 <TouchableOpacity style={styles.promoButton} onPress={() => setMembershipModalVisible(true)}>
                   <Text style={styles.promoButtonText}>BOOK NOW</Text>
                 </TouchableOpacity>
                 <View style={styles.pagination}>
                    {PROMOS.map((_, i) => (
                      <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
                    ))}
                 </View>
               </LinearGradient>
             </ImageBackground>
          ))}
        </ScrollView>

        {/* Top Offerings */}
        {feed?.top_offerings?.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOP OFFERINGS FOR YOU</Text>
              <Icon name="arrow-forward-circle" size={28} color="#555" />
            </View>
            <FlatList 
              horizontal
              showsHorizontalScrollIndicator={false}
              data={feed.top_offerings}
              renderItem={renderOffering}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.offeringsList}
            />
          </>
        )}

        {/* Discover Fitness Near You */}
        <View style={styles.discoverSection}>
          <Text style={styles.discoverBold}>Discover</Text>
          <Text style={styles.discoverThin}>Partners Near You</Text>
          <Text style={styles.partnersText}>100+ Partners In Bangalore</Text>
        </View>

        {/* Centers Near You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PARTNERS NEAR <Text style={{textDecorationLine: 'underline'}}>YOU</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('DiscoverProvidersMap')}>
            <Icon name="arrow-forward-circle" size={28} color="#555" />
          </TouchableOpacity>
        </View>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={feed?.nearby_providers || []}
          renderItem={renderProvider}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.providersList}
          ListEmptyComponent={loading ? null : <Text style={{color: '#888', marginLeft: 16}}>No partners found nearby</Text>}
        />

        {/* Trending Partners */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRENDING PARTNERS</Text>
          <Icon name="arrow-forward-circle" size={28} color="#555" />
        </View>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={feed?.trending_providers || []}
          renderItem={renderProvider}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.providersList}
          ListEmptyComponent={loading ? null : <Text style={{color: '#888', marginLeft: 16}}>No trending partners found for this category</Text>}
        />
        
        {/* Spacer for bottom banner */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pro Membership Banner */}
      <View style={styles.proBannerContainer}>
        <LinearGradient 
          colors={['#b8746c', '#d3a59d', '#9c5b54']} 
          start={{x: 0, y: 0}} end={{x: 1, y: 1}}
          style={styles.proBanner}
        >
          <Icon name="medal" size={40} color="#331a1a" style={styles.proIcon} />
          <View style={styles.proTextContainer}>
            <Text style={styles.proTitle}>Pro Membership</Text>
            <Text style={styles.proSubtitle}>Get extra 10% off on all bookings</Text>
          </View>
          <TouchableOpacity style={styles.joinBtn} onPress={() => setMembershipModalVisible(true)}>
            <Text style={styles.joinBtnText}>Join Now</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <MembershipPlanModal 
        visible={isMembershipModalVisible} 
        onClose={() => setMembershipModalVisible(false)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '400',
  },
  profilePic: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profilePicPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  categoriesList: {
    paddingHorizontal: 20,
    marginBottom: 25,
    height: 36,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 10,
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
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  promoCarousel: {
    marginBottom: 30,
  },
  promoCard: {
    width: 350,
    height: 200,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  promoTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  promoSubtitle: {
    color: '#ddd',
    fontSize: 16,
    marginBottom: 20,
  },
  promoButton: {
    backgroundColor: '#d35446',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  promoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#e74c3c',
    width: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  offeringsList: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  offeringCard: {
    width: 160,
    marginRight: 15,
  },
  offeringImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  offeringImageStyle: {
    borderRadius: 12,
  },
  offeringOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  discountText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  offeringDetails: {},
  offeringTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  offeringMeta: {
    color: '#888',
    fontSize: 10,
    marginBottom: 6,
  },
  offeringPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offeringPrice: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  offeringOriginalPrice: {
    color: '#555',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discoverSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  discoverBold: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  discoverThin: {
    color: '#888',
    fontSize: 36,
    fontWeight: '200',
    marginBottom: 10,
  },
  partnersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  providersList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  providerCard: {
    width: 160,
    marginRight: 15,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  providerImage: {
    width: '100%',
    height: 120,
    marginBottom: 10,
  },
  providerImageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  providerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  popularBadge: {
    backgroundColor: '#e74c3c',
  },
  newBadge: {
    backgroundColor: '#2ecc71',
  },
  partnerBadge: {
    backgroundColor: '#3498db',
  },
  recommendedBadge: {
    backgroundColor: '#9b59b6',
  },
  discountBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
  },
  providerDetails: {
    paddingHorizontal: 12,
  },
  providerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerDistance: {
    color: '#888',
    fontSize: 10,
    marginBottom: 6,
  },
  providerPrice: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  proBannerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 0,
    left: 20,
    right: 20,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  proIcon: {
    marginRight: 15,
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  proSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  joinBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSub: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  modalBtn: {
    backgroundColor: '#e74c3c',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
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

export default HomeDashboard;
