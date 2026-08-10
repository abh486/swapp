import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../api/apiClient';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const AlmostDoneClocheScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const migrateMeals = (mealsStr) => {
    if (!mealsStr) return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
    try {
      const parsed = JSON.parse(mealsStr);
      if (Array.isArray(parsed) && parsed.length === 2 && parsed.includes('Lunch') && parsed.includes('Dinner')) {
        return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
      }
      return parsed;
    } catch (e) {
      const splitMeals = mealsStr.split(', ').filter(Boolean);
      if (splitMeals.length === 2 && splitMeals.includes('Lunch') && splitMeals.includes('Dinner')) {
        return ['Breakfast', 'Lunch', 'Snack', 'Dinner'];
      }
      return splitMeals;
    }
  };

  const handleDone = async () => {
    setLoading(true);
    try {
      const [
        savedPreference,
        savedSkipDays,
        savedMeals,
        savedAllergies,
        savedCuisines,
        savedOtherInfo
      ] = await Promise.all([
        AsyncStorage.getItem('diet_preference'),
        AsyncStorage.getItem('diet_skip_days'),
        AsyncStorage.getItem('diet_meals'),
        AsyncStorage.getItem('diet_allergies'),
        AsyncStorage.getItem('diet_cuisines'),
        AsyncStorage.getItem('diet_other_info')
      ]);

      await AsyncStorage.setItem('diet_flow_completed', 'true');
      navigation.reset({
        index: 0,
        routes: [
          { name: 'MainTabs', params: { screen: 'Diet' } }
        ],
      });
    } catch (err) {
      console.warn('[AlmostDoneClocheScreen] Failed to generate AI diet plan:', err.message);
      Alert.alert(
        'Generation Failed',
        'We saved your preferences, but the AI service is currently busy or took too long to respond. You can try regenerating again from the plan screen.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs', params: { screen: 'Diet' } }],
              });
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#0D2B26', '#050D0C']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <ActivityIndicator size="large" color="#A3D9C9" />
          <Text style={styles.loadingTitle}>Creating your AI Diet Plan...</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is designing a customized 7-day nutritional program starting from today. This usually takes around 30-45 seconds.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header back button and Done button */}
      <View style={styles.finalHeader}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtnRound}
        >
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleDone} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.finalScrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.finalTitle}>Final Check — Almost{"\n"}Done!</Text>

        {/* Gourmet Cloche Image with transparent container or natural fit */}
        <Image 
          source={require("../../../assets/image/gourmet_dome.png")} 
          style={styles.clocheImage}
          resizeMode="contain"
        />

        {/* Text descriptions below the image */}
        <View style={styles.textBlock}>
          <Text style={styles.descText}>
            Lose 5 kg in 4 weeks with steady, sustainable progress. Every step forward matters.
          </Text>
          <Text style={styles.calorieText}>
            Daily calorie range: 3698–3798 Cal.
          </Text>
          <Text style={styles.subText}>
            Based on your unique goals and activity level.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  finalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  finalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  finalTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 20,
  },
  clocheImage: {
    width: width - 48,
    height: 320,
    marginBottom: 30,
  },
  textBlock: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  descText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  calorieText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default AlmostDoneClocheScreen;
