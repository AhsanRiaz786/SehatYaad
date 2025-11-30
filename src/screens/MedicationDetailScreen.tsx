import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import AccessibleButton from '../components/AccessibleButton';
import { getMedicationById, deleteMedication, Medication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { cancelMedicationNotifications } from '../services/notificationService';

type ParamList = {
    MedicationDetail: { medicationId: number };
};

export default function MedicationDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ParamList, 'MedicationDetail'>>();
    const { medicationId } = route.params;
    const [medication, setMedication] = useState<Medication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMedication();
    }, [medicationId]);

    const fetchMedication = async () => {
        try {
            const data = await getMedicationById(medicationId);
            setMedication(data);
        } catch (error) {
            console.error('Error fetching medication:', error);
            Alert.alert('Error', 'Failed to load medication details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Medication',
            'Are you sure you want to delete this medication? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Cancel notifications if they exist
                            if (medication?.notification_ids && medication.notification_ids.length > 0) {
                                await cancelMedicationNotifications(medication.notification_ids);
                                console.log('Cancelled notifications for medication');
                            }

                            await deleteMedication(medicationId);
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete medication');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!medication) {
        return (
            <View style={styles.center}>
                <AccessibleText variant="h3">Medication not found</AccessibleText>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={[styles.colorIndicator, { backgroundColor: medication.color || colors.primary }]} />
                <AccessibleText variant="h1">{medication.name}</AccessibleText>
            </View>

            <View style={styles.card}>
                <View style={styles.row}>
                    <AccessibleText variant="body" style={styles.label}>Dosage:</AccessibleText>
                    <AccessibleText variant="body">{medication.dosage}</AccessibleText>
                </View>

                <View style={styles.row}>
                    <AccessibleText variant="body" style={styles.label}>Frequency:</AccessibleText>
                    <AccessibleText variant="body">{medication.frequency}</AccessibleText>
                </View>

                <View style={styles.row}>
                    <AccessibleText variant="body" style={styles.label}>Times:</AccessibleText>
                    <AccessibleText variant="body">{medication.times.join(', ')}</AccessibleText>
                </View>

                {medication.notes ? (
                    <View style={styles.notesContainer}>
                        <AccessibleText variant="body" style={styles.label}>Notes:</AccessibleText>
                        <AccessibleText variant="body" style={styles.notesText}>{medication.notes}</AccessibleText>
                    </View>
                ) : null}
            </View>

            <View style={styles.actions}>
                <AccessibleButton
                    title="Delete Medication"
                    onPress={handleDelete}
                    variant="outline"
                    style={{ borderColor: colors.error }}
                    textStyle={{ color: colors.error }}
                />
            </View>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    colorIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: spacing.s,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: layout.borderRadius,
        padding: spacing.m,
        marginBottom: spacing.l,
        ...layout.shadow,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    label: {
        fontWeight: '600',
        color: colors.textSecondary,
    },
    notesContainer: {
        marginTop: spacing.s,
    },
    notesText: {
        marginTop: spacing.xs,
        fontStyle: 'italic',
    },
    actions: {
        marginTop: spacing.xl,
    },
});
