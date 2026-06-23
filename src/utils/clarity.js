import { Platform } from 'react-native';
import * as ClaritySDK from '@microsoft/react-native-clarity';

const isAndroid = Platform.OS === 'android';

export const initialize = (projectId) => {
  if (isAndroid) {
    try {
      ClaritySDK.initialize(projectId);
    } catch (e) {
      console.error('[Clarity] Initialization failed:', e);
    }
  }
};

export const sendCustomEvent = (name) => {
  if (isAndroid) {
    try {
      ClaritySDK.sendCustomEvent(name);
    } catch (e) {
      console.error(`[Clarity] Failed to send event ${name}:`, e);
    }
  }
};

export const setCustomTag = (key, value) => {
  if (isAndroid) {
    try {
      ClaritySDK.setCustomTag(key, value);
    } catch (e) {
      console.error(`[Clarity] Failed to set tag ${key}:`, e);
    }
  }
};

export const setCustomUserId = (id) => {
  if (isAndroid) {
    try {
      ClaritySDK.setCustomUserId(id);
    } catch (e) {
      console.error('[Clarity] Failed to set user ID:', e);
    }
  }
};
