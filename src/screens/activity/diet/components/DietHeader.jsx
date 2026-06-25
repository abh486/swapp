import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { G, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import apiClient from '../../../../api/apiClient';
import { useAuth } from '../../../../context/AuthContext';

const { width } = Dimensions.get('window');

const getMondayBasedIndex = (date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const DietHeader = ({
  calendarDays,
  handleCalendarPress,
  dailySummary,
  selectedDate,
  setSelectedDate,
  setCalendarDays,
  PLAN_DAY_NAMES,
  setSelectedPlanDay,
  fetchNutritionData,
  buildCalendarDays,
  handleTrackFood,
  handleGoToPreferences,
  handleGoToReminders,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const userName =
    profileData.name ||
    `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
    'Member';
  const userAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;

  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetCals = targets.calories || 2000;
  const consumedCals = summary.calories || 0;
  const targetBurn = 800;
  const burnedCals = summary.burned || 432;
  const targetSleep = 8;
  const sleptHours = summary.sleep || 5.0;

  const burnProgress = Math.min(1, burnedCals / targetBurn);
  const sleepProgress = Math.min(1, sleptHours / targetSleep);
  const foodProgress = Math.min(1, consumedCals / targetCals);

  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long' });
  const yearName = selectedDate.getFullYear();

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
    setSelectedPlanDay(PLAN_DAY_NAMES[newDate.getDay()]);
    setCalendarDays(buildCalendarDays(newDate));
    fetchNutritionData(newDate, true);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
    setSelectedPlanDay(PLAN_DAY_NAMES[newDate.getDay()]);
    setCalendarDays(buildCalendarDays(newDate));
    fetchNutritionData(newDate, true);
  };

  const handleSelectDay = (dayIndex) => {
    const newDate = new Date(selectedDate);
    const activeIndex = getMondayBasedIndex(selectedDate);
    newDate.setDate(selectedDate.getDate() + dayIndex - activeIndex);
    setSelectedDate(newDate);
    setSelectedPlanDay(PLAN_DAY_NAMES[newDate.getDay()]);
    setCalendarDays(buildCalendarDays(newDate));
    fetchNutritionData(newDate, true);
  };

  // SVG parameters for 270-degree partial arcs
  // Outer circle (BURN): r=80, C ~ 502.65, 270 deg length = 377
  // Middle circle (SLEEP): r=60, C ~ 376.99, 270 deg length = 282.7
  // Inner circle (FOOD INTAKE): r=40, C ~ 251.33, 270 deg length = 188.5

  const burnCirc = 2 * Math.PI * 80;
  const burnArcLen = burnCirc * 0.75;

  const sleepCirc = 2 * Math.PI * 60;
  const sleepArcLen = sleepCirc * 0.75;

  const foodCirc = 2 * Math.PI * 40;
  const foodArcLen = foodCirc * 0.75;

  const handleWeightCardPress = () => {
    Alert.alert(
      'Log Weight',
      'Please switch to the ANALYTICS tab below to log and update your current weight.'
    );
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* Top Profile + Streak Row */}
      <View style={styles.topRow}>
        <View style={styles.profileContainer}>
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="person" size={20} color="rgba(255, 255, 255, 0.7)" />
            </View>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.settingsBtn, { marginRight: 10 }]} onPress={handleGoToReminders}>
            <Icon name="notifications-outline" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleGoToPreferences}>
            <Icon name="options-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
          <Icon name="chevron-back" size={20} color="#AAA" />
        </TouchableOpacity>
        <Text style={styles.monthNavTitle}>{`${monthName} ${yearName}`}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
          <Icon name="chevron-forward" size={20} color="#AAA" />
        </TouchableOpacity>
      </View>

      {/* Calendar Row */}
      <View style={styles.calendarRow}>
        {calendarDays.map((day, idx) => {
          const isActive = day.active;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.calendarCapsule, isActive && styles.activeCalendarCapsule]}
              onPress={() => handleSelectDay(idx)}
              activeOpacity={0.8}
            >
              {isActive ? (
                <>
                  <Text style={styles.activeDateText} numberOfLines={1}>{day.date}</Text>
                  <Text style={styles.activeMonthText} numberOfLines={1}>{day.month}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.inactiveMonthText} numberOfLines={1}>{day.month}</Text>
                  <Text style={styles.inactiveDateText} numberOfLines={1}>{day.date}</Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Concentric Progress Rings + Legend */}
      <View style={styles.ringsSection}>
        <View style={styles.svgWrapper}>
          <Svg width={170} height={170} viewBox="0 0 200 200">
            <Defs>
              <SvgLinearGradient id="burnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF5252" />
                <Stop offset="100%" stopColor="#FF7A00" />
              </SvgLinearGradient>
              <SvgLinearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#7C4DFF" />
                <Stop offset="100%" stopColor="#00E5FF" />
              </SvgLinearGradient>
              <SvgLinearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#00E676" />
                <Stop offset="100%" stopColor="#AEEA00" />
              </SvgLinearGradient>
            </Defs>

            {/* Rotate 135 degrees to place the 90 degrees gap exactly at the bottom */}
            <G rotation={135} origin="100, 100">
              {/* Outer circle (BURN) */}
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke="rgba(255, 82, 82, 0.08)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${burnArcLen} ${burnCirc}`}
                strokeLinecap="round"
              />
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke="url(#burnGrad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${burnProgress * burnArcLen} ${burnCirc}`}
                strokeLinecap="round"
              />

              {/* Middle circle (SLEEP) */}
              <Circle
                cx="100"
                cy="100"
                r="60"
                stroke="rgba(124, 77, 255, 0.08)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${sleepArcLen} ${sleepCirc}`}
                strokeLinecap="round"
              />
              <Circle
                cx="100"
                cy="100"
                r="60"
                stroke="url(#sleepGrad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${sleepProgress * sleepArcLen} ${sleepCirc}`}
                strokeLinecap="round"
              />

              {/* Inner circle (FOOD INTAKE) */}
              <Circle
                cx="100"
                cy="100"
                r="40"
                stroke="rgba(0, 230, 118, 0.08)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${foodArcLen} ${foodCirc}`}
                strokeLinecap="round"
              />
              <Circle
                cx="100"
                cy="100"
                r="40"
                stroke="url(#foodGrad)"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${foodProgress * foodArcLen} ${foodCirc}`}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {/* Burn Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
            <View>
              <Text style={styles.legendLabel}>BURN</Text>
              <Text style={styles.legendValue}>{`${burnedCals} / ${targetBurn} kcal`}</Text>
            </View>
          </View>

          {/* Sleep Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#7C4DFF' }]} />
            <View>
              <Text style={styles.legendLabel}>SLEEP</Text>
              <Text style={styles.legendValue}>{`${sleptHours} / ${targetSleep} hours`}</Text>
            </View>
          </View>

          {/* Food Intake Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00E676' }]} />
            <View>
              <Text style={styles.legendLabel}>FOOD INTAKE</Text>
              <Text style={styles.legendValue}>{`${consumedCals} / ${targetCals} kcal`}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Side-by-side Metric Cards */}
      <View style={styles.metricCardsRow}>
        <TouchableOpacity style={styles.cardTouch} onPress={handleWeightCardPress} activeOpacity={0.9}>
          <LinearGradient
            colors={['#111115', '#08080A']}
            style={styles.metricCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.metricCardLabel}>Current Weight</Text>
            <Text style={styles.metricCardValue}>78.5 kg</Text>
            <View style={styles.trendBadge}>
              <Icon name="arrow-down-outline" size={10} color="#00E676" />
              <Text style={styles.trendText}>3 Kg (-3.8%)</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardTouch} onPress={handleTrackFood} activeOpacity={0.8}>
          <LinearGradient
            colors={['#111115', '#08080A']}
            style={styles.metricCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.metricCardLabel}>Today's Calories</Text>
            <Text style={styles.metricCardValue}>{`${consumedCals} kcal`}</Text>
            <View style={[styles.trendBadge, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}>
              <Icon name="arrow-down-outline" size={10} color="#FF5252" />
              <Text style={[styles.trendText, { color: '#FF5252' }]}>5.6%</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: '#050505',
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 77, 255, 0.5)',
  },
  profileBadge: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  profileStatus: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.3)',
    marginRight: 10,
  },
  streakText: {
    color: '#FF7A00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
  },
  monthNavBtn: {
    padding: 8,
  },
  monthNavTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginHorizontal: 20,
    letterSpacing: 0.5,
  },
  calendarRow: {
    flexDirection: 'row',
    paddingHorizontal: 17,
    marginTop: 20,
    marginBottom: 20,
  },
  calendarCapsule: {
    flex: 1,
    marginHorizontal: 3,
    height: 70,
    borderRadius: 21,
    backgroundColor: '#111115',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCalendarCapsule: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  activeDateText: {
    color: '#000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  activeMonthText: {
    color: '#666',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  inactiveMonthText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  inactiveDateText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ringsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12.5,
    marginTop: 10,
    marginBottom: 15,
  },
  svgWrapper: {
    width: 170,
    height: 170,
    marginHorizontal: 7.5,
    marginVertical: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flex: 1,
    minWidth: 140,
    marginHorizontal: 7.5,
    marginVertical: 7.5,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  legendLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  legendValue: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  metricCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  cardTouch: {
    flex: 1,
    marginHorizontal: 5,
  },
  metricCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricCardLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '700',
  },
  metricCardValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trendText: {
    color: '#00E676',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default DietHeader;
