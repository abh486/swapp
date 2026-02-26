import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import LocationMain from '../screens/home/location/LocationMain';
import Activity from '../screens/activity/Activity';
import Community from '../screens/community/Community';
import Store from '../screens/store/Store';
import Profile from '../screens/profile/ProfileScreen';

// Configuration constants (kept in the same file)
const TAB_CONFIG = [
  {
    name: 'Home',
    component: LocationMain,
    iconActive: 'home',
    iconInactive: 'home-outline'
  },
  {
    name: 'Activity',
    component: Activity,
    iconActive: 'fitness',
    iconInactive: 'fitness-outline'
  },
  {
    name: 'Community',
    component: Community,
    iconActive: 'people',
    iconInactive: 'people-outline'
  },
  {
    name: 'Store',
    component: Store,
    iconActive: 'bag',
    iconInactive: 'bag-outline'
  },
  {
    name: 'Profile',
    component: Profile,
    iconActive: 'person',
    iconInactive: 'person-outline'
  }
];

// Updated style constants to match your app's design
const COLORS = {
  active: '#442728', // primary color from your HTML design
  inactive: '#57595B', // brand-secondary-text from your HTML design
  background: '#000000', // black background from your HTML design
  border: 'rgba(255,255,255,0.1)', // subtle border
  shadow: '#000'
};

const DIMENSIONS = {
  tabBarHeight: {
    ios: 85,
    android: 70
  },
  padding: {
    bottom: {
      ios: 20,
      android: 10
    },
    top: 5,
    horizontal: 10
  }
};

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  console.log('BottomTabNavigator: Rendering bottom tab navigator');
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        // Find current tab configuration
        const currentTab = TAB_CONFIG.find(tab => tab.name === route.name);
        
        return {
          tabBarIcon: ({ focused, color, size }) => {
            if (!currentTab) return null;
            
            const iconName = focused 
              ? currentTab.iconActive 
              : currentTab.iconInactive;
              
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: DIMENSIONS.padding.bottom[Platform.OS],
            paddingTop: DIMENSIONS.padding.top,
            height: DIMENSIONS.tabBarHeight[Platform.OS],
            paddingHorizontal: DIMENSIONS.padding.horizontal,
            elevation: 8,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        };
      }}
    >
      {TAB_CONFIG.map(tab => (
        <Tab.Screen 
          key={tab.name}
          name={tab.name} 
          component={tab.component}
          options={{
            title: tab.name,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;