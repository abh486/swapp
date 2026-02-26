# Auth0 Troubleshooting Guide

## Issues Fixed

### 1. iOS Configuration
- ✅ Added URL scheme to `Info.plist`
- ✅ Created `Auth0.plist` configuration file
- ✅ Added CFBundleURLTypes for Auth0 redirects

### 2. Android Configuration
- ✅ URL scheme configured in `AndroidManifest.xml`
- ✅ Auth0 domain and scheme in `build.gradle`

### 3. React Native Auth0 Setup
- ✅ Enhanced AuthContext with proper token management
- ✅ Added comprehensive error handling
- ✅ Improved debugging and logging
- ✅ Fixed navigation flow

## Common Issues and Solutions

### Issue: Auth0 login page not opening
**Symptoms:**
- Clicking "CONTINUE" doesn't redirect to Auth0
- App stays on login screen
- No error messages

**Solutions:**
1. **Check Auth0 Configuration:**
   - Verify domain: `dev-1de0bowjvfbbcx7q.us.auth0.com`
   - Verify client ID: `rwah022fY6bSPr5gstiKqPAErQjgynT2`
   - Ensure URL scheme: `com.fitnessclub`

2. **Check Platform Configuration:**
   - iOS: Verify `Auth0.plist` exists and is properly configured
   - Android: Verify `AndroidManifest.xml` has correct intent filters

3. **Check Dependencies:**
   ```bash
   npm install react-native-auth0@latest
   ```

### Issue: App crashes on login
**Solutions:**
1. **Clear app data and reinstall**
2. **Check console logs for specific errors**
3. **Verify Auth0 application settings in Auth0 dashboard**

### Issue: Authentication state not persisting
**Solutions:**
1. **Check AsyncStorage permissions**
2. **Verify token storage in AuthContext**
3. **Check for token expiration**

## Debug Steps

1. **Enable Debug Mode:**
   - Use the "Debug Info" button on login screen
   - Check console logs for detailed information

2. **Check Auth0 Dashboard:**
   - Verify application settings
   - Check allowed callback URLs
   - Verify application type (Native)

3. **Test on Different Platforms:**
   - Test on both iOS and Android
   - Check platform-specific configurations

## Configuration Files

### iOS (`ios/FitnessClub/Info.plist`)
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>auth0</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.fitnessclub</string>
        </array>
    </dict>
</array>
```

### iOS (`ios/FitnessClub/Auth0.plist`)
```xml
<key>Domain</key>
<string>dev-1de0bowjvfbbcx7q.us.auth0.com</string>
<key>ClientId</key>
<string>rwah022fY6bSPr5gstiKqPAErQjgynT2</string>
<key>Scheme</key>
<string>com.fitnessclub</string>
```

### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:host="${auth0Domain}"
        android:pathPrefix="/android/${applicationId}/callback"
        android:scheme="${auth0Scheme}" />
</intent-filter>
```

### Android (`android/app/build.gradle`)
```gradle
manifestPlaceholders = [
    auth0Domain: "dev-1de0bowjvfbbcx7q.us.auth0.com",
    auth0Scheme: "com.fitnessclub"
]
```

## Testing

1. **Clean Build:**
   ```bash
   # iOS
   cd ios && rm -rf build && cd ..
   npx react-native run-ios
   
   # Android
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

2. **Check Logs:**
   - iOS: Xcode console
   - Android: Android Studio logcat
   - React Native: Metro bundler console

3. **Verify Auth0 Dashboard:**
   - Check application logs
   - Verify callback URLs
   - Check user authentication logs

## Next Steps

If issues persist:
1. Check Auth0 application settings
2. Verify network connectivity
3. Test with Auth0 sample app
4. Contact Auth0 support if needed
