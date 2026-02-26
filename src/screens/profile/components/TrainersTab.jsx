// // src/screens/components/TrainersTab.js

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
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import apiClient from '../../../api/apiClient';
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

// const TrainersTab = ({ userProfile, refreshKey }) => {
//   const [subscribedTrainers, setSubscribedTrainers] = useState([]);
//   const [trainersLoading, setTrainersLoading] = useState(false);
//   const navigation = useNavigation();

//   const fetchSubscribedTrainers = async () => {
//     setTrainersLoading(true);
//     try {
//       if (!userProfile?.subscriptions || userProfile.subscriptions.length === 0) {
//         setSubscribedTrainers([]);
//         return;
//       }
      
//       const trainerPlanIds = userProfile.subscriptions.filter(sub => sub.trainerPlanId).map(sub => sub.trainerPlanId);
//       console.log('[TrainersTab] Trainer plan IDs:', trainerPlanIds);
      
//       if (trainerPlanIds.length === 0) {
//         setSubscribedTrainers([]);
//         return;
//       }
      
//       const trainersResponse = await apiClient.post('/trainers/by-plan-ids', { planIds: trainerPlanIds });
//       if (trainersResponse.data.success) {
//         setSubscribedTrainers(trainersResponse.data.data);
//         console.log('[TrainersTab] Subscribed trainers fetched:', trainersResponse.data.data);
//       }
//       else {
//         throw new Error('Failed to load trainers.');
//       }
//     } catch (err) {
//       console.warn('Trainers fetch failed:', err);
//       Alert.alert('Error', 'Failed to load your trainers. Please try again.');
//     } finally {
//       setTrainersLoading(false);
//     }
//   };

//   const handleViewTrainerDetails = (trainer) => {
//     navigation.navigate('TrainerDetails', { trainerId: trainer.id });
//   };

//   const handleChatWithTrainer = async (trainer) => {
//     try {
//       const response = await apiClient.post('/trainers/start-conversation', { trainerId: trainer.id });
//       if (response.data.success) {
//         navigation.navigate('Chat', { conversationId: response.data.conversationId, trainer });
//       } else {
//         Alert.alert('Error', 'Failed to start conversation');
//       }
//     } catch (error) {
//       console.error('Failed to start conversation:', error);
//       Alert.alert('Error', 'Failed to start conversation');
//     }
//   };

//   useEffect(() => {
//     if (userProfile) {
//       fetchSubscribedTrainers();
//     }
//   }, [userProfile, refreshKey]);

//   const safeUserProfile = userProfile || {};

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
//       <View style={styles.sectionContainer}>
//         <Text style={styles.sectionTitle}>My Trainers</Text>
//         {trainersLoading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color={theme.colors.primary} />
//           </View>
//         ) : subscribedTrainers.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Icon name="fitness-center" size={48} color={theme.colors.textSecondary} />
//             <Text style={styles.emptyText}>
//               {safeUserProfile.role === 'TRAINER' ? "You haven't been assigned any clients yet" : "No trainers subscribed"}
//             </Text>
//             <Text style={styles.emptySubtext}>
//               {safeUserProfile.role === 'TRAINER' ? "Clients will appear here when they subscribe to your plans" : "Subscribe to trainers to see them here"}
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={subscribedTrainers}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <View style={styles.trainerCard}>
//                 <Image source={{ uri: item.gallery?.[0] || 'https://via.placeholder.com/150' }} style={styles.trainerAvatar} />
//                 <View style={styles.trainerInfo}>
//                   <Text style={styles.trainerName}>
//                     {item.user?.memberProfile?.name || item.user?.email?.split('@')[0] || 'Trainer'}
//                   </Text>
//                   <Text style={styles.trainerExperience}>
//                     {item.experience || 0} years of experience
//                   </Text>
//                   <Text style={styles.trainerBio} numberOfLines={2}>
//                     {item.bio}
//                   </Text>
//                 </View>
//                 <View style={styles.trainerActions}>
//                   <TouchableOpacity style={styles.actionButton} onPress={() => handleViewTrainerDetails(item)}>
//                     <Icon name="info" size={20} color={theme.colors.textSecondaryOnSurface} />
//                   </TouchableOpacity>
//                   <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleChatWithTrainer(item)}>
//                     <Icon name="chat" size={16} color={theme.colors.textPrimary} />
//                     <Text style={styles.primaryActionButtonText}>Chat</Text>
//                   </TouchableOpacity>
//                 </View>
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
//   trainerCard: {
//     flexDirection: 'row',
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.m,
//     marginBottom: theme.spacing.m,
//     alignItems: 'center',
//     ...theme.shadow,
//   },
//   trainerAvatar: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     marginRight: theme.spacing.m,
//   },
//   trainerInfo: {
//     flex: 1,
//   },
//   trainerName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.bold,
//   },
//   trainerExperience: {
//     fontSize: 14,
//     marginTop: theme.spacing.s / 2,
//     color: theme.colors.textSecondaryOnSurface,
//   },
//   trainerBio: {
//     fontSize: 12,
//     marginTop: theme.spacing.s / 2,
//     color: theme.colors.textSecondaryOnSurface,
//   },
//   trainerActions: {
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     height: '80%', // To vertically space the buttons
//   },
//   actionButton: {
//     padding: theme.spacing.s,
//   },
//   primaryActionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: theme.colors.primary,
//     paddingHorizontal: theme.spacing.s,
//     paddingVertical: theme.spacing.s / 2,
//     borderRadius: theme.borderRadius.full,
//   },
//   primaryActionButtonText: {
//     color: theme.colors.textPrimary,
//     fontSize: 12,
//     fontWeight: 'bold',
//     marginLeft: 4,
//   },
// });

// export default TrainersTab;

// src/screens/components/TrainersTab.js
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../../api/apiClient';
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

const TrainersTab = ({ userProfile, refreshKey }) => {
  const [subscribedTrainers, setSubscribedTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const navigation = useNavigation();

  const fetchSubscribedTrainers = async () => {
    setTrainersLoading(true);
    try {
      if (!userProfile?.subscriptions || userProfile.subscriptions.length === 0) {
        setSubscribedTrainers([]);
        return;
      }
      
      const trainerPlanIds = userProfile.subscriptions.filter(sub => sub.trainerPlanId).map(sub => sub.trainerPlanId);
      console.log('[TrainersTab] Trainer plan IDs:', trainerPlanIds);
      
      if (trainerPlanIds.length === 0) {
        setSubscribedTrainers([]);
        return;
      }
      
      const trainersResponse = await apiClient.post('/trainers/by-plan-ids', { planIds: trainerPlanIds });
      if (trainersResponse.data.success) {
        setSubscribedTrainers(trainersResponse.data.data);
        console.log('[TrainersTab] Subscribed trainers fetched:', trainersResponse.data.data);
      }
      else {
        throw new Error(Strings.TrainersTab.alerts.load);
      }
    } catch (err) {
      console.warn('Trainers fetch failed:', err);
      Alert.alert("Error", Strings.TrainersTab.alerts.load);
    } finally {
      setTrainersLoading(false);
    }
  };

  const handleViewTrainerDetails = (trainer) => {
    navigation.navigate('TrainerDetails', { trainerId: trainer.id });
  };

  const handleChatWithTrainer = async (trainer) => {
    try {
      const response = await apiClient.post('/trainers/start-conversation', { trainerId: trainer.id });
      if (response.data.success) {
        navigation.navigate('Chat', { conversationId: response.data.conversationId, trainer });
      } else {
        Alert.alert('Error', Strings.TrainersTab.alerts.chat);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      Alert.alert('Error', Strings.TrainersTab.alerts.chat);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchSubscribedTrainers();
    }
  }, [userProfile, refreshKey]);

  const safeUserProfile = userProfile || {};
  const isMember = safeUserProfile.role === 'MEMBER';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{Strings.TrainersTab.sections.myTrainers}</Text>
        {trainersLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : subscribedTrainers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="fitness-center" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>
              {isMember ? Strings.TrainersTab.empty.member.title : Strings.TrainersTab.empty.trainer.title}
            </Text>
            <Text style={styles.emptySubtext}>
              {isMember ? Strings.TrainersTab.empty.member.subtitle : Strings.TrainersTab.empty.trainer.subtitle}
            </Text>
          </View>
        ) : (
          <FlatList
            data={subscribedTrainers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.trainerCard}>
                <Image source={{ uri: item.gallery?.[0] || 'https://via.placeholder.com/150' }} style={styles.trainerAvatar} />
                <View style={styles.trainerInfo}>
                  <Text style={styles.trainerName}>
                    {item.user?.memberProfile?.name || item.user?.email?.split('@')[0] || Strings.TrainersTab.card.fallbackName}
                  </Text>
                  <Text style={styles.trainerExperience}>
                    {item.experience || 0} {Strings.TrainersTab.card.yearsExp}
                  </Text>
                  <Text style={styles.trainerBio} numberOfLines={2}>
                    {item.bio}
                  </Text>
                </View>
                <View style={styles.trainerActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleViewTrainerDetails(item)}>
                    <Icon name="info" size={20} color={theme.colors.textSecondaryOnSurface} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleChatWithTrainer(item)}>
                    <Icon name="chat" size={16} color={theme.colors.textPrimary} />
                    <Text style={styles.primaryActionButtonText}>{Strings.TrainersTab.card.chat}</Text>
                  </TouchableOpacity>
                </View>
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
  container: { flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.m },
  sectionContainer: { marginTop: theme.spacing.l, marginBottom: theme.spacing.l },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: theme.spacing.m, fontFamily: theme.fontFamily.bold },
  loadingContainer: { padding: theme.spacing.l, alignItems: 'center' },
  emptyState: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.xl, alignItems: 'center', ...theme.shadow },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: theme.spacing.m, color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  emptySubtext: { fontSize: 14, textAlign: 'center', color: theme.colors.textSecondaryOnSurface, marginTop: theme.spacing.s },
  trainerCard: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m, alignItems: 'center', ...theme.shadow },
  trainerAvatar: { width: 60, height: 60, borderRadius: 30, marginRight: theme.spacing.m },
  trainerInfo: { flex: 1 },
  trainerName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.bold },
  trainerExperience: { fontSize: 14, marginTop: theme.spacing.s / 2, color: theme.colors.textSecondaryOnSurface },
  trainerBio: { fontSize: 12, marginTop: theme.spacing.s / 2, color: theme.colors.textSecondaryOnSurface },
  trainerActions: { alignItems: 'center', justifyContent: 'space-between', height: '80%' },
  actionButton: { padding: theme.spacing.s },
  primaryActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: theme.spacing.s, paddingVertical: theme.spacing.s / 2, borderRadius: theme.borderRadius.full },
  primaryActionButtonText: { color: theme.colors.textPrimary, fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
});

export default TrainersTab;