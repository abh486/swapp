import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Clarity from '@microsoft/react-native-clarity';
import { useAuth } from '../context/AuthContext';
import { View, Text, Linking } from 'react-native';

// Screens
import MemberProfile from '../screens/MemberProfile'; // 👈 Profile creation/edit screen
import DietAllLogs from '../screens/activity/diet/DietAllLogs';
import DietPreferences from '../screens/activity/diet/DietPreferences';

import BottomTabNavigator from './BottomTabNavigator';
import Community from '../screens/community/Community';
import DiscoverProvidersMapScreen from '../screens/home/dashboard/DiscoverProvidersMapScreen';
import ProviderDetailScreen from '../screens/home/provider/ProviderDetailScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import Dietplan from '../screens/activity/diet/Dietplan';
import WorkoutsScreen from '../screens/workout/WorkoutsScreen';
import CreateFastWorkoutScreen from '../screens/workout/CreateFastWorkoutScreen';
import CreateCustomWorkoutScreen, {
  WorkoutEditorScreen,
} from '../screens/workout/CreateCustomWorkoutScreen';
import FastWorkoutActiveScreen from '../screens/workout/FastWorkoutActiveScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import CurrentWorkoutPlanScreen from '../screens/workout/CurrentWorkoutPlanScreen';
import CheckoutWebViewScreen from '../screens/home/booking/CheckoutWebViewScreen';
import SubscriptionSuccessScreen from '../screens/home/booking/SubscriptionSuccessScreen';
import PaymentProcessingScreen from '../screens/home/booking/PaymentProcessingScreen';
import MembershipDetailsScreen from '../screens/home/booking/MembershipDetailsScreen';
import MembershipBookingScreen from '../screens/home/booking/MembershipBookingScreen';
import TrainerBookingScreen from '../screens/home/trainer/TrainerBookingScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettings';
import EditPersonalInfoScreen from '../screens/profile/EditPersonalInfoScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import LoginScreen from '../screens/LoginScreen';
import TrainerDetailScreen from '../screens/home/trainer/TrainerDetailScreen';
import AIDieticianPaywallScreen from '../screens/AIDieticianPaywallScreen';
import AIDieticianSubscriptionScreen from '../screens/AIDieticianSubscriptionScreen';
import ManageSubscriptionsScreen from '../screens/profile/ManageSubscriptionsScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import Reminders from '../screens/profile/Reminders';
import AppsAndDevicesScreen from '../screens/profile/AppsAndDevicesScreen';

const Stack = createNativeStackNavigator();

import { FullScreenLoader } from '../components/GlobalLoader';

const AppNavigator = () => {
  const { isAuthenticated, hasProfile, loading, isLoggingIn, refreshAuthStatus } = useAuth();
  const navigationRef = React.useRef();

  React.useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (url && url.includes('subscription=success')) {
        console.log('[DeepLink] Success callback matched:', url);
        refreshAuthStatus?.();
        if (url.includes('ai-dietician')) {
          navigationRef.current?.navigate('MainTabs', { screen: 'Diet' });
        } else {
          navigationRef.current?.navigate('MainTabs', { screen: 'Home' });
        }
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      sub.remove();
    };
  }, [refreshAuthStatus]);

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;
          if (currentRouteName) {
            console.log('[Clarity] Screen viewed:', currentRouteName);
            try {
              Clarity.setCustomTag('CurrentScreen', currentRouteName);
              Clarity.sendCustomEvent(`Viewed_${currentRouteName}`);
            } catch (err) {
              console.error('[Clarity] Navigation tracking failed:', err);
            }
          }
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            hasProfile ? (
              // ✅ User authenticated + has profile → go to main app
              <>
                <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
                <Stack.Screen name="Community" component={Community} />
                <Stack.Screen name="DietAllLogs" component={DietAllLogs} />
                <Stack.Screen name="DietPreferences" component={DietPreferences} />
                <Stack.Screen name="Reminders" component={Reminders} />

                <Stack.Screen
                  name="DiscoverProvidersMap"
                  component={DiscoverProvidersMapScreen}
                />
                <Stack.Screen
                  name="ProviderDetails"
                  component={ProviderDetailScreen}
                />
                <Stack.Screen
                  name="TrainerDetailScreen"
                  component={TrainerDetailScreen}
                />
                <Stack.Screen name="Dietplan" component={Dietplan} />
                <Stack.Screen name="Workouts" component={WorkoutsScreen} />
                <Stack.Screen
                  name="CreateFastWorkoutScreen"
                  component={CreateFastWorkoutScreen}
                />
                <Stack.Screen
                  name="CreateCustomWorkoutScreen"
                  component={CreateCustomWorkoutScreen}
                />
                <Stack.Screen
                  name="WorkoutEditorScreen"
                  component={WorkoutEditorScreen}
                />
                <Stack.Screen
                  name="FastWorkoutActive"
                  component={FastWorkoutActiveScreen}
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen
                  name="WorkoutSummary"
                  component={WorkoutSummaryScreen}
                />
                <Stack.Screen
                  name="CurrentWorkoutPlanScreen"
                  component={CurrentWorkoutPlanScreen}
                />
                <Stack.Screen
                  name="CheckoutWebView"
                  component={CheckoutWebViewScreen}
                />
                <Stack.Screen
                  name="PaymentProcessing"
                  component={PaymentProcessingScreen}
                />
                <Stack.Screen
                  name="SubscriptionSuccess"
                  component={SubscriptionSuccessScreen}
                />
                <Stack.Screen
                  name="MembershipDetails"
                  component={MembershipDetailsScreen}
                />
                <Stack.Screen
                  name="MembershipBooking"
                  component={MembershipBookingScreen}
                />
                <Stack.Screen
                  name="TrainerBooking"
                  component={TrainerBookingScreen}
                />
                <Stack.Screen
                  name="ProfileSettings"
                  component={ProfileSettingsScreen}
                />
                <Stack.Screen
                  name="AppsAndDevices"
                  component={AppsAndDevicesScreen}
                />
                <Stack.Screen
                  name="EditPersonalInfo"
                  component={EditPersonalInfoScreen}
                />
                <Stack.Screen
                  name="Support"
                  component={SupportScreen}
                />
                <Stack.Screen
                  name="AIDieticianPaywall"
                  component={AIDieticianPaywallScreen}
                />
                <Stack.Screen
                  name="AIDieticianSubscription"
                  component={AIDieticianSubscriptionScreen}
                />
                <Stack.Screen
                  name="ManageSubscriptions"
                  component={ManageSubscriptionsScreen}
                />
                <Stack.Screen name="FollowList" component={FollowListScreen} />
                {/* <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetail} /> */}
              </>
            ) : (
              // ✅ User authenticated but no profile → go to profile setup
              <Stack.Screen name="MemberProfile" component={MemberProfile} />
            )
          ) : (
            // ✅ User not logged in → onboarding then login flow
            <>
              <Stack.Screen
                name="OnboardingScreen"
                component={OnboardingScreen}
              />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isLoggingIn && <FullScreenLoader />}
    </View>
  );
};

export default AppNavigator;
