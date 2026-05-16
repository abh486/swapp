import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
import { getProviderDetails } from '../../../redux/actions/providersActions';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';

const { width } = Dimensions.get('window');

// Map backend amenity tags to icons
const getAmenityIcon = (label) => {
  const map = {
    'Air Conditioning': 'snow-outline',
    'AC': 'snow-outline',
    'Locker Rooms': 'cube-outline',
    'Shower': 'water-outline',
    'Showers': 'water-outline',
    'Parking': 'car-outline',
    'Wi-Fi': 'wifi-outline',
    'Steam Room': 'thermometer-outline',
    'Nutrition Bar': 'pint-outline',
    'Towel Service': 'layers-outline',
    'Cafe': 'cafe-outline',
    'Cafeteria': 'cafe-outline',
    'Pool': 'water-outline',
    'Sauna': 'flame-outline',
    'Robes & Slippers': 'shirt-outline',
  };
  return map[label] || 'checkmark-circle-outline';
};

const getFacilityIcon = (label) => {
  const map = {
    'Indoor Court': 'basketball-outline',
    'Floodlights': 'sunny-outline',
    'Free Weights': 'barbell-outline',
    'Cardio Machines': 'bicycle-outline',
    'Functional Area': 'body-outline',
    'Therapy Rooms': 'medical-outline',
    'Relaxation Lounge': 'leaf-outline',
    'Treadmills': 'walk-outline',
    'Squat Racks': 'barbell-outline',
  };
  return map[label] || 'construct-outline';
};

const ProviderDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const dispatch = useDispatch();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isViewerVisible, setViewerVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await dispatch(getProviderDetails(id));
      if (response && response.success) {
        setProvider(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch partner details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('[ProviderDetail] Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, dispatch, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  if (!provider) return null;

  const renderHeaderGallery = () => (
    <View style={styles.galleryContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={28} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setViewerVisible(true)}
      >
        <Image 
          source={{ uri: (provider.photos || [])[selectedPhotoIndex] || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800' }} 
          style={styles.mainImage} 
        />
        <View style={styles.zoomIndicator}>
          <Icon name="expand-outline" size={20} color="#fff" />
        </View>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}>
        {(provider.photos || []).map((photo, i) => (
          <TouchableOpacity 
            key={i} 
            onPress={() => setSelectedPhotoIndex(i)}
            style={[styles.thumbnailWrapper, selectedPhotoIndex === i && styles.activeThumbnailWrapper]}
          >
            <Image 
              source={{ uri: photo }} 
              style={styles.thumbnailImage} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Full Screen Image Viewer */}
      <Modal visible={isViewerVisible} transparent={true} animationType="fade">
        <View style={styles.viewerOverlay}>
          <TouchableOpacity 
            style={styles.closeViewerBtn}
            onPress={() => setViewerVisible(false)}
          >
            <Icon name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: (provider.photos || [])[selectedPhotoIndex] }} 
            style={styles.viewerImage} 
            resizeMode="contain"
          />
          
          <View style={styles.viewerFooter}>
            <Text style={styles.viewerText}>
              Photo {selectedPhotoIndex + 1} of {provider.photos?.length}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderTitleBlock = () => {
    const verticalLabel = Array.isArray(provider.vertical) ? provider.vertical[0] : (provider.vertical || 'Fitness');
    const isVerified = provider.status === 'APPROVED' || provider.status === 'approved' || provider.isSwappPartner;

    return (
      <View style={styles.titleBlockContainer}>
        {provider.badges?.is_swapp_partner && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Swapp Partner</Text>
          </View>
        )}
        <View style={styles.titleRow}>
          <Text style={styles.gymTitle}>{provider.name}</Text>
          {isVerified && <Icon name="checkmark-circle" size={18} color="#4d94ff" style={styles.verifiedIcon} />}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingScore}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
            {provider.rating > 0 && <Icon name="star" size={16} color="#FFD700" style={styles.starIcon} />}
          </View>
        </View>
        <View style={styles.subtitleRow}>
          <Text style={styles.gymSubtitle}>{verticalLabel} • {provider.distance ? `${provider.distance.toFixed(1)} km away` : 'Nearby'}</Text>
          <Text style={styles.reviewsText}>({provider.review?.length || 0})</Text>
        </View>
        <View style={styles.hoursRow}>
          <Text style={styles.openNowText}>Open now</Text>
          <Text style={styles.closesText}> • Closes at {provider.closeTime || '11:00 PM'}</Text>
          <Icon name="chevron-down" size={14} color="#888" style={styles.chevronIcon} />
        </View>
      </View>
    );
  };

  const renderActionBar = () => (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`tel:${provider.providerManager?.mobile || ''}`)}>
        <Icon name="call-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Call</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(provider.locationLink)}>
        <Icon name="navigate-outline" size={24} color="#ccc" />
        <Text style={styles.actionText}>Directions</Text>
      </TouchableOpacity>
      {provider.website && (
        <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(provider.website)}>
          <Icon name="globe-outline" size={24} color="#ccc" />
          <Text style={styles.actionText}>Website</Text>
        </TouchableOpacity>
      )}
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
          <Text style={styles.proBannerTitle}>Swapp Gold</Text>
          <Text style={styles.proBannerSubtitle}>Access {provider.name} and hundreds of other top-tier partners.</Text>
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

  const getDynamicAbout = () => {
    if (provider.description && provider.description.length > 10) return provider.description;
    
    const vertical = Array.isArray(provider.vertical) ? provider.vertical[0] : (provider.vertical || 'Fitness');
    const type = vertical.toLowerCase().replace('_', ' ');
    const addressStr = provider.address ? ` at ${provider.address}` : '';
    const facilityCount = provider.facilities?.length || 0;
    const facilityInfo = facilityCount > 0 ? ` featuring ${facilityCount} specialized amenities` : '';
    
    return `${provider.name} is a top-rated ${type} provider${addressStr}${facilityInfo}. Experience professional service and high-quality equipment designed to help you reach your peak potential.`;
  };

  const renderOverview = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>About {provider.name}</Text>
      <Text style={styles.aboutText}>
        {getDynamicAbout()}
      </Text>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Amenities</Text>
      <View style={styles.amenitiesGrid}>
        {(provider.amenity_tags || []).map((label, index) => (
          <View key={index} style={styles.amenityBox}>
            <Icon name={getAmenityIcon(label)} size={24} color="#aaa" />
            <Text style={styles.amenityLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Facilities & Equipment</Text>
      </View>
      <View style={styles.amenitiesGrid}>
        {(provider.facilities || []).map((item, index) => {
          const isObject = typeof item === 'object' && item !== null;
          const title = isObject ? (item.title || item.name) : item;
          
          return (
            <View key={index} style={styles.amenityBox}>
              <Icon name={getFacilityIcon(title)} size={24} color="#aaa" />
              <Text style={styles.amenityLabel}>{title}</Text>
            </View>
          );
        })}
        {(!provider.facilities || provider.facilities.length === 0) && (
          <Text style={{color: '#666', fontSize: 12, marginLeft: 0}}>Facilities list not available.</Text>
        )}
      </View>
    </View>
  );

  const renderPlans = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Membership Plans</Text>
      {(provider.packages || []).map((plan) => (
        <TouchableOpacity 
          key={plan.id} 
          style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlanCard]}
          onPress={() => setSelectedPlan(plan)}
          activeOpacity={0.8}
        >
          <View style={styles.planCardLeft}>
             <View style={[styles.planImagePlaceholder, { backgroundColor: plan.imageUrl ? 'transparent' : '#fff' }]}>
               {plan.imageUrl && <Image source={{ uri: plan.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />}
             </View>
          </View>
          <View style={styles.planCardRight}>
            <View style={styles.planCardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Text style={[styles.planTitle, { color: '#fff' }]}>{plan.name}</Text>
                {plan.is_popular && (
                  <View style={styles.planBadge}>
                    <Text style={styles.planBadgeText}>Popular</Text>
                  </View>
                )}
              </View>
              <Text style={styles.planPrice}>₹{plan.basePrice}<Text style={styles.planPriceMonth}>/{plan.billingCycle?.toLowerCase().replace('ly', '') || 'month'}</Text></Text>
            </View>
            <Text style={styles.planSubtitle}>{plan.description || 'All Access'}</Text>
            <View style={styles.planFeatures}>
              {(plan.features || []).map((feat, idx) => (
                <View key={idx} style={styles.planFeatureRow}>
                  <Icon name="chevron-forward" size={12} color="#fff" />
                  <Text style={styles.planFeatureText}>{feat}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity 
              style={styles.choosePlanBtn} 
              onPress={() => setSelectedPlan(plan)}
            >
              <Text style={styles.choosePlanText}>Choose Plan</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      {(provider.packages?.length === 0 || !provider.packages) && (
        <Text style={{color: '#666', textAlign: 'center'}}>No plans available at the moment.</Text>
      )}
    </View>
  );

  const renderTrainers = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Trainers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trainersScroll}>
        {(provider.trainers || []).map((trainer) => (
          <View key={trainer.id} style={styles.trainerCard}>
            <View style={styles.trainerImageContainer}>
               <Image source={{ uri: trainer.profilePhoto || 'https://via.placeholder.com/150' }} style={styles.trainerImage} />
            </View>
            <Text style={styles.trainerName}>{trainer.name || 'Professional'}</Text>
            <Text style={styles.trainerExp}>{trainer.experienceYears}+ Yrs Exp</Text>
            <Text style={styles.trainerCategory}>{Array.isArray(trainer.specialties) ? trainer.specialties[0] : (trainer.specialties || 'Trainer')}</Text>
            <View style={styles.trainerRatingRow}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.trainerRating}>{trainer.rating?.toFixed(1) || '4.8'}({trainer.reviewCount || 0})</Text>
            </View>
          </View>
        ))}
        {(provider.trainers?.length === 0 || !provider.trainers) && (
          <Text style={{color: '#666', fontSize: 12}}>No trainers listed for this location.</Text>
        )}
      </ScrollView>
    </View>
  );

  const renderReviews = () => {
    const reviews = provider.review || [];
    const avgRating = provider.rating || 4.5;
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.reviewHeaderRow}>
          <View style={styles.reviewScoreBlock}>
            <Text style={styles.reviewScoreMain}>{avgRating}<Icon name="star" size={24} color="#FFD700" /></Text>
            <Text style={styles.reviewCount}>({reviews.length} Reviews)</Text>
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

        {reviews.map((rev, idx) => (
          <View key={rev.id || idx} style={[styles.reviewCard, { marginBottom: 15 }]}>
            <View style={styles.reviewCardHeader}>
              <Image source={{ uri: rev.user?.userProfile?.profilePhoto || 'https://via.placeholder.com/100' }} style={styles.reviewerAvatar} />
              <View style={styles.reviewerInfo}>
                <Text style={styles.reviewerName}>{rev.user?.userProfile?.name || 'Swapp User'} <Text style={styles.verifiedMemberText}>Verified Member</Text></Text>
                <View style={styles.reviewCardStars}>
                  {[1,2,3,4,5].map(i => <Icon key={i} name="star" size={10} color={i <= rev.rating ? "#FFD700" : "#444"} />)}
                  <Text style={styles.reviewCardScore}>{rev.rating?.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.reviewCardText}>
              {rev.content}
            </Text>
            <View style={styles.reviewCardFooter}>
              <Icon name="thumbs-up-outline" size={14} color="#b873f0" />
              <Text style={styles.helpfulText}>Helpful</Text>
            </View>
          </View>
        ))}
        {reviews.length === 0 && (
          <Text style={{color: '#666', textAlign: 'center'}}>No reviews yet. Be the first to review!</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {renderHeaderGallery()}
        {renderTitleBlock()}
        {renderActionBar()}
        {provider.isSwappPartner && renderProBanner()}
        {renderTabs()}
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'Plans' && renderPlans()}
        {activeTab === 'Trainers' && renderTrainers()}
        {activeTab === 'Reviews' && renderReviews()}
      </ScrollView>

      <View style={styles.stickyFooterContainer}>
        <LinearGradient
          colors={['#6d3a32', '#ba6b5c', '#6d3a32']}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          style={styles.stickyFooter}
        >
          <View>
            <Text style={styles.footerPrice}>
              ₹{selectedPlan ? selectedPlan.basePrice : (provider.lowest_price || 'N/A')}
            </Text>
            <Text style={styles.footerPlanName}>
              {selectedPlan ? selectedPlan.name : 'Select a plan'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.footerChooseBtn, selectedPlan && styles.footerSubscribeBtn]} 
            onPress={() => {
              if (selectedPlan) {
                dispatch(createCheckoutSession(selectedPlan.id, 'PARTNER_PACKAGE'));
              } else {
                setActiveTab('Plans');
              }
            }}
          >
            <Text style={styles.footerChooseText}>
              {selectedPlan ? 'Subscribe Now' : 'Choose Plan'}
            </Text>
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
  thumbnailScroll: { flexDirection: 'row', marginTop: 5, paddingHorizontal: 15 },
  thumbnailWrapper: { marginRight: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  activeThumbnailWrapper: { borderColor: '#e74c3c' },
  thumbnailImage: { width: 70, height: 70, resizeMode: 'cover' },
  zoomIndicator: { position: 'absolute', bottom: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  
  viewerOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeViewerBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  viewerImage: { width: '100%', height: '80%' },
  viewerFooter: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  viewerText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  
  titleBlockContainer: { paddingHorizontal: 20, marginBottom: 20 },
  premiumBadge: { backgroundColor: '#FFD700', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  premiumText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gymTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', flex: 1 },
  verifiedIcon: { marginLeft: 8, marginTop: 2 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
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
  
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  amenityBox: { width: '23%', aspectRatio: 1, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10, marginRight: '2%', padding: 5 },
  amenityLabel: { color: '#666', fontSize: 8, textAlign: 'center', marginTop: 8 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },

  planCard: { flexDirection: 'row', backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15, marginBottom: 15 },
  selectedPlanCard: { borderColor: '#FF7369', backgroundColor: 'rgba(255, 115, 105, 0.05)' },
  planCardLeft: { width: 50, marginRight: 15 },
  planImagePlaceholder: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 8 },
  planCardRight: { flex: 1 },
  planCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  planTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  planBadge: { backgroundColor: '#4d94ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  planBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  planPrice: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  planPriceMonth: { fontSize: 10, color: '#aaa', fontWeight: 'normal' },
  planSubtitle: { color: '#fff', fontSize: 12, marginBottom: 10 },
  planFeatures: { marginBottom: 15 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  planFeatureText: { color: '#ddd', fontSize: 12, marginLeft: 8 },
  choosePlanBtn: { backgroundColor: '#FF7369', paddingVertical: 10, borderRadius: 8, alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 20 },
  choosePlanText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  trainersScroll: { flexDirection: 'row' },
  trainerCard: { width: 140, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 15, marginRight: 15, alignItems: 'flex-start' },
  trainerImageContainer: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#2ecc71', marginBottom: 10, alignSelf: 'center', overflow: 'hidden' },
  trainerImage: { width: '100%', height: '100%' },
  trainerName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  trainerExp: { color: '#4d94ff', fontSize: 10, marginBottom: 4 },
  trainerCategory: { color: '#fff', fontSize: 10, marginBottom: 6 },
  trainerRatingRow: { flexDirection: 'row', alignItems: 'center' },
  trainerRating: { color: '#fff', fontSize: 10, marginLeft: 4 },

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
  footerPlanName: { color: '#ddd', fontSize: 10, fontWeight: '500' },
  footerChooseBtn: { backgroundColor: 'transparent', paddingVertical: 10, paddingHorizontal: 20 },
  footerSubscribeBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  footerChooseText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

export default ProviderDetailScreen;
