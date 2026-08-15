import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function JourneyActionCard({ journey, onAction }) {
  const navigation = useNavigation();

  if (!journey) return null;

  const { nextAction, state, providerName, serviceName } = journey;

  const renderContent = () => {
    switch (nextAction) {
      case 'REQUIRE_PAYMENT':
        return {
          icon: 'card-outline',
          title: 'Payment Required',
          description: `Complete payment for ${serviceName || 'your service'} at ${providerName || 'the provider'}.`,
          buttonText: 'Pay Now',
          action: () => navigation.navigate('CheckoutBrowser', { journeyId: journey.id })
        };
      case 'REQUIRE_ACCESS_SELECTION':
        return {
          icon: 'list-outline',
          title: 'Select Access',
          description: `Choose a membership or pass for ${serviceName}.`,
          buttonText: 'Select',
          action: () => { if (onAction) onAction(journey.id, 'SELECT_ACCESS'); }
        };
      case 'WAITING_FOR_PAYMENT':
      case 'WAITING_FOR_PROVISIONING':
        return {
          icon: 'time-outline',
          title: 'Processing',
          description: `We are finalizing your access for ${serviceName}.`,
          buttonText: 'View Status',
          action: () => navigation.navigate('PaymentProcessing', { journeyId: journey.id })
        };
      case 'WAITING_FOR_APPROVAL':
        return {
          icon: 'hourglass-outline',
          title: 'Pending Approval',
          description: `Waiting for trainer approval for ${serviceName}.`,
          buttonText: 'View Details',
          action: () => navigation.navigate('BookingDetails', { journeyId: journey.id })
        };
      case 'CHECKIN_AVAILABLE':
        return {
          icon: 'qr-code-outline',
          title: 'Ready for Check-In',
          description: `Check in to ${serviceName} at ${providerName}.`,
          buttonText: 'Check In',
          action: () => navigation.navigate('BookingDetails', { journeyId: journey.id })
        };
      case 'BOOKING_CONFIRMED':
        return {
          icon: 'checkmark-circle-outline',
          title: 'Booking Confirmed',
          description: `${serviceName} at ${providerName} is confirmed.`,
          buttonText: 'View Booking',
          action: () => navigation.navigate('BookingDetails', { journeyId: journey.id })
        };
      default:
        // terminal states or NONE don't need action cards
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon name={content.icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.description}>{content.description}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={content.action}>
        <Text style={styles.buttonText}>{content.buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#AAA',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  }
});
