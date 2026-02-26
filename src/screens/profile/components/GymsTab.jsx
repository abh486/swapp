// // src/screens/components/GymsTab.js

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   FlatList,
//   ActivityIndicator,
//   Alert,
//   Platform,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import apiClient from '../../../api/apiClient';
// import { useDispatch } from 'react-redux';
// import { getUserCheckIns, checkInToGym, checkOutFromGym } from '../../../redux/actions/subscriptionActions';
// import { formatLocalTime } from '../../../utils/dateUtils';
// import { useNavigation } from '@react-navigation/native';

// // --- THEME ---
// // Using the same theme object from the parent Profile component for consistency.
// const theme = {
//   colors: {
//     background: '#121212',
//     primary: '#452829',
//     surface: '#FFFFFF',
//     textPrimary: '#FFFFFF',
//     textSecondary: 'rgba(255, 255, 255, 0.7)',
//     textOnSurface: '#000000',
//     textSecondaryOnSurface: 'rgba(0, 0, 0, 0.6)',
//     borderColorOnSurface: 'rgba(0, 0, 0, 0.1)',
//     success: '#4caf50',
//     error: '#ff5252',
//   },
//   spacing: {
//     s: 8,
//     m: 16,
//     l: 24,
//   },
//   borderRadius: {
//     sm: 8,
//     md: 16, // 1rem
//     full: 9999,
//   },
//   fontFamily: {
//     regular: 'System', // Change to 'Lexend-Regular' after setup
//     bold: 'System', // Change to 'Lexend-Bold' after setup
//   },
//   shadow: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//   }
// };

// const GymsTab = ({ userProfile, refreshKey }) => {
//   const dispatch = useDispatch();
//   const [subscribedGyms, setSubscribedGyms] = useState([]);
//   const [gymsLoading, setGymsLoading] = useState(false);
//   const [checkIns, setCheckIns] = useState([]);
//   const [checkInsLoading, setCheckInsLoading] = useState(false);
//   const { navigate } = useNavigation();

//   const fetchSubscribedGyms = async () => {
//     setGymsLoading(true);
//     try {
//       if (!userProfile?.subscriptions || userProfile.subscriptions.length === 0) {
//         setSubscribedGyms([]);
//         return;
//       }
//       const gymPlanIds = userProfile.subscriptions.filter(sub => sub.gymPlanId).map(sub => sub.gymPlanId);
//       if (gymPlanIds.length === 0) {
//         setSubscribedGyms([]);
//         return;
//       }
//       const gymsResponse = await apiClient.post('/gyms/by-plan-ids', { planIds: gymPlanIds });
//       if (gymsResponse.data.success) {
//         setSubscribedGyms(gymsResponse.data.data);
//       } else {
//         throw new Error(gymsResponse.data.message || 'Failed to load gyms.');
//       }
//     } catch (err) {
//       console.error('[GymsTab] Failed to fetch subscribed gyms:', err);
//       Alert.alert("Error", err.response?.data?.message || "Failed to load your gyms. Please try again.");
//     } finally {
//       setGymsLoading(false);
//     }
//   };

//   const fetchActiveCheckIns = async () => {
//     setCheckInsLoading(true);
//     try {
//       console.log('[GymsTab] Fetching ALL check-ins...');
//       const response = await subscriptionService.getUserCheckIns();
//       if (response.success) {
//         const processedCheckIns = response.data.map(checkIn => {
//           const processedCheckIn = { ...checkIn };
//           if (checkIn.checkIn && typeof checkIn.checkIn === 'string') {
//             processedCheckIn.checkIn = new Date(checkIn.checkIn);
//           }
//           if (checkIn.checkOut && typeof checkIn.checkOut === 'string') {
//             processedCheckIn.checkOut = new Date(checkIn.checkOut);
//           }
//           return processedCheckIn;
//         });
//         setCheckIns(processedCheckIns);
//         console.log('[GymsTab] Fetched check-ins successfully:', processedCheckIns);
//       }
//     } catch (err) {
//       console.warn('[GymsTab] Failed to fetch check-ins:', err);
//     } finally {
//       setCheckInsLoading(false);
//     }
//   };

//   const handleViewGymDetails = (gym) => {
//     navigate('GymDetails', { gymId: gym.id });
//   };

//   const handleCheckInToGym = async (gym) => {
//     try {
//       console.log(`[GymsTab] Attempting to check in to gym: ${gym.name} (ID: ${gym.id})`);
//       const response = await dispatch(checkInToGym(gym.id));
//       if (response.success) {
//         Alert.alert("Check-in Successful!", `Welcome to ${gym.name}.`);
//         fetchActiveCheckIns();
//       } else {
//         throw new Error(response.message);
//       }
//     } catch (error) {
//       console.error('[GymsTab] Check-in failed:', error);
//       Alert.alert("Check-in Failed", error.response?.data?.message || "An unknown error occurred.");
//     }
//   };

//   const handleCheckOutFromGym = async (checkInId) => {
//     try {
//       const response = await dispatch(checkOutFromGym(checkInId));
//       if (response.success) {
//         Alert.alert("Check-out Successful!", "You have successfully checked out.");
//         fetchActiveCheckIns();
//       } else {
//         throw new Error(response.message);
//       }
//     } catch (error) {
//       console.error('[GymsTab] Check-out failed:', error);
//       Alert.alert("Check-out Failed", error.response?.data?.message || "An unknown error occurred.");
//     }
//   };

//   const isCheckedInToGym = (gymId) => {
//     return checkIns.some(checkIn => checkIn.gymId === gymId && !checkIn.checkOut);
//   };

//   const getCheckInForGym = (gymId) => {
//     return checkIns.find(checkIn => checkIn.gymId === gymId && !checkIn.checkOut);
//   };

//   useEffect(() => {
//     if (userProfile) {
//       fetchSubscribedGyms();
//       fetchActiveCheckIns();
//     }
//   }, [userProfile, refreshKey]);

//   const safeUserProfile = userProfile || {};

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       {/* My Gyms Section */}
//       <View style={styles.sectionContainer}>
//         <Text style={styles.sectionTitle}>My Gyms</Text>
//         {gymsLoading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={theme.colors.primary} />
//           </View>
//         ) : subscribedGyms.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Icon name="business" size={48} color={theme.colors.textSecondary} />
//             <Text style={styles.emptyText}>No gyms subscribed</Text>
//             <Text style={styles.emptySubtext}>
//               When you subscribe to a gym, it will appear here.
//             </Text>
//             {safeUserProfile.role === 'MEMBER' && (
//               <TouchableOpacity style={styles.primaryButton} onPress={() => navigate('Explore')}>
//                 <Text style={styles.primaryButtonText}>Explore Gyms</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         ) : (
//           <FlatList
//             data={subscribedGyms}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => {
//               const isCheckedIn = isCheckedInToGym(item.id);
//               const checkInRecord = getCheckInForGym(item.id);
//               return (
//                 <View style={styles.gymCard}>
//                   <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.gymImage} />
//                   <View style={styles.gymInfo}>
//                     <Text style={styles.gymName}>{item.name}</Text>
//                     <View style={styles.gymLocation}>
//                       <Icon name="location-on" size={14} color={theme.colors.textSecondaryOnSurface} />
//                       <Text style={styles.gymAddress} numberOfLines={1}>
//                         {item.address}
//                       </Text>
//                     </View>
//                     {isCheckedIn && (
//                       <View style={styles.checkInStatus}>
//                         <Icon name="check-circle" size={14} color={theme.colors.success} />
//                         <Text style={styles.checkInStatusText}>
//                           Checked in at {checkInRecord && checkInRecord.checkIn ?
//                             formatLocalTime(checkInRecord.checkIn, "Active CheckIn Time") : 'Unknown time'}
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                   <View style={styles.gymActions}>
//                     <TouchableOpacity style={styles.iconButton} onPress={() => handleViewGymDetails(item)}>
//                       <Icon name="info" size={20} color={theme.colors.textSecondaryOnSurface} />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={[styles.checkInOutButton, { backgroundColor: isCheckedIn ? theme.colors.error : theme.colors.success }]}
//                       onPress={() => isCheckedIn ? handleCheckOutFromGym(checkInRecord.id) : handleCheckInToGym(item)}
//                     >
//                       <Icon name={isCheckedIn ? "logout" : "login"} size={16} color="#ffffff" />
//                       <Text style={styles.checkInOutButtonText}>{isCheckedIn ? "Check Out" : "Check In"}</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               );
//             }}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>

//       {/* All Check-ins Section */}
//       <View style={styles.sectionContainer}>
//         <Text style={styles.sectionTitle}>All Check-ins</Text>
//         {checkInsLoading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={theme.colors.primary} />
//           </View>
//         ) : checkIns.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Icon name="history" size={48} color={theme.colors.textSecondary} />
//             <Text style={styles.emptyText}>No check-in history</Text>
//             <Text style={styles.emptySubtext}>
//               Your check-in history will be displayed here.
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={checkIns}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <View style={styles.checkInHistoryCard}>
//                 <View style={styles.checkInHistoryInfo}>
//                   <Text style={styles.checkInHistoryGymName}>{item.gym.name}</Text>
//                   <Text style={styles.checkInHistoryTime}>
//                     Check-in: {formatLocalTime(item.checkIn, "History CheckIn Time")}
//                   </Text>
//                   {item.checkOut ? (
//                     <Text style={[styles.checkInHistoryTime, { color: theme.colors.success }]}>
//                       Check-out: {formatLocalTime(item.checkOut, "History CheckOut Time")}
//                     </Text>
//                   ) : (
//                     <View style={styles.activeCheckInContainer}>
//                       <Icon name="access-time" size={14} color={theme.colors.primary} />
//                       <Text style={[styles.checkInHistoryTime, { color: theme.colors.primary }]}>
//                         Currently checked in
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//                 {!item.checkOut && (
//                   <TouchableOpacity
//                     style={[styles.checkInOutButton, { backgroundColor: theme.colors.error }]}
//                     onPress={() => handleCheckOutFromGym(item.id)}
//                   >
//                     <Icon name="logout" size={16} color="#ffffff" />
//                     <Text style={styles.checkInOutButtonText}>Check Out</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//     paddingHorizontal: theme.spacing.m,
//   },
//   sectionContainer: {
//     marginTop: theme.spacing.l,
//     marginBottom: theme.spacing.l,
//   },
//   sectionTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: theme.colors.textPrimary,
//     marginBottom: theme.spacing.m,
//     fontFamily: theme.fontFamily.bold,
//   },
//   loadingContainer: {
//     padding: theme.spacing.l,
//     alignItems: 'center',
//   },
//   emptyState: {
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.xl,
//     alignItems: 'center',
//     ...theme.shadow,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     marginTop: theme.spacing.m,
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.bold,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     textAlign: 'center',
//     color: theme.colors.textSecondaryOnSurface,
//     marginTop: theme.spacing.s,
//   },
//   primaryButton: {
//     backgroundColor: theme.colors.primary,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: theme.borderRadius.full,
//     marginTop: theme.spacing.l,
//     alignItems: 'center',
//   },
//   primaryButtonText: {
//     color: theme.colors.textPrimary,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
//   gymCard: {
//     flexDirection: 'row',
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.m,
//     marginBottom: theme.spacing.m,
//     alignItems: 'center',
//     ...theme.shadow,
//   },
//   gymImage: {
//     width: 80,
//     height: 80,
//     borderRadius: theme.borderRadius.sm,
//     marginRight: theme.spacing.m,
//   },
//   gymInfo: {
//     flex: 1,
//   },
//   gymName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.bold,
//   },
//   gymLocation: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: theme.spacing.s / 2,
//   },
//   gymAddress: {
//     fontSize: 12,
//     marginLeft: 4,
//     flex: 1,
//     color: theme.colors.textSecondaryOnSurface,
//   },
//   checkInStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: theme.spacing.s,
//   },
//   checkInStatusText: {
//     fontSize: 12,
//     marginLeft: 4,
//     color: theme.colors.success,
//   },
//   gymActions: {
//     alignItems: 'center',
//   },
//   iconButton: {
//     padding: theme.spacing.s,
//   },
//   checkInOutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: theme.spacing.s,
//     paddingVertical: theme.spacing.s / 2,
//     borderRadius: theme.borderRadius.full,
//     marginTop: theme.spacing.s,
//   },
//   checkInOutButtonText: {
//     color: '#ffffff',
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginLeft: 4,
//   },
//   checkInHistoryCard: {
//     flexDirection: 'row',
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.m,
//     marginBottom: theme.spacing.m,
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     ...theme.shadow,
//   },
//   checkInHistoryInfo: {
//     flex: 1,
//   },
//   checkInHistoryGymName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.bold,
//   },
//   checkInHistoryTime: {
//     fontSize: 12,
//     marginTop: theme.spacing.s / 2,
//     color: theme.colors.textSecondaryOnSurface,
//   },
//   activeCheckInContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: theme.spacing.s / 2,
//   },
// });

// export default GymsTab;


// src/screens/components/GymsTab.js

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../../api/apiClient';
import { useDispatch } from 'react-redux';
import { getUserCheckIns, checkInToGym, checkOutFromGym } from '../../../redux/actions/subscriptionActions';
import { formatLocalTime } from '../../../utils/dateUtils';
import { useNavigation } from '@react-navigation/native';
import { Strings } from '../../../config/config'; // Import Config

// --- THEME ---
const theme = {
  colors: {
    background: '#121212',
    primary: '#452829',
    surface: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textOnSurface: '#000000',
    textSecondaryOnSurface: 'rgba(0, 0, 0, 0.6)',
    borderColorOnSurface: 'rgba(0, 0, 0, 0.1)',
    success: '#4caf50',
    error: '#ff5252',
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    full: 9999,
  },
  fontFamily: {
    regular: 'System',
    bold: 'System',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  }
};

const GymsTab = ({ userProfile, refreshKey }) => {
  const dispatch = useDispatch();
  const [subscribedGyms, setSubscribedGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [checkIns, setCheckIns] = useState([]);
  const [checkInsLoading, setCheckInsLoading] = useState(false);
  const { navigate } = useNavigation();

  const fetchSubscribedGyms = async () => {
    setGymsLoading(true);
    try {
      if (!userProfile?.subscriptions || userProfile.subscriptions.length === 0) {
        setSubscribedGyms([]);
        return;
      }
      const gymPlanIds = userProfile.subscriptions.filter(sub => sub.gymPlanId).map(sub => sub.gymPlanId);
      if (gymPlanIds.length === 0) {
        setSubscribedGyms([]);
        return;
      }
      const gymsResponse = await apiClient.post('/gyms/by-plan-ids', { planIds: gymPlanIds });
      if (gymsResponse.data.success) {
        setSubscribedGyms(gymsResponse.data.data);
      } else {
        throw new Error(gymsResponse.data.message || Strings.GymsTab.alerts.error.loadGyms);
      }
    } catch (err) {
      console.error('[GymsTab] Failed to fetch subscribed gyms:', err);
      Alert.alert(
        Strings.GymsTab.alerts.error.title, 
        err.response?.data?.message || Strings.GymsTab.alerts.error.loadGyms
      );
    } finally {
      setGymsLoading(false);
    }
  };

  const fetchActiveCheckIns = async () => {
    setCheckInsLoading(true);
    try {
      console.log('[GymsTab] Fetching ALL check-ins...');
      // FIXED: Assumed subscriptionService was a typo for the imported action/dispatch
      const response = await dispatch(getUserCheckIns());
      
      // Handling potential different response shapes from Redux actions
      const data = response?.data || response;

      if (response?.success || data) {
        const processedCheckIns = (Array.isArray(data) ? data : []).map(checkIn => {
          const processedCheckIn = { ...checkIn };
          if (checkIn.checkIn && typeof checkIn.checkIn === 'string') {
            processedCheckIn.checkIn = new Date(checkIn.checkIn);
          }
          if (checkIn.checkOut && typeof checkIn.checkOut === 'string') {
            processedCheckIn.checkOut = new Date(checkIn.checkOut);
          }
          return processedCheckIn;
        });
        setCheckIns(processedCheckIns);
        console.log('[GymsTab] Fetched check-ins successfully:', processedCheckIns);
      }
    } catch (err) {
      console.warn('[GymsTab] Failed to fetch check-ins:', err);
    } finally {
      setCheckInsLoading(false);
    }
  };

  const handleViewGymDetails = (gym) => {
    navigate('GymDetails', { gymId: gym.id });
  };

  const handleCheckInToGym = async (gym) => {
    try {
      console.log(`[GymsTab] Attempting to check in to gym: ${gym.name} (ID: ${gym.id})`);
      const response = await dispatch(checkInToGym(gym.id));
      if (response.success) {
        Alert.alert(
          Strings.GymsTab.alerts.checkIn.successTitle, 
          Strings.GymsTab.alerts.checkIn.successMessage(gym.name)
        );
        fetchActiveCheckIns();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('[GymsTab] Check-in failed:', error);
      Alert.alert(
        Strings.GymsTab.alerts.error.checkInFailed, 
        error.response?.data?.message || Strings.GymsTab.alerts.error.generic
      );
    }
  };

  const handleCheckOutFromGym = async (checkInId) => {
    try {
      const response = await dispatch(checkOutFromGym(checkInId));
      if (response.success) {
        Alert.alert(
          Strings.GymsTab.alerts.checkOut.successTitle,
          Strings.GymsTab.alerts.checkOut.successMessage
        );
        fetchActiveCheckIns();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('[GymsTab] Check-out failed:', error);
      Alert.alert(
        Strings.GymsTab.alerts.error.checkOutFailed, 
        error.response?.data?.message || Strings.GymsTab.alerts.error.generic
      );
    }
  };

  const isCheckedInToGym = (gymId) => {
    return checkIns.some(checkIn => checkIn.gymId === gymId && !checkIn.checkOut);
  };

  const getCheckInForGym = (gymId) => {
    return checkIns.find(checkIn => checkIn.gymId === gymId && !checkIn.checkOut);
  };

  useEffect(() => {
    if (userProfile) {
      fetchSubscribedGyms();
      fetchActiveCheckIns();
    }
  }, [userProfile, refreshKey]);

  const safeUserProfile = userProfile || {};

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* My Gyms Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{Strings.GymsTab.sections.myGyms}</Text>
        {gymsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : subscribedGyms.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="business" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{Strings.GymsTab.emptyState.myGyms.title}</Text>
            <Text style={styles.emptySubtext}>
              {Strings.GymsTab.emptyState.myGyms.subtitle}
            </Text>
            {safeUserProfile.role === 'MEMBER' && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigate('Explore')}>
                <Text style={styles.primaryButtonText}>{Strings.GymsTab.emptyState.myGyms.action}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={subscribedGyms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isCheckedIn = isCheckedInToGym(item.id);
              const checkInRecord = getCheckInForGym(item.id);
              return (
                <View style={styles.gymCard}>
                  <Image source={{ uri: item.photos?.[0] || 'https://via.placeholder.com/150' }} style={styles.gymImage} />
                  <View style={styles.gymInfo}>
                    <Text style={styles.gymName}>{item.name}</Text>
                    <View style={styles.gymLocation}>
                      <Icon name="location-on" size={14} color={theme.colors.textSecondaryOnSurface} />
                      <Text style={styles.gymAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                    {isCheckedIn && (
                      <View style={styles.checkInStatus}>
                        <Icon name="check-circle" size={14} color={theme.colors.success} />
                        <Text style={styles.checkInStatusText}>
                          {Strings.GymsTab.gymCard.statusPrefix} {checkInRecord && checkInRecord.checkIn ?
                            formatLocalTime(checkInRecord.checkIn, "Active CheckIn Time") : 'Unknown time'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.gymActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleViewGymDetails(item)}>
                      <Icon name="info" size={20} color={theme.colors.textSecondaryOnSurface} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.checkInOutButton, { backgroundColor: isCheckedIn ? theme.colors.error : theme.colors.success }]}
                      onPress={() => isCheckedIn ? handleCheckOutFromGym(checkInRecord.id) : handleCheckInToGym(item)}
                    >
                      <Icon name={isCheckedIn ? "logout" : "login"} size={16} color="#ffffff" />
                      <Text style={styles.checkInOutButtonText}>
                        {isCheckedIn ? Strings.GymsTab.gymCard.actions.checkOut : Strings.GymsTab.gymCard.actions.checkIn}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* All Check-ins Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{Strings.GymsTab.sections.history}</Text>
        {checkInsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : checkIns.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{Strings.GymsTab.emptyState.history.title}</Text>
            <Text style={styles.emptySubtext}>
              {Strings.GymsTab.emptyState.history.subtitle}
            </Text>
          </View>
        ) : (
          <FlatList
            data={checkIns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.checkInHistoryCard}>
                <View style={styles.checkInHistoryInfo}>
                  <Text style={styles.checkInHistoryGymName}>{item.gym.name}</Text>
                  <Text style={styles.checkInHistoryTime}>
                    {Strings.GymsTab.historyCard.labels.checkIn}{formatLocalTime(item.checkIn, "History CheckIn Time")}
                  </Text>
                  {item.checkOut ? (
                    <Text style={[styles.checkInHistoryTime, { color: theme.colors.success }]}>
                      {Strings.GymsTab.historyCard.labels.checkOut}{formatLocalTime(item.checkOut, "History CheckOut Time")}
                    </Text>
                  ) : (
                    <View style={styles.activeCheckInContainer}>
                      <Icon name="access-time" size={14} color={theme.colors.primary} />
                      <Text style={[styles.checkInHistoryTime, { color: theme.colors.primary }]}>
                        {Strings.GymsTab.historyCard.labels.active}
                      </Text>
                    </View>
                  )}
                </View>
                {!item.checkOut && (
                  <TouchableOpacity
                    style={[styles.checkInOutButton, { backgroundColor: theme.colors.error }]}
                    onPress={() => handleCheckOutFromGym(item.id)}
                  >
                    <Icon name="logout" size={16} color="#ffffff" />
                    <Text style={styles.checkInOutButtonText}>{Strings.GymsTab.gymCard.actions.checkOut}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.m,
  },
  sectionContainer: {
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
    fontFamily: theme.fontFamily.bold,
  },
  loadingContainer: {
    padding: theme.spacing.l,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadow,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: theme.spacing.m,
    color: theme.colors.textOnSurface,
    fontFamily: theme.fontFamily.bold,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondaryOnSurface,
    marginTop: theme.spacing.s,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.l,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fontFamily.bold,
  },
  gymCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    alignItems: 'center',
    ...theme.shadow,
  },
  gymImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.m,
  },
  gymInfo: {
    flex: 1,
  },
  gymName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textOnSurface,
    fontFamily: theme.fontFamily.bold,
  },
  gymLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s / 2,
  },
  gymAddress: {
    fontSize: 12,
    marginLeft: 4,
    flex: 1,
    color: theme.colors.textSecondaryOnSurface,
  },
  checkInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  checkInStatusText: {
    fontSize: 12,
    marginLeft: 4,
    color: theme.colors.success,
  },
  gymActions: {
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.s,
  },
  checkInOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s / 2,
    borderRadius: theme.borderRadius.full,
    marginTop: theme.spacing.s,
  },
  checkInOutButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  checkInHistoryCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadow,
  },
  checkInHistoryInfo: {
    flex: 1,
  },
  checkInHistoryGymName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textOnSurface,
    fontFamily: theme.fontFamily.bold,
  },
  checkInHistoryTime: {
    fontSize: 12,
    marginTop: theme.spacing.s / 2,
    color: theme.colors.textSecondaryOnSurface,
  },
  activeCheckInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s / 2,
  },
});

export default GymsTab;