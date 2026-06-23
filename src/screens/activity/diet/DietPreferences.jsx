import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/apiClient';

const { width } = Dimensions.get('window');

const DietPreferences = ({ navigation }) => {
  const [preference, setPreference] = useState('Selective Non-Veg');
  const [skipDays, setSkipDays] = useState(['Monday']);
  const [selectedMeals, setSelectedMeals] = useState(['Lunch', 'Dinner']);
  const [selectedAllergies, setSelectedAllergies] = useState(['No Known Allergies']);
  const [selectedCuisines, setSelectedCuisines] = useState(['USA Food']);
  const [otherInfo, setOtherInfo] = useState('Love extra protein, low calorie');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sub-screen toggles
  const [showPreferenceSelect, setShowPreferenceSelect] = useState(false);
  const [showSkipDaysSelect, setShowSkipDaysSelect] = useState(false);
  const [showMealsSelect, setShowMealsSelect] = useState(false);
  const [showAllergiesSelect, setShowAllergiesSelect] = useState(false);
  const [showCuisinesSelect, setShowCuisinesSelect] = useState(false);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('diet_preference');
        const savedSkipDays = await AsyncStorage.getItem('diet_skip_days');
        const savedMeals = await AsyncStorage.getItem('diet_meals');
        const savedAllergies = await AsyncStorage.getItem('diet_allergies');
        const savedCuisines = await AsyncStorage.getItem('diet_cuisines');
        const savedOtherInfo = await AsyncStorage.getItem('diet_other_info');

        if (savedPreference) setPreference(savedPreference);
        if (savedSkipDays) setSkipDays(JSON.parse(savedSkipDays));
        if (savedMeals) {
          try {
            setSelectedMeals(JSON.parse(savedMeals));
          } catch (e) {
            setSelectedMeals(savedMeals.split(', ').filter(Boolean));
          }
        }
        if (savedAllergies) {
          try {
            setSelectedAllergies(JSON.parse(savedAllergies));
          } catch (e) {
            setSelectedAllergies(savedAllergies.split(', ').filter(Boolean));
          }
        }
        if (savedCuisines) {
          try {
            setSelectedCuisines(JSON.parse(savedCuisines));
          } catch (e) {
            setSelectedCuisines(savedCuisines.split(', ').filter(Boolean));
          }
        }
        if (savedOtherInfo) setOtherInfo(savedOtherInfo);
      } catch (err) {
        console.error('Error loading diet preferences:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedData();
  }, []);

  // Sync to backend whenever any setting is updated
  useEffect(() => {
    if (!isLoaded) return;

    const syncPreferences = async () => {
      try {
        const payload = {
          dietPreference: preference,
          skipDays,
          meals: selectedMeals,
          allergies: selectedAllergies,
          cuisines: selectedCuisines,
          otherInfo,
        };

        const endpoints = [
          { method: 'put', url: '/users/profile' },
          { method: 'put', url: '/v1/auth/update-user-profile' },
          { method: 'patch', url: '/v1/auth/user-profile' },
          { method: 'put', url: '/v1/auth/user-profile' },
        ];

        for (const endpoint of endpoints) {
          try {
            await apiClient[endpoint.method](endpoint.url, payload);
            console.log(`[DietPreferences] Synced preferences to backend at ${endpoint.url}`);
            break;
          } catch (e) {
            // ignore and try next
          }
        }
      } catch (err) {
        console.warn('[DietPreferences] Sync to backend failed:', err.message);
      }
    };

    syncPreferences();
  }, [preference, skipDays, selectedMeals, selectedAllergies, selectedCuisines, otherInfo, isLoaded]);

  const preferencesOptions = [
    {
      title: 'No Restriction',
      desc: 'Eats all foods and meats',
    },
    {
      title: 'Vegetarian',
      desc: 'No meat, fish or eggs',
    },
    {
      title: 'Eggetarian',
      desc: 'vegetarian with eggs',
    },
    {
      title: 'Vegan',
      desc: 'No animal products',
    },
    {
      title: 'Selective Non-Veg',
      desc: 'Eats some meats only',
    },
    {
      title: 'Jain Vegetarian',
      desc: 'No meat, eggs, roots',
    },
  ];

  const daysOptions = [
    { title: 'No Fixed Days', desc: '' },
    { title: 'Monday', desc: 'Kickstart your week' },
    { title: 'Tuesday', desc: 'Stay focused' },
    { title: 'Wednesday', desc: 'Mid-week push' },
    { title: 'Thursday', desc: 'Keep growing' },
    { title: 'Friday', desc: 'Finish strong' },
    { title: 'Saturday', desc: 'Rest and recharge' },
    { title: 'Sunday', desc: 'Prepare for the week' },
  ];

  const mealsOptions = [
    { title: 'Breakfast', desc: 'Kickstart your day', image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=150&q=80' },
    { title: 'Morning Snack', desc: 'Stay energized', image: null },
    { title: 'Lunch', desc: 'Mid-day fuel', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' },
    { title: 'Evening Snack', desc: 'Healthy tide-over', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=150&q=80' },
    { title: 'Dinner', desc: 'End your day right', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=150&q=80' },
  ];

  const allergiesOptions = [
    { title: 'No Known Allergies', desc: '', hasPlaceholder: false },
    { title: 'Dairy', desc: 'Milk, cheese, butter', hasPlaceholder: true },
    { title: 'Eggs', desc: 'All egg products', hasPlaceholder: true },
    { title: 'Peanuts', desc: 'Groundnuts, peanut butter', hasPlaceholder: true },
    { title: 'Tree Nuts', desc: 'Almonds, cashews, walnuts', hasPlaceholder: true },
    { title: 'Gluten / Wheat', desc: 'Gluten containing foods', hasPlaceholder: true },
  ];

  const popularCuisines = [
    { title: 'North Indian', desc: 'Punjabi, Awadhi, Rajasthani etc.', image: 'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?auto=format&fit=crop&w=150&q=80' },
    { title: 'South Indian', desc: 'Tamil, Andhra, Kerala, Karnataka foods', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=150&q=80' },
    { title: 'Kerala', desc: 'Sadhya, Appam, Malabar Parotta', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=150&q=80' },
  ];

  const otherCuisines = [
    { title: 'USA Food', desc: 'Burgers, fries, hot dogs, steaks', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSelectPreference = async (title) => {
    setPreference(title);
    setShowPreferenceSelect(false);
    try {
      await AsyncStorage.setItem('diet_preference', title);
    } catch (err) {
      console.error('Failed to save preference:', err);
    }
  };

  const handleToggleSkipDay = async (dayTitle) => {
    let updatedDays = [...skipDays];
    if (dayTitle === 'No Fixed Days') {
      updatedDays = ['No Fixed Days'];
    } else {
      updatedDays = updatedDays.filter(d => d !== 'No Fixed Days');
      
      if (updatedDays.includes(dayTitle)) {
        updatedDays = updatedDays.filter(d => d !== dayTitle);
        if (updatedDays.length === 0) {
          updatedDays = ['No Fixed Days'];
        }
      } else {
        updatedDays.push(dayTitle);
      }
    }
    setSkipDays(updatedDays);
    try {
      await AsyncStorage.setItem('diet_skip_days', JSON.stringify(updatedDays));
    } catch (err) {
      console.error('Failed to save skip days:', err);
    }
  };

  const handleToggleMeal = async (mealTitle) => {
    let updatedMeals = [...selectedMeals];
    if (updatedMeals.includes(mealTitle)) {
      updatedMeals = updatedMeals.filter(m => m !== mealTitle);
    } else {
      updatedMeals.push(mealTitle);
    }
    setSelectedMeals(updatedMeals);
    try {
      await AsyncStorage.setItem('diet_meals', JSON.stringify(updatedMeals));
    } catch (err) {
      console.error('Failed to save meals:', err);
    }
  };

  const handleToggleAllergy = async (allergyTitle) => {
    let updatedAllergies = [...selectedAllergies];
    if (allergyTitle === 'No Known Allergies') {
      updatedAllergies = ['No Known Allergies'];
    } else {
      updatedAllergies = updatedAllergies.filter(a => a !== 'No Known Allergies');
      
      if (updatedAllergies.includes(allergyTitle)) {
        updatedAllergies = updatedAllergies.filter(a => a !== allergyTitle);
        if (updatedAllergies.length === 0) {
          updatedAllergies = ['No Known Allergies'];
        }
      } else {
        updatedAllergies.push(allergyTitle);
      }
    }
    setSelectedAllergies(updatedAllergies);
    try {
      await AsyncStorage.setItem('diet_allergies', JSON.stringify(updatedAllergies));
    } catch (err) {
      console.error('Failed to save allergies:', err);
    }
  };

  const handleToggleCuisine = async (cuisineTitle) => {
    let updatedCuisines = [...selectedCuisines];
    if (updatedCuisines.includes(cuisineTitle)) {
      updatedCuisines = updatedCuisines.filter(c => c !== cuisineTitle);
    } else {
      updatedCuisines.push(cuisineTitle);
    }
    setSelectedCuisines(updatedCuisines);
    try {
      await AsyncStorage.setItem('diet_cuisines', JSON.stringify(updatedCuisines));
    } catch (err) {
      console.error('Failed to save cuisines:', err);
    }
  };

  // RENDER SELECTOR VIEW (Grid of Dietary Preferences)
  if (showPreferenceSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowPreferenceSelect(false)} style={styles.backBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.selectorWrapper}>
          <Text style={styles.selectorTitle}>what's your dietary preference?</Text>

          {/* Grid Selection */}
          <View style={styles.gridContainer}>
            {preferencesOptions.map((opt) => {
              const isSelected = preference === opt.title;
              return (
                <TouchableOpacity
                  key={opt.title}
                  style={[styles.gridCard, isSelected && styles.gridCardSelected]}
                  onPress={() => handleSelectPreference(opt.title)}
                  activeOpacity={0.8}
                >
                  {/* Upper section with checkered background */}
                  <View style={styles.gridCardUpper}>
                    <Image
                      source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIklEQVQ4y2P8z4AdMDKgDnBqamqippGURlIaSWkkpRFGDwUAHz4EAep4X4gAAAAASUVORK5CYII=' }}
                      style={styles.checkerboard}
                      resizeMode="repeat"
                    />
                    
                    {/* Radio circle in top right */}
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>

                    {/* Centered description */}
                    <Text style={styles.gridCardDesc}>{opt.desc}</Text>
                  </View>

                  {/* Bottom section with solid white background */}
                  <View style={styles.gridCardLower}>
                    <Text style={styles.gridCardTitle}>{opt.title}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // RENDER SKIP DAYS SELECT VIEW (Vegetarian Days Selection)
  if (showSkipDaysSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSkipDaysSelect(false)} style={styles.backBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Which days do you prefer vegetarian meals only</Text>

          {daysOptions.map((opt) => {
            const isSelected = skipDays.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                onPress={() => handleToggleSkipDay(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: solid white rounded square */}
                <View style={styles.dayCardLeft} />

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={styles.dayCardTitle}>{opt.title}</Text>
                  {opt.desc ? <Text style={styles.dayCardDesc}>{opt.desc}</Text> : null}
                </View>

                {/* Right side: Checkbox */}
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && <Icon name="checkmark" size={14} color="#000" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER MEALS SELECT VIEW (Vegetarian Meals Selection)
  if (showMealsSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowMealsSelect(false)} style={styles.backBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          {/* Note: matching the exact mockup text spelling */}
          <Text style={styles.listTitle}>
            Which days do you{"\n"}prefervegetarian meals only
          </Text>

          {mealsOptions.map((opt) => {
            const isSelected = selectedMeals.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[styles.mealCard, isSelected && styles.mealCardSelected]}
                onPress={() => handleToggleMeal(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: Food thumbnail image or dark placeholder */}
                {opt.image ? (
                  <Image source={{ uri: opt.image }} style={styles.mealCardImage} />
                ) : (
                  <View style={styles.mealCardPlaceholder} />
                )}

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={styles.dayCardTitle}>{opt.title}</Text>
                  {opt.desc ? <Text style={styles.dayCardDesc}>{opt.desc}</Text> : null}
                </View>

                {/* Right side: Checkbox */}
                <View style={[styles.mealCheckbox, isSelected && styles.mealCheckboxSelected]}>
                  {isSelected && <Icon name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER ALLERGIES SELECT VIEW
  if (showAllergiesSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowAllergiesSelect(false)} style={styles.backBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Are there any foods you're allergic to?</Text>

          {allergiesOptions.map((opt) => {
            const isSelected = selectedAllergies.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[styles.mealCard, isSelected && styles.mealCardSelected]}
                onPress={() => handleToggleAllergy(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: dark placeholder if hasPlaceholder is true */}
                {opt.hasPlaceholder ? (
                  <View style={styles.mealCardPlaceholder} />
                ) : null}

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={styles.dayCardTitle}>{opt.title}</Text>
                  {opt.desc ? <Text style={styles.dayCardDesc}>{opt.desc}</Text> : null}
                </View>

                {/* Right side: Checkbox */}
                <View style={[styles.mealCheckbox, isSelected && styles.mealCheckboxSelected]}>
                  {isSelected && <Icon name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER CUISINES SELECT VIEW
  if (showCuisinesSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCuisinesSelect(false)} style={styles.backBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Which cuisines would you like us{"\n"}to include?</Text>

          {/* POPULAR IN YOUR AREA SECTION */}
          <Text style={styles.sectionHeader}>POPULAR IN YOUR AREA</Text>
          {popularCuisines.map((opt) => {
            const isSelected = selectedCuisines.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[
                  styles.cuisineCard,
                  isSelected && styles.cuisineCardSelected,
                ]}
                onPress={() => handleToggleCuisine(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: Food image container */}
                <Image source={{ uri: opt.image }} style={styles.cuisineCardImage} />

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={[styles.dayCardTitle, isSelected && styles.cuisineCardTitleSelected]}>
                    {opt.title}
                  </Text>
                  <Text style={[styles.dayCardDesc, isSelected && styles.cuisineCardDescSelected]}>
                    {opt.desc}
                  </Text>
                </View>

                {/* Right side: Checkbox */}
                <View
                  style={[
                    styles.cuisineCheckbox,
                    isSelected && styles.cuisineCheckboxSelected,
                  ]}
                >
                  {isSelected && <Icon name="checkmark" size={12} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* OTHER CUISINES SECTION */}
          <Text style={[styles.sectionHeader, { marginTop: 25 }]}>OTHER CUISINES</Text>
          {otherCuisines.map((opt) => {
            const isSelected = selectedCuisines.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[
                  styles.cuisineCard,
                  isSelected && styles.cuisineCardSelected,
                ]}
                onPress={() => handleToggleCuisine(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: Food image container */}
                <Image source={{ uri: opt.image }} style={styles.cuisineCardImage} />

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={[styles.dayCardTitle, isSelected && styles.cuisineCardTitleSelected]}>
                    {opt.title}
                  </Text>
                  <Text style={[styles.dayCardDesc, isSelected && styles.cuisineCardDescSelected]}>
                    {opt.desc}
                  </Text>
                </View>

                {/* Right side: Checkbox */}
                <View
                  style={[
                    styles.cuisineCheckbox,
                    isSelected && styles.cuisineCheckboxSelected,
                  ]}
                >
                  {isSelected && <Icon name="checkmark" size={12} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER MAIN LIST VIEW
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goals and Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preference Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => setShowPreferenceSelect(true)} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="food-apple" size={20} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Preference</Text>
              <Text style={styles.cardValue}>{preference}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>

        {/* Skip Non-veg Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => setShowSkipDaysSelect(true)} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="calendar-blank" size={20} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Skip Non-veg</Text>
              <Text style={styles.cardValue}>
                {skipDays.length > 0 ? skipDays.join(', ') : 'No Fixed Days'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>

        {/* Meals Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => setShowMealsSelect(true)} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Meals</Text>
              <Text style={styles.cardValue}>
                {selectedMeals.length > 0 ? selectedMeals.join(', ') : 'None'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>

        {/* Allergies Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => setShowAllergiesSelect(true)} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="warning-outline" size={18} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Allergies</Text>
              <Text style={styles.cardValue}>
                {selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'No Known Allergies'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>

        {/* Cuisines Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => setShowCuisinesSelect(true)} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="earth-outline" size={18} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Cuisines</Text>
              <Text style={styles.cardValue}>
                {selectedCuisines.length > 0 ? selectedCuisines.join(', ') : 'None'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>

        {/* Other Info Card */}
        <TouchableOpacity 
          style={styles.cardContainer} 
          onPress={() => Alert.alert('Other Info', 'Add custom instructions in onboarding.')} 
          activeOpacity={0.9}
        >
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="information-circle-outline" size={20} color="#666" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Other info</Text>
              <Text style={styles.cardValue}>{otherInfo}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#BBB" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 25,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 60,
    paddingRight: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarOverlap: {
    position: 'absolute',
    left: -15,
    top: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrapper: {
    flex: 1,
  },
  cardLabel: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardValue: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  selectorWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    width: '100%',
  },
  gridCard: {
    flex: 1,
    minWidth: '28%',
    maxWidth: '31%',
    marginHorizontal: 5,
    marginBottom: 10,
    height: 135,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  gridCardSelected: {
    borderColor: '#7C4DFF',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  gridCardUpper: {
    height: 95,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  checkerboard: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  radioCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#7C4DFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7C4DFF',
  },
  gridCardDesc: {
    color: '#333',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 15,
    paddingHorizontal: 4,
  },
  gridCardLower: {
    height: 37,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gridCardTitle: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  listScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  listTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    height: 72,
  },
  dayCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#111115',
  },
  dayCardLeft: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  dayCardMiddle: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  dayCardTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dayCardDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    height: 72,
  },
  mealCardSelected: {
    borderColor: '#00E676',
    backgroundColor: '#0c1a11',
  },
  mealCardImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  mealCardPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  mealCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCheckboxSelected: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  cuisineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    height: 72,
  },
  cuisineCardSelected: {
    backgroundColor: '#FFF',
    borderColor: '#00E676',
  },
  cuisineCardImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  cuisineCardTitleSelected: {
    color: '#000',
  },
  cuisineCardDescSelected: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  cuisineCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cuisineCheckboxSelected: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
    borderRadius: 11,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 15,
    opacity: 0.6,
  },
});

export default DietPreferences;
