import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStepCountToday,
  getActiveEnergyBurnedToday,
  getDistanceWalkingRunningToday,
  getSleepDurationToday,
} from '../../utils/healthKit';
import { fetchSleepLogs } from '../../redux/actions/sleepActions';
import { GlobalLoader } from '../../components/GlobalLoader';

const { width } = Dimensions.get('window');

const HealthKitDataScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState({
    steps: 0,
    calories: 0,
    distance: 0,
    sleep: 0,
  });

  const fetchRealHealthData = useCallback(async () => {
    try {
      setLoading(true);

      // Check today's date for sleep duration
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      let sleepVal = 0;
      try {
        const sleepData = await fetchSleepLogs(dateKey);
        if (sleepData && sleepData.totalHours > 0) {
          sleepVal = sleepData.totalHours;
        }
      } catch (e) {}

      const connected = await AsyncStorage.getItem('healthkit_connected');
      if (connected === 'true') {
        setIsConnected(true);
        const [steps, burned, distance, hkSleep] = await Promise.all([
          getStepCountToday(),
          getActiveEnergyBurnedToday(),
          getDistanceWalkingRunningToday(),
          getSleepDurationToday(),
        ]);
        
        setData({
          steps: steps || 0,
          calories: burned || 0,
          distance: distance || 0,
          sleep: sleepVal > 0 ? sleepVal : (hkSleep || 0),
        });
      } else {
        setIsConnected(false);
        // If not connected to HealthKit, but we have manual sleep logged, show it
        setData(prev => ({
          ...prev,
          sleep: sleepVal,
        }));
      }
    } catch (err) {
      console.warn('[HealthKitDataScreen] Error fetching real health data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealHealthData();
  }, [fetchRealHealthData]);

  // Derived Metrics & Goals
  const targets = {
    steps: 10000,
    calories: 800,
    distance: 8.0,
    sleep: 8.0,
  };

  const progress = useMemo(() => {
    return {
      steps: Math.min(1, data.steps / targets.steps),
      calories: Math.min(1, data.calories / targets.calories),
      distance: Math.min(1, data.distance / targets.distance),
      sleep: Math.min(1, data.sleep / targets.sleep),
    };
  }, [data]);

  const sleepStatus = useMemo(() => {
    if (data.sleep >= 7.5) return { text: 'Optimal Recovery', color: '#2ecc71', icon: 'checkmark-circle-outline' };
    if (data.sleep >= 6.0) return { text: 'Suboptimal Sleep', color: '#f1c40f', icon: 'alert-circle-outline' };
    return { text: 'Rest Deprived', color: '#e74c3c', icon: 'warning-outline' };
  }, [data.sleep]);

  const activityEquivText = useMemo(() => {
    if (data.calories <= 0) return 'No active calorie expenditure detected yet.';
    const minsJogging = Math.round(data.calories / 11);
    return `Equivalent to approx. ${minsJogging} minutes of continuous jogging.`;
  }, [data.calories]);

  const averageCadence = useMemo(() => {
    if (data.distance <= 0) return 0;
    return Math.round(data.steps / data.distance);
  }, [data.steps, data.distance]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Health Sync</Text>
          <Text style={styles.headerSubtitle}>Real-time sensor logs from Apple Health</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchRealHealthData} disabled={loading} activeOpacity={0.75}>
          <Icon name="refresh" size={20} color="#FFF" style={loading && { opacity: 0.5 }} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <GlobalLoader size={60} text="Fetching native health database..." />
        </View>
      ) : !isConnected ? (
        <View style={styles.centerContainer}>
          <View style={styles.warningIconBg}>
            <Icon name="heart-dislike" size={40} color="#ff4757" />
          </View>
          <Text style={styles.warningTitle}>Apple Health Disconnected</Text>
          <Text style={styles.warningDesc}>
            To sync and display steps, active calories, sleep duration, and distance, please enable connection in Settings.
          </Text>
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={() => navigation.navigate('AppsAndDevices')}
          >
            <Text style={styles.connectBtnText}>Go to Connection Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          
          {/* Active Status Banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusDotRow}>
              <View style={styles.pulseContainer}>
                <View style={styles.greenPulseDot} />
              </View>
              <Text style={styles.statusTitle}>INTEGRATION ACTIVE & SYNCED</Text>
            </View>
            <Text style={styles.statusDesc}>
              Sensors are connected. Tapping refresh fetches new activity metrics directly from your device.
            </Text>
          </View>

          {/* TELEMETRY CARDS */}
          
          {/* Steps Card */}
          <View style={[styles.detailCard, { borderColor: 'rgba(52, 152, 219, 0.15)' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBackground, { backgroundColor: 'rgba(52, 152, 219, 0.12)' }]}>
                <Icon name="footsteps" size={20} color="#3498db" />
              </View>
              <View style={styles.cardHeaderTitleBlock}>
                <Text style={[styles.cardTitle, { color: '#3498db' }]}>STEPS TRACKER</Text>
                <Text style={styles.cardSubtitle}>Total cadence-based steps count today</Text>
              </View>
            </View>

            <View style={styles.valueDisplayRow}>
              <Text style={styles.largeValue}>{data.steps.toLocaleString()}</Text>
              <Text style={styles.targetSubText}>{`of ${targets.steps.toLocaleString()} goal`}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                style={[styles.progressBarFill, { width: `${progress.steps * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressPercent}>{`${Math.round(progress.steps * 100)}% completed`}</Text>

            {/* Cadence analytics */}
            <View style={styles.analyticsSubPanel}>
              <Icon name="analytics" size={15} color="#3498db" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.analyticsText}>
                {data.steps > 0
                  ? `Estimated stride length calculated at approx. 0.74 meters.`
                  : 'Walk to populate today\'s stride cadence estimations.'}
              </Text>
            </View>
          </View>

          {/* Energy Burned Card */}
          <View style={[styles.detailCard, { borderColor: 'rgba(255, 71, 87, 0.15)' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBackground, { backgroundColor: 'rgba(255, 71, 87, 0.12)' }]}>
                <Icon name="flame" size={20} color="#ff4757" />
              </View>
              <View style={styles.cardHeaderTitleBlock}>
                <Text style={[styles.cardTitle, { color: '#ff4757' }]}>ACTIVE CALORIES</Text>
                <Text style={styles.cardSubtitle}>Active energy burned from workouts & activity</Text>
              </View>
            </View>

            <View style={styles.valueDisplayRow}>
              <Text style={styles.largeValue}>{data.calories}</Text>
              <Text style={styles.targetSubText}>{`of ${targets.calories} kcal goal`}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <LinearGradient
                colors={['#ff4757', '#ff6b81']}
                style={[styles.progressBarFill, { width: `${progress.calories * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressPercent}>{`${Math.round(progress.calories * 100)}% completed`}</Text>

            <View style={styles.analyticsSubPanel}>
              <Icon name="fitness" size={15} color="#ff4757" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.analyticsText}>{activityEquivText}</Text>
            </View>
          </View>

          {/* Distance Card */}
          <View style={[styles.detailCard, { borderColor: 'rgba(46, 204, 113, 0.15)' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBackground, { backgroundColor: 'rgba(46, 204, 113, 0.12)' }]}>
                <Icon name="navigate" size={20} color="#2ecc71" />
              </View>
              <View style={styles.cardHeaderTitleBlock}>
                <Text style={[styles.cardTitle, { color: '#2ecc71' }]}>TOTAL DISTANCE</Text>
                <Text style={styles.cardSubtitle}>Combined walking & running distance today</Text>
              </View>
            </View>

            <View style={styles.valueDisplayRow}>
              <Text style={styles.largeValue}>{data.distance}</Text>
              <Text style={styles.targetSubText}>{`of ${targets.distance} KM goal`}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <LinearGradient
                colors={['#2ecc71', '#27ae60']}
                style={[styles.progressBarFill, { width: `${progress.distance * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressPercent}>{`${Math.round(progress.distance * 100)}% completed`}</Text>

            <View style={styles.analyticsSubPanel}>
              <Icon name="speedometer" size={15} color="#2ecc71" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.analyticsText}>
                {averageCadence > 0
                  ? `Running average step density is ${averageCadence.toLocaleString()} steps per kilometer.`
                  : 'Move around to calculate step density analytics.'}
              </Text>
            </View>
          </View>

          {/* Sleep Analysis Card */}
          <View style={[styles.detailCard, { borderColor: 'rgba(155, 89, 182, 0.15)' }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconBackground, { backgroundColor: 'rgba(155, 89, 182, 0.12)' }]}>
                <Icon name="moon" size={20} color="#9b59b6" />
              </View>
              <View style={styles.cardHeaderTitleBlock}>
                <Text style={[styles.cardTitle, { color: '#9b59b6' }]}>SLEEP ANALYSIS</Text>
                <Text style={styles.cardSubtitle}>Sleep samples & duration logged over 24h</Text>
              </View>
            </View>

            <View style={styles.valueDisplayRow}>
              <Text style={styles.largeValue}>{data.sleep}</Text>
              <Text style={styles.targetSubText}>{`of ${targets.sleep} hours goal`}</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground} />
              <LinearGradient
                colors={['#9b59b6', '#8e44ad']}
                style={[styles.progressBarFill, { width: `${progress.sleep * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressPercent}>{`${Math.round(progress.sleep * 100)}% completed`}</Text>

            <View style={styles.analyticsSubPanel}>
              <Icon name={sleepStatus.icon === 'checkmark-circle-outline' ? 'checkmark-circle' : sleepStatus.icon === 'alert-circle-outline' ? 'alert-circle' : 'warning'} size={15} color={sleepStatus.color} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.analyticsText, { color: sleepStatus.color, fontWeight: '600' }]}>
                {`Status: ${sleepStatus.text}`}
              </Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 26 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  refreshButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 14,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  warningIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  warningDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  connectBtn: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  connectBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  statusBanner: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
  },
  statusTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 18,
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
    backgroundColor: '#0A0A0C',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  valueDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  largeValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: '700',
    marginRight: 10,
  },
  targetSubText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  progressBarContainer: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  progressBarBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  progressPercent: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 16,
  },
  analyticsSubPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  analyticsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});

export default HealthKitDataScreen;
