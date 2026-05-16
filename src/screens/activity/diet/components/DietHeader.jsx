import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const DietHeader = ({ calendarDays, handleCalendarPress }) => {
  return (
    <View style={styles.topCurveContainer}>
      <View style={styles.blackCurve} />
      
      <SafeAreaView style={styles.topContent}>
        {/* Header Area */}
        <View style={styles.headerArea}>
          <View style={styles.flamePill}>
            <MaterialCommunityIcons name="fire" size={16} color="#FF9800" />
            <Text style={styles.flamePillText}>1</Text>
          </View>
        </View>

        {/* Calendar Row */}
        <TouchableOpacity style={styles.calendarRow} onPress={handleCalendarPress} activeOpacity={0.7}>
          {calendarDays.map((day, idx) => (
            <View key={idx} style={styles.dayContainer}>
              <View style={[styles.dayCircle, day.active && styles.activeDayCircle]}>
                <Text style={styles.dayLabel}>{day.label}</Text>
              </View>
              <Text style={styles.dateLabel}>{day.date}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {/* Main Stats Row */}
        <View style={styles.statsRow}>
          {/* Burn Stat */}
          <View style={styles.sideStat}>
            <MaterialCommunityIcons name="fire" size={28} color="#FF9800" />
            <Text style={styles.sideStatValue}>690</Text>
            <Text style={styles.sideStatLabel}>burn</Text>
          </View>

          {/* Center Circle */}
          <View style={styles.centerCircleContainer}>
            <View style={styles.circleBackground} />
            <View style={styles.circleOrangeArc} />
            <View style={styles.circleGreenArc} />
            
            <View style={styles.circleInner}>
              <Text style={styles.centerValue}>1645</Text>
              <Text style={styles.centerLabel}>Kcal available</Text>
              <View style={styles.dotsRow}>
                <View style={styles.dotActive} />
                <View style={styles.dotInactive} />
              </View>
            </View>
          </View>

          {/* Eaten Stat */}
          <View style={styles.sideStat}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#4CAF50" style={{marginBottom: 4}} />
            <Text style={styles.sideStatValue}>536</Text>
            <Text style={styles.sideStatLabel}>eaten</Text>
          </View>
        </View>

        {/* Goal Text */}
        <View style={styles.goalContainer}>
          <Text style={styles.goalValue}>2131</Text>
          <Text style={styles.goalLabel}>Kcal Goal</Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  topCurveContainer: {
    width: width,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  blackCurve: {
    position: 'absolute',
    top: 0,
    width: width * 1.5,
    height: '100%',
    backgroundColor: '#050505',
    borderBottomLeftRadius: width * 0.75,
    borderBottomRightRadius: width * 0.75,
  },
  topContent: {
    width: width,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerArea: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  flamePill: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: 'center',
  },
  flamePillText: {
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#000',
    fontSize: 14,
  },
  calendarRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeDayCircle: {
    borderColor: '#FF5722',
    borderStyle: 'solid',
    backgroundColor: 'rgba(255, 87, 34, 0.15)',
  },
  dayLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  dateLabel: {
    color: '#FFF',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 30,
  },
  sideStat: {
    alignItems: 'center',
    width: 70,
  },
  sideStatValue: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sideStatLabel: {
    color: '#888',
    fontSize: 14,
    marginTop: 2,
  },
  centerCircleContainer: {
    width: 170,
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: '#FFF',
  },
  circleOrangeArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: 'transparent',
    borderLeftColor: '#FF5722',
    borderTopColor: '#FF5722',
    transform: [{ rotate: '-25deg' }],
  },
  circleGreenArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 85,
    borderWidth: 6,
    borderColor: 'transparent',
    borderRightColor: '#4CAF50',
    transform: [{ rotate: '-25deg' }],
  },
  circleInner: {
    alignItems: 'center',
  },
  centerValue: {
    color: '#4CAF50',
    fontSize: 40,
    fontWeight: 'bold',
  },
  centerLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  goalContainer: {
    alignItems: 'center',
  },
  goalValue: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 40,
  },
  goalLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: -2,
  },
});

export default DietHeader;
