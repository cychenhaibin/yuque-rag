import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet, useColorScheme} from 'react-native';
import {Colors} from '../config';

interface LoadingIndicatorProps {
  text?: string;
  size?: 'small' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  text = '加载中...',
  size = 'large',
}) => {
  const isDark = useColorScheme() === 'dark';
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.primary} />
      {text && (
        <Text style={[styles.text, {color: isDark ? Colors.textDark : Colors.text}]}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
  },
});


