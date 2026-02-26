# Auth0 Callback URL Configuration Guide

## 🎯 **The Problem Solved**

Your app was failing because the `redirectUri` wasn't explicitly set in the `authorize()` call, causing Auth0 to generate a default redirect URI that didn't match your configured callback URL.

## ✅ **What I Fixed**

1. **Added explicit `redirectUri`** to the `authorize()` call in `authContext.js`
2. **Updated test utility** to use the same redirect URI
3. **Verified platform configurations** are correct

## 🔧 **Auth0 Dashboard Configuration**

### **Allowed Callback URLs**
Add these URLs to your Auth0 Application Settings:

```
com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback
com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/ios/com.fitnessclub/callback
```

### **Allowed Logout URLs**
Add these URLs to your Auth0 Application Settings:

```
com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback
com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/ios/com.fitnessclub/callback
```

### **Allowed Web Origins**
Add these URLs to your Auth0 Application Settings:

```
com.fitnessclub://
```

## 📱 **Platform-Specific Callback URLs**

### **Android**
- **Callback URL**: `com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback`
- **Manifest**: ✅ Already configured correctly
- **Build.gradle**: ✅ Already configured correctly

### **iOS**
- **Callback URL**: `com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/ios/com.fitnessclub/callback`
- **Info.plist**: ✅ Already configured correctly
- **Auth0.plist**: ✅ Already configured correctly

## 🔍 **Why the Dashboard Test Worked But App Failed**

1. **Dashboard Test**: Uses a generic test that doesn't validate your specific redirect URI
2. **App Login**: Actually sends the redirect URI to Auth0, which must match exactly
3. **The Fix**: Now both use the same explicit `redirectUri` parameter

## 🛠️ **Code Changes Made**

### **authContext.js**
```javascript
const credentials = await authorize({
  scope: 'openid profile email',
  audience: 'https://dev-1de0bowjvfbbcx7q.us.auth0.com/api/v2/',
  prompt: 'login',
  redirectUri: 'com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback'
});
```

### **auth0Test.js**
```javascript
const result = await auth0.webAuth.authorize({
  scope: 'openid profile email',
  audience: 'https://dev-1de0bowjvfbbcx7q.us.auth0.com/api/v2/',
  prompt: 'login',
  redirectUri: 'com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback'
});
```

## 🧪 **Testing Steps**

1. **Update Auth0 Dashboard** with the callback URLs above
2. **Clean and rebuild** your app:
   ```bash
   # Android
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   
   # iOS
   cd ios && rm -rf build && cd ..
   npx react-native run-ios
   ```
3. **Test the login flow** - it should now work correctly
4. **Use debug buttons** to verify configuration

## 🔧 **Alternative: Platform-Specific Redirect URIs**

If you want to use different redirect URIs for each platform, you can modify the code:

```javascript
import { Platform } from 'react-native';

const getRedirectUri = () => {
  if (Platform.OS === 'ios') {
    return 'com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/ios/com.fitnessclub/callback';
  } else {
    return 'com.fitnessclub://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.fitnessclub/callback';
  }
};

const credentials = await authorize({
  scope: 'openid profile email',
  audience: 'https://dev-1de0bowjvfbbcx7q.us.auth0.com/api/v2/',
  prompt: 'login',
  redirectUri: getRedirectUri()
});
```

## ✅ **Verification Checklist**

- [ ] Auth0 callback URLs configured
- [ ] Auth0 logout URLs configured  
- [ ] Auth0 web origins configured
- [ ] App code updated with explicit redirectUri
- [ ] Android manifest verified
- [ ] iOS Info.plist verified
- [ ] App rebuilt and tested

## 🚨 **Common Issues**

1. **URL Scheme Mismatch**: Ensure `com.fitnessclub` matches your bundle ID
2. **Domain Mismatch**: Ensure `dev-1de0bowjvfbbcx7q.us.auth0.com` matches your Auth0 domain
3. **Path Mismatch**: Ensure `/android/com.fitnessclub/callback` path is correct
4. **Case Sensitivity**: URLs are case-sensitive, ensure exact match

## 📞 **Next Steps**

1. Update your Auth0 dashboard with the callback URLs
2. Test the login flow
3. If issues persist, check the console logs for specific error messages
4. Use the debug buttons in the app to verify configuration
