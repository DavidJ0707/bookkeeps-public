import React, { useState, useContext } from 'react';
import { Modal, View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Text, Button } from '@ui-kitten/components';
import { UserContext } from '../contexts/UserContext';
import { sendFeedbackToMongoDB } from '../mongoDBService';

const { width } = Dimensions.get('window');

/**
 * FeedbackModal
 * Allows users to submit feedback, then briefly shows a "Thank you" message.
 *
 * @param {boolean} visible - Controls modal visibility.
 * @param {function} onClose - Handler to close the modal.
 */
const FeedbackModal = ({ visible, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const { userId } = useContext(UserContext);

  /**
   * Submits the feedback to the database, shows a thank you message, then closes.
   */
  const handleSubmitFeedback = async () => {
    if (feedback) {
      try {
        await sendFeedbackToMongoDB(userId, feedback);
        setFeedback('');
        setShowThankYou(true);
        setTimeout(() => {
          setShowThankYou(false);
          onClose();
        }, 2000);
      } catch (error) {
        console.error('Failed to send feedback:', error);
      }
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {showThankYou ? (
              <Text style={styles.thankYouMessage}>Thank you for your feedback!</Text>
            ) : (
              <>
                <Text style={styles.modalTitle}>Help Us Enhance Your Experience!</Text>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Tell us how we can improve..."
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Button style={styles.submitButton} onPress={handleSubmitFeedback}>
                  <Text style={styles.buttonText}>Submit</Text>
                </Button>
                <Button style={styles.cancelButton} appearance='outline' onPress={onClose}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </Button>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    padding: 26,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 24,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  feedbackInput: {
    fontFamily: 'Lora_600Regular',
    height: 100,
    width: '100%',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#80CBC4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 10,
    borderColor: '#333',
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderColor: '#333',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  thankYouMessage: {
    fontFamily: 'Lora_700Bold',
    fontSize: 24,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontFamily: 'Lora_400Regular',
  },
});

export default FeedbackModal;
