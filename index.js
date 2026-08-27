import 'react-native-reanimated';
/**
 * @format
 */

import React from 'react';
import { AppRegistry, Text, StyleSheet } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import firebase from '@react-native-firebase/app';

// Register background handler safely
try {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('[FCM] Message handled in the background:', remoteMessage);
  });
} catch (err) {
  console.warn('[Firebase] Background messaging registration skipped:', err.message);
}

// Global Berlin Sans FB Font Family Interceptor
const setGlobalFont = () => {
  const oldRender = Text.render;
  Text.render = function (...args) {
    const origin = oldRender.call(this, ...args);
    const originalStyle = origin.props.style;
    const flatStyle = StyleSheet.flatten(originalStyle);
    
    // If the style already explicitly defines a font family, honor it completely
    if (flatStyle && flatStyle.fontFamily) {
      return origin;
    }
    
    // Apply elegant, slim Berlin Sans FB Regular (BRLNSR) globally
    const fontFamily = 'BRLNSR';
    
    // Merge the custom fontFamily, keeping all other original styles intact
    return React.cloneElement(origin, {
      style: [
        { fontFamily },
        originalStyle,
      ],
    });
  };
};

setGlobalFont();

AppRegistry.registerComponent(appName, () => App);
