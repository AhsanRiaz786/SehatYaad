import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Card from './Card';
import AccessibleText from './AccessibleText';
import { colors, spacing } from '../utils/theme';
import { Medication } from '../database/helpers';

interface MedicationCardProps {
    medication: Medication;
    onPress?: () => void;
}

export default function MedicationCard({ medication, onPress }: MedicationCardProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Medication ${medication.name}`}>
            <Card style={styles.card}>
                <View style={styles.header}>
                    <AccessibleText variant="h3">{medication.name}</AccessibleText>
                    {medication.color && (
                        <View style={[styles.colorDot, { backgroundColor: medication.color }]} />
                    )}
                </View>
                <AccessibleText variant="body" color={colors.textSecondary}>
                    {medication.dosage} • {medication.frequency}
                </AccessibleText>
                <View style={styles.timesContainer}>
                    {medication.times.map((time, index) => (
                        <View key={index} style={styles.timeBadge}>
                            <AccessibleText variant="caption" color={colors.white}>
                                {time}
                            </AccessibleText>
                        </View>
                    ))}
                </View>
            </Card>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    timesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.s,
    },
    timeBadge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.s,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
});
