import { Alert } from 'react-native';

export const handleError = (error, fallbackMessage = 'An unexpected error occurred') => {
  console.error('Error:', error);
  
  let message = fallbackMessage;
  
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.message) {
    message = error.message;
  }
  
  Alert.alert('Error', message);
  return message;
};

export const handleAuthError = (error, navigation) => {
  if (error.response?.status === 401) {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log In', onPress: () => navigation?.navigate('Login') }
      ]
    );
    return true;
  }
  return false;
};