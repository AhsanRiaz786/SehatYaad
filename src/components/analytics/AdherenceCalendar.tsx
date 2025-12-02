import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';

interface AdherenceCalendarProps {
    adherenceData: Map<string, number>; // date (YYYY-MM-DD) -> percentage
    month?: Date;
}

export default function AdherenceCalendar({ adherenceData, month = new Date() }: AdherenceCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(month);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getColorForAdherence = (percentage: number) => {
        if (percentage >= 90) return colors.semantic.success;
        if (percentage >= 70) return colors.primary.orange;
        if (percentage >= 50) return colors.primary.teal;
        return colors.semantic.error;
    };

    const formatDate = (year: number, month: number, day: number) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const { daysInMonth, startingDayOfWeek, year, month: monthIndex } = getDaysInMonth(currentMonth);

    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Create calendar grid
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        week.push(null);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }

    // Add remaining empty slots in the last week
    if (week.length > 0) {
        while (week.length < 7) {
            week.push(null);
        }
        weeks.push(week);
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.primary.purple} />
                </TouchableOpacity>

                <AccessibleText variant="h3">{monthName}</AccessibleText>

                <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color={colors.primary.purple} />
                </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={styles.weekRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <View key={index} style={styles.dayLabel}>
                        <AccessibleText variant="small" color={colors.neutral.gray600}>
                            {day}
                        </AccessibleText>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                    {week.map((day, dayIndex) => {
                        if (day === null) {
                            return <View key={dayIndex} style={styles.dayCell} />;
                        }

                        const dateStr = formatDate(year, monthIndex, day);
                        const adherence = adherenceData.get(dateStr);
                        const hasData = adherence !== undefined;
                        const color = hasData ? getColorForAdherence(adherence) : colors.neutral.gray200;

                        return (
                            <View key={dayIndex} style={styles.dayCell}>
                                <View
                                    style={[
                                        styles.dayCircle,
                                        { backgroundColor: color },
                                    ]}
                                >
                                    <AccessibleText
                                        variant="small"
                                        color={hasData ? colors.neutral.white : colors.neutral.gray600}
                                        style={styles.dayText}
                                    >
                                        {day}
                                    </AccessibleText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ))}

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.semantic.success }]} />
                    <AccessibleText variant="small" color={colors.neutral.gray600}>
                        ≥90%
                    </AccessibleText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary.orange }]} />
                    <AccessibleText variant="small" color={colors.neutral.gray600}>
                        70-89%
                    </AccessibleText>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.semantic.error }]} />
                    <AccessibleText variant="small" color={colors.neutral.gray600}>
                        {'<70%'}
                    </AccessibleText>
                </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    navButton: {
        padding: spacing.s,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.s,
    },
    dayLabel: {
        width: 40,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCell: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontWeight: '600',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.m,
        marginTop: spacing.m,
        paddingTop: spacing.m,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});
