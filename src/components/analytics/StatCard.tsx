import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AccessibleText from '../AccessibleText';
import { colors, spacing, layout } from '../../utils/theme';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    color?: string;
    gradient?: [string, string];
}

export default function StatCard({
    icon,
    label,
    value,
    trend,
    trendValue,
    color = colors.primary.purple,
    gradient = colors.gradients.primary as [string, string],
}: StatCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend) {
            case 'up':
                return <Ionicons name="trending-up" size={16} color={colors.semantic.success} />;
            case 'down':
                return <Ionicons name="trending-down" size={16} color={colors.semantic.error} />;
            case 'stable':
                return <Ionicons name="remove" size={16} color={colors.neutral.gray500} />;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={24} color={colors.neutral.white} />
                </View>

                <View style={styles.content}>
                    <AccessibleText variant="caption" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                        {label}
                    </AccessibleText>
                    <AccessibleText variant="h1" color={colors.neutral.white} style={styles.value}>
                        {value}
                    </AccessibleText>

                    {trend && trendValue && (
                        <View style={styles.trendContainer}>
                            {getTrendIcon()}
                            <AccessibleText
                                variant="small"
                                color={colors.neutral.white}
                                style={{ marginLeft: spacing.xs, opacity: 0.9 }}
                            >
                                {trendValue}
                            </AccessibleText>
                        </View>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: layout.borderRadius.large,
        overflow: 'hidden',
        ...layout.shadow.medium,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    content: {
        flex: 1,
    },
    value: {
        marginTop: spacing.xs,
        marginBottom: spacing.xs,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
