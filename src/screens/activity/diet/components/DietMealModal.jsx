import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { analyzeMealWithAI, saveDietEntry } from '../../../../redux/actions/dietActions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');


const DietMealModal = ({
  showMealModal,
  setShowMealModal,
  mealStep,
  setMealStep,
  selectedImage,
  mealQuantity,
  setMealQuantity,
  nutritionData,
  setNutritionData,
  aiLoading,
  setAiLoading,
  uploadedImageUrl,
  setUploadedImageUrl,
  selectedMealType,
  setSelectedMealType,
  mealDescription,
  setMealDescription,
  setTrackedMealImage,
  selectedDate,
  setSelectedImage
}) => {
  const dispatch = useDispatch();
  const [mealTime, setMealTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSelectPhoto = () => {
    console.log('[DietMealModal] handleSelectPhoto pressed');
    Alert.alert(
      "Add Food Photo",
      "Choose an option to add a photo of your food:",
      [
        {
          text: "Take Photo 📸",
          onPress: () => {
            console.log('[DietMealModal] Launching camera...');
            launchCamera(
              { mediaType: 'photo', quality: 0.8 },
              (response) => {
                console.log('[DietMealModal] Camera response:', response);
                if (response.didCancel) {
                  console.log('[DietMealModal] User cancelled camera selection');
                } else if (response.errorCode) {
                  console.error('[DietMealModal] Camera error:', response.errorCode, response.errorMessage);
                  Alert.alert(
                    "Camera Error",
                    response.errorMessage || `Error code: ${response.errorCode}. Note that camera is not available on simulators.`
                  );
                } else if (response.assets?.[0]?.uri) {
                  setSelectedImage(response.assets[0].uri);
                }
              }
            );
          }
        },
        {
          text: "Choose from Library 🖼️",
          onPress: () => {
            console.log('[DietMealModal] Launching library...');
            launchImageLibrary(
              { mediaType: 'photo', quality: 0.8 },
              (response) => {
                console.log('[DietMealModal] Image library response:', response);
                if (response.didCancel) {
                  console.log('[DietMealModal] User cancelled library selection');
                } else if (response.errorCode) {
                  console.error('[DietMealModal] Library error:', response.errorCode, response.errorMessage);
                  Alert.alert("Library Error", response.errorMessage || `Error code: ${response.errorCode}`);
                } else if (response.assets?.[0]?.uri) {
                  setSelectedImage(response.assets[0].uri);
                }
              }
            );
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleTextAnalysis = async () => {
    if (!mealDescription.trim()) {
      Alert.alert("Input Required", "Please describe your meal before analyzing.");
      return;
    }

    setAiLoading(true);
    try {
      console.log('[DietMealModal] Requesting AI analysis for description:', mealDescription, 'with image:', uploadedImageUrl);
      const response = await dispatch(analyzeMealWithAI(uploadedImageUrl, mealDescription));
      if (response.success && response.data) {
        const analysis = response.data.analysis || {};
        setNutritionData({
          mealName: analysis.cleanMealName || analysis.mealName || 'Unnamed Meal',
          calories: analysis.calories || 0,
          protein: analysis.protein || 0,
          carbs: analysis.carbs || 0,
          fats: analysis.fats || 0
        });
        setMealStep(2);
      } else {
        Alert.alert("Analysis Error", response.message || "Failed to analyze meal description.");
      }
    } catch (error) {
      console.error('[DietMealModal] Text analysis error:', error);
      Alert.alert("Error", "An unexpected error occurred during analysis.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Modal visible={showMealModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Top Bar */}
          <View style={styles.modalHeader}>
            <View style={{ width: 40 }} />
            <View style={styles.headerCheckContainer}>
              {mealStep === 2 && !aiLoading && (
                <View style={styles.headerCheck}>
                  <MaterialCommunityIcons name="check-circle" size={28} color="#4CAF50" />
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => { setShowMealModal(false); setMealStep(1); setMealDescription(''); }} style={styles.modalCloseBtn}>
              <Icon name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalTitle}>{aiLoading ? "Analyzing..." : "Meal Tracked !"}</Text>

          <View style={styles.modalContentContainer}>
            <View style={[styles.modalBottomSheet, (mealStep === 2 || aiLoading) && styles.modalBottomSheetExpanded]}>
              <ScrollView
                style={styles.sheetScrollView}
                contentContainerStyle={styles.sheetScrollViewContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Spacer at the top of ScrollView so content is not covered by absolute image */}
                <View style={{ height: SCREEN_HEIGHT < 680 ? 100 : 130 }} />

                {aiLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 15 }} />
                    <Text style={styles.loadingText}>AI is analyzing your food... 🤖</Text>
                    <Text style={styles.loadingSubtext}>Connecting to AI service at ollama.swapp.fit</Text>
                  </View>
                ) : (
                  <>
                    {/* Segmented control for selecting meal type */}
                    {selectedMealType !== 'Custom Meal' ? (
                      <View style={styles.segmentedOuterContainer}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false} 
                          contentContainerStyle={styles.segmentedContent}
                        >
                          {['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'].map((type) => {
                            const isSelected = selectedMealType === type;
                            return (
                              <TouchableOpacity
                                key={type}
                                style={[styles.segmentedButton, isSelected && styles.segmentedButtonActive]}
                                onPress={() => setSelectedMealType(type)}
                              >
                                <Text style={[styles.segmentedText, isSelected && styles.segmentedTextActive]}>
                                  {type}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    ) : (
                      <View style={styles.customMealContainer}>
                        <View style={[styles.lunchDropdown, { flex: 1, marginRight: 10, minWidth: 120 }]}>
                          <Text style={styles.lunchDropdownText}>Custom Meal</Text>
                        </View>
                        <TouchableOpacity 
                          style={[styles.lunchDropdown, { flex: 1, minWidth: 120 }]}
                          onPress={() => setShowTimePicker(true)}
                        >
                          <Text style={styles.lunchDropdownText}>
                            {mealTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          <Icon name="time-outline" size={16} color="#FFF" style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Quantity Selector Row */}
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>Quantity</Text>
                      <View style={styles.quantitySelector}>
                        <TouchableOpacity 
                          onPress={() => setMealQuantity(Math.max(1, mealQuantity - 1))}
                          style={styles.quantityBtn}
                        >
                          <Icon name="remove" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{mealQuantity}</Text>
                        <TouchableOpacity 
                          onPress={() => setMealQuantity(mealQuantity + 1)}
                          style={styles.quantityBtn}
                        >
                          <Icon name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {showTimePicker && Platform.OS === 'ios' && (
                      <Modal visible={showTimePicker} transparent={true} animationType="fade">
                        <View style={styles.modalOverlayCentered}>
                          <View style={styles.datePickerContainer}>
                            <DateTimePicker
                              value={mealTime}
                              mode="time"
                              display="spinner"
                              onChange={(event, date) => {
                                if (date) setMealTime(date);
                              }}
                              textColor="#000"
                            />
                            <TouchableOpacity 
                              style={styles.datePickerButton} 
                              onPress={() => setShowTimePicker(false)}
                            >
                              <Text style={styles.datePickerButtonText}>Done</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Modal>
                    )}
                    {showTimePicker && Platform.OS === 'android' && (
                      <DateTimePicker
                        value={mealTime}
                        mode="time"
                        display="default"
                        onChange={(event, date) => {
                          setShowTimePicker(false);
                          if (date) {
                            setMealTime(date);
                          }
                        }}
                      />
                    )}
 
                    {/* Meal Info */}
                    <Text style={styles.mealName}>{nutritionData?.mealName || 'Unnamed Meal'}</Text>
                    <View style={styles.caloriesRow}>
                      <Text style={styles.caloriesText}>🔥 Calories  {Math.round((nutritionData?.calories || 0) * mealQuantity)}</Text>
                    </View>
 
                    {mealStep === 1 ? (
                      <>
                        {/* Text Description Input */}
                        <View style={styles.textInputCard}>
                          <Text style={styles.textInputLabel}>Describe your meal to scan with AI:</Text>
                          <TextInput
                            style={styles.textInput}
                            placeholder="e.g., 2 eggs, avocado toast and green tea"
                            placeholderTextColor="#777"
                            value={mealDescription}
                            onChangeText={setMealDescription}
                            multiline
                          />
                          <TouchableOpacity style={styles.analyzeBtn} onPress={handleTextAnalysis}>
                            <Text style={styles.analyzeBtnText}>Analyze Description with AI 🤖</Text>
                          </TouchableOpacity>
                        </View>
 
                        {/* Manual entry / skip AI button */}
                        <TouchableOpacity 
                          style={styles.manualEntryBtn} 
                          onPress={() => setMealStep(2)}
                        >
                          <Text style={styles.manualEntryBtnText}>Log Manually (Skip AI) ➔</Text>
                        </TouchableOpacity>
 
                        {/* Cancel Button */}
                        <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setShowMealModal(false); setMealStep(1); setMealDescription(''); }}>
                          <Text style={styles.modalCancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        {/* Step 2: Macros */}
                        <View style={styles.macrosCardContainer}>
                          <View style={[styles.macroDetailCard, { backgroundColor: '#D67C30' }]}>
                            <Text style={styles.macroDetailValue}>{Math.round((nutritionData?.carbs || 0) * mealQuantity)}g</Text>
                            <Text style={styles.macroDetailLabel}>Carbs</Text>
                            <View style={styles.macroRingContainer}>
                               <View style={styles.macroRingOuter}>
                                 <View style={styles.macroRingInner} />
                               </View>
                            </View>
                          </View>
                          <View style={[styles.macroDetailCard, { backgroundColor: '#3E8EB1' }]}>
                            <Text style={styles.macroDetailValue}>{Math.round((nutritionData?.fats || 0) * mealQuantity)}g</Text>
                            <Text style={styles.macroDetailLabel}>Fat</Text>
                            <View style={styles.macroRingContainer}>
                               <View style={styles.macroRingOuter}>
                                 <View style={styles.macroRingInner} />
                               </View>
                            </View>
                          </View>
                          <View style={[styles.macroDetailCard, { backgroundColor: '#4AA97D' }]}>
                            <Text style={styles.macroDetailValue}>{Math.round((nutritionData?.protein || 0) * mealQuantity)}g</Text>
                            <Text style={styles.macroDetailLabel}>Protein</Text>
                            <View style={styles.macroRingContainer}>
                               <View style={styles.macroRingOuter}>
                                 <View style={styles.macroRingInner} />
                               </View>
                            </View>
                          </View>
                          <View style={[styles.macroDetailCard, { backgroundColor: '#826EEA' }]}>
                            <Text style={styles.macroDetailValue}>{Math.round((nutritionData?.calories || 0) * mealQuantity)}</Text>
                            <Text style={styles.macroDetailLabel}>Kcal</Text>
                            <View style={styles.macroRingContainer}>
                               <View style={styles.macroRingOuter}>
                                 <View style={styles.macroRingInner} />
                               </View>
                            </View>
                          </View>
                        </View>
 
                        <TouchableOpacity 
                          style={[styles.modalDoneBtn, { marginTop: 10, marginBottom: 20 }]} 
                          onPress={async () => {
                            setAiLoading(true);
                             try {
                               let customCreatedAt = null;
                               if (selectedMealType === 'Custom Meal' && selectedDate) {
                                 const newDate = new Date(selectedDate);
                                 newDate.setHours(mealTime.getHours());
                                 newDate.setMinutes(mealTime.getMinutes());
                                 newDate.setSeconds(0);
                                 newDate.setMilliseconds(0);
                                 customCreatedAt = newDate.toISOString();
                               }

                               const payload = {
                                 mealName: nutritionData.mealName,
                                 mealType: selectedMealType.toLowerCase(),
                                 calories: Math.round((nutritionData.calories || 0) * mealQuantity),
                                 protein: Math.round((nutritionData.protein || 0) * mealQuantity),
                                 carbs: Math.round((nutritionData.carbs || 0) * mealQuantity),
                                 fats: Math.round((nutritionData.fats || 0) * mealQuantity),
                                 notes: mealDescription || '',
                                 photoUrl: uploadedImageUrl,
                                 photo: selectedImage ? { uri: selectedImage } : null,
                                 ...(customCreatedAt ? { createdAt: customCreatedAt } : {}),
                               };
                              
                              console.log('[DietMealModal] Dispatching saveDietEntry:', payload);
                              const saveResponse = await dispatch(saveDietEntry(payload));
                              
                              if (saveResponse.success) {
                                setTrackedMealImage(selectedImage);
                                setShowMealModal(false); 
                                setMealStep(1);
                                setMealDescription('');
                              } else {
                                Alert.alert("Save Error", saveResponse.message || "Failed to log diet entry.");
                              }
                            } catch (err) {
                              console.error('[DietMealModal] Save log error:', err);
                              Alert.alert("Error", "An unexpected error occurred while logging.");
                            } finally {
                              setAiLoading(false);
                            }
                          }}
                        >
                          <Text style={styles.modalDoneBtnText}>Done</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
              </ScrollView>

              {/* Image Overlap (Absolute Positioned as direct child of Sheet to handle touch events perfectly) */}
              <View style={styles.modalImageWrapper}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                    <Icon name="restaurant-outline" size={60} color="#888" />
                  </View>
                )}
                {!aiLoading && (
                  <TouchableOpacity 
                    style={styles.modalCameraBtn} 
                    onPress={handleSelectPhoto}
                    activeOpacity={0.8}
                  >
                    <Icon name="camera" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
                {selectedImage && mealStep === 1 && !aiLoading && (
                  <View style={styles.checkBadge}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    paddingTop: 0,
    maxHeight: SCREEN_HEIGHT - 240,
  },
  modalBottomSheetExpanded: {},
  sheetScrollView: {
    width: '100%',
    overflow: 'visible',
  },
  sheetScrollViewContent: {
    paddingBottom: 40,
  },
  modalImageWrapper: {
    alignSelf: 'center',
    top: SCREEN_HEIGHT < 680 ? -90 : -115,
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  modalImage: {
    width: SCREEN_HEIGHT < 680 ? 180 : 230,
    height: SCREEN_HEIGHT < 680 ? 180 : 230,
    borderRadius: SCREEN_HEIGHT < 680 ? 90 : 115,
    borderWidth: 4,
    borderColor: '#555',
  },
  modalImagePlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: SCREEN_HEIGHT < 680 ? 15 : 20,
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
  quantityBtn: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: -4,
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  macroDetailCard: {
    flex: 1,
    marginHorizontal: 4,
    minHeight: 100,
    borderRadius: 15,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  macroDetailValue: {
    color: '#000',
    fontSize: SCREEN_WIDTH < 375 ? 12 : 15,
    fontWeight: 'bold',
  },
  macroDetailLabel: {
    color: '#000',
    fontSize: SCREEN_WIDTH < 375 ? 10 : 12,
    marginBottom: 8,
  },
  macroRingContainer: {
    marginTop: 'auto',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRingOuter: {
    width: SCREEN_WIDTH < 375 ? 28 : 36,
    height: SCREEN_WIDTH < 375 ? 28 : 36,
    borderRadius: SCREEN_WIDTH < 375 ? 14 : 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRingInner: {
    width: SCREEN_WIDTH < 375 ? 18 : 24,
    height: SCREEN_WIDTH < 375 ? 18 : 24,
    borderRadius: SCREEN_WIDTH < 375 ? 9 : 12,
    borderWidth: 3,
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
  loadingContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  textInputCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  textInputLabel: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  analyzeBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  analyzeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noIngredientsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
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
    width: '90%',
    alignItems: 'center',
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
  modalCameraBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#7C4DFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentedOuterContainer: {
    marginBottom: 15,
    marginTop: 5,
  },
  segmentedContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 8,
  },
  segmentedButton: {
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  segmentedButtonActive: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  segmentedText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  customMealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
    marginTop: 10,
  },
  quantityLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  manualEntryBtn: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  manualEntryBtnText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DietMealModal;
