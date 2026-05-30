import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useResponsiveMetrics } from '../utils/responsive';

// Import screens
import HomeDashboard from '../screens/home/dashboard/HomeDashboard';
import Activity from '../screens/activity/diet/Dietplan';
import Community from '../screens/community/Community';
import ProfileDashboard from '../screens/profile/ProfileDashboard';

// ─── Tab Configuration ───────────────────────────────────────────────────────

const TAB_CONFIG = [
  {
    name: 'Home',
    component: HomeDashboard,
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
  {
    name: 'Diet',
    component: Activity,
    iconActive: 'nutrition',
    iconInactive: 'nutrition-outline',
  },
  {
    name: 'Add',
    component: Community,
    iconActive: 'add-circle',
    iconInactive: 'add-circle-outline',
    isAddButton: true,
  },
  {
    name: 'Community',
    component: Community,
    iconActive: 'chatbubbles',
    iconInactive: 'chatbubbles-outline',
  },
  {
    name: 'Profile',
    component: ProfileDashboard,
    iconActive: 'person-circle',
    iconInactive: 'person-circle-outline',
  },
];

// ─── Colors & Dimensions ─────────────────────────────────────────────────────

const COLORS = {
  active: '#442728',
  inactive: '#57595B',
  background: '#000000',
  border: 'rgba(255,255,255,0.1)',
  shadow: '#000',
  addButton: '#FFFFFF',
  addButtonBackground: '#4A1168',
};

const DIMENSIONS = {
  tabBarHeight: { ios: 58, android: 58 },
  padding: {
    bottom: { ios: 2, android: 8 },
    top: 4,
    horizontal: 10,
  },
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const metrics = useResponsiveMetrics();
  const bottomPadding = DIMENSIONS.padding.bottom[Platform.OS] ?? 2;
  const bottomInset = Math.max(insets.bottom, bottomPadding);
  const tabBarHeight = metrics.ms(DIMENSIONS.tabBarHeight[Platform.OS]) + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const currentTab = TAB_CONFIG.find(tab => tab.name === route.name);

        return {
          tabBarIcon: ({ focused, color, size }) => {
            if (!currentTab) return null;

            if (currentTab.isAddButton) {
              return (
                <View style={styles.addButtonCircle}>
                  <Icon name="add" size={34} color={COLORS.addButton} />
                </View>
              );
            }

            const iconName = focused
              ? currentTab.iconActive
              : currentTab.iconInactive;
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            paddingBottom: bottomInset,
            paddingTop: metrics.sp(DIMENSIONS.padding.top),
            height: tabBarHeight,
            paddingHorizontal: metrics.sp(DIMENSIONS.padding.horizontal),
            elevation: 8,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
          },
          tabBarItemStyle: {
            height: metrics.ms(DIMENSIONS.tabBarHeight[Platform.OS]),
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            display: 'none',
            fontSize: 0,
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
            title: tab.name === 'Add' ? '' : tab.name,
            ...(tab.isAddButton && {
              tabBarButton: props => (
                <TouchableOpacity
                  {...props}
                  activeOpacity={0.85}
                  style={[props.style, styles.addTabButton]}
                  onPress={() => navigation.navigate('Workouts')}
                />
              ),
            }),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  addTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  addButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.addButtonBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default BottomTabNavigator;
