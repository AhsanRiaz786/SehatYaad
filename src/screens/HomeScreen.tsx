import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import MedicationCard from '../components/MedicationCard';
import DailySummary from '../components/DailySummaryCard';
import DoseActionModal from '../components/DoseActionModal';
import { getMedications, Medication, logDose, getTodaysDoses } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { groupMedicationsByTimeBlock, getTimeBlockInfo, TimeBlock, getScheduledTimeForToday, isDosePending, isDoseMissed } from '../utils/timeBlockUtils';
import { DoseStatus } from '../components/StatusBadge';
import { getScheduleRecommendations, ScheduleRecommendation, applyScheduleRecommendation } from '../services/adaptiveReminderService';

interface MedicationWithStatus extends Medication {
  status: DoseStatus;
  nextTime?: string;
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationsWithStatus, setMedicationsWithStatus] = useState<MedicationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<TimeBlock>>(new Set(['morning', 'noon', 'evening', 'night']));
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationWithStatus | null>(null);
  const [homeRecommendations, setHomeRecommendations] = useState<ScheduleRecommendation[]>([]);
  const [applyingRecId, setApplyingRecId] = useState<string | null>(null);
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

      // Load adaptive reminder suggestions to surface on Home
      const recs = await getScheduleRecommendations();
      setHomeRecommendations(recs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      setRefreshKey(prev => prev + 1); // Refresh DailySummary when screen comes into focus
    }, [])
  );

  const handleAddMedication = () => {
    navigation.navigate('AddMedication');
  };

  const handleMedicationPress = (medication: Medication) => {
    navigation.navigate('MedicationDetail', { medicationId: medication.id });
  };

  const handleQuickMark = (medication: MedicationWithStatus) => {
    setSelectedMedication(medication);
    setModalVisible(true);
  };

  const handleModalSuccess = () => {
    fetchData(); // Refresh medication list
    setRefreshKey(prev => prev + 1); // Trigger DailySummary refresh
  };

  const handleApplyHomeRecommendation = async (rec: ScheduleRecommendation) => {
    try {
      const key = `${rec.medication.id}-${rec.currentTime}-${rec.recommendedTime}`;
      setApplyingRecId(key);
      await applyScheduleRecommendation(rec);
      await fetchData();
    } catch (error) {
      console.error('Error applying home schedule recommendation:', error);
    } finally {
      setApplyingRecId(null);
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
          <TouchableOpacity
            onPress={() => navigation.navigate('DoseHistory')}
            style={styles.historyButton}
            accessibilityLabel="View dose history"
          >
            <Ionicons name="calendar-outline" size={28} color={colors.neutral.white} />
          </TouchableOpacity>
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
        <DailySummary refreshKey={refreshKey} />

        {/* Smart Reminder Suggestion Banner (shows first suggestion only) */}
        {homeRecommendations.length > 0 && (
          <View style={styles.smartBanner}>
            <View style={styles.smartBannerHeader}>
              <Ionicons name="bulb" size={22} color={colors.primary.orange} />
              <AccessibleText variant="h3" style={styles.smartBannerTitle}>
                Smart Reminder Suggestion
              </AccessibleText>
            </View>
            {homeRecommendations.slice(0, 1).map((rec, index) => {
              const key = `${rec.medication.id}-${rec.currentTime}-${rec.recommendedTime}-${index}`;
              return (
                <View key={key}>
                  <AccessibleText variant="body" style={styles.smartBannerText}>
                    For{' '}
                    <AccessibleText variant="body" style={{ fontWeight: '700' }}>
                      {rec.medication.name}
                    </AccessibleText>
                    , the{' '}
                    <AccessibleText variant="body" style={{ fontWeight: '700' }}>
                      {rec.currentTime}
                    </AccessibleText>{' '}
                    reminder often doesn’t work well.
                  </AccessibleText>
                  <AccessibleText variant="small" color={colors.neutral.gray700} style={styles.smartBannerText}>
                    {rec.reason}
                  </AccessibleText>
                  <AccessibleText variant="body" style={styles.smartBannerText}>
                    We can move it to{' '}
                    <AccessibleText variant="body" style={{ fontWeight: '700' }}>
                      {rec.recommendedTime}
                    </AccessibleText>
                    .
                  </AccessibleText>
                  <View style={styles.smartBannerActions}>
                    <TouchableOpacity
                      style={styles.smartApplyButton}
                      disabled={loading || applyingRecId === key}
                      onPress={() => handleApplyHomeRecommendation(rec)}
                    >
                      <AccessibleText variant="button" color={colors.neutral.white}>
                        {applyingRecId === key ? 'Applying...' : 'Apply Change'}
                      </AccessibleText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Insights')}
                      style={styles.smartDetailsButton}
                    >
                      <AccessibleText variant="button" color={colors.primary.purple}>
                        View Details
                      </AccessibleText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Scan Prescription FAB */}
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => navigation.navigate('Camera')}
          accessibilityLabel="Scan prescription"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#10b981', '#059669'] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="camera" size={28} color={colors.neutral.white} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Add Medication FAB */}
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

      {/* Dose Action Modal */}
      {selectedMedication && selectedMedication.nextTime && (
        <DoseActionModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedMedication(null);
          }}
          medication={selectedMedication as Medication & { id: number }}
          scheduledTime={selectedMedication.nextTime}
          onSuccess={handleModalSuccess}
        />
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
  historyButton: {
    padding: spacing.s,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  smartBanner: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.neutral.white,
    borderRadius: layout.borderRadius.large,
    ...layout.shadow.small,
  },
  smartBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  smartBannerTitle: {
    fontWeight: '600',
  },
  smartBannerText: {
    marginBottom: spacing.xs,
  },
  smartBannerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  smartApplyButton: {
    backgroundColor: colors.primary.purple,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: layout.borderRadius.medium,
  },
  smartDetailsButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
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
  fabContainer: {
    position: 'absolute',
    bottom: spacing.l,
    right: spacing.l,
    flexDirection: 'column',
    gap: spacing.m,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...layout.shadow.large,
  },
  fabSecondary: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
