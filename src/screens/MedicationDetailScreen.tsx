import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import AccessibleButton from '../components/AccessibleButton';
import Card from '../components/Card';
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
                <ActivityIndicator size="large" color={colors.primary.purple} />
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

    const medicationColor = medication.color || colors.primary.purple;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Hero Card with Gradient */}
            <View style={styles.heroCard}>
                <LinearGradient
                    colors={[medicationColor, medicationColor + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradient}
                >
                    <View style={styles.heroIcon}>
                        <Ionicons name="medical" size={48} color={colors.neutral.white} />
                    </View>
                    <AccessibleText
                        variant="display"
                        color={colors.neutral.white}
                        style={styles.heroTitle}
                    >
                        {medication.name}
                    </AccessibleText>
                    <AccessibleText
                        variant="bodyLarge"
                        color={colors.neutral.white}
                        style={{ opacity: 0.9 }}
                    >
                        {medication.dosage}
                    </AccessibleText>
                </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <Card style={styles.actionCard} onPress={() => {/* TODO: Log dose */ }}>
                    <Ionicons name="checkmark-circle" size={32} color={colors.semantic.success} />
                    <AccessibleText variant="caption" style={styles.actionLabel}>
                        Take Now
                    </AccessibleText>
                </Card>
                <Card style={styles.actionCard} onPress={() => {/* TODO: Snooze */ }}>
                    <Ionicons name="time" size={32} color={colors.primary.orange} />
                    <AccessibleText variant="caption" style={styles.actionLabel}>
                        Snooze
                    </AccessibleText>
                </Card>
                <Card style={styles.actionCard} onPress={() => {/* TODO: Skip */ }}>
                    <Ionicons name="close-circle" size={32} color={colors.neutral.gray500} />
                    <AccessibleText variant="caption" style={styles.actionLabel}>
                        Skip
                    </AccessibleText>
                </Card>
            </View>

            {/* Details Section */}
            <Card>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    Medication Details
                </AccessibleText>

                <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                        <Ionicons name="calendar" size={20} color={colors.primary.purple} />
                    </View>
                    <View style={styles.detailContent}>
                        <AccessibleText variant="caption" color={colors.neutral.gray600}>
                            Frequency
                        </AccessibleText>
                        <AccessibleText variant="body" style={styles.detailValue}>
                            {medication.frequency}
                        </AccessibleText>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                        <Ionicons name="time-outline" size={20} color={colors.primary.purple} />
                    </View>
                    <View style={styles.detailContent}>
                        <AccessibleText variant="caption" color={colors.neutral.gray600}>
                            Times
                        </AccessibleText>
                        <AccessibleText variant="body" style={styles.detailValue}>
                            {medication.times.join(', ')}
                        </AccessibleText>
                    </View>
                </View>

                {medication.notes && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="document-text" size={20} color={colors.primary.purple} />
                        </View>
                        <View style={styles.detailContent}>
                            <AccessibleText variant="caption" color={colors.neutral.gray600}>
                                Notes
                            </AccessibleText>
                            <AccessibleText variant="body" style={styles.detailValue}>
                                {medication.notes}
                            </AccessibleText>
                        </View>
                    </View>
                )}

                {medication.notification_ids && medication.notification_ids.length > 0 && (
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="notifications" size={20} color={colors.semantic.success} />
                        </View>
                        <View style={styles.detailContent}>
                            <AccessibleText variant="caption" color={colors.neutral.gray600}>
                                Reminders
                            </AccessibleText>
                            <AccessibleText variant="body" style={styles.detailValue}>
                                {medication.notification_ids.length} active reminders
                            </AccessibleText>
                        </View>
                    </View>
                )}
            </Card>

            {/* Delete Button */}
            <AccessibleButton
                title="Delete Medication"
                onPress={handleDelete}
                variant="danger"
                icon={<Ionicons name="trash" size={20} color={colors.neutral.white} />}
                iconPosition="left"
                style={styles.deleteButton}
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroCard: {
        margin: spacing.m,
        borderRadius: layout.borderRadius.large,
        overflow: 'hidden',
        ...layout.shadow.large,
    },
    heroGradient: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    heroTitle: {
        marginBottom: spacing.s,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        marginBottom: spacing.m,
        gap: spacing.s,
    },
    actionCard: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.m,
    },
    actionLabel: {
        marginTop: spacing.s,
        textAlign: 'center',
    },
    sectionTitle: {
        marginBottom: spacing.m,
    },
    detailRow: {
        flexDirection: 'row',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    detailIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.m,
    },
    detailContent: {
        flex: 1,
    },
    detailValue: {
        marginTop: spacing.xs,
    },
    deleteButton: {
        alignSelf: 'center',
        width: '80%',
        marginHorizontal: spacing.m,
        marginTop: spacing.l,
    },
});
