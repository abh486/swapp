import { GlobalLoader } from '../../../components/GlobalLoader';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../../../api/apiClient';

const DietAllLogs = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  const fetchAllDietLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/diet/logs');
      const payload = response?.data?.data || response?.data || [];
      const normalized = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.logs)
          ? payload.logs
          : [];
      setLogs(normalized);
    } catch (err) {
      setError('Unable to load diet logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDietLogs();
  }, [fetchAllDietLogs]);

  const groupedLogs = useMemo(() => {
    return logs.reduce((acc, item) => {
      const dateKey = item.createdAt
        ? new Date(item.createdAt).toDateString()
        : item.date || 'Unknown Date';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [logs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Food Logs</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <GlobalLoader size={50} />
          <Text style={styles.stateText}>Loading food logs...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchAllDietLogs} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {Object.keys(groupedLogs).length === 0 ? (
            <View style={styles.centerState}>
              <Text style={styles.stateText}>No food logs found.</Text>
            </View>
          ) : (
            Object.entries(groupedLogs).map(([date, entries]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateTitle}>{date}</Text>
                {entries.map((entry, index) => (
                  <View
                    key={entry.id || `${date}-${index}`}
                    style={styles.logCard}
                  >
                    <View style={styles.logTopRow}>
                      <Text style={styles.mealType}>
                        {(entry.mealType || 'meal').toUpperCase()}
                      </Text>
                      <Text style={styles.calories}>
                        {entry.calories || 0} kcal
                      </Text>
                    </View>
                    <Text style={styles.mealName}>{entry.mealName || 'Unnamed meal'}</Text>
                    <Text style={styles.macroText}>
                      P {entry.protein || 0}g  |  C {entry.carbs || 0}g  |  F {entry.fats || 0}g
                    </Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    color: '#CCC',
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF7070',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: 18,
  },
  dateTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  logCard: {
    backgroundColor: '#131313',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 10,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealType: {
    color: '#9FE8A4',
    fontSize: 12,
    fontWeight: '700',
  },
  calories: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  mealName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  macroText: {
    color: '#9B9B9B',
    fontSize: 12,
  },
});

export default DietAllLogs;
