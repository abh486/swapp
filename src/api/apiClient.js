// apiClient.js (axios instance with Auth0 token interceptor)
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: "login.swapp.fit",
  clientId: "6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0",
});

export const API_BASE_URL = "https://bleachable-maricruz-neglectingly.ngrok-free.dev/api";
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});


export async function getToken() {
  try {
    const creds = await auth0.credentialsManager.getCredentials("openid profile email offline_access");
    if (creds?.accessToken) {
      await AsyncStorage.setItem("accessToken", creds.accessToken);
      return creds.accessToken;
    }
  } catch (e) {
    console.log("[apiClient] getToken error, falling back to AsyncStorage:", e.message);
    return await AsyncStorage.getItem("accessToken");
  }
  return null;
}

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging
    if (error.code === 'ECONNABORTED') {
      console.error('API Request Timeout:', error.config?.url);
    } else if (error.message === 'Network Error') {
      console.error('Network Error - Check if backend server is running and API URL is correct:', API_BASE_URL);
      console.error('Full error:', error);
    } else if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;