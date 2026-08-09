import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const BLUE_BRAND = '#3B72FF';
const LIGHT_BLUE = '#A2DFFF';
const EXTRALIGHT_BLUE = '#1E293B';
const LIGHT_GRAY = '#1A1A1E';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)';
const DARK_GRAY = '#121214';

const HydrationTrackerScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // States
  const [waterVolume, setWaterVolume] = useState(0.0); // stored in Liters
  const [targetGlasses, setTargetGlasses] = useState(16);
  const [volumeUnit, setVolumeUnit] = useState('ml'); // 'ml' | 'oz'
  const [reminderActive, setReminderActive] = useState(false);
  const [rating, setRating] = useState(0);

  // Weekly analysis data
  const [weeklyAnalysis, setWeeklyAnalysis] = useState([]);

  // Modal Visibility
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('16');

  // Key configurations
  const WATER_GOAL_KEY = 'water_glasses_goal';
  const UNIT_SETTING_KEY = 'water_volume_unit';
  const REMINDER_KEY = 'water_reminder_active';

  const dateKey = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  // Load configuration and daily volume
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedGoal = await AsyncStorage.getItem(WATER_GOAL_KEY);
        if (savedGoal) {
          setTargetGlasses(parseInt(savedGoal, 10));
        } else {
          setTargetGlasses(16);
          await AsyncStorage.setItem(WATER_GOAL_KEY, '16');
        }

        const savedUnit = await AsyncStorage.getItem(UNIT_SETTING_KEY);
        if (savedUnit) setVolumeUnit(savedUnit);

        const savedReminder = await AsyncStorage.getItem(REMINDER_KEY);
        if (savedReminder) setReminderActive(savedReminder === 'true');
      } catch (err) {
        console.error('Failed to load hydration settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Fetch volume whenever dateKey changes
  useEffect(() => {
    const loadDailyVolume = async () => {
      try {
        const savedVal = await AsyncStorage.getItem(`water_intake_${dateKey}`);
        if (savedVal !== null) {
          setWaterVolume(parseFloat(savedVal));
        } else {
          setWaterVolume(0.0); // default to 0 for new days
        }
      } catch (err) {
        console.error('Failed to load daily water volume:', err);
        setWaterVolume(0.0);
      }
    };
    loadDailyVolume();
  }, [dateKey]);

  // Fetch Last 7 Days analysis (dynamic calculation from AsyncStorage)
  useEffect(() => {
    const fetchWeeklyAnalysis = async () => {
      try {
        const analysis = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split('T')[0];
          const weekday = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // 'S', 'M', 'T', etc.
          
          const savedVal = await AsyncStorage.getItem(`water_intake_${key}`);
          const liters = savedVal ? parseFloat(savedVal) : 0.0;
          const glasses = liters / 0.25; // Convert Liters to glasses count
          analysis.push({
            day: weekday,
            value: glasses,
          });
        }
        setWeeklyAnalysis(analysis);
      } catch (err) {
        console.error('Failed to fetch weekly analysis:', err);
      }
    };

    fetchWeeklyAnalysis();
  }, [waterVolume, selectedDate]);

  // Compute glasses logged (1 glass = 250ml = 0.25L)
  const currentGlasses = useMemo(() => {
    return Math.round(waterVolume / 0.25);
  }, [waterVolume]);

  const totalVolumeDisplay = useMemo(() => {
    const totalMl = currentGlasses * 250;
    if (volumeUnit === 'ml') {
      return `${totalMl.toLocaleString('en-US')} ml`;
    } else {
      const totalOz = (currentGlasses * 8.4535).toFixed(1);
      return `${parseFloat(totalOz)} oz`;
    }
  }, [currentGlasses, volumeUnit]);

  // Save changes
  const saveWaterVolume = async (newVal) => {
    const clamped = Math.max(0.0, Math.min(8.0, newVal));
    setWaterVolume(clamped);
    try {
      await AsyncStorage.setItem(`water_intake_${dateKey}`, clamped.toFixed(2));
    } catch (err) {
      console.error('Failed to save water intake:', err);
    }
  };

  const handlePlus = () => {
    saveWaterVolume(waterVolume + 0.25);
  };

  const handleMinus = () => {
    if (currentGlasses > 0) {
      saveWaterVolume(waterVolume - 0.25);
    }
  };

  const handleSaveGoal = async () => {
    const goalVal = parseInt(goalInput, 10);
    if (isNaN(goalVal) || goalVal <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid number of glasses.');
      return;
    }
    setTargetGlasses(goalVal);
    setGoalModalVisible(false);
    try {
      await AsyncStorage.setItem(WATER_GOAL_KEY, String(goalVal));
    } catch (err) {
      console.error('Failed to save water goal:', err);
    }
  };

  const toggleVolumeUnit = async () => {
    const nextUnit = volumeUnit === 'ml' ? 'oz' : 'ml';
    setVolumeUnit(nextUnit);
    try {
      await AsyncStorage.setItem(UNIT_SETTING_KEY, nextUnit);
    } catch (err) {
      console.error('Failed to save volume unit:', err);
    }
  };

  const toggleReminder = async () => {
    const nextState = !reminderActive;
    setReminderActive(nextState);
    try {
      await AsyncStorage.setItem(REMINDER_KEY, String(nextState));
    } catch (err) {
      console.error('Failed to save reminder setting:', err);
    }
  };

  // Date selection actions
  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const formattedDateHeader = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (dateKey === today.toISOString().split('T')[0]) {
      return `Today, ${selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
    } else if (dateKey === yesterday.toISOString().split('T')[0]) {
      return `Yesterday, ${selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
    } else {
      return selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }, [selectedDate, dateKey]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Date Dropdown */}
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateSelector}>
          <Text style={styles.dateText}>{formattedDateHeader}</Text>
          <Icon name="caret-down" size={14} color="#FFF" style={styles.caret} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="share-outline" size={22} color="#FFF" />
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Goal summary text and edit */}
        <View style={styles.goalRowContainer}>
          <View style={styles.goalTextContainer}>
            <Text style={styles.goalTitleText}>
              {currentGlasses} of {targetGlasses} Glasses
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => {
              setGoalInput(String(targetGlasses));
              setGoalModalVisible(true);
            }} 
            style={styles.editGoalBtn}
          >
            <Icon name="pencil" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.lineDivider} />

        {/* Circular glass illustration and adjustment */}
        <View style={styles.waterControlSection}>
          {/* Subtract Button */}
          <TouchableOpacity 
            onPress={handleMinus} 
            disabled={currentGlasses === 0} 
            style={[styles.stepCircleBtn, currentGlasses === 0 && styles.disabledBtn]}
          >
            <Icon name="remove" size={22} color={currentGlasses === 0 ? 'rgba(255, 255, 255, 0.3)' : '#FFF'} />
          </TouchableOpacity>

          {/* Central Blue circle containing custom SVG glass */}
          <View style={styles.glassIndicatorCircle}>
            <Svg width={70} height={90} viewBox="0 0 70 90">
              {/* Main glass frame outline */}
              <Path
                d="M 15 15 L 55 15 L 48 80 L 22 80 Z"
                fill="#121214"
                stroke={BLUE_BRAND}
                strokeWidth={4.5}
                strokeLinejoin="round"
              />
              {/* Glass water content fill */}
              {currentGlasses > 0 && (
                <Path
                  d={`M ${15 + (currentGlasses >= targetGlasses ? 0 : 2)} ${
                    15 + Math.max(0, 60 - (currentGlasses / targetGlasses) * 60)
                  } L ${55 - (currentGlasses >= targetGlasses ? 0 : 2)} ${
                    15 + Math.max(0, 60 - (currentGlasses / targetGlasses) * 60)
                  } L 48 80 L 22 80 Z`}
                  fill={LIGHT_BLUE}
                />
              )}
            </Svg>
          </View>

          {/* Add Button */}
          <TouchableOpacity onPress={handlePlus} style={[styles.stepCircleBtn, styles.plusBtnActive]}>
            <Icon name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Current quantity display */}
        <Text style={styles.glassLabelText}>
          {currentGlasses} {currentGlasses === 1 ? 'Glass' : 'Glasses'} ({totalVolumeDisplay})
        </Text>

        <View style={styles.settingsSection}>
          {/* Reminder option */}
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Reminder</Text>
            <TouchableOpacity onPress={toggleReminder} style={styles.settingsActionBtn}>
              <Text style={styles.settingsActionText}>
                {reminderActive ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.horizontalDivider} />

          {/* Volume unit settings */}
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Volume unit set to {volumeUnit}</Text>
            <TouchableOpacity onPress={toggleVolumeUnit} style={styles.settingsActionBtn}>
              <Text style={styles.settingsActionText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips section matching screenshot bottom card */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsHeaderTitle}>Today's Tip</Text>
          
          <View style={styles.tipCard}>
            <View style={styles.tipIconWrapper}>
              <Svg width={30} height={40} viewBox="0 0 30 40">
                <Path
                  d="M 6 6 L 24 6 L 21 34 L 9 34 Z"
                  fill="transparent"
                  stroke={BLUE_BRAND}
                  strokeWidth={2}
                />
                <Path
                  d="M 7 16 L 23 16 L 21 34 L 9 34 Z"
                  fill={LIGHT_BLUE}
                />
              </Svg>
            </View>
            <View style={styles.tipTextContainer}>
              <Text style={styles.tipBodyText}>
                Stay hydrated! Your next glass of water is due in 60 minutes
              </Text>
            </View>
          </View>
        </View>

        {/* Analysis Chart Section */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisHeaderRow}>
            <Text style={styles.analysisTitle}>Analysis</Text>
            <Text style={styles.analysisSubtitle}>Last 7 days</Text>
          </View>

          <View style={styles.chartWrapper}>
            <View style={styles.barChartContainer}>
              {weeklyAnalysis.map((item, index) => {
                const maxVal = Math.max(...weeklyAnalysis.map(x => x.value), 10);
                const percentHeight = Math.min(100, (item.value / maxVal) * 100);

                return (
                  <View key={index} style={styles.chartColumn}>
                    <Text style={styles.barValueText}>{item.value.toFixed(2)}</Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.chartBar, { height: `${percentHeight}%`, minHeight: item.value > 0 ? 4 : 0 }]} />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.baseline} />
            <View style={styles.dayLabelsRow}>
              {weeklyAnalysis.map((item, index) => (
                <View key={index} style={styles.chartColumn}>
                  <Text style={styles.dayLabelText}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Feedback Card Section */}
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Your feedback is very important!</Text>
          <Text style={styles.feedbackSubtitle}>Let us know what you think about this tracker.</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isFilled = starVal <= rating;
              return (
                <TouchableOpacity key={starVal} onPress={() => setRating(starVal)}>
                  <Icon
                    name={isFilled ? 'star' : 'star-outline'}
                    size={28}
                    color={isFilled ? '#FBBF24' : '#4B5563'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal visible={goalModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Target Goal</Text>
            <Text style={styles.modalLabel}>Number of glasses per day</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              placeholderTextColor="#666"
              keyboardType="numeric"
              autoFocus
              value={goalInput}
              onChangeText={setGoalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setGoalModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveGoal} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  headerBtn: {
    padding: 6,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  caret: {
    marginLeft: 6,
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  goalRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editGoalBtn: {
    padding: 8,
  },
  lineDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
    marginHorizontal: 20,
    marginBottom: 40,
  },
  waterControlSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginVertical: 16,
  },
  stepCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
  plusBtnActive: {
    backgroundColor: BLUE_BRAND,
  },
  glassIndicatorCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0F1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D3557',
  },
  glassLabelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  settingsSection: {
    marginHorizontal: 20,
    backgroundColor: '#0A0A0C',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 40,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFF',
  },
  settingsActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  settingsActionText: {
    fontSize: 15,
    color: BLUE_BRAND,
    fontWeight: '600',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: BORDER_COLOR,
  },
  tipsSection: {
    paddingHorizontal: 20,
  },
  tipsHeaderTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    backgroundColor: '#0A0A0C',
  },
  tipIconWrapper: {
    marginRight: 16,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipBodyText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  analysisSection: {
    paddingHorizontal: 20,
    marginTop: 36,
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  analysisSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 100,
    alignItems: 'flex-end',
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 6,
    fontWeight: '500',
  },
  barContainer: {
    height: 70,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: 14,
    backgroundColor: LIGHT_BLUE,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  baseline: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  dayLabelText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  feedbackCard: {
    marginHorizontal: 20,
    marginTop: 36,
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 16,
    backgroundColor: '#0A0A0C',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  feedbackSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#16161A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: BORDER_COLOR,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#FFF',
    backgroundColor: '#0F0F12',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: BLUE_BRAND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: BLUE_BRAND,
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

export default HydrationTrackerScreen;
