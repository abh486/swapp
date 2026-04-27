import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image, I18nManager, Dimensions, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';

if (I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}

const { width } = Dimensions.get('window');
const CONTENT_WIDTH = width - 40;

// ─── Age Ruler ───────────────────────────────────────────────────────────────
const AgeRuler = ({ value, onChange }) => {
  const ages = Array.from({ length: 80 }, (_, i) => 15 + i);
  const ITEM_HEIGHT = 65;

  const initialOffset = React.useMemo(() => {
    const idx = ages.findIndex(a => String(a) === String(value));
    return idx > 0 ? idx * ITEM_HEIGHT : 0;
  }, []);

  return (
    <View style={{ height: 320, width: '100%', alignItems: 'center' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 120 }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialOffset }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const index = Math.round(y / ITEM_HEIGHT);
          if (index >= 0 && index < ages.length) {
            onChange(ages[index].toString());
          }
        }}
        scrollEventThrottle={16}
      >
        {ages.map((age) => {
          const isSelected = String(age) === String(value);
          return (
            <View key={age} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontSize: isSelected ? 65 : 38,
                fontWeight: isSelected ? '500' : '400',
                color: isSelected ? '#FFFFFF' : '#444444',
              }}>
                {age}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ─── Horizontal Ruler ────────────────────────────────────────────────────────
const HorizontalRuler = ({ min, max, value, onChange, unit, step = 1 }) => {
  const itemWidth = 14;
  const data = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);

  const initialOffset = React.useMemo(() => {
    const val = Number(value);
    const idx = Math.floor((val - min) / step);
    return idx > 0 ? idx * itemWidth : 0;
  }, []);

  return (
    <View style={{ height: 110, width: '100%', alignItems: 'center' }}>
      <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 15 }}>
        {value} {unit}
      </Text>
      <View style={{ width: '100%', height: 60, justifyContent: 'center', alignItems: 'center' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: CONTENT_WIDTH / 2 }}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentOffset={{ x: initialOffset, y: 0 }}
          onScroll={(e) => {
            const x = Math.max(0, e.nativeEvent.contentOffset.x);
            const index = Math.round(x / itemWidth);
            if (index >= 0 && index < data.length) {
              onChange(data[index].toString());
            }
          }}
          scrollEventThrottle={16}
        >
          {data.map((val) => {
            const isTenth = val % (step * 5) === 0;
            const isSelected = String(val) === String(value);
            return (
              <View key={val} style={{ width: itemWidth, alignItems: 'center', justifyContent: 'center', height: 60 }}>
                <View style={{ width: 2, height: isTenth ? 45 : 25, backgroundColor: isSelected ? '#FFFFFF' : '#555555' }} />
                {isTenth && (
                  <Text style={{ color: '#888', fontSize: 10, position: 'absolute', bottom: -5 }}>{val}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
        <View
          style={{ position: 'absolute', width: 4, height: 60, backgroundColor: '#FFFFFF', borderRadius: 2 }}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MemberProfile = () => {
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigation = useNavigation();
  const { refreshAuthStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    age: '22',
    gender: 'Male',
    weight: '0',
    height: '0',
    fitnessGoal: [],
    interests: [],
  });

  // ── Image Picker ────────────────────────────────────────────────────────────
  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 600,
        maxWidth: 600,
        quality: 0.8,
        selectionLimit: 1,
      },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Image Error', response.errorMessage || 'Could not pick image.');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const selectedImage = response.assets[0];
          setUploadingImage(true);
          try {
            const uploadedUrl = await uploadToCloudinary(selectedImage);
            setProfileImage(uploadedUrl);
          } catch (error) {
            Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateCurrentStep = () => {
    if (currentStep === 0 && !formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return false;
    }
    if (currentStep === 3 && formData.fitnessGoal.length === 0) {
      Alert.alert('Required Field', 'Please select at least one goal.');
      return false;
    }
    if (currentStep === 4 && formData.interests.length === 0) {
      Alert.alert('Required Field', 'Please select at least one interest.');
      return false;
    }
    return true;
  };

  const isLastStep = currentStep === 4;

  const handleNext = () => {
    if (validateCurrentStep()) {
      isLastStep ? handleSubmit() : setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    navigation.navigate('MainTabs');
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setCurrentStep(5);
    try {
      await apiClient.post('/v1/auth/create-member-profile', {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        weight: { value: Number(formData.weight), unit: 'KG' },
        height: { value: Number(formData.height), unit: 'CM' },
        fitnessGoal: formData.fitnessGoal.join(', '),
        healthConditions: formData.interests.join(', ') || 'None',
        profilePicture: profileImage ? profileImage : undefined,
      });
      // Ensure the "Get ready !!" screen is visible for at least 1.5 seconds for visual impact
      await new Promise(resolve => setTimeout(resolve, 1500));
      await refreshAuthStatus();
    } catch (err) {
      setCurrentStep(4);
      console.error('Profile Setup Failed:', err.response ? err.response.data : err.message);
      Alert.alert('Profile Setup Failed', err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toggles ─────────────────────────────────────────────────────────────────
  const toggleGoal = (goal) => {
    const goals = formData.fitnessGoal;
    setFormData({
      ...formData,
      fitnessGoal: goals.includes(goal) ? goals.filter(g => g !== goal) : [...goals, goal],
    });
  };

  const toggleInterest = (interest) => {
    const interests = formData.interests;
    setFormData({
      ...formData,
      interests: interests.includes(interest) ? interests.filter(i => i !== interest) : [...interests, interest],
    });
  };

  // ── Step Renders ─────────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {

      // ── Step 0: Name + Profile Photo ────────────────────────────────────────
      case 0:
        return (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>

            {/* Profile image circle */}
            <View style={{ alignItems: 'center', marginBottom: 50 }}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
                <View style={styles.avatarCircle}>
                  {uploadingImage ? (
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    // Silhouette placeholder
                    <View style={styles.avatarPlaceholder}>
                      {/* Head */}
                      <View style={styles.avatarHead} />
                      {/* Shoulders */}
                      <View style={styles.avatarBody} />
                    </View>
                  )}
                </View>

                {/* Edit badge */}
                <View style={styles.editBadge}>
                  <Feather name="edit" size={18} color="#0055FF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.addProfileLabel}>Add Your Profile</Text>
            </View>

            {/* Name input */}
            <View style={{ width: '100%' }}>
              <Text style={styles.stepTitle}>What do you want to be called ?</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Stephen"
                placeholderTextColor="#555"
                value={formData.name}
                autoFocus={true}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>
        );

      // ── Step 1: Age ─────────────────────────────────────────────────────────
      case 1:
        return (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
            <Text style={styles.stepHeading}>what's your age?</Text>
            <Text style={styles.stepSubtitle}>please select your age</Text>
            <AgeRuler value={formData.age} onChange={(v) => setFormData({ ...formData, age: v })} />
          </View>
        );

      // ── Step 2: Height + Weight ─────────────────────────────────────────────
      case 2:
        return (
          <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
            <Text style={styles.stepHeading}>what's your height?</Text>
            <Text style={styles.stepSubtitle}>please select your height</Text>
            <HorizontalRuler min={0} max={250} value={formData.height} onChange={(v) => setFormData({ ...formData, height: v })} unit="cm" />

            <View style={{ height: 40 }} />

            <Text style={styles.stepHeading}>what's your Weight?</Text>
            <Text style={styles.stepSubtitle}>please select your weight</Text>
            <HorizontalRuler min={0} max={200} value={formData.weight} onChange={(v) => setFormData({ ...formData, weight: v })} unit="kg" />
          </View>
        );

      // ── Step 3: Fitness Goals ────────────────────────────────────────────────
      case 3:
        const goals = ['Lose Weight', 'Build muscle', 'Boost energy', 'Stress relief', 'Sports performance', 'Flexibility'];
        return (
          <View style={{ width: '100%', marginTop: 20 }}>
            <Text style={styles.stepHeading}>What are you here for?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 }}>
              {goals.map((g) => {
                const isSelected = formData.fitnessGoal.includes(g);
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.goalCard, isSelected && styles.goalCardActive]}
                    onPress={() => toggleGoal(g)}
                  >
                    <Text style={styles.goalText}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ── Step 4: Interests ────────────────────────────────────────────────────
      case 4:
        const sections = [
          {
            title: 'STRENGTH & FITNESS',
            items: [
              { label: 'Gym workout', icon: 'weight-lifter' },
              { label: 'CrossFit', icon: 'run-fast' },
              { label: 'HIIT', icon: 'lightning-bolt' },
              { label: 'Functional', icon: 'human-handsup' },
            ],
          },
          {
            title: 'COMBAT SPORTS',
            items: [
              { label: 'Boxing', icon: 'boxing-glove' },
              { label: 'MMA', icon: 'karate' },
              { label: 'Karate', icon: 'martial-arts' },
            ],
          },
          {
            title: 'MIND & BODY',
            items: [
              { label: 'Yoga', icon: 'yoga' },
              { label: 'Pilates', icon: 'human-child' },
              { label: 'Meditation', icon: 'meditation' },
            ],
          },
          {
            title: 'SPORTS',
            items: [
              { label: 'Football', icon: 'soccer' },
              { label: 'Badminton', icon: 'badminton' },
              { label: 'Swimming', icon: 'swim' },
            ],
          },
        ];
        return (
          <View style={{ width: '100%', flex: 1, marginTop: 20 }}>
            <Text style={styles.stepHeading}>What do you enjoy?</Text>
            <Text style={styles.stepSubtitle}>Tap all that interest you</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50, marginTop: 20 }}>
              {sections.map((sec) => (
                <View key={sec.title} style={{ marginBottom: 30 }}>
                  <Text style={styles.sectionLabel}>{sec.title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {sec.items.map((item) => {
                      const isSelected = formData.interests.includes(item.label);
                      return (
                        <TouchableOpacity
                          key={item.label}
                          style={[styles.interestChip, isSelected && styles.interestChipActive]}
                          onPress={() => toggleInterest(item.label)}
                        >
                          <MaterialCommunityIcons 
                            name={item.icon} 
                            size={18} 
                            color={isSelected ? '#FFFFFF' : '#888888'} 
                            style={{ marginRight: 8 }} 
                          />
                          <Text style={styles.interestText}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (currentStep === 5) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '500', letterSpacing: 0.5 }}>Get ready !!</Text>
        <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 30, opacity: loading ? 1 : 0 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { opacity: currentStep === 0 ? 0 : 1 }]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          {[0, 1, 2, 3, 4].map((step) => (
            <View key={step} style={[styles.progressSegment, step <= currentStep && styles.progressSegmentActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleNext} disabled={loading || uploadingImage}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.continueButtonText}>
              {currentStep === 4 && formData.interests.length > 0
                ? `Continue (${formData.interests.length} selected)`
                : 'Continue >'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: '#FFF',
    lineHeight: 28,
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 15,
    justifyContent: 'space-between',
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: '#333',
    marginHorizontal: 3,
    borderRadius: 1.5,
  },
  progressSegmentActive: {
    backgroundColor: '#FFF',
  },
  skipButton: {
    paddingHorizontal: 5,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // Content / Footer
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  continueButton: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#E0E0E0',
    fontSize: 18,
    fontWeight: '400',
  },

  // Step 0 — Avatar
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHead: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#3A3A3A',
    marginBottom: 6,
  },
  avatarBody: {
    width: 70,
    height: 38,
    borderRadius: 35,
    backgroundColor: '#3A3A3A',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  editBadgeIcon: {
    fontSize: 16,
  },
  addProfileLabel: {
    color: '#AAAAAA',
    fontSize: 16,
    marginTop: 18,
    letterSpacing: 0.3,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    width: '100%',
    height: 58,
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFF',
    paddingHorizontal: 20,
    fontSize: 18,
  },

  // Step headings
  stepHeading: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '500',
    marginBottom: 12,
  },
  stepSubtitle: {
    color: '#777',
    fontSize: 15,
    marginBottom: 24,
  },

  // Step 3 — Goals
  goalCard: {
    width: '47%',
    height: 110,
    backgroundColor: '#0D0D0D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalCardActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#FFFFFF',
  },
  goalText: {
    color: '#FFF',
    fontSize: 15,
    textAlign: 'center',
  },

  // Step 4 — Interests
  sectionLabel: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 1.5,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#0A0A0A',
    marginRight: 10,
    marginBottom: 12,
  },
  interestChipActive: {
    borderColor: '#FFFFFF',
  },
  interestText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MemberProfile;