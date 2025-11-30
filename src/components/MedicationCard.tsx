import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AccessibleText from './AccessibleText';
import { Medication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface MedicationCardProps {
    medication: Medication;
    onPress?: () => void;
}

export default function MedicationCard({ medication, onPress }: MedicationCardProps) {
    // Get next dose time display
    const getNextDoseTime = () => {
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

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={styles.container}
            accessibilityRole="button"
            accessibilityLabel={`${medication.name}, ${medication.dosage}, Tap for details`}
        >
            <View style={styles.card}>
                {/* Color indicator / Pill icon */}
                <LinearGradient
                    colors={[medicationColor, medicationColor]}
                    style={styles.iconContainer}
                >
                    <Ionicons name="medical" size={24} color={colors.neutral.white} />
                </LinearGradient>

                {/* Content */}
                <View style={styles.content}>
                    <AccessibleText variant="h3" numberOfLines={1}>
                        {medication.name}
                    </AccessibleText>
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

                {/* Chevron */}
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.neutral.gray400}
                />
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
});
