import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
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
const VisionCameraView = Camera;

const Dietplan = ({ navigation }) => {
  const cameraRef = useRef(null);
  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

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
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

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

  const handleUploadPhoto = useCallback(() => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
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
  }, []);

  const handleCameraShot = useCallback(async () => {
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
      if (photo?.path) {
        setSelectedImage('file://' + photo.path);
        setMealStep(1);
        setMealQuantity(1);
        setShowCameraOverlay(false);
        setShowMealModal(true);
      }
    } catch (error) {
      // Keep silent here to avoid interrupting the camera flow.
    }
  }, [cameraDevice]);

  // --- CALENDAR HANDLER ---
  const handleCalendarPress = () => {
    setShowDatePicker(true);
  };

  // Fixed: Safely handle null events and removed event.type check that caused the crash
  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed' || !date) {
        return;
      }
    }
    
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'ios') {
        // Keep modal open on iOS while scrolling the wheel, user presses "Done" to close
      } else {
        setShowDatePicker(false);
      }
      
      // Update UI to reflect selection logic
      const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
      const dayOfMonth = date.getDate();
      
      // Map 0(Sun)-6(Sat) to our 0(Mon)-6(Sun) array index
      let activeIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const newDays = calendarDays.map((day, idx) => ({
        ...day,
        active: idx === activeIndex,
      }));
      
      // Update dates relative to selected day for surrounding days
      for(let i=0; i<7; i++) {
        const offset = i - activeIndex;
        const d = new Date(date);
        d.setDate(date.getDate() + offset);
        newDays[i].date = d.getDate().toString();
      }

      setCalendarDays(newDays);
    }
  };

  // Function specifically for the iOS "Done" button inside the custom Modal
  const handleIOSDonePress = () => {
    setShowDatePicker(false);
    // State is already updated in real-time by handleDateChange as the user scrolls the wheel
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
        
        <DietHeader 
          calendarDays={calendarDays} 
          handleCalendarPress={handleCalendarPress} 
        />

        {/* Navigation Toggle Overlap */}
        <View style={styles.toggleContainer}>
          <View style={styles.navToggle}>
            <Icon name="chevron-back" size={18} color="#FFF" style={styles.navIcon} />
            <Icon name="chevron-forward" size={18} color="#FFF" style={styles.navIcon} />
          </View>
        </View>

        <DietMacros handleTrackWithCamera={handleTrackWithCamera} />

        <DietBanners />

        <DietLogs 
          trackedMealImage={trackedMealImage} 
          handleTrackFood={handleTrackFood} 
        />

      </ScrollView>

      <DietWaterWidget />

      <DietCameraModal 
        showCameraOverlay={showCameraOverlay}
        setShowCameraOverlay={setShowCameraOverlay}
        cameraDevice={cameraDevice}
        cameraRef={cameraRef}
        VisionCameraView={VisionCameraView}
        handleCameraShot={handleCameraShot}
        handleUploadPhoto={handleUploadPhoto}
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
        detectedMealName={detectedMealName}
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
});

export default Dietplan;