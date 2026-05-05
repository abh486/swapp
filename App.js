// App.js
import React from 'react';
import 'react-native-gesture-handler';
import { Auth0Provider } from 'react-native-auth0';
import { Provider } from 'react-redux';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';
import { AuthProvider, ImageSelectionProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import store from './src/redux/store/store';
import { useEffect } from 'react';

// Ignore specific warnings that might be related to Auth0
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  console.log('App: Initializing with Auth0 configuration');

  useEffect(() => {
    // App Initialization logic can go here
  }, []);

  return (
    <Provider store={store}>
      <LocationProvider>
        <ImageSelectionProvider>
          <Auth0Provider
            domain="login.swapp.fit"
            clientId="6ZkGuIXZXCih2ayYupzTaWQRc6hhWsz0"
            audience="https://api.fitnessclub.com"
            scope="openid profile email offline_access"
          >
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </Auth0Provider>
        </ImageSelectionProvider>
      </LocationProvider>
    </Provider>
  );
};

export default App;
