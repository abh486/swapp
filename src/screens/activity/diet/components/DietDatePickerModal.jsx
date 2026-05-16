import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

const DietDatePickerModal = ({ 
  showDatePicker, 
  selectedDate, 
  handleDateChange, 
  handleIOSDonePress 
}) => {
  if (Platform.OS === 'ios') {
    return (
      <Modal visible={showDatePicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlayCentered}>
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => handleDateChange(event, date)} 
              textColor="#000"
            />
            
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={handleIOSDonePress}
            >
              <Text style={styles.datePickerButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Android
  if (showDatePicker) {
    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={(event, date) => handleDateChange(event, date)} 
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    alignItems: 'center',
  },
  datePickerButton: {
    marginTop: 15,
    backgroundColor: '#FF5722',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  datePickerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DietDatePickerModal;
