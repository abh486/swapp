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
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  NativeModules,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useResponsiveMetrics } from '../utils/responsive';
import Icon from 'react-native-vector-icons/Ionicons';
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
      if (Platform.OS === 'android') {
        const { GoogleCredentialManager } = NativeModules;
        if (GoogleCredentialManager) {
          GoogleCredentialManager.configure(AUTH_CONFIG.googleWebClientId)
            .catch((err) => console.error('GoogleCredentialManager configure failed:', err.message));
        }
      }

      GoogleSignin.configure({
        webClientId: AUTH_CONFIG.googleWebClientId,
        iosClientId: AUTH_CONFIG.googleIosClientId,
        offlineAccess: true,
      });
    } catch (e) {
      console.error('Google Sign-In configuration failed:', e.message);
    }
  }, []);



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
      return;
    }
    operationInProgress.current = true;
    setActiveSocial('google');
    try {
      const rawNonce = generateNonce();
      const hashedNonce = CryptoJS.SHA256(rawNonce).toString();

      let idToken;
      if (Platform.OS === 'android') {
        const { GoogleCredentialManager } = NativeModules;
        if (!GoogleCredentialManager) {
          throw new Error('GoogleCredentialManager native module is not registered.');
        }
        
        await GoogleCredentialManager.configure(AUTH_CONFIG.googleWebClientId);
        const userInfo = await GoogleCredentialManager.signIn(hashedNonce);
        idToken = userInfo.idToken;
      } else {
        await GoogleSignin.hasPlayServices();
        
        try {
          await GoogleSignin.signOut();
        } catch (signOutError) {
          // ignore
        }

        const userInfo = await GoogleSignin.signIn({
          nonce: hashedNonce,
        });

        idToken = userInfo.data?.idToken || userInfo.idToken;
      }

      if (!idToken) {
        throw new Error('Google ID Token could not be retrieved.');
      }

      console.log('Google login code received, exchanging with Auth0...');
      await loginWithGoogle(idToken, rawNonce);
    } catch (err) {
      console.error('Google Native Login failed:', err.message || err);
      const isCancel = err.code === statusCodes.SIGN_IN_CANCELLED || err.message === 'Sign in action cancelled' || err.code === 'SIGN_IN_CANCELLED';
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
        nonceEnabled: false,
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const authCode = appleAuthRequestResponse.authorizationCode;
      if (!authCode) {
        throw new Error('Apple authorization code could not be retrieved.');
      }

      console.log('Apple code received, exchanging with Auth0...');
      await loginWithApple(authCode);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Decorative Glowing Rings Overlay */}
      <Image
        source={require('../assets/image/rings.png')}
        style={styles.ringTopRight}
      />
      <Image
        source={require('../assets/image/rings.png')}
        style={styles.ringBottomLeft}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Headline */}
            <TouchableOpacity activeOpacity={1} onPress={handleSecretTap}>
              <Text style={styles.headlineText}>
                {mode === 'login' ? 'Sign In To Swapp' : 'Sign Up To Swapp'}
              </Text>
            </TouchableOpacity>

            {/* Inputs & Form Wrapper */}
            <View style={styles.formContainer}>
              
              {/* Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputWrapperError : null]}>
                  <Icon name="mail-outline" size={18} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Support@swappfit.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={handleEmailChange}
                    editable={!loading && !socialLoading}
                  />
                </View>
                {emailError ? <Text style={styles.errorLabel}>{emailError}</Text> : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[styles.inputWrapper, passwordError ? styles.inputWrapperError : null]}>
                  <Icon name="lock-closed-outline" size={18} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="************"
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
                    <Icon
                      name={securePassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorLabel}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password (only for signup) */}
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, confirmPasswordError ? styles.inputWrapperError : null]}>
                    <Icon name="lock-closed-outline" size={18} color="rgba(255, 255, 255, 0.6)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm password"
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
                      <Icon
                        name={secureConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="rgba(255, 255, 255, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? <Text style={styles.errorLabel}>{confirmPasswordError}</Text> : null}
                </View>
              )}

              {/* Submit Button */}
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
                    {mode === 'login' ? 'Sign In  ➔' : 'Sign Up  ➔'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Social */}
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
                      <Image
                        source={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5gYJDQ4X7Q2cswAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLm4nAAACyklEQVRIx+2VS08TURSGv9OZ6XQqtFCLFhJ5iBBiYkKwMfG+Gzcm7oqurG5NdO3GjQt/gRujGgMxhhijiQkkBAtCoC1Q2ulMp3NnOlPAQkpbwMXGczk7957zne+ee+5F+M/lOq5c+U+P+A5wM7D/HMA64GtgFzCBfWDvswBLgA1YA4SBW8BtwAmsD3+31+qPzUAbcBPYB2oA4uU+YAbIAh0gAax/FmAFWAIeAhngEXALcKEEsA08BLpAG8Bf7gLmgCwwBLwGHgAOFJ8H2ABeATlgCHgNPIA3u4H1p6p64WJz3/8BvAHywFDXq/oHqjPzF1QJgCJA5nL5C5W+3KjOAPeBLNAF1oDXQAa4XzYAbABvgLvuUfUD1Rn1E1V5sKpeUOW+X9UPVAZ4AHSAN4C7w9uAew275727h80DXffZ9QPVoepW1Vf1t6rG/Wv1XjWv6kfVEfWTeqGqZ0AG6AJv7mE0gQ1gDTAJ3AQywH0gC3SBN4BbVd+omlF3VL2pZlWDqm9VTaqZ4fWqetUzIAO8BTKAhx/jEXgD3AYywH0gC3SBB1XfqJpRs+qOqjfVrGowvF5Vr3oGZIA3QAbw8E+fN/fQhruHdg+tB2ruoeVAFXWfVRVVD1SV1T1W76tZtV/NjKzPqf3qZ+oe2gCee+gc6k+oA+rP6PewOaDOqX1Vv6q/VTXq32sQVWfUYfVn1EH1E3XhVbYBHGBm0K8/og6oP6Pf/eawOqf2Vf2q/lbVqH+vQVSdUYfVn1EH1U/UhU9ZBzjAzCDW7uVndY+rO1y9X1XPq5pSd1X9qOap6nlVTaqvqkeq6lUPgPMA+285e6/q7Dqrv+bsPqqz46xecFYfsLNDznY4W1vOVjlbO2db1zZ4y1gHOAiw95C9l5zte/brnL2Xne17Vp+z+oC99dhbi72tsLVqWzP+A38BLq83H+r7e38AAAAASUVORK5CYII=' }}
                        style={{ width: 18, height: 18 }}
                      />
                    </View>
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Social */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleAppleLogin}
                  disabled={loading || socialLoading}
                  activeOpacity={0.8}
                >
                  {activeSocial === 'apple' ? (
                    <GlobalLoader size={24} />
                  ) : (
                    <>
                      <View style={styles.socialIconWrapper}>
                        <Icon name="logo-apple" size={20} color="#FFF" />
                      </View>
                      <Text style={styles.socialButtonText}>Continue with Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Mode Switcher Link */}
              <TouchableOpacity
                style={styles.footerLinkRow}
                onPress={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setEmailError('');
                  setPasswordError('');
                  setConfirmPasswordError('');
                }}
              >
                <Text style={styles.footerLinkText}>
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.linkHighlight}>
                    {mode === 'login' ? 'Sign Up.' : 'Sign In.'}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              {mode === 'login' && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Reset Password', 'A password reset link will be sent to your email.')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>
              )}

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const createStyles = ({ wp, ms, fs, sp }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: sp(24),
      paddingVertical: sp(32),
    },
    ringTopRight: {
      position: 'absolute',
      top: -sp(60),
      right: -sp(60),
      width: sp(260),
      height: sp(260),
      resizeMode: 'contain',
      opacity: 0.8,
    },
    ringBottomLeft: {
      position: 'absolute',
      bottom: -sp(60),
      left: -sp(60),
      width: sp(260),
      height: sp(260),
      resizeMode: 'contain',
      opacity: 0.6,
      transform: [{ rotate: '180deg' }],
    },
    headlineText: {
      color: '#ffffff',
      fontSize: fs(32),
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      textAlign: 'center',
      marginTop: sp(50),
      marginBottom: sp(30),
    },
    formContainer: {
      width: '100%',
      maxWidth: Math.min(ms(380), wp(90)),
      alignSelf: 'center',
    },
    inputGroup: {
      marginBottom: sp(20),
      width: '100%',
    },
    inputLabel: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: fs(13),
      fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
      marginBottom: sp(8),
      marginLeft: sp(4),
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#000',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderRadius: ms(12),
      paddingHorizontal: sp(16),
      height: sp(54),
    },
    inputWrapperError: {
      borderColor: '#ff4a4a',
    },
    inputIcon: {
      marginRight: sp(12),
    },
    textInput: {
      flex: 1,
      color: '#ffffff',
      fontSize: fs(15),
      paddingVertical: 0,
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
      backgroundColor: '#000',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      height: sp(54),
      borderRadius: ms(12),
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: sp(10),
    },
    signInButtonText: {
      color: '#ffffff',
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
      backgroundColor: '#000',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      height: sp(50),
      borderRadius: ms(25),
      marginBottom: sp(14),
      justifyContent: 'center',
    },
    socialIconWrapper: {
      position: 'absolute',
      left: sp(20),
    },
    socialButtonText: {
      color: '#ffffff',
      fontSize: fs(15),
      fontWeight: '600',
    },
    footerLinkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: sp(24),
    },
    footerLinkText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: fs(14),
    },
    linkHighlight: {
      color: '#7C4DFF',
      fontWeight: 'bold',
    },
    forgotPasswordText: {
      color: 'rgba(255, 255, 255, 0.4)',
      fontSize: fs(13),
      textAlign: 'center',
      marginTop: sp(16),
      textDecorationLine: 'underline',
    },
  });

export default LoginScreen;