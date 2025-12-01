import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication, updateMedication } from '../database/helpers';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Set up notification categories with actions
export async function setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('medication-reminder', [
        {
            identifier: 'take',
            buttonTitle: 'I Took It ✓',
            options: {
                opensAppToForeground: false,
            },
        },
        {
            identifier: 'snooze',
            buttonTitle: 'Snooze 10 min',
            options: {
                opensAppToForeground: false,
            },
        },
        {
            identifier: 'skip',
            buttonTitle: 'Skip',
            options: {
                opensAppToForeground: false,
                isDestructive: true,
            },
        },
    ]);
}

/**
 * Request notification permissions from the user
 */
export async function requestPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permission not granted');
            return false;
        }

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('medication-reminders', {
                name: 'Medication Reminders',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#7209B7',
                sound: 'default',
                enableVibrate: true,
                enableLights: true,
            });
        }

        // Setup notification categories
        await setupNotificationCategories();

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Schedule notifications for a medication based on its frequency and times
 */
export async function scheduleMedicationNotifications(
    medication: Medication & { id: number }
): Promise<string[]> {
    try {
        console.log(`📅 Starting to schedule notifications for ${medication.name}`);
        console.log(`Times:`, medication.times);

        const notificationIds: string[] = [];

        for (const time of medication.times) {
            const [hours, minutes] = time.split(':').map(Number);

            console.log(`⏰ Scheduling notification for ${time} (${hours}:${minutes})`);

            // For Android, we need to use DAILY trigger, not CALENDAR
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `💊 Time for ${medication.name}`,
                    body: `Take ${medication.dosage}${medication.notes ? ` - ${medication.notes}` : ''}`,
                    sound: medication.notification_sound || 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: {
                        medicationId: medication.id,
                        medicationName: medication.name,
                        dosage: medication.dosage,
                        time: time,
                    },
                    categoryIdentifier: 'medication-reminder',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    channelId: 'medication-reminders',
                    hour: hours,
                    minute: minutes,
                },
            });

            notificationIds.push(notificationId);
            console.log(`✅ Scheduled notification ${notificationId} for ${medication.name} at ${hours}:${minutes}`);
        }

        // Update medication with notification IDs
        await updateMedication(medication.id, { notification_ids: notificationIds });
        console.log(`💾 Updated medication ${medication.id} with ${notificationIds.length} notification IDs`);

        return notificationIds;
    } catch (error) {
        console.error('❌ Error scheduling notifications:', error);
        throw error;
    }
}

/**
 * Snooze a notification by rescheduling it for X minutes later
 */
export async function snoozeNotification(
    medicationId: number,
    medicationName: string,
    dosage: string,
    snoozeMinutes: number = 10
): Promise<string> {
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `💊 Reminder: ${medicationName}`,
                body: `Take ${dosage} (Snoozed)`,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                data: {
                    medicationId,
                    medicationName,
                    dosage,
                    snoozed: true,
                },
                categoryIdentifier: 'medication-reminder',
            },
            trigger: {
                channelId: 'medication-reminders',
                seconds: snoozeMinutes * 60,
            },
        });

        console.log(`Snoozed notification for ${medicationName} for ${snoozeMinutes} minutes`);
        return notificationId;
    } catch (error) {
        console.error('Error snoozing notification:', error);
        throw error;
    }
}

/**
 * Cancel notifications by their IDs
 */
export async function cancelMedicationNotifications(notificationIds: string[]): Promise<void> {
    try {
        for (const id of notificationIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
            console.log(`Cancelled notification ${id}`);
        }
    } catch (error) {
        console.error('Error cancelling notifications:', error);
        throw error;
    }
}

/**
 * Send a test notification immediately
 */
export async function testNotification(): Promise<void> {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💊 Test Notification',
                body: 'This is a test medication reminder',
                sound: 'default',
                data: { test: true },
                categoryIdentifier: 'medication-reminder',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
            },
        });
        console.log('Test notification scheduled');
    } catch (error) {
        console.error('Error sending test notification:', error);
        throw error;
    }
}

/**
 * Setup notification listeners for handling user interactions
 */
export function setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
    // Listener for when notification is received while app is open
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }
    });

    // Listener for when user interacts with notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
        const actionIdentifier = response.actionIdentifier;
        const data = response.notification.request.content.data;

        // Handle action buttons
        if (actionIdentifier === 'take') {
            console.log(`User marked ${data.medicationName} as taken`);
            // TODO: Log dose as taken in database
        } else if (actionIdentifier === 'snooze') {
            console.log(`User snoozed ${data.medicationName}`);
            snoozeNotification(
                data.medicationId as number,
                data.medicationName as string,
                data.dosage as string,
                10
            );
        } else if (actionIdentifier === 'skip') {
            console.log(`User skipped ${data.medicationName}`);
            // TODO: Log dose as skipped in database
        }

        if (onNotificationResponse) {
            onNotificationResponse(response);
        }
    });

    return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
    };
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
    try {
        const notifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('Scheduled notifications:', notifications.length);
        return notifications;
    } catch (error) {
        console.error('Error getting scheduled notifications:', error);
        return [];
    }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All notifications cancelled');
    } catch (error) {
        console.error('Error cancelling all notifications:', error);
        throw error;
    }
}
