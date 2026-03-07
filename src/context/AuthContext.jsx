// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import Auth0 from "react-native-auth0";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient, { getToken, debugStorage } from "../api/apiClient";

// Initialize Auth0
const auth0 = new Auth0({
  domain: "login.swapp.fit",
  clientId: "rwah022fY6bSPr5gstiKqPAErQjgynT2",
});

// Create a context for image selection state
const ImageSelectionContext = createContext();
export const useImageSelection = () => useContext(ImageSelectionContext);

export const ImageSelectionProvider = ({ children }) => {
  const [isImageSelectionInProgress, setIsImageSelectionInProgress] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  return (
    <ImageSelectionContext.Provider
      value={{
        isImageSelectionInProgress,
        setIsImageSelectionInProgress,
        pendingImage,
        setPendingImage,
      }}
    >
      {children}
    </ImageSelectionContext.Provider>
  );
};

const AuthContext = createContext();

// ✅ EXACT MATCH TO AUTH0 DASHBOARD URLS
const getRedirectUri = () => {
  if (Platform.OS === "ios") {
    return "https://login.swapp.fit/ios/com.swapp.swappfit/callback";
  } else {
    return "https://login.swapp.fit/android/com.swappios/callback";
  }
};

export const AuthProvider = ({ children }) => {
  const { isImageSelectionInProgress } = useImageSelection();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const checkAuthStatus = async () => {
    if (isImageSelectionInProgress) {
      console.log("[DEBUG] Skipping authentication check during image selection");
      return;
    }

    console.log("[DEBUG] Starting checkAuthStatus...");
    setLoading(true);
    try {
      const savedToken = await getToken();
      if (!savedToken) {
        throw new Error("No token found in storage.");
      }

      // 🚨 Ensure apiClient uses HTTPS. Cleartext HTTP is disabled.
      const resp = await apiClient.post("/v1/auth/verify-member");

      if (resp.data?.success && resp.data.data) {
        const userObject = resp.data.data.user;
        setUserProfile(userObject);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("userProfile", JSON.stringify(userObject));

        if (userObject.memberProfile && userObject.memberProfile.name) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      } else {
        throw new Error("Backend verification failed.");
      }
    } catch (e) {
      console.error("🔴 ERROR in checkAuthStatus:", e.message);
      if (e.message === "Network Error") {
        console.error("🔴 Network Error: Check if API_URL is HTTPS. HTTP is blocked.");
      }
      setIsAuthenticated(false);
      setHasProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuthStatus = async () => {
    if (isImageSelectionInProgress) return;
    await checkAuthStatus();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const creds = await auth0.webAuth.authorize({
        scope: "openid profile email offline_access",
        audience: "https://api.fitnessclub.com",
        redirectUri: getRedirectUri(), // Uses the HTTPS link
      });

      if (creds?.accessToken) {
        await auth0.credentialsManager.saveCredentials(creds);
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
      await auth0.webAuth.clearSession();
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
        user: userProfile,
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