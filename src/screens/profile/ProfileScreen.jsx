// // src/screens/Profile.js

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   Modal,
//   ActivityIndicator,
//   Alert,
//   Image,
// } from 'react-native';
// import { useFocusEffect } from '@react-navigation/native';
// import { useNavigation } from '@react-navigation/native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useAuth } from '../../context/AuthContext';
// import apiClient from '../../api/apiClient';
// import { useDispatch } from 'react-redux';
// import { getUserProfile as getUserProfileAction, createPortalSession } from '../../redux/actions/subscriptionActions';
// import { Linking } from 'react-native';

// import UserProfile from './components/UserProfile';
// import GymsTab from './components/GymsTab';
// import TrainersTab from './components/TrainersTab';
// import MultiGymTab from './components/MultiGymTab';
// import Notifications from './components/Notifications';

// // --- THEME ---
// const theme = {
//   colors: {
//     background: '#121212', // background-dark
//     primary: '#452829',   // primary
//     surface: '#FFFFFF',   // For cards
//     textPrimary: '#FFFFFF',
//     textSecondary: 'rgba(255, 255, 255, 0.7)',
//     textOnSurface: '#000000',
//     textSecondaryOnSurface: 'rgba(0, 0, 0, 0.6)',
//     borderColorOnSurface: 'rgba(0, 0, 0, 0.1)',
//     error: '#ff5252',
//     logout: '#D32F2F', // Added red color for logout
//   },
//   spacing: {
//     xs: 4,
//     s: 8,
//     m: 16,
//     l: 24,
//     xl: 32,
//   },
//   borderRadius: {
//     sm: 8,
//     md: 16, // 1rem
//     lg: 32, // 2rem
//     full: 9999,
//   },
//   fontFamily: {
//     regular: 'System', // Change to 'Lexend-Regular' after setup
//     bold: 'System', // Change to 'Lexend-Bold' after setup
//   }
// };

// const Profile = () => {
//   const dispatch = useDispatch();
//   const navigation = useNavigation();
//   const [activeTab, setActiveTab] = useState('profile');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isBillingLoading, setIsBillingLoading] = useState(false);
//   const [userProfile, setUserProfile] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const [notificationsCount, setNotificationsCount] = useState(0);
//   const { logout } = useAuth();

//   const tabs = [
//     { id: 'profile', title: 'Profile' },
//     { id: 'gyms', title: 'My Gyms' },
//     { id: 'trainers', title: 'Trainers' },
//     { id: 'multi-gym', title: 'Multi-Gym' },
//   ];

//   // Handle logout with confirmation
//   const handleLogout = () => {
//     Alert.alert(
//       "Confirm Logout",
//       "Are you sure you want to log out?",
//       [
//         { text: "Cancel", style: "cancel" },
//         { text: "Log Out", onPress: () => logout(), style: 'destructive' },
//       ]
//     );
//   };

//   const fetchProfileData = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const profileResult = await dispatch(getUserProfileAction());
//       // Handle both old format {success, data} and new format {data}
//       const profileData = profileResult?.data || profileResult;
//       if (profileResult?.success !== false && profileData) {
//         setUserProfile(profileData);
//         console.log('[Profile] Profile data fetched:', profileData);
//         console.log('[Profile] User name:', profileData.name || profileData.fullName || profileData.firstName);
//       } else {
//         throw new Error('Failed to load profile.');
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || 'An unexpected error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchNotificationsCount = async () => {
//     try {
//       // FIXED: Changed from '/api/v1/notifications/me' to '/v1/notifications/me'
//       // because apiClient already adds the '/api' prefix
//       const notificationsResult = await apiClient.get('/v1/notifications/me');
//       if (notificationsResult.data.success) {
//         const unreadCount = notificationsResult.data.data.filter(n => !n.read).length;
//         setNotificationsCount(unreadCount);
//       }
//     } catch (err) {
//       console.warn('Notifications count fetch failed:', err);
//     }
//   };

//   const handleManageBilling = async () => {
//     setIsBillingLoading(true);
//     try {
//       const response = await dispatch(createPortalSession());
//       if (response.success && response.data.portalUrl) {
//         await Linking.openURL(response.data.portalUrl);
//         setRefreshKey(prev => prev + 1);
//       } else {
//         Alert.alert("No Subscription Found", response.message || "You do not have any active subscriptions to manage.");
//       }
//     } catch (error) {
//       console.error("Failed to open billing portal:", error);
//       Alert.alert("Error", error.response?.data?.message || "An error occurred. Please try again later.");
//     } finally {
//       setIsBillingLoading(false);
//     }
//   };

//   useFocusEffect(React.useCallback(() => {
//     fetchProfileData();
//     fetchNotificationsCount();
//     return () => {};
//   }, [refreshKey]));

//   useEffect(() => {
//     fetchNotificationsCount();
//   }, [refreshKey]);

//   if (loading) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <ActivityIndicator size="large" color={theme.colors.primary} />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={[styles.container, styles.centered]}>
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity onPress={fetchProfileData} style={styles.retryButton}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   // Function to get the user's name from the profile data
//   const getUserName = () => {
//     if (!userProfile) return 'Loading...';
    
//     // Try different possible name fields
//     if (userProfile.name) return userProfile.name;
//     if (userProfile.fullName) return userProfile.fullName;
//     if (userProfile.firstName && userProfile.lastName) {
//       return `${userProfile.firstName} ${userProfile.lastName}`;
//     }
//     if (userProfile.firstName) return userProfile.firstName;
    
//     // If no name is found, return a generic message
//     return 'User';
//   };

//   const renderTabContent = () => {
//     switch (activeTab) {
//       case 'profile':
//         return (
//           <UserProfile
//             userProfile={userProfile}
//             onManageBilling={handleManageBilling}
//             isBillingLoading={isBillingLoading}
//             onLogout={logout}
//           />
//         );
//       case 'gyms':
//         return <GymsTab userProfile={userProfile} refreshKey={refreshKey} />;
//       case 'trainers':
//         return <TrainersTab userProfile={userProfile} refreshKey={refreshKey} />;
//       case 'multi-gym':
//         return (
//           <MultiGymTab
//             userProfile={userProfile}
//             refreshKey={refreshKey}
//             onManageBilling={handleManageBilling}
//             isBillingLoading={isBillingLoading}
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Top App Bar */}
//       <View style={styles.topBar}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
//           <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
//         </TouchableOpacity>
        
//         <View style={styles.rightIconsContainer}>
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={() => setShowNotifications(true)}
//           >
//             <Icon name="notifications" size={24} color={theme.colors.textPrimary} />
//             {notificationsCount > 0 && (
//               <View style={styles.notificationBadge}>
//                 <Text style={styles.notificationBadgeText}>{notificationsCount > 99 ? '99+' : notificationsCount}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
          
//           {/* Added logout button */}
//           <TouchableOpacity
//             style={styles.iconButton}
//             onPress={handleLogout}
//           >
//             <Icon name="logout" size={24} color={theme.colors.logout} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Profile Header */}
//       <View style={styles.profileHeader}>
//         <View style={styles.avatarContainer}>
//           <Image
//             source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFpxbSCdmk5Xai65sxLNXQ7Zy0B4eq74-9_pwRc0apZvki2epTjPI65_EBxbqPeL1z2wBZxmIJNO_ZBgi_Z5Js3m-ikwVpC5Sbqchpr5-gg3rpnGy0gUkR3N8CxnbdHbJhWbfMAU" }}
//             style={styles.avatar}
//           />
//           <View style={styles.onlineIndicator} />
//         </View>
//         {/* Updated to use the getUserName function instead of the hardcoded fallback */}
//         <Text style={styles.userName}>{getUserName()}</Text>
//       </View>

//       {/* Tab Selector (Pills) */}
//       <View style={styles.tabSelectorContainer}>
//         {tabs.map((tab) => (
//           <TouchableOpacity
//             key={tab.id}
//             style={[
//               styles.tabPill,
//               activeTab === tab.id && styles.activeTabPill
//             ]}
//             onPress={() => setActiveTab(tab.id)}
//           >
//             <Text style={[
//               styles.tabPillText,
//               activeTab === tab.id && styles.activeTabPillText
//             ]}>
//               {tab.title}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Tab Content */}
//       <View style={styles.content}>
//         {renderTabContent()}
//       </View>

//       {/* Notifications Modal */}
//       <Modal
//         visible={showNotifications}
//         animationType="slide"
//         onRequestClose={() => setShowNotifications(false)}
//       >
//         <Notifications
//           onClose={() => {
//             setShowNotifications(false);
//             fetchNotificationsCount();
//           }}
//         />
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   centered: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.l,
//   },
//   errorText: {
//     color: theme.colors.error,
//     marginBottom: theme.spacing.m,
//     fontSize: 16,
//     textAlign: 'center',
//     fontFamily: theme.fontFamily.regular,
//   },
//   retryButton: {
//     backgroundColor: theme.colors.primary,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: theme.borderRadius.full,
//     alignItems: 'center',
//   },
//   retryButtonText: {
//     color: theme.colors.textPrimary,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
//   // --- Top Bar ---
//   topBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: theme.spacing.m,
//     paddingTop: theme.spacing.m,
//     paddingBottom: theme.spacing.s,
//   },
//   rightIconsContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   iconButton: {
//     padding: theme.spacing.s,
//     position: 'relative', // Needed for badge positioning
//     marginLeft: theme.spacing.s, // Added spacing between icons
//   },
//   notificationBadge: {
//     position: 'absolute',
//     right: 6,
//     top: 6,
//     backgroundColor: theme.colors.error,
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 4,
//     borderWidth: 1.5,
//     borderColor: theme.colors.background,
//   },
//   notificationBadgeText: {
//     color: theme.colors.textPrimary,
//     fontSize: 11,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
//   // --- Profile Header ---
//   profileHeader: {
//     alignItems: 'center',
//     paddingVertical: theme.spacing.l,
//   },
//   avatarContainer: {
//     position: 'relative',
//   },
//   avatar: {
//     width: 128,
//     height: 128,
//     borderRadius: 64,
//     borderColor: theme.colors.background,
//     borderWidth: 2,
//   },
//   onlineIndicator: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     height: 20,
//     width: 20,
//     borderRadius: 10,
//     backgroundColor: theme.colors.primary,
//     borderColor: theme.colors.background,
//     borderWidth: 2,
//   },
//   userName: {
//     color: theme.colors.textPrimary,
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginTop: theme.spacing.m,
//     fontFamily: theme.fontFamily.bold,
//   },
//   // --- Tab Selector ---
//   tabSelectorContainer: {
//     flexDirection: 'row',
//     backgroundColor: 'rgba(255, 255, 255, 0.1)',
//     marginHorizontal: theme.spacing.m,
//     padding: 4,
//     borderRadius: theme.borderRadius.full,
//   },
//   tabPill: {
//     flex: 1,
//     paddingVertical: theme.spacing.s,
//     borderRadius: theme.borderRadius.full,
//     alignItems: 'center',
//   },
//   activeTabPill: {
//     backgroundColor: theme.colors.primary,
//   },
//   tabPillText: {
//     color: theme.colors.textSecondary,
//     fontSize: 14,
//     fontWeight: '500',
//     fontFamily: theme.fontFamily.regular,
//   },
//   activeTabPillText: {
//     color: theme.colors.textPrimary,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
//   // --- Content Area ---
//   content: {
//     flex: 1,
//     marginTop: theme.spacing.m,
//   },
// });

// export default Profile;

// src/screens/Profile.js

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import { useDispatch } from 'react-redux';
import { getUserProfile as getUserProfileAction, createPortalSession } from '../../redux/actions/subscriptionActions';
import { Linking } from 'react-native';
import { Strings } from '../../config/config'; // Import Config

import UserProfile from './components/UserProfile';
import ProvidersTab from './components/ProvidersTab';
import TrainersTab from './components/TrainersTab';
import MultiProviderTab from './components/MultiProviderTab';
import Notifications from './components/Notifications';

// --- THEME ---
const theme = {
  colors: {
    background: '#121212', // background-dark
    primary: '#452829',   // primary
    surface: '#FFFFFF',   // For cards
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textOnSurface: '#000000',
    textSecondaryOnSurface: 'rgba(0, 0, 0, 0.6)',
    borderColorOnSurface: 'rgba(0, 0, 0, 0.1)',
    error: '#ff5252',
    logout: '#D32F2F',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 16, // 1rem
    lg: 32, // 2rem
    full: 9999,
  },
  fontFamily: {
    regular: 'System', // Change to 'Lexend-Regular' after setup
    bold: 'System', // Change to 'Lexend-Bold' after setup
  }
};

const Profile = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const { logout } = useAuth();

  const tabs = Strings.Profile.tabs;

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      Strings.Profile.actions.logout.confirmTitle,
      Strings.Profile.actions.logout.confirmMessage,
      [
        { text: Strings.Profile.actions.logout.cancel, style: "cancel" },
        { text: Strings.Profile.actions.logout.confirm, onPress: () => logout(), style: 'destructive' },
      ]
    );
  };

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileResult = await dispatch(getUserProfileAction());
      // Handle both old format {success, data} and new format {data}
      const profileData = profileResult?.data || profileResult;
      if (profileResult?.success !== false && profileData) {
        setUserProfile(profileData);
        console.log('[Profile] Profile data fetched:', profileData);
        console.log('[Profile] User name:', profileData.name || profileData.fullName || profileData.firstName);
      } else {
        throw new Error(Strings.Profile.states.errors.loadFailed);
      }
    } catch (err) {
      setError(err.response?.data?.message || Strings.Profile.states.errors.unexpected);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsCount = async () => {
    try {
      // FIXED: Changed from '/api/v1/notifications/me' to '/v1/notifications/me'
      // because apiClient already adds the '/api' prefix
      const notificationsResult = await apiClient.get('/v1/notifications/me');
      if (notificationsResult.data.success) {
        const unreadCount = notificationsResult.data.data.filter(n => !n.read).length;
        setNotificationsCount(unreadCount);
      }
    } catch (err) {
      console.warn('Notifications count fetch failed:', err);
    }
  };

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    try {
      const response = await dispatch(createPortalSession());
      if (response.success && response.data.portalUrl) {
        await Linking.openURL(response.data.portalUrl);
        setRefreshKey(prev => prev + 1);
      } else {
        Alert.alert(
          Strings.Profile.actions.billing.noSubscriptionTitle, 
          response.message || Strings.Profile.actions.billing.noSubscriptionMessage
        );
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      Alert.alert(
        Strings.Profile.actions.billing.errorTitle, 
        error.response?.data?.message || Strings.Profile.actions.billing.errorMessage
      );
    } finally {
      setIsBillingLoading(false);
    }
  };

  useFocusEffect(React.useCallback(() => {
    fetchProfileData();
    fetchNotificationsCount();
    return () => {};
  }, [refreshKey]));

  useEffect(() => {
    fetchNotificationsCount();
  }, [refreshKey]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProfileData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>{Strings.Profile.states.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Function to get the user's name from the profile data
  const getUserName = () => {
    if (!userProfile) return Strings.Profile.states.loading;
    
    // Try different possible name fields
    if (userProfile.name) return userProfile.name;
    if (userProfile.fullName) return userProfile.fullName;
    if (userProfile.firstName && userProfile.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (userProfile.firstName) return userProfile.firstName;
    
    // If no name is found, return a generic message
    return Strings.Profile.states.fallbackName;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <UserProfile
            userProfile={userProfile}
            onManageBilling={handleManageBilling}
            isBillingLoading={isBillingLoading}
            onLogout={logout}
          />
        );
      case 'providers':
        return <ProvidersTab userProfile={userProfile} refreshKey={refreshKey} />;
      case 'trainers':
        return <TrainersTab userProfile={userProfile} refreshKey={refreshKey} />;
      case 'multi-provider':
        return (
          <MultiProviderTab
            userProfile={userProfile}
            refreshKey={refreshKey}
            onManageBilling={handleManageBilling}
            isBillingLoading={isBillingLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.rightIconsContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowNotifications(true)}
          >
            <Icon name="notifications" size={24} color={theme.colors.textPrimary} />
            {notificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationsCount > 99 ? Strings.Profile.notifications.overflowLabel : notificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Added logout button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLogout}
          >
            <Icon name="logout" size={24} color={theme.colors.logout} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAFpxbSCdmk5Xai65sxLNXQ7Zy0B4eq74-9_pwRc0apZvki2epTjPI65_EBxbqPeL1z2wBZxmIJNO_ZBgi_Z5Js3m-ikwVpC5Sbqchpr5-gg3rpnGy0gUkR3N8CxnbdHbJhWbfMAU" }}
            style={styles.avatar}
          />
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.userName}>{getUserName()}</Text>
      </View>

      {/* Tab Selector (Pills) */}
      <View style={styles.tabSelectorContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabPill,
              activeTab === tab.id && styles.activeTabPill
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[
              styles.tabPillText,
              activeTab === tab.id && styles.activeTabPillText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Notifications
          onClose={() => {
            setShowNotifications(false);
            fetchNotificationsCount();
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  retryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily.bold,
  },
  // --- Top Bar ---
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.s,
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.s,
    position: 'relative',
    marginLeft: theme.spacing.s,
  },
  notificationBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.background,
  },
  notificationBadgeText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily.bold,
  },
  // --- Profile Header ---
  profileHeader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderColor: theme.colors.background,
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.background,
    borderWidth: 2,
  },
  userName: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: theme.spacing.m,
    fontFamily: theme.fontFamily.bold,
  },
  // --- Tab Selector ---
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.m,
    padding: 4,
    borderRadius: theme.borderRadius.full,
  },
  tabPill: {
    flex: 1,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
  },
  activeTabPill: {
    backgroundColor: theme.colors.primary,
  },
  tabPillText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: theme.fontFamily.regular,
  },
  activeTabPillText: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily.bold,
  },
  // --- Content Area ---
  content: {
    flex: 1,
    marginTop: theme.spacing.m,
  },
});

export default Profile;