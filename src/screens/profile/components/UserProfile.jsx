// // src/screens/components/UserProfile.js

// import React from 'react';
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';

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
//     logoutButtonBg: '#57595B',
//     error: '#ff5252',
//   },
//   spacing: {
//     s: 8,
//     m: 16,
//     l: 24,
//   },
//   borderRadius: {
//     md: 16, // 1rem
//     full: 9999,
//   },
//   fontFamily: {
//     regular: 'System', // Change to 'Lexend-Regular' after setup
//     bold: 'System', // Change to 'Lexend-Bold' after setup
//   }
// };

// const UserProfile = ({ userProfile, onManageBilling, isBillingLoading, onLogout }) => {
//   const safeUserProfile = userProfile || {};
//   const memberProfile = safeUserProfile.memberProfile || {};

//   // NOTE: The reference shows Height, Weight, and Age.
//   // Please ensure your `userProfile` data includes these fields, e.g., memberProfile.height, memberProfile.weight, memberProfile.age.
//   // I've used placeholder data here.
//   const height = memberProfile.height || "175 cm";
//   const weight = memberProfile.weight || "72 kg";
//   const age = memberProfile.age || "28";

//   return (
//     <View style={styles.container}>
//       {/* Personal Info Card */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Personal Information</Text>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Height</Text>
//           <Text style={styles.detailValue}>{height}</Text>
//         </View>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Weight</Text>
//           <Text style={styles.detailValue}>{weight}</Text>
//         </View>
//         <View style={[styles.detailItem, styles.detailItemNoBorder]}>
//           <Text style={styles.detailLabel}>Age</Text>
//           <Text style={styles.detailValue}>{age}</Text>
//         </View>
//       </View>

//       {/* Account Settings Card */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Account Settings</Text>
//         <View style={styles.detailItem}>
//           <Text style={styles.detailLabel}>Email</Text>
//           <Text style={styles.detailValue}>{safeUserProfile.email}</Text>
//         </View>
//         <View style={[styles.detailItem, styles.detailItemNoBorder]}>
//           <Text style={styles.detailLabel}>Password</Text>
//           <Text style={styles.detailValue}>**********</Text>
//         </View>
//       </View>

//       {/* Action Buttons */}
//       {safeUserProfile.role === 'MEMBER' && (
//         <TouchableOpacity 
//           style={[styles.actionButton, styles.primaryButton]} 
//           onPress={onManageBilling} 
//           disabled={isBillingLoading}
//         >
//           {isBillingLoading ? (
//             <ActivityIndicator color={theme.colors.textPrimary} />
//           ) : (
//             <Text style={styles.primaryButtonText}>Manage Subscription</Text>
//           )}
//         </TouchableOpacity>
//       )}
      
//       <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onLogout}>
//         <Text style={styles.secondaryButtonText}>Log Out</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: theme.spacing.m,
//     paddingBottom: theme.spacing.l,
//   },
//   // --- Card Styles ---
//   card: {
//     backgroundColor: theme.colors.surface,
//     borderRadius: theme.borderRadius.md,
//     padding: theme.spacing.m,
//     marginBottom: theme.spacing.m,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: theme.colors.textOnSurface,
//     marginBottom: theme.spacing.m,
//     fontFamily: theme.fontFamily.bold,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: theme.spacing.s,
//     borderBottomWidth: 1,
//     borderBottomColor: theme.colors.borderColorOnSurface,
//   },
//   detailItemNoBorder: {
//     borderBottomWidth: 0,
//   },
//   detailLabel: {
//     fontSize: 16,
//     color: theme.colors.textSecondaryOnSurface,
//     fontFamily: theme.fontFamily.regular,
//   },
//   detailValue: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: theme.colors.textOnSurface,
//     fontFamily: theme.fontFamily.regular,
//   },
//   // --- Button Styles ---
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: theme.borderRadius.full,
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     marginBottom: theme.spacing.m,
//   },
//   primaryButton: {
//     backgroundColor: theme.colors.primary,
//   },
//   primaryButtonText: {
//     color: theme.colors.textPrimary,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
//   secondaryButton: {
//     backgroundColor: theme.colors.logoutButtonBg,
//   },
//   secondaryButtonText: {
//     color: theme.colors.textPrimary,
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: theme.fontFamily.bold,
//   },
// });

// export default UserProfile;


// src/screens/components/UserProfile.js
import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
    logoutButtonBg: '#57595B',
    error: '#ff5252',
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
  },
  borderRadius: {
    md: 16,
    full: 9999,
  },
  fontFamily: {
    regular: 'System',
    bold: 'System',
  }
};

const UserProfile = ({ userProfile, onManageBilling, isBillingLoading, onLogout }) => {
  const safeUserProfile = userProfile || {};
  const memberProfile = safeUserProfile.memberProfile || {};

  const height = memberProfile.height || Strings.UserProfile.placeholders.height;
  const weight = memberProfile.weight || Strings.UserProfile.placeholders.weight;
  const age = memberProfile.age || Strings.UserProfile.placeholders.age;

  return (
    <View style={styles.container}>
      {/* Personal Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{Strings.UserProfile.sections.personalInfo}</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{Strings.UserProfile.fields.height}</Text>
          <Text style={styles.detailValue}>{height}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{Strings.UserProfile.fields.weight}</Text>
          <Text style={styles.detailValue}>{weight}</Text>
        </View>
        <View style={[styles.detailItem, styles.detailItemNoBorder]}>
          <Text style={styles.detailLabel}>{Strings.UserProfile.fields.age}</Text>
          <Text style={styles.detailValue}>{age}</Text>
        </View>
      </View>

      {/* Account Settings Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{Strings.UserProfile.sections.accountSettings}</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>{Strings.UserProfile.fields.email}</Text>
          <Text style={styles.detailValue}>{safeUserProfile.email}</Text>
        </View>
        <View style={[styles.detailItem, styles.detailItemNoBorder]}>
          <Text style={styles.detailLabel}>{Strings.UserProfile.fields.password}</Text>
          <Text style={styles.detailValue}>{Strings.UserProfile.placeholders.password}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {safeUserProfile.role === 'MEMBER' && (
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]} 
          onPress={onManageBilling} 
          disabled={isBillingLoading}
        >
          {isBillingLoading ? (
            <ActivityIndicator color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>{Strings.UserProfile.actions.manageSubscription}</Text>
          )}
        </TouchableOpacity>
      )}
      
      <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={onLogout}>
        <Text style={styles.secondaryButtonText}>{Strings.UserProfile.actions.logout}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.l },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textOnSurface, marginBottom: theme.spacing.m, fontFamily: theme.fontFamily.bold },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.borderColorOnSurface },
  detailItemNoBorder: { borderBottomWidth: 0 },
  detailLabel: { fontSize: 16, color: theme.colors.textSecondaryOnSurface, fontFamily: theme.fontFamily.regular },
  detailValue: { fontSize: 16, fontWeight: '500', color: theme.colors.textOnSurface, fontFamily: theme.fontFamily.regular },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadius.full, paddingVertical: 12, paddingHorizontal: 24, marginBottom: theme.spacing.m },
  primaryButton: { backgroundColor: theme.colors.primary },
  primaryButtonText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: theme.fontFamily.bold },
  secondaryButton: { backgroundColor: theme.colors.logoutButtonBg },
  secondaryButtonText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: 'bold', fontFamily: theme.fontFamily.bold },
});

export default UserProfile;