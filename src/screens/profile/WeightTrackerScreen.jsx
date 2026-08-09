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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import apiClient from '../../api/apiClient';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 180;
const CHART_PADDING_LEFT = 35;
const CHART_PADDING_RIGHT = 15;
const CHART_PADDING_BOTTOM = 25;
const CHART_PADDING_TOP = 15;

const PURPLE = '#7C4DFF';
const LIGHT_PURPLE = '#311B92';
const DARK_GRAY = '#121214';
const LIGHT_GRAY = '#1A1A1E';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)';

const WeightTrackerScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Weight'); // 'Weight' | 'Body Fat'

  // Goal State
  const [goalType, setGoalType] = useState('Gained'); // 'Gained' | 'Lost'
  const [goalAmount, setGoalAmount] = useState('5.0');
  const [goalWeeks, setGoalWeeks] = useState('2');
  const [startingValue, setStartingValue] = useState('75.0');
  const [currentGoalVal, setCurrentGoalVal] = useState('80.0');

  // Log lists
  const [weightLogs, setWeightLogs] = useState([]);
  const [bodyFatLogs, setBodyFatLogs] = useState([]);

  // Selected chart data point
  const [selectedPointIndex, setSelectedPointIndex] = useState(1);

  // Modals Visibility
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);

  // Input states
  const [logValue, setLogValue] = useState('');
  const [logDateText, setLogDateText] = useState('');
  const [logPhoto, setLogPhoto] = useState(null);

  const WEIGHT_GOAL_KEY = 'weight_tracker_goal';
  const WEIGHT_LOGS_KEY = 'weight_tracker_logs';
  const BODY_FAT_LOGS_KEY = 'body_fat_tracker_logs';

  // Load Saved Goals and Logs
  useEffect(() => {
    const loadSavedData = async () => {
      let currentWeights = [];
      let currentFats = [];
      try {
        const savedWeightLogs = await AsyncStorage.getItem(WEIGHT_LOGS_KEY);
        if (savedWeightLogs) {
          currentWeights = JSON.parse(savedWeightLogs);
          setWeightLogs(currentWeights);
        }

        const savedFatLogs = await AsyncStorage.getItem(BODY_FAT_LOGS_KEY);
        if (savedFatLogs) {
          currentFats = JSON.parse(savedFatLogs);
          setBodyFatLogs(currentFats);
        }

        const savedGoal = await AsyncStorage.getItem(WEIGHT_GOAL_KEY);
        if (savedGoal) {
          const parsedGoal = JSON.parse(savedGoal);
          setGoalType(parsedGoal.goalType || 'Gained');
          setGoalAmount(parsedGoal.goalAmount || '5.0');
          setGoalWeeks(parsedGoal.goalWeeks || '2');
          setStartingValue(parsedGoal.startingValue || '75.0');
          setCurrentGoalVal(parsedGoal.currentGoalVal || '80.0');
        }

        // Fetch actual profile data from backend if locally saved lists are empty
        // Fetch actual profile data from cached user session or backend verify-member endpoint
        try {
          let profile = null;
          const cachedUser = await AsyncStorage.getItem('userProfile');
          if (cachedUser) {
            const userObj = JSON.parse(cachedUser);
            profile = userObj?.userProfile || userObj?.memberProfile || userObj;
          }

          if (!profile) {
            const response = await apiClient.post('/v1/auth/verify-member');
            if (response.data?.success && response.data.data?.user) {
              const userObj = response.data.data.user;
              profile = userObj?.userProfile || userObj?.memberProfile || userObj;
              await AsyncStorage.setItem('userProfile', JSON.stringify(userObj));
            }
          }

          if (profile) {
            // Handle initial Weight Log
            if (currentWeights.length === 0) {
              const weightVal = profile.weight?.value || profile.weight;
              if (weightVal) {
                const initialWLog = {
                  id: 'initial_profile_weight',
                  value: Number(weightVal),
                  date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                  timestamp: Date.now(),
                  source: 'Profile',
                  photo: null
                };
                setWeightLogs([initialWLog]);
                currentWeights = [initialWLog];
                await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify([initialWLog]));
              }
            }

            // Handle initial Body Fat Log
            if (currentFats.length === 0) {
              const fatVal = profile.fatPercentage || profile.bodyFatPercentage || profile.bodyFat || profile.bodyFat;
              if (fatVal) {
                const initialFLog = {
                  id: 'initial_profile_fat',
                  value: Number(fatVal),
                  date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                  timestamp: Date.now(),
                  source: 'Profile',
                  photo: null
                };
                setBodyFatLogs([initialFLog]);
                currentFats = [initialFLog];
                await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify([initialFLog]));
              }
            }

            // Sync starting and target weights from backend
            if (!savedGoal) {
              const startW = profile.weight?.value || profile.weight || (currentWeights[0]?.value) || 75.0;
              const targetW = profile.targetWeight?.value || profile.targetWeight || 80.0;
              setStartingValue(String(startW));
              setCurrentGoalVal(String(targetW));
              setGoalAmount(Math.abs(Number(targetW) - Number(startW)).toFixed(1));
              setGoalType(Number(targetW) >= Number(startW) ? 'Gained' : 'Lost');
            }
          }
        } catch (profileErr) {
          console.warn('[WeightTracker] Failed to load profile weight data:', profileErr.message);
        }

        // Adjust selected point marker index to last item
        setSelectedPointIndex(Math.max(0, Math.max(currentWeights.length, currentFats.length) - 1));
      } catch (err) {
        console.error('Failed to load weight tracker data:', err);
      }
    };
    loadSavedData();
  }, []);

  const handleSaveGoal = async () => {
    const goalData = {
      goalType,
      goalAmount,
      goalWeeks,
      startingValue,
      currentGoalVal,
    };
    try {
      await AsyncStorage.setItem(WEIGHT_GOAL_KEY, JSON.stringify(goalData));
      setGoalModalVisible(false);
    } catch (err) {
      console.error('Failed to save goal:', err);
      Alert.alert('Error', 'Could not save target goals.');
    }
  };

  const handlePickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
        setLogPhoto(response.assets[0].uri);
      }
    });
  };

  const handleAddLog = async () => {
    const val = parseFloat(logValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid numeric value.');
      return;
    }

    const dateStr = logDateText.trim() || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const newLog = {
      id: String(Date.now()),
      value: val,
      date: dateStr,
      timestamp: Date.now(),
      source: logPhoto ? 'Photo' : 'Manual',
      photo: logPhoto,
    };

    let updatedLogs = [];
    if (activeTab === 'Weight') {
      updatedLogs = [...weightLogs, newLog].sort((a, b) => a.timestamp - b.timestamp);
      setWeightLogs(updatedLogs);
      setSelectedPointIndex(updatedLogs.length - 1);
      try {
        await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updatedLogs));
        await apiClient.post('/weight/update', { weight: val });
      } catch (err) {
        console.warn('Backend sync failed, saved locally:', err.message);
      }
    } else {
      updatedLogs = [...bodyFatLogs, newLog].sort((a, b) => a.timestamp - b.timestamp);
      setBodyFatLogs(updatedLogs);
      setSelectedPointIndex(updatedLogs.length - 1);
      try {
        await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify(updatedLogs));
      } catch (err) {
        console.error('Local body fat save failed:', err);
      }
    }

    setLogValue('');
    setLogDateText('');
    setLogPhoto(null);
    setLogModalVisible(false);
  };

  const openAddLogModal = () => {
    const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    setLogDateText(todayStr);
    setLogValue('');
    setLogPhoto(null);
    setLogModalVisible(true);
  };

  const handleDeleteLog = (id) => {
    Alert.alert('Delete Log', 'Are you sure you want to delete this log entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (activeTab === 'Weight') {
            const filtered = weightLogs.filter((l) => l.id !== id);
            setWeightLogs(filtered);
            setSelectedPointIndex(Math.max(0, filtered.length - 1));
            await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(filtered));
          } else {
            const filtered = bodyFatLogs.filter((l) => l.id !== id);
            setBodyFatLogs(filtered);
            setSelectedPointIndex(Math.max(0, filtered.length - 1));
            await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify(filtered));
          }
        },
      },
    ]);
  };

  const currentLogs = useMemo(() => {
    return activeTab === 'Weight' ? weightLogs : bodyFatLogs;
  }, [activeTab, weightLogs, bodyFatLogs]);

  const progressProgress = useMemo(() => {
    if (currentLogs.length === 0) return 0;
    const startVal = parseFloat(startingValue) || currentLogs[0].value;
    const currentVal = currentLogs[currentLogs.length - 1].value;
    const targetVal = parseFloat(currentGoalVal) || (startVal + (goalType === 'Gained' ? 5 : -5));
    
    const totalDiff = Math.abs(targetVal - startVal);
    if (totalDiff === 0) return 0;
    
    const achievedDiff = Math.abs(currentVal - startVal);
    return Math.min(1, achievedDiff / totalDiff);
  }, [currentLogs, startingValue, currentGoalVal, goalType]);

  const gainedLostValue = useMemo(() => {
    if (currentLogs.length === 0) return '0.0';
    const startVal = parseFloat(startingValue) || currentLogs[0].value;
    const currentVal = currentLogs[currentLogs.length - 1].value;
    return Math.abs(currentVal - startVal).toFixed(1);
  }, [currentLogs, startingValue]);

  const unit = activeTab === 'Weight' ? 'kg' : '%';

  const circleRadius = 26;
  const strokeWidth = 4.5;
  const circ = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circ * (1 - progressProgress);

  const chartPoints = useMemo(() => {
    if (currentLogs.length === 0) return [];
    const yMin = 55;
    const yMax = 90;
    const yRange = yMax - yMin;

    const drawableWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
    const drawableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

    return currentLogs.map((log, index) => {
      let x = CHART_PADDING_LEFT;
      if (currentLogs.length > 1) {
        x = CHART_PADDING_LEFT + (index / (currentLogs.length - 1)) * drawableWidth;
      } else {
        x = CHART_PADDING_LEFT + drawableWidth / 2;
      }
      const val = Math.max(yMin, Math.min(yMax, log.value));
      const percentage = (val - yMin) / yRange;
      const y = CHART_PADDING_TOP + (1 - percentage) * drawableHeight;

      return { x, y, value: log.value, date: log.date, index };
    });
  }, [currentLogs]);

  const activePoint = chartPoints[selectedPointIndex] || chartPoints[chartPoints.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight Tracker</Text>
        <TouchableOpacity onPress={openAddLogModal} style={styles.addLogBtn}>
          <Text style={styles.addLogBtnText}>+ Add log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Progress Card Section */}
        <View style={styles.progressCard}>
          {/* Circular Progress Ring */}
          <View style={styles.progressRingWrapper}>
            <Svg width={64} height={64} viewBox="0 0 64 64">
              <Circle
                cx="32"
                cy="32"
                r={circleRadius}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx="32"
                cy="32"
                r={circleRadius}
                stroke={PURPLE}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circ}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 32 32)"
              />
            </Svg>
            <View style={styles.progressIconContainer}>
              <MaterialCommunityIcons name="scale-bathroom" size={20} color={PURPLE} />
            </View>
          </View>

          {/* Progress Values & Info */}
          <View style={styles.progressTextColumn}>
            <Text style={styles.progressTitleText}>
              {gainedLostValue} of {goalAmount} {unit} {goalType}
            </Text>
            <Text style={styles.progressSubtitleText}>{goalWeeks} weeks remaining</Text>
          </View>

          {/* Goal Edit Button */}
          <TouchableOpacity onPress={() => setGoalModalVisible(true)} style={styles.editGoalBtn}>
            <Icon name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Tab Buttons Selection */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Weight' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('Weight');
              setSelectedPointIndex(0);
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Weight' && styles.tabButtonTextActive]}>
              Weight
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'Body Fat' && styles.tabButtonActive]}
            onPress={() => {
              setActiveTab('Body Fat');
              setSelectedPointIndex(0);
            }}
          >
            <Text style={[styles.tabButtonText, activeTab === 'Body Fat' && styles.tabButtonTextActive]}>
              Body Fat
            </Text>
          </TouchableOpacity>
        </View>

        {/* SVG interactive chart area */}
        <View style={styles.chartContainer}>
          {currentLogs.length === 0 ? (
            <View style={styles.chartPlaceholder}>
              <Icon name="stats-chart" size={36} color="rgba(255, 255, 255, 0.15)" style={{ marginBottom: 8 }} />
              <Text style={styles.placeholderText}>No weight records logged yet</Text>
              <Text style={styles.placeholderSubtext}>Tap "+ Add log" at the top to record weight</Text>
            </View>
          ) : (
            <>
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                {[90, 85, 80, 75, 70, 65, 60, 55].map((labelVal) => {
                  const yMin = 55;
                  const yMax = 90;
                  const percentage = (labelVal - yMin) / (yMax - yMin);
                  const drawableHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
                  const y = CHART_PADDING_TOP + (1 - percentage) * drawableHeight;

                  return (
                    <React.Fragment key={labelVal}>
                      <Line
                        x1={CHART_PADDING_LEFT}
                        y1={y}
                        x2={CHART_WIDTH - CHART_PADDING_RIGHT}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeWidth={1}
                        strokeDasharray={labelVal === 80 ? "4 2" : "0"}
                      />
                      <SvgText
                        x={CHART_PADDING_LEFT - 8}
                        y={y + 4}
                        fontSize="10"
                        fill="rgba(255, 255, 255, 0.4)"
                        textAnchor="end"
                        fontWeight="500"
                      >
                        {labelVal}
                      </SvgText>
                    </React.Fragment>
                  );
                })}

                {chartPoints.length > 1 && (
                  <Path
                    d={chartPoints.reduce((pathStr, p, idx) => {
                      return pathStr + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
                    }, '')}
                    fill="none"
                    stroke={PURPLE}
                    strokeWidth={2}
                  />
                )}

                {chartPoints.map((pt, idx) => {
                  const isSelected = idx === selectedPointIndex;
                  return (
                    <React.Fragment key={idx}>
                      <Rect
                        x={pt.x - 20}
                        y={CHART_PADDING_TOP}
                        width={40}
                        height={CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM}
                        fill="transparent"
                        onPress={() => setSelectedPointIndex(idx)}
                      />
                      <Circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#000' : PURPLE}
                        stroke={PURPLE}
                        strokeWidth={isSelected ? 3.5 : 0}
                        onPress={() => setSelectedPointIndex(idx)}
                      />
                    </React.Fragment>
                  );
                })}

                {chartPoints.map((pt, idx) => {
                  if (idx === 0 || idx === chartPoints.length - 1) {
                    const dateParts = pt.date.split(',');
                    const label = dateParts[0] || pt.date;

                    return (
                      <SvgText
                        key={idx}
                        x={pt.x}
                        y={CHART_HEIGHT - 6}
                        fontSize="10"
                        fill="rgba(255, 255, 255, 0.4)"
                        textAnchor="center"
                        fontWeight="500"
                      >
                        {label}
                      </SvgText>
                    );
                  }
                  return null;
                })}
              </Svg>

              {activePoint && (
                <View
                  style={[
                    styles.tooltipContainer,
                    {
                      left: Math.max(
                        CHART_PADDING_LEFT,
                        Math.min(
                          CHART_WIDTH - 120,
                          activePoint.x - 50
                        )
                      ),
                      top: Math.max(5, activePoint.y - 65),
                    },
                  ]}
                >
                  <View style={styles.tooltipBox}>
                    <Text style={styles.tooltipValText}>
                      {activePoint.value.toFixed(1)} {unit}
                    </Text>
                    <Text style={styles.tooltipDateText}>{activePoint.date}</Text>
                  </View>
                  <View style={styles.tooltipArrow} />
                </View>
              )}
            </>
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={styles.idealWeightSquare} />
            <Text style={styles.legendText}>Ideal Weight</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={styles.goalDashedLine} />
            <Text style={styles.legendText}>Your Goal</Text>
          </View>
        </View>

        <View style={styles.dividerBand} />

        {/* Timeline Logs Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>Timeline</Text>

          <View style={styles.timelineListContainer}>
            <View style={styles.timelineVerticalLine} />

            {currentLogs.slice().reverse().map((log) => {
              return (
                <View key={log.id} style={styles.timelineRow}>
                  <View style={styles.timelineDotOuter}>
                    <View style={styles.timelineDotInner} />
                  </View>

                  <TouchableOpacity
                    style={styles.timelineCard}
                    activeOpacity={0.9}
                    onLongPress={() => handleDeleteLog(log.id)}
                  >
                    <View style={styles.timelineCardLeft}>
                      <Text style={styles.timelineValueText}>
                        {log.value.toFixed(1)} <Text style={styles.timelineUnitText}>{unit}</Text>
                      </Text>
                      <Text style={styles.timelineSubText}>
                        {log.date} • {log.source}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        if (log.photo) {
                          Alert.alert('Log Image', 'View or change image?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'View Image', onPress: () => Alert.alert('Photo', 'Display photo preview modal placeholder') }
                          ]);
                        } else {
                          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
                            if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
                              const photoUri = response.assets[0].uri;
                              const updated = currentLogs.map(item => item.id === log.id ? { ...item, photo: photoUri, source: 'Photo' } : item);
                              if (activeTab === 'Weight') {
                                setWeightLogs(updated);
                                await AsyncStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(updated));
                              } else {
                                setBodyFatLogs(updated);
                                await AsyncStorage.setItem(BODY_FAT_LOGS_KEY, JSON.stringify(updated));
                              }
                            }
                          });
                        }
                      }}
                      style={styles.cameraIconContainer}
                    >
                      {log.photo ? (
                        <Image source={{ uri: log.photo }} style={styles.logThumbImage} />
                      ) : (
                        <Icon name="camera" size={20} color={PURPLE} />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Goal Edit Settings Modal Overlay */}
      <Modal visible={goalModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Goals</Text>

            <Text style={styles.label}>Goal Type</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[styles.typeBtn, goalType === 'Gained' && styles.typeBtnActive]}
                onPress={() => setGoalType('Gained')}
              >
                <Text style={[styles.typeBtnText, goalType === 'Gained' && styles.typeBtnTextActive]}>Gained</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, goalType === 'Lost' && styles.typeBtnActive]}
                onPress={() => setGoalType('Lost')}
              >
                <Text style={[styles.typeBtnText, goalType === 'Lost' && styles.typeBtnTextActive]}>Lost</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Goal Amount ({unit})</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5.0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={goalAmount}
              onChangeText={setGoalAmount}
            />

            <Text style={styles.label}>Weeks Remaining</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={goalWeeks}
              onChangeText={setGoalWeeks}
            />

            <Text style={styles.label}>Starting Weight ({unit})</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 75.0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={startingValue}
              onChangeText={setStartingValue}
            />

            <Text style={styles.label}>Target Goal Weight ({unit})</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 80.0"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={currentGoalVal}
              onChangeText={setCurrentGoalVal}
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

      {/* Add Log Modal Overlay */}
      <Modal visible={logModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add {activeTab} Log</Text>

            <Text style={styles.label}>Value ({unit})</Text>
            <TextInput
              style={styles.input}
              placeholder={`Enter current ${activeTab.toLowerCase()}`}
              placeholderTextColor="#666"
              keyboardType="numeric"
              autoFocus
              value={logValue}
              onChangeText={setLogValue}
            />

            <Text style={styles.label}>Date Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 13 Jun, 2026"
              placeholderTextColor="#666"
              value={logDateText}
              onChangeText={setLogDateText}
            />

            <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPickerBtn}>
              {logPhoto ? (
                <View style={styles.photoContainer}>
                  <Image source={{ uri: logPhoto }} style={styles.previewImage} />
                  <Text style={styles.photoPickerText}>Change Photo</Text>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Icon name="camera-outline" size={24} color="#888" />
                  <Text style={styles.photoPickerText}>Attach Progress Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setLogModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddLog} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Add</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: '#000',
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addLogBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addLogBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: PURPLE,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#0A0A0C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 20,
  },
  progressRingWrapper: {
    position: 'relative',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  progressTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  progressSubtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  editGoalBtn: {
    padding: 8,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tabButtonActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  tabButtonTextActive: {
    color: '#FFF',
  },
  chartContainer: {
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 16,
    height: CHART_HEIGHT,
  },
  tooltipContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
    zIndex: 100,
  },
  tooltipBox: {
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  tooltipValText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFF',
  },
  tooltipDateText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idealWeightSquare: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 3,
  },
  goalDashedLine: {
    width: 18,
    height: 1.5,
    borderWidth: 1,
    borderColor: PURPLE,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  dividerBand: {
    height: 8,
    backgroundColor: '#0F0F12',
    marginVertical: 16,
  },
  timelineSection: {
    paddingHorizontal: 16,
  },
  timelineTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  timelineListContainer: {
    position: 'relative',
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 8,
    top: 12,
    bottom: 24,
    width: 2,
    backgroundColor: BORDER_COLOR,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  timelineDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  timelineCardLeft: {
    flex: 1,
  },
  timelineValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PURPLE,
  },
  timelineUnitText: {
    fontSize: 13,
    fontWeight: 'normal',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  timelineSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  cameraIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logThumbImage: {
    width: '100%',
    height: '100%',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    marginTop: 12,
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
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  typeBtnText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFF',
  },
  photoPickerBtn: {
    marginTop: 16,
    height: 100,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F12',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  photoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoPickerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  chartPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 20,
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default WeightTrackerScreen;
