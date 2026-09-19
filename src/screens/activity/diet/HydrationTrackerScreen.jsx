import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchHydrationLogs,
  addWaterLog,
  removeWaterLog,
  getHydrationTarget,
  setHydrationTarget,
} from '../../../redux/actions/hydrationActions';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Custom color palette matching screenshot
const BG_DARK = '#070C10';
const CARD_BG = '#0F1A22';
const CARD_BORDER = '#1B2C38';
const CYAN_ACCENT = '#38B2AC';
const CYAN_LIGHT = '#38BDF8';
const CYAN_OTHER = '#114B5C';
const TEXT_MUTED = '#94A3B8';
const TEXT_MAIN = '#FFFFFF';

// ── Animated Water Wave Background Component ──
const AnimatedWaterWave = ({ percentage }) => {
  const targetPercent = Math.min(100, Math.max(0, percentage));
  const heightAnim = useSharedValue(targetPercent);
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);

  useEffect(() => {
    heightAnim.value = withSpring(targetPercent, { damping: 14, stiffness: 75 });
  }, [targetPercent]);

  useEffect(() => {
    wave1.value = withRepeat(
      withTiming(25, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    wave2.value = withRepeat(
      withTiming(-25, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const maxHeight = 270;
    const currentH = (heightAnim.value / 100) * maxHeight;
    return {
      height: Math.max(0, currentH),
      opacity: heightAnim.value > 0 ? 1 : 0,
    };
  });

  const wave1Style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: wave1.value },
        { scaleY: 1 + wave1.value / 250 },
      ],
    };
  });

  const wave2Style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: wave2.value },
        { scaleY: 1 + wave2.value / 250 },
      ],
    };
  });

  const svgW = width + 80;

  return (
    <Animated.View style={[styles.waterWaveWrapper, animatedStyle]} pointerEvents="none">
      {/* Wave 2 (Background soft liquid layer) */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: -40, right: -40 }, wave2Style]}>
        <Svg width={svgW} height={280} viewBox={`0 0 ${svgW} 280`}>
          <Defs>
            <LinearGradient id="waterGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#072A38" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M 0 40 C ${svgW * 0.3} 10, ${svgW * 0.7} 60, ${svgW} 35 L ${svgW} 280 L 0 280 Z`}
            fill="url(#waterGrad2)"
          />
        </Svg>
      </Animated.View>

      {/* Wave 1 (Foreground main liquid wave) */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: -40, right: -40 }, wave1Style]}>
        <Svg width={svgW} height={280} viewBox={`0 0 ${svgW} 280`}>
          <Defs>
            <LinearGradient id="waterGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.90" />
              <Stop offset="35%" stopColor="#0284C7" stopOpacity="0.82" />
              <Stop offset="75%" stopColor="#0369A1" stopOpacity="0.65" />
              <Stop offset="100%" stopColor="#072A38" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Path
            d={`M 0 30 C ${svgW * 0.25} 5, ${svgW * 0.75} 50, ${svgW} 20 L ${svgW} 280 L 0 280 Z`}
            fill="url(#waterGrad1)"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

// ── Animated Automatic Left (1st Dot) to Right (Last Dot) Line (Stops at Last Dot) ──
const AnimatedTimelineTrack = ({ percentage }) => {
  const sweepProgress = useSharedValue(0);

  useEffect(() => {
    // Automatically move blue line from 1st dot (0%) to last dot (100%) and stop at the last dot (slower speed)
    sweepProgress.value = 0;
    sweepProgress.value = withTiming(100, {
      duration: 3200,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const sweepStyle = useAnimatedStyle(() => {
    return {
      width: `${sweepProgress.value}%`,
    };
  });

  return (
    <View style={styles.timelineContainer}>
      {/* Background Track Line */}
      <View style={styles.timelineLineTrack} />

      {/* Automatic Blue Line Moving from 1st Dot (Left) to Last Dot (Right) and Stopping */}
      <Animated.View style={[styles.timelineLineActive, sweepStyle]} />

      {/* Node Dots */}
      <View style={styles.nodesRow}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const nodeThreshold = (i / 6) * 100;
          const isAchieved = percentage >= nodeThreshold && percentage > 0;
          return (
            <AnimatedTimelineNode
              key={i}
              active={isAchieved}
              index={i}
              sweepProgress={sweepProgress}
            />
          );
        })}
      </View>
    </View>
  );
};

const AnimatedTimelineNode = ({ active, index, sweepProgress }) => {
  const nodePercent = (index / 6) * 100;

  const nodeAnimatedStyle = useAnimatedStyle(() => {
    const isPassed = sweepProgress.value >= nodePercent;
    const isNearSweep = Math.abs(sweepProgress.value - nodePercent) < 10;
    return {
      transform: [{ scale: isNearSweep ? 1.4 : 1.0 }],
      backgroundColor: active || isPassed ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
      borderColor: active || isPassed ? '#38BDF8' : 'transparent',
    };
  });

  return <Animated.View style={[styles.timelineNode, nodeAnimatedStyle]} />;
};

const HydrationTrackerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const reduxHydration = useSelector((state) => state.hydration || {});

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Core States
  const [totalMl, setTotalMl] = useState(0); // stored in mL
  const [targetMl, setTargetMl] = useState(4000); // default 4.00 L = 4000 mL
  const [todayLogs, setTodayLogs] = useState([]); // array of { id, amount, timestamp }

  // Sync Redux state with component state
  useEffect(() => {
    if (reduxHydration.logs !== undefined) setTodayLogs(reduxHydration.logs);
    if (reduxHydration.totalMl !== undefined) setTotalMl(reduxHydration.totalMl);
    if (reduxHydration.targetMl !== undefined) {
      setTargetMl(reduxHydration.targetMl === 2500 ? 4000 : reduxHydration.targetMl);
    }
  }, [reduxHydration]);

  // Period Toggle for Progress Chart ('M' or 'Y')
  const [progressPeriod, setProgressPeriod] = useState('M');

  // Stats States
  const [thisWeekTotal, setThisWeekTotal] = useState(0);
  const [dailyAvg, setDailyAvg] = useState(0);
  const [hourlyAvg, setHourlyAvg] = useState(0);

  // Modals
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [targetInput, setTargetInput] = useState('4000');
  const [customInput, setCustomInput] = useState('');

  // Storage Keys
  const TARGET_KEY = 'water_target_ml';

  const dateKey = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateKey === todayStr;
  }, [dateKey]);

  // Load target configuration via Redux
  useEffect(() => {
    dispatch(getHydrationTarget());
  }, [dispatch]);

  // Fetch daily data & logs via Redux whenever dateKey changes
  useEffect(() => {
    dispatch(fetchHydrationLogs(dateKey));
  }, [dispatch, dateKey]);

  // Fetch Weekly & Monthly Stats
  useEffect(() => {
    const calculateStats = async () => {
      try {
        let weekSum = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          const val = await AsyncStorage.getItem(`water_intake_${key}`);
          if (val) {
            const num = parseFloat(val);
            if (!isNaN(num)) {
              const ml = num <= 50 ? Math.round(num * 1000) : Math.round(num);
              weekSum += ml;
            }
          }
        }
        setThisWeekTotal(weekSum);
        setDailyAvg(Math.round(weekSum / 7));
      } catch (err) {
        console.error('Failed to calculate stats:', err);
      }
    };
    calculateStats();
  }, [totalMl, dateKey]);

  // Hourly Average calculation
  useEffect(() => {
    if (totalMl > 0) {
      setHourlyAvg(Math.round(totalMl / 14));
    } else {
      setHourlyAvg(0);
    }
  }, [totalMl]);

  // Calculations
  const percentage = useMemo(() => {
    if (!targetMl || targetMl <= 0) return 0;
    return Math.min(100, Math.round((totalMl / targetMl) * 100));
  }, [totalMl, targetMl]);

  const remainingLiters = useMemo(() => {
    const rem = Math.max(0, targetMl - totalMl);
    return (rem / 1000).toFixed(2);
  }, [totalMl, targetMl]);

  const targetLiters = useMemo(() => {
    return (targetMl / 1000).toFixed(2);
  }, [targetMl]);

  const formattedTotalNumber = useMemo(() => {
    return totalMl.toLocaleString('en-US');
  }, [totalMl]);

  // Dynamic encourage message matching screenshot
  const encourageMessage = useMemo(() => {
    if (totalMl === 0) return 'Start your day with a drink!';
    if (percentage < 30) return "Great start! Keep sipping water.";
    if (percentage < 70) return "Halfway there! You're doing great.";
    if (percentage < 100) return 'Almost at your goal! Keep it up!';
    return '🎉 Congratulations! Daily goal achieved!';
  }, [totalMl, percentage]);

  // Save new drink log via Redux Action
  const handleAddDrink = async (amountMl) => {
    if (isNaN(amountMl) || amountMl <= 0) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dispatch(addWaterLog({
      amountMl,
      dateKey,
      timestamp: timeStr,
      notes: `Quick add ${amountMl} mL`,
    }));
  };

  // Delete a drink log via Redux Action
  const handleDeleteLog = async (idToDelete) => {
    const targetEntry = todayLogs.find((item) => item.id === idToDelete);
    if (!targetEntry) return;

    dispatch(removeWaterLog(idToDelete, targetEntry.amount, dateKey));
  };

  // Save new target via Redux Action
  const handleSaveTarget = async () => {
    const val = parseInt(targetInput, 10);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target in mL.');
      return;
    }
    dispatch(setHydrationTarget(val));
    setSettingsModalVisible(false);
  };

  // Submit custom amount
  const handleCustomSubmit = () => {
    const val = parseInt(customInput, 10);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid water volume in mL.');
      return;
    }
    handleAddDrink(val);
    setCustomInput('');
    setCustomModalVisible(false);
  };

  // Date selection actions
  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const formattedDateHeader = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateKey === today.toISOString().split('T')[0]) {
      return 'Today';
    } else if (dateKey === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    } else {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }, [selectedDate, dateKey]);

  // Dynamic progress chart date labels
  const progressDateLabels = useMemo(() => {
    if (progressPeriod === 'M') {
      const today = new Date();
      const d1 = new Date(today); d1.setDate(today.getDate() - 21);
      const d2 = new Date(today); d2.setDate(today.getDate() - 14);
      const d3 = new Date(today); d3.setDate(today.getDate() - 7);
      const fmt = (d) => `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
      return [fmt(d1), fmt(d2), fmt(d3), fmt(today)];
    } else {
      return ['Q1', 'Q2', 'Q3', 'Q4'];
    }
  }, [progressPeriod]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="chevron-back" size={24} color={TEXT_MAIN} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Water Minder</Text>

        <TouchableOpacity
          onPress={() => {
            setTargetInput(String(targetMl));
            setSettingsModalVisible(true);
          }}
          style={styles.iconBtnTranslucent}
        >
          <Icon name="settings-sharp" size={20} color={TEXT_MAIN} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── Dashboard Card with Animated Water Wave Background ── */}
        <View style={styles.dashboardSection}>
          {/* Animated Water Wave Background Fill */}
          <AnimatedWaterWave percentage={percentage} />

          {/* Foreground Overlay Content */}
          <View style={styles.dashboardForeground}>
            {/* Target Tag */}
            <View style={styles.targetRow}>
              <MaterialCommunityIcons name="target" size={16} color={CYAN_ACCENT} />
              <Text style={styles.targetTagText}>
                TARGET: {targetLiters} L  ·  <Text style={styles.targetPercentText}>{percentage}%</Text>
              </Text>
            </View>

            {/* Main Intake Large Display */}
            <View style={styles.intakeDisplayRow}>
              <Text style={styles.mainIntakeNumber}>{formattedTotalNumber}</Text>
              <Text style={styles.mainIntakeUnit}>mL</Text>
            </View>

            {/* Remaining Subtitle */}
            <Text style={styles.remainingText}>{remainingLiters} L remaining</Text>

            {/* Horizontal Timeline Bar with Left-to-Right Animated Line & Popping Nodes */}
            <AnimatedTimelineTrack percentage={percentage} />

            {/* Dynamic Encourage Subtext */}
            <Text style={styles.encourageText}>{encourageMessage}</Text>
          </View>
        </View>

        {/* ── Quick Add Section ── */}
        <View style={styles.sectionHeaderRow}>
          <MaterialCommunityIcons name="wave" size={20} color={CYAN_ACCENT} />
          <Text style={styles.sectionTitleText}>Quick Add</Text>
        </View>

        <View style={styles.quickAddGrid}>
          {/* 250 mL */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => handleAddDrink(250)}
          >
            <MaterialCommunityIcons name="water" size={20} color={CYAN_LIGHT} />
            <Text style={styles.quickAddText}>250 mL</Text>
          </TouchableOpacity>

          {/* 350 mL */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => handleAddDrink(350)}
          >
            <MaterialCommunityIcons name="water" size={20} color={CYAN_LIGHT} />
            <Text style={styles.quickAddText}>350 mL</Text>
          </TouchableOpacity>

          {/* 500 mL */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => handleAddDrink(500)}
          >
            <MaterialCommunityIcons name="water" size={20} color={CYAN_LIGHT} />
            <Text style={styles.quickAddText}>500 mL</Text>
          </TouchableOpacity>

          {/* 750 mL */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => handleAddDrink(750)}
          >
            <MaterialCommunityIcons name="water" size={20} color={CYAN_LIGHT} />
            <Text style={styles.quickAddText}>750 mL</Text>
          </TouchableOpacity>

          {/* 1 L */}
          <TouchableOpacity
            style={styles.quickAddCard}
            activeOpacity={0.8}
            onPress={() => handleAddDrink(1000)}
          >
            <MaterialCommunityIcons name="water" size={20} color={CYAN_LIGHT} />
            <Text style={styles.quickAddText}>1 L</Text>
          </TouchableOpacity>

          {/* Other (Custom) */}
          <TouchableOpacity
            style={[styles.quickAddCard, styles.quickAddOtherCard]}
            activeOpacity={0.8}
            onPress={() => setCustomModalVisible(true)}
          >
            <View style={styles.otherIconBadge}>
              <MaterialCommunityIcons name="view-grid" size={18} color={TEXT_MAIN} />
            </View>
            <Text style={styles.quickAddText}>Other</Text>
          </TouchableOpacity>
        </View>

        {/* ── Today's Added Drinks Section ── */}
        <View style={styles.logsHeaderRow}>
          <View style={styles.logsHeaderLeft}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={CYAN_LIGHT} />
            <Text style={styles.sectionTitleText}>Today's added drinks</Text>
          </View>

          <TouchableOpacity
            style={styles.logsBtnPill}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color={TEXT_MAIN} />
            <Text style={styles.logsBtnText}>
              {isToday ? 'Logs' : formattedDateHeader}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Drink Cards List matching Screenshot 3 */}
        {todayLogs.length === 0 ? (
          <Text style={styles.emptyLogsText}>No drinks added today.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.drinkCardsHorizontalContainer}
          >
            {todayLogs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.drinkCardItem}
                activeOpacity={0.85}
                onLongPress={() => {
                  Alert.alert(
                    'Delete Log',
                    `Remove ${item.amount} mL logged at ${item.timestamp}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteLog(item.id) },
                    ]
                  );
                }}
              >
                <View style={styles.drinkCardBadge}>
                  <MaterialCommunityIcons name="water" size={24} color={CYAN_LIGHT} />
                </View>
                <Text style={styles.drinkCardTitle}>Water</Text>
                <Text style={styles.drinkCardAmount}>
                  {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)} L` : `${item.amount} mL`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── 📊 Stats Section ── */}
        <View style={styles.statsHeaderRow}>
          <MaterialCommunityIcons name="chart-bar" size={22} color={CYAN_LIGHT} />
          <Text style={styles.sectionTitleText}>Stats</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* TOTAL */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <MaterialCommunityIcons name="water" size={15} color={CYAN_LIGHT} />
              <Text style={styles.statTagText}>TOTAL</Text>
            </View>
            <Text style={styles.statValueText}>{totalMl} mL</Text>
          </View>

          {/* HOURLY AVG. */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <MaterialCommunityIcons name="clock-outline" size={15} color={CYAN_LIGHT} />
              <Text style={styles.statTagText}>HOURLY AVG.</Text>
            </View>
            <Text style={styles.statValueText}>{hourlyAvg} mL</Text>
          </View>

          {/* DAILY AVG. */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <MaterialCommunityIcons name="calendar-month-outline" size={15} color={CYAN_LIGHT} />
              <Text style={styles.statTagText}>DAILY AVG.</Text>
            </View>
            <Text style={styles.statValueText}>{dailyAvg} mL</Text>
          </View>

          {/* THIS WEEK */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <MaterialCommunityIcons name="book-open-outline" size={15} color={CYAN_LIGHT} />
              <Text style={styles.statTagText}>THIS WEEK</Text>
            </View>
            <Text style={styles.statValueText}>{thisWeekTotal} mL</Text>
          </View>
        </View>

        {/* ── 📈 Progress Section ── */}
        <View style={styles.progressHeaderRow}>
          <View style={styles.progressHeaderLeft}>
            <MaterialCommunityIcons name="trending-up" size={22} color={CYAN_LIGHT} />
            <Text style={styles.sectionTitleText}>Progress</Text>
          </View>

          {/* M / Y Segmented Toggle */}
          <View style={styles.periodToggleOuter}>
            <TouchableOpacity
              style={[styles.periodPill, progressPeriod === 'M' && styles.periodPillActive]}
              onPress={() => setProgressPeriod('M')}
            >
              <Text style={[styles.periodPillText, progressPeriod === 'M' && styles.periodPillTextActive]}>
                M
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodPill, progressPeriod === 'Y' && styles.periodPillActive]}
              onPress={() => setProgressPeriod('Y')}
            >
              <Text style={[styles.periodPillText, progressPeriod === 'Y' && styles.periodPillTextActive]}>
                Y
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Chart Container */}
        <View style={styles.chartContainerCard}>
          <View style={styles.chartDashedGrid}>
            {[0, 1, 2, 3].map((idx) => (
              <View key={idx} style={styles.dashedVerticalLine} />
            ))}
          </View>

          {/* Trend Node Line */}
          <View style={styles.chartTrendLineContainer}>
            <View style={styles.chartTrendLine} />
            <View style={styles.chartNodesRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((nIdx) => (
                <View key={nIdx} style={styles.chartNodePoint} />
              ))}
            </View>
          </View>

          {/* Date Axis Labels */}
          <View style={styles.chartDateAxisRow}>
            {progressDateLabels.map((lbl, idx) => (
              <Text key={idx} style={styles.chartAxisLabel}>
                {lbl}
              </Text>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Date Picker Modal ── */}
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

      {/* ── Settings / Target Modal ── */}
      <Modal visible={settingsModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayCentered}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Hydration Settings</Text>
            <Text style={styles.modalSubtitle}>Set your daily water target in mL</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={targetInput}
              onChangeText={setTargetInput}
              placeholder="e.g. 4000"
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveTarget}>
                <Text style={styles.modalSaveText}>Save Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Amount (Other) Modal ── */}
      <Modal visible={customModalVisible} transparent={true} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlayCentered}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom Drink Volume</Text>
            <Text style={styles.modalSubtitle}>Enter volume in mL (e.g. 600)</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={customInput}
              onChangeText={setCustomInput}
              placeholder="e.g. 600"
              placeholderTextColor="#64748B"
              autoFocus={true}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setCustomInput('');
                  setCustomModalVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCustomSubmit}>
                <Text style={styles.modalSaveText}>Add Drink</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_DARK,
  },

  /* Top Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },
  iconBtnTranslucent: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  /* Main Dashboard Section with Animated Water Wave */
  dashboardSection: {
    marginTop: 10,
    marginBottom: 28,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 250,
  },
  waterWaveWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: width,
    zIndex: 1,
  },
  dashboardForeground: {
    padding: 16,
    zIndex: 10,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  targetTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: CYAN_ACCENT,
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  targetPercentText: {
    color: CYAN_LIGHT,
  },
  intakeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  mainIntakeNumber: {
    fontSize: 58,
    fontWeight: '800',
    color: TEXT_MAIN,
    letterSpacing: -1,
  },
  mainIntakeUnit: {
    fontSize: 22,
    fontWeight: '500',
    color: TEXT_MAIN,
    marginLeft: 8,
  },
  remainingText: {
    fontSize: 16,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginBottom: 20,
  },

  /* Timeline line & nodes */
  timelineContainer: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
    marginBottom: 10,
  },
  timelineLineTrack: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 2,
  },
  timelineLineBase: {
    position: 'absolute',
    left: 4,
    height: 3,
    backgroundColor: '#0284C7',
    borderRadius: 2,
    zIndex: 1,
  },
  timelineLineActive: {
    position: 'absolute',
    left: 4,
    height: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
    zIndex: 2,
  },
  sweepClipContainer: {
    position: 'absolute',
    left: 4,
    right: 4,
    height: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    zIndex: 3,
  },
  timelineSweepLight: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  nodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    zIndex: 5,
  },
  timelineNode: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  timelineNodeActive: {
    backgroundColor: '#FFFFFF',
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  encourageText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
  },

  /* Quick Add Grid */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginLeft: 8,
  },
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickAddCard: {
    width: (width - 48) / 2,
    height: 64,
    backgroundColor: CARD_BG,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickAddOtherCard: {
    backgroundColor: CYAN_OTHER,
    borderColor: '#176B82',
  },
  otherIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  quickAddText: {
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginLeft: 8,
  },

  /* Today's Added Drinks Section */
  logsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logsBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12222B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  logsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MAIN,
    marginLeft: 6,
  },
  emptyLogsText: {
    fontSize: 15,
    color: TEXT_MUTED,
    marginTop: 8,
    marginBottom: 32,
  },

  /* Drink Cards Horizontal Container */
  drinkCardsHorizontalContainer: {
    gap: 12,
    marginBottom: 32,
    paddingRight: 10,
  },
  drinkCardItem: {
    width: 95,
    height: 115,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  drinkCardBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#112933',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  drinkCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  drinkCardAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_MAIN,
  },

  /* ── 📊 Stats Section ── */
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: CYAN_LIGHT,
    marginLeft: 6,
    letterSpacing: 0.6,
  },
  statValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_MAIN,
  },

  /* ── 📈 Progress Section ── */
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodToggleOuter: {
    flexDirection: 'row',
    backgroundColor: '#12222B',
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  periodPill: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: '#3E4B56',
  },
  periodPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  periodPillTextActive: {
    color: TEXT_MAIN,
  },

  /* Progress Chart Card */
  chartContainerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    height: 200,
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 20,
  },
  chartDashedGrid: {
    position: 'absolute',
    top: 20,
    bottom: 45,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dashedVerticalLine: {
    width: 1,
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
  },
  chartTrendLineContainer: {
    position: 'absolute',
    top: 85,
    left: 20,
    right: 20,
    justifyContent: 'center',
  },
  chartTrendLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  chartNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartNodePoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  chartDateAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 'auto',
  },
  chartAxisLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
  },

  /* Modal Overlay */
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F1820',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_MAIN,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: '#16242F',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: TEXT_MAIN,
    fontSize: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalCancelText: {
    color: TEXT_MUTED,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: CYAN_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalSaveText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Date Picker iOS Modal */
  datePickerContainer: {
    backgroundColor: '#16242F',
    borderRadius: 20,
    padding: 16,
    width: '90%',
  },
  datePickerDoneBtn: {
    backgroundColor: CYAN_ACCENT,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  datePickerDoneBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HydrationTrackerScreen;
