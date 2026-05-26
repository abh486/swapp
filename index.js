/**
 * @format
 */

import React from 'react';
import { AppRegistry, Text, StyleSheet } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

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
