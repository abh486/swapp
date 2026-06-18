import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const ProfileSettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account Permanently',
      'Are you sure you want to delete your account? This will permanently wipe out all of your profile, history, workouts, and active memberships. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await apiClient.delete('/v1/auth/delete-account');
              if (res.data?.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your account has been successfully deleted from Swappfit.',
                  [{ text: 'OK', onPress: () => logout() }]
                );
              } else {
                throw new Error('Deletion failed.');
              }
            } catch (err) {
              const status = err.response?.status;
              const serverMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message;

              console.error(
                'Delete Account Error:',
                JSON.stringify(
                  {
                    status,
                    data: err.response?.data,
                    message: err.message,
                  },
                  null,
                  2,
                ),
              );

              Alert.alert(
                'Action Failed',
                status >= 500
                  ? 'The server could not delete this account right now. Please try again later or contact support.'
                  : serverMessage || 'We could not process the account deletion request right now. Please check your network connection and try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Swappfit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout Error:', err);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="settings-sharp" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* SECTION: Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditPersonalInfo')}>
            <View style={styles.rowLeft}>
              <Icon name="person-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Account</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ManageSubscriptions')}>
            <View style={styles.rowLeft}>
              <Icon name="shield-half-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Manage Subscription</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="notifications-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Notifications</Text>
            </View>
            <Switch
              trackColor={{ false: '#333', true: '#2ecc71' }}
              thumbColor={notificationsEnabled ? '#FFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleNotifications}
              value={notificationsEnabled}
            />
          </View>

          <TouchableOpacity style={styles.rowNoBorder}>
            <View style={styles.rowLeft}>
              <Icon name="lock-closed-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Privacy</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Preferences */}
        <Text style={styles.sectionHeader}>Preferences</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="barbell-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Workouts</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="help-circle-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Privacy & Social</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="trending-up-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Progress Report</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <View style={[styles.rowLeft, { paddingLeft: 30 }]}>
              <Text style={styles.rowText}>Reminders</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowNoBorder}>
            <View style={[styles.rowLeft, { paddingLeft: 30 }]}>
              <Text style={styles.rowText}>Connect Apple Health</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Help */}
        <Text style={styles.sectionHeader}>Help</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="help-buoy-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Frequently Asked Questions</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Support')}>
            <View style={styles.rowLeft}>
              <Icon name="chatbubble-ellipses-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Contact Us</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowNoBorder}>
            <View style={styles.rowLeft}>
              <Icon name="information-circle-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>About</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Session */}
        <Text style={styles.sectionHeader}>Session</Text>
        
        <View style={styles.card}>
          <TouchableOpacity style={styles.rowNoBorder} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <Icon name="log-out-outline" size={22} color="#FFF" style={styles.rowIcon} />
              <Text style={styles.rowText}>Log Out</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Account Deletion (Destructive Actions) */}
        <Text style={styles.sectionHeader}>Safety & Account Control</Text>
        
        <View style={styles.destructiveCard}>
          <TouchableOpacity style={styles.rowNoBorder} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <Icon name="trash-outline" size={22} color="#e74c3c" style={styles.rowIcon} />
              <Text style={styles.destructiveText}>Delete Account</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 10,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  destructiveCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  rowText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  destructiveText: {
    color: '#e74c3c',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ProfileSettingsScreen;
