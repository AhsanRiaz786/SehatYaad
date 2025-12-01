import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import MedicationCard from '../components/MedicationCard';
import DailySummary from '../components/DailySummaryCard';
import { getMedications, Medication, logDose, getTodaysDoses } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { groupMedicationsByTimeBlock, getTimeBlockInfo, TimeBlock, getScheduledTimeForToday, isDosePending, isDoseMissed } from '../utils/timeBlockUtils';
import { DoseStatus } from '../components/StatusBadge';

interface MedicationWithStatus extends Medication {
  status: DoseStatus;
  nextTime?: string;
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationsWithStatus, setMedicationsWithStatus] = useState<MedicationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<TimeBlock>>(new Set(['morning', 'noon', 'evening', 'night']));
  const navigation = useNavigation<any>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const meds = await getMedications();
      setMedications(meds);

      // Get today's doses to determine status
      const todayDoses = await getTodaysDoses();

      // Enrich medications with status
      const enriched: MedicationWithStatus[] = meds.map(med => {
        // Find the next scheduled dose for this medication
        const now = Date.now() / 1000;
        let nextTime = med.times?.[0];
        let status: DoseStatus = 'pending';

        // Check each time for this medication
        for (const time of (med.times || [])) {
          const scheduledTime = getScheduledTimeForToday(time);

          // Find if there's a logged dose for this time
          const dose = todayDoses.find(d =>
            d.medication_id === med.id &&
            Math.abs(d.scheduled_time - scheduledTime) < 300 // Within 5 minutes
          );

          if (dose) {
            status = dose.status as DoseStatus;
            nextTime = time;
            break;
          } else if (isDosePending(scheduledTime)) {
            status = 'pending';
            nextTime = time;
            break;
          } else if (isDoseMissed(scheduledTime)) {
            status = 'missed';
            nextTime = time;
          }
        }

        return {
          ...med,
          status,
          nextTime
        };
      });

      setMedicationsWithStatus(enriched);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  const handleMedicationPress = (medication: Medication) => {
    navigation.navigate('MedicationDetail', { medicationId: medication.id });
  };

  const handleQuickMark = async (medication: MedicationWithStatus) => {
    try {
      if (medication.id && medication.nextTime) {
        const scheduledTime = getScheduledTimeForToday(medication.nextTime);
        await logDose({
          medication_id: medication.id,
          scheduled_time: scheduledTime,
          actual_time: Math.floor(Date.now() / 1000),
          status: 'taken',
        });
        fetchData(); // Refresh
      }
    } catch (error) {
      console.error('Error marking dose:', error);
    }
  };

  const toggleBlock = (block: TimeBlock) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(block)) {
      newExpanded.delete(block);
    } else {
      newExpanded.add(block);
    }
    setExpandedBlocks(newExpanded);
  };

  const groupedMeds = groupMedicationsByTimeBlock(medicationsWithStatus);
  const timeBlocks: TimeBlock[] = ['morning', 'noon', 'evening', 'night'];

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} colors={[colors.primary.purple]} />
        }
      >
        {/* Daily Summary */}
        <DailySummary />

        {/* Time Blocks */}
        {timeBlocks.map(block => {
          const blockInfo = getTimeBlockInfo(block);
          const blockMeds = groupedMeds[block] || [];
          const isExpanded = expandedBlocks.has(block);
          const pendingCount = blockMeds.filter(m => m.status === 'pending').length;

          if (blockMeds.length === 0) return null;

          return (
            <View key={block} style={styles.timeBlockContainer}>
              {/* Block Header */}
              <TouchableOpacity
                style={styles.blockHeader}
                onPress={() => toggleBlock(block)}
                accessibilityRole="button"
                accessibilityLabel={`${blockInfo.name} time block, ${blockMeds.length} medications`}
              >
                <LinearGradient
                  colors={blockInfo.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.blockHeaderGradient}
                >
                  <View style={styles.blockHeaderContent}>
                    <View style={styles.blockHeaderLeft}>
                      <Ionicons name={blockInfo.icon as any} size={24} color={colors.neutral.white} />
                      <View style={styles.blockHeaderText}>
                        <AccessibleText variant="h3" color={colors.neutral.white}>
                          {blockInfo.name}
                        </AccessibleText>
                        <AccessibleText variant="small" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                          {blockInfo.timeRange}
                        </AccessibleText>
                      </View>
                    </View>
                    <View style={styles.blockHeaderRight}>
                      {pendingCount > 0 && (
                        <View style={styles.badge}>
                          <AccessibleText variant="small" color={colors.neutral.white}>
                            {pendingCount}
                          </AccessibleText>
                        </View>
                      )}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.neutral.white}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Block Content */}
              {isExpanded && (
                <View style={styles.blockContent}>
                  {blockMeds.map((med) => (
                    <MedicationCard
                      key={med.id}
                      medication={med}
                      status={med.status}
                      nextDoseTime={med.nextTime}
                      onPress={() => handleMedicationPress(med)}
                      onQuickMark={() => handleQuickMark(med)}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Empty State */}
        {medications.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={64} color={colors.neutral.gray400} />
            <AccessibleText variant="h3" color={colors.neutral.gray600} style={styles.emptyTitle}>
              No Medications Yet
            </AccessibleText>
            <AccessibleText variant="body" color={colors.neutral.gray500} style={styles.emptyText}>
              Tap the + button below to add your first medication
            </AccessibleText>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMedication}
        accessibilityLabel="Add medication"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={colors.gradients.primary as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color={colors.neutral.white} />
        </LinearGradient>
      </TouchableOpacity>
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
    paddingBottom: spacing.l,
    paddingHorizontal: spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    marginVertical: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  timeBlockContainer: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  blockHeader: {
    borderRadius: layout.borderRadius.large,
    overflow: 'hidden',
    ...layout.shadow.medium,
  },
  blockHeaderGradient: {
    padding: spacing.m,
  },
  blockHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    flex: 1,
  },
  blockHeaderText: {
    gap: spacing.xs,
  },
  blockHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  blockContent: {
    paddingTop: spacing.m,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.l,
  },
  emptyTitle: {
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  emptyText: {
    textAlign: 'center',
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
