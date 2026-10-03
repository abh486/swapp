import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import { syncLocalNotifications } from '../../utils/localNotifications';

const { width } = Dimensions.get('window');

const ITEM_HEIGHT = 40;
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const formatNumber = (num) => (num !== undefined && num !== null ? num.toString().padStart(2, '0') : '00');

// ─── Interactive Scrollable Time Wheel ──────────────────────────────────────────
const ScrollTimeWheel = ({
  items,
  value,
  onChange,
  onScrollStart,
  onScrollEnd,
  repetitions = 5,
}) => {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const activeIndexRef = useRef(-1);
  const middleRepetitionIndex = Math.floor(repetitions / 2);

  // Generate repeated data list for seamless infinite loop feel
  const repeatedData = useMemo(() => {
    const list = [];
    for (let r = 0; r < repetitions; r++) {
      for (let i = 0; i < items.length; i++) {
        list.push({ val: items[i], key: `${r}-${items[i]}` });
      }
    }
    return list;
  }, [items, repetitions]);

  const snapOffsets = useMemo(() => {
    return repeatedData.map((_, i) => i * ITEM_HEIGHT);
  }, [repeatedData]);

  const initialIndex = useMemo(() => {
    const baseIdx = items.indexOf(value);
    return middleRepetitionIndex * items.length + (baseIdx >= 0 ? baseIdx : 0);
  }, [value, items, middleRepetitionIndex]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    activeIndexRef.current = initialIndex;
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Initial scroll alignment on mount / value change
  useEffect(() => {
    if (isDraggingRef.current) return;
    const baseIdx = items.indexOf(value);
    if (baseIdx === -1) return;
    const targetIdx = middleRepetitionIndex * items.length + baseIdx;

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: targetIdx * ITEM_HEIGHT,
        animated: false,
      });
    }, 25);
    return () => clearTimeout(timer);
  }, [value, items, middleRepetitionIndex]);

  const checkRecenter = useCallback(
    (offsetY) => {
      const idx = Math.round(offsetY / ITEM_HEIGHT);
      const len = items.length;
      if (idx < len || idx >= (repetitions - 1) * len) {
        const positiveModulo = ((idx % len) + len) % len;
        const normalizedIdx = middleRepetitionIndex * len + positiveModulo;
        activeIndexRef.current = normalizedIdx;
        setActiveIndex(normalizedIdx);
        scrollRef.current?.scrollTo({
          y: normalizedIdx * ITEM_HEIGHT,
          animated: false,
        });
      }
    },
    [items.length, repetitions, middleRepetitionIndex]
  );

  const handleScroll = (e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const idx = Math.round(offsetY / ITEM_HEIGHT);
    if (idx >= 0 && idx < repeatedData.length) {
      if (idx !== activeIndexRef.current) {
        activeIndexRef.current = idx;
        setActiveIndex(idx);
        const selectedVal = repeatedData[idx].val;
        onChange?.(selectedVal);
      }
    }
  };

  const handleScrollBeginDrag = () => {
    isDraggingRef.current = true;
    onScrollStart?.();
  };

  const handleScrollEndDrag = (e) => {
    isDraggingRef.current = false;
    const velocity = e.nativeEvent.velocity?.y || 0;
    if (Math.abs(velocity) < 0.05) {
      checkRecenter(e.nativeEvent.contentOffset.y);
      onScrollEnd?.();
    }
  };

  const handleMomentumScrollEnd = (e) => {
    isDraggingRef.current = false;
    checkRecenter(e.nativeEvent.contentOffset.y);
    onScrollEnd?.();
  };

  const handleItemPress = (index) => {
    isDraggingRef.current = true;
    activeIndexRef.current = index;
    setActiveIndex(index);
    onChange?.(repeatedData[index].val);
    scrollRef.current?.scrollTo({
      y: index * ITEM_HEIGHT,
      animated: true,
    });
    setTimeout(() => {
      isDraggingRef.current = false;
      checkRecenter(index * ITEM_HEIGHT);
      onScrollEnd?.();
    }, 320);
  };

  return (
    <View style={styles.wheelViewport}>
      {/* Active center highlight selection frame */}
      <View style={styles.wheelSelectionBox} pointerEvents="none" />

      {/* Top subtle vignette fade */}
      <LinearGradient
        colors={['#070709', 'rgba(7, 7, 9, 0)']}
        style={styles.wheelFadeTop}
        pointerEvents="none"
      />
      {/* Bottom subtle vignette fade */}
      <LinearGradient
        colors={['rgba(7, 7, 9, 0)', '#070709']}
        style={styles.wheelFadeBottom}
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToOffsets={snapOffsets}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT,
          paddingBottom: ITEM_HEIGHT,
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onTouchStart={onScrollStart}
        onTouchEnd={onScrollEnd}
      >
        {repeatedData.map((item, index) => {
          const isSelected = index === activeIndex;
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.wheelItem}
              onPress={() => handleItemPress(index)}
              activeOpacity={0.7}
            >
              <Text
                style={
                  isSelected
                    ? styles.wheelNumberActive
                    : styles.wheelNumberInactive
                }
              >
                {formatNumber(item.val)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

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
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const scrollUnlockTimerRef = useRef(null);

  const handleWheelScrollStart = useCallback(() => {
    if (scrollUnlockTimerRef.current) clearTimeout(scrollUnlockTimerRef.current);
    setScrollEnabled(false);
    scrollUnlockTimerRef.current = setTimeout(() => {
      setScrollEnabled(true);
    }, 2500);
  }, []);

  const handleWheelScrollEnd = useCallback(() => {
    if (scrollUnlockTimerRef.current) clearTimeout(scrollUnlockTimerRef.current);
    setScrollEnabled(true);
  }, []);

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

  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let updated = { ...reminders };
    if (editingId && reminders[editingId]) {
      updated[editingId] = {
        enabled: tempEnabled,
        hour: tempHour,
        minute: tempMin,
        ampm: tempAmpm,
        repeat: tempRepeat,
        days: tempRepeatDays,
      };
    }
    setReminders(updated);
    setEditingId(null);
    try {
      await AsyncStorage.setItem('user_reminders', JSON.stringify(updated));
      await syncLocalNotifications(updated);
      await apiClient.put('/users/reminders', updated);
    } catch (err) {
      console.error('Failed to save reminders:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async () => {
    await handleSaveAll();
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


  const toggleRepeatDay = (dayIndex) => {
    if (tempRepeatDays.includes(dayIndex)) {
      setTempRepeatDays(tempRepeatDays.filter((d) => d !== dayIndex));
    } else {
      setTempRepeatDays([...tempRepeatDays, dayIndex]);
    }
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.75}
        >
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSaveAll}
          activeOpacity={0.8}
          disabled={saving}
        >
          <LinearGradient
            colors={['#EE822A', '#8F5D98', '#2E4D9F']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
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

                {/* Time selection scrollable wheel UI */}
                <View style={styles.timePickerContainer}>
                  {/* Hours scrollable wheel */}
                  <ScrollTimeWheel
                    key={`${key}-hour`}
                    items={HOURS}
                    value={tempHour}
                    onChange={setTempHour}
                    repetitions={5}
                    onScrollStart={handleWheelScrollStart}
                    onScrollEnd={handleWheelScrollEnd}
                  />

                  <Text style={styles.timeSeparator}>:</Text>

                  {/* Minutes scrollable wheel */}
                  <ScrollTimeWheel
                    key={`${key}-min`}
                    items={MINUTES}
                    value={tempMin}
                    onChange={setTempMin}
                    repetitions={3}
                    onScrollStart={handleWheelScrollStart}
                    onScrollEnd={handleWheelScrollEnd}
                  />

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
    paddingTop: Platform.OS === 'android' ? 26 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveHeaderBtn: {
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 68,
  },
  saveHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    color: '#EE822A',
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
    color: '#8A8496',
    fontSize: 15,
    fontWeight: '600',
  },
  doneText: {
    color: '#EE822A',
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
    backgroundColor: '#EE822A',
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
    marginVertical: 20,
  },
  wheelViewport: {
    width: 60,
    height: 120,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelSelectionBox: {
    position: 'absolute',
    top: 40,
    left: 2,
    right: 2,
    height: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 1,
  },
  wheelFadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 2,
  },
  wheelFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 2,
  },
  wheelItem: {
    height: 40,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelNumberInactive: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 16,
    fontWeight: '500',
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
    marginLeft: 20,
  },
  ampmBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  ampmBtnActive: {
    backgroundColor: '#EE822A',
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
    borderColor: '#EE822A',
    backgroundColor: '#EE822A',
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
    backgroundColor: '#EE822A',
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
