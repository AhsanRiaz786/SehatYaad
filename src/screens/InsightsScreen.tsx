import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import Icon from '../components/Icon';
import StatCard from '../components/analytics/StatCard';
import AdherenceLineChart from '../components/analytics/AdherenceLineChart';
import MedicationBarChart from '../components/analytics/MedicationBarChart';
import TimeBlockPieChart from '../components/analytics/TimeBlockPieChart';
import AdherenceCalendar from '../components/analytics/AdherenceCalendar';
import { colors, spacing, layout } from '../utils/theme';
import { applyScheduleRecommendation, getScheduleRecommendations, ScheduleRecommendation } from '../services/adaptiveReminderService';
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
    const [recommendations, setRecommendations] = useState<ScheduleRecommendation[]>([]);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const loadAnalytics = React.useCallback(async () => {
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

            // Load adaptive reminder recommendations
            const recs = await getScheduleRecommendations();
            setRecommendations(recs);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useFocusEffect(
        React.useCallback(() => {
            loadAnalytics();
        }, [loadAnalytics])
    );

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    const handleApplyRecommendation = async (rec: ScheduleRecommendation) => {
        try {
            const key = `${rec.medication.id}-${rec.currentTime}-${rec.recommendedTime}`;
            setApplyingId(key);
            await applyScheduleRecommendation(rec);
            await loadAnalytics();
        } catch (error) {
            console.error('Error applying schedule recommendation:', error);
        } finally {
            setApplyingId(null);
        }
    };

    const getTrendText = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'Improving';
            case 'down':
                return 'Declining';
            case 'stable':
                return 'Stable';
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadAnalytics} colors={[colors.primary.main]} />
            }
        >
                {/* Clean Header */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <AccessibleText variant="h1" color={colors.primary.dark} style={styles.headerTitle}>
                            Health Insights
                        </AccessibleText>
                        <AccessibleText variant="body" color={colors.text.secondary}>
                            Track your progress
                        </AccessibleText>
                    </View>
                    <View style={[styles.headerIcon, { backgroundColor: colors.primary.main + '15' }]}>
                        <Icon name="bar-chart-2" size={28} color={colors.primary.main} />
                    </View>
                </View>

                {/* Time Range Selector */}
                <View style={styles.rangeSelector}>
                    <TouchableOpacity
                        style={[styles.rangeButton, timeRange === 7 && styles.rangeButtonActive]}
                        onPress={() => setTimeRange(7)}
                    >
                        <AccessibleText
                            variant="button"
                            color={timeRange === 7 ? colors.neutral.white : colors.primary.main}
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
                            color={timeRange === 30 ? colors.neutral.white : colors.primary.main}
                        >
                            30 Days
                        </AccessibleText>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                {stats && (
                    <View style={styles.statsContainer}>
                        <StatCard
                            icon="activity"
                            label="Overall Adherence"
                            value={`${stats.overall}%`}
                            trend={stats.trend}
                            trendValue={getTrendText(stats.trend)}
                            color={colors.primary.purple}
                        />
                        <StatCard
                            icon="calendar"
                            label="Last 7 Days"
                            value={`${stats.weeklyAverage}%`}
                            color={colors.primary.blue}
                        />
                        <StatCard
                            icon="flame"
                            label="Current Streak"
                            value={`${stats.streakDays} days`}
                            color={colors.semantic.warning}
                        />
                        <StatCard
                            icon="trophy"
                            label="Longest Streak"
                            value={`${stats.longestStreak} days`}
                            color={colors.primary.teal}
                        />
                        <StatCard
                            icon="alert-circle"
                            label="Missed Doses"
                            value={stats.missedDoses}
                            color={colors.semantic.error}
                        />
                    </View>
                )}

                {/* Best / Worst Day Summary */}
                {stats && (stats.bestDay || stats.worstDay) && (
                    <View style={styles.summaryContainer}>
                        {stats.bestDay && (
                            <View style={styles.summaryItem}>
                                <AccessibleText variant="caption" color={colors.text.secondary}>
                                    Best Day
                                </AccessibleText>
                                <AccessibleText variant="body" style={styles.summaryValue}>
                                    {stats.bestDay.percentage}% on {stats.bestDay.date}
                                </AccessibleText>
                            </View>
                        )}
                        {stats.worstDay && (
                            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: colors.border.default, paddingLeft: spacing.m }]}>
                                <AccessibleText variant="caption" color={colors.text.secondary}>
                                    Toughest Day
                                </AccessibleText>
                                <AccessibleText variant="body" style={styles.summaryValue}>
                                    {stats.worstDay.percentage}% on {stats.worstDay.date}
                                </AccessibleText>
                            </View>
                        )}
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

                {/* Adaptive Reminder Suggestions */}
                {recommendations.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <AccessibleText variant="h3" style={styles.suggestionsTitle}>
                            Smart Reminder Suggestions
                        </AccessibleText>
                        {recommendations.map((rec, index) => {
                            const key = `${rec.medication.id}-${rec.currentTime}-${rec.recommendedTime}-${index}`;
                            return (
                                <View key={key} style={styles.suggestionCard}>
                                    <AccessibleText variant="body" style={styles.suggestionText}>
                                        For <AccessibleText variant="body" style={{ fontWeight: '700' }}>{rec.medication.name}</AccessibleText>, you often struggle with the
                                        <AccessibleText variant="body" style={{ fontWeight: '700' }}> {rec.currentTime} </AccessibleText>
                                        reminder.
                                    </AccessibleText>
                                    <AccessibleText variant="body" color={colors.text.secondary} style={styles.suggestionText}>
                                        {rec.reason}
                                    </AccessibleText>
                                    <AccessibleText variant="body" style={styles.suggestionText}>
                                        We suggest moving this reminder to{' '}
                                        <AccessibleText variant="body" style={{ fontWeight: '700' }}>
                                            {rec.recommendedTime}
                                        </AccessibleText>
                                        .
                                    </AccessibleText>
                                    <View style={styles.suggestionActions}>
                                        <TouchableOpacity
                                            style={styles.applyButton}
                                            disabled={loading || applyingId === key}
                                            onPress={() => handleApplyRecommendation(rec)}
                                        >
                                            <AccessibleText
                                                variant="button"
                                                color={colors.neutral.white}
                                            >
                                                {applyingId === key ? 'Applying...' : 'Apply Change'}
                                            </AccessibleText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Empty State */}
                {!loading && dailyData.length === 0 && (
                    <View style={styles.emptyState}>
                        <Icon name="bar-chart-2" size={64} color={colors.neutral.gray300} />
                        <AccessibleText variant="h3" color={colors.text.secondary} style={styles.emptyTitle}>
                            No Data Yet
                        </AccessibleText>
                        <AccessibleText variant="body" color={colors.text.tertiary} style={styles.emptyText}>
                            Start taking your medications to see insights and analytics
                        </AccessibleText>
                    </View>
                )}
            </ScrollView>
    );
}

const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background.default,
        },
        content: {
            paddingBottom: spacing.xxl,
        },
        header: {
            padding: spacing.xl,
            paddingBottom: spacing.m,
            marginBottom: spacing.s,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerTextContainer: {
            flex: 1,
        },
        headerIcon: {
            width: 48,
            height: 48,
            borderRadius: layout.borderRadius.full,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            marginBottom: spacing.xs,
        },
        rangeSelector: {
            flexDirection: 'row',
            paddingHorizontal: spacing.m,
            gap: spacing.s,
            marginBottom: spacing.m,
        },
        rangeButton: {
            flex: 1,
            paddingVertical: spacing.s, // Smaller vertical padding
            borderRadius: layout.borderRadius.medium,
            borderWidth: 1, // Thinner border
            borderColor: colors.primary.main,
            alignItems: 'center',
            backgroundColor: colors.background.white,
        },
        rangeButtonActive: {
            backgroundColor: colors.primary.main,
        },
        statsContainer: {
            paddingHorizontal: spacing.m,
            gap: spacing.m,
            marginBottom: spacing.m,
        },
        suggestionsContainer: {
            paddingHorizontal: spacing.m,
            marginTop: spacing.m,
            marginBottom: spacing.l,
        },
        suggestionsTitle: {
            marginBottom: spacing.s,
        },
        suggestionCard: {
            backgroundColor: colors.background.white,
            borderRadius: layout.borderRadius.large,
            padding: spacing.m,
            marginTop: spacing.s,
            ...layout.shadows.soft,
            ...layout.border.default,
        },
        suggestionText: {
            marginBottom: spacing.xs,
        },
        suggestionActions: {
            marginTop: spacing.s,
            flexDirection: 'row',
            justifyContent: 'flex-end',
        },
        applyButton: {
            backgroundColor: colors.primary.main,
            paddingHorizontal: spacing.m,
            paddingVertical: spacing.s,
            borderRadius: layout.borderRadius.medium,
        },
        summaryContainer: {
            backgroundColor: colors.background.white,
            borderRadius: layout.borderRadius.large,
            padding: spacing.m,
            marginHorizontal: spacing.m,
            marginBottom: spacing.m,
            ...layout.shadows.soft,
            ...layout.border.default,
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        summaryItem: {
            flex: 1,
        },
        summaryValue: {
            marginTop: spacing.xs,
            fontWeight: '600',
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
            backgroundColor: colors.background.white,
            borderRadius: layout.borderRadius.large,
            padding: spacing.m,
            marginHorizontal: spacing.m,
            ...layout.shadows.soft,
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
