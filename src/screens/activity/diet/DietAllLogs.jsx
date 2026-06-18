import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import apiClient from '../../../api/apiClient';
import { GlobalLoader } from '../../../components/GlobalLoader';

const { width } = Dimensions.get('window');

const DietAllLogs = ({ navigation, route }) => {
  const mode = route.params?.mode || 'diet'; // 'diet', 'steps', 'sleep'
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchAllDietLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/diet/logs');
      const payload = response?.data?.data || response?.data || [];
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.logs)
          ? payload.logs
          : [];
      setLogs(normalized);
    } catch (err) {
      setError('Unable to load diet logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDietLogs();
  }, [fetchAllDietLogs]);

  // Filter logs for the selected date
  const dailyLogs = useMemo(() => {
    return logs.filter((log) => {
      const logDate = log.createdAt ? new Date(log.createdAt) : new Date(log.date);
      return logDate.toDateString() === selectedDate.toDateString();
    });
  }, [logs, selectedDate]);

  // Compute daily totals for Calories
  const targetCals = 2000;
  const consumedCals = dailyLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
  const leftCals = targetCals - consumedCals;
  const isOverLimit = leftCals < 0;

  const targetProt = 120;
  const consumedProt = dailyLogs.reduce((sum, item) => sum + (item.protein || 0), 0);
  const protPct = targetProt > 0 ? Math.round(Math.min(100, (consumedProt / targetProt) * 100)) : 0;

  const targetFats = 65;
  const consumedFats = dailyLogs.reduce((sum, item) => sum + (item.fats || 0), 0);
  const fatsPct = targetFats > 0 ? Math.round(Math.min(100, (consumedFats / targetFats) * 100)) : 0;

  const targetCarbs = 220;
  const consumedCarbs = dailyLogs.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const carbsPct = targetCarbs > 0 ? Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100)) : 0;

  const targetFibre = 30;
  const consumedFibre = dailyLogs.reduce((sum, item) => sum + (item.fibre || 0), 0);
  const fibrePct = targetFibre > 0 ? Math.round(Math.min(100, (consumedFibre / targetFibre) * 100)) : 0;

  const handlePrevDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // SVG parameters for partial circular progress ring (Steps / Sleep)
  const stepsCirc = 2 * Math.PI * 70;
  const stepsArcLen = stepsCirc * 0.75; // 270 deg
  const currentSteps = 4505;
  const targetSteps = 10000;
  const stepsProgress = Math.min(1, currentSteps / targetSteps);

  const sleepCirc = 2 * Math.PI * 70;
  const sleepArcLen = sleepCirc * 0.75;
  const currentSleep = 6.5;
  const targetSleep = 8.0;
  const sleepProgress = Math.min(1, currentSleep / targetSleep);

  const getScreenTitle = () => {
    if (mode === 'steps') return 'Step Tracker';
    if (mode === 'sleep') return 'Sleep Tracker';
    return 'Nutrition Tracker';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <GlobalLoader size={50} />
          <Text style={styles.stateText}>Loading analytics...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAllDietLogs} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Day / Week / Month Segmented Control */}
          <View style={styles.tabsContainer}>
            {['Day', 'Week', 'Month'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabTouch}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['rgba(124, 77, 255, 0.95)', 'rgba(236, 72, 153, 0.95)']}
                      style={styles.activeTabGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.activeTabLabel}>{tab}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.inactiveTabLabel}>{tab}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date Slider Navigation */}
          <View style={styles.dateSliderRow}>
            <TouchableOpacity onPress={handlePrevDate} style={styles.dateNavBtn}>
              <Icon name="chevron-back" size={20} color="#888" />
            </TouchableOpacity>
            <Text style={styles.dateNavTitle}>{formattedDate}</Text>
            <TouchableOpacity onPress={handleNextDate} style={styles.dateNavBtn}>
              <Icon name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {/* MODE: NUTRITION / CALORIES */}
          {mode === 'diet' && (
            <>
              {/* Calories Header & Values */}
              <View style={styles.caloriesSection}>
                <Text style={styles.caloriesTitle}>Calories</Text>
                <View style={styles.caloriesValuesRow}>
                  <View style={styles.consumedContainer}>
                    <Text style={styles.consumedValue}>{consumedCals.toLocaleString()}</Text>
                    <Text style={styles.targetValue}>{` / ${targetCals.toLocaleString()} kcal`}</Text>
                  </View>
                  <Text style={[styles.leftText, isOverLimit ? styles.overText : styles.underText]}>
                    {isOverLimit
                      ? `${Math.abs(leftCals).toLocaleString()} kcal over`
                      : `${leftCals.toLocaleString()} kcal left`}
                  </Text>
                </View>
              </View>

              {/* Bezier Calorie Curve Chart */}
              <View style={styles.chartWrapper}>
                <Svg width={width - 32} height={130} viewBox="0 0 320 120">
                  <Defs>
                    <SvgLinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor="#7C4DFF" stopOpacity={0.35} />
                      <Stop offset="100%" stopColor="#7C4DFF" stopOpacity={0.0} />
                    </SvgLinearGradient>
                  </Defs>
                  
                  <Path d="M 0 30 L 320 30" stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />
                  <Path d="M 0 60 L 320 60" stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />
                  <Path d="M 0 90 L 320 90" stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />

                  <Path
                    d="M 10 110 C 60 110, 80 80, 100 70 C 120 60, 140 30, 160 50 C 180 70, 200 110, 220 110 C 240 110, 260 20, 280 20 C 300 20, 310 60, 320 80 L 320 120 L 10 120 Z"
                    fill="url(#chartGrad)"
                  />

                  <Path
                    d="M 10 110 C 60 110, 80 80, 100 70 C 120 60, 140 30, 160 50 C 180 70, 200 110, 220 110 C 240 110, 260 20, 280 20 C 300 20, 310 60, 320 80"
                    fill="none"
                    stroke="#7C4DFF"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                  />
                </Svg>
                
                <View style={styles.xAxisRow}>
                  <Text style={styles.xAxisLabel}>12 AM</Text>
                  <Text style={styles.xAxisLabel}>6 AM</Text>
                  <Text style={styles.xAxisLabel}>12 PM</Text>
                  <Text style={styles.xAxisLabel}>6 PM</Text>
                  <Text style={styles.xAxisLabel}>12 AM</Text>
                </View>
              </View>

              {/* Macros Progress Rows */}
              <View style={styles.macrosSection}>
                <View style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={[styles.macroLabel, { color: '#00E676' }]}>Protein:</Text>
                    <Text style={styles.macroPercent}>{protPct}%</Text>
                  </View>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${protPct}%`, backgroundColor: '#00E676' }]} />
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={[styles.macroLabel, { color: '#00E5FF' }]}>fatss:</Text>
                    <Text style={styles.macroPercent}>{fatsPct}%</Text>
                  </View>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${fatsPct}%`, backgroundColor: '#00E5FF' }]} />
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={[styles.macroLabel, { color: '#FF9800' }]}>carbss:</Text>
                    <Text style={styles.macroPercent}>{carbsPct}%</Text>
                  </View>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${carbsPct}%`, backgroundColor: '#FF9800' }]} />
                  </View>
                </View>

                <View style={styles.macroRow}>
                  <View style={styles.macroHeader}>
                    <Text style={[styles.macroLabel, { color: '#7C4DFF' }]}>fibre:</Text>
                    <Text style={styles.macroPercent}>{fibrePct}%</Text>
                  </View>
                  <View style={styles.macroBarBg}>
                    <View style={[styles.macroBarFill, { width: `${fibrePct}%`, backgroundColor: '#7C4DFF' }]} />
                  </View>
                </View>
              </View>

              {/* Food Logs breakdown */}
              <View style={styles.entriesSection}>
                <Text style={styles.entriesTitle}>Logged Food Entries</Text>
                {dailyLogs.length === 0 ? (
                  <View style={styles.emptyLogsCard}>
                    <Text style={styles.emptyLogsText}>No food logs recorded for this day.</Text>
                  </View>
                ) : (
                  dailyLogs.map((entry, index) => (
                    <View key={entry.id || index} style={styles.logCard}>
                      <View style={styles.logTopRow}>
                        <Text style={styles.logMealType}>{(entry.mealType || 'meal').toUpperCase()}</Text>
                        <Text style={styles.logCalories}>{entry.calories || 0} kcal</Text>
                      </View>
                      <Text style={styles.logMealName}>{entry.mealName || 'Unnamed meal'}</Text>
                      <Text style={styles.logMacroText}>
                        P {entry.protein || 0}g  |  C {entry.carbs || 0}g  |  F {entry.fats || 0}g
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          {/* MODE: STEPS TRACKER */}
          {mode === 'steps' && (
            <>
              {/* Circular Step Progress Ring */}
              <View style={styles.ringContainer}>
                <Svg width={180} height={180} viewBox="0 0 200 200">
                  <Defs>
                    <SvgLinearGradient id="stepsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#7C4DFF" />
                      <Stop offset="100%" stopColor="#EC4899" />
                    </SvgLinearGradient>
                  </Defs>
                  <G rotation={135} origin="100, 100">
                    <Circle
                      cx="100"
                      cy="100"
                      r="70"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${stepsArcLen} ${stepsCirc}`}
                      strokeLinecap="round"
                    />
                    <Circle
                      cx="100"
                      cy="100"
                      r="70"
                      stroke="url(#stepsGrad)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${stepsProgress * stepsArcLen} ${stepsCirc}`}
                      strokeLinecap="round"
                    />
                  </G>
                </Svg>
                
                {/* Center Footprint Icon */}
                <View style={styles.ringCenter}>
                  <MaterialCommunityIcons name="shoe-print" size={46} color="#FFF" />
                </View>
              </View>

              {/* 4-Column Stats Grid */}
              <View style={styles.stepsStatsGrid}>
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>225</Text>
                  <Text style={styles.stepsStatsLbl}>CALORIES</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>{currentSteps.toLocaleString()}</Text>
                  <Text style={styles.stepsStatsLbl}>STEPS</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>8 KM</Text>
                  <Text style={styles.stepsStatsLbl}>DISTANCE</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>00:39:19</Text>
                  <Text style={styles.stepsStatsLbl}>DURATION</Text>
                </View>
              </View>

              <View style={styles.horizontalLine} />

              {/* Top Steps List */}
              <View style={styles.listSection}>
                <View style={styles.listHeader}>
                  <Icon name="ribbon-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.listTitle}>Your Top Step</Text>
                </View>

                <View style={styles.listWrapper}>
                  {[
                    { id: '1', rank: '01.', steps: '15292 Steps', kcal: '612 Kcal', dist: '13,76 KM' },
                    { id: '2', rank: '02.', steps: '15292 Steps', kcal: '612 Kcal', dist: '13,76 KM' },
                    { id: '3', rank: '03.', steps: '15292 Steps', kcal: '612 Kcal', dist: '13,76 KM' },
                  ].map((item) => (
                    <View key={item.id} style={styles.stepRow}>
                      <View style={styles.stepRowLeft}>
                        <Text style={styles.rankNum}>{item.rank}</Text>
                        <View style={styles.stepDetails}>
                          <Text style={styles.stepsValText}>{item.steps}</Text>
                          <Text style={styles.kcalText}>{item.kcal}</Text>
                        </View>
                      </View>
                      <Text style={styles.distText}>{item.dist}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* MODE: SLEEP TRACKER */}
          {mode === 'sleep' && (
            <>
              {/* Circular Sleep Progress Ring */}
              <View style={styles.ringContainer}>
                <Svg width={180} height={180} viewBox="0 0 200 200">
                  <Defs>
                    <SvgLinearGradient id="sleepRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor="#00E5FF" />
                      <Stop offset="100%" stopColor="#7C4DFF" />
                    </SvgLinearGradient>
                  </Defs>
                  <G rotation={135} origin="100, 100">
                    <Circle
                      cx="100"
                      cy="100"
                      r="70"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${sleepArcLen} ${sleepCirc}`}
                      strokeLinecap="round"
                    />
                    <Circle
                      cx="100"
                      cy="100"
                      r="70"
                      stroke="url(#sleepRingGrad)"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${sleepProgress * sleepArcLen} ${sleepCirc}`}
                      strokeLinecap="round"
                    />
                  </G>
                </Svg>
                
                {/* Center Sleep Night Moon Icon */}
                <View style={styles.ringCenter}>
                  <MaterialCommunityIcons name="weather-night" size={46} color="#00E5FF" />
                </View>
              </View>

              {/* 4-Column Stats Grid */}
              <View style={styles.stepsStatsGrid}>
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>81%</Text>
                  <Text style={styles.stepsStatsLbl}>QUALITY</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>{currentSleep}h</Text>
                  <Text style={styles.stepsStatsLbl}>ASLEEP</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>1.5h</Text>
                  <Text style={styles.stepsStatsLbl}>AWAKE</Text>
                </View>
                <View style={styles.stepsStatsDivider} />
                <View style={styles.stepsStatsCol}>
                  <Text style={styles.stepsStatsVal}>00:22</Text>
                  <Text style={styles.stepsStatsLbl}>DEEP SLEEP</Text>
                </View>
              </View>

              <View style={styles.horizontalLine} />

              {/* Sleep History List */}
              <View style={styles.listSection}>
                <View style={styles.listHeader}>
                  <Icon name="moon-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.listTitle}>Sleep Logs History</Text>
                </View>

                <View style={styles.listWrapper}>
                  {[
                    { id: '1', rank: '01.', sleep: '7h 12m Asleep', quality: '85% sleep quality', time: '11:00 PM - 6:12 AM' },
                    { id: '2', rank: '02.', sleep: '6h 45m Asleep', quality: '78% sleep quality', time: '11:30 PM - 6:15 AM' },
                    { id: '3', rank: '03.', sleep: '5h 50m Asleep', quality: '70% sleep quality', time: '12:10 AM - 6:00 AM' },
                  ].map((item) => (
                    <View key={item.id} style={styles.stepRow}>
                      <View style={styles.stepRowLeft}>
                        <Text style={styles.rankNum}>{item.rank}</Text>
                        <View style={styles.stepDetails}>
                          <Text style={styles.stepsValText}>{item.sleep}</Text>
                          <Text style={styles.kcalText}>{item.quality}</Text>
                        </View>
                      </View>
                      <Text style={styles.distText}>{item.time}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
    fontSize: 14,
  },
  errorText: {
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryBtn: {
    backgroundColor: '#7C4DFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111115',
    height: 46,
    borderRadius: 23,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabTouch: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  inactiveTabLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  dateSliderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  dateNavBtn: {
    padding: 8,
  },
  dateNavTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 24,
  },
  caloriesSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  caloriesTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '700',
  },
  caloriesValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
  },
  consumedContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  consumedValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  targetValue: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '600',
  },
  leftText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  underText: {
    color: '#00E676',
  },
  overText: {
    color: '#FF5252',
  },
  chartWrapper: {
    marginTop: 20,
    marginBottom: 20,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  xAxisLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '700',
  },
  macrosSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  macroRow: {
    marginBottom: 18,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  macroPercent: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  macroBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  entriesSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 20,
  },
  entriesTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyLogsCard: {
    backgroundColor: '#111115',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyLogsText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  logCard: {
    backgroundColor: '#111115',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  logMealType: {
    color: '#00E676',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logCalories: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logMealName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logMacroText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  ringCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  stepsStatsCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepsStatsVal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepsStatsLbl: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  stepsStatsDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  horizontalLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  listSection: {
    marginTop: 10,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  listTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  listWrapper: {
    marginTop: 5,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNum: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
    fontWeight: 'bold',
    width: 30,
  },
  stepDetails: {
    marginLeft: 5,
  },
  stepsValText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  kcalText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  distText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DietAllLogs;
