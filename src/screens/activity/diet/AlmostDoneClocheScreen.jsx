import React from 'react';
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

const AlmostDoneClocheScreen = ({ navigation }) => {
  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('diet_flow_completed', 'true');
    } catch (err) {
      console.error('[AlmostDoneClocheScreen] Failed to save flow completion flag:', err);
    }
    // Reset navigation stack to main Diet screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Diet' } }],
    });
  };

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
});

export default AlmostDoneClocheScreen;
