// components/Alert.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

type AlertType = 'success' | 'error' | 'warning';

interface CustomAlertProps {
  visible: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, type, title, message, onClose }) => {
  const getAlertColor = () => {
    switch(type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FFC107';
      default: return '#F44336';
    }
  };

  const getEmoji = () => {
    switch(type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      default: return '❌';
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
      backdropOpacity={0.7}
    >
      <View style={[styles.modalContainer, { borderColor: getAlertColor() }]}>
        <View style={[styles.modalHeader, { backgroundColor: getAlertColor() }]}>
          <Text style={styles.modalHeaderEmoji}>{getEmoji()}</Text>
          <Text style={styles.modalTitle}>{title}</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    margin: 20,
  },
  modalHeader: {
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  modalHeaderEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomAlert;