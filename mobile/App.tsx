import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/contexts/AuthContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import {Colors} from './src/config';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider style={{ backgroundColor: 'transparent' }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
