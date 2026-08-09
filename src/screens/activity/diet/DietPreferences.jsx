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
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/apiClient';

const { width } = Dimensions.get('window');

const DietPreferences = ({ navigation, route }) => {
  const [preference, setPreference] = useState('Selective Non-Veg');
  const [skipDays, setSkipDays] = useState(['Monday']);
  const [nonVegDays, setNonVegDays] = useState(['Wednesday', 'Sunday']);
  const [selectedMeals, setSelectedMeals] = useState(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
  const [selectedAllergies, setSelectedAllergies] = useState(['No Known Allergies']);
  const [selectedCuisines, setSelectedCuisines] = useState(['USA Food']);
  const [avoidedFoods, setAvoidedFoods] = useState([]);
  const [cuisineFrequency, setCuisineFrequency] = useState({});
  const [otherInfo, setOtherInfo] = useState('Love extra protein, low calorie');
  const [isLoaded, setIsLoaded] = useState(false);

  // Sub-screen toggles
  const [showPreferenceSelect, setShowPreferenceSelect] = useState(false);
  const [showSkipDaysSelect, setShowSkipDaysSelect] = useState(false);
  const [showNonVegDaysSelect, setShowNonVegDaysSelect] = useState(false);
  const [showAllergiesSelect, setShowAllergiesSelect] = useState(false);
  const [showCuisinesSelect, setShowCuisinesSelect] = useState(false);
  const [showAvoidSelect, setShowAvoidSelect] = useState(false);
  const [showCuisineFrequencySelect, setShowCuisineFrequencySelect] = useState(false);
  const [showOtherInfoSelect, setShowOtherInfoSelect] = useState(false);
  const [isFlowMode, setIsFlowMode] = useState(false);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem('diet_preference');
        const savedSkipDays = await AsyncStorage.getItem('diet_skip_days');
        const savedNonVegDays = await AsyncStorage.getItem('diet_nonveg_days');
        const savedMeals = await AsyncStorage.getItem('diet_meals');
        const savedAllergies = await AsyncStorage.getItem('diet_allergies');
        const savedCuisines = await AsyncStorage.getItem('diet_cuisines');
        const savedAvoided = await AsyncStorage.getItem('diet_avoided_foods');
        const savedCuisineFreq = await AsyncStorage.getItem('diet_cuisine_frequency');
        const savedOtherInfo = await AsyncStorage.getItem('diet_other_info');
        const savedFlowCompleted = await AsyncStorage.getItem('diet_flow_completed');

        if (savedPreference) setPreference(savedPreference);
        if (savedSkipDays) setSkipDays(JSON.parse(savedSkipDays));
        if (savedNonVegDays) setNonVegDays(JSON.parse(savedNonVegDays));
        if (savedMeals) {
          try {
            const parsed = JSON.parse(savedMeals);
            if (Array.isArray(parsed) && parsed.length === 2 && parsed.includes('Lunch') && parsed.includes('Dinner')) {
              setSelectedMeals(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
              await AsyncStorage.setItem('diet_meals', JSON.stringify(['Breakfast', 'Lunch', 'Snack', 'Dinner']));
            } else {
              setSelectedMeals(parsed);
            }
          } catch (e) {
            const splitMeals = savedMeals.split(', ').filter(Boolean);
            if (splitMeals.length === 2 && splitMeals.includes('Lunch') && splitMeals.includes('Dinner')) {
              setSelectedMeals(['Breakfast', 'Lunch', 'Snack', 'Dinner']);
              await AsyncStorage.setItem('diet_meals', JSON.stringify(['Breakfast', 'Lunch', 'Snack', 'Dinner']));
            } else {
              setSelectedMeals(splitMeals);
            }
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
        if (savedAvoided) {
          try {
            setAvoidedFoods(JSON.parse(savedAvoided));
          } catch (e) {
            setAvoidedFoods(savedAvoided.split(', ').filter(Boolean));
          }
        }
        if (savedCuisineFreq) {
          try {
            setCuisineFrequency(JSON.parse(savedCuisineFreq));
          } catch (e) {
            setCuisineFrequency({});
          }
        }
        if (savedOtherInfo) setOtherInfo(savedOtherInfo);

        const startFlow = route.params?.startFlow;
        if (savedFlowCompleted !== 'true' || startFlow) {
          setIsFlowMode(true);
          setShowPreferenceSelect(true);
        }
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
          nonVegDays,
          meals: selectedMeals,
          allergies: selectedAllergies,
          cuisines: selectedCuisines,
          avoidedFoods,
          cuisineFrequency,
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
  }, [preference, skipDays, nonVegDays, selectedMeals, selectedAllergies, selectedCuisines, otherInfo, isLoaded]);

  const preferencesOptions = [
    {
      title: 'No Restriction',
      desc: 'Eats all foods and meats',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Vegetarian',
      desc: 'No meat, fish or eggs',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Eggetarian',
      desc: 'vegetarian with eggs',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Vegan',
      desc: 'No animal products',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Selective Non-Veg',
      desc: 'Eats some meats only',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=300&q=80',
    },
    {
      title: 'Jain Vegetarian',
      desc: 'No meat, eggs, roots',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const daysOptions = [
    { title: 'No Fixed Days', desc: '', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=150&q=80' },
    { title: 'Monday', desc: 'Kickstart your week', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80' },
    { title: 'Tuesday', desc: 'Stay focused', image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=150&q=80' },
    { title: 'Wednesday', desc: 'Mid-week push', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=150&q=80' },
    { title: 'Thursday', desc: 'Keep growing', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=150&q=80' },
    { title: 'Friday', desc: 'Finish strong', image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=150&q=80' },
    { title: 'Saturday', desc: 'Rest and recharge', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80' },
    { title: 'Sunday', desc: 'Prepare for the week', image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=150&q=80' },
  ];

  const mealsOptions = [
    { title: 'Breakfast', desc: 'Kickstart your day', image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=150&q=80' },
    { title: 'Morning Snack', desc: 'Stay energized', image: null },
    { title: 'Lunch', desc: 'Mid-day fuel', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' },
    { title: 'Evening Snack', desc: 'Healthy tide-over', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=150&q=80' },
    { title: 'Dinner', desc: 'End your day right', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=150&q=80' },
  ];

  const allergiesOptions = [
    { title: 'No Known Allergies', desc: '', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=150&q=80' },
    { title: 'Dairy', desc: 'Milk, cheese, butter', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=150&q=80' },
    { title: 'Eggs', desc: 'All egg products', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=150&q=80' },
    { title: 'Peanuts', desc: 'Groundnuts, peanut butter', image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=150&q=80' },
    { title: 'Tree Nuts', desc: 'Almonds, cashews, walnuts', image: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=150&q=80' },
    { title: 'Gluten / Wheat', desc: 'Wheat, barley, rye', image: 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?auto=format&fit=crop&w=150&q=80' },
    { title: 'Soy', desc: 'Soybeans, tofu, soy sauce', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80' },
    { title: 'Sesame', desc: 'Seeds, oil, tahini', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=150&q=80' },
    { title: 'Fish', desc: 'Rohu, tuna, salmon', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=150&q=80' },
    { title: 'Shellfish', desc: 'Prawns, crab, lobster', image: 'https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=150&q=80' },
    { title: 'Mustard', desc: 'Seeds, oil, leaves', image: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=150&q=80' },
  ];

  const avoidedFoodsOptions = [
    { title: 'Beef', desc: 'Cow, buffalo meat', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80' },
    { title: 'Pork', desc: 'Bacon, ham, sausages', image: 'https://images.unsplash.com/photo-1532408840957-031d8034aeef?auto=format&fit=crop&w=150&q=80' },
    { title: 'Fish', desc: 'Rohu, tuna, salmon', image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=150&q=80' },
    { title: 'Shellfish', desc: 'Prawns, crab, lobster', image: 'https://images.unsplash.com/photo-1553618551-fba689030290?auto=format&fit=crop&w=150&q=80' },
    { title: 'Lamb / Mutton', desc: 'Goat or lamb meat', image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=150&q=80' },
    { title: 'Chicken', desc: 'All chicken dishes', image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=150&q=80' },
    { title: 'Other Poultry', desc: 'Turkey, duck, quail', image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=150&q=80', isMinusOption: true },
    { title: 'Organ Meats', desc: 'Liver, kidney, heart', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=150&q=80', isMinusOption: true },
    { title: 'Processed Meats', desc: 'Salami, cold cuts', image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=150&q=80', isMinusOption: true },
  ];

  const popularCuisines = [
    { title: 'North Indian', desc: 'Punjabi, Awadhi, Rajasthani etc.', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=150&q=80' },
    { title: 'South Indian', desc: 'Tamil, Andhra, Kerala, Karnataka foods', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=150&q=80' },
    { title: 'Gujarati', desc: 'Dhokla, veg shaak, dal', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=150&q=80' },
    { title: 'Bengali', desc: 'Steamed fish, leafy greens', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=150&q=80' },
    { title: 'Maharashtrian', desc: 'Poha, usal, thalipeeth', image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=150&q=80' },
  ];

  const otherCuisines = [
    { title: 'Street Food', desc: 'Bhel, steamed momos', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=150&q=80' },
    { title: 'Chinese (Indian-Chinese)', desc: 'Stir-fried veg, steamed rice', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=150&q=80' },
    { title: 'Italian', desc: 'Whole wheat pasta, salads', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=150&q=80' },
    { title: 'Japanese', desc: 'Sushi, miso soup, edamame', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=150&q=80' },
    { title: 'Thai', desc: 'Raw papaya salad, curries', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=150&q=80' },
    { title: 'Vietnamese', desc: 'Pho, rice paper rolls', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=150&q=80' },
    { title: 'Kashmiri', desc: 'Light yakhni, steamed rice', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSelectPreference = async (title) => {
    setPreference(title);
    setShowPreferenceSelect(false);
    if (isFlowMode) {
      if (title === 'Selective Non-Veg' || title === 'No Restriction') {
        setShowNonVegDaysSelect(true);
      } else {
        setShowSkipDaysSelect(true);
      }
    }
    try {
      await AsyncStorage.setItem('diet_preference', title);
    } catch (err) {
      console.error('Failed to save preference:', err);
    }
  };

  const handleToggleNonVegDay = async (dayTitle) => {
    let updatedNonVegDays = [...nonVegDays];
    if (dayTitle === 'No Fixed Days') {
      updatedNonVegDays = ['No Fixed Days'];
    } else {
      updatedNonVegDays = updatedNonVegDays.filter(d => d !== 'No Fixed Days');

      if (updatedNonVegDays.includes(dayTitle)) {
        updatedNonVegDays = updatedNonVegDays.filter(d => d !== dayTitle);
        if (updatedNonVegDays.length === 0) {
          updatedNonVegDays = ['No Fixed Days'];
        }
      } else {
        updatedNonVegDays.push(dayTitle);
      }
    }
    setNonVegDays(updatedNonVegDays);

    // Calculate skipDays (vegetarian days) as the complement of non-veg days
    let updatedSkipDays = [];
    if (updatedNonVegDays.includes('No Fixed Days')) {
      updatedSkipDays = ['No Fixed Days'];
    } else {
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      updatedSkipDays = allDays.filter(day => !updatedNonVegDays.includes(day));
      if (updatedSkipDays.length === 0) {
        updatedSkipDays = ['No Fixed Days'];
      }
    }
    setSkipDays(updatedSkipDays);

    try {
      await AsyncStorage.setItem('diet_nonveg_days', JSON.stringify(updatedNonVegDays));
      await AsyncStorage.setItem('diet_skip_days', JSON.stringify(updatedSkipDays));
    } catch (err) {
      console.error('Failed to save non veg / skip days:', err);
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

  const handleToggleAvoidedFood = async (title) => {
    let updatedAvoided = [...avoidedFoods];
    if (updatedAvoided.includes(title)) {
      updatedAvoided = updatedAvoided.filter(x => x !== title);
    } else {
      updatedAvoided.push(title);
    }
    setAvoidedFoods(updatedAvoided);
    try {
      await AsyncStorage.setItem('diet_avoided_foods', JSON.stringify(updatedAvoided));
    } catch (err) {
      console.error('Failed to save avoided foods:', err);
    }
  };

  const cuisineFrequencyOptions = [
    { title: 'North Indian', image: 'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?auto=format&fit=crop&w=150&q=80' },
    { title: 'South Indian', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=150&q=80' },
    { title: 'Street Food', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=150&q=80' },
    { title: 'Tandoor & Grills', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=150&q=80' },
    { title: 'Coastal India', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=150&q=80' },
  ];

  const handleSelectCuisineFrequency = async (cuisineTitle, frequency) => {
    const updatedFreq = { ...cuisineFrequency };
    if (updatedFreq[cuisineTitle] === frequency) {
      delete updatedFreq[cuisineTitle];
    } else {
      updatedFreq[cuisineTitle] = frequency;
    }
    setCuisineFrequency(updatedFreq);
    try {
      await AsyncStorage.setItem('diet_cuisine_frequency', JSON.stringify(updatedFreq));
    } catch (err) {
      console.error('Failed to save cuisine frequency:', err);
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

  const handleChangeOtherInfo = async (text) => {
    setOtherInfo(text);
    try {
      await AsyncStorage.setItem('diet_other_info', text);
    } catch (err) {
      console.error('Failed to save other info:', err);
    }
  };

  // RENDER SELECTOR VIEW (Grid of Dietary Preferences)
  if (showPreferenceSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (isFlowMode) {
                navigation.navigate('MainTabs', { screen: 'Home' });
              } else {
                setShowPreferenceSelect(false);
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {isFlowMode ? (
            <TouchableOpacity onPress={() => { setShowPreferenceSelect(false); setShowSkipDaysSelect(true); }}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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
                    {opt.image ? (
                      <Image
                        source={{ uri: opt.image }}
                        style={styles.checkerboard}
                        resizeMode="cover"
                      />
                    ) : null}

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

  // RENDER NON-VEG DAYS SELECT VIEW (Non-Veg Days Selection)
  if (showNonVegDaysSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowNonVegDaysSelect(false);
              if (isFlowMode) {
                setShowPreferenceSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {isFlowMode ? (
            <TouchableOpacity onPress={() => { setShowNonVegDaysSelect(false); setShowAllergiesSelect(true); }}>
              <Text style={styles.skipBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Which days do you prefer non-veg meals?</Text>

          {daysOptions.map((opt) => {
            const isSelected = nonVegDays.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                onPress={() => handleToggleNonVegDay(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: image */}
                {opt.image ? (
                  <Image source={{ uri: opt.image }} style={styles.mealCardImage} />
                ) : (
                  <View style={styles.dayCardLeft} />
                )}

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

  // RENDER SKIP DAYS SELECT VIEW (Vegetarian Days Selection)
  if (showSkipDaysSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowSkipDaysSelect(false);
              if (isFlowMode) {
                setShowPreferenceSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {isFlowMode ? (
            <TouchableOpacity onPress={() => { setShowSkipDaysSelect(false); setShowAllergiesSelect(true); }}>
              <Text style={styles.skipBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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
                {/* Left side: image */}
                {opt.image ? (
                  <Image source={{ uri: opt.image }} style={styles.mealCardImage} />
                ) : (
                  <View style={styles.dayCardLeft} />
                )}

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


  // RENDER ALLERGIES SELECT VIEW
  if (showAllergiesSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowAllergiesSelect(false);
              if (isFlowMode) {
                setShowSkipDaysSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {isFlowMode ? (
            <TouchableOpacity onPress={() => { setShowAllergiesSelect(false); setShowCuisinesSelect(true); }}>
              <Text style={styles.skipBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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
                {/* Left side: image */}
                {opt.image ? (
                  <Image source={{ uri: opt.image }} style={styles.mealCardImage} />
                ) : (
                  <View style={styles.mealCardPlaceholder} />
                )}

                {/* Middle: Title & Subtext */}
                <View style={styles.dayCardMiddle}>
                  <Text style={[styles.dayCardTitle, isSelected && styles.mealCardTitleSelected]}>{opt.title}</Text>
                  {opt.desc ? <Text style={[styles.dayCardDesc, isSelected && styles.mealCardDescSelected]}>{opt.desc}</Text> : null}
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

  // RENDER AVOIDED FOODS SELECT VIEW
  if (showAvoidSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button and Skip */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowAvoidSelect(false);
              if (isFlowMode) {
                setShowCuisinesSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={styles.backBtnRound}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          )}
          <TouchableOpacity
            onPress={() => {
              setShowAvoidSelect(false);
              setShowCuisineFrequencySelect(true);
            }}
          >
            <Text style={styles.skipBtnText}>{isFlowMode ? 'Next' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitleCenter}>Which of these would you{"\n"}like to avoid?</Text>

          {avoidedFoodsOptions.map((opt) => {
            const isSelected = avoidedFoods.includes(opt.title);
            return (
              <TouchableOpacity
                key={opt.title}
                style={[styles.avoidCard, isSelected && styles.avoidCardSelected]}
                onPress={() => handleToggleAvoidedFood(opt.title)}
                activeOpacity={0.8}
              >
                {/* Left side: thumbnail container */}
                <View style={styles.avoidCardLeft}>
                  {opt.image ? (
                    <Image source={{ uri: opt.image }} style={styles.avoidCardImage} />
                  ) : (
                    <View style={styles.avoidCardPlaceholder} />
                  )}
                </View>

                {/* Middle: Title & Subtext */}
                <View style={styles.avoidCardMiddle}>
                  <Text style={[styles.avoidCardTitle, isSelected && styles.avoidCardTitleSelected]}>{opt.title}</Text>
                  {opt.desc ? <Text style={[styles.avoidCardDesc, isSelected && styles.avoidCardDescSelected]}>{opt.desc}</Text> : null}
                </View>

                {/* Right side: Checkbox or circular minus */}
                {opt.isMinusOption && !isSelected ? (
                  <View style={styles.minusCircle}>
                    <View style={styles.minusLine} />
                  </View>
                ) : (
                  <View style={[styles.avoidCheckbox, isSelected && styles.avoidCheckboxSelected]}>
                    {isSelected && <Icon name="checkmark" size={14} color="#FFF" />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER CUISINE FREQUENCY SELECT VIEW
  if (showCuisineFrequencySelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button and Next/Skip */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowCuisineFrequencySelect(false);
              if (isFlowMode) {
                setShowAvoidSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <TouchableOpacity
            onPress={() => {
              setShowCuisineFrequencySelect(false);
              if (isFlowMode) {
                setShowOtherInfoSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
          >
            <Text style={styles.skipBtnText}>{isFlowMode ? 'Next' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>How often would you like{"\n"}to eat these cuisines?</Text>

          {cuisineFrequencyOptions.map((opt) => {
            const currentVal = cuisineFrequency[opt.title];
            const isSometimes = currentVal === 'Sometimes';
            const isOften = currentVal === 'Often';

            return (
              <TouchableOpacity
                key={opt.title}
                style={[
                  styles.dayCard,
                  (isSometimes || isOften) && styles.dayCardSelected,
                  { height: 80 }
                ]}
                activeOpacity={0.9}
              >
                {/* Left side: image */}
                {opt.image ? (
                  <Image source={{ uri: opt.image }} style={styles.mealCardImage} />
                ) : (
                  <View style={styles.dayCardLeft} />
                )}

                {/* Middle: Title */}
                <View style={styles.dayCardMiddle}>
                  <Text style={styles.dayCardTitle}>{opt.title}</Text>
                </View>

                {/* Right side: Sometimes/Often Buttons in a Column */}
                <View style={styles.freqButtonsContainer}>
                  {/* Sometimes Button */}
                  <TouchableOpacity
                    style={[styles.freqButtonSometimes, isSometimes && styles.freqButtonSometimesSelected]}
                    onPress={() => handleSelectCuisineFrequency(opt.title, 'Sometimes')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.freqButtonTextSometimes, isSometimes && styles.freqButtonTextSometimesSelected]}>
                      Sometimes
                    </Text>
                  </TouchableOpacity>

                  {/* Often Button */}
                  <TouchableOpacity
                    style={[styles.freqButtonOften, isOften && styles.freqButtonOftenSelected]}
                    onPress={() => handleSelectCuisineFrequency(opt.title, 'Often')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.freqButtonTextOften, isOften && styles.freqButtonTextOftenSelected]}>
                      Often
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // RENDER OTHER INFO SELECT VIEW (Step 7)
  if (showOtherInfoSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button and Next/Skip */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowOtherInfoSelect(false);
              if (isFlowMode) {
                setShowCuisineFrequencySelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <TouchableOpacity
            onPress={() => {
              setShowOtherInfoSelect(false);
              if (isFlowMode) {
                navigation.navigate('AlmostDone', {
                  preference,
                  selectedAllergies,
                  avoidedFoods,
                });
              } else {
                setIsFlowMode(false);
              }
            }}
          >
            <Text style={styles.skipBtnText}>{isFlowMode ? 'Done' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.listTitle}>Do you have other{"\n"}information we ought{"\n"}to know?</Text>
          <Text style={styles.listSubtitle}>Provide any extra preferences or concerns you'd like us to note.</Text>

          {/* Custom Card-like Text Input Field */}
          <View style={styles.otherInputCard}>
            <TextInput
              style={styles.otherTextInput}
              value={otherInfo}
              onChangeText={handleChangeOtherInfo}
              placeholder="Enter details..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
            />
            {otherInfo.length > 0 && (
              <TouchableOpacity onPress={() => handleChangeOtherInfo('')} style={styles.clearInputBtn}>
                <Icon name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Bottom Looks Good/Next Button */}
        <View style={styles.otherBottomWrapper}>
          <TouchableOpacity
            style={styles.nextBtnContainer}
            onPress={() => {
              setShowOtherInfoSelect(false);
              if (isFlowMode) {
                navigation.navigate('AlmostDone', {
                  preference,
                  selectedAllergies,
                  avoidedFoods,
                });
              } else {
                setIsFlowMode(false);
              }
            }}
          >
            <View style={{ width: 16 }} />
            <Text style={styles.nextBtnText}>Next</Text>
            <Icon name="chevron-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // RENDER CUISINES SELECT VIEW
  if (showCuisinesSelect) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Transparent header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setShowCuisinesSelect(false);
              if (isFlowMode) {
                setShowAllergiesSelect(true);
              } else {
                setIsFlowMode(false);
              }
            }}
            style={isFlowMode ? styles.backBtnRound : styles.backBtn}
          >
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          {isFlowMode ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegmentActive} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {isFlowMode ? (
            <TouchableOpacity onPress={() => { setShowCuisinesSelect(false); setShowAvoidSelect(true); }}>
              <Text style={styles.skipBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
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
        <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(true); setShowPreferenceSelect(true); }} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <MaterialCommunityIcons name="food-apple" size={20} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Preference</Text>
              <Text style={styles.cardValue}>{preference}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>

        {/* Days selection card based on preference */}
        {preference === 'Selective Non-Veg' || preference === 'No Restriction' ? (
          <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(false); setShowNonVegDaysSelect(true); }} activeOpacity={0.9}>
            <View style={styles.avatarOverlap}>
              <View style={styles.avatarInner}>
                <MaterialCommunityIcons name="calendar-blank" size={20} color="#FFF" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.textWrapper}>
                <Text style={styles.cardLabel}>Non-Veg Days</Text>
                <Text style={styles.cardValue}>
                  {nonVegDays.length > 0 ? nonVegDays.join(', ') : 'No Fixed Days'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(false); setShowSkipDaysSelect(true); }} activeOpacity={0.9}>
            <View style={styles.avatarOverlap}>
              <View style={styles.avatarInner}>
                <MaterialCommunityIcons name="calendar-blank" size={20} color="#FFF" />
              </View>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.textWrapper}>
                <Text style={styles.cardLabel}>Skip Non-veg</Text>
                <Text style={styles.cardValue}>
                  {skipDays.length > 0 ? skipDays.join(', ') : 'No Fixed Days'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
            </View>
          </TouchableOpacity>
        )}


        {/* Allergies Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(false); setShowAllergiesSelect(true); }} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="warning-outline" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Allergies</Text>
              <Text style={styles.cardValue}>
                {selectedAllergies.length > 0 ? selectedAllergies.join(', ') : 'No Known Allergies'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>

        {/* Foods to Avoid Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(false); setShowAvoidSelect(true); }} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="close-circle-outline" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Foods to Avoid</Text>
              <Text style={styles.cardValue}>
                {avoidedFoods.length > 0 ? avoidedFoods.join(', ') : 'None'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>


        {/* Cuisines Card */}
        <TouchableOpacity style={styles.cardContainer} onPress={() => { setIsFlowMode(false); setShowCuisinesSelect(true); }} activeOpacity={0.9}>
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="earth-outline" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Cuisines</Text>
              <Text style={styles.cardValue}>
                {selectedCuisines.length > 0 ? selectedCuisines.join(', ') : 'None'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
          </View>
        </TouchableOpacity>

        {/* Cuisine Frequency Card */}
        <TouchableOpacity
          style={styles.cardContainer}
          onPress={() => { setIsFlowMode(false); setShowCuisineFrequencySelect(true); }}
          activeOpacity={0.9}
        >
          <View style={styles.avatarOverlap}>
            <View style={styles.avatarInner}>
              <Icon name="restaurant-outline" size={18} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Cuisine Frequency</Text>
              <Text style={styles.cardValue}>
                {Object.keys(cuisineFrequency).length > 0
                  ? Object.entries(cuisineFrequency).map(([c, f]) => `${c} (${f})`).join(', ')
                  : 'None Set'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
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
              <Icon name="information-circle-outline" size={20} color="#FFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.textWrapper}>
              <Text style={styles.cardLabel}>Other info</Text>
              <Text style={styles.cardValue}>{otherInfo}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.4)" />
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
    backgroundColor: '#050505',
    borderRadius: 20,
    marginBottom: 25,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 60,
    paddingRight: 20,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardValue: {
    color: 'rgba(255, 255, 255, 0.6)',
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
    backgroundColor: '#FFF',
    borderColor: '#005D54',
  },
  mealCardTitleSelected: {
    color: '#000',
  },
  mealCardDescSelected: {
    color: 'rgba(0, 0, 0, 0.6)',
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
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealCheckboxSelected: {
    backgroundColor: '#005D54',
    borderColor: '#005D54',
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
    borderColor: '#005D54',
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
    backgroundColor: '#005D54',
    borderColor: '#005D54',
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
  backBtnRound: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  progressSegment: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  progressSegmentActive: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#FFF',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  skipBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listTitleCenter: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 34,
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 20,
    fontFamily: 'BRLNSR',
  },
  avoidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    height: 80,
  },
  avoidCardSelected: {
    backgroundColor: '#FFF',
    borderColor: '#005D54',
  },
  avoidCardTitleSelected: {
    color: '#000',
  },
  avoidCardDescSelected: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  avoidCardLeft: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  avoidCardImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  avoidCardPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  avoidCardMiddle: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  avoidCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avoidCardDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  avoidCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avoidCheckboxSelected: {
    backgroundColor: '#005D54',
    borderColor: '#005D54',
  },
  minusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  minusLine: {
    width: 10,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  freqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    height: 85,
  },
  freqCardLeft: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  freqCardImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  freqCardPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  freqCardMiddle: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  freqCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  freqButtonsContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 54,
    width: 90,
  },
  freqButtonSometimes: {
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqButtonSometimesSelected: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  freqButtonTextSometimes: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  freqButtonTextSometimesSelected: {
    color: '#000',
  },
  freqButtonOften: {
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqButtonOftenSelected: {
    backgroundColor: '#005D54',
    borderColor: '#005D54',
  },
  freqButtonTextOften: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  freqButtonTextOftenSelected: {
    color: '#FFF',
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 30,
    paddingHorizontal: 24,
  },
  otherInputCard: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#0a0a0d',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    position: 'relative',
    flexDirection: 'row',
  },
  otherTextInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    paddingRight: 24,
  },
  clearInputBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  otherBottomWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  nextBtnContainer: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#050505',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DietPreferences;
// force reload metro cache
