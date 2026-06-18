// App.js
import React from 'react';
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
import * as Clarity from '@microsoft/react-native-clarity';
import {
  AUTH0_API_AUDIENCE,
  AUTH0_LOGIN_SCOPE,
} from './src/api/apiClient';

// Ignore specific warnings that might be related to Auth0
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  console.log('App: Initializing with Auth0 configuration');

  useEffect(() => {
    // App Initialization logic can go here
    const projectId = Platform.OS === 'ios' ? 'wyktx0ad6h' : 'wylf1d5gx2';
    console.log(`[Clarity] Initializing with project ID ${projectId} for ${Platform.OS}`);
    try {
      Clarity.initialize(projectId);
    } catch (e) {
      console.error('[Clarity] Initialization failed:', e);
    }
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
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
  );
};

export default App;
