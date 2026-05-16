import React from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietCameraModal = ({ 
  showCameraOverlay, 
  setShowCameraOverlay, 
  cameraDevice, 
  cameraRef, 
  VisionCameraView, 
  handleCameraShot,
  handleUploadPhoto
}) => {
  return (
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
            <TouchableOpacity style={styles.cameraSideBtn} onPress={handleUploadPhoto}>
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
  );
};

const styles = StyleSheet.create({
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
});

export default DietCameraModal;
