import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleText from '../components/AccessibleText';
import { seedDatabase } from '../database/seed';
import { colors, spacing } from '../utils/theme';
import { testNotification, getAllScheduledNotifications, requestPermissions } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
    const [permissionsGranted, setPermissionsGranted] = useState(false);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionsGranted(status === 'granted');
    };

    const handleSeed = async () => {
        try {
            await seedDatabase();
            Alert.alert('Success', 'Database seeded with sample data');
        } catch (error) {
            Alert.alert('Error', 'Failed to seed database');
        }
    };

    const handleTestNotification = async () => {
        try {
            await testNotification();
            Alert.alert('Success', 'Test notification scheduled! It will appear in 2 seconds.');
        } catch (error) {
            Alert.alert('Error', 'Failed to send test notification');
        }
    };

    const handleViewScheduled = async () => {
        try {
            const notifications = await getAllScheduledNotifications();
            Alert.alert(
                'Scheduled Notifications',
                `You have ${notifications.length} scheduled reminders`
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to get scheduled notifications');
        }
    };

    const handleRequestPermissions = async () => {
        const granted = await requestPermissions();
        setPermissionsGranted(granted);
        if (granted) {
            Alert.alert('Success', 'Notification permissions granted!');
        } else {
            Alert.alert('Error', 'Notification permissions denied');
        }
    };

    return (
        <View style={styles.container}>
            <AccessibleText variant="h1" style={styles.title}>Settings</AccessibleText>

            <View style={styles.section}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>Notifications</AccessibleText>
                <AccessibleText variant="body" style={styles.statusText}>
                    Permissions: {permissionsGranted ? '✓ Granted' : '✗ Not Granted'}
                </AccessibleText>
                {!permissionsGranted && (
                    <AccessibleButton
                        title="Request Permissions"
                        onPress={handleRequestPermissions}
                        variant="primary"
                    />
                )}
                <AccessibleButton
                    title="Send Test Notification"
                    onPress={handleTestNotification}
                    variant="secondary"
                    disabled={!permissionsGranted}
                />
                <AccessibleButton
                    title="View Scheduled Reminders"
                    onPress={handleViewScheduled}
                    variant="outline"
                />
            </View>

            <View style={styles.section}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>Developer Tools</AccessibleText>
                <AccessibleButton
                    title="Seed Database (Test Data)"
                    onPress={handleSeed}
                    variant="secondary"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.m,
        backgroundColor: colors.background
    },
    title: {
        marginBottom: spacing.l,
    },
    section: {
        marginBottom: spacing.l,
    },
    sectionTitle: {
        marginBottom: spacing.s,
    },
    statusText: {
        marginBottom: spacing.m,
        color: colors.textSecondary,
    },
});
