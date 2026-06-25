import * as ClaritySDK from '@microsoft/react-native-clarity';

export const initialize = (projectId) => {
  try {
    ClaritySDK.initialize(projectId);
  } catch (e) {
    console.error('[Clarity] Initialization failed:', e);
  }
};

export const sendCustomEvent = (name) => {
  try {
    ClaritySDK.sendCustomEvent(name);
  } catch (e) {
    console.error(`[Clarity] Failed to send event ${name}:`, e);
  }
};

export const setCustomTag = (key, value) => {
  try {
    ClaritySDK.setCustomTag(key, value);
  } catch (e) {
    console.error(`[Clarity] Failed to set tag ${key}:`, e);
  }
};

export const setCustomUserId = (id) => {
  try {
    ClaritySDK.setCustomUserId(id);
  } catch (e) {
    console.error('[Clarity] Failed to set user ID:', e);
  }
};
