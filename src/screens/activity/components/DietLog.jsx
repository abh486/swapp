// import React, { useState, useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   SafeAreaView,
//   Modal,
//   Dimensions,
//   StatusBar,
//   Alert,
//   ScrollView,
//   Image,
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   PermissionsAndroid,
//   AppState,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import Video from 'react-native-video';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// import { useImageSelection } from '../../../context/AuthContext';
// import { useDispatch } from 'react-redux';
// import { saveDietEntry, getDietLogsByDate, updateDietLog, deleteDietLog } from '../../../redux/actions/dietActions';

// const { width } = Dimensions.get('window');

// const DietLog = ({ navigation }) => {
//   const dispatch = useDispatch();
//   // Get the image selection context
//   const { isImageSelectionInProgress, setIsImageSelectionInProgress } = useImageSelection();
  
//   // --- STATE MANAGEMENT ---
//   const [totalCalories, setTotalCalories] = useState(0);
//   const [totalProtein, setTotalProtein] = useState(0);
//   const [totalCarbs, setTotalCarbs] = useState(0);
//   const [totalFats, setTotalFats] = useState(0);
//   const [exerciseCalories, setExerciseCalories] = useState(200);

//   const [dailyCalorieGoal] = useState(2000);
//   const [dailyProteinGoal] = useState(140);
//   const [dailyCarbGoal] = useState(250);
//   const [dailyFatGoal] = useState(70);

//   const [meals, setMeals] = useState({
//     Breakfast: [],
//     Lunch: [],
//     Dinner: [],
//     Snacks: [],
//   });

//   const [modalVisible, setModalVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [editMealId, setEditMealId] = useState(null);
//   const [fetching, setFetching] = useState(false);

//   // Add refs to track state that shouldn't trigger re-renders
//   const isMounted = useRef(true);
//   const appState = useRef(AppState.currentState);
//   const appStateSubscription = useRef(null);
  
//   // Track component mount/unmount
//   useEffect(() => {
//     console.log('DietLog component mounted');
//     isMounted.current = true;
    
//     // Add app state listener
//     appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
//       console.log('AppState changed to', nextAppState);
      
//       // If we're returning from background and we were in the middle of image selection,
//       // we need to prevent any navigation or authentication refresh
//       if (appState.current.match(/background/) && nextAppState === 'active' && isImageSelectionInProgress) {
//         console.log('Returning from image selection, preventing unwanted navigation');
//         // Set a flag to prevent auth refresh or navigation
//         setIsImageSelectionInProgress(false);
        
//         // Force the modal to stay open
//         setTimeout(() => {
//           if (isMounted.current) {
//             setModalVisible(true);
//           }
//         }, 300);
//       }
      
//       appState.current = nextAppState;
//     });
    
//     return () => {
//       console.log('DietLog component unmounting');
//       isMounted.current = false;
//       if (appStateSubscription.current) {
//         appStateSubscription.current.remove();
//       }
//     };
//   }, [isImageSelectionInProgress]);

//   // The mealType is now initialized in lowercase to match the backend requirement.
//   const [form, setForm] = useState({
//     mealName: '',
//     calories: '',
//     protein: '',
//     carbs: '',
//     fats: '',
//     photo: null,
//     mealType: 'breakfast', // Default meal type is now lowercase
//   });

//   // Fetch today's diet logs
//   const fetchTodayDietLogs = async () => {
//     if (isImageSelectionInProgress) {
//       console.log('Skipping fetchTodayDietLogs during image selection');
//       return;
//     }
    
//     setFetching(true);
//     try {
//       const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
//       const response = await dispatch(getDietLogsByDate(today));
      
//       if (response.success && response.data) {
//         // Check the structure of the response data
//         console.log('[DietLog] Full response structure:', JSON.stringify(response, null, 2));
        
//         // Transform the data to match our local state structure
//         const transformedMeals = {
//           Breakfast: [],
//           Lunch: [],
//           Dinner: [],
//           Snacks: [],
//         };
        
//         // Handle different response structures
//         const logsArray = response.data.logs || response.data || [];
        
//         logsArray.forEach(log => {
//           console.log(`[fetchTodayDietLogs] Processing log:`, JSON.stringify(log, null, 2));
          
//           const mealType = log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1);
//           if (transformedMeals[mealType]) {
//             // FIX: Check for photoUrl first (which is what backend returns)
//             // But also check if it exists in the response at all
//             let photoUrl = null;
            
//             // Check if photoUrl is directly in the log object
//             if (log.photoUrl) {
//               photoUrl = log.photoUrl;
//             } 
//             // Check if photo is in the log object
//             else if (log.photo) {
//               photoUrl = log.photo;
//             }
//             // Check for other possible field names
//             else if (log.image) {
//               photoUrl = log.image;
//             } else if (log.imageUrl) {
//               photoUrl = log.imageUrl;
//             } else if (log.picture) {
//               photoUrl = log.picture;
//             } else if (log.pictureUrl) {
//               photoUrl = log.pictureUrl;
//             }
            
//             console.log(`[fetchTodayDietLogs] Photo URL extracted: ${photoUrl}`);
            
//             // If photo is still null, check if there's a nested object with photo data
//             if (!photoUrl && log.attachments && log.attachments.length > 0) {
//               photoUrl = log.attachments[0].url || log.attachments[0].uri || null;
//             }
            
//             transformedMeals[mealType].push({
//               id: log.id,
//               name: log.mealName,
//               calories: log.calories,
//               protein: log.protein,
//               carbs: log.carbs,
//               fats: log.fats,
//               // FIX: Use the photo URL we extracted
//               photo: photoUrl,
//             });
//           }
//         });
        
//         console.log('[DietLog] Transformed meals with photos:', JSON.stringify(transformedMeals, null, 2));
//         setMeals(transformedMeals);
//       }
//     } catch (error) {
//       console.error('Error fetching diet logs:', error);
//       Alert.alert('Error', 'Failed to fetch diet logs. Please try again.');
//     } finally {
//       setFetching(false);
//     }
//   };

//   useEffect(() => {
//     fetchTodayDietLogs();
//   }, []);

//   useEffect(() => {
//     let cal = 0, prot = 0, carb = 0, fat = 0;
//     for (const mealType in meals) {
//       meals[mealType].forEach(meal => {
//         cal += parseInt(meal.calories) || 0;
//         prot += parseInt(meal.protein) || 0;
//         carb += parseInt(meal.carbs) || 0;
//         fat += parseInt(meal.fats) || 0;
//       });
//     }
//     setTotalCalories(cal);
//     setTotalProtein(prot);
//     setTotalCarbs(carb);
//     setTotalFats(fat);
//   }, [meals]);

//   // --- HELPER COMPONENTS ---
//   const MacroRow = ({ label, value, goal, color }) => {
//     const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
//     return (
//       <View style={styles.macroRow}>
//         <Text style={styles.macroLabel}>{label}</Text>
//         <View style={styles.progressBarBackground}>
//           <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
//         </View>
//         <Text style={styles.macroValue}>{value}/{goal}g</Text>
//       </View>
//     );
//   };

//   // FIX: Added proper image handling in MealItem
//   const MealItem = ({ item, mealType }) => {
//     console.log(`[MealItem] Rendering meal item: ${item.name}, photo:`, item.photo);
    
//     // Check if photo is a valid URL
//     const isValidUrl = item.photo && (item.photo.startsWith('http') || item.photo.startsWith('https') || item.photo.startsWith('file://'));
    
//     return (
//       <View style={styles.mealListItem}>
//         <View style={styles.mealThumb}>
//           {isValidUrl ? (
//             <Image 
//               source={{ uri: item.photo }} 
//               style={styles.mealImage} 
//               resizeMode="cover"
//               onError={(error) => {
//                 console.log('Image loading error:', error.nativeEvent.error);
//                 console.log('Failed image URI:', item.photo);
//               }}
//               onLoad={() => console.log('Image loaded successfully:', item.photo)}
//             />
//           ) : (
//             <Text style={styles.mealPlaceholderIcon}>🍽</Text>
//           )}
//         </View>
//         <View style={styles.mealInfo}>
//           <Text style={styles.mealName}>{item.name}</Text>
//           <Text style={styles.mealStats}>{item.calories} kcal · {item.protein}P · {item.carbs}C · {item.fats}F</Text>
//         </View>
//         <View style={styles.mealActionIcons}>
//           <TouchableOpacity onPress={() => openEditModal(mealType, item)} style={{ marginRight: 6 }}>
//             <Icon name="pencil" size={22} color="#000" />
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => handleDeleteMeal(mealType, item.id)}>
//             <Icon name="delete" size={22} color="#000" />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   // --- FUNCTIONS ---
//   const handleFormInput = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   // The reset function also sets the default mealType to lowercase.
//   const resetForm = () => {
//     setForm({
//       mealName: '', calories: '', protein: '', carbs: '', fats: '', photo: null, mealType: 'breakfast',
//     });
//     setEditMealId(null);
//   };

//   const openEditModal = (mealType, meal) => {
//     console.log(`[openEditModal] Opening modal for meal: ${meal.name}, photo:`, meal.photo);
    
//     setForm({
//       mealName: meal.name,
//       calories: meal.calories.toString(),
//       protein: meal.protein.toString(),
//       carbs: meal.carbs.toString(),
//       fats: meal.fats.toString(),
//       // FIX: Ensure photo is handled correctly
//       photo: meal.photo ? { uri: meal.photo } : null,
//       mealType: mealType.toLowerCase(), // Ensure mealType is lowercase when editing
//     });
//     setEditMealId(meal.id);
//     setModalVisible(true);
//   };

//   const handleDeleteMeal = async (mealType, id) => {
//     const item = meals[mealType].find(m => m.id === id);
//     if (!item) return;
    
//     Alert.alert(`Delete meal`, `Delete ${item.name}?`, [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete', style: 'destructive', onPress: async () => {
//           try {
//             // Delete from backend
//             await dispatch(deleteDietLog(id));
            
//             // Update local state
//             setMeals(prev => ({
//               ...prev,
//               [mealType]: prev[mealType].filter(m => m.id !== id),
//             }));
            
//             Alert.alert('Success', 'Meal deleted successfully!');
//           } catch (error) {
//             console.error('Error deleting meal:', error);
//             Alert.alert('Error', 'Failed to delete meal. Please try again.');
//           }
//         },
//       },
//     ]);
//   };
  
//   const handleAddOrEditMeal = async () => {
//     if (!form.mealName.trim() || !form.calories.trim()) {
//       return Alert.alert('Validation Error', 'Please enter at least a meal name and calories.');
//     }
//     setLoading(true);

//     try {
//       let response;
      
//       if (editMealId) {
//         // Update existing meal
//         response = await dispatch(updateDietLog(editMealId, form));
//       } else {
//         // Create new meal
//         response = await dispatch(saveDietEntry(form));
//       }

//       console.log('[handleAddOrEditMeal] Save response:', JSON.stringify(response, null, 2));

//       if (response.success) {
//         // FIX: Check for photoUrl first (which is what backend returns)
//         const photoUrl = response.data?.photoUrl || response.data?.photo || response.data?.image || response.data?.imageUrl || response.data?.picture || response.data?.pictureUrl || null;
//         console.log('[handleAddOrEditMeal] Photo URL from response:', photoUrl);
        
//         // Create the meal data for local state
//         const mealData = {
//           id: editMealId || response.data?.id || Date.now().toString(),
//           name: form.mealName,
//           calories: parseInt(form.calories) || 0,
//           protein: parseInt(form.protein) || 0,
//           carbs: parseInt(form.carbs) || 0,
//           fats: parseInt(form.fats) || 0,
//           // FIX: Use the photo URL from the response
//           photo: photoUrl,
//         };
        
//         console.log('[handleAddOrEditMeal] Meal data with photo:', JSON.stringify(mealData, null, 2));
        
//         // The mealType name needs to be capitalized for the local state object key
//         const mealTypeKey = form.mealType.charAt(0).toUpperCase() + form.mealType.slice(1);

//         if (editMealId) {
//           setMeals(prev => ({
//             ...prev,
//             [mealTypeKey]: prev[mealTypeKey].map(item => 
//               item.id === editMealId ? mealData : item
//             ),
//           }));
//         } else {
//           setMeals(prev => ({
//             ...prev,
//             [mealTypeKey]: [mealData, ...prev[mealTypeKey]],
//           }));
//         }

//         closeModal();
//         Alert.alert('Success', `Meal ${editMealId ? 'updated' : 'added'} successfully! 🎉`);
        
//         // Refresh the diet logs after adding/updating to ensure we have the latest data
//         setTimeout(() => {
//           fetchTodayDietLogs();
//         }, 500);
//       } else {
//         Alert.alert(
//           'Warning', 
//           response.message || 'Operation failed. Please try again later.'
//         );
//       }
//     } catch (error) {
//       console.error('Save diet error:', error);
//       Alert.alert(
//         'Warning', 
//         'Operation failed. Please check your internet connection.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const closeModal = () => {
//     setModalVisible(false);
//     resetForm();
//   }

//   // --- IMAGE PICKER LOGIC ---
//   const requestCameraPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.CAMERA,
//           { title: "Camera Permission", message: "We need access to your camera to take meal photos", buttonPositive: "OK" }
//         );
//         return granted === PermissionsAndroid.RESULTS.GRANTED;
//       } catch (err) {
//         console.warn(err);
//         return false;
//       }
//     } else return true;
//   };

//   // FIXED IMAGE PICKER FUNCTION
//   const pickImage = async (fromCamera = false) => {
//     // Check if component is still mounted
//     if (!isMounted.current) {
//       console.error('Component is not mounted, aborting image selection');
//       return;
//     }
    
//     // Set context flag to indicate we're starting image selection
//     setIsImageSelectionInProgress(true);
    
//     const options = { mediaType: 'photo', quality: 0.7 };
//     const action = fromCamera ? launchCamera : launchImageLibrary;

//     try {
//         const result = await action(options);
        
//         // Check if component is still mounted after async operation
//         if (!isMounted.current) {
//           console.error('Component was unmounted during image selection');
//           setIsImageSelectionInProgress(false);
//           return;
//         }
        
//         if (result.didCancel) {
//           setIsImageSelectionInProgress(false);
//           return;
//         }
        
//         if (result.assets && result.assets.length > 0) {
//             console.log('[pickImage] Selected image:', result.assets[0]);
//             handleFormInput('photo', result.assets[0]);
//         } else {
//             Alert.alert('Error', 'No photo was selected.');
//         }
//     } catch (error) {
//         console.log('ImagePicker error:', error);
//         Alert.alert('Error', 'Could not access camera or gallery.');
//     } finally {
//       // Reset the flag after a short delay to ensure app state change is processed
//       setTimeout(() => {
//         setIsImageSelectionInProgress(false);
//         console.log('Image selection process completed');
//       }, 500);
//     }
//   };

//   const takePhoto = async () => {
//     const hasPermission = await requestCameraPermission();
//     if (hasPermission) pickImage(true);
//   };

//   const mockSyncWorkout = () => {
//     const burned = 320; 
//     setExerciseCalories(p => p + burned);
//     Alert.alert('Workout synced', `${burned} kcal added to exercise`);
//   };

//   const remainingCalories = Math.max(dailyCalorieGoal - totalCalories + exerciseCalories, 0);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000000" />
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//             <Icon name="arrow-left" size={24} color="#FFFFFF" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Diet Tracker</Text>
//           <View style={styles.avatarPlaceholder}>
//             <Icon name="account" size={24} color="#FFFFFF" />
//           </View>
//         </View>

//         {/* Stats Row */}
//         <View style={styles.statsRowWrapper}>
//           <View style={styles.statsRow}>
//             <View style={styles.caloriesCard}>
//               <Text style={styles.cardHeading}>Calories</Text>
//               <View style={styles.caloriesNumRow}>
//                 <View style={styles.caloriesNumCol}>
//                   <Text style={styles.caloriesValue}>{totalCalories}</Text>
//                   <Text style={styles.caloriesLabel}>Food</Text>
//                 </View>
//                 <View style={styles.caloriesNumCol}>
//                   <Text style={styles.caloriesValue}>{exerciseCalories}</Text>
//                   <Text style={styles.caloriesLabel}>Exercise</Text>
//                 </View>
//                 <View style={styles.caloriesNumCol}>
//                   <Text style={styles.caloriesValueRemaining}>{remainingCalories}</Text>
//                   <Text style={styles.caloriesLabel}>Remaining</Text>
//                 </View>
//               </View>
//               <View style={styles.calorieProgressTrack}>
//                 <View style={[styles.calorieProgressFill, { width: `${dailyCalorieGoal > 0 ? Math.min(100, (totalCalories / dailyCalorieGoal) * 100) : 0}%` }]} />
//               </View>
//               <Text style={styles.calorieGoalText}>Goal {dailyCalorieGoal} kcal · Consumed {totalCalories} kcal</Text>
//             </View>

//             <View style={styles.macrosCard}>
//               <Text style={styles.cardHeading}>Macros</Text>
//               <MacroRow label="Carbs" value={totalCarbs} goal={dailyCarbGoal} color="#452829" />
//               <MacroRow label="Protein" value={totalProtein} goal={dailyProteinGoal} color="#452829" />
//               <MacroRow label="Fats" value={totalFats} goal={dailyFatGoal} color="#452829" />
//             </View>
//           </View>
//         </View>

//         {/* Action Row */}
//         <View style={styles.actionRow}>
//           <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)} disabled={fetching}>
//             <Text style={styles.primaryBtnText}>+ Add Meal</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.ghostBtn} onPress={mockSyncWorkout}>
//             <Text style={styles.ghostBtnText}>Sync Workout</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Meals Lists */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Today's Meals</Text>
//           {fetching ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#452829" />
//               <Text style={styles.loadingText}>Loading meals...</Text>
//             </View>
//           ) : (
//             Object.keys(meals).map(mealType => (
//               <View key={mealType} style={{ marginBottom: 12 }}>
//                 <View style={styles.mealHeaderRow}>
//                   <Text style={styles.mealHeaderTitle}>{mealType}</Text>
//                   <Text style={styles.mealHeaderCount}>{meals[mealType].length} items</Text>
//                 </View>
//                 {meals[mealType].length === 0 ? (
//                   <View style={styles.emptyMealRow}>
//                     <Text style={styles.emptyMealText}>No items logged for {mealType}</Text>
//                   </View>
//                 ) : (
//                   <FlatList 
//                     data={meals[mealType]} 
//                     keyExtractor={i => i.id} 
//                     horizontal 
//                     showsHorizontalScrollIndicator={false} 
//                     renderItem={({ item }) => <MealItem item={item} mealType={mealType} />} 
//                   />
//                 )}
//               </View>
//             ))
//           )}
//         </View>
//       </ScrollView>

//       {/* Add/Edit Meal Modal */}
//       <Modal visible={modalVisible} animationType="slide" transparent>
//         <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//           <ScrollView>
//             <View style={styles.modalContent}>
//               <Text style={styles.modalTitle}>{editMealId ? 'Edit Meal' : 'Add Meal'}</Text>
              
//               {/* The onPress handler now converts the meal type to lowercase before saving it. */}
//               {/* The style condition is also updated to work with a lowercase state value. */}
//               <View style={styles.mealTypeRow}>
//                 {['Breakfast','Lunch','Dinner','Snacks'].map(t => (
//                   <TouchableOpacity 
//                     key={t} 
//                     style={[styles.mealTypeBtn, form.mealType === t.toLowerCase() && styles.mealTypeBtnActive]} 
//                     onPress={() => handleFormInput('mealType', t.toLowerCase())}
//                   >
//                     <Text style={[styles.mealTypeBtnText, form.mealType === t.toLowerCase() && styles.mealTypeBtnTextActive]}>
//                       {t}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>

//               <TextInput 
//                 placeholder="Food name" 
//                 placeholderTextColor="#57595B" 
//                 style={styles.input} 
//                 value={form.mealName} 
//                 onChangeText={(v) => handleFormInput('mealName', v)} 
//               />

//               <View style={styles.rowInputs}>
//                 <TextInput 
//                   placeholder="Calories" 
//                   placeholderTextColor="#57595B" 
//                   style={[styles.input,styles.smallInput]} 
//                   value={form.calories} 
//                   onChangeText={(v) => handleFormInput('calories', v)} 
//                   keyboardType="numeric" 
//                 />
//                 <TextInput 
//                   placeholder="Protein (g)" 
//                   placeholderTextColor="#57595B" 
//                   style={[styles.input,styles.smallInput]} 
//                   value={form.protein} 
//                   onChangeText={(v) => handleFormInput('protein', v)} 
//                   keyboardType="numeric" 
//                 />
//               </View>
//               <View style={styles.rowInputs}>
//                 <TextInput 
//                   placeholder="Carbs (g)" 
//                   placeholderTextColor="#57595B" 
//                   style={[styles.input,styles.smallInput]} 
//                   value={form.carbs} 
//                   onChangeText={(v) => handleFormInput('carbs', v)} 
//                   keyboardType="numeric" 
//                 />
//                 <TextInput 
//                   placeholder="Fats (g)" 
//                   placeholderTextColor="#57595B" 
//                   style={[styles.input,styles.smallInput]} 
//                   value={form.fats} 
//                   onChangeText={(v) => handleFormInput('fats', v)} 
//                   keyboardType="numeric" 
//                 />
//               </View>

//               <View style={styles.photoRow}>
//                 <TouchableOpacity onPress={() => pickImage(false)} style={styles.photoBtn}>
//                   <Text style={styles.photoBtnText}>Upload</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity onPress={takePhoto} style={styles.photoBtn}>
//                   <Text style={styles.photoBtnText}>Take Photo</Text>
//                 </TouchableOpacity>
//                 {form.photo ? (
//                   <Image 
//                     source={{ uri: form.photo.uri || form.photo }} 
//                     style={styles.photoPreview} 
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <View style={styles.photoPreviewPlaceholder}>
//                     <Icon name="camera" color="#57595B" size={24} />
//                   </View>
//                 )}
//               </View>

//               <View style={styles.modalActions}>
//                 <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
//                   <Text style={styles.cancelBtnText}>Cancel</Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrEditMeal} disabled={loading}>
//                   {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{editMealId ? 'Save Changes' : 'Add Meal'}</Text>}
//                 </TouchableOpacity>
//               </View>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </Modal>

//       {/* Floating Action Button */}
//       <TouchableOpacity style={styles.fab}>
//         <Icon name="smart-toy" size={24} color="#FFFFFF" />
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// // --- STYLES ---
// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#000000' 
//   },
//   header: {
//     height: 64,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#FFFFFF',
//     paddingHorizontal: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   avatarPlaceholder: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#452829',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   statsRowWrapper: { 
//     paddingHorizontal: 16, 
//     marginTop: 24 
//   },
//   statsRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between' 
//   },
//   caloriesCard: { 
//     flex: 1, 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 12, 
//     padding: 16, 
//     marginRight: 8, 
//     shadowColor: '#000', 
//     shadowOpacity: 0.1, 
//     shadowRadius: 6, 
//     shadowOffset: { width: 0, height: 3 }, 
//     elevation: 5 
//   },
//   cardHeading: { 
//     color: '#000000', 
//     fontSize: 16, 
//     fontWeight: 'bold', 
//     marginBottom: 12 
//   },
//   caloriesNumRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between' 
//   },
//   caloriesNumCol: { 
//     alignItems: 'center' 
//   },
//   caloriesValue: { 
//     color: '#000000', 
//     fontSize: 18, 
//     fontWeight: 'bold' 
//   },
//   caloriesValueRemaining: { 
//     color: '#452829', 
//     fontSize: 18, 
//     fontWeight: 'bold' 
//   },
//   caloriesLabel: { 
//     color: '#57595B', 
//     fontSize: 12 
//   },
//   calorieProgressTrack: { 
//     backgroundColor: '#f0f0f0', 
//     height: 6, 
//     borderRadius: 3, 
//     marginVertical: 12 
//   },
//   calorieProgressFill: { 
//     height: 6, 
//     borderRadius: 3, 
//     backgroundColor: '#452829' 
//   },
//   calorieGoalText: { 
//     color: '#57595B', 
//     fontSize: 10, 
//     marginTop: 2 
//   },
//   macrosCard: { 
//     flex: 1, 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 12, 
//     padding: 16, 
//     marginLeft: 8,
//     shadowColor: '#000', 
//     shadowOpacity: 0.1, 
//     shadowRadius: 6, 
//     shadowOffset: { width: 0, height: 3 }, 
//     elevation: 5 
//   },
//   macroRow: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     marginVertical: 8 
//   },
//   macroLabel: { 
//     color: '#000000', 
//     fontSize: 14, 
//     width: 60 
//   },
//   progressBarBackground: { 
//     flex: 1, 
//     height: 6, 
//     backgroundColor: '#f0f0f0', 
//     borderRadius: 3, 
//     marginHorizontal: 8 
//   },
//   progressBarFill: { 
//     height: 6, 
//     borderRadius: 3 
//   },
//   macroValue: { 
//     color: '#57595B', 
//     fontSize: 12, 
//     width: 60, 
//     textAlign: 'right' 
//   },
//   actionRow: { 
//     paddingHorizontal: 16, 
//     marginTop: 24, 
//     flexDirection: 'row', 
//     alignItems: 'center' 
//   },
//   primaryBtn: { 
//     backgroundColor: '#452829', 
//     paddingVertical: 12, 
//     paddingHorizontal: 16, 
//     borderRadius: 8, 
//     alignItems: 'center', 
//     shadowColor: '#000', 
//     shadowOpacity: 0.1, 
//     shadowRadius: 4, 
//     elevation: 3 
//   },
//   primaryBtnText: { 
//     color: '#FFFFFF', 
//     fontWeight: '700', 
//     fontSize: 14 
//   },
//   ghostBtn: { 
//     backgroundColor: 'transparent', 
//     paddingVertical: 12, 
//     paddingHorizontal: 16, 
//     borderRadius: 8, 
//     borderWidth: 1, 
//     borderColor: '#452829', 
//     marginLeft: 12, 
//     alignItems: 'center' 
//   },
//   ghostBtnText: { 
//     color: '#452829', 
//     fontWeight: '700' 
//   },
//   section: { 
//     marginTop: 24, 
//     paddingHorizontal: 16 
//   },
//   sectionTitle: { 
//     fontSize: 18, 
//     fontWeight: 'bold', 
//     color: '#FFFFFF', 
//     marginBottom: 16 
//   },
//   mealHeaderRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: 8 
//   },
//   mealHeaderTitle: { 
//     color: '#FFFFFF', 
//     fontWeight: 'bold', 
//     fontSize: 16 
//   },
//   mealHeaderCount: { 
//     color: '#57595B', 
//     fontWeight: '500' 
//   },
//   emptyMealRow: { 
//     backgroundColor: '#FFFFFF', 
//     padding: 16, 
//     borderRadius: 12, 
//     height: 90, 
//     justifyContent: 'center', 
//     alignItems: 'center',
//     shadowColor: '#000', 
//     shadowOpacity: 0.1, 
//     shadowRadius: 4, 
//     elevation: 3 
//   },
//   emptyMealText: { 
//     color: '#57595B' 
//   },
//   mealListItem: { 
//     backgroundColor: '#FFFFFF', 
//     borderRadius: 12, 
//     padding: 12, 
//     marginRight: 12, 
//     width: width * 0.75, 
//     flexDirection: 'row', 
//     alignItems: 'center',
//     shadowColor: '#000', 
//     shadowOpacity: 0.1, 
//     shadowRadius: 4, 
//     elevation: 3 
//   },
//   mealThumb: { 
//     width: 70, 
//     height: 70, 
//     borderRadius: 12, 
//     overflow: 'hidden', 
//     backgroundColor: '#f0f0f0', 
//     alignItems: 'center', 
//     justifyContent: 'center', 
//     marginRight: 12 
//   },
//   mealImage: { 
//     width: '100%', 
//     height: '100%', 
//     resizeMode: 'cover' 
//   },
//   mealPlaceholderIcon: { 
//     fontSize: 26, 
//     color: '#57595B' 
//   },
//   mealInfo: { 
//     flex: 1 
//   },
//   mealName: { 
//     color: '#000000', 
//     fontWeight: 'bold', 
//     fontSize: 14 
//   },
//   mealStats: { 
//     color: '#57595B', 
//     marginTop: 4, 
//     fontSize: 12, 
//     fontWeight: '500' 
//   },
//   mealActionIcons: { 
//     flexDirection: 'row', 
//     paddingLeft: 10 
//   },
//   modalWrap: { 
//     flex: 1, 
//     justifyContent: 'flex-end', 
//     backgroundColor: 'rgba(0,0,0,0.6)' 
//   },
//   modalContent: { 
//     backgroundColor: '#FFFFFF', 
//     padding: 24, 
//     borderTopLeftRadius: 16, 
//     borderTopRightRadius: 16 
//   },
//   modalTitle: { 
//     color: '#000000', 
//     fontSize: 18, 
//     fontWeight: 'bold', 
//     marginBottom: 16, 
//     textAlign: 'center' 
//   },
//   mealTypeRow: { 
//     flexDirection: 'row', 
//     marginBottom: 16, 
//     justifyContent: 'center' 
//   },
//   mealTypeBtn: { 
//     paddingVertical: 8, 
//     paddingHorizontal: 12, 
//     borderRadius: 8, 
//     backgroundColor: '#f0f0f0', 
//     marginRight: 8 
//   },
//   mealTypeBtnActive: { 
//     backgroundColor: '#452829' 
//   },
//   mealTypeBtnText: { 
//     color: '#57595B', 
//     fontWeight: '500', 
//     fontSize: 12 
//   },
//   mealTypeBtnTextActive: { 
//     color: '#FFFFFF' 
//   },
//   input: { 
//     backgroundColor: '#f0f0f0', 
//     paddingVertical: 12, 
//     paddingHorizontal: 12, 
//     borderRadius: 8, 
//     color: '#000000', 
//     marginBottom: 10, 
//     fontSize: 14 
//   },
//   smallInput: { 
//     flex: 1 
//   },
//   rowInputs: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     gap: 10 
//   },
//   photoRow: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     marginTop: 8, 
//     marginBottom: 16 
//   },
//   photoBtn: { 
//     backgroundColor: '#f0f0f0', 
//     paddingVertical: 8, 
//     paddingHorizontal: 12, 
//     borderRadius: 8, 
//     marginRight: 10 
//   },
//   photoBtnText: { 
//     color: '#452829', 
//     fontWeight: '500' 
//   },
//   photoPreview: { 
//     width: 56, 
//     height: 56, 
//     borderRadius: 8 
//   },
//   photoPreviewPlaceholder: { 
//     width: 56, 
//     height: 56, 
//     borderRadius: 8, 
//     backgroundColor: '#f0f0f0', 
//     alignItems: 'center', 
//     justifyContent: 'center' 
//   },
//   modalActions: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     marginTop: 20, 
//     gap: 10 
//   },
//   cancelBtn: { 
//     flex: 1, 
//     paddingVertical: 12, 
//     paddingHorizontal: 16, 
//     borderRadius: 8, 
//     backgroundColor: '#f0f0f0', 
//     alignItems: 'center' 
//   },
//   cancelBtnText: { 
//     color: '#000000', 
//     fontWeight: '500' 
//   },
//   saveBtn: { 
//     flex: 1.5, 
//     paddingVertical: 12, 
//     paddingHorizontal: 16, 
//     borderRadius: 8, 
//     backgroundColor: '#452829', 
//     alignItems: 'center' 
//   },
//   saveBtnText: { 
//     color: '#FFFFFF', 
//     fontWeight: 'bold' 
//   },
//   loadingContainer: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     paddingVertical: 20 
//   },
//   loadingText: { 
//     color: '#57595B', 
//     marginTop: 10 
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#452829',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 8,
//   },
// });

// export default DietLog;


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Modal,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from 'react-native-video';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useImageSelection } from '../../../context/AuthContext';
import { useDispatch } from 'react-redux';
import { saveDietEntry, getDietLogsByDate, updateDietLog, deleteDietLog } from '../../../redux/actions/dietActions';
import { Strings } from '../../../config/config'; // Import Config

const { width } = Dimensions.get('window');

const DietLog = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isImageSelectionInProgress, setIsImageSelectionInProgress } = useImageSelection();
  
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFats, setTotalFats] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(200);

  const [dailyCalorieGoal] = useState(2000);
  const [dailyProteinGoal] = useState(140);
  const [dailyCarbGoal] = useState(250);
  const [dailyFatGoal] = useState(70);

  const [meals, setMeals] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snacks: [],
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMealId, setEditMealId] = useState(null);
  const [fetching, setFetching] = useState(false);

  const isMounted = useRef(true);
  const appState = useRef(AppState.currentState);
  const appStateSubscription = useRef(null);
  
  useEffect(() => {
    console.log('DietLog component mounted');
    isMounted.current = true;
    
    appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
      console.log('AppState changed to', nextAppState);
      
      if (appState.current.match(/background/) && nextAppState === 'active' && isImageSelectionInProgress) {
        console.log('Returning from image selection, preventing unwanted navigation');
        setIsImageSelectionInProgress(false);
        
        setTimeout(() => {
          if (isMounted.current) {
            setModalVisible(true);
          }
        }, 300);
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      console.log('DietLog component unmounting');
      isMounted.current = false;
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, [isImageSelectionInProgress]);

  const [form, setForm] = useState({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    photo: null,
    mealType: 'breakfast', 
  });

  const fetchTodayDietLogs = async () => {
    if (isImageSelectionInProgress) {
      console.log('Skipping fetchTodayDietLogs during image selection');
      return;
    }
    
    setFetching(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await dispatch(getDietLogsByDate(today));
      
      if (response.success && response.data) {
        console.log('[DietLog] Full response structure:', JSON.stringify(response, null, 2));
        
        const transformedMeals = {
          Breakfast: [],
          Lunch: [],
          Dinner: [],
          Snacks: [],
        };
        
        const logsArray = response.data.logs || response.data || [];
        
        logsArray.forEach(log => {
          console.log(`[fetchTodayDietLogs] Processing log:`, JSON.stringify(log, null, 2));
          
          const mealType = log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1);
          if (transformedMeals[mealType]) {
            let photoUrl = null;
            
            if (log.photoUrl) {
              photoUrl = log.photoUrl;
            } 
            else if (log.photo) {
              photoUrl = log.photo;
            }
            else if (log.image) {
              photoUrl = log.image;
            } else if (log.imageUrl) {
              photoUrl = log.imageUrl;
            } else if (log.picture) {
              photoUrl = log.picture;
            } else if (log.pictureUrl) {
              photoUrl = log.pictureUrl;
            }
            
            console.log(`[fetchTodayDietLogs] Photo URL extracted: ${photoUrl}`);
            
            if (!photoUrl && log.attachments && log.attachments.length > 0) {
              photoUrl = log.attachments[0].url || log.attachments[0].uri || null;
            }
            
            transformedMeals[mealType].push({
              id: log.id,
              name: log.mealName,
              calories: log.calories,
              protein: log.protein,
              carbs: log.carbs,
              fats: log.fats,
              photo: photoUrl,
            });
          }
        });
        
        console.log('[DietLog] Transformed meals with photos:', JSON.stringify(transformedMeals, null, 2));
        setMeals(transformedMeals);
      }
    } catch (error) {
      console.error('Error fetching diet logs:', error);
      Alert.alert(Strings.DietLog.alerts.error.title, Strings.DietLog.alerts.error.fetchFailed);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTodayDietLogs();
  }, []);

  useEffect(() => {
    let cal = 0, prot = 0, carb = 0, fat = 0;
    for (const mealType in meals) {
      meals[mealType].forEach(meal => {
        cal += parseInt(meal.calories) || 0;
        prot += parseInt(meal.protein) || 0;
        carb += parseInt(meal.carbs) || 0;
        fat += parseInt(meal.fats) || 0;
      });
    }
    setTotalCalories(cal);
    setTotalProtein(prot);
    setTotalCarbs(carb);
    setTotalFats(fat);
  }, [meals]);

  const MacroRow = ({ label, value, goal, color }) => {
    const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
    return (
      <View style={styles.macroRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.macroValue}>{value}/{goal}g</Text>
      </View>
    );
  };

  const MealItem = ({ item, mealType }) => {
    console.log(`[MealItem] Rendering meal item: ${item.name}, photo:`, item.photo);
    
    const isValidUrl = item.photo && (item.photo.startsWith('http') || item.photo.startsWith('https') || item.photo.startsWith('file://'));
    
    return (
      <View style={styles.mealListItem}>
        <View style={styles.mealThumb}>
          {isValidUrl ? (
            <Image 
              source={{ uri: item.photo }} 
              style={styles.mealImage} 
              resizeMode="cover"
              onError={(error) => {
                console.log('Image loading error:', error.nativeEvent.error);
                console.log('Failed image URI:', item.photo);
              }}
              onLoad={() => console.log('Image loaded successfully:', item.photo)}
            />
          ) : (
            <Text style={styles.mealPlaceholderIcon}>🍽</Text>
          )}
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealStats}>{item.calories} kcal · {item.protein}P · {item.carbs}C · {item.fats}F</Text>
        </View>
        <View style={styles.mealActionIcons}>
          <TouchableOpacity onPress={() => openEditModal(mealType, item)} style={{ marginRight: 6 }}>
            <Icon name="pencil" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteMeal(mealType, item.id)}>
            <Icon name="delete" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleFormInput = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      mealName: '', calories: '', protein: '', carbs: '', fats: '', photo: null, mealType: 'breakfast',
    });
    setEditMealId(null);
  };

  const openEditModal = (mealType, meal) => {
    console.log(`[openEditModal] Opening modal for meal: ${meal.name}, photo:`, meal.photo);
    
    setForm({
      mealName: meal.name,
      calories: meal.calories.toString(),
      protein: meal.protein.toString(),
      carbs: meal.carbs.toString(),
      fats: meal.fats.toString(),
      photo: meal.photo ? { uri: meal.photo } : null,
      mealType: mealType.toLowerCase(), 
    });
    setEditMealId(meal.id);
    setModalVisible(true);
  };

  const handleDeleteMeal = async (mealType, id) => {
    const item = meals[mealType].find(m => m.id === id);
    if (!item) return;
    
    Alert.alert(Strings.DietLog.alerts.delete.title, Strings.DietLog.alerts.delete.msg(item.name), [
      { text: Strings.DietLog.alerts.delete.cancel, style: 'cancel' },
      {
        text: Strings.DietLog.alerts.delete.confirm, style: 'destructive', onPress: async () => {
          try {
            await dispatch(deleteDietLog(id));
            
            setMeals(prev => ({
              ...prev,
              [mealType]: prev[mealType].filter(m => m.id !== id),
            }));
            
            Alert.alert(Strings.DietLog.alerts.success.title, Strings.DietLog.alerts.success.deletedMsg);
          } catch (error) {
            console.error('Error deleting meal:', error);
            Alert.alert(Strings.DietLog.alerts.error.title, Strings.DietLog.alerts.error.deleteFailed);
          }
        },
      },
    ]);
  };
  
  const handleAddOrEditMeal = async () => {
    if (!form.mealName.trim() || !form.calories.trim()) {
      return Alert.alert(Strings.DietLog.alerts.validation.title, Strings.DietLog.alerts.validation.msg);
    }
    setLoading(true);

    try {
      let response;
      
      if (editMealId) {
        response = await dispatch(updateDietLog(editMealId, form));
      } else {
        response = await dispatch(saveDietEntry(form));
      }

      console.log('[handleAddOrEditMeal] Save response:', JSON.stringify(response, null, 2));

      if (response.success) {
        const photoUrl = response.data?.photoUrl || response.data?.photo || response.data?.image || response.data?.imageUrl || response.data?.picture || response.data?.pictureUrl || null;
        console.log('[handleAddOrEditMeal] Photo URL from response:', photoUrl);
        
        const mealData = {
          id: editMealId || response.data?.id || Date.now().toString(),
          name: form.mealName,
          calories: parseInt(form.calories) || 0,
          protein: parseInt(form.protein) || 0,
          carbs: parseInt(form.carbs) || 0,
          fats: parseInt(form.fats) || 0,
          photo: photoUrl,
        };
        
        console.log('[handleAddOrEditMeal] Meal data with photo:', JSON.stringify(mealData, null, 2));
        
        const mealTypeKey = form.mealType.charAt(0).toUpperCase() + form.mealType.slice(1);

        if (editMealId) {
          setMeals(prev => ({
            ...prev,
            [mealTypeKey]: prev[mealTypeKey].map(item => 
              item.id === editMealId ? mealData : item
            ),
          }));
        } else {
          setMeals(prev => ({
            ...prev,
            [mealTypeKey]: [mealData, ...prev[mealTypeKey]],
          }));
        }

        closeModal();
        Alert.alert(Strings.DietLog.alerts.success.title, editMealId ? Strings.DietLog.alerts.success.updatedMsg : Strings.DietLog.alerts.success.addedMsg);
        
        setTimeout(() => {
          fetchTodayDietLogs();
        }, 500);
      } else {
        Alert.alert(
          Strings.DietLog.alerts.error.warning, 
          response.message || Strings.DietLog.alerts.error.generic
        );
      }
    } catch (error) {
      console.error('Save diet error:', error);
      Alert.alert(
        Strings.DietLog.alerts.error.warning, 
        Strings.DietLog.alerts.error.generic
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  }

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          { title: "Camera Permission", message: "We need access to your camera to take meal photos", buttonPositive: "OK" }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else return true;
  };

  const pickImage = async (fromCamera = false) => {
    if (!isMounted.current) {
      console.error('Component is not mounted, aborting image selection');
      return;
    }
    
    setIsImageSelectionInProgress(true);
    
    const options = { mediaType: 'photo', quality: 0.7 };
    const action = fromCamera ? launchCamera : launchImageLibrary;

    try {
        const result = await action(options);
        
        if (!isMounted.current) {
          console.error('Component was unmounted during image selection');
          setIsImageSelectionInProgress(false);
          return;
        }
        
        if (result.didCancel) {
          setIsImageSelectionInProgress(false);
          return;
        }
        
        if (result.assets && result.assets.length > 0) {
            console.log('[pickImage] Selected image:', result.assets[0]);
            handleFormInput('photo', result.assets[0]);
        } else {
            Alert.alert(Strings.DietLog.alerts.error.title, 'No photo was selected.');
        }
    } catch (error) {
        console.log('ImagePicker error:', error);
        Alert.alert(Strings.DietLog.alerts.error.title, 'Could not access camera or gallery.');
    } finally {
      setTimeout(() => {
        setIsImageSelectionInProgress(false);
        console.log('Image selection process completed');
      }, 500);
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (hasPermission) pickImage(true);
  };

  const mockSyncWorkout = () => {
    const burned = 320; 
    setExerciseCalories(p => p + burned);
    Alert.alert(Strings.DietLog.actions.syncAlertTitle, Strings.DietLog.actions.syncAlertMsg(burned));
  };

  const remainingCalories = Math.max(dailyCalorieGoal - totalCalories + exerciseCalories, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.DietLog.header.title}</Text>
          <View style={styles.avatarPlaceholder}>
            <Icon name="account" size={24} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.statsRowWrapper}>
          <View style={styles.statsRow}>
            <View style={styles.caloriesCard}>
              <Text style={styles.cardHeading}>{Strings.DietLog.stats.calories}</Text>
              <View style={styles.caloriesNumRow}>
                <View style={styles.caloriesNumCol}>
                  <Text style={styles.caloriesValue}>{totalCalories}</Text>
                  <Text style={styles.caloriesLabel}>{Strings.DietLog.stats.food}</Text>
                </View>
                <View style={styles.caloriesNumCol}>
                  <Text style={styles.caloriesValue}>{exerciseCalories}</Text>
                  <Text style={styles.caloriesLabel}>{Strings.DietLog.stats.exercise}</Text>
                </View>
                <View style={styles.caloriesNumCol}>
                  <Text style={styles.caloriesValueRemaining}>{remainingCalories}</Text>
                  <Text style={styles.caloriesLabel}>{Strings.DietLog.stats.remaining}</Text>
                </View>
              </View>
              <View style={styles.calorieProgressTrack}>
                <View style={[styles.calorieProgressFill, { width: `${dailyCalorieGoal > 0 ? Math.min(100, (totalCalories / dailyCalorieGoal) * 100) : 0}%` }]} />
              </View>
              <Text style={styles.calorieGoalText}>{Strings.DietLog.stats.goal} {dailyCalorieGoal} kcal · {Strings.DietLog.stats.consumed} {totalCalories} kcal</Text>
            </View>

            <View style={styles.macrosCard}>
              <Text style={styles.cardHeading}>{Strings.DietLog.stats.macros}</Text>
              <MacroRow label={Strings.Activity.dailyMacros.macros.carbs} value={totalCarbs} goal={dailyCarbGoal} color="#452829" />
              <MacroRow label={Strings.Activity.dailyMacros.macros.protein} value={totalProtein} goal={dailyProteinGoal} color="#452829" />
              <MacroRow label={Strings.Activity.dailyMacros.macros.fats} value={totalFats} goal={dailyFatGoal} color="#452829" />
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)} disabled={fetching}>
            <Text style={styles.primaryBtnText}>{Strings.DietLog.actions.addMeal}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={mockSyncWorkout}>
            <Text style={styles.ghostBtnText}>{Strings.DietLog.actions.syncWorkout}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{Strings.DietLog.section.title}</Text>
          {fetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#452829" />
              <Text style={styles.loadingText}>{Strings.DietLog.section.loadingText}</Text>
            </View>
          ) : (
            Object.keys(meals).map(mealType => (
              <View key={mealType} style={{ marginBottom: 12 }}>
                <View style={styles.mealHeaderRow}>
                  <Text style={styles.mealHeaderTitle}>{mealType}</Text>
                  <Text style={styles.mealHeaderCount}>{meals[mealType].length} {Strings.DietLog.section.itemCount}</Text>
                </View>
                {meals[mealType].length === 0 ? (
                  <View style={styles.emptyMealRow}>
                    <Text style={styles.emptyMealText}>{Strings.DietLog.section.emptyText(mealType)}</Text>
                  </View>
                ) : (
                  <FlatList 
                    data={meals[mealType]} 
                    keyExtractor={i => i.id} 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    renderItem={({ item }) => <MealItem item={item} mealType={mealType} />} 
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editMealId ? Strings.DietLog.modal.titleEdit : Strings.DietLog.modal.titleAdd}</Text>
              
              <View style={styles.mealTypeRow}>
                {Strings.DietLog.mealTypes.map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.mealTypeBtn, form.mealType === t.toLowerCase() && styles.mealTypeBtnActive]} 
                    onPress={() => handleFormInput('mealType', t.toLowerCase())}
                  >
                    <Text style={[styles.mealTypeBtnText, form.mealType === t.toLowerCase() && styles.mealTypeBtnTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput 
                placeholder={Strings.DietLog.modal.input.mealName} 
                placeholderTextColor="#57595B" 
                style={styles.input} 
                value={form.mealName} 
                onChangeText={(v) => handleFormInput('mealName', v)} 
              />

              <View style={styles.rowInputs}>
                <TextInput 
                  placeholder={Strings.DietLog.modal.input.calories} 
                  placeholderTextColor="#57595B" 
                  style={[styles.input,styles.smallInput]} 
                  value={form.calories} 
                  onChangeText={(v) => handleFormInput('calories', v)} 
                  keyboardType="numeric" 
                />
                <TextInput 
                  placeholder={Strings.DietLog.modal.input.protein} 
                  placeholderTextColor="#57595B" 
                  style={[styles.input,styles.smallInput]} 
                  value={form.protein} 
                  onChangeText={(v) => handleFormInput('protein', v)} 
                  keyboardType="numeric" 
                />
              </View>
              <View style={styles.rowInputs}>
                <TextInput 
                  placeholder={Strings.DietLog.modal.input.carbs} 
                  placeholderTextColor="#57595B" 
                  style={[styles.input,styles.smallInput]} 
                  value={form.carbs} 
                  onChangeText={(v) => handleFormInput('carbs', v)} 
                  keyboardType="numeric" 
                />
                <TextInput 
                  placeholder={Strings.DietLog.modal.input.fats} 
                  placeholderTextColor="#57595B" 
                  style={[styles.input,styles.smallInput]} 
                  value={form.fats} 
                  onChangeText={(v) => handleFormInput('fats', v)} 
                  keyboardType="numeric" 
                />
              </View>

              <View style={styles.photoRow}>
                <TouchableOpacity onPress={() => pickImage(false)} style={styles.photoBtn}>
                  <Text style={styles.photoBtnText}>{Strings.DietLog.modal.photo.upload}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto} style={styles.photoBtn}>
                  <Text style={styles.photoBtnText}>{Strings.DietLog.modal.photo.takePhoto}</Text>
                </TouchableOpacity>
                {form.photo ? (
                  <Image 
                    source={{ uri: form.photo.uri || form.photo }} 
                    style={styles.photoPreview} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.photoPreviewPlaceholder}>
                    <Icon name="camera" color="#57595B" size={24} />
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>{Strings.DietLog.modal.buttons.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrEditMeal} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>{editMealId ? Strings.DietLog.modal.buttons.saveChanges : Strings.DietLog.modal.buttons.save}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity style={styles.fab}>
        <Icon name="smart-toy" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#452829',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRowWrapper: { 
    paddingHorizontal: 16, 
    marginTop: 24 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  caloriesCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginRight: 8, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 3 }, 
    elevation: 5 
  },
  cardHeading: { 
    color: '#000000', 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  caloriesNumRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  caloriesNumCol: { 
    alignItems: 'center' 
  },
  caloriesValue: { 
    color: '#000000', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  caloriesValueRemaining: { 
    color: '#452829', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  caloriesLabel: { 
    color: '#57595B', 
    fontSize: 12 
  },
  calorieProgressTrack: { 
    backgroundColor: '#f0f0f0', 
    height: 6, 
    borderRadius: 3, 
    marginVertical: 12 
  },
  calorieProgressFill: { 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#452829' 
  },
  calorieGoalText: { 
    color: '#57595B', 
    fontSize: 10, 
    marginTop: 2 
  },
  macrosCard: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginLeft: 8,
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    shadowOffset: { width: 0, height: 3 }, 
    elevation: 5 
  },
  macroRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 8 
  },
  macroLabel: { 
    color: '#000000', 
    fontSize: 14, 
    width: 60 
  },
  progressBarBackground: { 
    flex: 1, 
    height: 6, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 3, 
    marginHorizontal: 8 
  },
  progressBarFill: { 
    height: 6, 
    borderRadius: 3 
  },
  macroValue: { 
    color: '#57595B', 
    fontSize: 12, 
    width: 60, 
    textAlign: 'right' 
  },
  actionRow: { 
    paddingHorizontal: 16, 
    marginTop: 24, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  primaryBtn: { 
    backgroundColor: '#452829', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  primaryBtnText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 14 
  },
  ghostBtn: { 
    backgroundColor: 'transparent', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#452829', 
    marginLeft: 12, 
    alignItems: 'center' 
  },
  ghostBtnText: { 
    color: '#452829', 
    fontWeight: '700' 
  },
  section: { 
    marginTop: 24, 
    paddingHorizontal: 16 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    marginBottom: 16 
  },
  mealHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  mealHeaderTitle: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  mealHeaderCount: { 
    color: '#57595B', 
    fontWeight: '500' 
  },
  emptyMealRow: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    height: 90, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  emptyMealText: { 
    color: '#57595B' 
  },
  mealListItem: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    marginRight: 12, 
    width: width * 0.75, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  mealThumb: { 
    width: 70, 
    height: 70, 
    borderRadius: 12, 
    overflow: 'hidden', 
    backgroundColor: '#f0f0f0', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  mealImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  mealPlaceholderIcon: { 
    fontSize: 26, 
    color: '#57595B' 
  },
  mealInfo: { 
    flex: 1 
  },
  mealName: { 
    color: '#000000', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  mealStats: { 
    color: '#57595B', 
    marginTop: 4, 
    fontSize: 12, 
    fontWeight: '500' 
  },
  mealActionIcons: { 
    flexDirection: 'row', 
    paddingLeft: 10 
  },
  modalWrap: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    padding: 24, 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16 
  },
  modalTitle: { 
    color: '#000000', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16, 
    textAlign: 'center' 
  },
  mealTypeRow: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    justifyContent: 'center' 
  },
  mealTypeBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0', 
    marginRight: 8 
  },
  mealTypeBtnActive: { 
    backgroundColor: '#452829' 
  },
  mealTypeBtnText: { 
    color: '#57595B', 
    fontWeight: '500', 
    fontSize: 12 
  },
  mealTypeBtnTextActive: { 
    color: '#FFFFFF' 
  },
  input: { 
    backgroundColor: '#f0f0f0', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    color: '#000000', 
    marginBottom: 10, 
    fontSize: 14 
  },
  smallInput: { 
    flex: 1 
  },
  rowInputs: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 10 
  },
  photoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    marginBottom: 16 
  },
  photoBtn: { 
    backgroundColor: '#f0f0f0', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    marginRight: 10 
  },
  photoBtnText: { 
    color: '#452829', 
    fontWeight: '500' 
  },
  photoPreview: { 
    width: 56, 
    height: 56, 
    borderRadius: 8 
  },
  photoPreviewPlaceholder: { 
    width: 56, 
    height: 56, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20, 
    gap: 10 
  },
  cancelBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    backgroundColor: '#f0f0f0', 
    alignItems: 'center' 
  },
  cancelBtnText: { 
    color: '#000000', 
    fontWeight: '500' 
  },
  saveBtn: { 
    flex: 1.5, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    backgroundColor: '#452829', 
    alignItems: 'center' 
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  loadingText: { 
    color: '#57595B', 
    marginTop: 10 
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#452829',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default DietLog;