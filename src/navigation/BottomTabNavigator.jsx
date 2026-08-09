import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Platform, StyleSheet, TouchableOpacity, View, Modal, TouchableWithoutFeedback, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useResponsiveMetrics } from '../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// Import screens
import HomeDashboard from '../screens/home/dashboard/HomeDashboard';
import Activity from '../screens/activity/diet/Dietplan';
import Community from '../screens/community/Community';
import ProfileDashboard from '../screens/profile/ProfileDashboard';
import StoreComingSoon from '../screens/store/StoreComingSoon';
import WorkoutsScreen from '../screens/workout/WorkoutsScreen';
import { getAccessStatus } from '../services/aiDieticianService';

const { width: screenWidth } = Dimensions.get('window');

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
    name: 'Workout',
    component: WorkoutsScreen,
    iconActive: 'barbell',
    iconInactive: 'barbell-outline',
  },
  {
    name: 'Feed',
    component: Community,
    iconActive: 'newspaper',
    iconInactive: 'newspaper-outline',
  },
  {
    name: 'Store',
    component: StoreComingSoon,
    iconActive: 'cart',
    iconInactive: 'cart-outline',
  },
];

// ─── Colors & Dimensions ─────────────────────────────────────────────────────

const COLORS = {
  active: '#FFFFFF',
  inactive: 'rgba(255, 255, 255, 0.4)',
  background: 'transparent',
  border: 'transparent',
  shadow: '#000',
  addButtonStart: '#EE822A',
  addButtonEnd: '#2E4D9F',
};

const DIMENSIONS = {
  tabBarHeight: { ios: 58, android: 58 },
  padding: {
    bottom: { ios: 2, android: 8 },
    top: 4,
    horizontal: 10,
  },
};

// ─── SVG Curved Background ───────────────────────────────────────────────────

const TabBarBackground = ({ height }) => {
  const [width, setWidth] = useState(0);
  const pathD = `M 0,0 L ${width},0 L ${width},${height} L 0,${height} Z`;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && w !== width) {
          setWidth(w);
        }
      }}
    >
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="tabGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1A1A1E" stopOpacity={0.98} />
              <Stop offset="100%" stopColor="#08080A" stopOpacity={1} />
            </SvgLinearGradient>
          </Defs>
          <Path
            d={pathD}
            fill="url(#tabGrad)"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={1.5}
          />
        </Svg>
      )}
    </View>
  );
};

// ─── Animated Overlay Menu Modal ─────────────────────────────────────────────

const AddMenuModal = ({ visible, onClose, navigation, bottomInset }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(animValue, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const CX = screenWidth / 2;

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const opacity = animValue;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={StyleSheet.absoluteFill}>
              {/* Left Floating Option (Store / Shopping Cart) */}
              <Animated.View
                style={[
                  styles.floatingOption,
                  {
                    left: CX - 80,
                    bottom: bottomInset + 76,
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.floatingButton}
                  onPress={() => {
                    onClose();
                    navigation.navigate('Workouts');
                  }}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={styles.floatingGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="barbell" size={24} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Right Floating Option (Diet / Apple) */}
              <Animated.View
                style={[
                  styles.floatingOption,
                  {
                    left: CX + 30,
                    bottom: bottomInset + 76,
                    opacity,
                    transform: [{ translateY }, { scale }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.floatingButton}
                  onPress={() => {
                    onClose();
                    navigation.navigate('Community');
                  }}
                >
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={styles.floatingGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon name="people" size={24} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Center Toggle Button (X Close) */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.centerModalButton,
                  {
                    left: CX - 23,
                    bottom: bottomInset + 19,
                  },
                ]}
                onPress={onClose}
              >
                <LinearGradient
                  colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                  style={styles.centerModalGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="close" size={26} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
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
          tabBarIcon: ({ focused, color }) => {
            if (!currentTab) return null;
            const iconName = focused
              ? currentTab.iconActive
              : currentTab.iconInactive;
            return <Icon name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: COLORS.active,
          tabBarInactiveTintColor: COLORS.inactive,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            bottom: 0,
            left: 0,
            right: 0,
            height: tabBarHeight,
            elevation: 0,
          },
          tabBarBackground: () => (
            <TabBarBackground height={tabBarHeight} />
          ),
          tabBarItemStyle: {
            height: metrics.ms(DIMENSIONS.tabBarHeight[Platform.OS]),
            justifyContent: 'center',
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginBottom: 4,
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
          listeners={
            tab.name === 'Diet'
              ? ({ navigation }) => ({
                  tabPress: async (e) => {
                    try {
                      const access = await getAccessStatus();
                      if (!access || !access.hasAccess) {
                        e.preventDefault();
                        navigation.navigate('AIDieticianPaywall', { fromDietTab: true });
                      }
                    } catch (err) {
                      console.warn('[BottomTabNavigator] Diet access check error:', err);
                      e.preventDefault();
                      navigation.navigate('AIDieticianPaywall', { fromDietTab: true });
                    }
                  },
                })
              : undefined
          }
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  addTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -13,
  },
  addButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  floatingOption: {
    position: 'absolute',
    width: 50,
    height: 50,
    zIndex: 10,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  floatingGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 25,
  },
  centerModalButton: {
    position: 'absolute',
    width: 46,
    height: 46,
    zIndex: 11,
  },
  centerModalGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});

export default BottomTabNavigator;
