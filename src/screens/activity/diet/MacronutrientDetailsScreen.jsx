import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Defs, Circle, Rect, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)';

const MacronutrientDetailsScreen = ({ route, navigation }) => {
  const selectedDateParam = route?.params?.selectedDate || new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(selectedDateParam));
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const dailySummary = route?.params?.dailySummary || {};
  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetCals = targets.calories || 2000;
  const consumedCals = summary.calories || 1650;
  const leftCals = Math.max(0, targetCals - consumedCals);

  // Fallbacks for macro percentages
  const targetProt = targets.protein || 120;
  const consumedProt = summary.protein || 0;
  const protPct = Math.round(Math.min(100, (consumedProt / targetProt) * 100));

  const targetFats = targets.fats || 65;
  const consumedFats = summary.fats || 0;
  const fatsPct = Math.round(Math.min(100, (consumedFats / targetFats) * 100));

  const targetCarbs = targets.carbs || 220;
  const consumedCarbs = summary.carbs || 0;
  const carbsPct = Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100));

  const targetFibre = targets.fibre || 30;
  const consumedFibre = summary.fibre || 0;
  const fibrePct = Math.round(Math.min(100, (consumedFibre / targetFibre) * 100));

  // Dynamic Micronutrient calculations based on whether food was logged
  const micronutrients = useMemo(() => {
    const hasLogs = consumedCals > 0;
    return [
      { key: 'Calcium', consumed: hasLogs ? 250 : 0, target: 1000, unit: 'mg' },
      { key: 'Iron', consumed: hasLogs ? 4.5 : 0, target: 19, unit: 'mg' },
      { key: 'Zinc', consumed: hasLogs ? 3.4 : 0, target: 17, unit: 'mg' },
      { key: 'Magnesium', consumed: hasLogs ? 110 : 0, target: 440, unit: 'mg' },
      { key: 'Cholesterol', consumed: hasLogs ? 60 : 0, target: 300, unit: 'mg' },
    ];
  }, [consumedCals]);

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

  // Helper coordinate paths for Day, Week, and Month charts
  const getChartPaths = () => {
    if (activeTab === 'Day') {
      return {
        line: "M 10 130 C 50 110, 80 110, 110 100 C 150 90, 180 50, 210 75 C 245 105, 270 20, 310 25 C 330 30, 340 90, 350 95",
        fill: "M 10 130 C 50 110, 80 110, 110 100 C 150 90, 180 50, 210 75 C 245 105, 270 20, 310 25 C 330 30, 340 90, 350 95 L 350 150 L 10 150 Z"
      };
    } else if (activeTab === 'Week') {
      return {
        line: "M 10 90 C 50 40, 90 120, 130 50 C 170 30, 210 110, 250 40 C 290 80, 320 60, 350 30",
        fill: "M 10 90 C 50 40, 90 120, 130 50 C 170 30, 210 110, 250 40 C 290 80, 320 60, 350 30 L 350 150 L 10 150 Z"
      };
    } else {
      return {
        line: "M 10 110 C 60 70, 110 40, 160 80 C 210 110, 260 30, 310 50 C 330 60, 340 40, 350 45",
        fill: "M 10 110 C 60 70, 110 40, 160 80 C 210 110, 260 30, 310 50 C 330 60, 340 40, 350 45 L 350 150 L 10 150 Z"
      };
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
              <Text style={styles.macroValText}>{protPct}%</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${protPct}%` }]} />
            </View>
          </View>

          {/* fats */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>fatss:</Text>
              <Text style={styles.macroValText}>{fatsPct}%</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${fatsPct}%` }]} />
            </View>
          </View>

          {/* carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>carbss:</Text>
              <Text style={styles.macroValText}>{carbsPct}%</Text>
            </View>
            <View style={styles.macroTrack}>
              <View style={[styles.macroBar, { width: `${carbsPct}%` }]} />
            </View>
          </View>

          {/* fibre */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfoRow}>
              <Text style={styles.macroLabelText}>fibre:</Text>
              <Text style={styles.macroValText}>{fibrePct}%</Text>
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
              const pct = Math.round((item.consumed / item.target) * 100);
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
