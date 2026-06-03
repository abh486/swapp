import { GlobalLoader } from '../components/GlobalLoader';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveMetrics } from '../utils/responsive';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { AUTH_CONFIG } from '../config/config';
import CryptoJS from 'crypto-js';

const generateNonce = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const LoginScreen = () => {
  const {
    loginWithEmailPassword,
    loginWithGoogle,
    loginWithApple,
    loginWithWebView,
    createAccount,
    loading,
    isAuthenticated,
  } = useAuth();
  const navigation = useNavigation();
  const { wp, ms, fs, sp } = useResponsiveMetrics();
  const styles = createStyles({ wp, ms, fs, sp });

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  // Validation errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [activeSocial, setActiveSocial] = useState(null);
  const socialLoading = activeSocial !== null;
  const operationInProgress = useRef(false);

  // Initialize Google Sign-in
  useEffect(() => {
    try {
      console.log('[DEBUG-GoogleAuth] Starting Google Sign-In configuration...');
      console.log('[DEBUG-GoogleAuth] Package Name (Android): com.swappios');
      console.log('[DEBUG-GoogleAuth] Bundle ID (iOS): com.swapp.swappfit');
      console.log('[DEBUG-GoogleAuth] Web Client ID used:', AUTH_CONFIG.googleWebClientId);
      console.log('[DEBUG-GoogleAuth] Platform:', Platform.OS);

      GoogleSignin.configure({
        webClientId: AUTH_CONFIG.googleWebClientId,
        offlineAccess: true,
      });
      console.log('[DEBUG-GoogleAuth] Google Sign-In configured successfully.');
    } catch (e) {
      console.error('[DEBUG-GoogleAuth] Google Sign-In configuration failed:', e);
    }
  }, []);

  // Redirect after login success
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MemberProfile' }],
      });
    }
  }, [isAuthenticated, navigation]);

  // Real-time validations
  const handleEmailChange = (text) => {
    setEmail(text);
    if (!text) {
      setEmailError('Email cannot be empty.');
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(text.trim())) {
      setEmailError('Please enter a valid email address.');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (!text) {
      setPasswordError('Password cannot be empty.');
      return;
    }
    if (text.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
    } else {
      setPasswordError('');
    }

    // Recalculate confirm password matching if it has value
    if (mode === 'signup' && confirmPassword) {
      if (confirmPassword !== text) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (!text) {
      setConfirmPasswordError('Confirm password cannot be empty.');
      return;
    }
    if (text !== password) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleWebViewFallback = async () => {
    console.log('[LoginScreen] WebView fallback initiated...');
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    try {
      await loginWithWebView();
    } catch (err) {
      console.error('[LoginScreen] WebView login failed:', err);
      Alert.alert('Login Error', err.message || 'An unexpected error occurred.');
    } finally {
      operationInProgress.current = false;
    }
  };

  const handleSecretTap = () => {
    const nextCount = tapCount + 1;
    if (nextCount >= 5) {
      setTapCount(0);
      Alert.alert(
        'Developer Option',
        'Would you like to force launch the legacy WebView authentication flow?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Launch WebView', onPress: handleWebViewFallback },
        ]
      );
    } else {
      setTapCount(nextCount);
      setTimeout(() => setTapCount(0), 3000);
    }
  };

  const askFallbackAfterFailure = (loginType, errorMessage) => {
    Alert.alert(
      `${loginType} Failed`,
      `${errorMessage}\n\nWould you like to fall back to the secure web login?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Open Web Login', onPress: handleWebViewFallback },
      ]
    );
  };

  const handleEmailPasswordLogin = async () => {
    if (operationInProgress.current) return;
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email cannot be empty.');
      return;
    }
    if (!password) {
      setPasswordError('Password cannot be empty.');
      return;
    }
    if (emailError || passwordError) {
      Alert.alert('Validation Error', 'Please resolve all errors before submitting.');
      return;
    }

    operationInProgress.current = true;
    try {
      console.log('Initiating native email/password login...');
      await loginWithEmailPassword(emailTrimmed, password);
    } catch (err) {
      console.error('Email/Password Login failed:', err);
      askFallbackAfterFailure('Email Login', err.message || 'Invalid credentials or connection issue.');
    } finally {
      operationInProgress.current = false;
    }
  };

  const handleSignUpSubmit = async () => {
    if (operationInProgress.current) return;
    const emailTrimmed = email.trim();
    
    // Explicit checks
    if (!emailTrimmed) {
      setEmailError('Email cannot be empty.');
      return;
    }
    if (!password) {
      setPasswordError('Password cannot be empty.');
      return;
    }
    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password cannot be empty.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return;
    }
    if (emailError || passwordError || confirmPasswordError) {
      Alert.alert('Validation Error', 'Please resolve all errors before submitting.');
      return;
    }

    operationInProgress.current = true;
    try {
      console.log('Initiating native Auth0 signup...');
      await createAccount(emailTrimmed, password);
      Alert.alert('Account Created!', 'Welcome to Swappfit! You have been successfully registered and logged in.');
    } catch (err) {
      console.error('Sign Up failed:', err);
      let friendlyError = 'Could not create account at this time.';
      if (err.message) {
        if (err.message.includes('exists') || err.message.includes('user_exists') || err.message.includes('already exists')) {
          friendlyError = 'This email address is already registered. Please log in instead.';
        } else if (err.message.includes('password') || err.message.includes('weak') || err.message.includes('complexity') || err.message.includes('strength')) {
          friendlyError = 'The password is too weak. Please ensure it contains at least 8 characters, a number, and a special character.';
        } else {
          friendlyError = err.message;
        }
      }
      Alert.alert('Sign Up Failed', friendlyError);
    } finally {
      operationInProgress.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (operationInProgress.current) {
      console.log('[LoginScreen] Operation already in progress, ignoring Google Sign-In tap');
      return;
    }
    operationInProgress.current = true;
    setActiveSocial('google');
    try {
      console.log('Initiating native Google login...');
      await GoogleSignin.hasPlayServices();
      
      // Clear any stuck/previous native Google sign-in session
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('GoogleSignin.signOut failed or no user logged in:', signOutError.message);
      }

      // Generate Cryptographic Nonce before login
      const rawNonce = generateNonce();
      const hashedNonce = CryptoJS.SHA256(rawNonce).toString();
      console.log('[LoginScreen] Generated OIDC nonces - Raw:', rawNonce, 'Hashed:', hashedNonce);

      const userInfo = await GoogleSignin.signIn({
        nonce: hashedNonce,
      });
      
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) {
        throw new Error('Google ID Token could not be retrieved.');
      }

      console.log('Google ID Token:', idToken);
      console.log('Google login code received, exchanging with Auth0...');
      await loginWithGoogle(idToken);
    } catch (err) {
      console.error('Google Native Login failed:', err);
      const isCancel = err.code === statusCodes.SIGN_IN_CANCELLED || err.message === 'Sign in action cancelled';
      const isInProgress = err.code === statusCodes.IN_PROGRESS || err.message?.includes('Sign-in in progress') || err.message?.includes('in progress');

      if (!isCancel && !isInProgress) {
        askFallbackAfterFailure('Google Login', err.message || 'Could not authenticate with Google.');
      }
    } finally {
      setActiveSocial(null);
      operationInProgress.current = false;
    }
  };

  const handleAppleLogin = async () => {
    if (operationInProgress.current) {
      console.log('[LoginScreen] Operation already in progress, ignoring Apple Sign-In tap');
      return;
    }
    operationInProgress.current = true;
    setActiveSocial('apple');
    try {
      console.log('Initiating native Apple login...');
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthRequestResponse.user
      );

      if (credentialState === appleAuth.State.AUTHORIZED) {
        const authCode = appleAuthRequestResponse.authorizationCode;
        if (!authCode) {
          throw new Error('Apple authorization code could not be retrieved.');
        }

        console.log('Apple code received, exchanging with Auth0...');
        await loginWithApple(authCode);
      } else {
        throw new Error('Apple authentication was not authorized.');
      }
    } catch (err) {
      console.error('Apple Native Login failed:', err);
      if (err.code !== 'ERR_CANCELED') {
        askFallbackAfterFailure('Apple Login', err.message || 'Could not authenticate with Apple.');
      }
    } finally {
      setActiveSocial(null);
      operationInProgress.current = false;
    }
  };



  return (
    <ImageBackground
      source={{
        uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDktQktk9aC8_aO96JBFXzdis2IEo1DzGlpZuK1s4av5oWSlAehHsxUxZ5rjzygc0OppXATgwAK2SZ1QIaSLDguEvCTgmNhH0oV8AX44zWbawYjuz28ZQ_6uVbLCeX4sepdvj8ILLY77q75xgdtuU3lfOB0qfmUbBVrnNf1_l-aqjyYISAKO99BF66duHj3mPzukanjr90ZcnZmf1L3fG7hcCdSM85HeYHhnm04EGcCuM3TX3OPrjhzCa6zm_d2sVT0ZFJOofAE-MM',
      }}
      style={styles.backgroundImage}
      imageStyle={styles.backgroundImageStyle}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
                <Text style={styles.headlineText}>Welcome to Swappfit</Text>
              </TouchableOpacity>
              <Text style={styles.subtitleText}>Your fitness journey starts here</Text>
            </View>

            {/* Mode Switcher Tabs */}
            <View style={styles.modeSelectorContainer}>
              <View style={styles.modeSelector}>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'login' && styles.activeModeTab]}
                  onPress={() => {
                    setMode('login');
                    setEmailError('');
                    setPasswordError('');
                    setConfirmPasswordError('');
                  }}
                  disabled={loading || socialLoading}
                >
                  <Text style={[styles.modeTabText, mode === 'login' && styles.activeModeTabText]}>
                    Log In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'signup' && styles.activeModeTab]}
                  onPress={() => {
                    setMode('signup');
                    setEmailError('');
                    setPasswordError('');
                    setConfirmPasswordError('');
                  }}
                  disabled={loading || socialLoading}
                >
                  <Text style={[styles.modeTabText, mode === 'signup' && styles.activeModeTabText]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.cardContainer}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.textInput, emailError ? styles.textInputError : null]}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={handleEmailChange}
                  editable={!loading && !socialLoading}
                />
                {emailError ? <Text style={styles.errorLabel}>{emailError}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                  <TextInput
                    style={styles.textInputInline}
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    secureTextEntry={securePassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={handlePasswordChange}
                    editable={!loading && !socialLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIconButton}
                    onPress={() => setSecurePassword(!securePassword)}
                    disabled={loading || socialLoading}
                  >
                    <FontAwesome
                      name={securePassword ? 'eye-slash' : 'eye'}
                      size={18}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorLabel}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password Input (Sign Up Mode Only) */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputWrapperError : null]}>
                    <TextInput
                      style={styles.textInputInline}
                      placeholder="Confirm your password"
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      secureTextEntry={secureConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      editable={!loading && !socialLoading}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconButton}
                      onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                      disabled={loading || socialLoading}
                    >
                      <FontAwesome
                        name={secureConfirmPassword ? 'eye-slash' : 'eye'}
                        size={18}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text style={styles.errorLabel}>{confirmPasswordError}</Text>
                  ) : null}
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={styles.signInButton}
                onPress={mode === 'login' ? handleEmailPasswordLogin : handleSignUpSubmit}
                disabled={loading || socialLoading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <GlobalLoader size={30} />
                ) : (
                  <Text style={styles.signInButtonText}>
                    {mode === 'login' ? 'CONTINUE' : 'CREATE ACCOUNT'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login Button */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleLogin}
                disabled={loading || socialLoading}
                activeOpacity={0.8}
              >
                {activeSocial === 'google' ? (
                  <GlobalLoader size={24} />
                ) : (
                  <>
                    <View style={styles.socialIconWrapper}>
                      <FontAwesome name="google" size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Login Button */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[styles.socialButton, styles.appleButton]}
                  onPress={handleAppleLogin}
                  disabled={loading || socialLoading}
                  activeOpacity={0.8}
                >
                  {activeSocial === 'apple' ? (
                    <GlobalLoader size={24} />
                  ) : (
                    <>
                      <View style={styles.socialIconWrapper}>
                        <FontAwesome name="apple" size={22} color="#000000" />
                      </View>
                      <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                        Continue with Apple
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.legalText}>
                By continuing, you agree to our{' '}
                <Text style={styles.underlineText}>Terms</Text> &{' '}
                <Text style={styles.underlineText}>Privacy Policy</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingHorizontal: sp(24),
      paddingVertical: sp(32),
    },
    headerContainer: {
      alignItems: 'center',
      marginTop: sp(15),
      marginBottom: sp(15),
    },
    headlineText: {
      color: '#ffffff',
      fontSize: fs(34),
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
    modeSelectorContainer: {
      alignItems: 'center',
      marginBottom: sp(20),
    },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: ms(25),
      padding: ms(4),
      width: '100%',
      maxWidth: Math.min(ms(380), wp(90)),
    },
    modeTab: {
      flex: 1,
      paddingVertical: sp(10),
      alignItems: 'center',
      borderRadius: ms(21),
    },
    activeModeTab: {
      backgroundColor: '#ffffff',
    },
    modeTabText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: fs(14),
      fontWeight: '600',
    },
    activeModeTabText: {
      color: '#000000',
    },
    cardContainer: {
      width: '100%',
      backgroundColor: 'rgba(30, 30, 30, 0.75)',
      borderRadius: ms(20),
      padding: sp(24),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 15,
      elevation: 8,
      alignSelf: 'center',
      maxWidth: Math.min(ms(380), wp(90)),
    },
    inputGroup: {
      marginBottom: sp(16),
    },
    inputLabel: {
      color: '#E0E0E0',
      fontSize: fs(14),
      fontWeight: '600',
      marginBottom: sp(6),
      marginLeft: sp(4),
    },
    textInput: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderRadius: ms(12),
      paddingHorizontal: sp(16),
      paddingVertical: Platform.OS === 'ios' ? sp(14) : sp(10),
      color: '#ffffff',
      fontSize: fs(15),
    },
    textInputError: {
      borderColor: '#ff4a4a',
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderRadius: ms(12),
      paddingHorizontal: sp(16),
    },
    inputWrapperError: {
      borderColor: '#ff4a4a',
    },
    textInputInline: {
      flex: 1,
      color: '#ffffff',
      fontSize: fs(15),
      paddingVertical: Platform.OS === 'ios' ? sp(14) : sp(10),
    },
    eyeIconButton: {
      padding: sp(8),
    },
    errorLabel: {
      color: '#ff4a4a',
      fontSize: fs(12),
      marginTop: sp(4),
      marginLeft: sp(6),
    },
    signInButton: {
      backgroundColor: '#ffffff',
      paddingVertical: sp(14),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sp(8),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 3,
    },
    signInButtonText: {
      color: '#000000',
      fontSize: fs(16),
      fontWeight: 'bold',
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: sp(20),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    dividerText: {
      color: 'rgba(255, 255, 255, 0.4)',
      paddingHorizontal: sp(12),
      fontSize: fs(13),
      fontWeight: '600',
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      paddingVertical: sp(12),
      borderRadius: ms(12),
      marginBottom: sp(12),
      justifyContent: 'center',
    },
    socialIconWrapper: {
      position: 'absolute',
      left: sp(16),
    },
    socialButtonText: {
      color: '#ffffff',
      fontSize: fs(15),
      fontWeight: '600',
    },
    appleButton: {
      backgroundColor: '#ffffff',
      borderColor: '#ffffff',
    },
    appleButtonText: {
      color: '#000000',
    },
    footerContainer: {
      marginTop: sp(20),
      alignItems: 'center',
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