import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const AlmostDoneScreen = ({ route, navigation }) => {
  const [preference, setPreference] = useState(route.params?.preference || 'Selective Non-Veg');
  const [selectedAllergies, setSelectedAllergies] = useState(route.params?.selectedAllergies || ['No Known Allergies']);
  const [avoidedFoods, setAvoidedFoods] = useState(route.params?.avoidedFoods || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        if (!route.params?.preference) {
          const savedPreference = await AsyncStorage.getItem('diet_preference');
          const savedAllergies = await AsyncStorage.getItem('diet_allergies');
          const savedAvoided = await AsyncStorage.getItem('diet_avoided_foods');

          if (savedPreference) setPreference(savedPreference);
          if (savedAllergies) setSelectedAllergies(JSON.parse(savedAllergies));
          if (savedAvoided) setAvoidedFoods(JSON.parse(savedAvoided));
        }
      } catch (err) {
        console.warn('[AlmostDoneScreen] Error loading saved data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSavedData();
  }, [route.params]);

  const allergiesText = selectedAllergies.includes('No Known Allergies') || selectedAllergies.length === 0
    ? 'with no major allergies'
    : `with allergies to ${selectedAllergies.join(', ')}`;
    
  const avoidedText = avoidedFoods.length > 0
    ? `, avoiding ${avoidedFoods.join(', ')}`
    : '';

  const summaryMessage = `You've chosen ${preference}${avoidedText}, ${allergiesText}.`;

  const handleLooksGood = () => {
    navigation.navigate('AlmostDoneFinal');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header back button only */}
      <View style={styles.finalHeader}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtnRound}
        >
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.finalScrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.finalTitle}>Final Check — Almost{"\n"}Done!</Text>

        {/* Card Wrapper */}
        <View style={styles.finalCardOuter}>
          <Image 
            source={require("../../../assets/image/alomst.png")} 
            style={styles.finalCardImg}
            resizeMode="cover"
          />
          <Text style={styles.finalSummaryText}>
            {summaryMessage}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Looks Good Button */}
      <View style={styles.bottomButtonWrapper}>
        <TouchableOpacity style={styles.looksGoodBtn} onPress={handleLooksGood}>
          <View style={{ width: 16 }} />
          <Text style={styles.looksGoodBtnText}>Looks Good</Text>
          <Icon name="chevron-forward" size={16} color="#FFF" />
        </TouchableOpacity>
      </View>
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
  finalScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 100,
    alignItems: 'center',
  },
  finalTitle: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 30,
  },
  finalCardOuter: {
    width: '100%',
    backgroundColor: '#0a0a0d',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
  },
  finalCardImg: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
  },
  finalSummaryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  bottomButtonWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000',
  },
  looksGoodBtn: {
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
  looksGoodBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AlmostDoneScreen;
