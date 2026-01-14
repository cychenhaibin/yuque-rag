import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors, Spacing} from '../config';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({message, onRetry}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>⚠️ {message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    margin: Spacing.md,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


