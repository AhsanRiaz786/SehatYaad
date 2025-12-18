import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import AccessibleText from '../components/AccessibleText';
import MedicationCard from '../components/MedicationCard';
import DailySummary from '../components/DailySummaryCard';
import DoseActionModal from '../components/DoseActionModal';
import SmartBadge from '../components/SmartBadge';
import SmartHub from '../components/SmartHub';
import { getMedications, Medication, logDose, getTodaysDoses } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { groupMedicationsByTimeBlock, getTimeBlockInfo, TimeBlock, getScheduledTimeForToday, isDosePending, isDoseMissed, getTimeBlock } from '../utils/timeBlockUtils';
import { DoseStatus } from '../components/StatusBadge';
import { getScheduleRecommendations, ScheduleRecommendation, applyScheduleRecommendation } from '../services/adaptiveReminderService';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/formatting';

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
  const [applyingRecId, setApplyingRecId] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const { language, isRTL, t } = useLanguage();

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

  // Get current time block for Smart Hub
  const currentTimeBlock = useMemo(() => {
    const now = new Date();
    const hours = now.getHours();
    if (hours >= 6 && hours < 11) return 'morning';
    if (hours >= 11 && hours < 15) return 'noon';
    if (hours >= 15 && hours < 20) return 'evening';
    return 'night';
  }, []);

  // Prepare Smart Hub actions
  const smartHubActions = useMemo(() => {
    const actions = [];
    
    // Primary action based on current time block
    const timeBlockLabel = language === 'ur' 
      ? (currentTimeBlock === 'morning' ? 'صبح کی دوائیں' : 
         currentTimeBlock === 'noon' ? 'دوپہر کی دوائیں' :
         currentTimeBlock === 'evening' ? 'شام کی دوائیں' : 'رات کی دوائیں')
      : (currentTimeBlock === 'morning' ? 'Morning Meds' :
         currentTimeBlock === 'noon' ? 'Noon Meds' :
         currentTimeBlock === 'evening' ? 'Evening Meds' : 'Night Meds');
    
    actions.push({
      id: 'time-block-meds',
      label: timeBlockLabel,
      labelUrdu: timeBlockLabel,
      icon: getTimeBlockInfo(currentTimeBlock).icon,
      onPress: () => {
        // Scroll to relevant medications
      },
      priority: 10,
    });

    // Voice Input action
    actions.push({
      id: 'voice-input',
      label: 'Voice Input',
      labelUrdu: 'آواز ان پٹ',
      icon: 'mic',
      onPress: () => {
        // Handle voice input
      },
      priority: 5,
    });

    // Add Medication action
    actions.push({
      id: 'add-medication',
      label: 'Add Medication',
      labelUrdu: 'دوائی شامل کریں',
      icon: 'add',
      onPress: handleAddMedication,
      priority: 3,
    });

    return actions;
  }, [currentTimeBlock, language]);

  const groupedMeds = groupMedicationsByTimeBlock(medicationsWithStatus);
  const timeBlocks: TimeBlock[] = ['morning', 'noon', 'evening', 'night'];

  // Get weekday name
  const weekdayName = useMemo(() => {
    const date = new Date();
    return date.toLocaleDateString(language === 'ur' ? 'ur-PK' : 'en-US', { weekday: 'long' });
  }, [language]);

  return (
    <View style={styles.container}>
      {/* Simple Header - No Gradient */}
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.headerContent} accessible accessibilityRole="header">
          <AccessibleText variant="caption" color={colors.text.charcoalLight}>
            {weekdayName}
          </AccessibleText>
          <AccessibleText variant="h1" color={colors.text.charcoal} style={styles.headerTitle}>
            {t('home.title')}
          </AccessibleText>
          <AccessibleText variant="body" color={colors.text.charcoalLight}>
            {formatDate(new Date())}
          </AccessibleText>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('DoseHistory')}
          style={styles.historyButton}
          accessibilityLabel={language === 'ur' ? 'پچھلے دنوں کی تاریخ دیکھیں' : 'View dose history for previous days'}
          accessibilityRole="button"
        >
          <Icon name="calendar" size={24} color={colors.text.charcoal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} colors={[colors.primary.forestGreen]} />
        }
      >
        {/* Daily Summary */}
        <DailySummary refreshKey={refreshKey} />

        {/* Smart Badge for Predictions */}
        {homeRecommendations.length > 0 && (
          <View style={styles.smartBadgeContainer}>
            <SmartBadge
              message={t('smartBadge.refillSuggested')}
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
                      backgroundColor: blockInfo.color + '15', // 15% opacity
                      borderColor: blockInfo.color,
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
                    <AccessibleText variant="h3" color={colors.text.charcoal}>
                      {t(`timeBlock.${block}`)}
                    </AccessibleText>
                    <AccessibleText variant="caption" color={colors.text.charcoalLight}>
                      {blockInfo.timeRange}
                    </AccessibleText>
                  </View>
                  {pendingCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.semantic.warning }]}>
                      <AccessibleText variant="small" color={colors.background.white}>
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
            <Icon name="pill" size={64} color={colors.border.gray} />
            <AccessibleText variant="h3" color={colors.text.charcoalLight} style={styles.emptyTitle}>
              {language === 'ur' ? 'ابھی تک کوئی دوائی نہیں' : 'No Medications Yet'}
            </AccessibleText>
            <AccessibleText variant="body" color={colors.text.charcoalLight} style={styles.emptyText}>
              {language === 'ur' 
                ? 'نیچے + بٹن پر ٹیپ کریں تاکہ اپنی پہلی دوائی شامل کریں'
                : 'Tap the + button below to add your first medication'}
            </AccessibleText>
          </View>
        )}
      </ScrollView>

      {/* Adaptive Smart Hub */}
      <SmartHub actions={smartHubActions} currentTimeBlock={currentTimeBlock} />

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
    backgroundColor: colors.background.cream,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.background.white,
    ...layout.border.default,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  headerContent: {
    flex: 1,
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
    paddingBottom: 140, // Space for Smart Hub + safe area
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
    backgroundColor: colors.background.white,
    borderRadius: layout.borderRadius.medium,
    ...layout.border.default,
    overflow: 'hidden',
  },
  bentoCardHeader: {
    padding: spacing.m,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardContent: {
    padding: spacing.m,
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
});
