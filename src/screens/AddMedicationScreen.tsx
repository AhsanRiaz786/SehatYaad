import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import AccessibleInput from '../components/AccessibleInput';
import AccessibleButton from '../components/AccessibleButton';
import Card from '../components/Card';
import { addMedication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { requestPermissions, scheduleMedicationNotifications } from '../services/notificationService';

const FREQUENCIES = ['Daily', 'Twice Daily', 'Thrice Daily', 'Weekly', 'As Needed'];
const COLORS = [
    { name: 'Red', value: '#FF5733' },
    { name: 'Green', value: '#33FF57' },
    { name: 'Blue', value: '#3357FF' },
    { name: 'Purple', value: '#7209B7' },
    { name: 'Orange', value: '#FF9E00' },
    { name: 'Pink', value: '#FF006E' },
];

export default function AddMedicationScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState(FREQUENCIES[0]);
    const [notes, setNotes] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[3].value); // Purple default
    const [loading, setLoading] = useState(false);

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
            Alert.alert('Missing Information', 'Please fill in Medication Name and Dosage.');
            return;
        }

        setLoading(true);
        try {
            const hasPermission = await requestPermissions();

            if (!hasPermission) {
                Alert.alert(
                    'Permissions Required',
                    'Notification permissions are needed for reminders. Enable in settings?',
                    [
                        { text: 'Skip', style: 'cancel', onPress: () => saveMedicationWithoutNotifications() },
                        { text: 'Save Anyway', onPress: () => saveMedicationWithoutNotifications() }
                    ]
                );
                setLoading(false);
                return;
            }

            const medicationData = {
                name,
                dosage,
                frequency,
                times: getTimesForFrequency(frequency),
                notes,
                color: selectedColor,
            };

            const medicationId = await addMedication(medicationData);

            try {
                await scheduleMedicationNotifications({
                    ...medicationData,
                    id: medicationId
                });
            } catch (notificationError) {
                console.error('Failed to schedule notifications:', notificationError);
            }

            Alert.alert('Success', 'Medication added with reminders!', [
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
            {/* Header */}
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Ionicons name="medical" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Add Medication
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Fill in the details below
                </AccessibleText>
            </LinearGradient>

            {/* Form Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    Medication Details
                </AccessibleText>

                <AccessibleInput
                    label="Medication Name"
                    placeholder="e.g. Paracetamol"
                    value={name}
                    onChangeText={setName}
                    icon={<Ionicons name="medical-outline" size={20} color={colors.neutral.gray500} />}
                />

                <AccessibleInput
                    label="Dosage"
                    placeholder="e.g. 500mg"
                    value={dosage}
                    onChangeText={setDosage}
                    icon={<Ionicons name="flask-outline" size={20} color={colors.neutral.gray500} />}
                />
            </Card>

            {/* Frequency Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    <Ionicons name="time" size={20} color={colors.primary.purple} /> Frequency
                </AccessibleText>
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
                                color={frequency === freq ? colors.neutral.white : colors.neutral.gray700}
                                style={{ fontWeight: '600' }}
                            >
                                {freq}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Color Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    <Ionicons name="color-palette" size={20} color={colors.primary.purple} /> Color Label
                </AccessibleText>
                <View style={styles.colorContainer}>
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color.value}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: color.value },
                                selectedColor === color.value && styles.colorSelected
                            ]}
                            onPress={() => setSelectedColor(color.value)}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${color.name}`}
                        >
                            {selectedColor === color.value && (
                                <Ionicons name="checkmark" size={24} color={colors.neutral.white} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Notes Card */}
            <Card style={styles.formCard}>
                <AccessibleInput
                    label="Notes (Optional)"
                    placeholder="e.g. Take after food"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={{ height: 100 }}
                    icon={<Ionicons name="document-text-outline" size={20} color={colors.neutral.gray500} />}
                />
            </Card>

            {/* Save Button */}
            <AccessibleButton
                title={loading ? "Saving..." : "Save Medication"}
                onPress={handleSave}
                disabled={loading}
                loading={loading}
                icon={<Ionicons name="checkmark-circle" size={20} color={colors.neutral.white} />}
                iconPosition="left"
                style={styles.saveButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    content: {
        paddingBottom: spacing.xl,
    },
    header: {
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    headerTitle: {
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    formCard: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
    },
    sectionTitle: {
        marginBottom: spacing.m,
        flexDirection: 'row',
        textAlign: 'center',
        color: colors.neutral.gray700,
        fontWeight: 'bold',
        alignItems: 'center',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    chip: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: layout.borderRadius.full,
        backgroundColor: colors.neutral.gray200,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: colors.primary.purple,
        borderColor: colors.primary.purple,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.m,
    },
    colorCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadow.small,
    },
    colorSelected: {
        borderColor: colors.neutral.white,
        ...layout.shadow.medium,
        transform: [{ scale: 1.1 }],
    },
    saveButton: {
        alignSelf: 'center',
        width: '80%',
        marginTop: 20,
    },
});
