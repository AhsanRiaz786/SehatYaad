import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import AccessibleInput from '../components/AccessibleInput';
import AccessibleButton from '../components/AccessibleButton';
import { addMedication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { requestPermissions, scheduleMedicationNotifications } from '../services/notificationService';

const FREQUENCIES = ['Daily', 'Twice Daily', 'Thrice Daily', 'Weekly', 'As Needed'];
const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33', '#33FFF5'];

export default function AddMedicationScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState(FREQUENCIES[0]);
    const [notes, setNotes] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [loading, setLoading] = useState(false);

    // Simplified time selection for now (defaults based on frequency)
    const getTimesForFrequency = (freq: string) => {
        switch (freq) {
            case 'Daily': return ['09:00'];
            case 'Twice Daily': return ['09:00', '21:00'];
            case 'Thrice Daily': return ['09:00', '14:00', '21:00'];
            default: return ['09:00'];
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !dosage.trim()) {
            Alert.alert('Error', 'Please fill in Medication Name and Dosage.');
            return;
        }

        setLoading(true);
        try {
            // Request notification permissions
            const hasPermission = await requestPermissions();

            if (!hasPermission) {
                Alert.alert(
                    'Permissions Required',
                    'Notification permissions are required for medication reminders. You can enable them in settings.',
                    [
                        { text: 'Skip', style: 'cancel' },
                        { text: 'Save Anyway', onPress: () => saveMedicationWithoutNotifications() }
                    ]
                );
                setLoading(false);
                return;
            }

            // Add medication to database
            const medicationData = {
                name,
                dosage,
                frequency,
                times: getTimesForFrequency(frequency),
                notes,
                color: selectedColor,
            };

            const medicationId = await addMedication(medicationData);

            // Schedule notifications
            try {
                const notificationIds = await scheduleMedicationNotifications({
                    ...medicationData,
                    id: medicationId
                });

                console.log(`Scheduled ${notificationIds.length} notifications for ${name}`);
            } catch (notificationError) {
                console.error('Failed to schedule notifications:', notificationError);
                Alert.alert('Warning', 'Medication saved but reminders could not be scheduled');
            }

            Alert.alert('Success', 'Medication added successfully with reminders!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save medication');
        } finally {
            setLoading(false);
        }
    };

    const saveMedicationWithoutNotifications = async () => {
        try {
            await addMedication({
                name,
                dosage,
                frequency,
                times: getTimesForFrequency(frequency),
                notes,
                color: selectedColor,
            });
            Alert.alert('Success', 'Medication added (without reminders)', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save medication');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <AccessibleText variant="h1" style={styles.title}>Add Medication</AccessibleText>

            <AccessibleInput
                label="Medication Name"
                placeholder="e.g. Paracetamol"
                value={name}
                onChangeText={setName}
            />

            <AccessibleInput
                label="Dosage"
                placeholder="e.g. 500mg"
                value={dosage}
                onChangeText={setDosage}
            />

            <View style={styles.section}>
                <AccessibleText variant="body" style={styles.label}>Frequency</AccessibleText>
                <View style={styles.chipContainer}>
                    {FREQUENCIES.map((freq) => (
                        <TouchableOpacity
                            key={freq}
                            style={[
                                styles.chip,
                                frequency === freq && styles.chipSelected
                            ]}
                            onPress={() => setFrequency(freq)}
                            accessibilityRole="button"
                            accessibilityLabel={`Frequency ${freq}`}
                        >
                            <AccessibleText
                                variant="caption"
                                color={frequency === freq ? colors.white : colors.text}
                            >
                                {freq}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <AccessibleText variant="body" style={styles.label}>Color Label</AccessibleText>
                <View style={styles.colorContainer}>
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: color },
                                selectedColor === color && styles.colorSelected
                            ]}
                            onPress={() => setSelectedColor(color)}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${color}`}
                        />
                    ))}
                </View>
            </View>

            <AccessibleInput
                label="Notes (Optional)"
                placeholder="e.g. Take after food"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 100 }}
            />

            <AccessibleButton
                title={loading ? "Saving..." : "Save Medication"}
                onPress={handleSave}
                disabled={loading}
                style={styles.saveButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.m,
    },
    title: {
        marginBottom: spacing.l,
    },
    section: {
        marginBottom: spacing.m,
    },
    label: {
        marginBottom: spacing.s,
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 20,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.s,
        marginBottom: spacing.s,
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: spacing.m,
        marginBottom: spacing.s,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorSelected: {
        borderColor: colors.black,
        transform: [{ scale: 1.1 }],
    },
    saveButton: {
        marginTop: spacing.l,
        marginBottom: spacing.xl,
    },
});
