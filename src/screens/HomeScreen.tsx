import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import AccessibleText from '../components/AccessibleText';
import MedicationCard from '../components/MedicationCard';
import DailySummary from '../components/DailySummaryCard';
import DoseActionModal from '../components/DoseActionModal';
import SmartBadge from '../components/SmartBadge';
import HomeHeader from '../components/HomeHeader';
import QuickActionGrid from '../components/QuickActionGrid';
import { getMedications, Medication, getTodaysDoses, Dose } from '../database/helpers';
import { colors, spacing, layout, animation } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { groupMedicationsByTimeBlock, getTimeBlockInfo, TimeBlock, getScheduledTimeForToday, isDosePending, isDoseMissed } from '../utils/timeBlockUtils';
import { DoseStatus } from '../components/StatusBadge';
import { getScheduleRecommendations, ScheduleRecommendation, applyScheduleRecommendation } from '../services/adaptiveReminderService';
import { useLanguage } from '../context/LanguageContext';

interface MedicationWithStatus extends Medication {
  status: DoseStatus;
  nextTime?: string;
}

export default function HomeScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationsWithStatus, setMedicationsWithStatus] = useState<MedicationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationWithStatus | null>(null);
  const [homeRecommendations, setHomeRecommendations] = useState<ScheduleRecommendation[]>([]);
  const navigation = useNavigation<any>();
  const { language, isRTL, t } = useLanguage();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const meds = await getMedications();
      setMedications(meds);

      // Get today's doses to determine status
      const todayDoses = await getTodaysDoses();

      // Create a Map for O(1) lookups: key = `${medication_id}_${scheduled_time}`
      const doseMap = new Map<string, Dose>();
      for (const dose of todayDoses) {
        // Create keys for all times within 5 minutes of scheduled time
        for (let offset = -300; offset <= 300; offset += 60) {
          const key = `${dose.medication_id}_${dose.scheduled_time + offset}`;
          if (!doseMap.has(key)) {
            doseMap.set(key, dose);
          }
        }
      }

      // Enrich medications with status
      const enriched: MedicationWithStatus[] = meds.map(med => {
        if (!med.id) {
          return { ...med, status: 'pending' as DoseStatus };
        }

        // Find the next scheduled dose for this medication
        let nextTime = med.times?.[0];
        let status: DoseStatus = 'pending';

        // Check each time for this medication
        for (const time of (med.times || [])) {
          const scheduledTime = getScheduledTimeForToday(time);
          const doseKey = `${med.id}_${scheduledTime}`;
          const dose = doseMap.get(doseKey);

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

      // Load adaptive reminder suggestions to surface on Home (only if we have medications)
      // This is an expensive query, so we'll do it asynchronously without blocking
      if (meds.length > 0) {
        // Don't await - let it load in background
        getScheduleRecommendations(meds).then(recs => {
          setHomeRecommendations(recs);
        }).catch(err => {
          console.error('Error loading recommendations:', err);
        });
      } else {
        setHomeRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track if this is the first mount
  const isFirstMount = React.useRef(true);

  useFocusEffect(
    useCallback(() => {
      // Only refresh on focus if not the first mount (first mount is handled by useEffect)
      if (!isFirstMount.current) {
        fetchData(true);
        setRefreshKey(prev => prev + 1); // Refresh DailySummary when screen comes into focus
      }
    }, [fetchData])
  );

  // Initial load
  useEffect(() => {
    fetchData(false);
    isFirstMount.current = false;
  }, [fetchData]);

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

  const groupedMeds = useMemo(() => groupMedicationsByTimeBlock(medicationsWithStatus), [medicationsWithStatus]);
  const timeBlocks: TimeBlock[] = ['morning', 'noon', 'evening', 'night'];

  return (
    <View style={styles.container}>
      <HomeHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} colors={[colors.primary.main]} />
        }
      >
        <QuickActionGrid />

        {/* Daily Summary */}
        <DailySummary refreshKey={refreshKey} />

        {/* Smart Badge for Predictions */}
        {homeRecommendations.length > 0 && (
          <View style={styles.smartBadgeContainer}>
            <SmartBadge
              message={t('smartBadge.refillSuggested') || "Refill Suggested"}
              explanation={homeRecommendations[0]?.reason}
              variant="info"
              onPress={() => navigation.navigate('Insights')}
            />
          </View>
        )}

        {/* Bento-Style Grid Layout for Medications */}
        <View style={styles.bentoGrid}>
          {timeBlocks.map(block => {
            const blockInfo = getTimeBlockInfo(block);
            const blockMeds = groupedMeds[block] || [];
            const pendingCount = blockMeds.filter(m => m.status === 'pending').length;

            if (blockMeds.length === 0) return null;

            return (
              <View key={block} style={styles.bentoCard}>
                {/* Card Header */}
                <View
                  style={[
                    styles.bentoCardHeader,
                    {
                      borderColor: colors.neutral.gray200,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                >
                  <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                    <Icon
                      name={blockInfo.icon as any}
                      size={20}
                      color={blockInfo.color}
                      active={pendingCount > 0}
                    />
                  </View>
                  <View style={styles.bentoCardHeaderText}>
                    <AccessibleText variant="h3" style={{ color: colors.text.primary }}>
                      {t(`timeBlock.${block}`)}
                    </AccessibleText>
                    <AccessibleText variant="caption" style={{ color: colors.text.secondary }}>
                      {blockInfo.timeRange}
                    </AccessibleText>
                  </View>
                  {pendingCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.status.warning.bg }]}>
                      <AccessibleText variant="caption" style={{ color: colors.status.warning.text, fontWeight: '700' }}>
                        {pendingCount}
                      </AccessibleText>
                    </View>
                  )}
                </View>

                {/* Medication Cards */}
                <View style={styles.bentoCardContent}>
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
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {medications.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Icon name="pill" size={64} color={colors.neutral.gray300} />
            <AccessibleText variant="h3" style={styles.emptyTitle}>
              {language === 'ur' ? 'ابھی تک کوئی دوائی نہیں' : 'No Medications Yet'}
            </AccessibleText>
            <AccessibleText variant="body" style={styles.emptyText}>
              {language === 'ur'
                ? 'اوپر "نسخہ اسکرین کریں" استعمال کریں یا دستی طور پر شامل کریں'
                : 'Use "Scan Prescription" above or add manually to get started.'}
            </AccessibleText>
          </View>
        )}
      </ScrollView>

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
    backgroundColor: colors.background.default,
  },
  header: {
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100, // Space for scrolling
  },
  smartBadgeContainer: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  bentoGrid: {
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  bentoCard: {
    backgroundColor: colors.background.paper,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border.secondary,
    overflow: 'hidden',
    ...layout.shadows.soft,
  },
  bentoCardHeader: {
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.subtle,
  },
  iconLeft: {
    marginRight: spacing.s,
  },
  iconRight: {
    marginLeft: spacing.s,
  },
  bentoCardHeaderText: {
    flex: 1,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardContent: {
    padding: spacing.m,
    gap: spacing.m,
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
    color: colors.text.tertiary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.tertiary,
  },
});
