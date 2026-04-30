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
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../../context/AuthContext';
import { useLocationManager } from '../../../hooks/useLocationManager';
import { useGymData } from '../../../hooks/useGymData';
import MembershipPlanModal from './MembershipPlanModal';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'train', label: 'Train', icon: 'barbell' },
  { id: 'combat', label: 'Combat', icon: 'medical' }, // Mock icons
  { id: 'mind_body', label: 'Mind & Body', icon: 'body' },
  { id: 'recovery', label: 'Recovery', icon: 'medkit' }
];

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

const TOP_OFFERINGS = [
  {
    id: '1',
    title: 'Boxing Training',
    duration: '50 mins',
    level: 'Beginner',
    price: '₹700',
    originalPrice: '₹999',
    discount: '25% OFF',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1374&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Strength Training',
    duration: '60 mins',
    level: 'All Levels',
    price: '₹699',
    originalPrice: '₹899',
    discount: '25% OFF',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'MMA Workout',
    duration: '60 mins',
    level: 'Intermediate',
    price: '₹749',
    originalPrice: '₹999',
    discount: '20% OFF',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1470&auto=format&fit=crop'
  }
];

export const HomeDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMembershipModalVisible, setMembershipModalVisible] = useState(false);
  
  const { userLocation, permissionGranted } = useLocationManager();
  const { gyms, isLoading: areGymsLoading } = useGymData(userLocation, permissionGranted);

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

  const renderOffering = ({ item }) => (
    <View style={styles.offeringCard}>
      <ImageBackground source={{ uri: item.image }} style={styles.offeringImage} imageStyle={styles.offeringImageStyle}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.offeringOverlay} />
      </ImageBackground>
      <View style={styles.offeringDetails}>
        <Text style={styles.offeringTitle}>{item.title}</Text>
        <Text style={styles.offeringMeta}>{item.duration} • {item.level}</Text>
        <View style={styles.offeringPriceRow}>
          <Text style={styles.offeringPrice}>{item.price}</Text>
          <Text style={styles.offeringOriginalPrice}>{item.originalPrice}</Text>
        </View>
      </View>
    </View>
  );

  const renderGym = ({ item: gym }) => {
    if (!gym) return null;
    const distanceValue = typeof gym.distance === 'number' ? gym.distance.toFixed(1) : null;
    const distanceText = distanceValue ? `Downtown District • ${distanceValue} miles` : 'Downtown District';

    return (
      <View style={styles.gymCard}>
        <ImageBackground source={{ uri: gym.photos?.[0] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400' }} style={styles.gymImage} imageStyle={styles.gymImageStyle}>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gymOverlay} />
        </ImageBackground>
        <View style={styles.gymDetails}>
          <View style={styles.gymHeaderRow}>
             <Text style={styles.gymName} numberOfLines={1}>{gym.name || 'Fit7'}</Text>
             <Text style={styles.gymPrice}>1049/mo*</Text>
          </View>
          <Text style={styles.gymDistance}>{distanceText}</Text>
          <View style={styles.gymActions}>
            <TouchableOpacity style={styles.gymBtnOutline}><Text style={styles.gymBtnOutlineText}>TRY FOR FREE</Text></TouchableOpacity>
            <View style={styles.gymBtnDivider} />
            <TouchableOpacity style={styles.gymBtnSolid} onPress={() => setMembershipModalVisible(true)}>
              <Text style={styles.gymBtnSolidText}>JOIN NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome {user?.firstName || 'Stephen'} !</Text>
          <Image 
            source={{ uri: user?.profileImage || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
            style={styles.profilePic} 
          />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search gyms, trainers, classes..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
        />

        {/* Promos Carousel */}
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP OFFERINGS FOR YOU</Text>
          <Icon name="arrow-forward-circle" size={28} color="#555" />
        </View>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TOP_OFFERINGS}
          renderItem={renderOffering}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.offeringsList}
        />

        {/* Discover Fitness Near You */}
        <View style={styles.discoverSection}>
          <Text style={styles.discoverBold}>Discover</Text>
          <Text style={styles.discoverThin}>Fitness Near You</Text>
          <Text style={styles.partnersText}>100+ Partners In Bangalore</Text>
        </View>

        {/* Centers Near You */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CENTERS NEAR <Text style={{textDecorationLine: 'underline'}}>YOU</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('DiscoverGymsMap')}>
            <Icon name="arrow-forward-circle" size={28} color="#555" />
          </TouchableOpacity>
        </View>
        <FlatList 
          horizontal
          showsHorizontalScrollIndicator={false}
          data={gyms?.slice(0, 5) || []}
          renderItem={renderGym}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gymsList}
          ListEmptyComponent={<Text style={{color: '#888', marginLeft: 16}}>Loading centers...</Text>}
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
  gymsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gymCard: {
    width: 240,
    backgroundColor: '#111',
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gymImage: {
    width: '100%',
    height: 120,
  },
  gymImageStyle: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gymOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gymDetails: {
    padding: 12,
  },
  gymHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gymName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  gymPrice: {
    color: '#aaa',
    fontSize: 10,
  },
  gymDistance: {
    color: '#666',
    fontSize: 10,
    marginBottom: 15,
  },
  gymActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  gymBtnOutline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymBtnOutlineText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gymBtnDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  gymBtnSolid: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymBtnSolidText: {
    color: '#fff',
    fontSize: 10,
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
});

export default HomeDashboard;
