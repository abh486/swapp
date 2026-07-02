import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const MacronutrientDetailsScreen = ({ route, navigation }) => {
  const selectedDateParam = route?.params?.selectedDate || new Date();
  const [selectedDate, setSelectedDate] = useState(new Date(selectedDateParam));
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'

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

      {/* Month/Date Selector */}
      <View style={styles.dateSelectorRow}>
        <TouchableOpacity onPress={handlePrevDate} style={styles.arrowBtn}>
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.dateTitleText}>{getHeaderDateText()}</Text>
        <TouchableOpacity onPress={handleNextDate} style={styles.arrowBtn}>
          <Icon name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

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

        {/* fatss */}
        <View style={styles.macroRow}>
          <View style={styles.macroInfoRow}>
            <Text style={styles.macroLabelText}>fatss:</Text>
            <Text style={styles.macroValText}>{fatsPct}%</Text>
          </View>
          <View style={styles.macroTrack}>
            <View style={[styles.macroBar, { width: `${fatsPct}%` }]} />
          </View>
        </View>

        {/* carbss */}
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
});

export default MacronutrientDetailsScreen;
