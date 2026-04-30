import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const AMENITIES = [
  { id: '1', label: 'Air Conditioning', icon: 'snow-outline' },
  { id: '2', label: 'Locker Rooms', icon: 'cube-outline' },
  { id: '3', label: 'Shower', icon: 'water-outline' },
  { id: '4', label: 'Parking', icon: 'car-outline' },
  { id: '5', label: 'Wi-Fi', icon: 'wifi-outline' },
  { id: '6', label: 'Steam Room', icon: 'thermometer-outline' },
  { id: '7', label: 'Nutrition Bar', icon: 'pint-outline' },
  { id: '8', label: 'Towel Service', icon: 'layers-outline' },
];

const FACILITIES = [
  { id: '1', title: 'Cardio Zone', image: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400' },
  { id: '2', title: 'Strength Area', image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400' },
  { id: '3', title: 'Free Weights', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400' },
  { id: '4', title: 'Functional Zone', image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400' },
];

const TRAINERS = [
  { id: '1', name: 'Rohit Sharma', exp: '5+Yrs Exp', category: 'Strength Training', rating: '4.9(98)', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '2', name: 'Ananya Reddy', exp: '4+Yrs Exp', category: 'Yoga & Mobility', rating: '4.9(68)', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '3', name: 'Vikram Singh', exp: '6+Yrs Exp', category: 'Bodybuilding', rating: '4.8(118)', image: 'https://randomuser.me/api/portraits/men/46.jpg' },
];

const MEMBERSHIP_PLANS = [
  {
    id: 'elite',
    title: 'ELITE PLAN',
    price: '₹1499',
    subtitle: 'All Access -Unlimited',
    features: ['Unlimited Visits', 'All Group Classes', 'Personal Training', 'Freeze Anytime'],
    titleColor: '#b873f0'
  },
  {
    id: 'pro',
    title: 'PRO PLAN',
    price: '₹999',
    subtitle: 'All Access .Premium',
    features: ['30 Visits/Month', 'All Group Classes', '2 PT Sessions/Month', 'Freeze Anytime'],
    titleColor: '#4d94ff',
    badge: 'Most Popular'
  },
  {
    id: 'basic',
    title: 'BASIC PLAN',
    price: '₹599',
    subtitle: 'Essentials',
    features: ['12 Visits/Month', 'Gym Access', 'Standard Equipment', 'Freeze Anytime'],
    titleColor: '#fff'
  }
];

const GymDetailScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderHeaderGallery = () => (
    <View style={styles.galleryContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
      <Image 
        source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }} 
        style={styles.mainImage} 
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
        {[1, 2, 3, 4].map((i) => (
          <Image 
            key={i} 
            source={{ uri: `https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&sig=${i}` }} 
            style={styles.thumbnailImage} 
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderTitleBlock = () => (
    <View style={styles.titleBlockContainer}>
      <View style={styles.premiumBadge}>
        <Text style={styles.premiumText}>Premium</Text>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.gymTitle}>Cult Koramangala</Text>
        <Icon name="checkmark-circle" size={18} color="#4d94ff" style={styles.verifiedIcon} />
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingScore}>4.6</Text>
          <Icon name="star" size={16} color="#FFD700" style={styles.starIcon} />
        </View>
      </View>
      <View style={styles.subtitleRow}>
        <Text style={styles.gymSubtitle}>Gym • 0.8 km away</Text>
        <Text style={styles.reviewsText}>(120)</Text>
      </View>
      <View style={styles.hoursRow}>
        <Text style={styles.openNowText}>Open now</Text>
        <Text style={styles.closesText}> • Closes at 11:00 PM</Text>
        <Icon name="chevron-down" size={14} color="#888" style={styles.chevronIcon} />
      </View>
    </View>
  );

  const renderActionBar = () => (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton}>
        <Icon name="call-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Icon name="navigate-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Directions</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Icon name="globe-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Website</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <Icon name="qr-code-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Check-in</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProBanner = () => (
    <LinearGradient 
      colors={['#8b4a40', '#d89b91', '#8b4a40']} 
      start={{x: 0, y: 0}} end={{x: 1, y: 0}}
      style={styles.proBanner}
    >
      <View style={styles.proBannerContent}>
        <Icon name="medal" size={36} color="#000" style={styles.proBannerIcon} />
        <View style={styles.proBannerTextContainer}>
          <Text style={styles.proBannerTitle}>Pro Membership</Text>
          <Text style={styles.proBannerSubtitle}>Get extra 10% off on all bookings</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.proJoinBtn}>
        <Text style={styles.proJoinText}>Join Now</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['Overview', 'Plans', 'Trainers', 'Reviews'].map((tab) => (
        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>About Cult Koramangala</Text>
      <Text style={styles.aboutText}>
        A premium fitness center offering group classes, personal training and state-of-the-art equipment to help you reach your fitness goals.
        <Text style={styles.readMoreText}> Read more</Text>
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Amenities</Text>
      <View style={styles.amenitiesGrid}>
        {AMENITIES.map((item) => (
          <View key={item.id} style={styles.amenityBox}>
            <Icon name={item.icon} size={24} color="#aaa" />
            <Text style={styles.amenityLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Facilities & Equipment</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facilitiesScroll}>
        {FACILITIES.map((item) => (
          <View key={item.id} style={styles.facilityItem}>
            <Image source={{ uri: item.image }} style={styles.facilityImage} />
            <Text style={styles.facilityTitle}>{item.title}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderPlans = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Membership Plans</Text>
      {MEMBERSHIP_PLANS.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <View style={styles.planCardLeft}>
             <View style={styles.planImagePlaceholder} />
          </View>
          <View style={styles.planCardRight}>
            <View style={styles.planCardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.planTitle, { color: plan.titleColor }]}>{plan.title}</Text>
                {plan.badge && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>{plan.price}<Text style={styles.planPriceMonth}>/month</Text></Text>
            </View>
            <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
            <View style={styles.planFeatures}>
              {plan.features.map((feat, idx) => (
                <View key={idx} style={styles.planFeatureRow}>
                  <Icon name="chevron-forward" size={12} color="#fff" />
                  <Text style={styles.planFeatureText}>{feat}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.choosePlanBtn}>
              <Text style={styles.choosePlanText}>Choose Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTrainers = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Trainers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trainersScroll}>
        {TRAINERS.map((trainer) => (
          <View key={trainer.id} style={styles.trainerCard}>
            <View style={styles.trainerImageContainer}>
               <Image source={{ uri: trainer.image }} style={styles.trainerImage} />
            </View>
            <Text style={styles.trainerName}>{trainer.name}</Text>
            <Text style={styles.trainerExp}>{trainer.exp}</Text>
            <Text style={styles.trainerCategory}>{trainer.category}</Text>
            <View style={styles.trainerRatingRow}>
              <View style={styles.trainerRatingSquare} />
              <Text style={styles.trainerRating}>{trainer.rating}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderReviews = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.reviewHeaderRow}>
        <View style={styles.reviewScoreBlock}>
          <Text style={styles.reviewScoreMain}>4.6<Icon name="star" size={24} color="#FFD700" /></Text>
          <Text style={styles.reviewCount}>(120 Reviews)</Text>
        </View>
        <View style={styles.reviewBarsBlock}>
          {[
            { stars: 5, pct: '78%' },
            { stars: 4, pct: '15%' },
            { stars: 3, pct: '5%' },
            { stars: 2, pct: '1%' },
            { stars: 1, pct: '1%' },
          ].map(row => (
            <View key={row.stars} style={styles.reviewBarRow}>
              <Text style={styles.reviewBarStar}>{row.stars} <Icon name="star" size={8} color="#FFD700" /></Text>
              <View style={styles.reviewBarTrack}>
                <View style={[styles.reviewBarFill, { width: row.pct }]} />
              </View>
              <Text style={styles.reviewBarPct}>{row.pct}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.reviewCard}>
        <View style={styles.reviewCardHeader}>
          <Image source={{ uri: 'https://randomuser.me/api/portraits/men/75.jpg' }} style={styles.reviewerAvatar} />
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>Rahul Mehta <Text style={styles.verifiedMemberText}>Verified Member</Text></Text>
            <View style={styles.reviewCardStars}>
              {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={10} color="#FFD700" />)}
              <Text style={styles.reviewCardScore}>5.0</Text>
            </View>
          </View>
          <Text style={styles.reviewDate}>2 weeks ago</Text>
        </View>
        <Text style={styles.reviewCardText}>
          Amazing atmosphere, well-maintained equipment and trainers are super helpful!
        </Text>
        <View style={styles.reviewCardFooter}>
          <Icon name="thumbs-up-outline" size={14} color="#b873f0" />
          <Text style={styles.helpfulText}>Helpful (12)</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {renderHeaderGallery()}
        {renderTitleBlock()}
        {renderActionBar()}
        {renderProBanner()}
        {renderTabs()}
        {renderOverview()}
        {renderPlans()}
        {renderTrainers()}
        {renderReviews()}
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.stickyFooterContainer}>
        <LinearGradient
          colors={['#6d3a32', '#ba6b5c', '#6d3a32']}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          style={styles.stickyFooter}
        >
          <View>
            <Text style={styles.footerPrice}>₹799 /month</Text>
            <Text style={styles.footerGst}>+ GST extra</Text>
          </View>
          <TouchableOpacity style={styles.footerChooseBtn}>
            <Text style={styles.footerChooseText}>Choose Plan</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1 },
  galleryContainer: { marginBottom: 15 },
  backButton: { position: 'absolute', top: 15, left: 15, zIndex: 10, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  mainImage: { width: '100%', height: 250, resizeMode: 'cover' },
  thumbnailScroll: { flexDirection: 'row', marginTop: 2, paddingHorizontal: 2 },
  thumbnailImage: { width: (width / 4) - 4, height: 80, resizeMode: 'cover', marginHorizontal: 2 },
  
  titleBlockContainer: { paddingHorizontal: 20, marginBottom: 20 },
  premiumBadge: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  premiumText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gymTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  verifiedIcon: { marginLeft: 8, marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginRight: 4 },
  starIcon: { marginTop: -2 },
  subtitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  gymSubtitle: { color: '#aaa', fontSize: 14 },
  reviewsText: { color: '#666', fontSize: 12 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  openNowText: { color: '#2ecc71', fontSize: 14, fontWeight: '500' },
  closesText: { color: '#aaa', fontSize: 14 },
  chevronIcon: { marginLeft: 5, marginTop: 2 },
  
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#222', marginBottom: 20 },
  actionButton: { alignItems: 'center', flex: 1 },
  actionText: { color: '#aaa', fontSize: 12, marginTop: 5 },
  
  proBanner: { marginHorizontal: 20, borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  proBannerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  proBannerIcon: { marginRight: 15 },
  proBannerTextContainer: { flex: 1 },
  proBannerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  proBannerSubtitle: { color: '#fff', fontSize: 12, opacity: 0.9 },
  proJoinBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  proJoinText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tabItem: { marginRight: 30 },
  tabText: { color: '#666', fontSize: 16, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 35 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  aboutText: { color: '#aaa', fontSize: 14, lineHeight: 22 },
  readMoreText: { color: '#e74c3c' },
  
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  amenityBox: { width: '23%', aspectRatio: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10, padding: 5 },
  amenityLabel: { color: '#666', fontSize: 9, textAlign: 'center', marginTop: 8 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  seeAllText: { color: '#e74c3c', fontSize: 14 },
  facilitiesScroll: { flexDirection: 'row' },
  facilityItem: { marginRight: 15, width: 100 },
  facilityImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 8 },
  facilityTitle: { color: '#fff', fontSize: 12, textAlign: 'center' },

  planCard: { flexDirection: 'row', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15, marginBottom: 15 },
  planCardLeft: { width: 50, marginRight: 15 },
  planImagePlaceholder: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8 },
  planCardRight: { flex: 1 },
  planCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  planTitle: { fontSize: 16, fontWeight: 'bold' },
  planBadge: { backgroundColor: '#4d94ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  planBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  planPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  planPriceMonth: { fontSize: 10, color: '#aaa', fontWeight: 'normal' },
  planSubtitle: { color: '#fff', fontSize: 12, marginBottom: 10 },
  planFeatures: { marginBottom: 15 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  planFeatureText: { color: '#ddd', fontSize: 12, marginLeft: 8 },
  choosePlanBtn: { backgroundColor: '#FF7369', paddingVertical: 10, borderRadius: 8, alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 20 },
  choosePlanText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  trainersScroll: { flexDirection: 'row' },
  trainerCard: { width: 140, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15, marginRight: 15, alignItems: 'flex-start' },
  trainerImageContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#2ecc71', marginBottom: 10, alignSelf: 'center', overflow: 'hidden' },
  trainerImage: { width: '100%', height: '100%' },
  trainerName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  trainerExp: { color: '#4d94ff', fontSize: 10, marginBottom: 4 },
  trainerCategory: { color: '#fff', fontSize: 10, marginBottom: 6 },
  trainerRatingRow: { flexDirection: 'row', alignItems: 'center' },
  trainerRatingSquare: { width: 8, height: 8, backgroundColor: '#fff', marginRight: 4 },
  trainerRating: { color: '#fff', fontSize: 10 },

  reviewHeaderRow: { flexDirection: 'row', marginBottom: 30 },
  reviewScoreBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: '#222' },
  reviewScoreMain: { color: '#fff', fontSize: 48, fontWeight: 'bold' },
  reviewCount: { color: '#666', fontSize: 12, marginTop: 5 },
  reviewBarsBlock: { flex: 1.5, paddingLeft: 20, justifyContent: 'center' },
  reviewBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewBarStar: { color: '#aaa', fontSize: 10, width: 25 },
  reviewBarTrack: { flex: 1, height: 4, backgroundColor: '#222', borderRadius: 2, marginHorizontal: 10 },
  reviewBarFill: { height: '100%', backgroundColor: '#aaa', borderRadius: 2 },
  reviewBarPct: { color: '#aaa', fontSize: 10, width: 30, textAlign: 'right' },
  
  reviewCard: { backgroundColor: '#050505', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15 },
  reviewCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  reviewerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  reviewerInfo: { flex: 1 },
  reviewerName: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  verifiedMemberText: { color: '#2ecc71', fontSize: 9, fontWeight: 'normal' },
  reviewCardStars: { flexDirection: 'row', alignItems: 'center' },
  reviewCardScore: { color: '#fff', fontSize: 10, marginLeft: 5 },
  reviewDate: { color: '#666', fontSize: 10 },
  reviewCardText: { color: '#ddd', fontSize: 12, lineHeight: 18, marginBottom: 15 },
  reviewCardFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end' },
  helpfulText: { color: '#b873f0', fontSize: 10, marginLeft: 5 },

  stickyFooterContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 10, backgroundColor: 'rgba(0,0,0,0.8)' },
  stickyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12 },
  footerPrice: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footerGst: { color: '#ddd', fontSize: 10 },
  footerChooseBtn: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 20 },
  footerChooseText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default GymDetailScreen;
