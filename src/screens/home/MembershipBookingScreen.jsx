import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const SLOT_CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;

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

  const bookSlot = slot => {
    Alert.alert('Booking Confirmed', `${gymName}\n${slot.time}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#130421',
    opacity: 0.4,
    borderBottomLeftRadius: 180,
    borderBottomRightRadius: 180,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStrip: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dateChip: {
    width: 52,
    height: 74,
    borderRadius: 26,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0E13',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  dateChipActive: {
    width: 56,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
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
    fontSize: 11,
    fontWeight: '500',
  },
  dateDay: {
    color: '#A2A1A6',
    fontSize: 16,
    fontWeight: '700',
  },
  activeDayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6A3C91',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  activeDayText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFF',
    position: 'absolute',
    bottom: 6,
  },
  activeBottomMonth: {
    color: '#6A3C91',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryStrip: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    alignItems: 'center',
  },
  categoryPill: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#000',
  },
  categoryPillActive: {
    borderColor: '#FFF',
    backgroundColor: '#0F0E13',
  },
  categoryText: {
    color: '#727177',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  slotScroll: {
    flex: 1,
  },
  slotContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 30,
  },
  sectionTitle: {
    color: '#727177',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  slotCard: {
    width: SLOT_CARD_WIDTH,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  slotInfo: {
    flex: 1,
  },
  slotTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  slotStatus: {
    fontSize: 13,
    fontWeight: '500',
  },
  slotStatusAvailable: {
    color: '#00E96A',
  },
  slotStatusWarning: {
    color: '#E07538',
  },
  bookButton: {
    width: 80,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4E266E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MembershipBookingScreen;