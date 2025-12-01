import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { getDailySummary } from '../database/helpers';

interface DailySummaryCardProps {
    onRefresh?: () => void;
    refreshKey?: number;
}

export default function DailySummaryCard({ refreshKey }: DailySummaryCardProps) {
    const [summary, setSummary] = useState({
        total: 0,
        taken: 0,
        missed: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, [refreshKey]); // Reload when refreshKey changes

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await getDailySummary();
            console.log('📊 Daily Summary:', data);
            setSummary(data);
        } catch (error) {
            console.error('Error loading daily summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const adherencePercentage = summary.total > 0
        ? Math.round((summary.taken / summary.total) * 100)
        : 0;

    const getMotivationalMessage = () => {
        if (adherencePercentage === 100) return "Perfect! You're crushing it! 🎉";
        if (adherencePercentage >= 80) return "Great job! Keep it up! 💪";
        if (adherencePercentage >= 60) return "You're doing well! 👍";
        return "Let's stay on track today! 💊";
    };

    return (
        <LinearGradient
            colors={colors.gradients.primary as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.header}>
                <View>
                    <AccessibleText variant="h3" color={colors.neutral.white}>
                        Today's Progress
                    </AccessibleText>
                    <AccessibleText
                        variant="caption"
                        color={colors.neutral.white}
                        style={styles.message}
                    >
                        {getMotivationalMessage()}
                    </AccessibleText>
                </View>
                <View style={styles.percentageCircle}>
                    <AccessibleText
                        variant="h2"
                        color={colors.neutral.white}
                        style={styles.percentage}
                    >
                        {adherencePercentage}%
                    </AccessibleText>
                </View>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.neutral.white} />
                    <AccessibleText variant="h3" color={colors.neutral.white}>
                        {summary.taken}
                    </AccessibleText>
                    <AccessibleText variant="small" color={colors.neutral.white} style={styles.statLabel}>
                        Taken
                    </AccessibleText>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <Ionicons name="time" size={24} color={colors.neutral.white} />
                    <AccessibleText variant="h3" color={colors.neutral.white}>
                        {summary.pending}
                    </AccessibleText>
                    <AccessibleText variant="small" color={colors.neutral.white} style={styles.statLabel}>
                        Pending
                    </AccessibleText>
                </View>

                <View style={styles.divider} />

                <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={24} color={colors.neutral.white} />
                    <AccessibleText variant="h3" color={colors.neutral.white}>
                        {summary.missed}
                    </AccessibleText>
                    <AccessibleText variant="small" color={colors.neutral.white} style={styles.statLabel}>
                        Missed
                    </AccessibleText>
                </View>
            </View>

            <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${adherencePercentage}%` }
                        ]}
                    />
                </View>
                <AccessibleText variant="caption" color={colors.neutral.white}>
                    {summary.taken} of {summary.total} doses
                </AccessibleText>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: spacing.m,
        padding: spacing.l,
        borderRadius: layout.borderRadius.large,
        ...layout.shadow.large,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.l,
    },
    message: {
        marginTop: spacing.xs,
        opacity: 0.9,
    },
    percentageCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.neutral.white,
    },
    percentage: {
        fontWeight: 'bold',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.l,
    },
    statItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    statLabel: {
        opacity: 0.9,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressBarContainer: {
        gap: spacing.s,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.neutral.white,
        borderRadius: 4,
    },
});
