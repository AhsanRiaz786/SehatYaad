import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/database/init';
import AppNavigator from './src/navigation/AppNavigator';
import { Text, View } from 'react-native';

import { TTSProvider } from './src/context/TTSContext';
import { NotificationController } from './src/components/NotificationController';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (e) {
        console.warn(e);
      }
    }
    setup();
  }, []);



  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TTSProvider>
        <NotificationController />
        <AppNavigator />
      </TTSProvider>
    </SafeAreaProvider>
  );
}
