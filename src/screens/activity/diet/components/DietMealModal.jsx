import React from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, Image, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { analyzeMealWithAI, saveDietEntry } from '../../../../redux/actions/dietActions';

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
  setTrackedMealImage
}) => {
  const dispatch = useDispatch();

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
        setNutritionData(response.data);
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
                {/* Image Overlap */}
                <View style={styles.modalImageWrapper}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.modalImage} />
                  ) : (
                    <View style={[styles.modalImage, styles.modalImagePlaceholder]}>
                      <Icon name="restaurant-outline" size={60} color="#888" />
                    </View>
                  )}
                  {mealStep === 1 && !aiLoading && (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    </View>
                  )}
                </View>
 
                {aiLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" style={{ marginBottom: 15 }} />
                    <Text style={styles.loadingText}>AI is analyzing your food... 🤖</Text>
                    <Text style={styles.loadingSubtext}>Connecting to AI service at ollama.swapp.fit</Text>
                  </View>
                ) : (
                  <>
                    {/* Controls Row */}
                    <View style={styles.modalControlsRow}>
                      <TouchableOpacity 
                        style={styles.lunchDropdown}
                        onPress={() => {
                          Alert.alert(
                            "Select Meal Type",
                            "Choose when you had this meal:",
                            [
                              { text: "Breakfast", onPress: () => setSelectedMealType("Breakfast") },
                              { text: "Morning Snack", onPress: () => setSelectedMealType("Morning Snack") },
                              { text: "Lunch", onPress: () => setSelectedMealType("Lunch") },
                              { text: "Evening Snack", onPress: () => setSelectedMealType("Evening Snack") },
                              { text: "Dinner", onPress: () => setSelectedMealType("Dinner") },
                              { text: "Cancel", style: "cancel" }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.lunchDropdownText}>{selectedMealType}</Text>
                        <Icon name="chevron-down" size={16} color="#FFF" />
                      </TouchableOpacity>
 
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
 
                        {/* Move Meal Options */}
                        <View style={styles.moveMealCard}>
                          <Text style={styles.moveMealTitle}>Where do you want to move this meal?</Text>
                          
                          {['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'].map((option, index) => (
                            <TouchableOpacity 
                              key={index} 
                              style={styles.moveMealOption} 
                              onPress={() => {
                                setSelectedMealType(option);
                                setMealStep(2);
                              }}
                            >
                              <Text style={styles.moveMealOptionText}>{option}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
 
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
    maxHeight: SCREEN_HEIGHT - 100,
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
    marginTop: SCREEN_HEIGHT < 680 ? -90 : -115,
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
});

export default DietMealModal;
