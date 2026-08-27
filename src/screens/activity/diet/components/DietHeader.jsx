import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { G, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as TextSvg } from 'react-native-svg';
import { useAuth } from '../../../../context/AuthContext';

const { width } = Dimensions.get('window');

const getMondayBasedIndex = (date) => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
};

const DietHeader = ({
  calendarDays,
  dailySummary,
  selectedDate,
  setSelectedDate,
  setCalendarDays,
  PLAN_DAY_NAMES,
  setSelectedPlanDay,
  fetchNutritionData,
  buildCalendarDays,
  handleGoToReminders,
  navigation,
  recommendation,
  stepsToday,
  sleepHoursToday,
  workoutCaloriesToday,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const calendarScrollViewRef = useRef(null);

  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const userName =
    profileData.name ||
    `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
    'Brian';
  const userAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;

  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetCals = targets.calories || 1800;
  const consumedCals = summary.calories !== undefined && summary.calories !== null ? summary.calories : 0;
  const targetBurn = 800;
  const walkBurn = Math.round((stepsToday || 0) * 0.045);
  const burnedCals = walkBurn + (workoutCaloriesToday || 0);
  const targetSleep = 8;
  const sleptHours = sleepHoursToday !== undefined && sleepHoursToday !== null ? sleepHoursToday : 0;

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

  const handleSelectDay = (day) => {
    const newDate = day.fullDate;
    setSelectedDate(newDate);
    setSelectedPlanDay(PLAN_DAY_NAMES[newDate.getDay()]);
    setCalendarDays(buildCalendarDays(newDate));
    fetchNutritionData(newDate, true);
  };

  useEffect(() => {
    const activeIdx = calendarDays.findIndex(d => d.active);
    if (activeIdx !== -1) {
      const capsuleWidth = 60; // capsule layout item width
      calendarScrollViewRef.current?.scrollTo({
        x: activeIdx * capsuleWidth - width / 2 + capsuleWidth / 2,
        animated: true,
      });
    }
  }, [selectedDate, calendarDays]);

  // SVG parameters for 270-degree partial arcs
  const burnCirc = 2 * Math.PI * 80;
  const burnArcLen = burnCirc * 0.75;

  const sleepCirc = 2 * Math.PI * 60;
  const sleepArcLen = sleepCirc * 0.75;

  const foodCirc = 2 * Math.PI * 40;
  const foodArcLen = foodCirc * 0.75;

  const getProgressEndCoords = (radius, progress) => {
    const angleDeg = 135 + (progress * 270);
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = 100 + radius * Math.cos(angleRad);
    const y = 100 + radius * Math.sin(angleRad);
    return { x, y };
  };

  const burnEnd = getProgressEndCoords(80, burnProgress);
  const sleepEnd = getProgressEndCoords(60, sleepProgress);
  const foodEnd = getProgressEndCoords(40, foodProgress);

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* Top Profile + Streak Row */}
      <View style={styles.topRow}>
        <View style={styles.profileCapsule}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="person" size={16} color="rgba(255, 255, 255, 0.7)" />
            </View>
          )}
          <View style={styles.profileTextContainer}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileStatus}>Premium User</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.aiBtn} 
            onPress={() => navigation.navigate('WeeklyDietPlan', { recommendation })}
            activeOpacity={0.8}
          >
            <Icon name="sparkles" size={14} color="#7C4DFF" style={{ marginRight: 6 }} />
            <Text style={styles.aiBtnText}>AI Diet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNavRow}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.monthNavBtn}>
          <Icon name="chevron-back" size={14} color="#FFF" style={styles.triangleIcon} />
        </TouchableOpacity>
        <Text style={styles.monthNavTitle}>{`${monthName} ${yearName}`}</Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthNavBtn}>
          <Icon name="chevron-forward" size={14} color="#FFF" style={styles.triangleIcon} />
        </TouchableOpacity>
      </View>

      {/* Calendar Row */}
      <View style={styles.calendarRow}>
        <ScrollView
          ref={calendarScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScrollWrapper}
        >
          {calendarDays.map((day, idx) => {
            const isActive = day.active;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.calendarCapsule,
                  isActive ? styles.activeCalendarCapsule : styles.inactiveCalendarCapsule
                ]}
                onPress={() => handleSelectDay(day)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <>
                    <View style={styles.activeDayCircle}>
                      <Text style={styles.activeDayNumber}>{day.date}</Text>
                    </View>
                    <Text style={styles.activeMonthLabel}>{day.label}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.inactiveMonthLabel}>{day.label}</Text>
                    <Text style={styles.inactiveDayNumber}>{day.date}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Concentric Progress Rings + Legend */}
      <View style={styles.ringsContainerRow}>
        {/* SVG Ring Area */}
        <View style={styles.svgWrapper}>
          <Svg width={175} height={175} viewBox="0 0 200 200">
            <Defs>
              <SvgLinearGradient id="burnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#BD93F9" />
                <Stop offset="100%" stopColor="#7C4DFF" />
              </SvgLinearGradient>
              <SvgLinearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FF8E8E" />
                <Stop offset="100%" stopColor="#FF5E62" />
              </SvgLinearGradient>
              <SvgLinearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#50B0FF" />
                <Stop offset="100%" stopColor="#3B72FF" />
              </SvgLinearGradient>
            </Defs>

            {/* Arcs Group */}
            <G rotation={135} origin="100, 100">
              {/* Outer ring (BURN) */}
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke="rgba(124, 77, 255, 0.08)"
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
                strokeDasharray={`${burnArcLen} ${burnCirc}`}
                strokeDashoffset={burnArcLen * (1 - burnProgress)}
                strokeLinecap="round"
              />

              {/* Middle ring (SLEEP) */}
              <Circle
                cx="100"
                cy="100"
                r="60"
                stroke="rgba(255, 142, 142, 0.08)"
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
                strokeDasharray={`${sleepArcLen} ${sleepCirc}`}
                strokeDashoffset={sleepArcLen * (1 - sleepProgress)}
                strokeLinecap="round"
              />

              {/* Inner ring (FOOD INTAKE) */}
              <Circle
                cx="100"
                cy="100"
                r="40"
                stroke="rgba(59, 114, 255, 0.08)"
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
                strokeDasharray={`${foodArcLen} ${foodCirc}`}
                strokeDashoffset={foodArcLen * (1 - foodProgress)}
                strokeLinecap="round"
              />
            </G>

            {/* Tip Percentage Labels */}
            <TextSvg x={burnEnd.x} y={burnEnd.y + 4} fill="#BD93F9" fontSize="8" fontWeight="bold" textAnchor="middle">
              {Math.round(burnProgress * 100)}%
            </TextSvg>
            <TextSvg x={sleepEnd.x} y={sleepEnd.y + 4} fill="#FF8E8E" fontSize="8" fontWeight="bold" textAnchor="middle">
              {Math.round(sleepProgress * 100)}%
            </TextSvg>
            <TextSvg x={foodEnd.x} y={foodEnd.y + 4} fill="#3B72FF" fontSize="8" fontWeight="bold" textAnchor="middle">
              {Math.round(foodProgress * 100)}%
            </TextSvg>
          </Svg>
        </View>

        {/* Legend List */}
        <View style={styles.legendContainer}>
          {/* Burn Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#7C4DFF' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Burn</Text>
              <Text style={styles.legendSubtext}>Calories Burned</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#00E676', fontWeight: 'bold' }}>{burnedCals}</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>/{targetBurn}</Text>
              </Text>
              <Text style={styles.legendUnit}>kcal</Text>
            </View>
          </View>

          {/* Sleep Info */}
          <TouchableOpacity
            style={styles.legendItem}
            onPress={() => navigation.navigate('SleepDetails', {
              sleepHoursToday,
              selectedDate: selectedDate instanceof Date ? selectedDate.toISOString() : selectedDate,
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.legendBox, { backgroundColor: '#FF8E8E' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Sleep</Text>
              <Text style={styles.legendSubtext}>Hours Slept</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#BD93F9', fontWeight: 'bold' }}>
                  {(() => {
                    const num = Number(sleptHours);
                    if (isNaN(num)) return sleptHours;
                    return num % 1 === 0 ? num : num.toFixed(1);
                  })()}
                </Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>/{targetSleep}</Text>
              </Text>
              <Text style={styles.legendUnit}>hours</Text>
            </View>
          </TouchableOpacity>

          {/* Food Intake Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#3B72FF' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Food Intake</Text>
              <Text style={styles.legendSubtext}>Calories Intake</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#00E5FF', fontWeight: 'bold' }}>{consumedCals}</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>/{targetCals}</Text>
              </Text>
              <Text style={styles.legendUnit}>kcal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Snap Card */}
      <TouchableOpacity 
        style={styles.snapCard} 
        onPress={() => navigation.navigate('DietAllLogs', { mode: 'diet' })}
        activeOpacity={0.8}
      >
        <Text style={styles.snapText}>
          Explore your complete collection of past snaps in one hub.
        </Text>
        <View style={styles.arrowCircle}>
          <Icon name="arrow-forward" size={18} color="#000" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    backgroundColor: '#000',
    paddingBottom: 15,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 15,
  },
  profileCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 77, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileTextContainer: {
    marginLeft: 10,
  },
  profileName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileStatus: {
    color: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  streakText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: 'bold',
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 77, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 77, 255, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  monthNavBtn: {
    padding: 8,
  },
  triangleIcon: {
    fontSize: 14,
  },
  monthNavTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 20,
    letterSpacing: 0.5,
  },
  calendarRow: {
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  calendarScrollWrapper: {
    paddingRight: 20,
  },
  calendarCapsule: {
    width: 52,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  activeCalendarCapsule: {
    backgroundColor: '#FFF',
  },
  inactiveCalendarCapsule: {
    backgroundColor: '#0c0c0f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDayNumber: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeMonthLabel: {
    color: '#7C4DFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  inactiveMonthLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },
  inactiveDayNumber: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  ringsContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  svgWrapper: {
    width: 175,
    height: 175,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flex: 1,
    marginLeft: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    justifyContent: 'space-between',
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 8,
  },
  legendTextCol: {
    flex: 1,
  },
  legendLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  legendSubtext: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    marginTop: 1,
  },
  legendValueCol: {
    alignItems: 'flex-end',
  },
  legendValText: {
    fontSize: 12,
  },
  legendUnit: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    marginTop: 1,
  },
  snapCard: {
    width: '100%',
    backgroundColor: '#0c0c0f',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 5,
    marginHorizontal: 16,
    width: width - 32,
  },
  snapText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    paddingRight: 16,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DietHeader;
