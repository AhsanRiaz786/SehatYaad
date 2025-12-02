import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';
import { DailyAdherence } from '../../services/analyticsService';

interface AdherenceLineChartProps {
    data: DailyAdherence[];
    days: 7 | 30;
}

export default function AdherenceLineChart({ data, days }: AdherenceLineChartProps) {
    const screenWidth = Dimensions.get('window').width - (spacing.m * 2);

    // Prepare chart data
    const labels = data.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
    });

    const percentages = data.map(d => d.percentage);

    // If no data, show empty state
    if (data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <AccessibleText variant="body" color={colors.neutral.gray500}>
                    No adherence data available for this period
                </AccessibleText>
            </View>
        );
    }

    const chartData = {
        labels: labels.length > 0 ? labels : [''],
        datasets: [
            {
                data: percentages.length > 0 ? percentages : [0],
                color: (opacity = 1) => `rgba(157, 80, 187, ${opacity})`,
                strokeWidth: 3,
            },
        ],
    };

    const chartConfig = {
        backgroundColor: colors.neutral.white,
        backgroundGradientFrom: colors.neutral.white,
        backgroundGradientTo: colors.neutral.white,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(157, 80, 187, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: {
            borderRadius: layout.borderRadius.medium,
        },
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: colors.primary.purple,
        },
        propsForBackgroundLines: {
            strokeDasharray: '', // solid lines
            stroke: colors.neutral.gray200,
        },
    };

    return (
        <View style={styles.container}>
            <AccessibleText variant="h3" style={styles.title}>
                Adherence Trend
            </AccessibleText>
            <AccessibleText variant="small" color={colors.neutral.gray600} style={styles.subtitle}>
                Last {days} days
            </AccessibleText>

            <LineChart
                data={chartData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines
                withVerticalLabels
                withHorizontalLabels
                yAxisSuffix="%"
                fromZero
                segments={4}
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
    chart: {
        marginVertical: spacing.s,
        borderRadius: layout.borderRadius.medium,
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
