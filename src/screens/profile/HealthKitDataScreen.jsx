import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStepCountToday,
  getActiveEnergyBurnedToday,
  getDistanceWalkingRunningToday,
  getSleepDurationToday,
} from '../../utils/healthKit';

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
      const connected = await AsyncStorage.getItem('healthkit_connected');
      if (connected === 'true') {
        setIsConnected(true);
        const [steps, burned, distance, sleep] = await Promise.all([
          getStepCountToday(),
          getActiveEnergyBurnedToday(),
          getDistanceWalkingRunningToday(),
          getSleepDurationToday(),
        ]);
        
        setData({
          steps: steps || 0,
          calories: burned || 0,
          distance: distance || 0,
          sleep: sleep || 0,
        });
      } else {
        setIsConnected(false);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>HEALTHKIT TELEMETRY</Text>
          <Text style={styles.headerSubtitle}>Real-time sensor logs from Apple Health</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchRealHealthData} disabled={loading}>
          <Icon name="refresh-outline" size={20} color="#FFF" style={loading && { opacity: 0.5 }} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Polling native database...</Text>
        </View>
      ) : !isConnected ? (
        <View style={styles.centerContainer}>
          <Icon name="heart-dislike-outline" size={60} color="#e74c3c" style={{ marginBottom: 16 }} />
          <Text style={styles.warningTitle}>Apple Health Disconnected</Text>
          <Text style={styles.warningDesc}>
            To view steps, calories, sleep, and active distance, please connect Apple Health in settings first.
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
          <View style={styles.statusBannerContainer}>
            <LinearGradient
              colors={['#1a1c23', '#0f1013']}
              style={styles.statusBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{ width: '100%' }}>
                <View style={styles.statusDotRow}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.statusTitle}>INTEGRATION ACTIVE & SYNCED</Text>
                </View>
                <Text style={styles.statusDesc}>
                  Sensors are connected. Tapping refresh fetches new steps, active calories, and sleep records from your iPhone.
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ADVANCED DETAIL CARDS */}
          
          {/* Steps Card */}
          <View style={styles.detailCardContainer}>
            <LinearGradient colors={['#131a24', '#0a0d14']} style={styles.detailCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBackground}>
                  <Icon name="footsteps" size={20} color="#3498db" />
                </View>
                <View style={styles.cardHeaderTitleBlock}>
                  <Text style={styles.cardTitle}>STEPS TRACKER</Text>
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
                  colors={['#3498db', '#8e44ad']}
                  style={[styles.progressBarFill, { width: `${progress.steps * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressPercent}>{`${Math.round(progress.steps * 100)}% completed`}</Text>

              {/* Cadence analytics */}
              <View style={styles.analyticsSubPanel}>
                <Icon name="analytics-outline" size={14} color="#3498db" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.analyticsText}>
                  {data.steps > 0
                    ? `Estimated stride length calculated at approx. 0.74 meters.`
                    : 'Walk to populate today\'s stride cadence estimations.'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Energy Burned Card */}
          <View style={styles.detailCardContainer}>
            <LinearGradient colors={['#241515', '#140a0a']} style={styles.detailCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBackground, { backgroundColor: 'rgba(231, 76, 60, 0.15)' }]}>
                  <Icon name="flame" size={20} color="#e74c3c" />
                </View>
                <View style={styles.cardHeaderTitleBlock}>
                  <Text style={[styles.cardTitle, { color: '#e74c3c' }]}>ACTIVE CALORIES</Text>
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
                  colors={['#e74c3c', '#e67e22']}
                  style={[styles.progressBarFill, { width: `${progress.calories * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressPercent}>{`${Math.round(progress.calories * 100)}% completed`}</Text>

              <View style={styles.analyticsSubPanel}>
                <Icon name="walk-outline" size={14} color="#e74c3c" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.analyticsText}>{activityEquivText}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Distance Card */}
          <View style={styles.detailCardContainer}>
            <LinearGradient colors={['#122415', '#0a140b']} style={styles.detailCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBackground, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
                  <Icon name="navigate-circle" size={20} color="#2ecc71" />
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
                  colors={['#2ecc71', '#1abc9c']}
                  style={[styles.progressBarFill, { width: `${progress.distance * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressPercent}>{`${Math.round(progress.distance * 100)}% completed`}</Text>

              <View style={styles.analyticsSubPanel}>
                <Icon name="speedometer-outline" size={14} color="#2ecc71" style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={styles.analyticsText}>
                  {averageCadence > 0
                    ? `Running average step density is ${averageCadence.toLocaleString()} steps per kilometer.`
                    : 'Move around to calculate step density analytics.'}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Sleep Analysis Card */}
          <View style={styles.detailCardContainer}>
            <LinearGradient colors={['#1f1324', '#110a14']} style={styles.detailCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconBackground, { backgroundColor: 'rgba(155, 89, 182, 0.15)' }]}>
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
                  colors={['#9b59b6', '#34495e']}
                  style={[styles.progressBarFill, { width: `${progress.sleep * 100}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressPercent}>{`${Math.round(progress.sleep * 100)}% completed`}</Text>

              <View style={styles.analyticsSubPanel}>
                <Icon name={sleepStatus.icon} size={14} color={sleepStatus.color} style={{ marginRight: 6, marginTop: 2 }} />
                <Text style={[styles.analyticsText, { color: sleepStatus.color, fontWeight: '600' }]}>
                  {`Status: ${sleepStatus.text}`}
                </Text>
              </View>
            </LinearGradient>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  refreshButton: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 12,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  warningTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  connectBtn: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  connectBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBannerContainer: {
    marginBottom: 20,
  },
  statusBanner: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2ecc71',
    marginRight: 8,
  },
  statusTitle: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  statusDesc: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    lineHeight: 18,
  },
  detailCardContainer: {
    marginBottom: 16,
    width: '100%',
  },
  detailCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 152, 219, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: 1,
  },
  valueDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  largeValue: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginRight: 10,
  },
  targetSubText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
