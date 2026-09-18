import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStepCountForDate,
  getActiveEnergyBurnedForDate,
  getDistanceWalkingRunningForDate,
  getStepsHistoryLastDays,
} from '../../../utils/healthKit';

const { width } = Dimensions.get('window');

const WalkDetailsScreen = ({ route, navigation }) => {
  const stepsTodayParam = route?.params?.stepsToday || 4505;
  const [stepsToday, setStepsToday] = useState(stepsTodayParam);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [caloriesBurned, setCaloriesBurned] = useState(Math.round(stepsTodayParam * 0.045));
  const [distanceKm, setDistanceKm] = useState((stepsTodayParam * 0.0008).toFixed(2));
  const [durationStr, setDurationStr] = useState('00:16:19');
  const [topSteps, setTopSteps] = useState([
    { rank: '01.', steps: 15292, kcal: 612, distance: '13.76 KM' },
    { rank: '02.', steps: 12450, kcal: 498, distance: '11.20 KM' },
    { rank: '03.', steps: 10120, kcal: 405, distance: '9.10 KM' },
  ]);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };



  const loadMetrics = useCallback(async () => {
    console.log('[WalkDetailsScreen] loadMetrics started. selectedDate:', selectedDate.toDateString());
    try {
      const connected = await AsyncStorage.getItem('healthkit_connected');
      console.log('[WalkDetailsScreen] healthkit_connected from storage:', connected);
      if (connected === 'true' && Platform.OS === 'ios') {
        const [hkSteps, hkCalories, hkDistance] = await Promise.all([
          getStepCountForDate(selectedDate),
          getActiveEnergyBurnedForDate(selectedDate),
          getDistanceWalkingRunningForDate(selectedDate),
        ]);
        console.log('[WalkDetailsScreen] HealthKit raw output: steps =', hkSteps, 'calories =', hkCalories, 'distance =', hkDistance);

        const resolvedSteps = hkSteps || 0;
        const resolvedCalories = hkCalories || Math.round(resolvedSteps * 0.045);
        const resolvedDistance = hkDistance ? hkDistance.toFixed(2) : (resolvedSteps * 0.0008).toFixed(2);
        console.log('[WalkDetailsScreen] Resolved metrics: steps =', resolvedSteps, 'calories =', resolvedCalories, 'distance =', resolvedDistance);

        setStepsToday(resolvedSteps);
        setCaloriesBurned(resolvedCalories);
        setDistanceKm(resolvedDistance);

        const totalMins = Math.round(resolvedSteps * 0.008);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        setDurationStr(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`);

        const hkHistory = await getStepsHistoryLastDays(30);
        console.log('[WalkDetailsScreen] HealthKit history count:', hkHistory ? hkHistory.length : 0);
        if (hkHistory && hkHistory.length > 0) {
          const sorted = [...hkHistory].sort((a, b) => b.steps - a.steps);
          const topList = sorted.slice(0, 3).map((item, idx) => ({
            rank: `0${idx + 1}.`,
            steps: item.steps,
            kcal: item.kcal,
            distance: `${parseFloat(item.distance).toFixed(2)} KM`
          }));
          setTopSteps(topList);
        } else {
          setTopSteps([]);
        }
      } else {
        setStepsToday(0);
        setCaloriesBurned(0);
        setDistanceKm('0.00');
        setDurationStr('00:00:00');
        setTopSteps([]);
      }
    } catch (err) {
      console.warn('[WalkDetailsScreen] Error loading metrics:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics, activeTab]);

  const targetSteps = 10000;
  const progress = Math.min(1, stepsToday / targetSteps);

  const radius = 70;
  const strokeWidth = 10;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ * (1 - progress);

  const handlePrevDate = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'Day') {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (activeTab === 'Week') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'Day') {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (activeTab === 'Week') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const getHeaderDateText = () => {
    if (activeTab === 'Day') {
      return selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (activeTab === 'Week') {
      const endOfWeek = new Date(selectedDate);
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - 6);

      const startStr = startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const endStr = endOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          {['Day', 'Week', 'Month'].map(tab => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, isActive && styles.activeTabBtnText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Date Selector Row */}
      <View style={styles.dateSelectorRow}>
        <TouchableOpacity onPress={handlePrevDate} style={styles.arrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerTriggerBtn} activeOpacity={0.7}>
          <Text style={styles.dateTitleText}>{getHeaderDateText()}</Text>
          <Icon name="caret-down" size={13} color="#FFF" style={styles.dateCaretIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNextDate} style={styles.arrowBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent={true} animationType="fade">
          <View style={styles.modalOverlayCentered}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant="dark"
              />
              <TouchableOpacity
                style={styles.datePickerDoneBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Steps Circle Progress */}
      <View style={styles.circleWrapper}>
        <View style={styles.svgWrapper}>
          <Svg width={180} height={180} viewBox="0 0 160 160">
            {/* Trail Circle */}
            <Circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Circle Progress */}
            <Circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#7C4DFF"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </Svg>

          {/* Footsteps icon inside the ring */}
          <View style={styles.footstepsIconContainer}>
            <Icon name="footsteps" size={48} color="#FFF" />
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        {/* Calories */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {caloriesBurned}
          </Text>
          <Text style={styles.metricLabelText}>CALORIES</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Steps */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {stepsToday.toLocaleString()}
          </Text>
          <Text style={styles.metricLabelText}>STEPS</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Distance */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {distanceKm} <Text style={styles.metricUnitText}>KM</Text>
          </Text>
          <Text style={styles.metricLabelText}>DISTANCE</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Duration */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {durationStr}
          </Text>
          <Text style={styles.metricLabelText}>DURATION</Text>
        </View>
      </View>

      <View style={styles.bottomDivider} />

      {/* Your Top Step Section */}
      <View style={styles.topStepSection}>
        <View style={styles.sectionHeaderRow}>
          <Icon name="ribbon-outline" size={22} color="#FFF" />
          <Text style={styles.sectionHeaderTitle}>Your Top Step</Text>
        </View>

        {topSteps && topSteps.length > 0 ? (
          <View style={styles.topStepList}>
            {topSteps.map((item, idx) => (
              <View key={idx} style={styles.topStepRow}>
                <Text style={styles.rankText}>{item.rank}</Text>
                <View style={styles.topStepDetails}>
                  <Text style={styles.stepCountText}>{item.steps.toLocaleString()} Steps</Text>
                  <Text style={styles.kcalText}>{item.kcal} Kcal</Text>
                </View>
                <Text style={styles.distanceText}>{item.distance}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTopStepsContainer}>
            <Icon name="footsteps-outline" size={32} color="rgba(255, 255, 255, 0.2)" />
            <Text style={styles.emptyTopStepsText}>No top steps recorded yet</Text>
            <Text style={styles.emptyTopStepsSubtext}>Walk and track your activity to see your top milestones</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 3,
    width: 220,
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: '#7C4DFF',
  },
  tabBtnText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  arrowBtn: {
    padding: 8,
  },
  datePickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  dateTitleText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  dateCaretIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  svgWrapper: {
    position: 'relative',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footstepsIconContainer: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  metricValText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  metricUnitText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  metricLabelText: {
    color: 'rgba(255, 255, 255, 0.38)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  dividerLine: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bottomDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  topStepSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  topStepList: {
    marginTop: 4,
  },
  topStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  rankText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    fontWeight: 'bold',
    width: 32,
  },
  topStepDetails: {
    flex: 1,
  },
  stepCountText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  kcalText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    marginTop: 2,
  },
  distanceText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyTopStepsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTopStepsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyTopStepsSubtext: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 16,
    width: width * 0.9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  datePickerDoneBtn: {
    marginTop: 16,
    backgroundColor: '#7C4DFF',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  datePickerDoneBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalkDetailsScreen;
