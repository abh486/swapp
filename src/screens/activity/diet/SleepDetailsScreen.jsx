import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
  Platform,
  Modal,
  Alert,
  ScrollView,
  Switch,
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchSleepLogs,
  fetchWeeklySleep,
  logSleepEntry,
  deleteSleepEntry,
  fetchSleepTarget,
  saveSleepTarget,
} from '../../../api/sleepApi';

const { width } = Dimensions.get('window');

const SleepDetailsScreen = ({ route, navigation }) => {
  const sleepHoursToday = route?.params?.sleepHoursToday !== undefined ? route.params.sleepHoursToday : 0;
  const initialDate = route?.params?.selectedDate ? new Date(route.params.selectedDate) : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Manual sleep states
  const [sleepHours, setSleepHours] = useState(sleepHoursToday);
  const [isManual, setIsManual] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [sleepLogs, setSleepLogs] = useState([]);
  const [editingLogId, setEditingLogId] = useState(null); // null when adding, unique string when editing
  const [lastSyncedTime, setLastSyncedTime] = useState('Today, 03:38 PM');

  const [activeSleepStart, setActiveSleepStart] = useState(null);

  useEffect(() => {
    const loadActiveSleep = async () => {
      try {
        const start = await AsyncStorage.getItem('active_sleep_start_time');
        if (start) {
          setActiveSleepStart(new Date(start));
        }
      } catch (e) {
        console.warn('Failed to load active sleep start time:', e);
      }
    };
    loadActiveSleep();
  }, []);

  const handleGoToBed = async () => {
    const now = new Date();
    try {
      await AsyncStorage.setItem('active_sleep_start_time', now.toISOString());
      setActiveSleepStart(now);
      Alert.alert('Good Night 🌙', 'Sleep session started. Sleep tight!');
    } catch (e) {
      console.warn('Failed to start sleep session:', e);
    }
  };

  const handleWakeUp = async () => {
    if (!activeSleepStart) return;
    const now = new Date();
    const duration = calculateDuration(activeSleepStart, now);

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const newLog = {
      id: `realtime-${Date.now()}`,
      bedTime: activeSleepStart.toISOString(),
      wakeTime: now.toISOString(),
      duration: duration,
      date: dateKey,
      source: 'MANUAL',
    };

    const updatedLogs = [newLog, ...sleepLogs];
    const newTotal = updatedLogs.reduce((sum, item) => sum + item.duration, 0);

    try {
      await logSleepEntry(newLog);
      await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(updatedLogs));
      await AsyncStorage.setItem(`sleep_duration_${dateKey}`, newTotal.toString());
      await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(newLog));
      await AsyncStorage.removeItem('active_sleep_start_time');

      setActiveSleepStart(null);
      setSleepLogs(updatedLogs);
      setSleepHours(newTotal);
      setIsManual(true);
      loadWeeklySleepData(selectedDate);

      Alert.alert('Good Morning! ☀️', `You slept for ${Math.floor(duration)}h ${Math.round((duration - Math.floor(duration)) * 60)}m.`);
    } catch (e) {
      console.warn('Failed to log wake up:', e);
    }
  };

  // Reminders states
  const [bedTimeReminder, setBedTimeReminder] = useState(true);
  const [trackSleepReminder, setTrackSleepReminder] = useState(true);
  const [bedReminderTime, setBedReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(5, 0, 0, 0); // 05:00 AM
    return d;
  });
  const [trackReminderTime, setTrackReminderTime] = useState(() => {
    const d = new Date();
    d.setHours(13, 0, 0, 0); // 01:00 PM
    return d;
  });
  const [activeReminderPicker, setActiveReminderPicker] = useState(null); // null | 'bedReminder' | 'trackReminder'

  // Weekly analysis states
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeklyDeficit, setWeeklyDeficit] = useState(0);

  // Bedtime & Wake Time picker states
  const [bedTime, setBedTime] = useState(new Date());
  const [wakeTime, setWakeTime] = useState(new Date());
  const [activePicker, setActivePicker] = useState(null); // null | 'bed' | 'wake'

  const calculateDuration = (bed, wake) => {
    let diffMs = wake.getTime() - bed.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Crosses midnight
    }
    const totalHours = diffMs / (1000 * 60 * 60);
    return Math.min(24, Math.max(0, totalHours));
  };

  const loadReminderSettings = async () => {
    try {
      const bActive = await AsyncStorage.getItem('reminder_bedtime_active');
      if (bActive !== null) setBedTimeReminder(JSON.parse(bActive));

      const tActive = await AsyncStorage.getItem('reminder_track_active');
      if (tActive !== null) setTrackSleepReminder(JSON.parse(tActive));

      const bTime = await AsyncStorage.getItem('reminder_bedtime_val');
      if (bTime !== null) setBedReminderTime(new Date(bTime));

      const tTime = await AsyncStorage.getItem('reminder_track_val');
      if (tTime !== null) setTrackReminderTime(new Date(tTime));
    } catch (e) {
      console.warn('Failed to load reminder settings:', e);
    }
  };

  const toggleReminder = async (type) => {
    try {
      if (type === 'bedtime') {
        const nextVal = !bedTimeReminder;
        setBedTimeReminder(nextVal);
        await AsyncStorage.setItem('reminder_bedtime_active', JSON.stringify(nextVal));
      } else {
        const nextVal = !trackSleepReminder;
        setTrackSleepReminder(nextVal);
        await AsyncStorage.setItem('reminder_track_active', JSON.stringify(nextVal));
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReminderTimeChange = async (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setActiveReminderPicker(null);
      return;
    }
    if (selectedTime) {
      if (activeReminderPicker === 'bedReminder') {
        setBedReminderTime(selectedTime);
        await AsyncStorage.setItem('reminder_bedtime_val', selectedTime.toISOString());
      } else {
        setTrackReminderTime(selectedTime);
        await AsyncStorage.setItem('reminder_track_val', selectedTime.toISOString());
      }
      if (Platform.OS === 'android') {
        setActiveReminderPicker(null);
      }
    }
  };

  const loadWeeklySleepData = async (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    try {
      const weekly = await fetchWeeklySleep(dateKey);
      if (weekly && Array.isArray(weekly.days)) {
        setWeeklyData(weekly.days);
        setWeeklyDeficit(weekly.weeklyDeficit || 0);
        return;
      }
    } catch (e) {
      console.warn('[SleepDetailsScreen] Failed to load weekly sleep from API:', e);
    }
  };

  const loadSleepForDate = async (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    try {
      const sleepData = await fetchSleepLogs(dateKey);
      if (sleepData && sleepData.logs && sleepData.logs.length > 0) {
        setSleepLogs(sleepData.logs);
        setSleepHours(sleepData.totalHours);
        setIsManual(true);
      } else if (sleepData && sleepData.totalHours > 0) {
        setSleepLogs([]);
        setSleepHours(sleepData.totalHours);
        setIsManual(true);
      } else {
        setSleepLogs([]);
        setSleepHours(0);
        setIsManual(false);
      }
    } catch (e) {
      console.warn('[SleepDetailsScreen] Failed to load sleep for date:', e);
      setSleepLogs([]);
      setSleepHours(0);
      setIsManual(false);
    }
  };

  useEffect(() => {
    loadSleepForDate(selectedDate);
    loadWeeklySleepData(selectedDate);
    loadReminderSettings();
  }, [selectedDate]);

  const handleTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setActivePicker(null);
      return;
    }
    if (selectedTime) {
      if (activePicker === 'bed') {
        setBedTime(selectedTime);
      } else {
        setWakeTime(selectedTime);
      }
      if (Platform.OS === 'android') {
        setActivePicker(null);
      }
    }
  };

  const handleSaveSleep = async () => {
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth();
    const targetDate = selectedDate.getDate();

    // Reconstruct proper bedtime and wake time dates using the selected date and local times
    const savedBed = new Date(targetYear, targetMonth, targetDate, bedTime.getHours(), bedTime.getMinutes(), 0, 0);
    const savedWake = new Date(targetYear, targetMonth, targetDate, wakeTime.getHours(), wakeTime.getMinutes(), 0, 0);

    // If wake time is earlier in the day than bedtime, it crossed midnight (next day)
    if (savedWake.getTime() < savedBed.getTime()) {
      savedWake.setDate(savedWake.getDate() + 1);
    }

    const totalHours = calculateDuration(savedBed, savedWake);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const logEntryPayload = {
      id: editingLogId || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      bedTime: savedBed.toISOString(),
      wakeTime: savedWake.toISOString(),
      duration: totalHours,
      date: dateKey,
      notes: 'Manual sleep log',
      source: 'MANUAL',
    };

    let updatedLogs = [...sleepLogs];

    if (editingLogId) {
      updatedLogs = updatedLogs.map(item => {
        if (item.id === editingLogId) {
          return logEntryPayload;
        }
        return item;
      });
    } else {
      updatedLogs.push(logEntryPayload);
    }

    const newTotal = updatedLogs.reduce((sum, item) => sum + item.duration, 0);

    try {
      await logSleepEntry(logEntryPayload);
      await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(updatedLogs));
      await AsyncStorage.setItem(`sleep_duration_${dateKey}`, newTotal.toString());
      
      if (updatedLogs.length > 0) {
        await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(updatedLogs[0]));
      } else {
        await AsyncStorage.removeItem(`sleep_log_${dateKey}`);
      }

      setSleepLogs(updatedLogs);
      setSleepHours(newTotal);
      setIsManual(true);
      setShowLogModal(false);
      setEditingLogId(null);
      loadWeeklySleepData(selectedDate);
      Alert.alert('Success', 'Sleep entry saved successfully!');
    } catch (e) {
      console.error('[SleepDetailsScreen] Failed to save sleep log array:', e);
      Alert.alert('Error', 'Failed to save sleep entry.');
    }
  };

  const handleDeleteSleep = async () => {
    if (!editingLogId) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const idToDelete = editingLogId;
    const updatedLogs = sleepLogs.filter(item => item.id !== idToDelete);
    const newTotal = updatedLogs.reduce((sum, item) => sum + item.duration, 0);

    try {
      await deleteSleepEntry(idToDelete);
      await AsyncStorage.setItem(`sleep_logs_${dateKey}`, JSON.stringify(updatedLogs));
      await AsyncStorage.setItem(`sleep_duration_${dateKey}`, newTotal.toString());

      if (updatedLogs.length > 0) {
        await AsyncStorage.setItem(`sleep_log_${dateKey}`, JSON.stringify(updatedLogs[0]));
      } else {
        await AsyncStorage.removeItem(`sleep_log_${dateKey}`);
      }

      setSleepLogs(updatedLogs);
      setSleepHours(newTotal);
      setIsManual(updatedLogs.length > 0);
      setShowLogModal(false);
      setEditingLogId(null);
      loadWeeklySleepData(selectedDate);
      Alert.alert('Success', 'Sleep entry deleted.');
    } catch (e) {
      console.error('[SleepDetailsScreen] Failed to delete sleep log:', e);
      Alert.alert('Error', 'Failed to delete sleep entry.');
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleRefreshSync = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSyncedTime(`Today, ${timeStr}`);
    Alert.alert('Synced', 'Sleep synced with Apple Health!');
  };

  const handleEditLog = (item) => {
    setBedTime(new Date(item.bedTime));
    setWakeTime(new Date(item.wakeTime));
    setEditingLogId(item.id);
    setActivePicker('bed');
    setShowLogModal(true);
  };

  const handleAddNewLogPress = () => {
    const defaultBed = new Date(selectedDate);
    defaultBed.setHours(23, 0, 0, 0); // 11:00 PM of selectedDate
    
    const defaultWake = new Date(selectedDate);
    defaultWake.setDate(selectedDate.getDate() + 1); // 7:00 AM of next day
    defaultWake.setHours(7, 0, 0, 0);
    
    setBedTime(defaultBed);
    setWakeTime(defaultWake);
    setEditingLogId(null);
    setActivePicker('bed');
    setShowLogModal(true);
  };

  const handleEditPencilPress = () => {
    if (sleepLogs.length > 0) {
      handleEditLog(sleepLogs[0]);
    } else {
      handleAddNewLogPress();
    }
  };

  const getHeaderLabel = () => {
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    const dateStr = selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return isToday ? `Today, ${dateStr}` : `${selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}, ${dateStr}`;
  };

  // Mock stage visual pillars
  const stageData = [
    { bottom: 25, height: 75 },
    { bottom: 15, height: 35 },
    { bottom: 20, height: 58 },
    { bottom: 18, height: 40 },
    { bottom: 12, height: 48 },
    { bottom: 18, height: 42 },
    { bottom: 25, height: 60 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.headerDateDropdown}>
          <Text style={styles.headerDateDropdownText}>{getHeaderLabel()}</Text>
          <Icon name="caret-down" size={14} color="#FFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <View style={{ width: 40 }} />
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sleep Goal Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHoursRow}>
              <Text style={styles.totalHoursText}>
                {Math.floor(sleepHours)}h
                {Math.round((sleepHours - Math.floor(sleepHours)) * 60) > 0 && (
                  <Text style={styles.totalMinsText}> {Math.round((sleepHours - Math.floor(sleepHours)) * 60)}m</Text>
                )}
              </Text>
              <Text style={styles.goalText}> of 8h</Text>
            </View>
            <TouchableOpacity onPress={handleEditPencilPress} style={styles.editBtn}>
              <Icon name="create-outline" size={22} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, (sleepHours / 8) * 100)}%` }]} />
          </View>
        </View>

        {/* Apple Health connection status card */}
        <View style={styles.healthCardContainer}>
          <Text style={styles.healthConnectedLabel}>You are connected to</Text>
          <View style={styles.healthRow}>
            <View style={styles.healthIconContainer}>
              <View style={styles.appleHealthWhiteCard}>
                <Icon name="heart" size={16} color="#FF2D55" />
              </View>
              <View style={styles.healthTextContainer}>
                <Text style={styles.healthTextTitle}>Apple Health</Text>
                <Text style={styles.healthTextSubtitle}>Last synced: {lastSyncedTime}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleRefreshSync} style={styles.syncBtn}>
              <Icon name="sync-outline" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time Sleep Session Tracker Card */}
        <View style={styles.realtimeTrackerCard}>
          <Text style={styles.cardSectionTitle}>Active Sleep Tracker</Text>
          {activeSleepStart ? (
            <View style={styles.activeSleepContainer}>
              <View style={styles.activeSleepInfo}>
                <Icon name="moon" size={24} color="#BD93F9" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.activeSleepStatus}>Asleep since</Text>
                  <Text style={styles.activeSleepTime}>
                    {activeSleepStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.wakeUpBtn} onPress={handleWakeUp} activeOpacity={0.8}>
                <Icon name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.wakeUpBtnText}>I'm Awake (Tick)</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.goToBedContainer}>
              <Text style={styles.goToBedDesc}>Track your sleep session in real-time as you go to bed.</Text>
              <TouchableOpacity style={styles.goToBedBtn} onPress={handleGoToBed} activeOpacity={0.8}>
                <Icon name="moon-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.goToBedBtnText}>Go to Bed</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Sleep Section Header */}
        <View style={styles.mySleepHeaderRow}>
          <Text style={styles.mySleepTitle}>My Sleep</Text>
          <TouchableOpacity onPress={handleAddNewLogPress} style={styles.addLogBtnRow}>
            <Text style={styles.addLogLabelText}>Add Logs</Text>
            <View style={styles.plusIconBg}>
              <Icon name="add" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sleep Logs List */}
        <View style={styles.logListContainer}>
          {sleepLogs.map((item, idx) => {
            const bedDate = new Date(item.bedTime);
            const wakeDate = new Date(item.wakeTime);
            
            const bedTimeStr = bedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const bedDateStr = bedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
            
            const wakeTimeStr = wakeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const wakeDateStr = wakeDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

            const hrs = Math.floor(item.duration);
            const mins = Math.round((item.duration - hrs) * 60);
            const durationLabel = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;

            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.logItemContainer}
                onPress={() => handleEditLog(item)}
                activeOpacity={0.7}
              >
                {/* Duration Text */}
                <Text style={styles.logItemDurationText}>{durationLabel}</Text>
                
                {/* Columns */}
                <View style={styles.logItemColumnsRow}>
                  {/* Sleep Time */}
                  <View style={styles.logItemColumn}>
                    <Text style={styles.logItemColLabel}>Sleep Time</Text>
                    <Text style={styles.logItemColValue}>{`${bedTimeStr}, ${bedDateStr}`}</Text>
                  </View>

                  {/* Wake up Time */}
                  <View style={styles.logItemColumn}>
                    <Text style={styles.logItemColLabel}>Wake up Time</Text>
                    <Text style={styles.logItemColValue}>{`${wakeTimeStr}, ${wakeDateStr}`}</Text>
                  </View>
                </View>

                {/* Divider Line */}
                {idx < sleepLogs.length - 1 && <View style={styles.divider} />}
              </TouchableOpacity>
            );
          })}
          {sleepLogs.length === 0 && (
            <View style={styles.emptyLogsContainer}>
              <Text style={styles.emptyLogsText}>No sleep logs for this date. Tap '+' to add.</Text>
            </View>
          )}
        </View>

        {/* Reminders Card */}
        <View style={styles.remindersCard}>
          <Text style={styles.cardSectionTitle}>Reminders</Text>
          
          {/* Bed time Reminder */}
          <View style={styles.reminderRow}>
            <View>
              <Text style={styles.reminderLabel}>Bed time</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setActiveReminderPicker('bedReminder')}>
                <Text style={styles.reminderTimeText}>
                  {bedReminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <Switch
                value={bedTimeReminder}
                onValueChange={() => toggleReminder('bedtime')}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3b82f6' }}
                thumbColor={Platform.OS === 'ios' ? '#FFF' : bedTimeReminder ? '#FFF' : '#AAA'}
                style={{ marginLeft: 16 }}
              />
            </View>
          </View>

          {/* Track Sleep Reminder */}
          <View style={styles.reminderRow}>
            <View>
              <Text style={styles.reminderLabel}>Track Sleep</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setActiveReminderPicker('trackReminder')}>
                <Text style={styles.reminderTimeText}>
                  {trackReminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <Switch
                value={trackSleepReminder}
                onValueChange={() => toggleReminder('track')}
                trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#3b82f6' }}
                thumbColor={Platform.OS === 'ios' ? '#FFF' : trackSleepReminder ? '#FFF' : '#AAA'}
                style={{ marginLeft: 16 }}
              />
            </View>
          </View>
        </View>

        {/* Sleep Analysis Card */}
        <View style={styles.analysisCard}>
          <View style={styles.analysisHeaderRow}>
            <Text style={styles.cardSectionTitle}>Sleep Analysis</Text>
            <TouchableOpacity onPress={() => Alert.alert('Info', 'Weekly sleep trend')}>
              <Text style={styles.last7DaysText}>Last 7 days</Text>
            </TouchableOpacity>
          </View>

          {/* Simple custom Bar Chart */}
          <View style={styles.chartWrapper}>
            {/* Goal Dotted Line */}
            <View style={styles.goalDottedLine} />
            <Text style={styles.chartGoalLabel}>Goal: 8h</Text>

            {/* Bars */}
            <View style={styles.chartBarsContainer}>
              {weeklyData.map((day, idx) => {
                const heightPercentage = Math.min(100, (day.value / 12) * 100); // Max 12 hours for scaling
                return (
                  <View key={idx} style={styles.chartBarCol}>
                    <Text style={styles.chartBarValText}>{day.value.toFixed(1)}</Text>
                    <View style={styles.chartBarBg}>
                      <View style={[styles.chartBarFill, { height: `${heightPercentage}%` }]} />
                    </View>
                    <Text style={styles.chartBarLabelText}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Goal indicator text */}
          <View style={styles.goalStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: weeklyDeficit < 0 ? '#FF2D55' : '#34C759' }]} />
            <Text style={styles.goalStatusText}>
              {weeklyDeficit < 0 ? 'Not meeting your goal' : 'Meeting your goal'}
            </Text>
          </View>

          {/* Weekly Sleep Deficit info */}
          <View style={styles.deficitInfoRow}>
            <View>
              <Text style={styles.deficitTitleText}>Weekly Sleep Deficit</Text>
              <Text style={styles.deficitSubText}>Your Sleep Goal (8h)</Text>
            </View>
            <Text style={[styles.deficitValText, { color: weeklyDeficit < 0 ? '#FF2D55' : '#34C759' }]}>
              {weeklyDeficit < 0 ? `${weeklyDeficit}h` : `+${weeklyDeficit}h`}
            </Text>
          </View>
        </View>

        {/* Tips To Sleep Better Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardSectionTitle}>Tips To Sleep Better</Text>
          <Text style={styles.tipsDescText}>
            Increase your water intake 💧 throughout the day. Dehydration, which is the leading cause of daytime fatigue, can also disrupt your sleep patterns.
          </Text>
        </View>
      </ScrollView>

      {/* Reminders Time Picker Modal on iOS */}
      {activeReminderPicker && Platform.OS === 'ios' && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlayCentered}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={activeReminderPicker === 'bedReminder' ? bedReminderTime : trackReminderTime}
                mode="time"
                display="spinner"
                onChange={handleReminderTimeChange}
                themeVariant="dark"
              />
              <TouchableOpacity 
                style={styles.datePickerDoneBtn} 
                onPress={() => setActiveReminderPicker(null)}
              >
                <Text style={styles.datePickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Reminders Time Picker Dialog on Android */}
      {activeReminderPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={activeReminderPicker === 'bedReminder' ? bedReminderTime : trackReminderTime}
          mode="time"
          display="default"
          onChange={handleReminderTimeChange}
        />
      )}

      {/* Manual Sleep Logging Modal - Apple Health Style */}
      {showLogModal && (
        <Modal
          visible={showLogModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLogModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowLogModal(false)}>
            <View style={styles.appleHealthModalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.appleHealthBottomSheet}>
                  {/* Top Drag Handle */}
                  <View style={styles.appleHealthHandle} />

                  {/* Header Bar: Cancel - Title - Save */}
                  <View style={styles.appleHealthHeaderRow}>
                    <TouchableOpacity onPress={() => setShowLogModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.appleHealthHeaderCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.appleHealthHeaderTitle}>
                      {editingLogId ? 'Edit Sleep' : 'Add Sleep Data'}
                    </Text>
                    <TouchableOpacity onPress={handleSaveSleep} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.appleHealthHeaderSave}>Save</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                    {/* Live Sleep Summary Card */}
                    {(() => {
                      const dur = calculateDuration(bedTime, wakeTime);
                      const h = Math.floor(dur);
                      const m = Math.round((dur - h) * 60);
                      const bedStr = bedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const wakeStr = wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <View style={styles.appleHealthSummaryCard}>
                          <Text style={styles.appleHealthDateSub}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                          <View style={styles.appleHealthDurRow}>
                            <Text style={styles.appleHealthDurationVal}>{h}h {m}m</Text>
                            <Text style={styles.appleHealthDurationLabel}>Calculated Sleep</Text>
                          </View>
                          <View style={styles.appleHealthRangeBarRow}>
                            <View style={styles.appleHealthRangeItem}>
                              <Icon name="moon" size={14} color="#64D2FF" style={{ marginRight: 4 }} />
                              <Text style={styles.appleHealthRangeText}>{bedStr}</Text>
                            </View>
                            <View style={styles.appleHealthRangeTrack}>
                              <View style={styles.appleHealthRangeFill} />
                            </View>
                            <View style={styles.appleHealthRangeItem}>
                              <Icon name="sunny" size={14} color="#FFD60A" style={{ marginLeft: 4 }} />
                              <Text style={styles.appleHealthRangeText}>{wakeStr}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })()}

                    {/* Apple Health Inset Group: Went to Bed & Woke Up */}
                    <View style={styles.appleHealthGroupCard}>
                      {/* Bedtime Row */}
                      <TouchableOpacity
                        style={[
                          styles.appleHealthRow,
                          activePicker === 'bed' && styles.appleHealthRowActive
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setActivePicker(activePicker === 'bed' ? null : 'bed')}
                      >
                        <View style={styles.appleHealthRowLeft}>
                          <View style={[styles.appleHealthRowIconCircle, { backgroundColor: 'rgba(100, 210, 255, 0.15)' }]}>
                            <Icon name="moon" size={18} color="#64D2FF" />
                          </View>
                          <View>
                            <Text style={styles.appleHealthRowTitle}>Went to bed</Text>
                            <Text style={styles.appleHealthRowSub}>In Bed start time</Text>
                          </View>
                        </View>
                        <View style={[styles.appleHealthTimePill, activePicker === 'bed' && styles.appleHealthTimePillActive]}>
                          <Text style={styles.appleHealthTimePillText}>
                            {bedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Bedtime Wheel Picker */}
                      {activePicker === 'bed' && (
                        <View style={styles.appleHealthPickerWrapper}>
                          <DateTimePicker
                            value={bedTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            is24Hour={false}
                            onChange={(event, selectedTime) => {
                              if (selectedTime) setBedTime(selectedTime);
                              if (Platform.OS === 'android') setActivePicker(null);
                            }}
                            themeVariant="dark"
                            style={{ height: 160, width: '100%' }}
                          />
                        </View>
                      )}

                      <View style={styles.appleHealthRowDivider} />

                      {/* Wake Up Row */}
                      <TouchableOpacity
                        style={[
                          styles.appleHealthRow,
                          activePicker === 'wake' && styles.appleHealthRowActive
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setActivePicker(activePicker === 'wake' ? null : 'wake')}
                      >
                        <View style={styles.appleHealthRowLeft}>
                          <View style={[styles.appleHealthRowIconCircle, { backgroundColor: 'rgba(255, 214, 10, 0.15)' }]}>
                            <Icon name="sunny" size={18} color="#FFD60A" />
                          </View>
                          <View>
                            <Text style={styles.appleHealthRowTitle}>Woke up</Text>
                            <Text style={styles.appleHealthRowSub}>Asleep end time</Text>
                          </View>
                        </View>
                        <View style={[styles.appleHealthTimePill, activePicker === 'wake' && styles.appleHealthTimePillActive]}>
                          <Text style={styles.appleHealthTimePillText}>
                            {wakeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Wake Up Wheel Picker */}
                      {activePicker === 'wake' && (
                        <View style={styles.appleHealthPickerWrapper}>
                          <DateTimePicker
                            value={wakeTime}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            is24Hour={false}
                            onChange={(event, selectedTime) => {
                              if (selectedTime) setWakeTime(selectedTime);
                              if (Platform.OS === 'android') setActivePicker(null);
                            }}
                            themeVariant="dark"
                            style={{ height: 160, width: '100%' }}
                          />
                        </View>
                      )}
                    </View>

                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Android Native Time Picker */}
      {activePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={activePicker === 'bed' ? bedTime : wakeTime}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appleHealthModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  appleHealthBottomSheet: {
    backgroundColor: '#1C1C24',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
    width: '100%',
  },
  appleHealthHandle: {
    width: 38,
    height: 5,
    backgroundColor: '#3A3A42',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 14,
  },
  appleHealthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appleHealthHeaderCancel: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '600',
  },
  appleHealthHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  appleHealthHeaderSave: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '700',
  },
  appleHealthSummaryCard: {
    backgroundColor: '#2C2C38',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  appleHealthDateSub: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  appleHealthDurRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 16,
  },
  appleHealthDurationVal: {
    color: '#64D2FF',
    fontSize: 34,
    fontWeight: '800',
  },
  appleHealthDurationLabel: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '600',
  },
  appleHealthRangeBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appleHealthRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleHealthRangeText: {
    color: '#E0E0E0',
    fontSize: 13,
    fontWeight: '600',
  },
  appleHealthRangeTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  appleHealthRangeFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#64D2FF',
  },
  appleHealthGroupCard: {
    backgroundColor: '#2C2C38',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  appleHealthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appleHealthRowActive: {
    backgroundColor: 'rgba(100, 210, 255, 0.08)',
  },
  appleHealthRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appleHealthRowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleHealthRowTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  appleHealthRowSub: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  appleHealthTimePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  appleHealthTimePillActive: {
    backgroundColor: '#0A84FF',
  },
  appleHealthTimePillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  appleHealthPickerWrapper: {
    backgroundColor: '#22222E',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  appleHealthRowDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 64,
  },
  appleHealthPrimarySaveBtn: {
    backgroundColor: '#0A84FF',
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 24,
    alignSelf: 'center',
    minWidth: 180,
  },
  appleHealthPrimarySaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  appleHealthDeleteBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
    minWidth: 160,
  },
  appleHealthDeleteText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#0A1128',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerDateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDateDropdownText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingHorizontal: 24,
    marginVertical: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryHoursRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalHoursText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  totalMinsText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
  editBtn: {
    padding: 4,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  healthCardContainer: {
    backgroundColor: '#111A36',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  healthConnectedLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleHealthWhiteCard: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  healthTextContainer: {
    justifyContent: 'center',
  },
  healthTextTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  healthTextSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  syncBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mySleepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mySleepTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addLogBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLogLabelText: {
    color: '#3b82f6',
    marginRight: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  plusIconBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logListContainer: {
    paddingHorizontal: 20,
  },
  logItemContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
  },
  logItemDurationText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  logItemColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  logItemColumn: {
    flex: 1,
  },
  logItemColLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  logItemColValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
  },
  emptyLogsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyLogsText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    textAlign: 'center',
  },
  timeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeSelectorLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  timePickerTrigger: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timePickerTriggerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  inlinePickerContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 10,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  inlinePickerDoneBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  inlinePickerDoneBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calculatedSleepContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  calculatedSleepTitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  calculatedSleepVal: {
    color: '#03A9F4',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalDeleteBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logModalContainer: {
    backgroundColor: '#111A36',
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C2E5D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logModalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logModalSubtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  datePickerContainer: {
    backgroundColor: '#111A36',
    borderRadius: 16,
    padding: 16,
    width: width * 0.9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  datePickerDoneBtn: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
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
  modalSaveBtn: {
    backgroundColor: '#3b82f6',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSaveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remindersCard: {
    backgroundColor: '#111A36',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  cardSectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  reminderLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  reminderTimeText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 16,
    fontWeight: '500',
  },
  analysisCard: {
    backgroundColor: '#111A36',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  last7DaysText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  chartWrapper: {
    height: 160,
    justifyContent: 'flex-end',
    position: 'relative',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 16,
  },
  goalDottedLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24 + 40, // 8h of 12h = 2/3 height
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  chartGoalLabel: {
    position: 'absolute',
    left: 0,
    bottom: 24 + 44,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
    backgroundColor: '#111A36',
    paddingRight: 6,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    width: '100%',
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarValText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  chartBarBg: {
    height: 60,
    width: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#E2439B', // pink bar from screenshot
    borderRadius: 7,
  },
  chartBarLabelText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  goalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  goalStatusText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
  deficitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deficitTitleText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deficitSubText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  deficitValText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: '#111A36',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  tipsDescText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  realtimeTrackerCard: {
    backgroundColor: '#111A36',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1C2E5D',
  },
  activeSleepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  activeSleepInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeSleepStatus: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '500',
  },
  activeSleepTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wakeUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE822A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  wakeUpBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  goToBedContainer: {
    marginTop: 10,
  },
  goToBedDesc: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 14,
  },
  goToBedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  goToBedBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SleepDetailsScreen;
