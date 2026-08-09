import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const DietWaterWidget = ({ selectedDate }) => {
  const [waterVolume, setWaterVolume] = useState(0.0);
  const [selectedIncrement, setSelectedIncrement] = useState(0.2);
  const [targetVolume, setTargetVolume] = useState(4.0); // Default 4.0L (16 glasses)

  const dateKey = selectedDate 
    ? (selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate).split('T')[0])
    : new Date().toISOString().split('T')[0];

  // Load water volume for the selected date on mount / date change
  useEffect(() => {
    const loadWaterVolume = async () => {
      try {
        const savedVal = await AsyncStorage.getItem(`water_intake_${dateKey}`);
        if (savedVal !== null) {
          setWaterVolume(parseFloat(savedVal));
        } else {
          setWaterVolume(0.0);
        }

        const savedGoal = await AsyncStorage.getItem('water_glasses_goal');
        if (savedGoal) {
          const glasses = parseInt(savedGoal, 10);
          setTargetVolume(glasses * 0.25);
        } else {
          setTargetVolume(4.0);
        }
      } catch (err) {
        console.error('Failed to load water volume:', err);
        setWaterVolume(0.0);
      }
    };
    loadWaterVolume();
  }, [dateKey]);

  const handleAddWater = async () => {
    const newVal = Math.min(8.0, waterVolume + selectedIncrement);
    setWaterVolume(newVal);
    try {
      await AsyncStorage.setItem(`water_intake_${dateKey}`, newVal.toFixed(1));
    } catch (err) {
      console.error('Failed to save water volume:', err);
    }
  };

  const handleSubtractWater = async () => {
    const newVal = Math.max(0.0, waterVolume - selectedIncrement);
    setWaterVolume(newVal);
    try {
      await AsyncStorage.setItem(`water_intake_${dateKey}`, newVal.toFixed(1));
    } catch (err) {
      console.error('Failed to save water volume:', err);
    }
  };

  const percent = Math.min(100, Math.round((waterVolume / targetVolume) * 100));
  const totalDrops = 7;
  const activeDropsCount = Math.min(totalDrops, Math.round((waterVolume / targetVolume) * totalDrops));

  return (
    <View style={styles.container}>
      {/* Left side info block */}
      <View style={styles.leftBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.waterBlueTitle}>Water </Text>
          <Text style={styles.waterWhiteValue}>{waterVolume.toFixed(1)}L </Text>
          <Text style={styles.waterWhitePercent}>({percent}%)</Text>
        </View>
        <Text style={styles.subtext}>Daily Target {targetVolume.toFixed(1)}L</Text>

        {/* Drops row */}
        <View style={styles.dropsRow}>
          {Array.from({ length: totalDrops }).map((_, idx) => (
            <MaterialCommunityIcons 
              key={idx} 
              name="water" 
              size={18} 
              color={idx < activeDropsCount ? '#FF9500' : '#FFFFFF'} 
              style={{ marginRight: 6 }}
            />
          ))}
        </View>
      </View>

      {/* Right side controls block */}
      <View style={styles.rightBlock}>
        {/* Minus button */}
        <TouchableOpacity style={styles.circleBtn} onPress={handleSubtractWater} activeOpacity={0.7}>
          <Icon name="remove" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Vertical options list */}
        <View style={styles.verticalOptions}>
          <TouchableOpacity onPress={() => setSelectedIncrement(0.1)} style={styles.optBtn}>
            <Text style={selectedIncrement === 0.1 ? styles.optTextActive : styles.optTextInactive}>0.1L</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setSelectedIncrement(0.2)} style={styles.optBtn}>
            <Text style={selectedIncrement === 0.2 ? styles.optTextActive : styles.optTextInactive}>0.2L</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setSelectedIncrement(0.3)} style={styles.optBtn}>
            <Text style={selectedIncrement === 0.3 ? styles.optTextActive : styles.optTextInactive}>0.3L</Text>
          </TouchableOpacity>
        </View>

        {/* Plus button */}
        <TouchableOpacity style={styles.circleBtn} onPress={handleAddWater} activeOpacity={0.7}>
          <Icon name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  waterBlueTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  waterWhiteValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  waterWhitePercent: {
    color: '#FFF',
    fontSize: 16,
  },
  subtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  dropsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 150,
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalOptions: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
  },
  optBtn: {
    paddingVertical: 2,
  },
  optTextActive: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  optTextInactive: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 11,
  },
});

export default DietWaterWidget;
