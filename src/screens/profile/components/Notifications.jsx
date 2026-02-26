// // src/screens/components/Notifications.js

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   FlatList,
//   ActivityIndicator,
//   StatusBar,
//   Alert,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import apiClient from '../../../api/apiClient';
// import { formatLocalTime } from '../../../utils/dateUtils';

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

// const Notifications = ({ onClose }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [notificationsLoading, setNotificationsLoading] = useState(false);

//   const fetchNotifications = async () => {
//     setNotificationsLoading(true);
//     try {
//       // FIXED: Changed from '/api/v1/notifications/me' to '/v1/notifications/me'
//       // because apiClient already adds the '/api' prefix
//       const notificationsResult = await apiClient.get('/v1/notifications/me');
//       if (notificationsResult.data.success) {
//         setNotifications(notificationsResult.data.data);
//       }
//     } catch (err) {
//       console.warn('Notifications fetch failed:', err);
//     } finally {
//       setNotificationsLoading(false);
//     }
//   };

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       // FIXED: Changed from '/api/v1/notifications/' to '/v1/notifications/'
//       await apiClient.patch(`/v1/notifications/${notificationId}/read`);
//       setNotifications(prevNotifications =>
//         prevNotifications.map(notification =>
//           notification.id === notificationId ? { ...notification, read: true } : notification
//         )
//       );
//     } catch (error) {
//       Alert.alert('Error', 'Failed to mark notification as read');
//     }
//   };

//   const handleDeleteNotification = async (notificationId) => {
//     try {
//       // FIXED: Changed from '/api/v1/notifications/' to '/v1/notifications/'
//       await apiClient.delete(`/v1/notifications/${notificationId}`);
//       setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== notificationId));
//     } catch (error) {
//       Alert.alert('Error', 'Failed to delete notification');
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.iconButton} onPress={onClose}>
//           <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Notifications</Text>
//         <View style={styles.placeholder} />
//       </View>
      
//       {/* Content */}
//       <View style={styles.content}>
//         {notificationsLoading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={theme.colors.primary} />
//           </View>
//         ) : notifications.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Icon name="notifications-none" size={48} color={theme.colors.textSecondary} />
//             <Text style={styles.emptyText}>No notifications</Text>
//             <Text style={styles.emptySubtext}>You're all caught up!</Text>
//           </View>
//         ) : (
//           <FlatList
//             data={notifications}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <View style={[styles.notificationCard, !item.read && styles.unreadNotification]}>
//                 {!item.read && <View style={styles.unreadIndicator} />}
//                 <View style={styles.notificationContent}>
//                   <Text style={styles.notificationTitle}>{item.title}</Text>
//                   <Text style={styles.notificationMessage}>{item.message}</Text>
//                   <Text style={styles.notificationTime}>
//                     {formatLocalTime(item.createdAt, "Notification Time")}
//                   </Text>
//                 </View>
//                 <View style={styles.notificationActions}>
//                   {!item.read && (
//                     <TouchableOpacity 
//                       style={styles.actionButton} 
//                       onPress={() => handleMarkAsRead(item.id)}
//                     >
//                       <Icon name="check" size={20} color={theme.colors.primary} />
//                     </TouchableOpacity>
//                   )}
//                   <TouchableOpacity 
//                     style={styles.actionButton} 
//                     onPress={() => handleDeleteNotification(item.id)}
//                   >
//                     <Icon name="delete" size={20} color={theme.colors.error} />
//                   </TouchableOpacity>
//                 </View>
//               </View>
//             )}
//             showsVerticalScrollIndicator={false}
//           />
//         )}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: theme.colors.background,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: theme.colors.background,
//     paddingHorizontal: theme.spacing.m,
//     paddingVertical: theme.spacing.m,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255, 255, 255, 0.1)',
//   },
//   iconButton: {
//     padding: theme.spacing.s / 2,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: theme.colors.textPrimary,
//     flex: 1,
//     textAlign: 'center',
//     fontFamily: theme.fontFamily.bold,
//   },
//   placeholder: {
//     width: 34, // To balance the back button
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: theme.spacing.m,
//     paddingTop: theme.spacing.m,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: theme.spacing.xl,
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
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
//   notificationCard: {
//     flexDirection: 'row',
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.m,
//     alignItems: 'flex-start', // Align items to the top
//     marginBottom: theme.spacing.m,
//     ...theme.shadow,
//   },
//   unreadNotification: {
//     // A subtle style change for unread notifications if needed
//     // e.g., borderLeftWidth: 4, borderLeftColor: theme.colors.primary
//   },
//   unreadIndicator: {
//     width: 4,
//     height: '100%',
//     backgroundColor: theme.colors.primary,
//     position: 'absolute',
//     left: 0,
//     top: 0,
//     borderBottomLeftRadius: theme.borderRadius.md,
//     borderTopLeftRadius: theme.borderRadius.md,
//   },
//   notificationContent: {
//     flex: 1,
//     marginLeft: theme.spacing.s, // Add some space for the indicator
//   },
//   notificationTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: theme.spacing.s / 2,
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.bold,
//   },
//   notificationMessage: {
//     fontSize: 14,
//     marginBottom: theme.spacing.s / 2,
//     color: theme.colors.textSecondaryOnSurface,
//     fontFamily: theme.fontFamily.regular,
//   },
//   notificationTime: {
//     fontSize: 12,
//     color: theme.colors.textSecondaryOnSurface,
//     fontFamily: theme.fontFamily.regular,
//   },
//   notificationActions: {
//     justifyContent: 'space-between',
//     marginLeft: theme.spacing.m,
//   },
//   actionButton: {
//     padding: theme.spacing.s / 2,
//     marginLeft: theme.spacing.s,
//   },
// });

// export default Notifications;


// src/screens/components/Notifications.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../../api/apiClient';
import { formatLocalTime } from '../../../utils/dateUtils';
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

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const notificationsResult = await apiClient.get('/v1/notifications/me');
      if (notificationsResult.data.success) {
        setNotifications(notificationsResult.data.data);
      }
    } catch (err) {
      console.warn('Notifications fetch failed:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/v1/notifications/${notificationId}/read`);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      Alert.alert(Strings.Notifications.alerts.error, Strings.Notifications.alerts.markReadFailed);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/v1/notifications/${notificationId}`);
      setNotifications(prevNotifications => prevNotifications.filter(n => n.id !== notificationId));
    } catch (error) {
      Alert.alert(Strings.Notifications.alerts.error, Strings.Notifications.alerts.deleteFailed);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onClose}>
          <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{Strings.Notifications.header}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        {notificationsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="notifications-none" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>{Strings.Notifications.empty.title}</Text>
            <Text style={styles.emptySubtext}>{Strings.Notifications.empty.subtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.notificationCard, !item.read && styles.unreadNotification]}>
                {!item.read && <View style={styles.unreadIndicator} />}
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationMessage}>{item.message}</Text>
                  <Text style={styles.notificationTime}>
                    {formatLocalTime(item.createdAt, "Notification Time")}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!item.read && (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => handleMarkAsRead(item.id)}
                    >
                      <Icon name="check" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleDeleteNotification(item.id)}
                  >
                    <Icon name="delete" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  iconButton: { padding: theme.spacing.s / 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, flex: 1, textAlign: 'center', fontFamily: theme.fontFamily.bold },
  placeholder: { width: 34 },
  content: { flex: 1, paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, ...theme.shadow },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: theme.spacing.m, color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  emptySubtext: { fontSize: 14, textAlign: 'center', color: theme.colors.textSecondaryOnSurface, marginTop: theme.spacing.s },
  notificationCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, alignItems: 'flex-start', marginBottom: theme.spacing.m, ...theme.shadow },
  unreadNotification: {},
  unreadIndicator: { width: 4, height: '100%', backgroundColor: theme.colors.primary, position: 'absolute', left: 0, top: 0, borderBottomLeftRadius: theme.borderRadius.md, borderTopLeftRadius: theme.borderRadius.md },
  notificationContent: { flex: 1, marginLeft: theme.spacing.s },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: theme.spacing.s / 2, color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  notificationMessage: { fontSize: 14, marginBottom: theme.spacing.s / 2, color: theme.colors.textSecondaryOnSurface, fontFamily: theme.fontFamily.regular },
  notificationTime: { fontSize: 12, color: theme.colors.textSecondaryOnSurface, fontFamily: theme.fontFamily.regular },
  notificationActions: { justifyContent: 'space-between', marginLeft: theme.spacing.m },
  actionButton: { padding: theme.spacing.s / 2, marginLeft: theme.spacing.s },
});

export default Notifications;