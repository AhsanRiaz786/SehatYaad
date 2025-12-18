import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import StatusBadge from '../components/StatusBadge';
import { getDosesByDateRange, getMedications, Medication, Dose } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { getTimeBlock, getTimeBlockInfo, TimeBlock } from '../utils/timeBlockUtils';

interface DayHistory {
    date: Date;
    dateString: string;
    total: number;
    taken: number;
    missed: number;
    pending: number;
    doses: Array<{
        dose: Dose;
        medication: Medication;
        timeBlock: TimeBlock;
    }>;
}

export default function DoseHistoryScreen() {
    const [history, setHistory] = useState<DayHistory[]>([]);
    const [medications, setMedications] = useState<Medication[]>([]);
    const [selectedMedId, setSelectedMedId] = useState<number | null>(null);
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['today']));
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
        }, [selectedMedId])
    );

    const loadHistory = async () => {
        setLoading(true);
        try {
            // Get last 7 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);

            const doses = await getDosesByDateRange(startDate, endDate);
            const meds = await getMedications();
            setMedications(meds);

            // Group doses by day
            const dailyHistory = new Map<string, DayHistory>();

            // Initialize all 7 days
            for (let i = 0; i < 7; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateString = date.toDateString();

                dailyHistory.set(dateString, {
                    date,
                    dateString,
                    total: 0,
                    taken: 0,
                    missed: 0,
                    pending: 0,
                    doses: []
                });
            }

            // Process doses
            for (const dose of doses) {
                const medication = meds.find(m => m.id === dose.medication_id);
                if (!medication) continue;

                // Filter by selected medication if applicable
                if (selectedMedId && medication.id !== selectedMedId) continue;

                const doseDate = new Date(dose.scheduled_time * 1000);
                const dateString = doseDate.toDateString();
                const day = dailyHistory.get(dateString);

                if (day) {
                    const hours = doseDate.getHours();
                    const minutes = doseDate.getMinutes();
                    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    const timeBlock = getTimeBlock(timeString);
                    day.doses.push({ dose, medication, timeBlock });
                    day.total++;

                    if (dose.status === 'taken') day.taken++;
                    else if (dose.status === 'missed') day.missed++;
                    else if (dose.status === 'pending') day.pending++;
                }
            }

            // Convert to array and sort by date (newest first)
            const historyArray = Array.from(dailyHistory.values())
                .sort((a, b) => b.date.getTime() - a.date.getTime());

            setHistory(historyArray);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dateString: string) => {
        const newExpanded = new Set(expandedDays);
        if (newExpanded.has(dateString)) {
            newExpanded.delete(dateString);
        } else {
            newExpanded.add(dateString);
        }
        setExpandedDays(newExpanded);
    };

    const formatDate = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateToCheck = new Date(date);
        dateToCheck.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - dateToCheck.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.purple} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <AccessibleText variant="h1" color={colors.neutral.white}>
                    Dose History
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Last 7 days
                </AccessibleText>
            </LinearGradient>

            {/* Filter */}
            <View style={styles.filterContainer}>
                <AccessibleText variant="caption" style={styles.filterLabel}>
                    Filter by Medication:
                </AccessibleText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedMedId === null && styles.filterChipActive]}
                        onPress={() => setSelectedMedId(null)}
                    >
                        <AccessibleText
                            variant="caption"
                            color={selectedMedId === null ? colors.neutral.white : colors.neutral.gray700}
                        >
                            All
                        </AccessibleText>
                    </TouchableOpacity>
                    {medications.map(med => (
                        <TouchableOpacity
                            key={med.id}
                            style={[styles.filterChip, selectedMedId === med.id && styles.filterChipActive]}
                            onPress={() => setSelectedMedId(med.id!)}
                        >
                            <AccessibleText
                                variant="caption"
                                color={selectedMedId === med.id ? colors.neutral.white : colors.neutral.gray700}
                            >
                                {med.name}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.content}>
                {history.map((day, index) => {
                    const isExpanded = expandedDays.has(day.dateString) || index === 0;
                    const adherencePercentage = day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0;

                    return (
                        <View key={day.dateString} style={styles.dayContainer}>
                            <TouchableOpacity
                                style={styles.dayHeader}
                                onPress={() => toggleDay(day.dateString)}
                            >
                                <View style={styles.dayHeaderLeft}>
                                    <AccessibleText variant="h3" style={styles.dayTitle}>
                                        {formatDate(day.date)}
                                    </AccessibleText>
                                    {day.total > 0 ? (
                                        <AccessibleText variant="caption" color={colors.neutral.gray600}>
                                            {day.taken}/{day.total} doses ({adherencePercentage}%)
                                        </AccessibleText>
                                    ) : (
                                        <AccessibleText variant="caption" color={colors.neutral.gray500}>
                                            No doses scheduled
                                        </AccessibleText>
                                    )}
                                </View>
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={24}
                                    color={colors.neutral.gray600}
                                />
                            </TouchableOpacity>

                            {isExpanded && day.doses.length > 0 && (
                                <View style={styles.dosesContainer}>
                                    {day.doses.map((item, idx) => {
                                        const blockInfo = getTimeBlockInfo(item.timeBlock);
                                        return (
                                            <View key={idx} style={styles.doseItem}>
                                                <View style={styles.doseTimeBlock}>
                                                    <Ionicons name={blockInfo.icon as any} size={20} color={blockInfo.color} />
                                                    <AccessibleText variant="caption" color={colors.neutral.gray600}>
                                                        {blockInfo.label}
                                                    </AccessibleText>
                                                </View>
                                                <View style={styles.doseInfo}>
                                                    <View style={styles.doseHeader}>
                                                        <AccessibleText variant="body" style={styles.doseName}>
                                                            {item.medication.name}
                                                        </AccessibleText>
                                                        <StatusBadge status={item.dose.status as any} />
                                                    </View>
                                                    <AccessibleText variant="caption" color={colors.neutral.gray500}>
                                                        {item.medication.dosage} • {formatTime(item.dose.scheduled_time)}
                                                    </AccessibleText>
                                                    {item.dose.notes && (
                                                        <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.doseNotes}>
                                                            {item.dose.notes}
                                                        </AccessibleText>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {isExpanded && day.doses.length === 0 && (
                                <View style={styles.emptyDay}>
                                    <AccessibleText variant="body" color={colors.neutral.gray500}>
                                        No doses recorded for this day
                                    </AccessibleText>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.neutral.gray100,
    },
    header: {
        padding: spacing.l,
        paddingTop: spacing.xl,
    },
    filterContainer: {
        backgroundColor: colors.neutral.white,
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    filterLabel: {
        marginBottom: spacing.s,
        color: colors.neutral.gray600,
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterChip: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: layout.borderRadius.full,
        backgroundColor: colors.neutral.gray200,
        marginRight: spacing.s,
    },
    filterChipActive: {
        backgroundColor: colors.primary.purple,
    },
    content: {
        flex: 1,
    },
    dayContainer: {
        backgroundColor: colors.neutral.white,
        marginBottom: spacing.m,
        borderRadius: layout.borderRadius.medium,
        overflow: 'hidden',
        marginHorizontal: spacing.m,
        ...layout.shadow.small,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.m,
        backgroundColor: colors.neutral.white,
    },
    dayHeaderLeft: {
        flex: 1,
    },
    dayTitle: {
        marginBottom: spacing.xs,
    },
    dosesContainer: {
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.m,
    },
    doseItem: {
        flexDirection: 'row',
        paddingVertical: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
    },
    doseTimeBlock: {
        alignItems: 'center',
        marginRight: spacing.m,
        paddingTop: spacing.xs,
    },
    doseInfo: {
        flex: 1,
    },
    doseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    doseName: {
        fontWeight: '600',
        flex: 1,
    },
    doseNotes: {
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    emptyDay: {
        padding: spacing.l,
        alignItems: 'center',
    },
});
