import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { extractPrescriptionData, ExtractedMedication, getConfidenceColor, validateExtractedData } from '../services/prescriptionExtractor';
import { addMedication, getMedications } from '../database/helpers';
import { scheduleMedicationNotifications } from '../services/notificationService';

export default function PrescriptionReviewScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { imageUri } = route.params;

    const [isExtracting, setIsExtracting] = useState(true);
    const [medications, setMedications] = useState<ExtractedMedication[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        extractData();
    }, []);

    const extractData = async () => {
        try {
            setIsExtracting(true);
            const data = await extractPrescriptionData(imageUri);
            setMedications(data.medications || []);

            if (!data.medications || data.medications.length === 0) {
                Alert.alert(
                    'No Medications Found',
                    'Could not extract medication information. Would you like to add manually?',
                    [
                        { text: 'Retake Photo', onPress: () => navigation.goBack() },
                        { text: 'Add Manually', onPress: () => navigation.navigate('AddMedication') },
                    ]
                );
            }
        } catch (error) {
            console.error('Extraction error:', error);
            Alert.alert(
                'Extraction Failed',
                'Failed to process prescription. Please try again or add medications manually.',
                [
                    { text: 'Retake', onPress: () => navigation.goBack() },
                    { text: 'Manual Entry', onPress: () => navigation.navigate('AddMedication') },
                ]
            );
        } finally {
            setIsExtracting(false);
        }
    };

    const updateMedication = (index: number, field: keyof ExtractedMedication, value: any) => {
        const updated = [...medications];
        updated[index] = { ...updated[index], [field]: value };
        setMedications(updated);
    };

    const removeMedication = (index: number) => {
        Alert.alert(
            'Remove Medication',
            'Are you sure you want to remove this medication?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setMedications(prev => prev.filter((_, i) => i !== index));
                    },
                },
            ]
        );
    };

    const saveAll = async () => {
        try {
            setIsSaving(true);

            // Validate data
            const validMeds = medications.filter(validateExtractedData);
            if (validMeds.length === 0) {
                Alert.alert('No Valid Medications', 'Please ensure all medications have required fields filled.');
                return;
            }

            // Save each medication
            for (const med of validMeds) {
                const medId = await addMedication({
                    name: med.name,
                    dosage: `${med.dosage} ${med.dosageUnit}`,
                    frequency: med.frequency,
                    times: med.times,
                    color: '#9D50BB',
                    notes: med.instructions || '',
                });

                // Fetch the full medication object to schedule notifications
                const savedMed = await getMedications();
                const fullMed = savedMed.find(m => m.id === medId);

                if (fullMed && fullMed.id) {
                    await scheduleMedicationNotifications(fullMed as any);
                }
            }

            Alert.alert(
                'Success!',
                `${validMeds.length} medication(s) added successfully`,
                [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
            );
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save medications. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isExtracting) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={colors.gradients.primary as [string, string, ...string[]]}
                    style={styles.loadingGradient}
                >
                    <Ionicons name="scan" size={64} color={colors.neutral.white} />
                    <AccessibleText variant="h2" color={colors.neutral.white} style={{ marginTop: spacing.l }}>
                        Analyzing Prescription...
                    </AccessibleText>
                    <AccessibleText variant="body" color={colors.neutral.white} style={{ marginTop: spacing.s, opacity: 0.9 }}>
                        Using AI to extract medication details
                    </AccessibleText>
                    <ActivityIndicator size="large" color={colors.neutral.white} style={{ marginTop: spacing.xl }} />
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                style={styles.header}
            >
                <AccessibleText variant="h2" color={colors.neutral.white}>
                    Review & Edit
                </AccessibleText>
            </LinearGradient>

            <ScrollView style={styles.content}>
                {/* Prescription Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.prescriptionImage} resizeMode="contain" />
                </View>

                {/* Extracted Medications */}
                <View style={styles.medicationsSection}>
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        Extracted Medications ({medications.length})
                    </AccessibleText>

                    {medications.map((med, index) => (
                        <View key={index} style={styles.medCard}>
                            <View style={styles.medHeader}>
                                <AccessibleText variant="body" style={styles.medNumber}>
                                    #{index + 1}
                                </AccessibleText>
                                <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(med.confidence) }]}>
                                    <AccessibleText variant="caption" color={colors.neutral.white}>
                                        {med.confidence} confidence
                                    </AccessibleText>
                                </View>
                                <TouchableOpacity onPress={() => removeMedication(index)}>
                                    <Ionicons name="trash-outline" size={20} color={colors.semantic.error} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                value={med.name}
                                onChangeText={(text) => updateMedication(index, 'name', text)}
                                placeholder="Medication name"
                                placeholderTextColor={colors.neutral.gray400}
                            />

                            <View style={styles.dosageRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={med.dosage}
                                    onChangeText={(text) => updateMedication(index, 'dosage', text)}
                                    placeholder="Dosage"
                                    keyboardType="numeric"
                                    placeholderTextColor={colors.neutral.gray400}
                                />
                                <TextInput
                                    style={[styles.input, { width: 80, marginLeft: spacing.s }]}
                                    value={med.dosageUnit}
                                    onChangeText={(text) => updateMedication(index, 'dosageUnit', text)}
                                    placeholder="Unit"
                                    placeholderTextColor={colors.neutral.gray400}
                                />
                            </View>

                            <TextInput
                                style={styles.input}
                                value={med.frequency}
                                onChangeText={(text) => updateMedication(index, 'frequency', text)}
                                placeholder="Frequency"
                                placeholderTextColor={colors.neutral.gray400}
                            />

                            {med.instructions && (
                                <TextInput
                                    style={[styles.input, styles.notesInput]}
                                    value={med.instructions}
                                    onChangeText={(text) => updateMedication(index, 'instructions', text)}
                                    placeholder="Instructions"
                                    multiline
                                    numberOfLines={2}
                                    placeholderTextColor={colors.neutral.gray400}
                                />
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.retakeButton} onPress={() => navigation.goBack()}>
                    <AccessibleText variant="button" color={colors.primary.purple}>
                        Retake Photo
                    </AccessibleText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveAll}
                    disabled={isSaving || medications.length === 0}
                >
                    <LinearGradient
                        colors={colors.gradients.primary as [string, string, ...string[]]}
                        style={styles.saveButtonGradient}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={colors.neutral.white} />
                        ) : (
                            <AccessibleText variant="button" color={colors.neutral.white}>
                                Save All ({medications.length})
                            </AccessibleText>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    loadingContainer: {
        flex: 1,
    },
    loadingGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    header: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.l,
        paddingHorizontal: spacing.l,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        backgroundColor: colors.neutral.white,
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    prescriptionImage: {
        width: '100%',
        height: 200,
        borderRadius: layout.borderRadius.medium,
    },
    medicationsSection: {
        padding: spacing.m,
    },
    sectionTitle: {
        marginBottom: spacing.m,
    },
    medCard: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.medium,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...layout.shadow.small,
    },
    medHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
    medNumber: {
        fontWeight: '600',
        color: colors.neutral.gray600,
    },
    confidenceBadge: {
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: layout.borderRadius.full,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.neutral.gray300,
        borderRadius: layout.borderRadius.small,
        padding: spacing.m,
        fontSize: 16,
        color: colors.neutral.gray800,
        marginBottom: spacing.s,
        backgroundColor: colors.neutral.gray100,
    },
    dosageRow: {
        flexDirection: 'row',
    },
    notesInput: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    actions: {
        flexDirection: 'row',
        padding: spacing.m,
        gap: spacing.m,
        backgroundColor: colors.neutral.white,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
    },
    retakeButton: {
        flex: 1,
        paddingVertical: spacing.m,
        borderRadius: layout.borderRadius.medium,
        borderWidth: 2,
        borderColor: colors.primary.purple,
        alignItems: 'center',
    },
    saveButton: {
        flex: 2,
    },
    saveButtonGradient: {
        paddingVertical: spacing.m,
        borderRadius: layout.borderRadius.medium,
        alignItems: 'center',
    },
});
