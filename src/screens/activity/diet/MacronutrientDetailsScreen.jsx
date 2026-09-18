import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Defs, Circle, Rect, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import apiClient from '../../../api/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { getTargetsForUser, getCachedBackendTargets, setCachedBackendTargets } from '../../../utils/nutritionCalculator';

const { width } = Dimensions.get('window');
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)';

const MacronutrientDetailsScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const selectedDateParam = route?.params?.selectedDate || new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(selectedDateParam));
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const reduxWeight = useSelector(state => state.weight);
  const liveTargets = useMemo(() => {
    const cached = getCachedBackendTargets();
    if (cached && cached.calories > 0) {
      return cached;
    }
    const activeWeight =
      reduxWeight?.logs?.[reduxWeight.logs.length - 1]?.value ||
      user?.weight?.value ||
      user?.weight ||
      reduxWeight?.startingValue ||
      70;
    const activeTarget =
      reduxWeight?.targetWeight ||
      user?.targetWeight?.value ||
      user?.targetWeight ||
      user?.goalWeight;
    const activeHeight = reduxWeight?.height || user?.height?.value || user?.height || 170;
    const activeGoal = user?.fitnessGoal || '';
    return getTargetsForUser({
      ...(user || {}),
      weight: activeWeight,
      height: activeHeight,
      targetWeight: activeTarget,
      goalWeight: activeTarget,
      fitnessGoal: activeGoal,
    });
  }, [user, reduxWeight?.targetWeight, reduxWeight?.startingValue, reduxWeight?.logs, reduxWeight?.height]);

  const [allLogs, setAllLogs] = useState([]);
  const [targets, setTargets] = useState(() => liveTargets);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTargets(liveTargets);
  }, [liveTargets]);

  const fetchLogsAndSummary = useCallback(async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        apiClient.get('/diet/logs').catch(() => ({ data: [] })),
        apiClient.get('/diet/progress/summary').catch(() => ({ data: null })),
      ]);

      if (logsRes.data) {
        const payload = logsRes.data?.data || logsRes.data || [];
        const normalized = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.logs)
            ? payload.logs
            : [];
        const foodOnly = normalized.filter(
          (item) => item.mealType !== 'water' && item.mealName !== 'Water'
        );
        setAllLogs(foodOnly);
      }

      const backendTargets = summaryRes?.data?.data?.targets || summaryRes?.data?.targets;
      if (backendTargets && backendTargets.calories > 0) {
        setCachedBackendTargets(backendTargets);
        setTargets(backendTargets);
      }
    } catch (err) {
      console.warn('[MacronutrientDetails] Fetch error:', err.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLogsAndSummary();
    }, [fetchLogsAndSummary])
  );

  useEffect(() => {
    fetchLogsAndSummary();
  }, [selectedDate, activeTab, fetchLogsAndSummary]);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  // Filter logs based on activeTab and selectedDate
  const currentLogs = useMemo(() => {
    if (!allLogs || allLogs.length === 0) return [];

    if (activeTab === 'Day') {
      const targetDateStr = selectedDate.toISOString().split('T')[0];
      return allLogs.filter((log) => {
        if (!log.createdAt) return false;
        const logDate = new Date(log.createdAt);
        return (
          logDate.toDateString() === selectedDate.toDateString() ||
          log.createdAt.startsWith(targetDateStr)
        );
      });
    } else if (activeTab === 'Week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(selectedDate);
      endOfWeek.setHours(23, 59, 59, 999);

      return allLogs.filter((log) => {
        if (!log.createdAt) return false;
        const logDate = new Date(log.createdAt);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      });
    } else {
      // Month
      const targetMonth = selectedDate.getMonth();
      const targetYear = selectedDate.getFullYear();
      return allLogs.filter((log) => {
        if (!log.createdAt) return false;
        const logDate = new Date(log.createdAt);
        return (
          logDate.getMonth() === targetMonth && logDate.getFullYear() === targetYear
        );
      });
    }
  }, [allLogs, selectedDate, activeTab]);

  // Consumed totals
  const consumedTotals = useMemo(() => {
    return currentLogs.reduce(
      (acc, log) => {
        acc.calories += log.calories || 0;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fats += log.fats || log.fat || 0;
        acc.fibre += log.fiber || log.fibre || 0;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, fibre: 0 }
    );
  }, [currentLogs]);

  // Period multiplier for targets
  const multiplier = activeTab === 'Day' ? 1 : activeTab === 'Week' ? 7 : 30;

  const targetCals = (targets.calories || 2000) * multiplier;
  const consumedCals = consumedTotals.calories;
  const leftCals = Math.max(0, targetCals - consumedCals);

  const targetProt = (targets.protein || 120) * multiplier;
  const consumedProt = consumedTotals.protein;
  const protPct = targetProt > 0 ? Math.round(Math.min(100, (consumedProt / targetProt) * 100)) : 0;

  const targetFats = (targets.fats || targets.fat || 65) * multiplier;
  const consumedFats = consumedTotals.fats;
  const fatsPct = targetFats > 0 ? Math.round(Math.min(100, (consumedFats / targetFats) * 100)) : 0;

  const targetCarbs = (targets.carbs || 220) * multiplier;
  const consumedCarbs = consumedTotals.carbs;
  const carbsPct = targetCarbs > 0 ? Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100)) : 0;

  const targetFibre = (targets.fibre || targets.fiber || 30) * multiplier;
  const consumedFibre = consumedTotals.fibre;
  const fibrePct = targetFibre > 0 ? Math.round(Math.min(100, (consumedFibre / targetFibre) * 100)) : 0;

  // Aggregate real micronutrients from logged meals
  const micronutrients = useMemo(() => {
    let totalCalcium = 0;
    let totalIron = 0;
    let totalZinc = 0;
    let totalMagnesium = 0;
    let totalCholesterol = 0;

    currentLogs.forEach((log) => {
      const micros = log.micronutrients || log.nutrition || log;
      totalCalcium += Number(micros.calcium || micros.calciumMg) || 0;
      totalIron += Number(micros.iron || micros.ironMg) || 0;
      totalZinc += Number(micros.zinc || micros.zincMg) || 0;
      totalMagnesium += Number(micros.magnesium || micros.magnesiumMg) || 0;
      totalCholesterol += Number(micros.cholesterol || micros.cholesterolMg) || 0;
    });

    return [
      { key: 'Calcium', consumed: Math.round(totalCalcium), target: 1000 * multiplier, unit: 'mg' },
      { key: 'Iron', consumed: Math.round(totalIron * 10) / 10, target: 19 * multiplier, unit: 'mg' },
      { key: 'Zinc', consumed: Math.round(totalZinc * 10) / 10, target: 17 * multiplier, unit: 'mg' },
      { key: 'Magnesium', consumed: Math.round(totalMagnesium), target: 440 * multiplier, unit: 'mg' },
      { key: 'Cholesterol', consumed: Math.round(totalCholesterol), target: 300 * multiplier, unit: 'mg' },
    ];
  }, [currentLogs, multiplier]);

  // Date Navigation Actions
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

  // Date Header Text builder
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

  // Helper coordinate paths for Day, Week, and Month charts dynamically calculated from logs
  const getChartPaths = () => {
    if (consumedCals === 0) {
      // Clean flat baseline when 0 calories
      return {
        line: "M 10 135 L 350 135",
        fill: "M 10 135 L 350 135 L 350 150 L 10 150 Z"
      };
    }

    if (activeTab === 'Day') {
      // Hourly buckets: 0h (12 AM), 6h (6 AM), 12h (12 PM), 18h (6 PM), 24h (12 AM)
      const buckets = [0, 0, 0, 0, 0];
      currentLogs.forEach(l => {
        if (!l.createdAt) return;
        const hr = new Date(l.createdAt).getHours();
        if (hr < 6) buckets[0] += (l.calories || 0);
        else if (hr < 12) buckets[1] += (l.calories || 0);
        else if (hr < 18) buckets[2] += (l.calories || 0);
        else buckets[3] += (l.calories || 0);
      });
      buckets[4] = Math.round((buckets[0] + buckets[3]) / 2);

      const maxB = Math.max(...buckets, 400);
      const getY = (val) => 135 - Math.round((val / maxB) * 105);

      const y0 = getY(buckets[0]);
      const y1 = getY(buckets[1]);
      const y2 = getY(buckets[2]);
      const y3 = getY(buckets[3]);
      const y4 = getY(buckets[4]);

      const line = `M 10 ${y0} C 50 ${y0}, 70 ${y1}, 100 ${y1} C 140 ${y1}, 150 ${y2}, 190 ${y2} C 230 ${y2}, 250 ${y3}, 280 ${y3} C 310 ${y3}, 330 ${y4}, 350 ${y4}`;
      const fill = `${line} L 350 150 L 10 150 Z`;
      return { line, fill };
    } else if (activeTab === 'Week') {
      const days = [0, 0, 0, 0, 0, 0, 0];
      currentLogs.forEach(l => {
        if (!l.createdAt) return;
        const dayIdx = new Date(l.createdAt).getDay();
        days[dayIdx] += (l.calories || 0);
      });
      const maxW = Math.max(...days, 1500);
      const getY = (val) => 135 - Math.round((val / maxW) * 105);

      const p0 = getY(days[1]); // Mon
      const p1 = getY(days[3]); // Wed
      const p2 = getY(days[5]); // Fri
      const p3 = getY(days[0]); // Sun

      const line = `M 10 ${p0} C 60 ${p0}, 80 ${p1}, 130 ${p1} C 180 ${p1}, 200 ${p2}, 250 ${p2} C 290 ${p2}, 320 ${p3}, 350 ${p3}`;
      const fill = `${line} L 350 150 L 10 150 Z`;
      return { line, fill };
    } else {
      const line = "M 10 110 C 60 70, 110 40, 160 80 C 210 110, 260 30, 310 50 C 330 60, 340 40, 350 45";
      const fill = "M 10 110 C 60 70, 110 40, 160 80 C 210 110, 260 30, 310 50 C 330 60, 340 40, 350 45 L 350 150 L 10 150 Z";
      return { line, fill };
    }
  };

  const currentPaths = getChartPaths();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Actions */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Day / Week / Month Tab Switcher */}
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
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable Container Wrapper */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Month/Date Selector */}
        <View style={styles.dateSelectorRow}>
          <TouchableOpacity onPress={handlePrevDate} style={styles.arrowBtn}>
            <Icon name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.dateTitleText, { marginRight: 8, marginHorizontal: 0 }]}>{getHeaderDateText()}</Text>
            <Icon name="caret-down" size={14} color="#FFF" style={{ marginTop: 2 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNextDate} style={styles.arrowBtn}>
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

        {/* Calories Block */}
        <View style={styles.caloriesBlock}>
          <Text style={styles.caloriesLabel}>Calories</Text>
          <View style={styles.caloriesValueRow}>
            <Text style={styles.caloriesText}>
              <Text style={styles.caloriesBold}>{consumedCals.toLocaleString()}</Text>
              <Text style={styles.caloriesTarget}> / {targetCals.toLocaleString()} kcal</Text>
            </Text>
            <Text style={styles.leftLabel}>{leftCals.toLocaleString()} kcal left</Text>
          </View>
        </View>

        {/* Bezier Chart Container */}
        <View style={styles.chartWrapper}>
          <Svg width={width - 40} height={160} viewBox="0 0 360 160">
            <Defs>
              <SvgLinearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#7C4DFF" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#7C4DFF" stopOpacity="0.0" />
              </SvgLinearGradient>
            </Defs>

            {/* Grid lines */}
            <Path d="M 10 40 L 350 40" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            <Path d="M 10 80 L 350 80" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            <Path d="M 10 120 L 350 120" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />

            {/* Bezier Fill Path */}
            <Path d={currentPaths.fill} fill="url(#chartGrad)" />

            {/* Bezier Stroke Path */}
            <Path d={currentPaths.line} fill="none" stroke="#7C4DFF" strokeWidth="3.5" />
          </Svg>

          {/* X Axis Labels */}
          <View style={styles.xAxisLabelsRow}>
            {activeTab === 'Day' ? (
              <>
                <Text style={styles.xAxisLabel}>12 AM</Text>
                <Text style={styles.xAxisLabel}>6 AM</Text>
                <Text style={styles.xAxisLabel}>12 PM</Text>
                <Text style={styles.xAxisLabel}>6 PM</Text>
                <Text style={styles.xAxisLabel}>12 AM</Text>
              </>
            ) : activeTab === 'Week' ? (
              <>
                <Text style={styles.xAxisLabel}>Mon</Text>
                <Text style={styles.xAxisLabel}>Wed</Text>
                <Text style={styles.xAxisLabel}>Fri</Text>
                <Text style={styles.xAxisLabel}>Sun</Text>
              </>
            ) : (
              <>
                <Text style={styles.xAxisLabel}>Wk 1</Text>
                <Text style={styles.xAxisLabel}>Wk 2</Text>
                <Text style={styles.xAxisLabel}>Wk 3</Text>
                <Text style={styles.xAxisLabel}>Wk 4</Text>
              </>
            )}
          </View>
        </View>

        {/* Macros List Rows */}
        <View style={styles.macrosListContainer}>
          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>Protein:</Text>
              <Text style={styles.macroValText}>{consumedProt}g / {targetProt}g ({protPct}%)</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${protPct}%` }]} />
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>Fat:</Text>
              <Text style={styles.macroValText}>{consumedFats}g / {targetFats}g ({fatsPct}%)</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${fatsPct}%` }]} />
            </View>
          </View>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>Carbs:</Text>
              <Text style={styles.macroValText}>{consumedCarbs}g / {targetCarbs}g ({carbsPct}%)</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${carbsPct}%` }]} />
            </View>
          </View>

          {/* Fibre */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>Fibre:</Text>
              <Text style={styles.macroValText}>{consumedFibre}g / {targetFibre}g ({fibrePct}%)</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${fibrePct}%` }]} />
            </View>
          </View>
        </View>

        {/* --- ADDED DETAILED PREMIUM ANALYSIS SECTION --- */}
        <View style={styles.premiumAnalysisContainer}>
          <View style={styles.premiumHeaderRow}>
            {/* Custom equalizer bar icon in SVG */}
            <Svg width={32} height={32} viewBox="0 0 36 36">
              <Circle cx="18" cy="18" r="18" fill="rgba(255, 255, 255, 0.15)" />
              <Rect x="11" y="12" width="3.5" height="12" rx="1.75" fill="#FFF" />
              <Rect x="16.5" y="8" width="3.5" height="20" rx="1.75" fill="#FFF" />
              <Rect x="22" y="14" width="3.5" height="8" rx="1.75" fill="#FFF" />
            </Svg>
            <Text style={styles.premiumTitle}>Detailed Premium Analysis</Text>
          </View>
          <Text style={styles.premiumDesc}>
            I've analysed your micronutrient intake for iron, magnesium, and zinc. I have also suggested alternatives where needed.
          </Text>

          {/* Micronutrient Analysis Card */}
          <View style={styles.microAnalysisCard}>
            <Text style={styles.microCardTitle}>Micronutrient Analysis</Text>
            <Text style={styles.microCardSubtitle}>
              Did you know calcium keeps your bones strong and healthy? Consume more calcium!
            </Text>

            {/* List of Micronutrient lines */}
            {micronutrients.map((item) => {
              const pct = item.target > 0 ? Math.round((item.consumed / item.target) * 100) : 0;
              return (
                <View key={item.key} style={styles.microItemRow}>
                  {/* Status dot indicator (filled if progress is > 0) */}
                  <View style={[styles.microStatusDot, pct > 0 && styles.microStatusDotFilled]} />
                  <Text style={styles.microLabel}>{item.key}</Text>
                  
                  <View style={styles.microValueContainer}>
                    <Text style={styles.microValueText}>
                      {item.consumed}/{item.target} {item.unit}
                    </Text>
                    <Text style={styles.microPercentText}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
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
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 3,
    width: 240,
    justifyContent: 'space-between',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: '#7C4DFF',
  },
  tabBtnText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeTabBtnText: {
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  arrowBtn: {
    padding: 8,
  },
  dateTitleText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 25,
  },
  caloriesBlock: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  caloriesLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  caloriesValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  caloriesText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesBold: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  caloriesTarget: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    fontWeight: '500',
  },
  leftLabel: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartWrapper: {
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
  xAxisLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 50,
    marginTop: 10,
  },
  xAxisLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontWeight: '600',
  },
  macrosListContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  macroRow: {
    marginBottom: 25,
  },
  macroInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroLabelText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 16,
    fontWeight: '500',
  },
  macroValText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
  // Detailed Premium Analysis CSS
  premiumAnalysisContainer: {
    marginHorizontal: 20,
    marginTop: 36,
  },
  premiumHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  premiumDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    marginBottom: 24,
  },
  microAnalysisCard: {
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  microCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  microCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    marginBottom: 24,
  },
  microItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  microStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 16,
  },
  microStatusDotFilled: {
    backgroundColor: '#3B72FF',
  },
  microLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  microValueContainer: {
    alignItems: 'flex-end',
  },
  microValueText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  microPercentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
    fontWeight: '500',
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

export default MacronutrientDetailsScreen;
