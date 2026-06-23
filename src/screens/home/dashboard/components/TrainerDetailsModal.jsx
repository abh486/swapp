
// src/screens/community/components/TrainerDetailsModal.jsx
import { GlobalLoader } from '../../../../components/GlobalLoader';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Linking, Alert, TextInput, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../../../redux/actions/subscriptionActions';
import { getTrainerById, getTrainerProfileByTrainerId, startConversationWithTrainer } from '../../../../redux/actions/trainerActions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatScreen } from './ChatScreen';
import { getToken } from '../../../../api/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { useLocation } from '../../../../context/LocationContext';
import { Strings } from '../../../../config/config'; // Import Config
import * as Clarity from '../../../../utils/clarity';

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const { height: screenHeight } = Dimensions.get('window');

export const TrainerDetailsModal = ({ trainer, isVisible, isLoading, onClose, navigation }) => {
  const dispatch = useDispatch();
  const { userProfile, isAuthenticated } = useAuth();
  const { userLocation } = useLocation();
  const strings = Strings.TrainerDetailsModal;
  const alerts = Strings.TrainerDetailsModal.alerts;

  if (!trainer) {
    return null;
  }

  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [token, setToken] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [trainerDetails, setTrainerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const plans = useMemo(() => {
    if (trainerDetails && trainerDetails.plans) {
      return trainerDetails.plans;
    }
    return Array.isArray(trainer.plans) ? trainer.plans : [];
  }, [trainerDetails, trainer.plans]);

  const gallery = useMemo(() => Array.isArray(trainer.gallery) ? trainer.gallery : [], [trainer.gallery]);

  useEffect(() => {
    console.log('TrainerDetailsModal - Trainer data:', trainer);
    console.log('TrainerDetailsModal - TrainerDetails:', trainerDetails);
    console.log('TrainerDetailsModal - Plans:', plans);
    console.log('TrainerDetailsModal - Gallery:', gallery);
  }, [trainer, trainerDetails, plans, gallery]);

  useEffect(() => {
    if (isVisible && trainer && trainer.user && trainer.user.id) {
      fetchTrainerDetails();
    }
  }, [isVisible, trainer]);

  const fetchTrainerDetails = async () => {
    if (!trainer || !trainer.user || !trainer.user.id) return;

    setLoadingDetails(true);
    try {
      console.log('TrainerDetailsModal - Fetching full trainer details for user ID:', trainer.user.id);
      const details = await dispatch(getTrainerById(trainer.user.id));
      console.log('TrainerDetailsModal - Fetched trainer details:', details);
      setTrainerDetails(details);
    } catch (error) {
      console.error('TrainerDetailsModal - Error fetching trainer details:', error);
      if (trainer.id) {
        try {
          console.log('TrainerDetailsModal - Trying to fetch by trainer ID:', trainer.id);
          const details = await dispatch(getTrainerProfileByTrainerId(trainer.id));
          console.log('TrainerDetailsModal - Fetched trainer details by trainer ID:', details);
          setTrainerDetails(details);
        } catch (error2) {
          console.error('TrainerDetailsModal - Error fetching trainer details by trainer ID:', error2);
        }
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const isSubscribedToThisTrainer = useMemo(() => {
    if (!userProfile?.subscriptions || !plans || plans.length === 0) {
      console.log('TrainerDetailsModal - No subscriptions or plans available');
      return false;
    }

    const trainerPlanIds = new Set(plans.map(p => p.id));
    console.log('TrainerDetailsModal - Available plan IDs:', Array.from(trainerPlanIds));
    console.log('TrainerDetailsModal - User subscriptions:', userProfile.subscriptions);

    const hasActiveSubscription = userProfile.subscriptions.some(sub => {
      console.log('TrainerDetailsModal - Checking subscription:', sub);
      return sub.trainerPlanId && trainerPlanIds.has(sub.trainerPlanId);
    });

    console.log('TrainerDetailsModal - Is subscribed to this trainer:', hasActiveSubscription);
    return hasActiveSubscription;
  }, [userProfile?.subscriptions, plans]);

  useEffect(() => {
    const getTokenFromStorage = async () => {
      try {
        const userToken = await getToken();
        console.log('TrainerDetailsModal - Token retrieved:', userToken ? 'Token found' : 'No token found');
        setToken(userToken);
      } catch (error) {
        console.error('TrainerDetailsModal - Error getting token:', error);
      }
    };

    getTokenFromStorage();
  }, []);

  const handleSubscribePress = async (plan) => {
    console.log('TrainerDetailsModal - Subscribe button pressed for plan:', plan.id);
    setError('');
    setSubscribingPlanId(plan.id);
    console.log('[Clarity] Subscription clicked');
    try {
      Clarity.sendCustomEvent('subscription_clicked');
      Clarity.setCustomTag('clicked_plan', plan ? plan.name : 'Trainer Plan');
    } catch (e) {
      console.error('[Clarity] Failed to send subscription_clicked:', e);
    }
    try {
      const response = await dispatch(createCheckoutSession(plan.id, 'TRAINER'));
      if (response.success && response.data.checkoutUrl) {
        navigation.navigate('CheckoutWebView', {
          url: response.data.checkoutUrl,
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
        });
        onClose();
      } else {
        throw new Error(response.message || alerts.subscribeError);
      }
    } catch (err) {
      console.error("TrainerDetailsModal - Subscription error:", err);
      setError(alerts.subscriptionError);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleChatPress = async () => {
    console.log('TrainerDetailsModal - Chat button pressed');
    console.log('TrainerDetailsModal - User state:', userProfile);
    console.log('TrainerDetailsModal - Token state:', token ? 'Token exists' : 'No token');
    console.log('TrainerDetailsModal - Is authenticated:', isAuthenticated);

    if (!isAuthenticated || !userProfile || !userProfile.id) {
      console.error('TrainerDetailsModal - User not authenticated');
      Alert.alert(
        alerts.authRequired,
        alerts.authMsg,
        [
          { text: alerts.logoutBtn, style: "cancel" },
          { text: strings.auth.loginBtn, onPress: () => navigation?.navigate('Login') }
        ]
      );
      return;
    }

    setIsCheckingAuth(true);

    try {
      let userToken = token;

      if (!userToken) {
        userToken = await getToken();
        console.log('TrainerDetailsModal - Retrieved token from storage:', userToken ? 'Token found' : 'Token NOT found');
        setToken(userToken);
      }

      if (!userToken) {
        console.error('TrainerDetailsModal - Authentication token not found');
        Alert.alert(
          alerts.sessionExpired,
          alerts.tokenNotFound,
          [
            { text: alerts.logoutBtn, style: "cancel" },
            { text: strings.auth.loginBtn, onPress: () => navigation?.navigate('Login') }
          ]
        );
        setIsCheckingAuth(false);
        return;
      }

      console.log('TrainerDetailsModal - Starting conversation with trainer:', trainer.user.id);

      try {
        const response = await dispatch(startConversationWithTrainer(trainer.user.id));
        console.log('TrainerDetailsModal - Conversation started:', response);
        setConversationId(response.id);
        setShowChat(true);
      } catch (err) {
        console.error("TrainerDetailsModal - Error starting conversation:", err);
        if (err.response?.status === 401) {
          await AsyncStorage.removeItem('accessToken');
          setToken(null);

          Alert.alert(
            alerts.sessionExpired,
            alerts.tokenExpired,
            [
              { text: alerts.logoutBtn, style: "cancel" },
              { text: strings.auth.loginBtn, onPress: () => navigation?.navigate('Login') }
            ]
          );
        } else {
          const errorMessage = err.response?.data?.message || err.message || alerts.conversationError;
          Alert.alert(alerts.genericError, errorMessage);
        }
      }
    } catch (err) {
      console.error("TrainerDetailsModal - Unexpected error:", err);
      Alert.alert(alerts.genericError, alerts.unexpectedError);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleBackToDetails = () => {
    setShowChat(false);
  };

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const closeImageViewer = () => {
    setShowImageViewer(false);
    setSelectedImageIndex(null);
  };

  if (showChat) {
    return (
      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.chatModalContainer}>
            <ChatScreen
              trainer={trainer}
              user={userProfile}
              onBack={handleBackToDetails}
              onClose={onClose}
              conversationId={conversationId}
              token={token}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheetContainer}>
          <View style={styles.heroImageSection}>
            <TouchableOpacity onPress={() => handleImagePress(0)}>
              <Image
                source={{
                  uri: gallery.length > 0
                    ? gallery[0]
                    : 'https://via.placeholder.com/150'
                }}
                style={styles.heroImage}
              />
            </TouchableOpacity>
            <View style={styles.heroImageGradient} />
          </View>

          <View style={styles.bottomSheetContent}>
            <TouchableOpacity style={styles.bottomSheetHandle} onPress={onClose}>
              <View style={styles.bottomSheetHandleBar} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {isLoading || loadingDetails ? (
                <GlobalLoader size={60} style={{ marginVertical: 60, alignSelf: 'center' }} />
              ) : (
                <View style={styles.content}>
                  <Text style={styles.trainerName}>
                    {trainerDetails?.name || trainer.name || trainer.user?.name || trainer.user?.email?.split('@')[0] || 'Trainer'}
                  </Text>

                  <View style={styles.tagsContainer}>
                    {strings.defaultTags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{strings.about}</Text>
                    <Text style={styles.bio}>{trainer.bio}</Text>
                    <Text style={styles.experience}>{trainer.experience || 0} {strings.yearsExp}</Text>

                    {/* Location & Service Mode Details */}
                    <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Icon name="navigate-outline" size={16} color="#452829" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 14, color: '#57595B' }}>
                          Service Mode: <Text style={{ fontWeight: '600' }}>
                            {(trainerDetails?.serviceMode || trainer.serviceMode) === 'HYBRID' ? 'Hybrid (Online/In-person)' : (trainerDetails?.serviceMode || trainer.serviceMode) === 'ONLINE' ? 'Online Only' : 'In-Person'}
                          </Text>
                        </Text>
                      </View>

                      {(trainerDetails?.serviceMode || trainer.serviceMode) !== 'ONLINE' && (trainerDetails?.address || trainer.address) ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                          <Icon name="location-outline" size={16} color="#452829" style={{ marginRight: 8 }} />
                          <Text style={{ fontSize: 14, color: '#57595B', flex: 1 }} numberOfLines={2}>
                            Address: {trainerDetails?.address || trainer.address}
                          </Text>
                        </View>
                      ) : null}

                      {(() => {
                        const rawLat = trainerDetails?.latitude || trainer.latitude;
                        const rawLng = trainerDetails?.longitude || trainer.longitude;
                        const dist = (trainerDetails?.distance !== undefined && trainerDetails?.distance !== null)
                          ? trainerDetails.distance
                          : (trainer.distance !== undefined && trainer.distance !== null)
                            ? trainer.distance
                            : calculateHaversineDistance(userLocation?.latitude, userLocation?.longitude, rawLat, rawLng);

                        if (dist !== null && dist !== undefined) {
                          return (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Icon name="compass-outline" size={16} color="#452829" style={{ marginRight: 8 }} />
                              <Text style={{ fontSize: 14, color: '#57595B' }}>
                                Distance: {dist.toFixed(1)} km away
                              </Text>
                            </View>
                          );
                        }
                        return null;
                      })()}
                    </View>
                  </View>

                  {gallery.length > 1 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{strings.gallery}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {gallery.map((image, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => handleImagePress(index)}
                          >
                            <Image
                              source={{ uri: image }}
                              style={styles.galleryImage}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <View style={styles.reviewsSection}>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={20} color="#452829" />
                      <Text style={styles.ratingText}>4.9</Text>
                      <Text style={styles.reviewsCount}>(124 {strings.reviewsCount})</Text>
                    </View>
                    <TouchableOpacity>
                      <Text style={styles.viewAllText}>{strings.viewAllBtn}</Text>
                    </TouchableOpacity>
                  </View>

                  {error && <Text style={styles.errorText}>{error}</Text>}

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{strings.trainingPlans}</Text>

                    {plans.length === 0 ? (
                      <View style={styles.noPlansContainer}>
                        <Text style={styles.noPlansText}>{strings.noPlans}</Text>
                      </View>
                    ) : isSubscribedToThisTrainer ? (
                      <View style={styles.subscribedMessageContainer}>
                        <Icon name="checkmark-circle" size={24} color="#27ae60" />
                        <Text style={styles.subscribedMessageText}>{strings.subscribedMsg}</Text>
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {plans.map(plan => (
                          <View key={plan.id} style={styles.planCard}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planDescription}>{plan.description || 'Full body transformation'}</Text>
                            <Text style={styles.planPrice}>${plan.price}</Text>
                            <TouchableOpacity
                              style={styles.subscribeButton}
                              onPress={() => handleSubscribePress(plan)}
                              disabled={subscribingPlanId === plan.id}
                            >
                              {subscribingPlanId === plan.id ?
                                <GlobalLoader size={30} /> :
                                <Text style={styles.subscribeButtonText}>{strings.subscribeBtn}</Text>
                              }
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={handleChatPress}
                    disabled={isCheckingAuth}
                  >
                    {isCheckingAuth ? (
                      <GlobalLoader size={30} />
                    ) : (
                      <Text style={styles.chatButtonText}>{strings.startChatBtn}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      <Modal visible={showImageViewer} transparent animationType="fade" onRequestClose={closeImageViewer}>
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerCloseButton} onPress={closeImageViewer}>
            <Icon name="close" size={30} color="#ffffff" />
          </TouchableOpacity>
          {selectedImageIndex !== null && (
            <Image
              source={{ uri: gallery[selectedImageIndex] }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
          {gallery.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {selectedImageIndex + 1} / {gallery.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  bottomSheetContainer: {
    width: '100%',
    height: screenHeight * 0.9,
    backgroundColor: 'transparent',
    position: 'relative'
  },
  heroImageSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 1
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  heroImageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent)'
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: '40%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 24,
    zIndex: 2
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    paddingVertical: 8
  },
  bottomSheetHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#e2dfdf',
    borderRadius: 2
  },
  content: {
    paddingHorizontal: 16
  },
  trainerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  tag: {
    backgroundColor: 'rgba(69, 40, 41, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8
  },
  tagText: {
    color: '#452829',
    fontSize: 14,
    fontWeight: '500'
  },
  section: {
    marginTop: 24,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8
  },
  bio: {
    fontSize: 16,
    color: '#57595B',
    lineHeight: 24,
    marginBottom: 8
  },
  experience: {
    fontSize: 14,
    color: '#57595B',
    fontStyle: 'italic'
  },
  gallerySection: {
    marginBottom: 16
  },
  galleryImage: {
    width: 128,
    height: 128,
    borderRadius: 8,
    marginRight: 12
  },
  reviewsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dfdf',
    marginBottom: 16
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 4
  },
  reviewsCount: {
    fontSize: 14,
    color: '#57595B',
    marginLeft: 4
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#452829'
  },
  planCard: {
    width: 192,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2dfdf',
    borderRadius: 8,
    padding: 16,
    marginRight: 12
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4
  },
  planDescription: {
    fontSize: 14,
    color: '#57595B',
    marginBottom: 12
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#452829',
    marginBottom: 12
  },
  subscribeButton: {
    backgroundColor: '#452829',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  subscribedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    padding: 16,
    borderRadius: 8
  },
  subscribedMessageText: {
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginVertical: 10
  },
  noPlansContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPlansText: {
    color: '#57595B',
    fontSize: 16,
  },
  chatButton: {
    backgroundColor: '#452829',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chatButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16
  },
  chatModalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 0,
    overflow: 'hidden'
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
  },
});