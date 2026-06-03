// src/context/AuthContext.js

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Platform, Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GlobalLoader } from '../components/GlobalLoader';
import { WebView } from 'react-native-webview';
import Auth0 from 'react-native-auth0';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clarity from '@microsoft/react-native-clarity';
import apiClient, {
  AUTH0_API_AUDIENCE,
  AUTH0_LOGIN_SCOPE,
  getToken,
  debugStorage,
} from '../api/apiClient';
import { AUTH_CONFIG } from '../config/config';

// Initialize Auth0
const auth0 = new Auth0({
  domain: 'login.swapp.fit',
  clientId: '6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0',
});

// Create a context for image selection state
const ImageSelectionContext = createContext();
export const useImageSelection = () => useContext(ImageSelectionContext);

export const ImageSelectionProvider = ({ children }) => {
  const [isImageSelectionInProgress, setIsImageSelectionInProgress] =
    useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  return (
    <ImageSelectionContext.Provider
      value={{
        isImageSelectionInProgress,
        setIsImageSelectionInProgress,
        pendingImage,
        setPendingImage,
      }}
    >
      {children}
    </ImageSelectionContext.Provider>
  );
};

const AuthContext = createContext();

const getRedirectUri = () => {
  if (Platform.OS === 'ios') {
    return 'com.swapp.swappfit.auth0://login.swapp.fit/ios/com.swapp.swappfit/callback';
  } else {
    return 'https://swapp.fit/android/com.swappios/callback';
  }
};

const generateCodeVerifier = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 50; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const decodeBase64Url = (value) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let input = value.replace(/-/g, '+').replace(/_/g, '/');
    while (input.length % 4) input += '=';

    let output = '';
    let buffer = 0;
    let bits = 0;

    for (const char of input) {
      if (char === '=') break;
      const index = chars.indexOf(char);
      if (index === -1) return null;
      buffer = (buffer << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }

    return output;
  } catch (e) {
    return null;
  }
};

const extractNonceFromIdToken = (idToken) => {
  try {
    const part = idToken?.split('.')?.[1];
    if (!part) return null;
    const decoded = decodeBase64Url(part);
    if (!decoded) return null;
    const payload = JSON.parse(decoded);
    return payload?.nonce || null;
  } catch (e) {
    console.log('[AuthContext] Failed to parse ID Token payload for nonce:', e.message);
    return null;
  }
};

const getQueryParam = (url, param) => {
  const regex = new RegExp('[\\?&#]' + param + '=([^&#]*)');
  const results = regex.exec(url);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

export const AuthProvider = ({ children }) => {
  const { isImageSelectionInProgress } = useImageSelection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWebViewModal, setShowWebViewModal] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const codeVerifierRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const checkAuthStatus = useCallback(
    async ({ silent = false } = {}) => {
      if (isImageSelectionInProgress) {
        console.log(
          '[DEBUG] Skipping authentication check during image selection',
        );
        return;
      }

      console.log('[DEBUG] Starting checkAuthStatus...');
      if (!silent) {
        setLoading(true);
      }
      try {
        const savedToken = await getToken();
        if (!savedToken) {
          throw new Error('No token found in storage.');
        }

        // 🚨 Ensure apiClient uses HTTPS. Cleartext HTTP is disabled.
        const resp = await apiClient.post('/v1/auth/verify-member');

        if (resp.data?.success && resp.data.data) {
          const userObject = resp.data.data.user;
          setUserProfile(userObject);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('userProfile', JSON.stringify(userObject));

          if (userObject && userObject.id) {
            console.log('[Clarity] Setting custom user ID:', userObject.id);
            try {
              Clarity.setCustomUserId(userObject.id);
              if (userObject.email) {
                Clarity.setCustomTag('email', userObject.email);
              }
            } catch (err) {
              console.error('[Clarity] Failed to set user ID/tags:', err);
            }
          }

          if (
            (userObject.userProfile && userObject.userProfile.name) ||
            (userObject.memberProfile && userObject.memberProfile.name)
          ) {
            setHasProfile(true);
          } else {
            setHasProfile(false);
          }
        } else {
          throw new Error('Backend verification failed.');
        }
      } catch (e) {
        console.error('🔴 ERROR in checkAuthStatus:', e.message);
        if (e.message === 'Network Error') {
          console.error(
            '🔴 Network Error: Check if API_URL is HTTPS. HTTP is blocked.',
          );
        }
        setIsAuthenticated(false);
        setHasProfile(false);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [isImageSelectionInProgress],
  );

  const refreshAuthStatus = useCallback(async () => {
    if (isImageSelectionInProgress) return;
    await checkAuthStatus({ silent: true });
  }, [checkAuthStatus, isImageSelectionInProgress]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleRedirect = async (url) => {
    setShowWebViewModal(false);
    setIsLoggingIn(true);

    const authCode = getQueryParam(url, 'code');
    if (authCode) {
      try {
        console.log('[AuthContext] Exchanging authorization code for tokens...');
        const tokenUrl = `https://login.swapp.fit/oauth/token`;
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: '6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0',
            code_verifier: codeVerifierRef.current,
            code: authCode,
            redirect_uri: getRedirectUri(),
          }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenResponse.ok && tokenData.access_token) {
          console.log('[AuthContext] Tokens successfully fetched!');
          const creds = {
            accessToken: tokenData.access_token,
            idToken: tokenData.id_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in || 86400) * 1000,
            scope: tokenData.scope || AUTH0_LOGIN_SCOPE,
            tokenType: tokenData.token_type || 'Bearer',
          };

          await auth0.credentialsManager.saveCredentials(creds);
          await AsyncStorage.setItem('accessToken', creds.accessToken);
          await checkAuthStatus();
        } else {
          console.error('[AuthContext] Token exchange failed:', tokenData);
          alert('Login failed: Could not exchange authorization code.');
        }
      } catch (err) {
        console.error('[AuthContext] Error during token exchange:', err);
        alert('Login failed due to an error.');
      } finally {
        setIsLoggingIn(false);
      }
    } else {
      console.error('[AuthContext] No auth code found in callback URL:', url);
      setIsLoggingIn(false);
    }
  };

  const isRedirectUrl = (url) => {
    const redirectUri = getRedirectUri();
    return (
      url.includes('code=') &&
      (url.startsWith(redirectUri) ||
        url.includes('/callback') ||
        url.startsWith('com.swappios.auth0://') ||
        url.startsWith('com.swapp.swappfit.auth0://'))
    );
  };

  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;
    console.log('[AuthContext] WebView should load request:', url);
    if (isRedirectUrl(url)) {
      handleRedirect(url);
      return false; // Stop the WebView from loading this URL
    }
    return true;
  };

  const handleNavigationStateChange = (navState) => {
    const { url } = navState;
    console.log('[AuthContext] WebView navigation state changed:', url);
    if (isRedirectUrl(url)) {
      handleRedirect(url);
    }
  };

  const loginWithWebView = async () => {
    setIsLoggingIn(true);
    try {
      const verifier = generateCodeVerifier();
      codeVerifierRef.current = verifier;

      const domain = 'login.swapp.fit';
      const clientId = '6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0';
      const scope = AUTH0_LOGIN_SCOPE;
      const audience = AUTH0_API_AUDIENCE;
      const redirectUri = getRedirectUri();
      const state = Math.random().toString(36).substring(2, 15);

      const url = `https://${domain}/authorize?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `audience=${encodeURIComponent(audience)}&` +
        `state=${encodeURIComponent(state)}&` +
        `code_challenge=${encodeURIComponent(verifier)}&` +
        `code_challenge_method=plain&` +
        `prompt=login`;

      setAuthUrl(url);
      setShowWebViewModal(true);
    } catch (e) {
      console.error('🔴 [loginWithWebView] failed:', e.message);
      setIsLoggingIn(false);
    }
  };

  const loginWithEmailPassword = async (email, password) => {
    setIsLoggingIn(true);
    try {
      console.log('[AuthContext] loginWithEmailPassword starting...');
      const credentials = await auth0.auth.passwordRealm({
        username: email,
        password: password,
        realm: AUTH_CONFIG.databaseConnection,
        audience: AUTH0_API_AUDIENCE,
        scope: AUTH0_LOGIN_SCOPE,
      });

      console.log('[AuthContext] loginWithEmailPassword credentials received!');
      await auth0.credentialsManager.saveCredentials(credentials);
      await AsyncStorage.setItem('accessToken', credentials.accessToken);
      await checkAuthStatus();
      return credentials;
    } catch (err) {
      console.error('[AuthContext] loginWithEmailPassword failed:', err);
      if (AUTH_CONFIG.enableLegacyWebviewLogin) {
        console.log('[AuthContext] Falling back to WebView login...');
        await loginWithWebView();
      }
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithGoogle = async (googleIdToken) => {
    setIsLoggingIn(true);
    try {
      console.log('[AuthContext] loginWithGoogle starting direct token exchange...');
      
      const part = googleIdToken?.split('.')?.[1];
      const decoded = decodeBase64Url(part);
      const nonce = extractNonceFromIdToken(googleIdToken);

      const tokenUrl = 'https://login.swapp.fit/oauth/token';
      const requestBody = {
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        client_id: '6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0',
        subject_token: googleIdToken,
        subject_token_type: 'http://auth0.com/oauth/token-type/google-id-token',
        audience: AUTH0_API_AUDIENCE,
        scope: AUTH0_LOGIN_SCOPE,
        ...(nonce ? { nonce } : {}),
      };

      console.log('[AuthContext] Sending token exchange request to Auth0 with body keys:', Object.keys(requestBody));

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const tokenData = await response.json();

      if (!response.ok) {
        console.error('[AuthContext] Token exchange failed response:', tokenData);
        throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed.');
      }

      console.log('[AuthContext] Token exchange successful, formatting credentials...');
      const credentials = {
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in || 86400) * 1000,
        scope: tokenData.scope || AUTH0_LOGIN_SCOPE,
        tokenType: tokenData.token_type || 'Bearer',
      };

      await auth0.credentialsManager.saveCredentials(credentials);
      await AsyncStorage.setItem('accessToken', credentials.accessToken);
      await checkAuthStatus();
      return credentials;
    } catch (err) {
      console.error('[AuthContext] loginWithGoogle failed:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loginWithApple = async (appleAuthCode) => {
    setIsLoggingIn(true);
    try {
      console.log('[AuthContext] loginWithApple starting token exchange...');
      const credentials = await auth0.auth.exchangeNativeSocial({
        subjectToken: appleAuthCode,
        subjectTokenType: 'http://auth0.com/oauth/token-type/apple-authz-code',
        audience: AUTH0_API_AUDIENCE,
        scope: AUTH0_LOGIN_SCOPE,
      });

      console.log('[AuthContext] loginWithApple credentials received!');
      await auth0.credentialsManager.saveCredentials(credentials);
      await AsyncStorage.setItem('accessToken', credentials.accessToken);
      await checkAuthStatus();
      return credentials;
    } catch (err) {
      console.error('[AuthContext] loginWithApple failed:', err);
      if (AUTH_CONFIG.enableLegacyWebviewLogin) {
        console.log('[AuthContext] Falling back to WebView login...');
        await loginWithWebView();
      }
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const login = async () => {
    console.log('[AuthContext] login called, triggering fallback webview...');
    await loginWithWebView();
  };

  const createAccount = async (email, password) => {
    setIsLoggingIn(true);
    try {
      console.log('[AuthContext] createAccount starting...');
      const user = await auth0.auth.createUser({
        email: email,
        password: password,
        connection: AUTH_CONFIG.databaseConnection,
      });
      console.log('[AuthContext] createAccount successful:', user);

      // Auto-login the user immediately
      console.log('[AuthContext] Auto-logging in user...');
      const credentials = await loginWithEmailPassword(email, password);
      return { user, credentials };
    } catch (err) {
      console.error('[AuthContext] createAccount failed:', err);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await auth0.credentialsManager.clearCredentials();
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Clear session error:', e.message);
    } finally {
      setIsAuthenticated(false);
      setHasProfile(false);
      setUserProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        user: userProfile,
        isAuthenticated,
        hasProfile,
        loading,
        isLoggingIn,
        login,
        loginWithEmailPassword,
        loginWithGoogle,
        loginWithApple,
        loginWithWebView,
        createAccount,
        logout,
        refreshAuthStatus,
        debugStorage,
      }}
    >
      {children}

      <Modal
        visible={showWebViewModal}
        animationType="slide"
        onRequestClose={() => {
          setShowWebViewModal(false);
          setIsLoggingIn(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowWebViewModal(false);
                setIsLoggingIn(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: authUrl }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            originWhitelist={['*']}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <GlobalLoader size={60} />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
