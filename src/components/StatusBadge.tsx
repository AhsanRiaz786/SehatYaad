import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from './Icon';
import AccessibleText from './AccessibleText';
import { colors, spacing } from '../utils/theme';

export type DoseStatus = 'taken' | 'pending' | 'missed' | 'snoozed' | 'skipped';

interface StatusBadgeProps {
    status: DoseStatus;
    time?: string;
    compact?: boolean;
}

export default function StatusBadge({ status, time, compact = false }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'taken':
                return {
                    icon: 'checkmark' as const,
                    color: colors.semantic.success,
                    bgColor: colors.semantic.success + '20',
                    label: 'Taken',
                };
            case 'pending':
                return {
                    icon: 'hourglass' as const,
                    color: colors.semantic.warning,
                    bgColor: colors.semantic.warning + '20',
                    label: 'Pending',
                };
            case 'missed':
                return {
                    icon: 'alert-circle' as const,
                    color: colors.semantic.error,
                    bgColor: colors.semantic.error + '20',
                    label: 'Missed',
                };
            case 'snoozed':
                return {
                    icon: 'clock' as const,
                    color: '#FF9500',
                    bgColor: '#FF950020',
                    label: 'Snoozed',
                };
            case 'skipped':
                return {
                    icon: 'slash' as const,
                    color: colors.neutral.gray600,
                    bgColor: colors.neutral.gray300,
                    label: 'Skipped',
                };
        }
    };

    const config = getStatusConfig();

    if (compact) {
        return (
            <View style={[styles.compactBadge, { backgroundColor: config.bgColor }]}>
                <Icon
                    name={config.icon}
                    size={16}
                    color={config.color}
                    active={status === 'taken'}
                />
            </View>
        );
    }

    return (
        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <Icon
                name={config.icon}
                size={18}
                color={config.color}
                active={status === 'taken'}
            />
            <View style={styles.textContainer}>
                <AccessibleText
                    variant="caption"
                    style={[styles.label, { color: config.color }]}
                >
                    {config.label}
                </AccessibleText>
                {time && (
                    <AccessibleText
                        variant="small"
                        style={[styles.time, { color: config.color }]}
                    >
                        {time}
                    </AccessibleText>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        gap: spacing.xs,
    },
    compactBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        gap: 2,
    },
    label: {
        fontWeight: '600',
        fontSize: 12,
    },
    time: {
        fontSize: 10,
        fontWeight: '500',
    },
});
