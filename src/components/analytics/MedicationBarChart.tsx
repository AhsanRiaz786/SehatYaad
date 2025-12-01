import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';
import { MedicationStats } from '../../services/analyticsService';

interface MedicationBarChartProps {
    medications: MedicationStats[];
}

export default function MedicationBarChart({ medications }: MedicationBarChartProps) {
    if (medications.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <AccessibleText variant="body" color={colors.neutral.gray500}>
                    No medication data available
                </AccessibleText>
            </View>
        );
    }

    const getBarColor = (adherence: number): [string, string] => {
        if (adherence >= 90) return ['#10b981', '#059669']; // Green
        if (adherence >= 70) return ['#f59e0b', '#d97706']; // Yellow
        return ['#ef4444', '#dc2626']; // Red
    };

    return (
        <View style={styles.container}>
            <AccessibleText variant="h3" style={styles.title}>
                Medication Performance
            </AccessibleText>
            <AccessibleText variant="small" color={colors.neutral.gray600} style={styles.subtitle}>
                Adherence by medication
            </AccessibleText>

            <View style={styles.barsContainer}>
                {medications.map((med) => (
                    <View key={med.medicationId} style={styles.barItem}>
                        <View style={styles.labelContainer}>
                            <AccessibleText variant="body" style={styles.medName} numberOfLines={1}>
                                {med.name}
                            </AccessibleText>
                            <AccessibleText variant="small" color={colors.neutral.gray600}>
                                {med.takenDoses}/{med.totalDoses}
                            </AccessibleText>
                        </View>

                        <View style={styles.barBackground}>
                            <LinearGradient
                                colors={getBarColor(med.adherence)}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.barFill, { width: `${med.adherence}%` }]}
                            />
                            <View style={styles.percentageContainer}>
                                <AccessibleText
                                    variant="small"
                                    color={med.adherence > 50 ? colors.neutral.white : colors.neutral.gray800}
                                    style={styles.percentageText}
                                >
                                    {med.adherence}%
                                </AccessibleText>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.m,
        ...layout.shadow.small,
        marginBottom: spacing.m,
    },
    title: {
        marginBottom: spacing.xs,
    },
    subtitle: {
        marginBottom: spacing.m,
    },
    barsContainer: {
        gap: spacing.m,
    },
    barItem: {
        gap: spacing.xs,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    medName: {
        flex: 1,
        fontWeight: '600',
    },
    barBackground: {
        height: 36,
        backgroundColor: colors.neutral.gray200,
        borderRadius: layout.borderRadius.small,
        overflow: 'hidden',
        position: 'relative',
    },
    barFill: {
        height: '100%',
        minWidth: 40, // Minimum width to show percentage
    },
    percentageContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        paddingHorizontal: spacing.s,
    },
    percentageText: {
        fontWeight: '600',
    },
    emptyContainer: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.xl,
        alignItems: 'center',
        ...layout.shadow.small,
        marginBottom: spacing.m,
    },
});
