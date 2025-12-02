import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import AccessibleButton from '../components/AccessibleButton';
import Card from '../components/Card';
import { getMedicationById, deleteMedication, Medication, logDose } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { cancelMedicationNotifications, snoozeNotification } from '../services/notificationService';
import { getScheduledTimeForToday } from '../utils/timeBlockUtils';
import { useTTS } from '../context/TTSContext';

type ParamList = {
    MedicationDetail: { medicationId: number };
};

export default function MedicationDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ParamList, 'MedicationDetail'>>();
    const { medicationId } = route.params;
    const [medication, setMedication] = useState<Medication | null>(null);
    const [loading, setLoading] = useState(true);
    const { speak } = useTTS();

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
                            speak("Medication deleted");
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete medication');
                        }
                    }
                }
            ]
        );
    };

    const handleTakeNow = async () => {
        if (!medication || !medication.id) return;

        Alert.alert(
            'Mark as Taken',
            `Did you take ${medication.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, I took it',
                    onPress: async () => {
                        try {
                            // Get the next scheduled time for this medication
                            const nextTime = medication.times[0]; // Simplified - take first time
                            const scheduledTime = getScheduledTimeForToday(nextTime);

                            // Log the dose as taken
                            await logDose({
                                medication_id: medication.id!,
                                scheduled_time: scheduledTime,
                                actual_time: Math.floor(Date.now() / 1000),
                                status: 'taken',
                                notes: 'Marked from detail screen'
                            });

                            Alert.alert('Success', 'Dose marked as taken!');
                            speak("Medication marked as taken");
                        } catch (error) {
                            console.error('Error logging dose:', error);
                            Alert.alert('Error', 'Failed to log dose');
                        }
                    }
                }
            ]
        );
    };

    const handleSnooze = async () => {
        if (!medication || !medication.id) return;

        Alert.alert(
            'Snooze Reminder',
            'Snooze this reminder for 10 minutes?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Snooze',
                    onPress: async () => {
                        try {
                            // Get next time before snoozing
                            const nextTime = medication.times[0];

                            // Schedule a snoozed notification
                            await snoozeNotification(
                                medication.id!,
                                medication.name,
                                medication.dosage,
                                10,
                                nextTime // Pass the original time
                            );

                            // Log dose as snoozed
                            const scheduledTime = getScheduledTimeForToday(nextTime);

                            await logDose({
                                medication_id: medication.id!,
                                scheduled_time: scheduledTime,
                                actual_time: Math.floor(Date.now() / 1000),
                                status: 'snoozed',
                                notes: 'Snoozed for 10 minutes'
                            });

                            Alert.alert('Snoozed', 'Reminder snoozed for 10 minutes');
                            speak("Reminder snoozed for 10 minutes");
                        } catch (error) {
                            console.error('Error snoozing:', error);
                            Alert.alert('Error', 'Failed to snooze reminder');
                        }
                    }
                }
            ]
        );
    };

    const handleSkip = async () => {
        if (!medication || !medication.id) return;

        Alert.alert(
            'Skip Dose',
            `Skip this dose of ${medication.name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Log dose as skipped
                            const nextTime = medication.times[0];
                            const scheduledTime = getScheduledTimeForToday(nextTime);

                            await logDose({
                                medication_id: medication.id!,
                                scheduled_time: scheduledTime,
                                actual_time: Math.floor(Date.now() / 1000),
                                status: 'skipped',
                                notes: 'Skipped from detail screen'
                            });

                            Alert.alert('Skipped', 'Dose marked as skipped');
                            speak("Dose marked as skipped");
                        } catch (error) {
                            console.error('Error skipping dose:', error);
                            Alert.alert('Error', 'Failed to skip dose');
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
                <Card style={styles.actionCard} onPress={handleTakeNow}>
                    <Ionicons name="checkmark-circle" size={32} color={colors.semantic.success} />
                    <AccessibleText variant="caption" style={styles.actionLabel}>
                        Take Now
                    </AccessibleText>
                </Card>
                <Card style={styles.actionCard} onPress={handleSnooze}>
                    <Ionicons name="time" size={32} color={colors.primary.orange} />
                    <AccessibleText variant="caption" style={styles.actionLabel}>
                        Snooze
                    </AccessibleText>
                </Card>
                <Card style={styles.actionCard} onPress={handleSkip}>
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
