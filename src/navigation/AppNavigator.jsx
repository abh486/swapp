import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { View, ActivityIndicator, Text } from "react-native";

// Screens
import MemberProfile from "../screens/MemberProfile"; // 👈 Profile creation/edit screen
import DietAllLogs from "../screens/activity/diet/DietAllLogs";

import BottomTabNavigator from "./BottomTabNavigator";
import TestOllamaScreen from "../screens/activity/components/OllamaScreen";
import DiscoverProvidersMapScreen from "../screens/home/dashboard/DiscoverProvidersMapScreen";
import ProviderDetailScreen from "../screens/home/provider/ProviderDetailScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import Dietplan from "../screens/activity/diet/Dietplan";
import WorkoutsScreen from "../screens/workout/WorkoutsScreen";
import CreateFastWorkoutScreen from "../screens/workout/CreateFastWorkoutScreen";
import CreateCustomWorkoutScreen, { WorkoutEditorScreen } from "../screens/workout/CreateCustomWorkoutScreen";
import FastWorkoutActiveScreen from "../screens/workout/FastWorkoutActiveScreen";
import WorkoutSummaryScreen from "../screens/workout/WorkoutSummaryScreen";
import CurrentWorkoutPlanScreen from "../screens/workout/CurrentWorkoutPlanScreen";


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
           
              <Stack.Screen name="DietAllLogs" component={DietAllLogs} />
              
              <Stack.Screen name="DiscoverProvidersMap" component={DiscoverProvidersMapScreen} />
              <Stack.Screen name="ProviderDetails" component={ProviderDetailScreen} />
              <Stack.Screen name="Dietplan" component={Dietplan} />
              <Stack.Screen name="Workouts" component={WorkoutsScreen} />
              <Stack.Screen name="CreateFastWorkoutScreen" component={CreateFastWorkoutScreen} />
              <Stack.Screen name="CreateCustomWorkoutScreen" component={CreateCustomWorkoutScreen} />
              <Stack.Screen name="WorkoutEditorScreen" component={WorkoutEditorScreen} />
              <Stack.Screen name="FastWorkoutActive" component={FastWorkoutActiveScreen} options={{ gestureEnabled: false }} />
              <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
              <Stack.Screen name="CurrentWorkoutPlanScreen" component={CurrentWorkoutPlanScreen} />
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
