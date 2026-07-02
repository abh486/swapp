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
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

const WalkDetailsScreen = ({ route, navigation }) => {
  const stepsTodayParam = route?.params?.stepsToday || 4505;
  const [stepsToday, setStepsToday] = useState(stepsTodayParam);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'

  const targetSteps = 10000;
  const progress = Math.min(1, stepsToday / targetSteps);

  // SVG parameters for 360-degree circular ring
  const radius = 70;
  const strokeWidth = 10;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ * (1 - progress);

  // Computed metrics based on step count
  const caloriesBurned = Math.round(stepsToday * 0.045);
  const distanceKm = (stepsToday * 0.0008).toFixed(2);
  
  const totalMins = Math.round(stepsToday * 0.008);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationStr = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:19`;

  // Date Navigator helper
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

  // Static top steps lists matching Screenshot 3
  const topSteps = [
    { rank: '01.', steps: 15292, kcal: 612, distance: '13,76 KM' },
    { rank: '02.', steps: 12450, kcal: 498, distance: '11,20 KM' },
    { rank: '03.', steps: 10120, kcal: 405, distance: '9,10 KM' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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
        <View style={{ width: 40 }} />
      </View>

      {/* Date Selector Row */}
      <View style={styles.dateSelectorRow}>
        <TouchableOpacity onPress={handlePrevDate} style={styles.arrowBtn}>
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.dateTitleText}>{getHeaderDateText()}</Text>
        <TouchableOpacity onPress={handleNextDate} style={styles.arrowBtn}>
          <Icon name="chevron-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

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
          <Text style={styles.metricValText}>{caloriesBurned}</Text>
          <Text style={styles.metricLabelText}>CALORIES</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Steps */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText}>{stepsToday.toLocaleString()}</Text>
          <Text style={styles.metricLabelText}>STEPS</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Distance */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText}>{distanceKm} KM</Text>
          <Text style={styles.metricLabelText}>DISTANCE</Text>
        </View>
        <View style={styles.dividerLine} />

        {/* Duration */}
        <View style={styles.metricCol}>
          <Text style={styles.metricValText}>{durationStr}</Text>
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
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
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
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricValText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabelText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.5,
  },
  dividerLine: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bottomDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  topStepSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  topStepList: {
    marginTop: 10,
  },
  topStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  kcalText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 13,
    marginTop: 3,
  },
  distanceText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WalkDetailsScreen;
