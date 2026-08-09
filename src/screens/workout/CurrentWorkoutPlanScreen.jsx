import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const CurrentWorkoutPlanScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Back Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Central Content Block */}
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={['#EE822A', '#8F5D98', '#2E4D9F']}
              style={styles.gradientCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="hardware-chip-outline" size={48} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>AI WORKOUT</Text>
          <Text style={styles.subtitle}>Coming Soon</Text>
          <Text style={styles.description}>
            Our AI-powered personal trainer is crafting tailored workout plans, smart sets analysis, and customized fitness suggestions just for you.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  safeArea: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    height: 60,
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    marginTop: -40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#EE822A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: '#EE822A',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
});

export default CurrentWorkoutPlanScreen;
