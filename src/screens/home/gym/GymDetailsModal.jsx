

// src/screens/home/GymDetailsModal.jsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Linking, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../../redux/actions/subscriptionActions';
import { checkInToGym } from '../../../redux/actions/gymsActions';
import { Strings } from '../../../config/config'; // Import Config

export const GymDetailsModal = ({ gym, isVisible, isLoading, onClose, isSubscribed, userSubscriptions }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const strings = Strings.Gyms.DetailsModal;

  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState('');

  const handleBookNowPress = () => {
    onClose();
    navigation.navigate('GymDetails', { gymId: gym?.id });
  };

  const handleSubscribePress = async (plan) => {
    setError('');
    setSubscribingPlanId(plan.id);
    try {
      const response = await dispatch(createCheckoutSession(plan.id, 'GYM'));
      if (response.success && response.data.checkoutUrl) {
        await Linking.openURL(response.data.checkoutUrl);
        onClose();
      } else {
        throw new Error(response.message || strings.alerts.initSubscriptionError);
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setError(strings.alerts.subscriptionError);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setError('');
    try {
        const response = await dispatch(checkInToGym(gym.id));
        if (response.success) {
            Alert.alert(strings.alerts.checkInSuccess, Strings.Gyms.welcome(gym.name));
            onClose();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        Alert.alert(
            strings.alerts.checkInFailed, 
            error.response?.data?.message || strings.alerts.unknownError
        );
    } finally {
        setIsCheckingIn(false);
    }
  };

  if (!gym) return null;

  const amenities = Array.isArray(gym.facilities) ? gym.facilities : [];
  const distance = gym.distance ? `${gym.distance.toFixed(1)} miles away` : 'N/A';
  const rating = gym.rating || '4.5';
  const plans = Array.isArray(gym.plans) ? gym.plans : [];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.gymDetailsModal}>
          <View style={styles.headerImage}>
            <ImageBackground 
              source={{ uri: gym.photos?.[0] || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f' }} 
              style={styles.modalImage}
              imageStyle={styles.modalImageStyle}
            >
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.activeDot]}></View>
                <View style={[styles.dot]}></View>
                <View style={[styles.dot]}></View>
                <View style={[styles.dot]}></View>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHandle} />
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
              {error && <Text style={styles.errorText}>{error}</Text>}

              {isLoading ? (
                <ActivityIndicator style={{ marginVertical: 60 }} color="#442728" size="large" />
              ) : (
                <>
                    <View style={styles.titleSection}>
                      <Text style={styles.modalGymName}>{gym.name}</Text>
                      <View style={styles.ratingContainer}>
                        <View style={styles.starsContainer}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.star}>
                              {i < Math.floor(rating) ? '★' : '☆'}
                            </Text>
                          ))}
                          <Text style={styles.ratingValue}>{rating} (128 reviews)</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.locationSection}>
                      <View style={styles.iconContainer}>
                        <Icon name="location-outline" size={24} color="#6b7280" />
                      </View>
                      <Text style={styles.locationText}>{gym.address}</Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{strings.sections.amenities}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.amenitiesScroll}>
                        <View style={styles.amenityItem}>
                          <View style={styles.amenityIconContainer}>
                            <Text style={styles.amenityIcon}>🏊</Text>
                          </View>
                          <Text style={styles.amenityText}>{strings.amenities.swimmingPool}</Text>
                        </View>
                        <View style={styles.amenityItem}>
                          <View style={styles.amenityIconContainer}>
                            <Text style={styles.amenityIcon}>🧖</Text>
                          </View>
                          <Text style={styles.amenityText}>{strings.amenities.sauna}</Text>
                        </View>
                        <View style={styles.amenityItem}>
                          <View style={styles.amenityIconContainer}>
                            <Text style={styles.amenityIcon}>📶</Text>
                          </View>
                          <Text style={styles.amenityText}>{strings.amenities.wifi}</Text>
                        </View>
                        <View style={styles.amenityItem}>
                          <View style={styles.amenityIconContainer}>
                            <Text style={styles.amenityIcon}>🚗</Text>
                          </View>
                          <Text style={styles.amenityText}>{strings.amenities.parking}</Text>
                        </View>
                        <View style={styles.amenityItem}>
                          <View style={styles.amenityIconContainer}>
                            <Text style={styles.amenityIcon}>💪</Text>
                          </View>
                          <Text style={styles.amenityText}>{strings.amenities.gear}</Text>
                        </View>
                      </ScrollView>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>{strings.sections.plans}</Text>
                      {isSubscribed ? (
                        <View style={styles.subscribedMessageContainer}>
                          <Icon name="checkmark-circle" size={24} color="#34C759" />
                          <Text style={styles.subscribedMessageText}>{strings.plans.subscribed}</Text>
                        </View>
                      ) : (
                        plans.length > 0 ? (
                          <View style={styles.plansContainer}>
                            {plans.map((plan) => {
                              const isSubscribedToThisPlan = userSubscriptions.some(sub => sub.gymPlanId === plan.id);
                              return (
                                <View key={plan.id} style={[styles.planItem, isSubscribedToThisPlan && styles.highlightedPlan]}>
                                  <View style={styles.planDetails}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planPrice}>${plan.price}<Text style={styles.planDuration}> / {plan.duration}</Text></Text>
                                  </View>
                                  {isSubscribedToThisPlan ? (
                                    <View style={styles.subscribedBadge}>
                                      <Icon name="checkmark-circle" size={20} color="#34C759" />
                                      <Text style={styles.subscribedText}>{strings.plans.active}</Text>
                                    </View>
                                  ) : (
                                    <TouchableOpacity 
                                      style={[styles.subscribeButton, isSubscribed && styles.disabledButton]}
                                      onPress={() => handleSubscribePress(plan)}
                                      disabled={subscribingPlanId === plan.id || isSubscribed}
                                    >
                                      {subscribingPlanId === plan.id ? (
                                        <ActivityIndicator color="#ffffff" size="small" />
                                      ) : (
                                        <Text style={styles.subscribeButtonText}>{strings.plans.subscribe}</Text>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                              );
                            })}
                          </View>
                        ) : (
                          <Text style={styles.noPlansText}>{strings.plans.empty}</Text>
                        )
                      )}
                    </View>
                </>
              )}
            </ScrollView>

            {!isLoading && (
              <View style={styles.bottomAction}>
                {isSubscribed ? (
                    <TouchableOpacity 
                      style={styles.checkInButton} 
                      onPress={handleCheckIn}
                      disabled={isCheckingIn}
                    >
                      {isCheckingIn ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.checkInButtonText}>{strings.plans.checkIn}</Text>}
                    </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.viewDetailsButton} onPress={handleBookNowPress}>
                    <Text style={styles.viewDetailsButtonText}>{strings.plans.viewDetails}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  gymDetailsModal: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  headerImage: {
    height: '40%',
    width: '100%',
  },
  modalImage: { 
    width: '100%', 
    height: '100%',
  },
  modalImageStyle: {
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  bottomSheetHandle: { 
    width: 40, 
    height: 6, 
    backgroundColor: '#e0e0e0', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginVertical: 8 
  },
  scrollContent: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    paddingBottom: 10,
  },
  modalGymName: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#111827', 
    marginBottom: 8 
  },
  ratingContainer: {
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#442728',
    fontSize: 16,
  },
  ratingValue: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  amenitiesScroll: {
    flexDirection: 'row',
  },
  amenityItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    marginRight: 12,
  },
  amenityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityIcon: {
    fontSize: 24,
  },
  amenityText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  plansContainer: { 
    gap: 16 
  },
  planItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 16, 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  highlightedPlan: {
    borderColor: '#442728',
    backgroundColor: 'rgba(68, 39, 40, 0.05)',
  },
  planDetails: { 
    flex: 1, 
    marginRight: 16 
  },
  planName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827',
    marginBottom: 4,
  },
  planPrice: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  planDuration: { 
    fontSize: 16, 
    fontWeight: 'normal', 
    color: '#6b7280' 
  },
  subscribeButton: { 
    backgroundColor: '#442728', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    minWidth: 100, 
    height: 36, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  subscribeButtonText: { 
    color: '#ffffff', 
    fontWeight: '600', 
    fontSize: 14 
  },
  disabledButton: { 
    backgroundColor: '#d1d5db' 
  },
  subscribedBadge: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  subscribedText: { 
    color: '#34C759', 
    fontWeight: '600', 
    fontSize: 14, 
    marginLeft: 6 
  },
  noPlansText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  bottomAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  checkInButton: { 
    flex: 1, 
    backgroundColor: '#34C759', 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  checkInButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  viewDetailsButton: { 
    flex: 1, 
    backgroundColor: '#442728', 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  viewDetailsButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  errorText: { 
    color: '#ef4444', 
    textAlign: 'center', 
    marginBottom: 15, 
    fontSize: 14 
  },
  subscribedMessageContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(52, 199, 89, 0.1)', 
    padding: 16, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(52, 199, 89, 0.5)' 
  },
  subscribedMessageText: { 
    color: '#34C759', 
    fontSize: 16, 
    fontWeight: '600', 
    marginLeft: 10, 
    flex: 1 
  },
});