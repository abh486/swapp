import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';

const WeightBodyMetricsScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState({
    height: '',
    weight: '',
    targetWeight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    bmr: '',
    boneMass: '',
    bodyHydration: '',
    metabolicAge: '',
    protein: '',
    skeletalMuscle: '',
    subcutaneousFat: '',
  });

  const [selectedMetric, setSelectedMetric] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Ideal ranges definition
  const metricConfigs = [
    { key: 'height', label: 'Height', suffix: ' cm', range: 'Configure your height' },
    { key: 'weight', label: 'Weight', suffix: ' kg', range: 'Configure your weight' },
    { key: 'targetWeight', label: 'Target Weight', suffix: ' kg', range: 'Configure your goal weight' },
    { key: 'bodyFat', label: 'Body Fat', suffix: '%', range: 'Ideal range: 8.0% - 19.99%' },
    { key: 'muscleMass', label: 'Muscle Mass %', suffix: '%', range: 'Ideal range: 75.01% - 89.0%' },
    { key: 'bmi', label: 'BMI', suffix: '', range: 'Ideal range: 18.5 - 23.0' },
    { key: 'bmr', label: 'BMR', suffix: ' kcal', range: 'Ideal range: 1360.0 - 1919.99' },
    { key: 'boneMass', label: 'Bone Mass', suffix: '%', range: 'Ideal range: 3.11% - 10.0%' },
    { key: 'bodyHydration', label: 'Body Hydration', suffix: '%', range: 'Ideal range: 50.0% - 64.99%' },
    { key: 'metabolicAge', label: 'Metabolic Age', suffix: ' yrs', range: 'Ideal range: 18 - 45' },
    { key: 'protein', label: 'Protein', suffix: '%', range: 'Ideal range: 16.0% - 19.99%' },
    { key: 'skeletalMuscle', label: 'Skeletal Muscle', suffix: '%', range: 'Ideal range: 33.3% - 39.39%' },
    { key: 'subcutaneousFat', label: 'Subcutaneous Fat', suffix: '%', range: 'Ideal range: 1.0% - 10.0%' },
  ];

  // Load metrics from local persistence
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const stored = await AsyncStorage.getItem('weight_body_metrics');
        if (stored) {
          setMetrics(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load metrics:', err);
      }
    };
    loadMetrics();
  }, []);

  const openInputModal = (config) => {
    setSelectedMetric(config);
    setInputValue(metrics[config.key] ? String(metrics[config.key]) : '');
    setModalVisible(true);
  };

  const handleSaveMetric = async () => {
    if (!selectedMetric) return;

    const newMetrics = {
      ...metrics,
      [selectedMetric.key]: inputValue.trim(),
    };

    setMetrics(newMetrics);
    setModalVisible(false);

    try {
      await AsyncStorage.setItem('weight_body_metrics', JSON.stringify(newMetrics));
      
      // Sync to Swapp Backend to allow NutriAI macro calculation
      if (selectedMetric.key === 'height' || selectedMetric.key === 'weight') {
        const profileUpdate = {};
        if (newMetrics.height) profileUpdate.height = parseFloat(newMetrics.height);
        if (newMetrics.weight) profileUpdate.weight = parseFloat(newMetrics.weight);
        if (Object.keys(profileUpdate).length > 0) {
          await apiClient.put('/users/profile', profileUpdate);
        }
      }
    } catch (err) {
      console.error('Failed to persist metrics:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight & Body Metrics</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="settings-sharp" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Health Logs Parameters</Text>

        <View style={styles.listContainer}>
          {metricConfigs.map((config) => {
            const val = metrics[config.key];
            const isSet = val !== '' && val !== undefined && val !== null;

            return (
              <TouchableOpacity
                key={config.key}
                style={styles.metricRow}
                onPress={() => {
                  if (config.key === 'weight' || config.key === 'targetWeight') {
                    navigation.navigate('WeightTracker');
                  } else {
                    openInputModal(config);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  {isSet ? (
                    <Text style={styles.metricTitle}>{config.label}</Text>
                  ) : (
                    <Text style={styles.clickToAddText}>Click here to add {config.label}</Text>
                  )}
                  <Text style={styles.rangeText}>{config.range}</Text>
                </View>

                <View style={styles.rowRight}>
                  {isSet && (
                    <Text style={styles.metricValue}>
                      {val}
                      <Text style={styles.suffixText}>{config.suffix}</Text>
                    </Text>
                  )}
                  <Icon name="add" size={20} color="rgba(255,255,255,0.6)" style={styles.plusIcon} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Input Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalHeaderTitle}>Add/Update {selectedMetric?.label}</Text>
            <Text style={styles.modalSubtitle}>{selectedMetric?.range}</Text>

            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              placeholder={`Enter value in ${selectedMetric?.suffix || 'units'}`}
              placeholderTextColor="#666"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveMetric}
              >
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
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  listContainer: {
    backgroundColor: '#111115',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowLeft: {
    flex: 1,
    paddingRight: 10,
  },
  metricTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  clickToAddText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  rangeText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  suffixText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  plusIcon: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#1C1C24',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  textInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#0F0F14',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 12,
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#00E676',
  },
  saveBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default WeightBodyMetricsScreen;
