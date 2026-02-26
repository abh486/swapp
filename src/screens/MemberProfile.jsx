import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image, I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

if (I18nManager.isRTL) {
  I18nManager.forceRTL(false);
}

const MemberProfile = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user, refreshAuthStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '', // Added email to state
    age: '',
    gender: '',
    weight: '',
    height: '',
    healthConditions: '',
    fitnessGoal: '',
  });

  const [weightUnit, setWeightUnit] = useState('KG');
  const [heightUnit, setHeightUnit] = useState('CM');

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const steps = [
    { title: "WHAT'S YOUR NAME?", field: 'name', type: 'text' },
    { title: "WHAT'S YOUR EMAIL?", field: 'email', type: 'email' }, // Added email step
    { title: "HOW OLD ARE YOU?", field: 'age', type: 'number' },
    { title: "WHAT'S YOUR GENDER?", field: 'gender', type: 'gender' },
    { title: "WHAT'S YOUR CURRENT WEIGHT?", field: 'weight', type: 'weight' },
    { title: "WHAT'S YOUR HEIGHT?", field: 'height', type: 'height' },
    { title: "WHAT'S YOUR GOAL?", field: 'fitnessGoal', type: 'goal' },
  ];

  const goals = [
    { title: "Lose Weight", subtitle: "Reach your ideal weight", icon: "⚖️" },
    { title: "Build Muscle", subtitle: "Get stronger and toned", icon: "💪" },
    { title: "Improve Endurance", subtitle: "Boost your stamina", icon: "🏃" },
    { title: "Stay Active", subtitle: "Maintain a healthy lifestyle", icon: "❤️" },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const totalSteps = steps.length;

  const validateCurrentStep = () => {
    const currentField = currentStepData.field;
    const value = formData[currentField];
    if (!value || String(value).trim() === '') {
      Alert.alert('Required Field', 'Please fill out this field to continue.');
      return false;
    }
    if (currentField === 'age' && (isNaN(parseInt(value, 10)) || parseInt(value, 10) < 1 || parseInt(value, 10) > 120)) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120.');
      return false;
    }
    if (currentField === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      isLastStep ? handleSubmit() : setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
    else navigation.goBack();
  };

  const handleSkip = () => {
    navigation.navigate('MainTabs');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post(
        '/v1/auth/create-member-profile',
        {
          name: formData.name.trim(),
          email: formData.email.trim(), // Send the email to the backend
          age: Number(formData.age),
          gender: formData.gender,
          weight: { value: Number(formData.weight), unit: weightUnit },
          height: { value: Number(formData.height), unit: heightUnit },
          fitnessGoal: formData.fitnessGoal,
          healthConditions: formData.healthConditions.trim(),
        }
      );
      await refreshAuthStatus();
    } catch (err) {
      console.error('Profile Setup Failed:', err.response ? err.response.data : err.message);
      Alert.alert('Profile Setup Failed', err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (value) => {
    setFormData({ ...formData, [currentStepData.field]: value });
  };

  const renderInput = () => {
    switch (currentStepData.type) {
      case 'text':
      case 'number':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type here..."
              placeholderTextColor="#888"
              value={String(formData[currentStepData.field])}
              onChangeText={updateFormData}
              autoFocus={true}
              keyboardType={currentStepData.type === 'number' ? 'numeric' : 'default'}
            />
            <View style={styles.inputLine} />
          </View>
        );
      case 'email':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="your.email@example.com"
              placeholderTextColor="#888"
              value={formData[currentStepData.field]}
              onChangeText={updateFormData}
              autoFocus={true}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.inputLine} />
          </View>
        );
      case 'gender':
        return (
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[ styles.genderOption, formData.gender === 'Male' && styles.genderSelected ]}
              onPress={() => updateFormData('Male')}
            >
              <View style={styles.genderImage}>
                <Image source={require('../assets/boyy.jpg')} style={styles.genderImageStyle} />
              </View>
              <View style={[ styles.radioButton, formData.gender === 'Male' && styles.radioSelected ]} />
              <Text style={styles.genderText}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ styles.genderOption, formData.gender === 'Female' && styles.genderSelected ]}
              onPress={() => updateFormData('Female')}
            >
              <View style={styles.genderImage}>
                <Image source={require('../assets/girll.jpg')} style={styles.genderImageStyle} />
              </View>
              <View style={[ styles.radioButton, formData.gender === 'Female' && styles.radioSelected ]} />
              <Text style={styles.genderText}>Female</Text>
            </TouchableOpacity>
          </View>
        );
      case 'weight': {
        const unit = weightUnit;
        return (
          <View style={styles.measureContainer}>
            <View style={styles.unitToggle}>
              {(['KG', 'LBS']).map((u) => (
                <TouchableOpacity key={u} style={[styles.unitButton, unit === u && styles.unitSelected]} onPress={() => setWeightUnit(u)}>
                  <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputContainer}>
              <TextInput style={styles.textInput} placeholder="Enter weight" placeholderTextColor="#888" keyboardType="numeric" value={String(formData.weight)} onChangeText={updateFormData} autoFocus={true} />
              <View style={styles.inputLine} />
            </View>
            <View style={styles.bmiContainer}>
              <Text style={styles.bmiLabel}>YOUR CURRENT BMI</Text>
              <Text style={styles.bmiValue}>00.0</Text>
              <Text style={styles.bmiMessage}>You may need to do more workout to be better</Text>
            </View>
          </View>
        );
      }
      case 'height': {
        const unit = heightUnit;
        return (
          <View style={styles.heightContainer}>
            <View style={styles.unitToggle}>
              {(['CM', 'FT']).map((u) => (
                <TouchableOpacity key={u} style={[styles.unitButton, unit === u && styles.unitSelected]} onPress={() => setHeightUnit(u)}>
                  <Text style={[styles.unitText, unit === u && styles.unitTextSelected]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputContainer}>
              <TextInput style={styles.textInput} placeholder="Enter height" placeholderTextColor="#888" keyboardType="numeric" value={String(formData.height)} onChangeText={updateFormData} autoFocus={true} />
              <View style={styles.inputLine} />
            </View>
          </View>
        );
      }
      case 'goal':
        return (
          <View style={styles.goalsContainer}>
            {goals.map((goal, index) => (
              <TouchableOpacity key={index} style={[ styles.goalCard, formData.fitnessGoal === goal.title && styles.goalSelected ]} onPress={() => updateFormData(goal.title)}>
                <Text style={styles.goalIcon}>{goal.icon}</Text>
                <View style={styles.goalContent}>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[ styles.progressFill, { width: `${((currentStep + 1) / totalSteps) * 100}%` } ]} />
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.question}>{currentStepData.title}</Text>
        {renderInput()}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.previousButton} onPress={handleBack}>
          <Text style={styles.previousButtonText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.nextButtonText}>{isLastStep ? 'Finish' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000',
    backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDktQktk9aC8_aO96JBFXzdis2IEo1DzGlpZuK1s4av5oWSlAehHsxUxZ5rjzygc0OppXATgwAK2SZ1QIaSLDguEvCTgmNhH0oV8AX44zWbawYjuz28ZQ_6uVbLCeX4sepdvj8ILLY77q75xgdtuU3lfOB0qfmUbBVrnNf1_l-aqjyYISAKO99BF66duHj3mPzukanjr90ZcnZmf1L3fG7hcCdSM85HeYHhnm04EGcCuM3TX3OPrjhzCa6zm_d2sVT0ZFJOofAE-MM')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  backIcon: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#452829',
  },
  skipButton: { 
    paddingHorizontal: 10 
  },
  skipText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 40 
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    color: '#FFF',
  },
  inputContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  textInput: {
    width: '100%',
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    paddingVertical: 12,
  },
  inputLine: { 
    width: '100%', 
    height: 1, 
    backgroundColor: '#FFFFFF', 
    marginTop: 5 
  },
  genderContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%', 
    marginTop: 20 
  },
  genderOption: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    minWidth: 120,
  },
  genderSelected: { 
    borderWidth: 2, 
    borderColor: '#452829' 
  },
  genderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  genderImageStyle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40 
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#452829',
    marginBottom: 10,
  },
  radioSelected: { 
    backgroundColor: '#452829' 
  },
  genderText: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#000000' 
  },
  measureContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 30,
  },
  unitButton: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 6 
  },
  unitSelected: { 
    backgroundColor: '#452829' 
  },
  unitText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000000' 
  },
  unitTextSelected: { 
    color: '#FFFFFF' 
  },
  bmiContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  bmiLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  bmiMessage: {
    fontSize: 14,
    color: '#B2DFDB',
    textAlign: 'center',
  },
  heightContainer: { 
    width: '100%', 
    alignItems: 'center' 
  },
  goalsContainer: { 
    width: '100%', 
    gap: 15 
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalSelected: { 
    backgroundColor: '#452829',
    borderColor: '#452829',
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000000',
    marginBottom: 4,
  },
  goalSelectedText: {
    color: '#FFFFFF',
  },
  goalSubtitle: { 
    fontSize: 14, 
    color: '#6B7280' 
  },
  goalSelectedSubtitle: {
    color: '#D1D5DB',
  },
  buttonContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  previousButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#9CA3AF' 
  },
  skipButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#57595B' 
  },
  nextButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000000' 
  },
});

export default MemberProfile;