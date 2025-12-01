import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from './AccessibleText';
import AccessibleButton from './AccessibleButton';
import { colors, spacing, layout } from '../utils/theme';

interface TimePickerProps {
    label: string;
    value: string; // Format: "HH:MM"
    onChange: (time: string) => void;
    onRemove?: () => void;
}

export default function TimePicker({ label, value, onChange, onRemove }: TimePickerProps) {
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate] = useState(() => {
        const [hours, minutes] = value.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    });

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') {
                const hours = selectedDate.getHours().toString().padStart(2, '0');
                const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
                onChange(`${hours}:${minutes}`);
            }
        }
    };

    const handleConfirm = () => {
        const hours = tempDate.getHours().toString().padStart(2, '0');
        const minutes = tempDate.getMinutes().toString().padStart(2, '0');
        onChange(`${hours}:${minutes}`);
        setShowPicker(false);
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => setShowPicker(true)}
                    accessibilityLabel={`${label} time picker`}
                    accessibilityHint="Double tap to change time"
                >
                    <Ionicons name="time-outline" size={20} color={colors.primary.purple} />
                    <View style={styles.timeContent}>
                        <AccessibleText variant="caption" color={colors.neutral.gray600}>
                            {label}
                        </AccessibleText>
                        <AccessibleText variant="body" style={styles.timeValue}>
                            {formatTime(value)}
                        </AccessibleText>
                    </View>
                </TouchableOpacity>

                {onRemove && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={onRemove}
                        accessibilityLabel="Remove time"
                        accessibilityRole="button"
                    >
                        <Ionicons name="close-circle" size={24} color={colors.semantic.error} />
                    </TouchableOpacity>
                )}
            </View>

            {Platform.OS === 'ios' ? (
                <Modal
                    visible={showPicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowPicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <AccessibleText variant="h3">Select Time</AccessibleText>
                                <TouchableOpacity onPress={() => setShowPicker(false)}>
                                    <Ionicons name="close" size={24} color={colors.neutral.gray700} />
                                </TouchableOpacity>
                            </View>

                            <DateTimePicker
                                value={tempDate}
                                mode="time"
                                display="spinner"
                                onChange={handleTimeChange}
                                style={styles.picker}
                            />

                            <AccessibleButton
                                title="Confirm"
                                onPress={handleConfirm}
                                style={styles.confirmButton}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                showPicker && (
                    <DateTimePicker
                        value={tempDate}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={handleTimeChange}
                    />
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    timeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral.white,
        borderWidth: 2,
        borderColor: colors.neutral.gray300,
        borderRadius: layout.borderRadius.medium,
        padding: spacing.m,
        gap: spacing.m,
        ...layout.shadow.small,
    },
    timeContent: {
        flex: 1,
    },
    timeValue: {
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    removeButton: {
        padding: spacing.s,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.neutral.white,
        borderTopLeftRadius: layout.borderRadius.large,
        borderTopRightRadius: layout.borderRadius.large,
        padding: spacing.l,
        paddingBottom: spacing.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    picker: {
        height: 200,
    },
    confirmButton: {
        marginTop: spacing.l,
    },
});
