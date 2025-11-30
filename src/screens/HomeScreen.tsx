import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import AccessibleButton from '../components/AccessibleButton';
import MedicationCard from '../components/MedicationCard';
import Card from '../components/Card';
import { getMedications, Medication } from '../database/helpers';
import { colors, spacing, layout, typography } from '../utils/theme';
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

  // Calculate stats
  const totalMeds = medications.length;
  const todayDoses = medications.reduce((acc, med) => acc + (med.times?.length || 0), 0);
  const adherenceRate = 85; // TODO: Calculate from actual dose tracking

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradients.primary as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <View style={styles.headerContent}>
          <View>
            <AccessibleText variant="caption" color={colors.neutral.white} style={{ opacity: 0.9 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </AccessibleText>
            <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
              Today's Meds
            </AccessibleText>
            <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.8 }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </AccessibleText>
          </View>
        </View>
      </LinearGradient>

      {/* Stats Cards Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary.teal + '20' }]}>
            <Ionicons name="medical" size={24} color={colors.primary.teal} />
          </View>
          <AccessibleText variant="h2" style={styles.statValue}>{totalMeds}</AccessibleText>
          <AccessibleText variant="caption" color={colors.neutral.gray600}>
            Medications
          </AccessibleText>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.primary.purple + '20' }]}>
            <Ionicons name="time" size={24} color={colors.primary.purple} />
          </View>
          <AccessibleText variant="h2" style={styles.statValue}>{todayDoses}</AccessibleText>
          <AccessibleText variant="caption" color={colors.neutral.gray600}>
            Today's Doses
          </AccessibleText>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.semantic.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
          </View>
          <AccessibleText variant="h2" style={styles.statValue}>{adherenceRate}%</AccessibleText>
          <AccessibleText variant="caption" color={colors.neutral.gray600}>
            Adherence
          </AccessibleText>
        </View>
      </View>

      {/* Medications List */}
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
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMedications}
            colors={[colors.primary.purple]}
            tintColor={colors.primary.purple}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="add-circle-outline" size={80} color={colors.neutral.gray400} />
            </View>
            <AccessibleText variant="h2" style={styles.emptyTitle}>
              No medications yet
            </AccessibleText>
            <AccessibleText
              variant="body"
              color={colors.neutral.gray600}
              style={styles.emptyDescription}
            >
              Start by adding your first medication to begin tracking
            </AccessibleText>
            <AccessibleButton
              title="Add First Medication"
              onPress={handleAddMedication}
              icon={<Ionicons name="add" size={20} color={colors.neutral.white} />}
              iconPosition="left"
            />
          </View>
        }
      />

      {/* Floating Action Button */}
      {medications.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddMedication}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
        >
          <LinearGradient
            colors={colors.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={colors.neutral.white} />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.gray100,
  },
  gradientHeader: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    marginTop: -spacing.xl, // Overlap with header
    gap: spacing.s,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    borderRadius: layout.borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
    ...layout.shadow.medium,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statValue: {
    marginBottom: spacing.xs,
  },
  listContent: {
    padding: spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: spacing.l,
  },
  emptyTitle: {
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: spacing.l,
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.l,
    right: spacing.l,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...layout.shadow.large,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
