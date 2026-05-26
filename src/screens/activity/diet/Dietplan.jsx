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

const Dietplan = ({ navigation }) => {
  const cameraRef = useRef(null);
  const cameraDevice = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput({
    quality: 0.8,
  });

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
  }, [photoOutput]);

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
      
      const dayOfWeek = date.getDay();
      let activeIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const newDays = calendarDays.map((day, idx) => ({
        ...day,
        active: idx === activeIndex,
      }));
      
      for(let i=0; i<7; i++) {
        const offset = i - activeIndex;
        const d = new Date(date);
        d.setDate(date.getDate() + offset);
        newDays[i].date = d.getDate().toString();
      }

      setCalendarDays(newDays);
    }
  };

  const handleIOSDonePress = () => {
    setShowDatePicker(false);
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