import { GlobalLoader } from '../components/GlobalLoader';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ImageBackground, Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveMetrics } from '../utils/responsive';

const LoginScreen = () => {
  const { login, loading, isAuthenticated } = useAuth();
  const navigation = useNavigation();
  const { wp, ms, fs, sp } = useResponsiveMetrics();
  const styles = createStyles({ wp, ms, fs, sp });

  const handleLogin = async () => {
    try {
      // ⬇️ LOG THIS TO SEE WHAT URL IS BEING GENERATED
      // This helps you compare what the app sends vs what is in your Auth0 Dashboard
      console.log('Initiating login...');
      
      await login();
      
      console.log('Login call successful (waiting for redirect)...');
    } catch (err) {
      // ⬇️ LOG THE FULL ERROR OBJECT
      console.error('Login failed full error:', JSON.stringify(err, null, 2));
      
      // Specific handling for the URL mismatch error you described
      if (err.message && err.message.includes('mismatch')) {
        Alert.alert(
          'Configuration Error', 
          'There is a URL mismatch between your App and Auth0 Dashboard. Check your console logs for the Redirect URI.'
        );
      } else {
        Alert.alert('Login Error', err.message || 'An unexpected error occurred.');
      }
    }
  };

  // 🚀 Redirect after login success
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MemberProfile' }], 
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
          <View style={styles.spacer} />
          <View style={styles.mainContent}>
            <Text style={styles.headlineText}>Welcome to Swappfit</Text>
            <Text style={styles.subtitleText}>Your fitness journey starts here</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.bottomContent}>
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <GlobalLoader size={40} />
              ) : (
                <Text style={styles.signInButtonText}>CONTINUE</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.legalText}>
              By continuing, you agree to our <Text style={styles.underlineText}>Terms</Text> & <Text style={styles.underlineText}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const createStyles = ({ wp, ms, fs, sp }) =>
  StyleSheet.create({ 
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
    paddingHorizontal: sp(24),
    paddingVertical: sp(16),
  },
  spacer: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
  },
  headlineText: {
    color: '#ffffff',
    fontSize: fs(32),
    fontFamily: 'BRLNSR',
    fontWeight: 'normal',
    textAlign: 'center',
    marginBottom: sp(8),
  },
  subtitleText: {
    color: '#A0A0A0',
    fontSize: fs(16),
    textAlign: 'center',
  },
  bottomContent: {
    width: '100%',
    maxWidth: Math.min(ms(360), wp(90)),
  },
  signInButton: { 
    backgroundColor: '#ffffff',
    paddingVertical: sp(16),
    paddingHorizontal: sp(18),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sp(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signInButtonText: { 
    color: '#000000',
    fontSize: fs(16),
    fontWeight: 'bold',
  },
  legalText: {
    color: '#AFA7A7',
    fontSize: fs(12),
    textAlign: 'center',
    paddingHorizontal: sp(16),
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;