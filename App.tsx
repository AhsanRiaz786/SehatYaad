import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/database/init';
import AppNavigator from './src/navigation/AppNavigator';
import { Text, View } from 'react-native';
import { setupNotificationListeners } from './src/services/notificationService';

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

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      },
      (response) => {
        console.log('User interacted with notification:', response);
        // Handle notification tap - could navigate to medication detail
      }
    );

    return cleanup;
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
      <AppNavigator />
    </SafeAreaProvider>
  );
}
