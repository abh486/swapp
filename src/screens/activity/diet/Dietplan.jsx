import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Text
  Dimensions,
  TextInput,
  ActivityIndicator,
  Text,
  TouchableOpacity
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../../../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Ionicons';

import DietHeader from './components/DietHeader';
import DietMacros from './components/DietMacros';
import DietBanners from './components/DietBanners';
import DietLogs from './components/DietLogs';
import DietWaterWidget from './components/DietWaterWidget';
import DietCameraModal from './components/DietCameraModal';
import DietDatePickerModal from './components/DietDatePickerModal';
import DietMealModal from './components/DietMealModal';

const { width } = Dimensions.get('window');

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const PLAN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getMondayBasedIndex = (date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const buildCalendarDays = (selectedDate) => {
  const activeIndex = getMondayBasedIndex(selectedDate);

  return WEEKDAY_LABELS.map((label, index) => {
    const dayDate = new Date(selectedDate);
    dayDate.setDate(selectedDate.getDate() + index - activeIndex);

    return {
      label,
      date: String(dayDate.getDate()).padStart(2, '0'),
      active: index === activeIndex,
      month: dayDate.toLocaleDateString('en-US', { month: 'short' }),
    };
  });
};

const Dietplan = ({ navigation }) => {
  const cameraRef = useRef(null);
  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({
    quality: 0.8,
  });

  // --- MODAL & LOG STATE ---
  const [showMealModal, setShowMealModal] = useState(false);

  // --- NUTRITION ENGINE STATES ---
  const [dailySummary, setDailySummary] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isNutritionLoading, setIsNutritionLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' or 'analytics'
  const [newWeight, setNewWeight] = useState('');
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlanDay, setSelectedPlanDay] = useState(() => {
    return PLAN_DAY_NAMES[new Date().getDay()] || 'Monday';
  });

  const fetchNutritionData = useCallback(async (dateToFetch = selectedDate, showLoader = false) => {
    if (showLoader) {
      setIsNutritionLoading(true);
    }
    try {
      const year = dateToFetch.getFullYear();
      const month = String(dateToFetch.getMonth() + 1).padStart(2, '0');
      const day = String(dateToFetch.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      // Fetch user preferences from AsyncStorage to send to the backend
      const [
        savedPreference,
        savedSkipDays,
        savedMeals,
        savedAllergies,
        savedCuisines,
        savedOtherInfo
      ] = await Promise.all([
        AsyncStorage.getItem('diet_preference'),
        AsyncStorage.getItem('diet_skip_days'),
        AsyncStorage.getItem('diet_meals'),
        AsyncStorage.getItem('diet_allergies'),
        AsyncStorage.getItem('diet_cuisines'),
        AsyncStorage.getItem('diet_other_info')
      ]);

      const recommendationsParams = {
        dietPreference: savedPreference || 'Selective Non-Veg',
        skipDays: savedSkipDays ? JSON.parse(savedSkipDays) : ['Monday'],
        meals: savedMeals ? JSON.parse(savedMeals) : ['Lunch', 'Dinner'],
        allergies: savedAllergies ? JSON.parse(savedAllergies) : ['No Known Allergies'],
        cuisines: savedCuisines ? JSON.parse(savedCuisines) : ['USA Food'],
        otherInfo: savedOtherInfo || 'Love extra protein, low calorie',
        generate: 'false'
      };

      const [summaryResponse, recsResponse, analyticsResponse] = await Promise.all([
        apiClient.get(`/summary/daily?date=${formattedDate}`),
        apiClient.get('/recommendations', { params: recommendationsParams }),
        apiClient.get('/analytics')
      ]);

      if (summaryResponse.data?.success) {
        setDailySummary(summaryResponse.data.data);
      }
      if (recsResponse.data?.success) {
        setRecommendation(recsResponse.data.data);
      }
      if (analyticsResponse.data?.success) {
        setAnalyticsData(analyticsResponse.data.data);
      }
    } catch (error) {
      console.warn('[Dietplan] Failed to fetch nutrition/analytics data:', error.message);
    } finally {
      if (showLoader) {
        setIsNutritionLoading(false);
      }
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchNutritionData(selectedDate, false);
    }, [fetchNutritionData, selectedDate])
  );

  useEffect(() => {
    if (!showMealModal) {
      fetchNutritionData(selectedDate, false);
    }
  }, [showMealModal, fetchNutritionData, selectedDate]);

  const handleGenerateWeeklyPlan = useCallback(async () => {
    setIsGeneratingPlan(true);
    try {
      const [
        savedPreference,
        savedSkipDays,
        savedMeals,
        savedAllergies,
        savedCuisines,
        savedOtherInfo
      ] = await Promise.all([
        AsyncStorage.getItem('diet_preference'),
        AsyncStorage.getItem('diet_skip_days'),
        AsyncStorage.getItem('diet_meals'),
        AsyncStorage.getItem('diet_allergies'),
        AsyncStorage.getItem('diet_cuisines'),
        AsyncStorage.getItem('diet_other_info')
      ]);

      const recommendationsParams = {
        dietPreference: savedPreference || 'Selective Non-Veg',
        skipDays: savedSkipDays ? JSON.parse(savedSkipDays) : ['Monday'],
        meals: savedMeals ? JSON.parse(savedMeals) : ['Lunch', 'Dinner'],
        allergies: savedAllergies ? JSON.parse(savedAllergies) : ['No Known Allergies'],
        cuisines: savedCuisines ? JSON.parse(savedCuisines) : ['USA Food'],
        otherInfo: savedOtherInfo || 'Love extra protein, low calorie',
        generate: 'true'
      };

      console.log('[Dietplan] Generating weekly diet plan...');
      const response = await apiClient.get('/recommendations', { params: recommendationsParams });
      if (response.data?.success) {
        setRecommendation(response.data.data);
        Alert.alert('Success', 'Weekly diet plan generated successfully!');
      }
    } catch (error) {
      console.warn('[Dietplan] Failed to generate weekly diet plan:', error.message);
      Alert.alert('Error', 'Failed to generate weekly diet plan.');
    } finally {
      setIsGeneratingPlan(false);
    }
  }, []);


  const handleUpdateWeight = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      Alert.alert('Invalid Input', 'Please enter a valid weight number in kg.');
      return;
    }

    setIsUpdatingWeight(true);
    try {
      const response = await apiClient.post('/weight/update', { weight: parseFloat(newWeight) });
      if (response.data?.success) {
        Alert.alert('Success', 'Weight log recorded and goals updated.');
        setNewWeight('');
        fetchNutritionData();
      }
    } catch (error) {
      console.warn('[Dietplan] Weight update error:', error.message);
      Alert.alert('Error', 'Failed to update weight.');
    } finally {
      setIsUpdatingWeight(false);
    }
  };
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [mealStep, setMealStep] = useState(1);
  const [trackedMealImage, setTrackedMealImage] = useState(null);
  
  // --- AI LOG STATE ---
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('Lunch');
  const [mealDescription, setMealDescription] = useState('');
  const [nutritionData, setNutritionData] = useState({
    mealName: 'Green Luxe Bowl',
    calories: 360,
    protein: 12,
    carbs: 18,
    fats: 8
  });

  // --- CALENDAR STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDays, setCalendarDays] = useState(() => buildCalendarDays(new Date()));

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const handleTrackFood = useCallback(() => {
    navigation.navigate('DietAllLogs');
  }, [navigation]);

  const handleGoToPreferences = useCallback(() => {
    navigation.navigate('DietPreferences');
  }, [navigation]);

  const handleTrackWithCamera = useCallback(() => {
    setShowCameraOverlay(true);
  }, []);

  const handleUploadPhoto = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      async (response) => {
        if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
          const imageAsset = response.assets[0];
          setSelectedImage(imageAsset.uri);
          setMealStep(1);
          setMealQuantity(1);
          setShowCameraOverlay(false);
          setShowMealModal(true);
          setAiLoading(true);

          try {
            console.log('[Dietplan] Uploading picked photo to Cloudinary...');
            const uploadedUrl = await uploadToCloudinary(imageAsset);
            setUploadedImageUrl(uploadedUrl);
            
            console.log('[Dietplan] Triggering AI analysis for:', uploadedUrl);
            const aiResponse = await dispatch(analyzeMealWithAI(uploadedUrl, ''));
            if (aiResponse.success && aiResponse.data) {
              setNutritionData(aiResponse.data);
            } else {
              Alert.alert("AI Error", aiResponse.message || "Failed to analyze image.");
            }
          } catch (err) {
            console.error('[Dietplan] Image library upload/analysis error:', err);
            Alert.alert("Analysis Error", "Failed to upload or analyze the food image.");
          } finally {
            setAiLoading(false);
          }
        }
      }
    );
  }, [dispatch]);

  const handleCameraShot = useCallback(async () => {
    try {
      if (!photoOutput) {
        Alert.alert("Camera Error", "Camera output is not initialized.");
        return;
      }

      // Directly attempt to take the photo using Vision Camera V5 API. 
      const photo = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      
      if (photo && photo.filePath) {
        // Android already prepends 'file://', iOS does not.
        const imagePath = photo.filePath.startsWith('file://') ? photo.filePath : 'file://' + photo.filePath;
        
        setSelectedImage(imagePath);
        setMealStep(1);
        setMealQuantity(1);
        setShowCameraOverlay(false);
        setShowMealModal(true);
        setAiLoading(true);

        try {
          const imageAsset = {
            uri: imagePath,
            type: 'image/jpeg',
            fileName: `photo_${Date.now()}.jpg`
          };
          console.log('[Dietplan] Uploading captured photo to Cloudinary...');
          const uploadedUrl = await uploadToCloudinary(imageAsset);
          setUploadedImageUrl(uploadedUrl);
          
          console.log('[Dietplan] Triggering AI analysis for:', uploadedUrl);
          const aiResponse = await dispatch(analyzeMealWithAI(uploadedUrl, ''));
          if (aiResponse.success && aiResponse.data) {
            setNutritionData(aiResponse.data);
          } else {
            Alert.alert("AI Error", aiResponse.message || "Failed to analyze captured image.");
          }
        } catch (err) {
          console.error('[Dietplan] Camera shot upload/analysis error:', err);
          Alert.alert("Analysis Error", "Failed to upload or analyze the food image.");
        } finally {
          setAiLoading(false);
        }
      } else {
        throw new Error("Captured photo had no file path.");
      }
    } catch (error) {
      Alert.alert(
        "Camera Not Ready", 
        "Please wait a moment for the camera to initialize before taking a photo."
      );
      console.error('Camera capture error:', error);
    }
  }, [photoOutput, dispatch]);

  // --- CALENDAR HANDLER ---
  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !date) {
        return;
      }
    }
    
    if (date) {
      setSelectedDate(date);
      if (Platform.OS !== 'ios') {
        setShowDatePicker(false);
      }
      
      // Automatically switch the weekly diet plan tab to match the selected calendar day
      setSelectedPlanDay(PLAN_DAY_NAMES[date.getDay()]);
      setCalendarDays(buildCalendarDays(date));

      // Trigger daily summary fetch for the new selected date with loader enabled
      fetchNutritionData(date, true);
    }
  };

  const handleIOSDonePress = () => {
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {isNutritionLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading nutrition details...</Text>
          <Text style={styles.loadingSubtext}>Please wait a moment...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        
        <DietHeader 
          calendarDays={calendarDays} 
          handleCalendarPress={handleCalendarPress} 
          dailySummary={dailySummary}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setCalendarDays={setCalendarDays}
          PLAN_DAY_NAMES={PLAN_DAY_NAMES}
          setSelectedPlanDay={setSelectedPlanDay}
          fetchNutritionData={fetchNutritionData}
          buildCalendarDays={buildCalendarDays}
          handleTrackFood={handleTrackFood}
          handleGoToPreferences={handleGoToPreferences}
        />
            <DietMacros 
              handleTrackWithCamera={handleTrackWithCamera} 
              dailySummary={dailySummary} 
            />

            <DietWaterWidget dailySummary={dailySummary} />

            {!recommendation ? (
              <View style={styles.weeklyPlanSection}>
                <LinearGradient
                  colors={['#1a1c23', '#0f1013']}
                  style={[styles.weeklyPlanCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <ActivityIndicator size="small" color="#e74c3c" />
                  <Text style={[styles.planTitle, { marginTop: 12, marginLeft: 0 }]}>LOADING DIET PLAN...</Text>
                  <Text style={styles.planSubtitle}>Fetching your weekly nutritional program...</Text>
                </LinearGradient>
              </View>
            ) : (
              isGeneratingPlan ? (
                <View style={styles.weeklyPlanSection}>
                  <LinearGradient
                    colors={['#1a1c23', '#0f1013']}
                    style={[styles.weeklyPlanCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <ActivityIndicator size="large" color="#e74c3c" />
                    <Text style={[styles.planTitle, { marginTop: 12, marginLeft: 0 }]}>GENERATING WEEKLY DIET PLAN...</Text>
                    <Text style={styles.planSubtitle}>This runs Gemma 3 locally and may take a moment to compute.</Text>
                  </LinearGradient>
                </View>
              ) : (
                recommendation.weeklyPlan ? renderWeeklyDietPlan() : (
                  <View style={styles.weeklyPlanSection}>
                    <LinearGradient
                      colors={['#1a1c23', '#0f1013']}
                      style={[styles.weeklyPlanCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="restaurant-outline" size={32} color="#e74c3c" style={{ marginBottom: 12 }} />
                      <Text style={[styles.planTitle, { marginLeft: 0, fontSize: 14, marginBottom: 6 }]}>NO DIET PLAN GENERATED YET</Text>
                      <Text style={[styles.planSubtitle, { textAlign: 'center', marginHorizontal: 20, marginBottom: 16 }]}>
                        Customize your preferences and click below to generate your weekly diet plan using AI.
                      </Text>
                      <TouchableOpacity 
                        style={[styles.submitButton, { backgroundColor: '#e74c3c', width: '80%', height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 0 }]}
                        onPress={handleGenerateWeeklyPlan}
                      >
                        <Text style={[styles.submitButtonText, { fontSize: 14, fontWeight: 'bold' }]}>Generate Weekly Diet Plan</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                )
              )
            )}

            <DietLogs 
              trackedMealImage={trackedMealImage} 
              handleTrackFood={handleTrackFood} 
              navigation={navigation}
            />

        </ScrollView>
      )}

      {/* The ref is passed down here */}
      <DietCameraModal 
        ref={cameraRef}
        showCameraOverlay={showCameraOverlay}
        setShowCameraOverlay={setShowCameraOverlay}
        cameraDevice={cameraDevice}
        handleCameraShot={handleCameraShot}
        handleUploadPhoto={handleUploadPhoto}
        hasPermission={hasPermission}
        requestPermission={requestPermission}
        photoOutput={photoOutput}
      />

      <DietDatePickerModal 
        showDatePicker={showDatePicker}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        handleIOSDonePress={handleIOSDonePress}
      />

      <DietMealModal 
        showMealModal={showMealModal}
        setShowMealModal={setShowMealModal}
        mealStep={mealStep}
        setMealStep={setMealStep}
        selectedImage={selectedImage}
        mealQuantity={mealQuantity}
        setMealQuantity={setMealQuantity}
        nutritionData={nutritionData}
        setNutritionData={setNutritionData}
        aiLoading={aiLoading}
        setAiLoading={setAiLoading}
        uploadedImageUrl={uploadedImageUrl}
        setUploadedImageUrl={setUploadedImageUrl}
        selectedMealType={selectedMealType}
        setSelectedMealType={setSelectedMealType}
        mealDescription={mealDescription}
        setMealDescription={setMealDescription}
        setTrackedMealImage={setTrackedMealImage}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050505',
    paddingHorizontal: 40,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: -16,
    zIndex: 10,
  },
  navToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  navIcon: {
    marginHorizontal: 4,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: -16,
    zIndex: 10,
    marginBottom: 20,
  },
  navToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  activeTabText: {
    color: '#FFF',
  },
  tabSeparator: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  recommendationContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  recommendationCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  recHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recHeaderTitle: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  recMealText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    lineHeight: 18,
  },
  recBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recBadgeText: {
    color: '#AAA',
    fontSize: 11,
    fontWeight: '600',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  kpiSub: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  analyticsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardSectionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
  },
  scoreValue: {
    color: '#e74c3c',
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  dividerLine: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressRow: {
    marginBottom: 6,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    color: '#DDD',
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartWrapper: {
    marginTop: 4,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartChangeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 110,
    paddingRight: 10,
  },
  chartArea: {
    flex: 1,
  },
  axisLabelText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '600',
  },
  emptyChartContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  inputInstructions: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitButton: {
    backgroundColor: '#e74c3c',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  weeklyPlanSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  weeklyPlanCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planHeaderRow: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  planSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  dayTabsWrapper: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeDayTab: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  dayTabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeDayTabText: {
    color: '#FFF',
  },
  mealsList: {
    marginTop: 4,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  mealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTypeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mealCaloriesText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mealDescriptionText: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  macroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  macroBadgeText: {
    color: '#AAA',
    fontSize: 10,
    fontWeight: '600',
  },
  generatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  generatingText: {
    color: '#e74c3c',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Dietplan;
