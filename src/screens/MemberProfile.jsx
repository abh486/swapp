import { GlobalLoader } from '../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, I18nManager, Dimensions, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import * as Clarity from '../utils/clarity';
import { useResponsiveMetrics } from '../utils/responsive';

if (I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}

// ─── Age Ruler ───────────────────────────────────────────────────────────────
const AgeRuler = ({ value, onChange }) => {
  const { sp, fs, height: screenHeight } = useResponsiveMetrics();
  const ages = Array.from({ length: 80 }, (_, i) => 15 + i);

  const isSmallScreen = screenHeight < 700;
  const ITEM_HEIGHT = isSmallScreen ? sp(50) : sp(65);
  const RULER_HEIGHT = isSmallScreen ? sp(220) : sp(320);
  const PADDING_VERTICAL = isSmallScreen ? sp(85) : sp(120);
  const TEXT_SIZE_SELECTED = isSmallScreen ? fs(50) : fs(65);
  const TEXT_SIZE_UNSELECTED = isSmallScreen ? fs(30) : fs(38);

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const initialOffset = React.useMemo(() => {
    const idx = ages.findIndex(a => String(a) === String(value));
    return idx > 0 ? idx * ITEM_HEIGHT : 0;
  }, [value, ITEM_HEIGHT]);

  return (
    <View style={{ height: RULER_HEIGHT, width: '100%', alignItems: 'center' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialOffset }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const index = Math.round(y / ITEM_HEIGHT);
          if (index >= 0 && index < ages.length) {
            const nextVal = ages[index].toString();
            if (nextVal !== localValue) {
              setLocalValue(nextVal);
            }
          }
        }}
        onMomentumScrollEnd={() => {
          onChange(localValue);
        }}
        onScrollEndDrag={() => {
          onChange(localValue);
        }}
        scrollEventThrottle={16}
      >
        {ages.map((age) => {
          const isSelected = String(age) === String(localValue);
          return (
            <View key={age} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontSize: isSelected ? TEXT_SIZE_SELECTED : TEXT_SIZE_UNSELECTED,
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
  const { sp, fs, width: screenWidth } = useResponsiveMetrics();
  const itemWidth = sp(14);
  const data = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);

  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const initialOffset = React.useMemo(() => {
    const val = Number(value);
    const idx = Math.floor((val - min) / step);
    return idx > 0 ? idx * itemWidth : 0;
  }, [value, min, step, itemWidth]);

  const contentWidth = screenWidth - sp(40);

  return (
    <View style={{ height: sp(110), width: '100%', alignItems: 'center' }}>
      <Text style={{ color: '#FFF', fontSize: fs(18), fontWeight: '700', marginBottom: sp(15) }}>
        {localValue} {unit}
      </Text>
      <View style={{ width: '100%', height: sp(60), justifyContent: 'center', alignItems: 'center' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: contentWidth / 2 }}
          snapToInterval={itemWidth}
          decelerationRate="fast"
          contentOffset={{ x: initialOffset, y: 0 }}
          onScroll={(e) => {
            const x = Math.max(0, e.nativeEvent.contentOffset.x);
            const index = Math.round(x / itemWidth);
            if (index >= 0 && index < data.length) {
              const nextVal = data[index].toString();
              if (nextVal !== localValue) {
                setLocalValue(nextVal);
              }
            }
          }}
          onMomentumScrollEnd={() => {
            onChange(localValue);
          }}
          onScrollEndDrag={() => {
            onChange(localValue);
          }}
          scrollEventThrottle={16}
        >
          {data.map((val) => {
            const isTenth = val % (step * 5) === 0;
            const isSelected = String(val) === String(localValue);
            return (
              <View key={val} style={{ width: itemWidth, alignItems: 'center', justifyContent: 'center', height: sp(60) }}>
                <View style={{ width: sp(2), height: isTenth ? sp(45) : sp(25), backgroundColor: isSelected ? '#FFFFFF' : '#555555' }} />
                {isTenth && (
                  <Text style={{ color: '#888', fontSize: fs(10), position: 'absolute', bottom: sp(-5) }}>{val}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
        <View
          style={{ position: 'absolute', width: sp(4), height: sp(60), backgroundColor: '#FFFFFF', borderRadius: sp(2) }}
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

  const { wp, hp, ms, mvs, sp, fs, width: screenWidth, height: screenHeight } = useResponsiveMetrics();
  const styles = createStyles({ wp, hp, ms, mvs, sp, fs, screenWidth, screenHeight });

  const [formData, setFormData] = useState({
    name: '',
    age: '22',
    gender: 'Male',
    weight: '70',
    height: '170',
    fitnessGoal: [],
    interests: [],
  });

  useEffect(() => {
    console.log('[Clarity] Sign up started');
    try {
      Clarity.sendCustomEvent('signup_started');
    } catch (e) {
      console.error('[Clarity] Failed to send signup_started:', e);
    }
  }, []);

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
    if (currentStep === 4 && formData.fitnessGoal.length === 0) {
      Alert.alert('Required Field', 'Please select at least one goal.');
      return false;
    }
    if (currentStep === 5 && formData.interests.length === 0) {
      Alert.alert('Required Field', 'Please select at least one interest.');
      return false;
    }
    return true;
  };

  // Total steps: 0 (name), 1 (gender), 2 (age), 3 (height/weight), 4 (goals), 5 (interests)
  const isLastStep = currentStep === 5;

  const handleNext = () => {
    if (validateCurrentStep()) {
      isLastStep ? handleSubmit() : setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };


  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setCurrentStep(6);
    try {
      await apiClient.post('/v1/auth/create-user-profile', {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        weight: { value: Number(formData.weight), unit: 'KG' },
        height: { value: Number(formData.height), unit: 'CM' },
        fitnessGoal: formData.fitnessGoal.join(', '),
        healthConditions: formData.interests.join(', ') || 'None',
        profileImage: profileImage ? profileImage : undefined,
        profilePicture: profileImage ? profileImage : undefined,
      });
      // Ensure the "Get ready !!" screen is visible for at least 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('[Clarity] Sign up completed');
      try {
        Clarity.sendCustomEvent('signup_completed');
      } catch (e) {
        console.error('[Clarity] Failed to send signup_completed:', e);
      }
      await refreshAuthStatus();
    } catch (err) {
      setCurrentStep(5);
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
          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingVertical: sp(20) }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Profile image circle */}
            <View style={{ alignItems: 'center', marginBottom: sp(50) }}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
                <View style={styles.avatarCircle}>
                  {uploadingImage ? (
                    <GlobalLoader size={sp(60)} />
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <View style={styles.avatarHead} />
                      <View style={styles.avatarBody} />
                    </View>
                  )}
                </View>

                {/* Edit badge */}
                <View style={styles.editBadge}>
                  <Feather name="edit" size={sp(18)} color="#0055FF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.addProfileLabel}>Add Your Profile</Text>
            </View>

            {/* Name input */}
            <View style={{ width: '100%' }}>
              <Text style={styles.stepTitle}>What do you want to be called ?</Text>
              <TextInput
                style={styles.nameInput}
                placeholder=""
                placeholderTextColor="#555"
                value={formData.name}
                autoFocus={false}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </ScrollView>
        );

      // ── Step 1: Gender ──────────────────────────────────────────────────────
      case 1:
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>{"what's your\nGender?"}</Text>
            <Text style={styles.stepSubtitle}>please select your gender</Text>

            <View style={{ marginTop: sp(10), gap: sp(16) }}>

              {/* Female Card */}
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, gender: 'Female' })}
                activeOpacity={0.85}
                style={[
                  styles.genderCard,
                  formData.gender === 'Female' && styles.genderCardActive,
                ]}
              >
                <Text style={styles.genderLabel}>Female</Text>
                <Image
                  source={require('../assets/image/girl 1.png')}
                  style={styles.genderImageRight}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Male Card */}
              <TouchableOpacity
                onPress={() => setFormData({ ...formData, gender: 'Male' })}
                activeOpacity={0.85}
                style={[
                  styles.genderCard,
                  formData.gender === 'Male' && styles.genderCardActive,
                ]}
              >
                <Text style={[styles.genderLabel, { marginLeft: 'auto', marginRight: sp(30) }]}>Male</Text>
                <Image
                  source={require('../assets/image/male 1.png')}
                  style={styles.genderImageLeft}
                  resizeMode="contain"
                />
              </TouchableOpacity>

            </View>
          </ScrollView>
        );

      // ── Step 2: Age ─────────────────────────────────────────────────────────
      case 2:
        return (
          <View style={{ width: '100%', alignItems: 'center', paddingVertical: sp(20), flex: 1 }}>
            <Text style={styles.stepHeading}>what's your age?</Text>
            <Text style={styles.stepSubtitle}>please select your age</Text>
            <AgeRuler value={formData.age} onChange={(v) => setFormData({ ...formData, age: v })} />
          </View>
        );

      // ── Step 3: Height + Weight ─────────────────────────────────────────────
      case 3:
        return (
          <ScrollView
            contentContainerStyle={{ alignItems: 'center', paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>what's your height?</Text>
            <Text style={styles.stepSubtitle}>please select your height</Text>
            <HorizontalRuler min={0} max={250} value={formData.height} onChange={(v) => setFormData({ ...formData, height: v })} unit="cm" />

            <View style={{ height: sp(40) }} />

            <Text style={styles.stepHeading}>what's your Weight?</Text>
            <Text style={styles.stepSubtitle}>please select your weight</Text>
            <HorizontalRuler min={0} max={200} value={formData.weight} onChange={(v) => setFormData({ ...formData, weight: v })} unit="kg" />
          </ScrollView>
        );

      // ── Step 4: Fitness Goals ────────────────────────────────────────────────
      case 4:
        const goals = ['Lose Weight', 'Build muscle', 'Boost energy', 'Stress relief', 'Sports performance', 'Flexibility'];
        return (
          <ScrollView
            contentContainerStyle={{ paddingVertical: sp(20) }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.stepHeading}>What are you here for?</Text>
            <Text style={styles.stepSubtitle}>Select all that apply</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: sp(20) }}>
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
          </ScrollView>
        );

      // ── Step 5: Interests ────────────────────────────────────────────────────
      case 5:
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
          <View style={{ width: '100%', flex: 1, marginTop: sp(20) }}>
            <Text style={styles.stepHeading}>What do you enjoy?</Text>
            <Text style={styles.stepSubtitle}>Tap all that interest you</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: sp(50), marginTop: sp(20) }}>
              {sections.map((sec) => (
                <View key={sec.title} style={{ marginBottom: sp(30) }}>
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
                            size={sp(18)}
                            color={isSelected ? '#FFFFFF' : '#888888'}
                            style={{ marginRight: sp(8) }}
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
  if (currentStep === 6) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: fs(32), fontWeight: '500', letterSpacing: 0.5 }}>Get ready !!</Text>
        <GlobalLoader size={sp(60)} style={{ marginTop: sp(30), opacity: loading ? 1 : 0 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <View key={step} style={[styles.progressSegment, step <= currentStep && styles.progressSegmentActive]} />
            ))}
          </View>

          {/* Placeholder to keep the progress bar centered */}
          <View style={{ width: sp(44) }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderStepContent()}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleNext} disabled={loading || uploadingImage}>
            {loading ? (
              <GlobalLoader size={sp(50)} />
            ) : (
              <Text style={styles.continueButtonText}>
                {currentStep === 5 && formData.interests.length > 0
                  ? `Continue (${formData.interests.length} selected)`
                  : 'Continue >'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = ({ wp, hp, ms, mvs, sp, fs, screenWidth, screenHeight }) => {
  const isSmallScreen = screenHeight < 700;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(20),
    paddingTop: sp(15),
    paddingBottom: sp(25),
  },
  backButton: {
    width: sp(44),
    height: sp(44),
    borderRadius: sp(22),
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: fs(26),
    color: '#FFF',
    lineHeight: fs(28),
  },
  progressBar: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: sp(15),
    justifyContent: 'space-between',
  },
  progressSegment: {
    flex: 1,
    height: sp(3),
    backgroundColor: '#333',
    marginHorizontal: sp(3),
    borderRadius: sp(1.5),
  },
  progressSegmentActive: {
    backgroundColor: '#FFF',
  },

  // Content / Footer
  content: {
    flex: 1,
    paddingHorizontal: sp(20),
  },
  footer: {
    paddingHorizontal: sp(20),
    paddingBottom: Platform.OS === 'ios' ? sp(40) : sp(25),
    paddingTop: sp(10),
  },
  continueButton: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: sp(12),
    paddingVertical: sp(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#E0E0E0',
    fontSize: fs(18),
    fontWeight: '400',
  },

  // Step 0 — Avatar
  avatarCircle: {
    width: sp(140),
    height: sp(140),
    borderRadius: sp(70),
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  avatarImage: {
    width: sp(140),
    height: sp(140),
    borderRadius: sp(70),
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHead: {
    width: sp(46),
    height: sp(46),
    borderRadius: sp(23),
    backgroundColor: '#3A3A3A',
    marginBottom: sp(6),
  },
  avatarBody: {
    width: sp(70),
    height: sp(38),
    borderRadius: sp(35),
    backgroundColor: '#3A3A3A',
  },
  editBadge: {
    position: 'absolute',
    bottom: sp(2),
    right: sp(2),
    backgroundColor: '#FFF',
    width: sp(36),
    height: sp(36),
    borderRadius: sp(18),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addProfileLabel: {
    color: '#AAAAAA',
    fontSize: fs(16),
    marginTop: sp(18),
    letterSpacing: 0.3,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: fs(20),
    textAlign: 'center',
    marginBottom: sp(20),
  },
  nameInput: {
    width: '100%',
    height: sp(58),
    backgroundColor: '#0A0A0A',
    borderRadius: sp(10),
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#FFF',
    paddingHorizontal: sp(20),
    fontSize: fs(18),
  },

  // Step headings
  stepHeading: {
    color: '#FFF',
    fontSize: isSmallScreen ? fs(28) : fs(34),
    fontWeight: '500',
    marginBottom: isSmallScreen ? sp(8) : sp(12),
  },
  stepSubtitle: {
    color: '#777',
    fontSize: isSmallScreen ? fs(13) : fs(15),
    marginBottom: isSmallScreen ? sp(16) : sp(24),
  },

  // Step 1 — Gender
  genderCard: {
    width: '100%',
    height: sp(160),
    backgroundColor: '#0D0D0D',
    borderRadius: sp(20),
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 0,
  },
  genderCardActive: {
    borderColor: '#FFFFFF',
    backgroundColor: '#141414',
  },
  genderLabel: {
    color: '#FFFFFF',
    fontSize: fs(26),
    fontWeight: '400',
    letterSpacing: 0.5,
    zIndex: 2,
    paddingLeft: sp(30),
  },
  genderImageRight: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: sp(160),
    height: sp(160),
  },
  genderImageLeft: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: sp(160),
    height: sp(160),
  },

  // Step 3 — Goals
  goalCard: {
    width: '47%',
    height: sp(110),
    backgroundColor: '#0D0D0D',
    borderRadius: sp(14),
    borderWidth: 1,
    borderColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: sp(16),
  },
  goalCardActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#FFFFFF',
  },
  goalText: {
    color: '#FFF',
    fontSize: fs(15),
    textAlign: 'center',
  },

  // Step 5 — Interests
  sectionLabel: {
    color: '#666',
    fontSize: fs(11),
    fontWeight: 'bold',
    marginBottom: sp(14),
    letterSpacing: 1.5,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    borderRadius: sp(25),
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#0A0A0A',
    marginRight: sp(10),
    marginBottom: sp(12),
  },
  interestChipActive: {
    borderColor: '#FFFFFF',
  },
  interestText: {
    color: '#FFF',
    fontSize: fs(14),
    fontWeight: '500',
  },
  });
};

export default MemberProfile;