import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const DietWaterWidget = () => {
  const [waterVolume, setWaterVolume] = useState(0.9);
  const [selectedIncrement, setSelectedIncrement] = useState(0.2);
  const targetVolume = 4.0;

  const handleAddWater = () => {
    setWaterVolume((prev) => Math.min(8.0, prev + selectedIncrement));
  };

  const handleSubtractWater = () => {
    setWaterVolume((prev) => Math.max(0.0, prev - selectedIncrement));
  };

  const percent = Math.round((waterVolume / targetVolume) * 100);
  const totalDrops = 8;
  const activeDropsCount = Math.min(totalDrops, Math.round((waterVolume / targetVolume) * totalDrops));
  const recommendedUntilNow = (targetVolume * 0.7).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.waterWidget}>
        <View style={styles.waterInfo}>
          <View style={styles.waterTitleRow}>
            <Text style={styles.waterTitle}>Water </Text>
            <Text style={styles.waterAmount}>{waterVolume.toFixed(1)}L </Text>
            <Text style={styles.waterPercent}>({percent}%)</Text>
          </View>
          <Text style={styles.waterSubtitle}>Recommended until now {recommendedUntilNow}L</Text>
          
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
