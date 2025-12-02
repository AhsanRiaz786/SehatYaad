import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';
import { TimeBlockStats } from '../../services/analyticsService';

interface TimeBlockPieChartProps {
    stats: TimeBlockStats;
}

export default function TimeBlockPieChart({ stats }: TimeBlockPieChartProps) {
    const screenWidth = Dimensions.get('window').width - (spacing.m * 2);

    const data = [
        {
            name: 'Morning',
            population: stats.morning,
            color: '#10b981',
            legendFontColor: colors.neutral.gray700,
            legendFontSize: 14,
        },
        {
            name: 'Noon',
            population: stats.noon,
            color: '#f59e0b',
            legendFontColor: colors.neutral.gray700,
            legendFontSize: 14,
        },
        {
            name: 'Evening',
            population: stats.evening,
            color: '#ef4444',
            legendFontColor: colors.neutral.gray700,
            legendFontSize: 14,
        },
        {
            name: 'Night',
            population: stats.night,
            color: '#8b5cf6',
            legendFontColor: colors.neutral.gray700,
            legendFontSize: 14,
        },
    ];

    // Check if we have any data
    const hasData = stats.morning > 0 || stats.noon > 0 || stats.evening > 0 || stats.night > 0;

    if (!hasData) {
        return (
            <View style={styles.emptyContainer}>
                <AccessibleText variant="body" color={colors.neutral.gray500}>
                    No time block data available
                </AccessibleText>
            </View>
        );
    }

    const chartConfig = {
        color: (opacity = 1) => `rgba(157, 80, 187, ${opacity})`,
    };

    return (
        <View style={styles.container}>
            <AccessibleText variant="h3" style={styles.title}>
                Performance by Time
            </AccessibleText>
            <AccessibleText variant="small" color={colors.neutral.gray600} style={styles.subtitle}>
                Best adherence times of day
            </AccessibleText>

            <PieChart
                data={data}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
            />
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
    emptyContainer: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.xl,
        alignItems: 'center',
        ...layout.shadow.small,
        marginBottom: spacing.m,
    },
});
