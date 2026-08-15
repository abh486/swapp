// App.js
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import { Auth0Provider } from 'react-native-auth0';
import { Provider } from 'react-redux';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, ImageSelectionProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import store from './src/redux/store/store';
import GlobalAlert from './src/components/GlobalAlert';
import { useEffect } from 'react';
import * as Clarity from './src/utils/clarity';
import { requestTracking } from './src/utils/tracking';
import {
  AUTH0_API_AUDIENCE,
  AUTH0_LOGIN_SCOPE,
} from './src/api/apiClient';
import Chargebee from '@chargebee/react-native-chargebee';
import { CHARGEBEE_CONFIG } from './src/config/chargebeeConfig';
import Geolocation from '@react-native-community/geolocation';

// Ignore specific warnings that might be related to Auth0
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  console.log('App: Initializing with Auth0 configuration');

  useEffect(() => {
    // Configure Geolocation for iOS to use whenInUse permission level
    if (Platform.OS === 'ios') {
      try {
        Geolocation.setRNConfiguration({
          skipPermissionRequests: false,
          authorizationLevel: 'whenInUse',
        });
        console.log('[Geolocation] Configured successfully for iOS (whenInUse)');
      } catch (err) {
        console.error('[Geolocation] Failed to set configuration:', err);
      }
    }

    // Initialize Chargebee SDK
    console.log('[Chargebee] Initializing SDK with site:', CHARGEBEE_CONFIG.site);
    Chargebee.configure(CHARGEBEE_CONFIG)
      .then(() => {
        console.log('[Chargebee] SDK initialized successfully');
      })
      .catch((e) => {
        console.error('[Chargebee] SDK configuration failed:', e);
      });

    // App Initialization logic can go here
    const projectId = Platform.OS === 'ios' ? 'wyktx0ad6h' : 'wylf1d5gx2';
    console.log(`[Clarity] Initializing with project ID ${projectId} for ${Platform.OS}`);
    try {
      Clarity.initialize(projectId);
    } catch (e) {
      console.error('[Clarity] Initialization failed:', e);
    }

    if (Platform.OS === 'ios') {
      const timer = setTimeout(() => {
        requestTracking().catch(err => {
          console.error('[Tracking] Error requesting tracking permission on app startup:', err);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#000000' }}>
          <LocationProvider>
            <ImageSelectionProvider>
              <Auth0Provider
                domain="login.swapp.fit"
                clientId="6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0"
                audience={AUTH0_API_AUDIENCE}
                scope={AUTH0_LOGIN_SCOPE}
              >
                <AuthProvider>
                  <AppNavigator />
                  <GlobalAlert />
                </AuthProvider>
              </Auth0Provider>
            </ImageSelectionProvider>
          </LocationProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
