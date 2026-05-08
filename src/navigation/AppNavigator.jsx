import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, Text } from "react-native";

// Screens
import MemberProfile from "../screens/MemberProfile"; // 👈 Profile creation/edit screen
import DietLog from "../screens/activity/components/DietLog";
import DietAllLogs from "../screens/activity/DietAllLogs";
import WorkoutLog from "../screens/activity/components/WorkoutLog";
import BottomTabNavigator from "./BottomTabNavigator";
import TestOllamaScreen from "../screens/activity/components/OllamaScreen";
import DiscoverProvidersMapScreen from "../screens/home/dashboard/DiscoverProvidersMapScreen";
import ProviderDetailScreen from "../screens/home/provider/ProviderDetailScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import Dietplan from "../screens/activity/Dietplan";


const Stack = createNativeStackNavigator();

// ✅ Splash screen while checking auth
const SplashScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#10B981" />
    <Text style={{ marginTop: 15 }}>Loading...</Text>
  </View>
);

const AppNavigator = () => {
  const { isAuthenticated, hasProfile, loading, isLoggingIn } = useAuth();
  if (loading || isLoggingIn) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          hasProfile ? (
            // ✅ User authenticated + has profile → go to main app
            <>
              <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
              <Stack.Screen name="DietLog" component={DietLog} />
              <Stack.Screen name="DietAllLogs" component={DietAllLogs} />
              <Stack.Screen name="WorkoutLog" component={WorkoutLog} />
              <Stack.Screen name="DiscoverProvidersMap" component={DiscoverProvidersMapScreen} />
              <Stack.Screen name="ProviderDetails" component={ProviderDetailScreen} />
                <Stack.Screen name="Dietplan" component={Dietplan} />
              {/* <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetail} /> */}
            </>
          ) : (
            // ✅ User authenticated but no profile → go to profile setup
            <Stack.Screen name="MemberProfile" component={MemberProfile} />
          )
        ) : (
          // ✅ User not logged in → onboarding then login flow
          <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        )}
        <Stack.Screen name="ollama" component={TestOllamaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
