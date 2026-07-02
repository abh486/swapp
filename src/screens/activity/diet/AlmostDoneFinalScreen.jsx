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

const AlmostDoneFinalScreen = ({ route, navigation }) => {
  const [otherInfo, setOtherInfo] = useState(route.params?.otherInfo || 'Love extra protein, low calorie');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        if (!route.params?.otherInfo) {
          const savedOtherInfo = await AsyncStorage.getItem('diet_other_info');
          if (savedOtherInfo) {
            setOtherInfo(savedOtherInfo);
          }
        }
      } catch (err) {
        console.warn('[AlmostDoneFinalScreen] Error loading saved data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSavedData();
  }, [route.params]);

  const handleUpdatePlan = () => {
    navigation.navigate('AlmostDoneCloche');
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
            source={require("../../../assets/image/diet.jpg")} 
            style={styles.finalCardImg}
            resizeMode="cover"
          />
          <Text style={styles.finalSummaryText}>
            The schedule covers Breakfast, Lunch, and an Evening Snack, presenting selections from five cuisines, with priority on your top picks.{"\n"}{"\n"}
            <Text style={styles.notesText}>Notes: {otherInfo}</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Update My Plan Button */}
      <View style={styles.bottomButtonWrapper}>
        <TouchableOpacity style={styles.looksGoodBtn} onPress={handleUpdatePlan}>
          <View style={{ width: 16 }} />
          <Text style={styles.looksGoodBtnText}>Perfect! — Update My Plan</Text>
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
  notesText: {
    fontWeight: 'bold',
    color: '#FFF',
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

export default AlmostDoneFinalScreen;
