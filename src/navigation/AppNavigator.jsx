import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Clarity from '../utils/clarity';
import { useAuth } from '../context/AuthContext';
import { View, Text, Linking } from 'react-native';

// Screens
import MemberProfile from '../screens/MemberProfile'; // 👈 Profile creation/edit screen
import DietAllLogs from '../screens/activity/diet/DietAllLogs';
import DietPreferences from '../screens/activity/diet/DietPreferences';
import AlmostDoneScreen from '../screens/activity/diet/AlmostDoneScreen';
import AlmostDoneFinalScreen from '../screens/activity/diet/AlmostDoneFinalScreen';
import AlmostDoneClocheScreen from '../screens/activity/diet/AlmostDoneClocheScreen';
import WeeklyDietPlanScreen from '../screens/activity/diet/WeeklyDietPlanScreen';
import MacronutrientDetailsScreen from '../screens/activity/diet/MacronutrientDetailsScreen';
import HealthKitDataScreen from '../screens/profile/HealthKitDataScreen';
import WalkDetailsScreen from '../screens/profile/WalkDetailsScreen';
import SleepDetailsScreen from '../screens/profile/SleepDetailsScreen';

import BottomTabNavigator from './BottomTabNavigator';
import Community from '../screens/community/Community';
import CommentsScreen from '../screens/community/CommentsScreen';
import DiscoverProvidersMapScreen from '../screens/home/dashboard/DiscoverProvidersMapScreen';
import ProviderDetailScreen from '../screens/home/provider/ProviderDetailScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import Dietplan from '../screens/activity/diet/Dietplan';
import WorkoutsScreen from '../screens/workout/WorkoutsScreen';
import CreateFastWorkoutScreen from '../screens/workout/CreateFastWorkoutScreen';
import CreateCustomWorkoutScreen, {
  WorkoutEditorScreen,
} from '../screens/workout/CreateCustomWorkoutScreen';
import StoreComingSoon from '../screens/store/StoreComingSoon';
import FastWorkoutActiveScreen from '../screens/workout/FastWorkoutActiveScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import CurrentWorkoutPlanScreen from '../screens/workout/CurrentWorkoutPlanScreen';
import ExerciseDetailScreen from '../screens/workout/ExerciseDetailScreen';
import CheckoutBrowserScreen from '../screens/home/booking/CheckoutBrowserScreen';
import SubscriptionSuccessScreen from '../screens/home/booking/SubscriptionSuccessScreen';
import PaymentProcessingScreen from '../screens/home/booking/PaymentProcessingScreen';
import MembershipDetailsScreen from '../screens/home/booking/MembershipDetailsScreen';
import MembershipBookingScreen from '../screens/home/booking/MembershipBookingScreen';
import TrainerBookingScreen from '../screens/home/trainer/TrainerBookingScreen';
import ProfileSettingsScreen from '../screens/profile/ProfileSettings';
import WeightBodyMetricsScreen from '../screens/profile/WeightBodyMetricsScreen';
import WeightTrackerScreen from '../screens/profile/WeightTrackerScreen';
import HydrationTrackerScreen from '../screens/activity/diet/HydrationTrackerScreen';
import EditPersonalInfoScreen from '../screens/profile/EditPersonalInfoScreen';
import SupportScreen from '../screens/profile/SupportScreen';
import LoginScreen from '../screens/LoginScreen';
import TrainerDetailScreen from '../screens/home/trainer/TrainerDetailScreen';
import AIDieticianPaywallScreen from '../screens/activity/diet/AIDieticianPaywallScreen';
import AIDieticianSubscriptionScreen from '../screens/activity/diet/AIDieticianSubscriptionScreen';
import AIDietConfigScreen from '../screens/activity/diet/AIDietConfigScreen';
import ManageSubscriptionsScreen from '../screens/profile/ManageSubscriptionsScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import Reminders from '../screens/profile/Reminders';
import AppsAndDevicesScreen from '../screens/profile/AppsAndDevicesScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import LikesListScreen from '../screens/community/LikesListScreen';
import PostDetailsScreen from '../screens/community/PostDetailsScreen';
import ComparisonScreen from '../screens/profile/ComparisonScreen';
import NotificationScreen from '../screens/community/NotificationScreen';

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
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <FullScreenLoader />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <NavigationContainer
        ref={navigationRef}
        theme={DarkTheme}
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
                <Stack.Screen name="CommentsScreen" component={CommentsScreen} />
                <Stack.Screen name="DietAllLogs" component={DietAllLogs} />
                <Stack.Screen name="DietPreferences" component={DietPreferences} />
                <Stack.Screen name="AlmostDone" component={AlmostDoneScreen} />
                <Stack.Screen name="AlmostDoneFinal" component={AlmostDoneFinalScreen} />
                <Stack.Screen name="AlmostDoneCloche" component={AlmostDoneClocheScreen} />
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
                <Stack.Screen name="Diet" component={Dietplan} />
                <Stack.Screen name="Store" component={StoreComingSoon} />
                <Stack.Screen name="WeeklyDietPlan" component={WeeklyDietPlanScreen} />
                <Stack.Screen name="AIDietConfig" component={AIDietConfigScreen} />
                <Stack.Screen name="HealthKitData" component={HealthKitDataScreen} />
                <Stack.Screen name="WalkDetails" component={WalkDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="SleepDetails" component={SleepDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="MacronutrientDetails" component={MacronutrientDetailsScreen} options={{ headerShown: false }} />
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
                  name="ExerciseDetail"
                  component={ExerciseDetailScreen}
                />
                <Stack.Screen
                  name="CheckoutBrowser"
                  component={CheckoutBrowserScreen}
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
                  name="WeightBodyMetrics"
                  component={WeightBodyMetricsScreen}
                />
                <Stack.Screen
                  name="WeightTracker"
                  component={WeightTrackerScreen}
                />
                <Stack.Screen
                  name="HydrationTracker"
                  component={HydrationTrackerScreen}
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
                <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Comparison" component={ComparisonScreen} options={{ headerShown: false }} />
                <Stack.Screen name="LikesList" component={LikesListScreen} options={{ headerShown: false }} />
                <Stack.Screen name="PostDetails" component={PostDetailsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: false }} />
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
