// // src/screens/home/location/StatusIndicator.jsx
// import React from 'react';
// import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';

// export const StatusIndicator = ({ locationError, gymError, isLoading, permissionGranted, onRetry }) => {
  
//   if (isLoading) {
//     return (
//         <View style={styles.centered}>
//             <ActivityIndicator size="large" color="#e74c3c" />
//             <Text style={styles.infoText}>Getting your location...</Text>
//         </View>
//     );
//   }

//   const error = locationError || gymError;
//   if (error) {
//     return (
//         <View style={styles.centered}>
//             <Icon name="alert-circle-outline" size={40} color="#e74c3c" />
//             <Text style={styles.errorText}>{error}</Text>
//             <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
//                 <Text style={styles.retryButtonText}>Try Again</Text>
//             </TouchableOpacity>
//         </View>
//     );
//   }

//   if (!permissionGranted) {
//       return (
//           <View style={styles.centered}>
//               <Icon name="location-outline" size={60} color="#ccc" />
//               <Text style={styles.infoTitle}>Location Access Required</Text>
//               <Text style={styles.infoText}>Enable location to find nearby gyms.</Text>
//           </View>
//       );
//   }
  
//   // This will show if there's no location or gym error, but the gym list is still loading or empty.
//   return null;
// };
// // Add relevant styles from your original file here
// const styles = StyleSheet.create({
//     centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
//     errorText: { color: '#e74c3c', fontSize: 16, textAlign: 'center', marginTop: 10, marginBottom: 20 },
//     retryButton: { backgroundColor: '#e74c3c', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
//     retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
//     infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 10 },
//     infoText: { fontSize: 14, color: '#999', marginTop: 5, textAlign: 'center' },
// });

// src/screens/home/location/StatusIndicator.jsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Strings } from '../../../config/config'; // Import Config

export const StatusIndicator = ({ locationError, gymError, isLoading, permissionGranted, onRetry }) => {
  const { loading, notFound, serviceUnavailable, nearYou, required, requiredMsg, actions } = Strings.Location.Status;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.infoText}>{loading}</Text>
      </View>
    );
  }

  const error = locationError || gymError;
  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle-outline" size={40} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{actions.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={styles.centered}>
        <Icon name="location-outline" size={60} color="#ccc" />
        <Text style={styles.infoTitle}>{nearYou}</Text>
        <Text style={styles.infoText}>{requiredMsg}</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoText: { color: '#57595B', fontSize: 14, marginTop: 10 },
  errorText: { color: '#ef4444', textAlign: 'center', marginTop: 10, marginBottom: 20, fontSize: 14 },
  retryButton: { backgroundColor: '#e74c3c', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8 },
  retryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  infoTitle: { fontSize: 20, fontWeight: 'bold', color: '#666', marginTop: 10 },
});