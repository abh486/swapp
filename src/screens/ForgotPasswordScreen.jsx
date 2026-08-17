import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useResponsiveMetrics } from '../utils/responsive';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { resetPassword } = useAuth();
  const { wp, ms, fs, sp } = useResponsiveMetrics();
  const styles = React.useMemo(() => createStyles({ wp, ms, fs, sp }), [wp, ms, fs, sp]);

  const initialEmail = route.params?.initialEmail || '';
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendResetLink = async () => {
    const trimmed = (email || '').trim();
    if (!trimmed) {
      setEmailError('Please enter your registered email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address format.');
      return;
    }

    setEmailError('');
    setLoading(true);

    try {
      await resetPassword(trimmed);
      setIsSent(true);
      Alert.alert(
        'Password Reset Link Sent ✉️',
        `We have sent a secure password reset link to:\n\n${trimmed}\n\nPlease check your inbox (and spam/junk folder) and click the link to choose a new password.\n\nOnce reset, your new password will immediately be updated in Auth0 and you can sign in!`,
        [
          {
            text: 'Back to Sign In',
            onPress: () => navigation.navigate('LoginScreen'),
          },
        ]
      );
    } catch (err) {
      console.error('[ForgotPasswordScreen] Reset failed:', err.message);
      Alert.alert(
        'Reset Failed',
        err.message || 'Could not send password reset email. Please verify your email and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={sp(24)} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Forgot Password</Text>
          <View style={styles.navPlaceholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <View style={styles.iconInner}>
                <Icon name={isSent ? 'mail-open-outline' : 'key-outline'} size={sp(36)} color="#7C4DFF" />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.title}>
              {isSent ? 'Check Your Inbox' : 'Reset Your Password'}
            </Text>
            <Text style={styles.subtitle}>
              {isSent
                ? `A password reset link was sent to ${email.trim()}. Follow the instructions in the email to set a new password.`
                : 'Enter the email address associated with your Swappfit account and we will send you a secure link to reset your password.'}
            </Text>

            {/* Email Input Field */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, emailError ? styles.inputErrorBorder : null]}>
                <Icon
                  name="mail-outline"
                  size={sp(20)}
                  color="rgba(255, 255, 255, 0.4)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSendResetLink}
                />
                {email.length > 0 && !loading && (
                  <TouchableOpacity
                    onPress={() => setEmail('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close-circle" size={sp(18)} color="rgba(255, 255, 255, 0.3)" />
                  </TouchableOpacity>
                )}
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading ? { opacity: 0.7 } : null]}
              onPress={handleSendResetLink}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSent ? 'Resend Reset Link' : 'Send Reset Link'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Instructions Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardRow}>
                <Icon name="information-circle-outline" size={sp(20)} color="#7C4DFF" style={styles.infoIcon} />
                <Text style={styles.infoTitle}>What happens next?</Text>
              </View>
              <Text style={styles.infoText}>
                1. You will receive an official email from Auth0.
              </Text>
              <Text style={styles.infoText}>
                2. Click the secure link and enter your new password.
              </Text>
              <Text style={styles.infoText}>
                3. Your password updates directly in the cloud database.
              </Text>
              <Text style={styles.infoText}>
                4. Return to Swappfit and log in with your new password!
              </Text>
            </View>

            {/* Back to Sign In Link */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigation.navigate('LoginScreen')}
              activeOpacity={0.7}
            >
              <Text style={styles.backToLoginText}>
                Remember your password? <Text style={styles.backToLoginHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
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
      backgroundColor: '#000000',
    },
    safeArea: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: sp(16),
      paddingVertical: sp(12),
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    backButton: {
      width: sp(40),
      height: sp(40),
      borderRadius: sp(20),
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navTitle: {
      color: '#ffffff',
      fontSize: fs(17),
      fontWeight: '600',
    },
    navPlaceholder: {
      width: sp(40),
    },
    scrollContent: {
      paddingHorizontal: sp(24),
      paddingTop: sp(32),
      paddingBottom: sp(40),
    },
    iconCircle: {
      alignSelf: 'center',
      width: sp(80),
      height: sp(80),
      borderRadius: sp(40),
      backgroundColor: 'rgba(124, 77, 255, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sp(24),
      borderWidth: 1,
      borderColor: 'rgba(124, 77, 255, 0.3)',
    },
    iconInner: {
      width: sp(56),
      height: sp(56),
      borderRadius: sp(28),
      backgroundColor: 'rgba(124, 77, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: '#ffffff',
      fontSize: fs(24),
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: sp(10),
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.65)',
      fontSize: fs(14),
      lineHeight: fs(20),
      textAlign: 'center',
      marginBottom: sp(32),
      paddingHorizontal: sp(8),
    },
    inputSection: {
      marginBottom: sp(20),
    },
    inputLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: fs(13),
      fontWeight: '600',
      marginBottom: sp(8),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#161618',
      borderRadius: sp(14),
      paddingHorizontal: sp(16),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      height: sp(52),
    },
    inputErrorBorder: {
      borderColor: '#FF5252',
    },
    inputIcon: {
      marginRight: sp(12),
    },
    textInput: {
      flex: 1,
      color: '#ffffff',
      fontSize: fs(15),
    },
    errorText: {
      color: '#FF5252',
      fontSize: fs(12),
      marginTop: sp(6),
      marginLeft: sp(4),
    },
    primaryButton: {
      backgroundColor: '#7C4DFF',
      borderRadius: sp(14),
      height: sp(52),
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sp(8),
      marginBottom: sp(28),
      shadowColor: '#7C4DFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: fs(16),
      fontWeight: '700',
    },
    infoCard: {
      backgroundColor: '#141416',
      borderRadius: sp(16),
      padding: sp(18),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      marginBottom: sp(28),
    },
    infoCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sp(12),
    },
    infoIcon: {
      marginRight: sp(8),
    },
    infoTitle: {
      color: '#ffffff',
      fontSize: fs(14),
      fontWeight: '600',
    },
    infoText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: fs(13),
      lineHeight: fs(19),
      marginBottom: sp(6),
    },
    backToLoginButton: {
      alignItems: 'center',
      paddingVertical: sp(8),
    },
    backToLoginText: {
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: fs(14),
    },
    backToLoginHighlight: {
      color: '#7C4DFF',
      fontWeight: 'bold',
    },
  });

export default ForgotPasswordScreen;
