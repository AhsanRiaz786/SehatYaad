import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import AccessibleButton from '../components/AccessibleButton';
import MedicationCard from '../components/MedicationCard';
import { getMedications, Medication } from '../database/helpers';
import { colors, spacing } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const data = await getMedications();
      setMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
    }, [])
  );

  const handleAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AccessibleText variant="h1">Today's Meds</AccessibleText>
        <AccessibleText variant="body" color={colors.textSecondary}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </AccessibleText>
      </View>

      <FlatList
        data={medications}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <MedicationCard
            medication={item}
            onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMedications} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AccessibleText variant="h3" style={{ textAlign: 'center', marginBottom: spacing.m }}>
              No medications added yet.
            </AccessibleText>
            <AccessibleButton title="Add Your First Medication" onPress={handleAddMedication} />
          </View>
        }
      />

      {medications.length > 0 && (
        <View style={styles.fabContainer}>
          <AccessibleButton title="+ Add Med" onPress={handleAddMedication} style={styles.fab} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.m,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listContent: {
    padding: spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  fabContainer: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
    left: spacing.m,
  },
  fab: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
