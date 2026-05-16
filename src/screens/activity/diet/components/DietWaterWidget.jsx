import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';

const DietWaterWidget = () => {
  return (
    <View style={styles.waterWidget}>
      <View style={styles.waterInfo}>
        <View style={styles.waterTitleRow}>
          <Text style={styles.waterTitle}>Water </Text>
          <Text style={styles.waterAmount}>0.9L </Text>
          <Text style={styles.waterPercent}>(75%)</Text>
        </View>
        <Text style={styles.waterSubtitle}>Recomended until now 1.4L</Text>
        
        <View style={styles.dropsRow}>
          {[1, 2, 3, 4, 5, 6].map((drop, idx) => (
            <MaterialCommunityIcons 
              key={idx} 
              name="water" 
              size={16} 
              color={idx < 4 ? '#4C84FF' : '#555'} 
              style={styles.waterDrop}
            />
          ))}
        </View>
      </View>

      <View style={styles.waterControls}>
        <TouchableOpacity style={styles.waterBtn}>
          <Icon name="remove" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.waterOptions}>
          <Text style={styles.waterOptionInactive}>0.1L</Text>
          <Text style={styles.waterOptionActive}>0.2L</Text>
          <Text style={styles.waterOptionInactive}>0.3L</Text>
        </View>
        <TouchableOpacity style={styles.waterBtn}>
          <Icon name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  waterWidget: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 35,
    padding: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    fontSize: 18,
    fontWeight: '600',
  },
  waterAmount: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  waterPercent: {
    color: '#888',
    fontSize: 12,
    marginLeft: 4,
  },
  waterSubtitle: {
    color: '#666',
    fontSize: 10,
    marginBottom: 10,
  },
  dropsRow: {
    flexDirection: 'row',
  },
  waterDrop: {
    marginRight: 6,
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4C84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterOptions: {
    marginHorizontal: 12,
    alignItems: 'center',
  },
  waterOptionInactive: {
    color: '#666',
    fontSize: 12,
    marginVertical: 2,
  },
  waterOptionActive: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
});

export default DietWaterWidget;
