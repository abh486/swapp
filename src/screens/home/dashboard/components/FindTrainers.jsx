

// src/screens/community/components/FindTrainers.jsx
import { GlobalLoader } from '../../../../components/GlobalLoader';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { browseTrainers, getTrainerById } from '../../../redux/actions/trainerActions';
import { TrainerDetailsModal } from './TrainerDetailsModal';
import { useAuth } from '../../../../context/AuthContext';
import { Strings } from '../../../../config/config'; // Import Config

const FindTrainers = () => {
  const dispatch = useDispatch();
  const strings = Strings.FindTrainers;
  const { user } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrainerDetails, setSelectedTrainerDetails] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await dispatch(browseTrainers());
      const trainersList = Array.isArray(result) ? result : (result?.trainers || result?.data || []);
      if (trainersList && Array.isArray(trainersList)) {
          setTrainers(trainersList);
      } else {
          setTrainers([]);
      }
    } catch (err) {
      setError(strings.error);
      console.error("Fetch Trainers Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleViewProfile = async (trainerFromList) => {
    setIsModalLoading(true);
    setSelectedTrainerDetails(trainerFromList);
    try {
      const fullProfile = await dispatch(getTrainerById(trainerFromList.user.id));
      setSelectedTrainerDetails(fullProfile);
    } catch (err) {
      console.error("Failed to load full trainer profile:", err);
      Alert.alert(Strings.FindTrainers.alerts.genericError || 'Error', Strings.FindTrainers.alerts.loadProfileError);
      setSelectedTrainerDetails(null);
    } finally {
      setIsModalLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredView}>
          <GlobalLoader size={60} />
          <Text style={styles.infoText}>{strings.loading}</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centeredView}>
          <Text style={styles.infoText}>{error}</Text>
          <TouchableOpacity onPress={fetchTrainers} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>{strings.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (trainers.length === 0) {
      return (
        <View style={styles.centeredView}>
          <Text style={styles.infoText}>{strings.empty}</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.trainersList}>
        {trainers.map(trainer => (
          <TouchableOpacity
            key={trainer.id}
            style={styles.trainerCard}
            onPress={() => handleViewProfile(trainer)}
          >
            <View style={styles.trainerHeader}>
              <View style={styles.avatarContainer}>
                <Image 
                  source={{ uri: trainer.gallery?.[0] || 'https://via.placeholder.com/150' }} 
                  style={styles.avatar} 
                />
                <View style={[styles.statusIndicator, styles.statusOnline]} />
              </View>
              <View style={styles.trainerInfo}>
                <Text style={styles.trainerName}>{trainer.user?.email.split('@')[0] || 'Trainer'}</Text>
                <View style={styles.onlineStatus}>
                  <Text style={styles.statusText}>{strings.card.online}</Text>
                </View>
              </View>
              <View style={styles.ratingContainer}>
                <Icon name="star" size={16} color="#452829" />
                <Text style={styles.rating}>{trainer.rating || 4.8}</Text>
              </View>
            </View>
            <Text style={styles.specialty}>{trainer.specialty || strings.card.defaultSpecialty}</Text>
            <Text style={styles.trainerDescription} numberOfLines={2}>{trainer.bio || strings.card.defaultBio}</Text>
            <View style={styles.trainerDetails}>
                <View style={styles.detailItem}>
                    <Icon name="time-outline" size={16} color="#452829" />
                    <Text style={styles.detailText}>{trainer.experience || 0} {strings.card.yearsExp}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.viewProfileButton} onPress={() => handleViewProfile(trainer)}>
              <Text style={styles.viewProfileButtonText}>{strings.card.viewProfileBtn}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <TrainerDetailsModal
        trainer={selectedTrainerDetails}
        isVisible={!!selectedTrainerDetails}
        isLoading={isModalLoading}
        onClose={() => setSelectedTrainerDetails(null)}
        user={user}
      />
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
    container: { 
      flex:1, 
      backgroundColor: '#f7f6f6', 
      paddingTop: 20 
    },
    centeredView: { 
      flex:1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20 
    },
    infoText: { 
      color: '#57595B', 
      fontSize: 16, 
      textAlign: 'center', 
      marginBottom: 20 
    },
    retryButton: { 
      backgroundColor: '#452829', 
      paddingVertical: 10, 
      paddingHorizontal: 30, 
      borderRadius: 8 
    },
    retryButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: 'bold' 
    },
    trainersList: { 
      paddingHorizontal: 16, 
      gap: 16, 
      paddingBottom: 30 
    },
    trainerCard: { 
      backgroundColor: '#fff', 
      borderRadius: 16, 
      padding: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    trainerHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: 12 
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 12,
    },
    avatar: { 
      width: 48, 
      height: 48, 
      borderRadius: 24,
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: '#fff',
    },
    statusOnline: {
      backgroundColor: '#4CAF50',
    },
    trainerInfo: { 
      flex:1 
    },
    trainerName: { 
      fontSize: 18, 
      fontWeight: 'bold', 
      color: '#000', 
      marginBottom: 4 
    },
    onlineStatus: { 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    statusText: { 
      fontSize: 12, 
      color: '#57595B' 
    },
    ratingContainer: { 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    rating: { 
      fontSize: 14, 
      fontWeight: '600', 
      color: '#000', 
      marginLeft: 4 
    },
    specialty: { 
      fontSize: 16, 
      color: '#452829', 
      fontWeight: '600', 
      marginBottom: 12 
    },
    trainerDetails: { 
      marginBottom: 12, 
      flexDirection: 'row', 
      flexWrap: 'wrap' 
    },
    detailItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginRight: 16, 
      marginBottom: 6 
    },
    detailText: { 
      fontSize: 14, 
      color: '#57595B', 
      marginLeft: 8 
    },
    trainerDescription: { 
      fontSize: 14, 
      color: '#57595B', 
      marginBottom: 15, 
      lineHeight: 20 
    },
    viewProfileButton: { 
      backgroundColor: '#452829', 
      paddingVertical: 12, 
      borderRadius: 8, 
      alignItems: 'center' 
    },
    viewProfileButtonText: { 
      color: '#fff', 
      fontSize: 16, 
      fontWeight: '600' 
    },
});

export default FindTrainers;