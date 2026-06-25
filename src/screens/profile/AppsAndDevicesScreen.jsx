import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useResponsiveMetrics } from '../../utils/responsive';
import { requestHealthKitPermission } from '../../utils/healthKit';

const AppsAndDevicesScreen = ({ navigation }) => {
  const { wp, hp, ms, fs, sp } = useResponsiveMetrics();
  const styles = createStyles({ wp, hp, ms, fs, sp });

  const [healthKitConnected, setHealthKitConnected] = useState(false);

  useEffect(() => {
    // Check if HealthKit was previously connected
    const checkConnection = async () => {
      try {
        const connected = await AsyncStorage.getItem('healthkit_connected');
        if (connected === 'true') {
          setHealthKitConnected(true);
        }
      } catch (err) {
        console.error('Error checking HealthKit connection state:', err);
      }
    };
    checkConnection();
  }, []);

  const handleConnectHealthKit = async () => {
    try {
      const success = await requestHealthKitPermission();
      if (success) {
        setHealthKitConnected(true);
        await AsyncStorage.setItem('healthkit_connected', 'true');
        Alert.alert('Success', 'Apple Health connected successfully!');
      } else {
        Alert.alert('Not Supported', 'Apple Health is only supported on iOS devices.');
      }
    } catch (err) {
      console.error(err);
      if (err && err.message && err.message.includes('native module')) {
        Alert.alert('Connection Error', err.message);
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable Apple Health permissions for Swapp in your iPhone Settings > Health > Data Access & Devices.'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Decorative Purple Glow at top-left background */}
      <View style={styles.glowTopLeft} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apps and Devices</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Apple Health Card */}
        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View style={styles.healthIconContainer}>
              {/* Apple Health Heart Icon */}
              <Icon name="heart" size={26} color="#ff3b30" />
            </View>
            <Text style={styles.healthTitle}>Apple Health</Text>
          </View>

          <Text style={styles.healthDescription}>
            Sync all data related to sleep, exercise, and activity automatically from Apple Health.
          </Text>

          <TouchableOpacity
            style={[
              styles.connectBtn,
              healthKitConnected ? styles.connectedBtn : null,
            ]}
            onPress={handleConnectHealthKit}
            disabled={healthKitConnected}
          >
            <Text style={styles.connectBtnText}>
              {healthKitConnected ? 'Connected' : 'Connect'}
            </Text>
            {healthKitConnected && (
              <Icon name="checkmark" size={16} color="#FFF" style={{ marginLeft: 8 }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Other Apps Section */}
        <Text style={styles.sectionTitle}>Other Apps</Text>

        <View style={styles.otherAppsCard}>
          <View style={styles.otherAppRow}>
            <View style={styles.otherAppIconContainer}>
              <Icon name="location" size={18} color="#000" />
            </View>
            <View style={styles.otherAppTextContainer}>
              <Text style={styles.otherAppTitle}>Location</Text>
              <Text style={styles.otherAppSubtitle}>Get location based insights.</Text>
            </View>
            {/* Green Checkmark */}
            <View style={styles.checkmarkContainer}>
              <Icon name="checkmark-circle" size={24} color="#2ecc71" />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = ({ wp, hp, ms, fs, sp }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    glowTopLeft: {
      position: 'absolute',
      top: -hp(15),
      left: -wp(20),
      width: wp(80),
      height: wp(80),
      borderRadius: wp(40),
      backgroundColor: '#2e0854', // deep violet/purple glow
      opacity: 0.5,
      zIndex: -1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: sp(16),
      paddingVertical: sp(12),
    },
    headerBtn: {
      padding: sp(4),
      width: sp(36),
      alignItems: 'center',
    },
    headerTitle: {
      color: '#FFFFFF',
      fontSize: fs(18),
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: sp(20),
      paddingTop: sp(20),
    },
    healthCard: {
      backgroundColor: '#0b0b0d', // dark charcoal
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      padding: sp(20),
      marginBottom: sp(30),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
    },
    healthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: sp(16),
    },
    healthIconContainer: {
      width: ms(48),
      height: ms(48),
      borderRadius: ms(10),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sp(14),
    },
    healthTitle: {
      color: '#FFFFFF',
      fontSize: fs(20),
      fontWeight: 'bold',
    },
    healthDescription: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: fs(14),
      lineHeight: fs(20),
      marginBottom: sp(20),
    },
    connectBtn: {
      backgroundColor: '#1C0030', // custom deep dark purple button
      borderWidth: 1,
      borderColor: 'rgba(124, 77, 255, 0.15)',
      height: sp(50),
      borderRadius: ms(25),
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    connectedBtn: {
      backgroundColor: '#2ecc71',
      borderColor: '#27ae60',
    },
    connectBtnText: {
      color: '#FFFFFF',
      fontSize: fs(16),
      fontWeight: 'bold',
    },
    sectionTitle: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: fs(13),
      fontWeight: '600',
      marginBottom: sp(12),
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    otherAppsCard: {
      backgroundColor: '#0b0b0d',
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
    },
    otherAppRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sp(16),
      paddingHorizontal: sp(16),
    },
    otherAppIconContainer: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sp(14),
    },
    otherAppTextContainer: {
      flex: 1,
    },
    otherAppTitle: {
      color: '#FFFFFF',
      fontSize: fs(15),
      fontWeight: 'bold',
    },
    otherAppSubtitle: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: fs(12),
      marginTop: sp(2),
    },
    checkmarkContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default AppsAndDevicesScreen;
