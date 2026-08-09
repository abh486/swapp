import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import { syncLocalNotifications } from '../../utils/localNotifications';

const { width } = Dimensions.get('window');

const RemindersScreen = ({ navigation }) => {
  // Main reminders state
  const [reminders, setReminders] = useState({
    Breakfast: { enabled: true, hour: 8, minute: 0, ampm: 'AM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
    Lunch: { enabled: true, hour: 1, minute: 0, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
    Snacks: { enabled: true, hour: 4, minute: 30, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
    Dinner: { enabled: true, hour: 8, minute: 0, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
    Water: { enabled: true, hour: 9, minute: 0, ampm: 'AM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
  });

  // Edit states
  const [editingId, setEditingId] = useState('Breakfast'); // Pre-expand Breakfast to match mockup
  const [tempHour, setTempHour] = useState(8);
  const [tempMin, setTempMin] = useState(0);
  const [tempAmpm, setTempAmpm] = useState('AM');
  const [tempEnabled, setTempEnabled] = useState(true);
  const [tempRepeat, setTempRepeat] = useState(true);
  const [tempRepeatDays, setTempRepeatDays] = useState([0, 1, 2, 3, 4, 5, 6]);

  // Load reminders on mount
  useEffect(() => {
    const loadReminders = async () => {
      let loadedData = null;
      try {
        const response = await apiClient.get('/users/reminders');
        if (response.data?.success && response.data.data) {
          loadedData = response.data.data;
        }
      } catch (err) {
        console.warn('Failed to load reminders from API, falling back to local storage:', err);
      }

      if (!loadedData) {
        try {
          const saved = await AsyncStorage.getItem('user_reminders');
          if (saved) {
            loadedData = JSON.parse(saved);
          }
        } catch (err) {
          console.error('Failed to load reminders from local storage:', err);
        }
      }

      const defaultReminders = {
        Breakfast: { enabled: true, hour: 8, minute: 0, ampm: 'AM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
        Lunch: { enabled: true, hour: 1, minute: 0, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
        Snacks: { enabled: true, hour: 4, minute: 30, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
        Dinner: { enabled: true, hour: 8, minute: 0, ampm: 'PM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
        Water: { enabled: true, hour: 9, minute: 0, ampm: 'AM', repeat: true, days: [0, 1, 2, 3, 4, 5, 6] },
      };

      if (loadedData) {
        const isDataChanged = Object.keys(defaultReminders).some(key => !loadedData.hasOwnProperty(key));
        const mergedReminders = { ...defaultReminders, ...loadedData };
        setReminders(mergedReminders);
        await syncLocalNotifications(mergedReminders);

        if (isDataChanged) {
          try {
            await AsyncStorage.setItem('user_reminders', JSON.stringify(mergedReminders));
            apiClient.put('/users/reminders', mergedReminders).catch(e => 
              console.warn('Offline: failed to sync reminders to backend', e.message)
            );
          } catch (err) {
            console.error('Failed to update merged reminders in storage:', err);
          }
        }
      } else {
        // First run: sync and save defaults to AsyncStorage, local notifications, and backend
        try {
          await AsyncStorage.setItem('user_reminders', JSON.stringify(defaultReminders));
          await syncLocalNotifications(defaultReminders);
          setReminders(defaultReminders);
          // API call executed as a background catch-all so network errors do not break offline flow
          apiClient.put('/users/reminders', defaultReminders).catch(e => 
            console.warn('Offline: failed to save default reminders to backend', e.message)
          );
        } catch (err) {
          console.error('Failed to sync and save default reminders:', err);
        }
      }
    };
    loadReminders();
  }, []);

  const handleStartEdit = (id) => {
    const r = reminders[id];
    setEditingId(id);
    setTempHour(r.hour);
    setTempMin(r.minute);
    setTempAmpm(r.ampm);
    setTempEnabled(r.enabled);
    setTempRepeat(r.repeat);
    setTempRepeatDays(r.days || []);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDone = async (id) => {
    const updated = {
      ...reminders,
      [id]: {
        enabled: tempEnabled,
        hour: tempHour,
        minute: tempMin,
        ampm: tempAmpm,
        repeat: tempRepeat,
        days: tempRepeatDays,
      },
    };
    setReminders(updated);
    setEditingId(null);
    try {
      await AsyncStorage.setItem('user_reminders', JSON.stringify(updated));
      await syncLocalNotifications(updated);
      await apiClient.put('/users/reminders', updated);
    } catch (err) {
      console.error('Failed to save reminders:', err);
    }
  };

  const handleToggleSwitch = async (id) => {
    const r = reminders[id];
    const updated = {
      ...reminders,
      [id]: {
        ...r,
        enabled: !r.enabled,
      },
    };
    setReminders(updated);
    try {
      await AsyncStorage.setItem('user_reminders', JSON.stringify(updated));
      await syncLocalNotifications(updated);
      await apiClient.put('/users/reminders', updated);
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
    }
  };

  // Time Wheel Helpers
  const formatNumber = (num) => num.toString().padStart(2, '0');
  const getPrevHour = (h) => (h === 1 ? 12 : h - 1);
  const getNextHour = (h) => (h === 12 ? 1 : h + 1);
  const getPrevMin = (m) => (m === 0 ? 59 : m - 1);
  const getNextMin = (m) => (m === 59 ? 0 : m + 1);

  const toggleRepeatDay = (dayIndex) => {
    if (tempRepeatDays.includes(dayIndex)) {
      setTempRepeatDays(tempRepeatDays.filter((d) => d !== dayIndex));
    } else {
      setTempRepeatDays([...tempRepeatDays, dayIndex]);
    }
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {Object.keys(reminders).map((key) => {
          const item = reminders[key];
          const isEditing = editingId === key;

          if (isEditing) {
            return (
              <View key={key} style={styles.expandedCard}>
                {/* Header row of editing item */}
                <View style={styles.cardHeader}>
                  <Text style={styles.expandedTitle}>{key}</Text>
                  <View style={styles.headerActions}>
                    {/* Custom toggle switch */}
                    <TouchableOpacity
                      style={[styles.customSwitch, tempEnabled ? styles.switchOn : styles.switchOff]}
                      onPress={() => setTempEnabled(!tempEnabled)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.switchThumb, tempEnabled ? styles.thumbOn : styles.thumbOff]} />
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity onPress={handleCancel}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDone(key)} style={{ marginLeft: 16 }}>
                        <Text style={styles.doneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Time selection wheel UI */}
                <View style={styles.timePickerContainer}>
                  {/* Hours selector */}
                  <View style={styles.wheelColumn}>
                    <TouchableOpacity onPress={() => setTempHour(getPrevHour(tempHour))}>
                      <Text style={styles.wheelNumberInactive}>{formatNumber(getPrevHour(tempHour))}</Text>
                    </TouchableOpacity>
                    <View style={styles.wheelNumberActiveContainer}>
                      <Text style={styles.wheelNumberActive}>{formatNumber(tempHour)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setTempHour(getNextHour(tempHour))}>
                      <Text style={styles.wheelNumberInactive}>{formatNumber(getNextHour(tempHour))}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Minutes selector */}
                  <View style={styles.wheelColumn}>
                    <TouchableOpacity onPress={() => setTempMin(getPrevMin(tempMin))}>
                      <Text style={styles.wheelNumberInactive}>{formatNumber(getPrevMin(tempMin))}</Text>
                    </TouchableOpacity>
                    <View style={styles.wheelNumberActiveContainer}>
                      <Text style={styles.wheelNumberActive}>{formatNumber(tempMin)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setTempMin(getNextMin(tempMin))}>
                      <Text style={styles.wheelNumberInactive}>{formatNumber(getNextMin(tempMin))}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM toggle pill */}
                  <View style={styles.ampmContainer}>
                    <TouchableOpacity
                      style={[styles.ampmBtn, tempAmpm === 'AM' && styles.ampmBtnActive]}
                      onPress={() => setTempAmpm('AM')}
                    >
                      <Text style={[styles.ampmText, tempAmpm === 'AM' && styles.ampmTextActive]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.ampmBtn, tempAmpm === 'PM' && styles.ampmBtnActive]}
                      onPress={() => setTempAmpm('PM')}
                    >
                      <Text style={[styles.ampmText, tempAmpm === 'PM' && styles.ampmTextActive]}>PM</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Repeat Controls */}
                <TouchableOpacity
                  style={styles.repeatRow}
                  onPress={() => setTempRepeat(!tempRepeat)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.repeatCheckbox, tempRepeat && styles.repeatCheckboxChecked]}>
                    {tempRepeat && <Icon name="checkmark" size={12} color="#FFF" />}
                  </View>
                  <Text style={styles.repeatLabel}>Repeat</Text>
                </TouchableOpacity>

                {/* Days list */}
                <View style={styles.daysRow}>
                  {daysOfWeek.map((day, idx) => {
                    const isDayActive = tempRepeatDays.includes(idx);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dayCircle, isDayActive && styles.dayCircleActive]}
                        onPress={() => toggleRepeatDay(idx)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dayCircleText, isDayActive && styles.dayCircleTextActive]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }

          // Collapsed card style
          return (
            <TouchableOpacity key={key} style={styles.collapsedCard} onPress={() => handleStartEdit(key)}>
              <View style={styles.cardHeader}>
                <View style={styles.collapsedLeft}>
                  <Text style={styles.collapsedTitle}>{key}</Text>
                  <Text style={styles.collapsedSubtext}>
                    {item.enabled
                      ? `${formatNumber(item.hour)}:${formatNumber(item.minute)} ${item.ampm}${
                          item.repeat ? ' (Repeat)' : ''
                        }`
                      : 'No reminder set'}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => handleStartEdit(key)}>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
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
    padding: 16,
    paddingTop: 24,
  },
  collapsedCard: {
    backgroundColor: '#070709',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  expandedCard: {
    backgroundColor: '#070709',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsedLeft: {
    flex: 1,
  },
  collapsedTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  collapsedSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginTop: 4,
  },
  addText: {
    color: '#D500F9',
    fontSize: 16,
    fontWeight: '600',
  },
  expandedTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  cancelText: {
    color: '#D500F9',
    fontSize: 15,
    fontWeight: '600',
  },
  doneText: {
    color: '#D500F9',
    fontSize: 15,
    fontWeight: '600',
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#7C4DFF',
  },
  switchOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  wheelColumn: {
    alignItems: 'center',
    width: 60,
  },
  wheelNumberInactive: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 16,
    marginVertical: 4,
    fontWeight: '500',
  },
  wheelNumberActiveContainer: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  wheelNumberActive: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeSeparator: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 10,
    marginBottom: 2,
  },
  ampmContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    overflow: 'hidden',
    width: 110,
    height: 36,
    alignItems: 'center',
    padding: 2,
    marginLeft: 24,
  },
  ampmBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  ampmBtnActive: {
    backgroundColor: '#7C4DFF',
  },
  ampmText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '700',
  },
  ampmTextActive: {
    color: '#FFF',
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  repeatCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  repeatCheckboxChecked: {
    borderColor: '#7C4DFF',
    backgroundColor: '#7C4DFF',
  },
  repeatLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    width: '100%',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: '#7C4DFF',
  },
  dayCircleText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dayCircleTextActive: {
    color: '#FFF',
  },
});

export default RemindersScreen;
