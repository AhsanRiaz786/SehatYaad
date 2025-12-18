import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import Icon from './Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { Medication, logDose } from '../database/helpers';
import { getScheduledTimeForToday } from '../utils/timeBlockUtils';
import { useTTS } from '../context/TTSContext';
import { playSuccessSound } from '../utils/sounds';
import { useLanguage } from '../context/LanguageContext';

interface DoseActionModalProps {
    visible: boolean;
    onClose: () => void;
    medication: Medication & { id: number };
    scheduledTime: string; // HH:MM format
    onSuccess?: () => void;
}

export default function DoseActionModal({
    visible,
    onClose,
    medication,
    scheduledTime,
    onSuccess
}: DoseActionModalProps) {
    const { language, isRTL, t } = useLanguage();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const { speak } = useTTS();

    const handleAction = async (action: 'taken' | 'missed' | 'skipped', customTimestamp?: number) => {
        if (processing) return;

        setProcessing(true);
        try {
            const scheduledTimestamp = getScheduledTimeForToday(scheduledTime);
            const actualTimestamp = customTimestamp || Math.floor(Date.now() / 1000);

            await logDose({
                medication_id: medication.id,
                scheduled_time: scheduledTimestamp,
                actual_time: actualTimestamp,
                status: action,
                notes: notes || undefined
            });

            console.log(`✅ Logged dose as ${action} for ${medication.name}`);

            // Voice feedback and sound
            if (action === 'taken') {
                speak(`${medication.name} marked as taken`);
                playSuccessSound();
            } else if (action === 'missed') {
                speak(`Dose marked as missed`);
            } else if (action === 'skipped') {
                speak(`Dose skipped`);
            }

            // Reset state
            setNotes('');
            setSelectedDate(new Date());

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error logging dose:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleBackdate = () => {
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date && event.type !== 'dismissed') {
            setSelectedDate(date);
            if (Platform.OS === 'android') {
                // On Android, show time picker after date
                setShowTimePicker(true);
            } else {
                // On iOS, datetime is selected together
                const timestamp = Math.floor(date.getTime() / 1000);
                handleAction('taken', timestamp);
            }
        }
    };

    const onTimeChange = (event: any, time?: Date) => {
        setShowTimePicker(false);
        if (time && event.type !== 'dismissed') {
            // Combine selected date with selected time
            const combined = new Date(selectedDate);
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            const timestamp = Math.floor(combined.getTime() / 1000);
            handleAction('taken', timestamp);
        }
    };

    const ActionButton = ({
        icon,
        label,
        color,
        onPress,
        accessibilityLabel,
    }: {
        icon: string;
        label: string;
        color: string;
        onPress: () => void;
        accessibilityLabel?: string;
    }) => (
        <TouchableOpacity
            style={[styles.actionButton, { borderColor: color }]}
            onPress={onPress}
            disabled={processing}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || label}
        >
            <Icon name={icon as any} size={32} color={color} active={true} />
            <AccessibleText variant="body" style={[styles.actionLabel, { color }]}>
                {label}
            </AccessibleText>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            accessibilityViewIsModal
        >
            <View
                style={styles.overlay}
                accessible
                accessibilityRole="dialog"
                accessibilityLabel={`${medication.name} dose options`}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.headerContent}>
                            <View style={styles.medicationInfo}>
                                <AccessibleText variant="h3" color={colors.text.charcoal}>
                                    {medication.name}
                                </AccessibleText>
                                <AccessibleText variant="body" color={colors.text.charcoalLight}>
                                    {medication.dosage} • {scheduledTime}
                                </AccessibleText>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                accessibilityRole="button"
                                accessibilityLabel={language === 'ur' ? 'بند کریں' : 'Close dose actions'}
                            >
                                <Icon name="close" size={28} color={colors.text.charcoal} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            {language === 'ur' ? 'آپ کیا کرنا چاہیں گے؟' : 'What would you like to do?'}
                        </AccessibleText>

                        <View style={styles.actionsGrid}>
                            <ActionButton
                                icon="checkmark"
                                label={language === 'ur' ? 'ابھی لیں' : 'Take Now'}
                                color={colors.semantic.success}
                                onPress={() => handleAction('taken')}
                                accessibilityLabel={`Mark ${medication.name} dose at ${scheduledTime} as taken now`}
                            />
                            <ActionButton
                                icon="calendar"
                                label={language === 'ur' ? 'پچھلی تاریخ' : 'Backdate'}
                                color={colors.primary.forestGreen}
                                onPress={handleBackdate}
                                accessibilityLabel={`Mark ${medication.name} dose as taken earlier`}
                            />
                            <ActionButton
                                icon="close"
                                label={language === 'ur' ? 'چھوٹا ہوا نشان لگائیں' : 'Mark Missed'}
                                color={colors.semantic.error}
                                onPress={() => handleAction('missed')}
                                accessibilityLabel={`Mark ${medication.name} dose at ${scheduledTime} as missed`}
                            />
                            <ActionButton
                                icon="x"
                                label={language === 'ur' ? 'چھوڑ دیں' : 'Skip'}
                                color={colors.text.charcoalLight}
                                onPress={() => handleAction('skipped')}
                                accessibilityLabel={`Skip ${medication.name} dose at ${scheduledTime}`}
                            />
                        </View>

                        <View style={styles.notesSection}>
                            <AccessibleText variant="body" style={styles.notesLabel}>
                                {language === 'ur' ? 'نوٹ (اختیاری)' : 'Notes (Optional)'}
                            </AccessibleText>
                            <TextInput
                                style={styles.notesInput}
                                placeholder={language === 'ur' ? 'اس خوری کے بارے میں نوٹ شامل کریں...' : 'Add a note about this dose...'}
                                placeholderTextColor={colors.border.gray}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>

                    {/* DateTime Pickers */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                    {showTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="time"
                            display="default"
                            onChange={onTimeChange}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: colors.background.white,
        borderRadius: layout.borderRadius.large,
        overflow: 'hidden',
        ...layout.border.default,
        borderWidth: 1,
    },
    header: {
        padding: spacing.l,
        backgroundColor: colors.background.cream,
        ...layout.border.default,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
    },
    headerContent: {
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    medicationInfo: {
        flex: 1,
    },
    closeButton: {
        padding: spacing.xs,
        marginLeft: spacing.m,
    },
    content: {
        maxHeight: 500,
    },
    contentContainer: {
        padding: spacing.l,
    },
    sectionTitle: {
        marginBottom: spacing.m,
        color: colors.text.charcoal,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    actionButton: {
        flex: 1,
        minWidth: '45%',
        aspectRatio: 1,
        borderWidth: 1,
        borderRadius: layout.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background.white,
        padding: spacing.m,
        gap: spacing.s,
        ...layout.border.default,
    },
    actionLabel: {
        fontWeight: '600',
        textAlign: 'center',
    },
    notesSection: {
        marginTop: spacing.m,
    },
    notesLabel: {
        marginBottom: spacing.s,
        color: colors.text.charcoal,
        fontWeight: '500',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: colors.border.gray,
        borderRadius: layout.borderRadius.medium,
        padding: spacing.m,
        fontSize: 16,
        color: colors.text.charcoal,
        backgroundColor: colors.background.cream,
        minHeight: 80,
    },
});
