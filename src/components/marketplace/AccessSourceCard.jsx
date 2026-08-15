import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AccessSourceCard({ source }) {
  if (!source) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name={source.type === 'PACKAGE' ? 'ticket-outline' : 'card-outline'} size={20} color="#FFF" />
          <Text style={styles.providerName}>{source.providerName}</Text>
        </View>
        <Text style={[styles.status, source.status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
          {source.status}
        </Text>
      </View>
      
      <View style={styles.details}>
        <Text style={styles.detailText}>Type: {source.type}</Text>
        <Text style={styles.detailText}>Valid Until: {new Date(source.validUntil).toLocaleDateString()}</Text>
      </View>

      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Allocations</Text>
        {source.categories.map((cat, idx) => (
          <View key={idx} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{cat.categoryName}</Text>
            <View style={styles.categoryStats}>
              <Text style={styles.statText}>Total: {cat.allocated}</Text>
              {cat.reserved > 0 && <Text style={styles.statText}>Rsvd: {cat.reserved}</Text>}
              <Text style={styles.statText}>Used: {cat.consumed + cat.forfeited}</Text>
              <Text style={styles.statRemaining}>Left: {cat.remaining}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden'
  },
  statusActive: {
    backgroundColor: '#2E7D32',
    color: '#FFF'
  },
  statusInactive: {
    backgroundColor: '#C62828',
    color: '#FFF'
  },
  details: {
    marginBottom: 16,
  },
  detailText: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 2,
  },
  categoriesContainer: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
  },
  categoriesTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  categoryName: {
    color: '#FFF',
    flex: 1,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'space-between'
  },
  statText: {
    color: '#888',
    fontSize: 12,
  },
  statRemaining: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
