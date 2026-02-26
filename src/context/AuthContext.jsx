// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { useAuth0 } from "react-native-auth0";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient, { getToken, debugStorage } from "../api/apiClient";

// Create a context for image selection state
const ImageSelectionContext = createContext();

// Custom hook to use the context
export const useImageSelection = () => useContext(ImageSelectionContext);

// Provider component
export const ImageSelectionProvider = ({ children }) => {
  const [isImageSelectionInProgress, setIsImageSelectionInProgress] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  
  return (
    <ImageSelectionContext.Provider value={{ 
      isImageSelectionInProgress, 
      setIsImageSelectionInProgress,
      pendingImage,
      setPendingImage
    }}>
      {children}
    </ImageSelectionContext.Provider>
  );
};

const AuthContext = createContext();

const getRedirectUri = () =>
  Platform.OS === "ios"
    ? "com.swapp.swappfit.auth0://dev-1de0bowjvfbbcx7q.us.auth0.com/ios/com.swapp.swappfit/callback"
    : "com.swappios.auth0://dev-1de0bowjvfbbcx7q.us.auth0.com/android/com.swappios/callback";

export const AuthProvider = ({ children }) => {
  const { authorize, clearSession } = useAuth0();
  const { isImageSelectionInProgress } = useImageSelection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const checkAuthStatus = async () => {
    // Skip authentication check if image selection is in progress
    if (isImageSelectionInProgress) {
      console.log("[DEBUG] Skipping authentication check during image selection");
      return;
    }
    
    console.log("------------------------------------------");
    console.log("[DEBUG] 1. Starting checkAuthStatus...");
    setLoading(true);
    try {
      const savedToken = await getToken();
      if (!savedToken) {
        throw new Error("No token found in storage.");
      }
      console.log("[DEBUG] 2. Token found. Verifying with /auth/verify-member...");

      const resp = await apiClient.post("/v1/auth/verify-member");

      console.log("[DEBUG] 3. Received response from backend.");

      if (resp.data?.success && resp.data.data) {
       const userObject = resp.data.data.user; 
        console.log("[DEBUG] 4. Backend verification SUCCESS. Full user object received:", JSON.stringify(userObject, null, 2));
        
        setUserProfile(userObject);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("userProfile", JSON.stringify(userObject));

        // --- THIS IS THE CRITICAL LOGIC WE NEED TO OBSERVE ---
        console.log("[DEBUG] 5. Now checking if profile is complete...");
        console.log("[DEBUG]    Checking userObject.memberProfile:", userObject.memberProfile);
        console.log("[DEBUG]    Checking userObject.memberProfile.name:", userObject.memberProfile?.name);

        if (userObject.memberProfile && userObject.memberProfile.name) {
          console.log("[DEBUG] 6. ✅ RESULT: Profile is considered COMPLETE.");
          setHasProfile(true);
        } else {
          console.log("[DEBUG] 6. ❌ RESULT: Profile is considered INCOMPLETE.");
          setHasProfile(false);
        }
        // --- END OF CRITICAL LOGIC ---

      } else {
        throw new Error("Backend verification failed or returned no data.");
      }
    } catch (e) {
      console.error("🔴 [DEBUG] 7. ERROR in checkAuthStatus:", e.message);
      if (e.message === 'Network Error') {
        console.error("🔴 Network Error - Possible causes:");
        console.error("   1. Backend server is not running");
        console.error("   2. Ngrok URL has expired (if using ngrok)");
        console.error("   3. API URL is incorrect");
        console.error("   4. Network connectivity issue");
      }
      setIsAuthenticated(false);
      setHasProfile(false);
    } finally {
      console.log("[DEBUG] 8. checkAuthStatus finished.");
      setLoading(false);
      console.log("------------------------------------------");
    }
  };

  const refreshAuthStatus = async () => {
    // Skip authentication refresh if image selection is in progress
    if (isImageSelectionInProgress) {
      console.log("[DEBUG] Skipping authentication refresh during image selection");
      return;
    }
    
    console.log("🔄 [DEBUG] Refresh triggered after profile update.");
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const creds = await authorize({
        scope: "openid profile email",
        audience: "https://api.fitnessclub.com",
        redirectUri: getRedirectUri(),
      });

      if (creds?.accessToken) {
        await AsyncStorage.setItem("accessToken", creds.accessToken);
        await checkAuthStatus();
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("🔴 [login] failed:", e.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await clearSession();
      await AsyncStorage.clear();
    } catch (e) {
      console.warn("Clear session error:", e.message);
    } finally {
      setIsAuthenticated(false);
      setHasProfile(false);
      setUserProfile(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        isAuthenticated,
        hasProfile,
        loading,
        login,
        logout,
        refreshAuthStatus,
        debugStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};