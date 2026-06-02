import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useResponsiveMetrics } from '../../../utils/responsive';

const DATES = [
  { month: 'May', day: '22' },
  { month: 'May', day: '23' },
  { month: 'May', day: '24' },
  { month: 'May', day: '25' },
  { month: 'May', day: '26' },
  { month: 'May', day: '27' },
  { month: 'May', day: '28' },
];

const CATEGORIES = ['Gym Floor', 'Class', 'Spa', 'Other'];

const SLOTS = [
  { time: '6:00 AM - 7:00 AM', status: 'Available' },
  { time: '7:00 AM - 8:00 AM', status: 'Available' },
  { time: '8:00 AM - 9:00 AM', status: 'Filling Fast', warning: true },
  { time: '9:00 AM - 10:00 AM', status: 'Available' },
  { time: '10:00 AM - 11:00 AM', status: 'Available' },
];

const MembershipBookingScreen = ({ route, navigation }) => {
  const { gymName = 'FitZone Premium' } = route?.params || {};
  const [activeCategory, setActiveCategory] = useState('Gym Floor');
  const [selectedDate, setSelectedDate] = useState('25');
  const metrics = useResponsiveMetrics();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(metrics, insets), [metrics, insets]);

  const bookSlot = slot => {
    Alert.alert('Booking Confirmed', `${gymName}\n${slot.time}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#050209" />

      {/* Deep purple/black gradient background top glow */}
      <View style={styles.headerGlow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Bookings</Text>
        <TouchableOpacity style={styles.calendarButton} activeOpacity={0.8}>
          <Icon name="calendar-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Date Strip */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {DATES.map(date => {
            const isActive = selectedDate === date.day;
            return (
              <TouchableOpacity
                key={date.day}
                style={[
                  styles.dateChip,
                  isActive && styles.dateChipActive,
                ]}
                onPress={() => setSelectedDate(date.day)}
                activeOpacity={0.85}
              >
                {isActive ? (
                  <View style={styles.activeContent}>
                    <View style={styles.activeDayCircle}>
                      <Text style={styles.activeDayText}>{date.day}</Text>
                      <View style={styles.activeDot} />
                    </View>
                    <Text style={styles.activeBottomMonth}>{date.month}</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.dateMonth}>{date.month}</Text>
                    <Text style={styles.dateDay}>{date.day}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Pills */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryStrip}
        >
          {CATEGORIES.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(category)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Slot List */}
      <ScrollView
        style={styles.slotScroll}
        contentContainerStyle={styles.slotContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>AVAILABLE SLOTS</Text>
        {SLOTS.map(slot => (
          <View key={slot.time} style={styles.slotCard}>
            <View style={styles.slotInfo}>
              <Text style={styles.slotTime}>{slot.time}</Text>
              <Text
                style={[
                  styles.slotStatus,
                  slot.warning ? styles.slotStatusWarning : styles.slotStatusAvailable,
                ]}
              >
                {slot.status}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => bookSlot(slot)}
              activeOpacity={0.85}
            >
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = ({ fs, sp, ms, isTablet, isLandscape, maxContentWidth }, insets) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ms(isLandscape ? 128 : 180),
    backgroundColor: '#130421',
    opacity: 0.4,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  header: {
    minHeight: ms(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sp(20),
    marginTop: sp(6),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  backButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: fs(20),
    fontWeight: 'bold',
  },
  calendarButton: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStrip: {
    paddingHorizontal: sp(16),
    paddingVertical: sp(isLandscape ? 12 : 20),
    alignItems: 'center',
    flexDirection: 'row',
  },
  dateChip: {
    width: ms(52),
    minHeight: ms(72),
    borderRadius: ms(26),
    marginHorizontal: sp(5),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0E13',
    paddingVertical: sp(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  dateChipActive: {
    width: ms(56),
    minHeight: ms(86),
    borderRadius: ms(28),
    backgroundColor: '#FFFFFF',
    paddingVertical: sp(8),
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  activeContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    color: '#5E5D62',
    fontSize: fs(11),
    fontWeight: '500',
  },
  dateDay: {
    color: '#A2A1A6',
    fontSize: fs(16),
    fontWeight: '700',
  },
  activeDayCircle: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: '#6A3C91',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: sp(4),
  },
  activeDayText: {
    color: '#FFF',
    fontSize: fs(18),
    fontWeight: 'bold',
  },
  activeDot: {
    width: ms(3),
    height: ms(3),
    borderRadius: ms(1.5),
    backgroundColor: '#FFF',
    position: 'absolute',
    bottom: sp(6),
  },
  activeBottomMonth: {
    color: '#6A3C91',
    fontSize: fs(11),
    fontWeight: 'bold',
  },
  categoryStrip: {
    paddingHorizontal: sp(20),
    paddingBottom: sp(isLandscape ? 14 : 25),
    alignItems: 'center',
  },
  categoryPill: {
    minHeight: ms(36),
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: sp(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: sp(10),
    backgroundColor: '#000',
  },
  categoryPillActive: {
    borderColor: '#FFF',
    backgroundColor: '#0F0E13',
  },
  categoryText: {
    color: '#727177',
    fontSize: fs(14),
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  slotScroll: {
    flex: 1,
  },
  slotContent: {
    paddingHorizontal: sp(isTablet ? 28 : 20),
    paddingBottom: Math.max(insets.bottom, sp(18)) + sp(12),
    alignSelf: 'center',
    width: '100%',
    maxWidth: maxContentWidth,
  },
  sectionTitle: {
    color: '#727177',
    fontSize: fs(12),
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: sp(16),
  },
  slotCard: {
    width: '100%',
    minHeight: ms(76),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sp(16),
    paddingVertical: sp(12),
    marginBottom: sp(12),
    gap: sp(12),
  },
  slotInfo: {
    flex: 1,
    minWidth: 0,
  },
  slotTime: {
    color: '#FFF',
    fontSize: fs(16),
    fontWeight: 'bold',
    marginBottom: sp(6),
  },
  slotStatus: {
    fontSize: fs(13),
    fontWeight: '500',
  },
  slotStatusAvailable: {
    color: '#00E96A',
  },
  slotStatusWarning: {
    color: '#E07538',
  },
  bookButton: {
    minWidth: ms(76),
    minHeight: ms(38),
    borderRadius: ms(10),
    paddingHorizontal: sp(14),
    backgroundColor: '#4E266E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: fs(14),
    fontWeight: 'bold',
  },
});

export default MembershipBookingScreen;
