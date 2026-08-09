import React, { useState, useEffect } from 'react';
import { Alert as RNAlert, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

let alertRegister = null;

// Monkeypatch react-native's Alert.alert statically
const originalAlert = RNAlert.alert;
RNAlert.alert = (title, message, buttons, options) => {
  if (alertRegister) {
    alertRegister(title, message, buttons, options);
  } else {
    // Fallback to native alert if component is not yet registered/mounted
    originalAlert(title, message, buttons, options);
  }
};

const GlobalAlert = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  useEffect(() => {
    alertRegister = (title, message, buttons) => {
      const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
      setAlertState({
        visible: true,
        title: title || '',
        message: message || '',
        buttons: resolvedButtons
      });
    };
    return () => {
      alertRegister = null;
    };
  }, []);

  if (!alertState.visible) return null;

  const handleDismiss = (onPress) => {
    setAlertState(prev => ({ ...prev, visible: false }));
    if (onPress) onPress();
  };

  const handleBackdropPress = () => {
    const cancelBtn = alertState.buttons.find(
      btn => btn.style === 'cancel' || (btn.text && btn.text.toLowerCase() === 'cancel')
    );
    if (cancelBtn) {
      handleDismiss(cancelBtn.onPress);
    } else {
      setAlertState(prev => ({ ...prev, visible: false }));
    }
  };

  // Sort buttons so action buttons (e.g. Log Out, Delete) appear first, and Cancel appears last
  const sortedButtons = [...alertState.buttons].sort((a, b) => {
    const isACancel = a.style === 'cancel' || (a.text && a.text.toLowerCase() === 'cancel');
    const isBCancel = b.style === 'cancel' || (b.text && b.text.toLowerCase() === 'cancel');
    if (isACancel && !isBCancel) return 1;
    if (!isACancel && isBCancel) return -1;
    return 0;
  });

  return (
    <Modal
      visible={alertState.visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={styles.headerContent}>
                {!!alertState.title && (
                  <Text style={styles.title}>{alertState.title}</Text>
                )}
                {!!alertState.message && (
                  <Text style={styles.message}>{alertState.message}</Text>
                )}
              </View>

              <View style={styles.buttonsContainer}>
                {sortedButtons.map((btn, idx) => {
                  const textLower = (btn.text || '').toLowerCase();
                  const isDestructive = btn.style === 'destructive' || 
                    textLower.includes('log out') || 
                    textLower.includes('delete') || 
                    textLower.includes('remove') ||
                    textLower.includes('discard');
                  const isCancel = btn.style === 'cancel' || textLower === 'cancel';

                  let textStyle = styles.buttonTextPrimary;
                  if (isDestructive) {
                    textStyle = styles.buttonTextDestructive;
                  } else if (isCancel) {
                    textStyle = styles.buttonTextCancel;
                  }

                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.button,
                        idx > 0 && styles.buttonBorderTop
                      ]}
                      onPress={() => handleDismiss(btn.onPress)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.buttonText, textStyle]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#262626',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  headerContent: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#A8A8A8',
    fontSize: 13.5,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  buttonsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#363636',
    width: '100%',
  },
  button: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#363636',
  },
  buttonText: {
    fontSize: 15,
    textAlign: 'center',
  },
  buttonTextDestructive: {
    color: '#ED4956', // Instagram Red
    fontWeight: '700',
  },
  buttonTextCancel: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  buttonTextPrimary: {
    color: '#0095F6', // Instagram Blue
    fontWeight: '600',
  },
});

export default GlobalAlert;
