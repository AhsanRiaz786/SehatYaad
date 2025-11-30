import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../database/helpers';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

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
                lightColor: '#007AFF',
                sound: 'default',
            });
        }

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
        const notificationIds: string[] = [];

        for (const time of medication.times) {
            const [hours, minutes] = time.split(':').map(Number);

            // Create a date for today with the specified time
            const triggerDate = new Date();
            triggerDate.setHours(hours, minutes, 0, 0);

            // If the time has already passed today, schedule for tomorrow
            if (triggerDate.getTime() < Date.now()) {
                triggerDate.setDate(triggerDate.getDate() + 1);
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Time for ${medication.name}`,
                    body: `${medication.dosage} - ${medication.notes || 'Take your medication'}`,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    data: {
                        medicationId: medication.id,
                        medicationName: medication.name,
                        time: time,
                    },
                    categoryIdentifier: 'medication-reminder',
                },
                trigger: {
                    channelId: 'medication-reminders',
                    repeats: true,
                    hour: hours,
                    minute: minutes,
                },
            });

            notificationIds.push(notificationId);
            console.log(`Scheduled notification ${notificationId} for ${medication.name} at ${time}`);
        }

        return notificationIds;
    } catch (error) {
        console.error('Error scheduling notifications:', error);
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
                title: 'Test Notification',
                body: 'This is a test medication reminder',
                sound: 'default',
                data: { test: true },
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
