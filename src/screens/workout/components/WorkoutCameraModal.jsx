import { GlobalLoader } from '../../../components/GlobalLoader';
import React, { forwardRef } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Text} from 'react-native';
import { Camera } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/Ionicons';

// CRITICAL: We use forwardRef so the parent (FastWorkoutActiveScreen.jsx) can access the Camera's methods if needed
const WorkoutCameraModal = forwardRef(({ 
  showCameraOverlay, 
  setShowCameraOverlay, 
  cameraDevice, 
  handleCameraShot, 
  handleUploadPhoto, 
  hasPermission, 
  requestPermission,
  photoOutput
}, ref) => {

  // If permission is not granted, show a request button
  if (!hasPermission) {
    return (
      <Modal visible={showCameraOverlay} transparent={true} animationType="slide">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera access is required to take progress photos</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCameraOverlay(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  // If device camera hasn't loaded yet, show loading spinner
  if (!cameraDevice) {
    return (
      <Modal visible={showCameraOverlay} transparent={true} animationType="slide">
        <View style={styles.permissionContainer}>
          <GlobalLoader size={60} />
          <Text style={styles.permissionText}>Loading Camera Hardware...</Text>
          <TouchableOpacity onPress={() => setShowCameraOverlay(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={showCameraOverlay} transparent={true} animationType="slide">
      <View style={styles.container}>
        
        {/* CRITICAL: The ref from FastWorkoutActiveScreen is passed directly to the Camera component here */}
        <Camera
          ref={ref}
          style={StyleSheet.absoluteFill}
          device={cameraDevice}
          isActive={showCameraOverlay} // Turns camera on/off
          outputs={[photoOutput]}      // CRITICAL: Connect the photo output pipeline!
        />

        {/* Camera UI Overlay */}
        <View style={styles.overlayControls}>
          
          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowCameraOverlay(false)}
          >
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>

          {/* Bottom Controls (Upload & Capture) */}
          <View style={styles.bottomControls}>
            
            {/* Upload from Gallery */}
            <TouchableOpacity style={styles.galleryButton} onPress={handleUploadPhoto}>
              <Icon name="images" size={28} color="#FFF" />
            </TouchableOpacity>

            {/* Capture Photo Button */}
            <TouchableOpacity style={styles.captureButton} onPress={handleCameraShot}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            {/* Empty space to balance the layout */}
            <View style={{ width: 50 }} />

          </View>
        </View>

      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: '#A855F7', // Workout theme purple color
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#AAA',
    fontSize: 14,
  },
  overlayControls: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 15,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF',
  },
});

export default WorkoutCameraModal;
