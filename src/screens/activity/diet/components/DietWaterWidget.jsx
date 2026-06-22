import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
 
const DietWaterWidget = ({ selectedDate }) => {
  const [waterVolume, setWaterVolume] = useState(0.0);
  const [selectedIncrement, setSelectedIncrement] = useState(0.2);
  const targetVolume = 4.0;
 
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
 
  const percent = Math.round((waterVolume / targetVolume) * 100);
  const totalDrops = 8;
  const activeDropsCount = Math.min(totalDrops, Math.round((waterVolume / targetVolume) * totalDrops));
 
  return (
    <View style={styles.container}>
      <View style={styles.waterWidget}>
        <View style={styles.waterInfo}>
          <View style={styles.waterTitleRow}>
            <Text style={styles.waterTitle}>Water </Text>
            <Text style={styles.waterAmount}>{waterVolume.toFixed(1)}L </Text>
            <Text style={styles.waterPercent}>({percent}%)</Text>
          </View>
          <Text style={styles.waterSubtitle}>Daily Goal: {targetVolume.toFixed(1)}L</Text>
          
          <View style={styles.dropsRow}>
            {Array.from({ length: totalDrops }).map((_, idx) => (
              <MaterialCommunityIcons 
                key={idx} 
                name="water" 
                size={16} 
                color={idx < activeDropsCount ? '#4C84FF' : 'rgba(255, 255, 255, 0.15)'} 
              />
            ))}
          </View>
        </View>
 
        <View style={styles.waterControls}>
          <TouchableOpacity style={styles.waterBtn} onPress={handleSubtractWater} activeOpacity={0.7}>
            <Icon name="remove" size={16} color="#4C84FF" />
          </TouchableOpacity>
 
          <View style={styles.waterOptions}>
            <TouchableOpacity onPress={() => setSelectedIncrement(0.1)}>
              <Text style={selectedIncrement === 0.1 ? styles.waterOptionActive : styles.waterOptionInactive}>0.1L</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedIncrement(0.2)}>
              <Text style={selectedIncrement === 0.2 ? styles.waterOptionActive : styles.waterOptionInactive}>0.2L</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedIncrement(0.3)}>
              <Text style={selectedIncrement === 0.3 ? styles.waterOptionActive : styles.waterOptionInactive}>0.3L</Text>
            </TouchableOpacity>
          </View>
 
          <TouchableOpacity style={styles.waterBtn} onPress={handleAddWater} activeOpacity={0.7}>
            <Icon name="add" size={16} color="#4C84FF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  waterWidget: {
    backgroundColor: '#111115',
    borderRadius: 24,
    padding: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  waterInfo: {
    flex: 1,
  },
  waterTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  waterTitle: {
    color: '#4C84FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waterAmount: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  waterPercent: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  waterSubtitle: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    marginBottom: 12,
    fontWeight: '500',
  },
  dropsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
  },
  waterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 132, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterOptions: {
    marginHorizontal: 12,
    alignItems: 'center',
  },
  waterOptionInactive: {
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: 10,
    marginVertical: 1,
    fontWeight: '600',
  },
  waterOptionActive: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 1,
  },
});

export default DietWaterWidget;
