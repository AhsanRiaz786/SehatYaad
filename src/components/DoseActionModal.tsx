import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { Medication, logDose } from '../database/helpers';
import { getScheduledTimeForToday } from '../utils/timeBlockUtils';

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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

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
        onPress
    }: {
        icon: string;
        label: string;
        color: string;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            style={[styles.actionButton, { borderColor: color }]}
            onPress={onPress}
            disabled={processing}
        >
            <Ionicons name={icon as any} size={32} color={color} />
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
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={colors.gradients.primary as [string, string, ...string[]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <View style={styles.headerContent}>
                            <View style={styles.medicationInfo}>
                                <AccessibleText variant="h3" color={colors.neutral.white}>
                                    {medication.name}
                                </AccessibleText>
                                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                                    {medication.dosage} • {scheduledTime}
                                </AccessibleText>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color={colors.neutral.white} />
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            What would you like to do?
                        </AccessibleText>

                        <View style={styles.actionsGrid}>
                            <ActionButton
                                icon="checkmark-circle"
                                label="Take Now"
                                color={colors.semantic.success}
                                onPress={() => handleAction('taken')}
                            />
                            <ActionButton
                                icon="calendar"
                                label="Backdate"
                                color={colors.primary.purple}
                                onPress={handleBackdate}
                            />
                            <ActionButton
                                icon="close-circle"
                                label="Mark Missed"
                                color={colors.semantic.error}
                                onPress={() => handleAction('missed')}
                            />
                            <ActionButton
                                icon="remove-circle"
                                label="Skip"
                                color={colors.neutral.gray500}
                                onPress={() => handleAction('skipped')}
                            />
                        </View>

                        <View style={styles.notesSection}>
                            <AccessibleText variant="body" style={styles.notesLabel}>
                                Notes (Optional)
                            </AccessibleText>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Add a note about this dose..."
                                placeholderTextColor={colors.neutral.gray400}
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
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        overflow: 'hidden',
        ...layout.shadow.large,
    },
    header: {
        padding: spacing.l,
    },
    headerContent: {
        flexDirection: 'row',
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
        color: colors.neutral.gray800,
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
        borderWidth: 2,
        borderRadius: layout.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.neutral.white,
        padding: spacing.m,
        gap: spacing.s,
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
        color: colors.neutral.gray700,
        fontWeight: '500',
    },
    notesInput: {
        borderWidth: 1,
        borderColor: colors.neutral.gray300,
        borderRadius: layout.borderRadius.medium,
        padding: spacing.m,
        fontSize: 16,
        color: colors.neutral.gray800,
        backgroundColor: colors.neutral.gray100,
        minHeight: 80,
    },
});
