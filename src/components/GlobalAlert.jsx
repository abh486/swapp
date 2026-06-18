import React, { useState, useEffect } from 'react';
import { Alert as RNAlert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

  return (
    <Modal
      visible={alertState.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Icon
              name={
                alertState.title.toLowerCase().includes('success')
                  ? 'checkmark-circle-outline'
                  : alertState.title.toLowerCase().includes('fail') || alertState.title.toLowerCase().includes('error') || alertState.title.toLowerCase().includes('required')
                  ? 'alert-circle-outline'
                  : 'information-circle-outline'
              }
              size={44}
              color={
                alertState.title.toLowerCase().includes('success')
                  ? '#4CAF50'
                  : alertState.title.toLowerCase().includes('fail') || alertState.title.toLowerCase().includes('error') || alertState.title.toLowerCase().includes('required')
                  ? '#F44336'
                  : '#A066CB'
              }
            />
          </View>
          <Text style={styles.title}>{alertState.title}</Text>
          {alertState.message ? <Text style={styles.message}>{alertState.message}</Text> : null}
          <View style={styles.buttonsRow}>
            {alertState.buttons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.button,
                    isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonConfirm,
                    alertState.buttons.length > 2 && { width: '100%', marginBottom: 8 }
                  ]}
                  onPress={() => {
                    setAlertState(prev => ({ ...prev, visible: false }));
                    if (btn.onPress) btn.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel ? styles.buttonTextCancel : isDestructive ? styles.buttonTextDestructive : styles.buttonTextConfirm
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#170B20',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#6A3C91',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 14,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#BDB6C4',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonConfirm: {
    backgroundColor: '#6A3C91',
  },
  buttonCancel: {
    backgroundColor: '#281E31',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonDestructive: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextConfirm: {
    color: '#FFF',
  },
  buttonTextCancel: {
    color: '#AFA7B8',
  },
  buttonTextDestructive: {
    color: '#FFF',
  },
});

export default GlobalAlert;
