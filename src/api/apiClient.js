// apiClient.js (axios instance with Auth0 token interceptor)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: 'login.swapp.fit',
  clientId: '6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0',
});

export const AUTH0_API_AUDIENCE = 'https://api.fitnessclub.com';
export const AUTH0_LOGIN_SCOPE = 'openid profile email offline_access';

// Update this URL to your current backend server URL
// If using ngrok, get the new URL from: ngrok http <your-port>
// If using production, use: https://api.swapp.fit/api
export const API_BASE_URL = 'https://api.swapp.fit/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
});

const decodeBase64Url = value => {
  try {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
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

    return decodeURIComponent(
      output
        .split('')
        .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
  } catch {
    return null;
  }
};

const decodeJwtPart = (token, index) => {
  const part = token?.split('.')?.[index];
  if (!part) return null;

  const decoded = decodeBase64Url(part);
  if (!decoded) return null;

  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isUsableApiToken = token => {
  const header = decodeJwtPart(token, 0);
  const payload = decodeJwtPart(token, 1);
  const audience = Array.isArray(payload?.aud) ? payload.aud : [payload?.aud];

  return (
    header?.alg === 'RS256' &&
    audience.includes(AUTH0_API_AUDIENCE) &&
    (!payload?.exp || payload.exp * 1000 > Date.now() + 60000)
  );
};

const clearCachedAccessToken = async () => {
  await AsyncStorage.removeItem('accessToken');
};

const clearStoredCredentialsWithoutRefreshToken = async error => {
  if (!error?.message?.includes('does not contain a refresh token')) return;

  try {
    await auth0.credentialsManager.clearCredentials();
  } catch (clearError) {
    console.log(
      '[apiClient] failed to clear Auth0 credentials:',
      clearError.message,
    );
  }
};

export async function getToken() {
  try {
    const creds = await auth0.credentialsManager.getApiCredentials(
      AUTH0_API_AUDIENCE,
      undefined,
      60,
    );
    if (creds?.accessToken) {
      await AsyncStorage.setItem('accessToken', creds.accessToken);
      return creds.accessToken;
    }
  } catch (e) {
    const cachedToken = await AsyncStorage.getItem('accessToken');
    if (isUsableApiToken(cachedToken)) {
      console.log(
        '[apiClient] getToken error, using cached API token:',
        e.message,
      );
      return cachedToken;
    }

    await clearStoredCredentialsWithoutRefreshToken(e);
    await clearCachedAccessToken();
    console.log(
      '[apiClient] getToken error, cleared unusable cached token:',
      e.message,
    );
  }
  return null;
}

export async function debugStorage() {
  const accessToken = await AsyncStorage.getItem('accessToken');
  const userProfile = await AsyncStorage.getItem('userProfile');

  console.log('[apiClient] AsyncStorage debug:', {
    hasAccessToken: Boolean(accessToken),
    hasUserProfile: Boolean(userProfile),
  });

  return { accessToken, userProfile };
}

apiClient.interceptors.request.use(
  async config => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  error => {
    // Enhanced error logging
    if (error.code === 'ECONNABORTED') {
      console.error('API Request Timeout:', error.config?.url);
    } else if (error.message === 'Network Error') {
      console.error(
        'Network Error - Check if backend server is running and API URL is correct:',
        API_BASE_URL,
      );
      console.error('Full error:', error);
    } else if (error.response) {
      console.error(
        'API Error Response:',
        error.response.status,
        error.response.data,
      );
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
