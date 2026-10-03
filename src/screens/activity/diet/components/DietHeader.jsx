import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { G, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Text as TextSvg } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../../../context/AuthContext';
import { useResponsiveMetrics } from '../../../../utils/responsive';

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
  const metrics = useResponsiveMetrics();
  const { width, wp, hp, ms, sp, fs } = metrics;
  const svgSize = Math.min(width * 0.43, ms(175));
  const capsuleWidth = Math.min(ms(52), Math.floor((width - 48) / 6.5));
  const capsuleHeight = Math.min(ms(76), hp(9.5));
  const calendarScrollViewRef = useRef(null);

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

  const scrollToActiveDay = useCallback((animated = true) => {
    const activeIdx = calendarDays.findIndex(d => d.active);
    if (activeIdx !== -1 && calendarScrollViewRef.current) {
      const itemStep = capsuleWidth + 8;
      const targetX = activeIdx * itemStep;
      calendarScrollViewRef.current.scrollTo({
        x: targetX,
        animated,
      });
    }
  }, [calendarDays, capsuleWidth]);

  useEffect(() => {
    scrollToActiveDay(true);
    const timer = setTimeout(() => {
      scrollToActiveDay(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedDate, calendarDays, scrollToActiveDay]);

  // SVG parameters for 270-degree partial arcs
  const burnCirc = 2 * Math.PI * 80;
  const burnArcLen = burnCirc * 0.75;

  const sleepCirc = 2 * Math.PI * 60;
  const sleepArcLen = sleepCirc * 0.75;

  const foodCirc = 2 * Math.PI * 40;
  const foodArcLen = foodCirc * 0.75;




  // Robust safe-area inset fallback for iOS (notch/dynamic island) & Android
  const minIosTop = 48;
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const effectiveTop = Platform.OS === 'ios'
    ? Math.max(insets.top || 0, minIosTop)
    : Math.max(insets.top || 0, statusBarHeight);
  const headerTopPadding = effectiveTop + (Platform.OS === 'android' ? 16 : 14);

  return (
    <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
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
            <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
            <Text style={styles.profileStatus}>Premium User</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('WeeklyDietPlan', { recommendation })}
            activeOpacity={0.8}
            style={styles.aiBtn}
          >
            <LinearGradient
              colors={['#EE822A', '#8F5D98', '#2E4D9F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.aiBtnContent}>
              <Icon name="sparkles" size={12} color="#FFF" style={styles.aiBtnIcon} />
              <Text
                style={styles.aiBtnText}
                numberOfLines={1}
                allowFontScaling={false}
              >
                AI Diet
              </Text>
            </View>
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
          contentContainerStyle={[
            styles.calendarScrollWrapper,
            { paddingHorizontal: Math.max(16, (width - capsuleWidth) / 2 - 4) },
          ]}
          onLayout={() => scrollToActiveDay(false)}
          onContentSizeChange={() => scrollToActiveDay(false)}
        >
          {calendarDays.map((day, idx) => {
            const isActive = day.active;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.calendarCapsule,
                  { width: capsuleWidth, height: capsuleHeight },
                  isActive ? styles.activeCalendarCapsule : styles.inactiveCalendarCapsule
                ]}
                onPress={() => handleSelectDay(day)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <>
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.activeDayCircle}
                    >
                      <Text style={styles.activeDayNumber}>{day.date}</Text>
                    </LinearGradient>
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
        <View style={[styles.svgWrapper, { width: svgSize, height: svgSize }]}>
          <Svg width={svgSize} height={svgSize} viewBox="0 0 200 200">
            <Defs>
              <SvgLinearGradient id="burnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FFA048" />
                <Stop offset="100%" stopColor="#EE822A" />
              </SvgLinearGradient>
              <SvgLinearGradient id="sleepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#B388BC" />
                <Stop offset="100%" stopColor="#8F5D98" />
              </SvgLinearGradient>
              <SvgLinearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#5E82E8" />
                <Stop offset="100%" stopColor="#2E4D9F" />
              </SvgLinearGradient>
            </Defs>

            {/* Arcs Group */}
            <G rotation={135} origin="100, 100">
              {/* Outer ring (BURN) */}
              <Circle
                cx="100"
                cy="100"
                r="80"
                stroke="rgba(238, 130, 42, 0.12)"
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
                stroke="rgba(143, 93, 152, 0.12)"
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
                stroke="rgba(46, 77, 159, 0.12)"
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


            {/* Center Metrics (Stacked, Perfectly Aligned & High Contrast) */}
            <G>
              {/* Burn (Outer Ring) */}
              <Circle cx="82" cy="79" r="3.5" fill="#EE822A" />
              <TextSvg x="92" y="79" fill="#FFA048" fontSize="13" fontWeight="bold" textAnchor="start" alignmentBaseline="central">
                {Math.round(burnProgress * 100)}
              </TextSvg>

              {/* Sleep (Middle Ring) */}
              <Circle cx="82" cy="100" r="3.5" fill="#8F5D98" />
              <TextSvg x="92" y="100" fill="#C084FC" fontSize="13" fontWeight="bold" textAnchor="start" alignmentBaseline="central">
                {Math.round(sleepProgress * 100)}
              </TextSvg>

              {/* Food Intake (Inner Ring) */}
              <Circle cx="82" cy="121" r="3.5" fill="#2E4D9F" />
              <TextSvg x="92" y="121" fill="#38BDF8" fontSize="13" fontWeight="bold" textAnchor="start" alignmentBaseline="central">
                {Math.round(foodProgress * 100)}
              </TextSvg>
            </G>
          </Svg>
        </View>

        {/* Legend List */}
        <View style={styles.legendContainer}>
          {/* Burn Info */}
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#EE822A' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Burn</Text>
              <Text style={styles.legendSubtext}>Calories Burned</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#EE822A', fontWeight: 'bold' }}>{burnedCals}</Text>
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
            <View style={[styles.legendBox, { backgroundColor: '#8F5D98' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Sleep</Text>
              <Text style={styles.legendSubtext}>Hours Slept</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#8F5D98', fontWeight: 'bold' }}>
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
            <View style={[styles.legendBox, { backgroundColor: '#2E4D9F' }]} />
            <View style={styles.legendTextCol}>
              <Text style={styles.legendLabel}>Food Intake</Text>
              <Text style={styles.legendSubtext}>Calories Intake</Text>
            </View>
            <View style={styles.legendValueCol}>
              <Text style={styles.legendValText}>
                <Text style={{ color: '#2E4D9F', fontWeight: 'bold' }}>{consumedCals}</Text>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>/{targetCals}</Text>
              </Text>
              <Text style={styles.legendUnit}>kcal</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Snap Card */}
      <TouchableOpacity 
        style={[styles.snapCard, { width: width - sp(32), marginHorizontal: sp(16) }]} 
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
    marginTop: Platform.OS === 'android' ? 6 : 8,
  },
  profileCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(238, 130, 42, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 24,
    maxWidth: '58%',
    flexShrink: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  profileTextContainer: {
    marginLeft: 10,
    flexShrink: 1,
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
    justifyContent: 'flex-end',
    flexShrink: 0,
    marginLeft: 8,
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
    height: 30,
    minWidth: 80,
    paddingHorizontal: 11,
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8F5D98',
  },
  aiBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBtnIcon: {
    marginRight: 4,
  },
  aiBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    textAlign: 'center',
  },
  calendarRow: {
    width: '100%',
    marginTop: 16,
    marginBottom: 16,
  },
  calendarScrollWrapper: {
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeDayNumber: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
  },
  activeMonthLabel: {
    color: '#EE822A',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inactiveMonthLabel: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  inactiveDayNumber: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 18,
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
