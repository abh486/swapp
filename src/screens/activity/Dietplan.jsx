import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
  Alert,
  DatePickerIOS, // Platform specific import (or DateTimePicker for React Native 0.60+)
  Platform
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import your local bottle image here
import bottleImage from '../../assets/image/bottle.png'; 

const { width } = Dimensions.get('window');
const VisionCameraModule = (() => {
  try {
    return require('react-native-vision-camera');
  } catch (error) {
    return null;
  }
})();
const VisionCameraView = VisionCameraModule?.Camera || null;

const Dietplan = ({ navigation }) => {
  const cameraRef = useRef(null);
  const [cameraDevice, setCameraDevice] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mealQuantity, setMealQuantity] = useState(1);
  const [mealStep, setMealStep] = useState(1);
  const [trackedMealImage, setTrackedMealImage] = useState(null);
  const [detectedMealName, setDetectedMealName] = useState('Green Luxe Bowl');

  // --- CALENDAR STATE ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([
    { label: 'M', date: '27', active: false },
    { label: 'T', date: '28', active: false },
    { label: 'W', date: '29', active: false },
    { label: 'T', date: '30', active: false },
    { label: 'F', date: '01', active: true },
    { label: 'S', date: '02', active: false },
    { label: 'S', date: '03', active: false },
  ]);

  useEffect(() => {
    const setupVisionCamera = async () => {
      if (!VisionCameraModule?.Camera) return;
      const cameraApi = VisionCameraModule.Camera;

      try {
        const devices = cameraApi.getAvailableCameraDevices?.() || [];
        const backCamera = devices.find((device) => device.position === 'back');
        setCameraDevice(backCamera || devices[0] || null);
      } catch (error) {
        setCameraDevice(null);
      }

      try {
        const permission = await cameraApi.requestCameraPermission?.();
        if (permission && permission !== 'granted') {
          Alert.alert('Camera Permission', 'Please allow camera permission to track meals.');
        }
      } catch (error) {
        // fallback camera picker will be used automatically
      }
    };

    setupVisionCamera();
  }, []);

  const handleTrackFood = useCallback(() => {
    navigation.navigate('DietAllLogs');
  }, [navigation]);

  const handleTrackWithCamera = useCallback(() => {
    if (!VisionCameraView) {
      launchCamera(
        { mediaType: 'photo', quality: 0.8, cameraType: 'back', saveToPhotos: false },
        (response) => {
          if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
            setSelectedImage(response.assets[0].uri);
            setMealStep(1);
            setMealQuantity(1);
            setShowMealModal(true);
          }
        }
      );
      return;
    }
    setShowCameraOverlay(true);
  }, []);

  const handleCameraShot = useCallback(() => {
    const capturePhoto = async () => {
      if (!cameraRef.current) return;
      try {
        if (!VisionCameraView || !cameraDevice) {
          launchCamera(
            { mediaType: 'photo', quality: 0.8, cameraType: 'back', saveToPhotos: false },
            (response) => {
              if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
                setSelectedImage(response.assets[0].uri);
                setMealStep(1);
                setMealQuantity(1);
                setShowCameraOverlay(false);
                setShowMealModal(true);
              }
            }
          );
          return;
        }

        const photo = await cameraRef.current.takePhoto();
        if (photo?.uri) {
          setSelectedImage(photo.uri);
          setMealStep(1);
          setMealQuantity(1);
          setShowCameraOverlay(false);
          setShowMealModal(true);
        }
      } catch (error) {
        // Keep silent here to avoid interrupting the camera flow.
      }
    };
    capturePhoto();
  }, []);

  // --- CALENDAR HANDLER ---
  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    // For iOS DatePickerIOS, date is the second argument. For Android, event.type is important.
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }
    }
    
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
      
      // Update UI to reflect selection logic (Simple implementation for visual feedback)
      const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
      const dayOfMonth = date.getDate();
      
      // Map 0(Sun)-6(Sat) to our 0(Mon)-6(Sun) array index
      // Array: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
      let activeIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const newDays = calendarDays.map((day, idx) => ({
        ...day,
        active: idx === activeIndex,
        date: dayOfMonth.toString(), // Update the number shown to match selection
      }));
      
      // Update dates relative to selected day for surrounding days (visual polish)
      // This is a simplified logic to shift numbers visually around the selected date
      for(let i=0; i<7; i++) {
        const offset = i - activeIndex;
        const d = new Date(date);
        d.setDate(date.getDate() + offset);
        newDays[i].date = d.getDate().toString();
      }

      setCalendarDays(newDays);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* TOP CURVED BLACK SECTION */}
        <View style={styles.topCurveContainer}>
          <View style={styles.blackCurve} />
          
          <SafeAreaView style={styles.topContent}>
            {/* Header Area */}
            <View style={styles.headerArea}>
              <View style={styles.flamePill}>
                <MaterialCommunityIcons name="fire" size={16} color="#FF9800" />
                <Text style={styles.flamePillText}>1</Text>
              </View>
            </View>

            {/* Calendar Row */}
            <TouchableOpacity style={styles.calendarRow} onPress={handleCalendarPress} activeOpacity={0.7}>
              {calendarDays.map((day, idx) => (
                <View key={idx} style={styles.dayContainer}>
                  <View style={[styles.dayCircle, day.active && styles.activeDayCircle]}>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                  </View>
                  <Text style={styles.dateLabel}>{day.date}</Text>
                </View>
              ))}
            </TouchableOpacity>

            {/* Main Stats Row */}
            <View style={styles.statsRow}>
              {/* Burn Stat */}
              <View style={styles.sideStat}>
                <MaterialCommunityIcons name="fire" size={28} color="#FF9800" />
                <Text style={styles.sideStatValue}>690</Text>
                <Text style={styles.sideStatLabel}>burn</Text>
              </View>

              {/* Center Circle */}
              <View style={styles.centerCircleContainer}>
                <View style={styles.circleBackground} />
                <View style={styles.circleOrangeArc} />
                <View style={styles.circleGreenArc} />
                
                <View style={styles.circleInner}>
                  <Text style={styles.centerValue}>1645</Text>
                  <Text style={styles.centerLabel}>Kcal available</Text>
                  <View style={styles.dotsRow}>
                    <View style={styles.dotActive} />
                    <View style={styles.dotInactive} />
                  </View>
                </View>
              </View>

              {/* Eaten Stat */}
              <View style={styles.sideStat}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#4CAF50" style={{marginBottom: 4}} />
                <Text style={styles.sideStatValue}>536</Text>
                <Text style={styles.sideStatLabel}>eaten</Text>
              </View>
            </View>

            {/* Goal Text */}
            <View style={styles.goalContainer}>
              <Text style={styles.goalValue}>2131</Text>
              <Text style={styles.goalLabel}>Kcal Goal</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Navigation Toggle Overlap */}
        <View style={styles.toggleContainer}>
          <View style={styles.navToggle}>
            <Icon name="chevron-back" size={18} color="#FFF" style={styles.navIcon} />
            <Icon name="chevron-forward" size={18} color="#FFF" style={styles.navIcon} />
          </View>
        </View>

        {/* BOTTOM WHITE/GRAY SECTION */}
        <View style={styles.bottomSection}>
          <View style={styles.trackFoodHeader}>
            <View>
              <Text style={styles.trackFoodTitle}>Track Food</Text>
              <Text style={styles.trackFoodSubtitle}>Eat 1,000 Cal</Text>
            </View>
            <View style={styles.trackFoodActions}>
              <TouchableOpacity style={styles.iconButton} onPress={handleTrackWithCamera}>
                <Icon name="camera" size={28} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButtonDark}>
                <Icon name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Macros Grid */}
          <View style={styles.macrosGrid}>
            <View style={styles.macroCol}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Protein:</Text>
                <Text style={styles.macroValue}>0%</Text>
              </View>
              <View style={styles.macroBar} />
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Fats:</Text>
                <Text style={styles.macroValue}>0%</Text>
              </View>
              <View style={styles.macroBar} />
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Carbs:</Text>
                <Text style={styles.macroValue}>0%</Text>
              </View>
              <View style={styles.macroBar} />
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroLabel}>Fibre:</Text>
                <Text style={styles.macroValue}>0%</Text>
              </View>
              <View style={styles.macroBar} />
            </View>
          </View>
        </View>

        {/* BANNERS SECTION - Updated Styles to match image */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannersScroll}>
          {/* Card 1: Dark Gray */}
          <View style={styles.bannerDark}>
            <View style={styles.bannerContentWrapper}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>FLAT 25% OFF</Text>
                <Text style={styles.bannerSubtitle}>On Vitamin D3</Text>
                <Text style={styles.bannerCode}>Use code: <Text style={styles.bannerCodeBold}>Swapp20</Text></Text>
                <TouchableOpacity style={styles.bannerButton}>
                  <Text style={styles.bannerButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
              
              {/* Updated Bottle Image */}
              <View style={styles.bannerBottleImageContainer}>
                 <Image source={bottleImage} style={styles.bannerBottleImage} resizeMode="contain" />
              </View>
            </View>
          </View>
          
          {/* Card 2: Light Gray */}
          <View style={styles.bannerLight}>
            <View style={styles.bannerContentWrapper}>
              <View style={styles.bannerTextContainer}>
                <Text style={[styles.bannerTitle, {color: '#000'}]}>FLAT 25% OFF</Text>
                <Text style={[styles.bannerSubtitle, {color: '#333'}]}>On Vitamin D3</Text>
                <Text style={[styles.bannerCode, {color: '#555'}]}>Use code: <Text style={[styles.bannerCodeBold, {color: '#000'}]}>Swapp20</Text></Text>
                <TouchableOpacity style={[styles.bannerButton, {backgroundColor: '#000'}]}>
                  <Text style={[styles.bannerButtonText, {color: '#FFF'}]}>Shop Now</Text>
                </TouchableOpacity>
              </View>

              {/* Updated Bottle Image */}
              <View style={styles.bannerBottleImageContainer}>
                 <Image source={bottleImage} style={styles.bannerBottleImage} resizeMode="contain" />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* TODAY'S LOGS SECTION - Updated to match image description */}
        <View style={styles.logsSection}>
          <Text style={styles.logsTitle}>TODAY'S LOGS</Text>
          
          {trackedMealImage ? (
            /* ===== POPULATED STATE ===== */
            <View style={styles.logsCardPopulated}>
              {/* Breakfast Empty Card */}
              <View style={styles.trackedLogCard}>
                <View style={styles.mealTypePill}>
                  <Text style={styles.mealTypeText}>Breakfast</Text>
                </View>
                <Text style={styles.emptyMealText}>empty</Text>
                <View style={styles.emptyImageCircle}>
                  <Icon name="camera" size={24} color="#000" />
                </View>
              </View>

              {/* Lunch Tracked Card */}
              <View style={styles.trackedLogCard}>
                <View style={styles.lunchHeaderRow}>
                  <View style={styles.mealTypePill}>
                    <Text style={styles.mealTypeText}>Lunch</Text>
                  </View>
                  <Text style={styles.mealTimeText}>7:30 AM</Text>
                </View>

                <View style={styles.mealItemList}>
                  <View style={styles.mealItemRow}>
                    <Text style={styles.mealItemName}>oe</Text>
                    <Text style={styles.mealItemCals}>425</Text>
                  </View>
                  <View style={styles.mealItemRow}>
                    <Text style={styles.mealItemName}>egg omlat</Text>
                    <Text style={styles.mealItemCals}>425</Text>
                  </View>
                  <View style={styles.mealItemRow}>
                    <Text style={styles.mealItemName}>Sory breakfast</Text>
                    <Text style={styles.mealItemCals}>425</Text>
                  </View>
                </View>

                <View style={styles.mealMacrosLine} />
                
                <View style={styles.mealMacrosRow}>
                  <Text style={styles.mealMacroVal}>425</Text>
                  <Text style={styles.mealMacroVal}>15g</Text>
                  <Text style={styles.mealMacroVal}>9g</Text>
                  <Text style={styles.mealMacroVal}>74g</Text>
                  <Text style={styles.mealMacroVal}>6g</Text>
                </View>
                
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Image source={{ uri: trackedMealImage }} style={styles.trackedMealImage} />
              </View>
            </View>
          ) : (
            /* ===== EMPTY STATE - MATCHING IMAGE DESCRIPTION ===== */
            <View style={styles.logsCardEmpty}>
              <Text style={styles.logsEmptyText}>NOTHING TRACKED YET !</Text>
              <TouchableOpacity style={styles.logsTrackButton} onPress={handleTrackFood}>
                <Text style={styles.logsTrackButtonText}>TRACK NOW</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* FLOATING WATER WIDGET */}
      <View style={styles.waterWidget}>
        <View style={styles.waterInfo}>
          <View style={styles.waterTitleRow}>
            <Text style={styles.waterTitle}>Water </Text>
            <Text style={styles.waterAmount}>0.9L </Text>
            <Text style={styles.waterPercent}>(75%)</Text>
          </View>
          <Text style={styles.waterSubtitle}>Recomended until now 1.4L</Text>
          
          <View style={styles.dropsRow}>
            {[1, 2, 3, 4, 5, 6].map((drop, idx) => (
              <MaterialCommunityIcons 
                key={idx} 
                name="water" 
                size={16} 
                color={idx < 4 ? '#4C84FF' : '#555'} 
                style={styles.waterDrop}
              />
            ))}
          </View>
        </View>

        <View style={styles.waterControls}>
          <TouchableOpacity style={styles.waterBtn}>
            <Icon name="remove" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.waterOptions}>
            <Text style={styles.waterOptionInactive}>0.1L</Text>
            <Text style={styles.waterOptionActive}>0.2L</Text>
            <Text style={styles.waterOptionInactive}>0.3L</Text>
          </View>
          <TouchableOpacity style={styles.waterBtn}>
            <Icon name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showCameraOverlay} animationType="slide" transparent={true}>
        <View style={styles.cameraOverlayContainer}>
          <SafeAreaView style={styles.cameraSafeArea}>
            <View style={styles.cameraTopBar}>
              <TouchableOpacity style={styles.cameraTopIcon} onPress={() => setShowCameraOverlay(false)}>
                <Icon name="chevron-back" size={26} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraPreviewOuter}>
              <View style={styles.cameraPreviewFrame}>
                {cameraDevice && VisionCameraView ? (
                  <VisionCameraView
                    ref={cameraRef}
                    style={styles.cameraPreviewCamera}
                    device={cameraDevice}
                    isActive={showCameraOverlay}
                    photo={true}
                  />
                ) : (
                  <View style={styles.cameraLoadingState}>
                    <Text style={styles.cameraLoadingText}>Loading camera...</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cameraBottomBar}>
              <TouchableOpacity style={styles.cameraSideBtn}>
                <Icon name="images-outline" size={24} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cameraCaptureOuter} onPress={handleCameraShot}>
                <View style={styles.cameraCaptureInner} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.cameraSideBtn}>
                <Icon name="search-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* CALENDAR MODAL */}
      <Modal visible={showDatePicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.datePickerContainer}>
            {Platform.OS === 'ios' ? (
              <DatePickerIOS
                date={selectedDate}
                onDateChange={setSelectedDate}
                mode="date"
              />
            ) : (
              // Note: Android DatePicker requires a specific import or library.
              // This is a placeholder. In production, use @react-native-community/datetimepicker
              <Text style={styles.datePickerText}>Android Date Picker Placeholder</Text>
            )}
            
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={() => handleDateChange(null, selectedDate)}
            >
              <Text style={styles.datePickerButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MEAL TRACKED MODAL */}
      <Modal visible={showMealModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            {/* Top Bar */}
            <View style={styles.modalHeader}>
              <View style={{ width: 40 }} />
              <View style={styles.headerCheckContainer}>
                {mealStep === 2 && (
                  <View style={styles.headerCheck}>
                    <MaterialCommunityIcons name="check-circle" size={28} color="#4CAF50" />
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => { setShowMealModal(false); setMealStep(1); }} style={styles.modalCloseBtn}>
                <Icon name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Meal Tracked !</Text>

            <View style={styles.modalContentContainer}>
              <View style={[styles.modalBottomSheet, mealStep === 2 && styles.modalBottomSheetExpanded]}>
                {/* Image Overlap */}
                <View style={styles.modalImageWrapper}>
                  {selectedImage && <Image source={{ uri: selectedImage }} style={styles.modalImage} />}
                  {mealStep === 1 && (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>

                {/* Controls Row */}
                <View style={styles.modalControlsRow}>
                  <TouchableOpacity style={styles.lunchDropdown}>
                    <Text style={styles.lunchDropdownText}>Lunch</Text>
                    <Icon name="chevron-down" size={16} color="#FFF" />
                  </TouchableOpacity>

                  <View style={styles.quantitySelector}>
                    <TouchableOpacity onPress={() => setMealQuantity(Math.max(1, mealQuantity - 1))}>
                      <Text style={styles.quantityBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{mealQuantity}</Text>
                    <TouchableOpacity onPress={() => setMealQuantity(mealQuantity + 1)}>
                      <Text style={styles.quantityBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Meal Info */}
                <Text style={styles.mealName}>{detectedMealName}</Text>
                <View style={styles.caloriesRow}>
                  <Text style={styles.caloriesText}>🔥 Calories  360</Text>
                </View>

                {mealStep === 1 ? (
                  <>
                    {/* Move Meal Options */}
                    <View style={styles.moveMealCard}>
                      <Text style={styles.moveMealTitle}>Where do you want to move this meal?</Text>
                      
                      {['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner', 'Add Custom Food'].map((option, index) => (
                        <TouchableOpacity key={index} style={styles.moveMealOption} onPress={() => setMealStep(2)}>
                          <Text style={styles.moveMealOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowMealModal(false); setMealStep(1); }}>
                      <Text style={styles.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Step 2: Macros and Ingredients */}
                    <View style={styles.macrosCardContainer}>
                      <View style={[styles.macroDetailCard, { backgroundColor: '#D67C30' }]}>
                        <Text style={styles.macroDetailValue}>18g</Text>
                        <Text style={styles.macroDetailLabel}>Carbs</Text>
                        <View style={styles.macroRingContainer}>
                           <View style={styles.macroRingOuter}>
                             <View style={styles.macroRingInner} />
                           </View>
                        </View>
                      </View>
                      <View style={[styles.macroDetailCard, { backgroundColor: '#3E8EB1' }]}>
                        <Text style={styles.macroDetailValue}>8g</Text>
                        <Text style={styles.macroDetailLabel}>Fat</Text>
                        <View style={styles.macroRingContainer}>
                           <View style={styles.macroRingOuter}>
                             <View style={styles.macroRingInner} />
                           </View>
                        </View>
                      </View>
                      <View style={[styles.macroDetailCard, { backgroundColor: '#4AA97D' }]}>
                        <Text style={styles.macroDetailValue}>12g</Text>
                        <Text style={styles.macroDetailLabel}>Protein</Text>
                        <View style={styles.macroRingContainer}>
                           <View style={styles.macroRingOuter}>
                             <View style={styles.macroRingInner} />
                           </View>
                        </View>
                      </View>
                      <View style={[styles.macroDetailCard, { backgroundColor: '#826EEA' }]}>
                        <Text style={styles.macroDetailValue}>180</Text>
                        <Text style={styles.macroDetailLabel}>Kcal</Text>
                        <View style={styles.macroRingContainer}>
                           <View style={styles.macroRingOuter}>
                             <View style={styles.macroRingInner} />
                           </View>
                        </View>
                      </View>
                    </View>

                    <View style={styles.ingredientsContainer}>
                      {[
                        { name: 'Tomato', cals: '30 Cal' },
                        { name: 'Lettuce', cals: '50 Cal' },
                        { name: 'Avocado', cals: '120 Cal' }
                      ].map((item, i) => (
                        <View key={i} style={styles.ingredientRow}>
                          <View>
                            <Text style={styles.ingredientName}>{item.name}</Text>
                            <Text style={styles.ingredientCals}>{item.cals}</Text>
                          </View>
                          <View style={styles.ingredientActions}>
                            <TouchableOpacity style={styles.ingredientActionBtn}>
                              <Icon name="pencil-outline" size={20} color="#555" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.ingredientActionBtn}>
                              <Icon name="trash-outline" size={20} color="#555" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity 
                      style={[styles.modalDoneBtn, { marginTop: 10, marginBottom: 20 }]} 
                      onPress={() => { 
                        setTrackedMealImage(selectedImage);
                        setShowMealModal(false); 
                        setMealStep(1); 
                      }}
                    >
                      <Text style={styles.modalDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}

              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  topCurveContainer: {
    width: width,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  blackCurve: {
    position: 'absolute',
    top: 0,
    width: width * 1.5,
    height: '100%',
    backgroundColor: '#050505',
    borderBottomLeftRadius: width * 0.75,
    borderBottomRightRadius: width * 0.75,
  },
  topContent: {
    width: width,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerArea: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  flamePill: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  flamePillText: {
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#000',
    fontSize: 14,
  },
  calendarRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeDayCircle: {
    borderColor: '#FF5722',
    borderStyle: 'solid',
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
  },
  dayLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  dateLabel: {
    color: '#FFF',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 30,
  },
  sideStat: {
    alignItems: 'center',
    width: 70,
  },
  sideStatValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sideStatLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  centerCircleContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: '#FFF',
  },
  circleOrangeArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: 'transparent',
    borderLeftColor: '#FF5722',
    borderTopColor: '#FF5722',
    transform: [{ rotate: '-25deg' }],
  },
  circleGreenArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: 'transparent',
    borderRightColor: '#4CAF50',
    transform: [{ rotate: '-25deg' }],
  },
  circleInner: {
    alignItems: 'center',
  },
  centerValue: {
    color: '#4CAF50',
    fontSize: 40,
    fontWeight: 'bold',
  },
  centerLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  goalContainer: {
    alignItems: 'center',
  },
  goalValue: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 40,
  },
  goalLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: -2,
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
  bottomSection: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  trackFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  trackFoodTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  trackFoodSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  trackFoodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconButtonDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCol: {
    width: '45%',
    marginBottom: 24,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  macroBar: {
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    width: '100%',
  },
  bannersScroll: {
    paddingHorizontal: 16,
    marginTop: 30,
    paddingBottom: 10,
  },
  // --- Banner Styles Updated to Match Image ---
  bannerDark: {
    width: 280,
    height: 180,
    backgroundColor: '#1F1F1F', // Darker gray as per image
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
  },
  bannerLight: {
    width: 280,
    height: 180,
    backgroundColor: '#E0E0E0', // Lighter gray as per image
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
  },
  bannerContentWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  bannerTextContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 16,
  },
  bannerCode: {
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
  },
  bannerCodeBold: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bannerButton: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Bottle Image Container
  bannerBottleImageContainer: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBottleImage: {
    width: 80, 
    height: 130,
  },
  
  // --- Logs Section Updated to Match Image ---
  logsSection: {
    paddingHorizontal: 16,
    marginTop: 35,
    marginBottom: 50,
  },
  logsTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  logsCardEmpty: {
    backgroundColor: '#F5F5F5', // Light gray background matching the image
    borderRadius: 16,
    height: 200, // Specific height to match image
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1, // Adding subtle border for definition
    borderColor: '#E0E0E0'
  },
  logsEmptyText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600', // Bolder text
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  logsTrackButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  logsTrackButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logsCardPopulated: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  trackedLogCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    marginBottom: 15,
    padding: 15,
    minHeight: 110,
    position: 'relative',
    overflow: 'visible',
  },
  mealTypePill: {
    backgroundColor: '#A5D6A7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mealTypeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lunchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingRight: 60,
  },
  mealTimeText: {
    color: '#888',
    fontSize: 10,
  },
  mealItemList: {
    marginBottom: 10,
    width: '60%',
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealItemName: {
    color: '#000',
    fontSize: 10,
    fontWeight: '500',
  },
  mealItemCals: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mealMacrosLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '75%',
    marginBottom: 8,
  },
  mealMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%',
    marginBottom: 10,
  },
  mealMacroVal: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  viewDetailsText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 15,
    right: 25,
  },
  trackedMealImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
  },
  emptyMealText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
  },
  emptyImageCircle: {
    position: 'absolute',
    right: -15,
    top: '50%',
    marginTop: -45,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    zIndex: 10,
  },
  waterWidget: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 35,
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  waterInfo: {
    flex: 1,
  },
  waterTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  waterTitle: {
    color: '#4C84FF',
    fontSize: 18,
    fontWeight: '600',
  },
  waterAmount: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  waterPercent: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  waterSubtitle: {
    color: '#666',
    fontSize: 10,
    marginBottom: 10,
  },
  dropsRow: {
    flexDirection: 'row',
  },
  waterDrop: {
    marginRight: 6,
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4C84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterOptions: {
    marginHorizontal: 12,
    alignItems: 'center',
  },
  waterOptionInactive: {
    color: '#666',
    fontSize: 12,
    marginVertical: 2,
  },
  waterOptionActive: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerCheckContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 24,
  },
  headerCheck: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 1,
  },
  modalCloseBtn: {
    padding: 8,
    width: 40,
    alignItems: 'flex-end',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  modalContentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBottomSheet: {
    backgroundColor: '#D9D9D9',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 0,
    marginTop: 150,
  },
  modalBottomSheetExpanded: {
    marginTop: 80,
  },
  modalImageWrapper: {
    alignSelf: 'center',
    marginTop: -115,
    marginBottom: 0,
    position: 'relative',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalImage: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 4,
    borderColor: '#555',
  },
  checkBadge: {
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 2,
  },
  modalControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    marginTop: -70,
    zIndex: 1,
  },
  lunchDropdown: {
    backgroundColor: '#050505',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lunchDropdownText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 6,
  },
  quantitySelector: {
    backgroundColor: '#050505',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quantityBtnText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  quantityValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  mealName: {
    color: '#000',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    marginTop: 10,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  caloriesText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  moveMealCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 15,
  },
  moveMealTitle: {
    color: '#777',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  moveMealOption: {
    paddingVertical: 14,
  },
  moveMealOptionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#000',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDoneBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  macrosCardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  macroDetailCard: {
    width: '23%',
    height: 110,
    borderRadius: 15,
    paddingTop: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  macroDetailValue: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  macroDetailLabel: {
    color: '#000',
    fontSize: 12,
    marginBottom: 8,
  },
  macroRingContainer: {
    marginTop: 'auto',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRingOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRingInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  ingredientsContainer: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  ingredientName: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  ingredientCals: {
    color: '#666',
    fontSize: 12,
  },
  ingredientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientActionBtn: {
    marginLeft: 18,
  },
  cameraOverlayContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraSafeArea: {
    flex: 1,
  },
  cameraTopBar: {
    paddingHorizontal: 14,
    paddingTop: 6,
  },
  cameraTopIcon: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPreviewOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  cameraPreviewFrame: {
    width: '100%',
    height: '62%',
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: '#E8E8E8',
    borderWidth: 1.5,
    backgroundColor: '#1A1A1A',
  },
  cameraPreviewCamera: {
    width: '100%',
    height: '100%',
  },
  cameraLoadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  cameraLoadingText: {
    color: '#EEE',
    fontSize: 14,
  },
  cameraBottomBar: {
    height: 150,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    paddingBottom: 18,
  },
  cameraSideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#D9D9D9',
  },
  // --- Date Picker Styles ---
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 18,
    marginVertical: 20,
    color: '#000',
  },
  datePickerButton: {
    marginTop: 15,
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  datePickerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Dietplan;