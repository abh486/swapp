import React, { useState, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import {
  Text,
  Platform,
  TouchableOpacity,
  Modal,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeDashboard from '../screens/home/dashboard/HomeDashboard';
import Activity from '../screens/activity/diet/Dietplan';
import Community from '../screens/community/Community';
import Store from '../screens/store/Store';
import Profile from '../screens/profile/ProfileScreen';

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
    name: 'Store',
    component: Store,
    iconActive: 'bag',
    iconInactive: 'bag-outline',
  },
  {
    name: 'Profile',
    component: Profile,
    iconActive: 'person',
    iconInactive: 'person-outline',
  },
];

// ─── Add Button Options ───────────────────────────────────────────────────────

const ADD_OPTIONS = [
  { label: 'WORKOUT', icon: 'barbell-outline', screen: 'Workouts' },
  { label: 'COMMUNITY', icon: 'people-outline', screen: 'Add' },
];

// ─── Colors & Dimensions ─────────────────────────────────────────────────────

const COLORS = {
  active: '#442728',
  inactive: '#57595B',
  background: '#000000',
  border: 'rgba(255,255,255,0.1)',
  shadow: '#000',
  addButton: '#FFFFFF',
  modalOverlay: 'rgba(0,0,0,0.85)',
  circleButton: '#FFFFFF',
  circleIcon: '#000000',
  circleLabel: '#FFFFFF',
};

const DIMENSIONS = {
  tabBarHeight: { ios: 85, android: 70 },
  padding: {
    bottom: { ios: 20, android: 10 },
    top: 5,
    horizontal: 10,
  },
};

// ─── Add Options Modal ────────────────────────────────────────────────────────

const AddModal = ({ visible, onClose, navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  React.useEffect(() => {
    if (visible) {
      // Fade in overlay
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Stagger circle buttons in
      Animated.stagger(
        60,
        scaleAnims.map(anim =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        ...scaleAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          })
        ),
      ]).start();
    }
  }, [visible]);

  const handleOption = (screen) => {
    onClose();
    if (navigation) {
      if (screen === 'Add') {
        navigation.navigate('MainTabs', { screen: 'Add' });
      } else {
        navigation.navigate(screen);
      }
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Tapping backdrop closes modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Options grid */}
        <View style={styles.optionsGrid}>
          {ADD_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.label}
              style={[
                styles.optionWrapper,
                {
                  transform: [{ scale: scaleAnims[index] }],
                  opacity: scaleAnims[index],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.circleButton}
                onPress={() => handleOption(option.screen)}
                activeOpacity={0.8}
              >
                <Icon name={option.icon} size={28} color={COLORS.circleIcon} />
              </TouchableOpacity>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Close (X) button at bottom center */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
          <Icon name="close" size={26} color="#000" />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const currentTab = TAB_CONFIG.find(tab => tab.name === route.name);

          return {
            tabBarIcon: ({ focused, color, size }) => {
              if (!currentTab) return null;

              if (currentTab.isAddButton) {
                return (
                  <Icon
                    name={focused ? currentTab.iconActive : currentTab.iconInactive}
                    size={size + 10}
                    color={COLORS.addButton}
                  />
                );
              }

              const iconName = focused ? currentTab.iconActive : currentTab.iconInactive;
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
              title: tab.name === 'Add' ? '' : tab.name,
              ...(tab.isAddButton && {
                tabBarButton: (props) => (
                  <TouchableOpacity
                    {...props}
                    onPress={() => setModalVisible(true)}
                  />
                ),
              }),
            }}
          />
        ))}
      </Tab.Navigator>

      {/* Custom Add Modal */}
      <AddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
      />
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  optionWrapper: {
    alignItems: 'center',
    width: (width / 2) - 48,
  },
  circleButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.circleButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  optionLabel: {
    color: COLORS.circleLabel,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
});

export default BottomTabNavigator;