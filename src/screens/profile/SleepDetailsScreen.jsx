import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const SleepDetailsScreen = ({ route, navigation }) => {
  const sleepHoursToday = route?.params?.sleepHoursToday || 7.7;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Day'); // 'Day' | 'Week' | 'Month'

  // Format sleep duration (e.g. 7.7 hours -> 7h 42m)
  const hrs = Math.floor(sleepHoursToday);
  const mins = Math.round((sleepHoursToday - hrs) * 60);
  const sleepDurationStr = `${hrs}h ${mins}m`;

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

      {/* Moon / Vector Graphic */}
      <View style={styles.moonGraphicContainer}>
        <View style={styles.moonGraphicWrapper}>
          <Image 
            source={require('../../assets/image/Vector.png')} 
            style={styles.vectorImage} 
            resizeMode="contain" 
          />
          <View style={styles.moonAbsolute}>
            <Svg width={120} height={120} viewBox="0 0 200 200">
              <Path
                d="M 120 50 A 50 50 0 1 0 120 150 A 38 38 0 1 1 120 50 Z"
                fill="#FFF"
              />
            </Svg>
          </View>
        </View>

        <Text style={styles.totalSleepLabel}>Total Sleep Time</Text>
        <Text style={styles.totalSleepTimeVal}>{sleepDurationStr}</Text>
      </View>

      {/* Metrics Row (Consistency & Heart Rate Cards) */}
      <View style={styles.cardsRow}>
        {/* Consistency */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="sync" size={18} color="#E040FB" />
            <Text style={styles.cardDeltaText}>+2%</Text>
          </View>
          <Text style={styles.cardLabel}>Consistency</Text>
          <Text style={styles.cardVal}>94%</Text>
        </View>

        {/* Heart Rate */}
        <View style={styles.metricCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="heart-outline" size={18} color="#FFF" />
            <Text style={styles.cardRightLabel}>Avg</Text>
          </View>
          <Text style={styles.cardLabel}>Heart Rate</Text>
          <Text style={styles.cardVal}>58 <Text style={styles.cardValUnit}>bpm</Text></Text>
        </View>
      </View>

      {/* Sleep Stages Section */}
      <View style={styles.sleepStagesSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sleep Stages</Text>
          <Text style={styles.sectionRightTitle}>Last Night</Text>
        </View>

        {/* Visual Pillars Box */}
        <View style={styles.chartBox}>
          {/* 7 Vertical Lines */}
          <View style={styles.chartPillarsRow}>
            {stageData.map((col, idx) => (
              <View key={idx} style={styles.pillarContainer}>
                <View style={styles.pillarLine} />
                <View style={[styles.pillarPill, { bottom: col.bottom, height: col.height }]}>
                  <View style={styles.bluePill} />
                  <View style={styles.whitePill} />
                </View>
              </View>
            ))}
          </View>
          
          {/* Zero center axis line */}
          <View style={styles.axisLine} />

          {/* Legend Rows */}
          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FFF' }]} />
                <Text style={styles.legendText}>Awake (12m)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E040FB' }]} />
                <Text style={styles.legendText}>REM (1h 24m)</Text>
              </View>
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EC407A' }]} />
                <Text style={styles.legendText}>Light (4h 02m)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#03A9F4' }]} />
                <Text style={styles.legendText}>Deep (2h 04m)</Text>
              </View>
            </View>
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
  moonGraphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  moonGraphicWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  vectorImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  moonAbsolute: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSleepLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 5,
  },
  totalSleepTimeVal: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 25,
  },
  metricCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDeltaText: {
    color: '#E040FB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardRightLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    fontWeight: '600',
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardVal: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardValUnit: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '500',
  },
  sleepStagesSection: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionRightTitle: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    fontWeight: '600',
  },
  chartBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chartPillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    paddingHorizontal: 10,
  },
  pillarContainer: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    height: '100%',
  },
  pillarLine: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillarPill: {
    position: 'absolute',
    width: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bluePill: {
    flex: 1,
    backgroundColor: '#03A9F4',
  },
  whitePill: {
    height: '40%',
    backgroundColor: '#FFF',
  },
  axisLine: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 12,
  },
  legendContainer: {
    marginTop: 15,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  legendText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default SleepDetailsScreen;
