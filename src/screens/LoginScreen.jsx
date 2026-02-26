import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, ImageBackground, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      Alert.alert('Login Error', err.message || 'Login failed');
    }
  };

  // 🚀 Redirect after login success
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MemberProfile' }], // or "MainTabs" if you want bottom tabs first
      });
    }
  }, [isAuthenticated, navigation]);

  return (
    <ImageBackground 
      source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDktQktk9aC8_aO96JBFXzdis2IEo1DzGlpZuK1s4av5oWSlAehHsxUxZ5rjzygc0OppXATgwAK2SZ1QIaSLDguEvCTgmNhH0oV8AX44zWbawYjuz28ZQ_6uVbLCeX4sepdvj8ILLY77q75xgdtuU3lfOB0qfmUbBVrnNf1_l-aqjyYISAKO99BF66duHj3mPzukanjr90ZcnZmf1L3fG7hcCdSM85HeYHhnm04EGcCuM3TX3OPrjhzCa6zm_d2sVT0ZFJOofAE-MM' }}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Spacer */}
          <View style={styles.spacer} />
          
          {/* Main Content */}
          <View style={styles.mainContent}>
            {/* Logo has been removed from here */}
            
            {/* Headline */}
            <Text style={styles.headlineText}>Welcome to Swappfit</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitleText}>Your fitness journey starts here</Text>
          </View>
          
          {/* Spacer */}
          <View style={styles.spacer} />
          
          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            {/* Button */}
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.signInButtonText}>CONTINUE</Text>
              )}
            </TouchableOpacity>
            
            {/* Legal Text */}
            <Text style={styles.legalText}>
              By continuing, you agree to our <Text style={styles.underlineText}>Terms</Text> & <Text style={styles.underlineText}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({ 
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  container: { 
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  content: { 
    flex: 1, 
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  spacer: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  // Logo styles have been removed from here
  headlineText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    color: '#A0A0A0',
    fontSize: 18,
    textAlign: 'center',
  },
  bottomContent: {
    width: '100%',
    maxWidth: 350,
  },
  signInButton: { 
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonText: { 
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legalText: {
    color: '#AFA7A7',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;