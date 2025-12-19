import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from '../../components/Icon';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';

interface StatCardProps {
    icon: string;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    color?: string; // Icon/Theme color
    // Dropping gradient prop as we are moving to flat design
    gradient?: [string, string];
}

export default function StatCard({
    icon,
    label,
    value,
    trend,
    trendValue,
    color = colors.primary.main,
}: StatCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend) {
            case 'up':
                // Using standard Icon component names (mapped to Lucide)
                return <Icon name="trending-up" size={16} color={colors.semantic.success} />;
            case 'down':
                return <Icon name="trending-down" size={16} color={colors.semantic.error} />;
            case 'stable':
                return <Icon name="minus" size={16} color={colors.neutral.gray500} />;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.contentRow}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <Icon name={icon} size={24} color={color} />
                </View>

                <View style={styles.textContent}>
                    <AccessibleText variant="caption" color={colors.text.secondary}>
                        {label}
                    </AccessibleText>
                    <AccessibleText variant="h2" color={colors.text.primary} style={styles.value}>
                        {value}
                    </AccessibleText>

                    {trend && trendValue && (
                        <View style={styles.trendContainer}>
                            {getTrendIcon()}
                            <AccessibleText
                                variant="small"
                                color={colors.text.secondary}
                                style={{ marginLeft: spacing.xs }}
                            >
                                {trendValue}
                            </AccessibleText>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.background.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.m,
        ...layout.shadows.soft, // Use the new soft shadow
        ...layout.border.default, // Subtle border
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: layout.borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    textContent: {
        flex: 1,
    },
    value: {
        marginTop: 2,
        marginBottom: 2,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
});
