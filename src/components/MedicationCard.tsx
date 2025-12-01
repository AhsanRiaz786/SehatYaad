import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AccessibleText from './AccessibleText';
import StatusBadge, { DoseStatus } from './StatusBadge';
import { Medication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface MedicationCardProps {
    medication: Medication;
    onPress?: () => void;
    status?: DoseStatus;
    nextDoseTime?: string;
    onQuickMark?: () => void;
}

export default function MedicationCard({
    medication,
    onPress,
    status = 'pending',
    nextDoseTime,
    onQuickMark
}: MedicationCardProps) {
    // Get next dose time display
    const getNextDoseTime = () => {
        if (nextDoseTime) return nextDoseTime;
        if (!medication.times || medication.times.length === 0) return 'No schedule';
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        for (const time of medication.times) {
            const [hours, minutes] = time.split(':').map(Number);
            const medicTime = hours * 60 + minutes;
            if (medicTime > currentTime) {
                return time;
            }
        }
        return medication.times[0]; // Next day's first dose
    };

    const medicationColor = medication.color || colors.primary.purple;

    // Get border color based on status
    const getBorderColor = () => {
        switch (status) {
            case 'taken':
                return colors.semantic.success;
            case 'missed':
                return colors.semantic.error;
            case 'snoozed':
                return '#FF9500';
            default:
                return 'transparent';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={styles.container}
            accessibilityRole="button"
            accessibilityLabel={`${medication.name}, ${medication.dosage}, ${status}, Tap for details`}
        >
            <View style={[
                styles.card,
                { borderColor: getBorderColor(), borderWidth: getBorderColor() !== 'transparent' ? 2 : 0 }
            ]}>
                {/* Color indicator / Pill icon */}
                <LinearGradient
                    colors={[medicationColor, medicationColor]}
                    style={styles.iconContainer}
                >
                    <Ionicons name="medical" size={24} color={colors.neutral.white} />
                </LinearGradient>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <AccessibleText variant="h3" numberOfLines={1} style={styles.name}>
                            {medication.name}
                        </AccessibleText>
                        <StatusBadge status={status} compact />
                    </View>

                    <AccessibleText
                        variant="body"
                        color={colors.neutral.gray600}
                        style={styles.dosage}
                    >
                        {medication.dosage} • {medication.frequency}
                    </AccessibleText>

                    <View style={styles.timeRow}>
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={colors.primary.purple}
                        />
                        <AccessibleText
                            variant="caption"
                            color={colors.primary.purple}
                            style={styles.timeText}
                        >
                            Next: {getNextDoseTime()}
                        </AccessibleText>
                    </View>
                </View>

                {/* Quick action or chevron */}
                {onQuickMark && status === 'pending' ? (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onQuickMark();
                        }}
                        style={styles.quickActionButton}
                        accessibilityLabel="Mark as taken"
                        accessibilityRole="button"
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={32}
                            color={colors.semantic.success}
                        />
                    </TouchableOpacity>
                ) : (
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.neutral.gray400}
                    />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: spacing.m,
        ...layout.shadow.medium,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    name: {
        flex: 1,
        marginRight: spacing.s,
    },
    dosage: {
        marginTop: spacing.xs,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.s,
    },
    timeText: {
        marginLeft: spacing.xs,
        fontWeight: '500',
    },
    quickActionButton: {
        padding: spacing.xs,
        marginLeft: spacing.s,
    },
});
