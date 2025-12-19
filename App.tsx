import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from './src/database/init';
import { seedDemoData } from './src/database/seed';
import AppNavigator from './src/navigation/AppNavigator';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from './src/utils/theme';

import { TTSProvider } from './src/context/TTSContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NotificationController } from './src/components/NotificationController';

// Set to true to seed demo data on app start
const ENABLE_DEMO_SEED = true;

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();

        // Seed demo data if enabled
        if (ENABLE_DEMO_SEED) {
          try {
            await seedDemoData();
            console.log('Demo data seeded successfully!');
          } catch (seedError) {
            console.warn('Demo seed error (non-critical):', seedError);
          }
        }

        setDbInitialized(true);
      } catch (e) {
        // Error handled silently - database initialization will retry
        console.warn('Database initialization error:', e);
      }
    }
    setup();
  }, []);

  if (!dbInitialized) {
    return (
      <LinearGradient
        colors={[colors.primary.teal, colors.primary.purple, colors.primary.pink]}
        locations={[0, 0.5, 1]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={colors.neutral.white} />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <TTSProvider>
          <NotificationController />
          <AppNavigator />
        </TTSProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
