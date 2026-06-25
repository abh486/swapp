
// src/screens/community/components/TrainerModal.jsx
import { GlobalLoader } from '../../../../components/GlobalLoader';
import React, { useState, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { createCheckoutSession } from '../../redux/actions/subscriptionActions';
import { Strings } from '../../../config/config'; // Import Config
import * as Clarity from '../../../../utils/clarity';

export const TrainerModal = ({ trainer, isVisible, isLoading, onClose, isSubscribed, userSubscriptions }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const strings = Strings.TrainerModal;
  const [subscribingPlanId, setSubscribingPlanId] = useState(null);
  const [error, setError] = useState('');

  const specialties = useMemo(() => Array.isArray(trainer.specialties) ? trainer.specialties : [], [trainer.specialties]);
  const plans = useMemo(() => Array.isArray(trainer.plans) ? trainer.plans : [], [trainer.plans]);
  const experience = useMemo(() => trainer.experience ? `${trainer.experience} years` : 'N/A', [trainer.experience]);
  const rating = useMemo(() => trainer.rating || '4.5', [trainer.rating]);

  useMemo(() => {
    console.log('TrainerModal - trainer ID:', trainer.id);
    console.log('TrainerModal - isSubscribed prop:', isSubscribed);
    console.log('TrainerModal - userSubscriptions:', userSubscriptions);
    console.log('TrainerModal - plans:', plans);
    console.log('TrainerModal - specialties:', specialties);
  }, [trainer, isSubscribed, userSubscriptions, plans, specialties]);

  const handleSubscribePress = async (plan) => {
    console.log('TrainerModal - Subscribe button pressed for plan:', plan.id);
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
        navigation.navigate('CheckoutBrowser', {
          url: response.data.checkoutUrl,
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
        });
        onClose();
      } else {
        throw new Error(response.message || strings.alerts.subscribeError);
      }
    } catch (err) {
      console.error("TrainerModal - Subscription error:", err);
      setError(strings.alerts.subscriptionError);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (!trainer) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <TouchableOpacity style={styles.handle} onPress={onClose}>
            <View style={styles.handleBar} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.heroContainer}>
              <Image 
                source={{ uri: trainer.gallery?.[0] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b' }} 
                style={styles.heroImage}
              />
              <View style={styles.heroGradient} />
            </View>

            <View style={styles.content}>
              <Text style={styles.trainerName}>
                {trainer.user?.name || trainer.user?.email?.split('@')[0] || 'Trainer'}
              </Text>

              <View style={styles.ratingSection}>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={20} color="#452829" />
                  <Text style={styles.ratingText}>{rating}</Text>
                  <Text style={styles.reviewsText}>(124 {strings.reviewText})</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.viewAllText}>{strings.viewAllBtn}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.specialtiesContainer}>
                {specialties.map((item, index) => (
                  <View key={index} style={styles.specialtyChip}>
                    <Text style={styles.specialtyText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.sections.about}</Text>
                <Text style={styles.bioText}>{trainer.bio || 'No bio available'}</Text>
              </View>

              {trainer.gallery && trainer.gallery.length > 1 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{strings.sections.gallery}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {trainer.gallery.map((image, index) => (
                      <Image
                        key={index}
                        source={{ uri: image }}
                        style={styles.galleryImage}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.sections.plans}</Text>
                
                {plans.length === 0 ? (
                  <View style={styles.noPlansContainer}>
                    <Text style={styles.noPlansText}>{strings.noPlans}</Text>
                    <TouchableOpacity 
                      style={styles.contactButton}
                      onPress={() => {
                        onClose();
                        navigation.navigate('TrainerDetails', { trainerId: trainer.id });
                      }}
                    >
                      <Text style={styles.contactButtonText}>{strings.contactTrainer}</Text>
                    </TouchableOpacity>
                  </View>
                ) : isSubscribed ? (
                  <View style={styles.subscribedMessageContainer}>
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.subscribedMessageText}>{strings.subscribed.title}</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {plans.map((plan) => {
                      const isSubscribedToThisPlan = userSubscriptions && 
                        userSubscriptions.some(sub => sub.trainerPlanId === plan.id);
                      
                      console.log(`TrainerModal - Plan ${plan.id}: Is subscribed to this plan?`, isSubscribedToThisPlan);
                      
                      return (
                        <View key={plan.id} style={styles.planCard}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          <Text style={styles.planDescription}>{plan.description || strings.plan.defaultDesc}</Text>
                          <Text style={styles.planPrice}>${plan.price}</Text>
                          {isSubscribedToThisPlan ? (
                            <View style={styles.subscribedBadge}>
                              <Icon name="checkmark-circle" size={20} color="#4CAF50" />
                              <Text style={styles.subscribedText}>{strings.subscribed.badgeText}</Text>
                            </View>
                          ) : (
                            <TouchableOpacity 
                              style={styles.subscribeButton}
                              onPress={() => handleSubscribePress(plan)}
                              disabled={subscribingPlanId === plan.id}
                            >
                              {subscribingPlanId === plan.id ? (
                                <GlobalLoader size={30} />
                              ) : (
                                <Text style={styles.subscribeButtonText}>{strings.plan.subscribeBtn}</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </ScrollView>

          <View style={styles.ctaContainer}>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={() => {
                onClose();
                navigation.navigate('TrainerDetails', { trainerId: trainer.id });
              }}
            >
              <Text style={styles.ctaButtonText}>{strings.viewFullProfile}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex:1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#e2dfdf',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
  },
  content: {
    padding: 20,
  },
  trainerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: -60,
    marginBottom: 12,
  },
  ratingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: '#57595B',
    marginLeft: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#452829',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  specialtyChip: {
    backgroundColor: 'rgba(69, 40, 41, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  specialtyText: {
    color: '#452829',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#57595B',
    lineHeight: 24,
  },
  galleryImage: {
    width: 128,
    height: 128,
    borderRadius: 8,
    marginRight: 12,
  },
  planCard: {
    width: 192,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#57595B',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#452829',
    marginBottom: 12,
  },
  subscribeButton: {
    backgroundColor: '#452829',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  subscribedText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
  },
  noPlansContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPlansText: {
    color: '#57595B',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#452829',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  subscribedMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  subscribedMessageText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#452829',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});