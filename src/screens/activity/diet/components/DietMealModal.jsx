import React from 'react';
import { View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const DietMealModal = ({
  showMealModal,
  setShowMealModal,
  mealStep,
  setMealStep,
  selectedImage,
  mealQuantity,
  setMealQuantity,
  detectedMealName,
  setTrackedMealImage
}) => {
  return (
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
});

export default DietMealModal;
