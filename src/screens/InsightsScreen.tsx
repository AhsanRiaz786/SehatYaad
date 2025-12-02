import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import StatCard from '../components/analytics/StatCard';
import AdherenceLineChart from '../components/analytics/AdherenceLineChart';
import MedicationBarChart from '../components/analytics/MedicationBarChart';
import TimeBlockPieChart from '../components/analytics/TimeBlockPieChart';
import AdherenceCalendar from '../components/analytics/AdherenceCalendar';
import { colors, spacing, layout } from '../utils/theme';
import {
    getAdherenceStats,
    getMedicationStats,
    getDailyAdherence,
    getTimeBlockStats,
    AdherenceStats,
    MedicationStats,
    DailyAdherence,
    TimeBlockStats,
} from '../services/analyticsService';

type TimeRange = 7 | 30;

export default function InsightsScreen() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>(7);
    const [stats, setStats] = useState<AdherenceStats | null>(null);
    const [medicationStats, setMedicationStats] = useState<MedicationStats[]>([]);
    const [dailyData, setDailyData] = useState<DailyAdherence[]>([]);
    const [timeBlockStats, setTimeBlockStats] = useState<TimeBlockStats>({ morning: 0, noon: 0, evening: 0, night: 0 });
    const [calendarData, setCalendarData] = useState<Map<string, number>>(new Map());

    useFocusEffect(
        React.useCallback(() => {
            loadAnalytics();
        }, [timeRange])
    );

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            // Load all analytics data
            const [adherenceStats, medStats, daily, timeBlocks] = await Promise.all([
                getAdherenceStats(timeRange),
                getMedicationStats(timeRange),
                getDailyAdherence(timeRange),
                getTimeBlockStats(timeRange),
            ]);

            setStats(adherenceStats);
            setMedicationStats(medStats);
            setDailyData(daily);
            setTimeBlockStats(timeBlocks);

            // Build calendar data map
            const calMap = new Map<string, number>();
            daily.forEach(d => {
                calMap.set(d.date, d.percentage);
            });
            setCalendarData(calMap);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTrendText = (trend: 'up' | 'down' | 'stable', diff: number) => {
        switch (trend) {
            case 'up':
                return `+${diff.toFixed(1)}% this week`;
            case 'down':
                return `${diff.toFixed(1)}% this week`;
            case 'stable':
                return 'Stable';
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadAnalytics} colors={[colors.primary.purple]} />
            }
        >
            {/* Header */}
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Ionicons name="bar-chart" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Health Insights
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Track your progress
                </AccessibleText>
            </LinearGradient>

            {/* Time Range Selector */}
            <View style={styles.rangeSelector}>
                <TouchableOpacity
                    style={[styles.rangeButton, timeRange === 7 && styles.rangeButtonActive]}
                    onPress={() => setTimeRange(7)}
                >
                    <AccessibleText
                        variant="button"
                        color={timeRange === 7 ? colors.neutral.white : colors.primary.purple}
                    >
                        7 Days
                    </AccessibleText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.rangeButton, timeRange === 30 && styles.rangeButtonActive]}
                    onPress={() => setTimeRange(30)}
                >
                    <AccessibleText
                        variant="button"
                        color={timeRange === 30 ? colors.neutral.white : colors.primary.purple}
                    >
                        30 Days
                    </AccessibleText>
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            {stats && (
                <View style={styles.statsContainer}>
                    <StatCard
                        icon="analytics"
                        label="Overall Adherence"
                        value={`${stats.overall}%`}
                        trend={stats.trend}
                        trendValue={getTrendText(stats.trend)}
                        gradient={['#9D50BB', '#6E3CBC'] as [string, string]}
                    />
                    <StatCard
                        icon="flame"
                        label="Current Streak"
                        value={`${stats.streakDays} days`}
                        gradient={['#f59e0b', '#d97706'] as [string, string]}
                    />
                    <StatCard
                        icon="trophy"
                        label="Longest Streak"
                        value={`${stats.longestStreak} days`}
                        gradient={['#10b981', '#059669'] as [string, string]}
                    />
                </View>
            )}

            {/* Adherence Timeline Chart */}
            <AdherenceLineChart data={dailyData} days={timeRange} />

            {/* Medication Performance */}
            <MedicationBarChart medications={medicationStats} />

            {/* Time Block Performance */}
            <View style={{ paddingHorizontal: spacing.m }}>
                <TimeBlockPieChart stats={timeBlockStats} />
            </View>

            {/* Adherence Calendar */}
            <View style={{ paddingHorizontal: spacing.m }}>
                <AdherenceCalendar adherenceData={calendarData} />
            </View>

            {/* Empty State */}
            {!loading && dailyData.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="analytics-outline" size={64} color={colors.neutral.gray400} />
                    <AccessibleText variant="h3" color={colors.neutral.gray600} style={styles.emptyTitle}>
                        No Data Yet
                    </AccessibleText>
                    <AccessibleText variant="body" color={colors.neutral.gray500} style={styles.emptyText}>
                        Start taking your medications to see insights and analytics
                    </AccessibleText>
                </View>
            )}

            {/* Health Tip */}
            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <Ionicons name="bulb" size={24} color={colors.primary.orange} />
                    <AccessibleText variant="h3" style={styles.tipTitle}>
                        Health Tip
                    </AccessibleText>
                </View>
                <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.tipText}>
                    Taking your medication at the same time every day helps create a consistent routine and
                    improves adherence by up to 30%.
                </AccessibleText>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    content: {
        paddingBottom: spacing.xxl,
    },
    header: {
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    headerTitle: {
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    rangeSelector: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    rangeButton: {
        flex: 1,
        paddingVertical: spacing.m,
        borderRadius: layout.borderRadius.medium,
        borderWidth: 2,
        borderColor: colors.primary.purple,
        alignItems: 'center',
        backgroundColor: colors.neutral.white,
    },
    rangeButtonActive: {
        backgroundColor: colors.primary.purple,
    },
    statsContainer: {
        paddingHorizontal: spacing.m,
        gap: spacing.m,
        marginBottom: spacing.m,
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
    tipCard: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.m,
        marginHorizontal: spacing.m,
        ...layout.shadow.small,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    tipTitle: {
        marginLeft: spacing.s,
    },
    tipText: {
        lineHeight: 24,
    },
});
