import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AccessSelectionSheet({ visible, eligibleSources, onClose, onSelect }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Access</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Choose how you want to access this service.</Text>
          
          <ScrollView style={styles.scroll}>
            {eligibleSources && eligibleSources.length > 0 ? (
              eligibleSources.map((source, index) => (
                <TouchableOpacity key={index} style={styles.option} onPress={() => onSelect(source.id)}>
                  <Icon name="ticket-outline" size={24} color="#007AFF" />
                  <View style={styles.optionDetails}>
                    <Text style={styles.optionTitle}>{source.type} - {source.providerName}</Text>
                    <Text style={styles.optionSub}>{source.categoryName} • {source.remaining} remaining</Text>
                    <Text style={styles.optionExpiry}>Expires: {new Date(source.validUntil).toLocaleDateString()}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No eligible access sources found for this journey.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#AAA',
    marginBottom: 16,
  },
  scroll: {
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionDetails: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionSub: {
    color: '#AAA',
    marginTop: 2,
  },
  optionExpiry: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
  }
});
