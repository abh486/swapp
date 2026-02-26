
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import VectorIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { GymDetailsModal } from '../screens/home/GymDetailsModal';
import { Strings } from '../../../config/config'; // Import Config

export const GymListComponent = ({ gyms, isLoading, error, hasMore, loadMoreAction }) => {
  const [selectedGym, setSelectedGym] = useState(null);
  const navigation = useNavigation();
  const { loading: loadingText, loadMore: loadMoreText } = Strings.Gyms.List;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#e74c3c" />
        <Text style={{ marginTop: 10 }}>{loadingText}</Text>
      </View>
    );
  }
  
  if (!isLoading && gyms.length === 0) {
      return null; 
  }
  
  return (
    <View style={{ flex: 1 }}>
      <GymDetailsModal
        gym={selectedGym}
        isVisible={!!selectedGym}
        onClose={() => setSelectedGym(null)}
        onBookNow={() => {
            navigation.navigate('GymDetails', { gymId: selectedGym?.id });
            setSelectedGym(null);
        }}
      />
      <View style={styles.listContainer}>
        {gyms.slice(0, 6).map((gym, index) => (
          <React.Fragment key={gym.id}>
            <TouchableOpacity 
              style={styles.listCard}
              onPress={() => setSelectedGym(gym)}
            >
              <Image 
                  source={{ uri: gym.image || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f' }} 
                  style={styles.listCardImage}
              />
              <View style={styles.listCardContent}>
                  <Text style={styles.listGymName} numberOfLines={1}>{gym.name}</Text>
                  <View style={styles.listLocationContainer}>
                      <VectorIcon name="location-on" size={14} color="#666" />
                      <Text style={styles.listLocationText} numberOfLines={1}>{gym.address}</Text>
                  </View>
              </View>
            </TouchableOpacity>
            {index === 0 && <View style={styles.dividerLine} />}
          </React.Fragment>
        ))}
      </View>

      {hasMore && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreAction}>
          <Text style={styles.loadMoreText}>{loadMoreText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    centered: { alignItems: 'center', marginTop: 20 },
    listContainer: { paddingHorizontal: 10, marginTop: 20 },
    listCard: { backgroundColor: 'transparent', flexDirection: 'row', marginBottom: 8 },
    listCardImage: { width: 80, height: 80, borderRadius: 12 },
    listCardContent: { flex: 1, padding: 12, justifyContent: 'center' },
    listGymName: { fontSize: 18, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
    listLocationContainer: { flexDirection: 'row', alignItems: 'flex-start' },
    listLocationText: { fontSize: 15, color: '#7f8c8d', marginLeft: 6, flex: 1 },
    dividerLine: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 8, marginHorizontal: 20 },
    loadMoreButton: { alignItems: 'center', marginTop: 10, paddingVertical: 10, backgroundColor: '#e74c3c', borderRadius: 8 },
    loadMoreText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});