import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import AccessibleText from './AccessibleText';
import StatusBadge, { DoseStatus } from './StatusBadge';
import Icon from './Icon';
import { Medication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

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
    const { language, isRTL, t } = useLanguage();

    // Get next dose time display
    const getNextDoseTime = () => {
        if (nextDoseTime) return nextDoseTime;
        if (!medication.times || medication.times.length === 0) {
            return language === 'ur' ? 'کوئی شیڈول نہیں' : 'No schedule';
        }
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

    // Get border color based on status
    const getBorderColor = () => {
        switch (status) {
            case 'taken':
                return colors.semantic.success;
            case 'missed':
                return colors.semantic.error;
            case 'snoozed':
                return colors.semantic.warning;
            default:
                return colors.border.gray;
        }
    };

    // Skeuomorphic pill blister pack icon
    const getPillIcon = () => {
        // Using a more realistic pill icon representation
        return 'medical';
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                style={[
                    styles.card,
                    {
                        borderColor: getBorderColor(),
                    },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${medication.name}, ${medication.dosage}, ${status}, Tap for details`}
            >
                {/* Main content row */}
                <View
                    style={[
                        styles.cardRow,
                        {
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                        },
                    ]}
                >
                    {/* Skeuomorphic pill icon */}
                    <View style={styles.iconContainer}>
                        <Icon
                            name="pill"
                            size={28}
                            color={colors.primary.forestGreen}
                            active={status === 'taken'}
                        />
                    </View>

                    {/* Content - Max 3 pieces of info: Name, Time, Dosage */}
                    <View style={styles.content}>
                        {/* 1. Name */}
                        <AccessibleText
                            variant="h3"
                            numberOfLines={1}
                            color={colors.text.charcoal}
                            style={styles.name}
                        >
                            {medication.name}
                        </AccessibleText>

                        {/* 2. Time */}
                        <View
                            style={[
                                styles.infoRow,
                                {
                                    flexDirection: isRTL ? 'row-reverse' : 'row',
                                },
                            ]}
                        >
                            <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                                <Icon
                                    name="time"
                                    size={16}
                                    color={colors.text.charcoalLight}
                                />
                            </View>
                            <AccessibleText
                                variant="body"
                                color={colors.text.charcoalLight}
                                style={styles.timeText}
                            >
                                {getNextDoseTime()}
                            </AccessibleText>
                        </View>

                        {/* 3. Dosage */}
                        <AccessibleText
                            variant="body"
                            color={colors.text.charcoalLight}
                            style={styles.dosage}
                        >
                            {medication.dosage}
                        </AccessibleText>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.statusContainer}>
                        <StatusBadge status={status} compact />
                    </View>
                </View>

                {/* Quick action button - Full width, 56px height - Outside the row */}
                {onQuickMark && status === 'pending' && (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onQuickMark();
                        }}
                        style={[
                            styles.quickActionButton,
                            {
                                backgroundColor: colors.primary.forestGreen,
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                            },
                        ]}
                        accessibilityLabel={t('medication.markAsTaken')}
                        accessibilityRole="button"
                    >
                        <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                            <Icon
                                name="checkmark"
                                size={20}
                                color={colors.background.white}
                                active={true}
                            />
                        </View>
                        <AccessibleText
                            variant="button"
                            color={colors.background.white}
                        >
                            {t('medication.markAsTaken')}
                        </AccessibleText>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
    },
    card: {
        backgroundColor: colors.background.white,
        borderRadius: layout.borderRadius.medium,
        padding: spacing.m,
        ...layout.border.default,
        borderWidth: 1,
    },
    cardRow: {
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: layout.borderRadius.small,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.cream,
        marginRight: spacing.m,
    },
    iconLeft: {
        marginRight: spacing.xs,
    },
    iconRight: {
        marginLeft: spacing.xs,
    },
    content: {
        flex: 1,
        minWidth: 0, // Allow text to wrap properly
    },
    name: {
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    timeText: {
        fontWeight: '500',
    },
    dosage: {
        marginTop: spacing.xs,
    },
    statusContainer: {
        marginLeft: spacing.s,
        alignSelf: 'flex-start',
    },
    quickActionButton: {
        width: '100%',
        height: layout.touchableHeight,
        borderRadius: layout.borderRadius.medium,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.m,
        paddingHorizontal: spacing.m,
    },
});
