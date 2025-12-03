import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTTS } from '../context/TTSContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleText from '../components/AccessibleText';
import Card from '../components/Card';
import { seedDatabase } from '../database/seed';
import { colors, spacing, layout } from '../utils/theme';
import { testNotification, getAllScheduledNotifications, requestPermissions } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const { enabled, setEnabled, rate, setRate, pitch, setPitch, volume, setVolume, speak } = useTTS();

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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Ionicons name="settings" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Settings
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Manage your preferences
                </AccessibleText>
            </LinearGradient>

            {/* Voice Feedback Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="mic" size={24} color={colors.primary.blue} />
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        Voice Feedback
                    </AccessibleText>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: colors.neutral.gray300, true: colors.primary.blue }}
                        thumbColor={colors.neutral.white}
                    />
                </View>

                {enabled && (
                    <>
                        <View style={styles.settingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700}>
                                Speech Rate: {rate.toFixed(1)}x
                            </AccessibleText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.5}
                                maximumValue={2.0}
                                step={0.1}
                                value={rate}
                                onSlidingComplete={setRate}
                                minimumTrackTintColor={colors.primary.blue}
                                maximumTrackTintColor={colors.neutral.gray300}
                                thumbTintColor={colors.primary.blue}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700}>
                                Pitch: {pitch.toFixed(1)}
                            </AccessibleText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.5}
                                maximumValue={2.0}
                                step={0.1}
                                value={pitch}
                                onSlidingComplete={setPitch}
                                minimumTrackTintColor={colors.primary.blue}
                                maximumTrackTintColor={colors.neutral.gray300}
                                thumbTintColor={colors.primary.blue}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700}>
                                Volume: {Math.round(volume * 100)}%
                            </AccessibleText>
                            <Slider
                                style={styles.slider}
                                minimumValue={0.0}
                                maximumValue={1.0}
                                step={0.1}
                                value={volume}
                                onSlidingComplete={setVolume}
                                minimumTrackTintColor={colors.primary.blue}
                                maximumTrackTintColor={colors.neutral.gray300}
                                thumbTintColor={colors.primary.blue}
                            />
                        </View>

                        <AccessibleButton
                            title="Test Voice Settings"
                            onPress={() => speak("This is a test of the voice settings.", true)}
                            variant="outline"
                            size="small"
                            icon={<Ionicons name="play-circle-outline" size={16} color={colors.primary.blue} />}
                            iconPosition="left"
                            style={{ marginTop: spacing.m }}
                        />
                    </>
                )}
            </Card>

            {/* Notifications Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="notifications" size={24} color={colors.primary.purple} />
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        Notifications
                    </AccessibleText>
                </View>

                <View style={styles.statusRow}>
                    <AccessibleText variant="body" color={colors.neutral.gray700}>
                        Permission Status
                    </AccessibleText>
                    <View style={styles.statusBadge}>
                        <Ionicons
                            name={permissionsGranted ? "checkmark-circle" : "close-circle"}
                            size={16}
                            color={permissionsGranted ? colors.semantic.success : colors.semantic.error}
                        />
                        <AccessibleText
                            variant="caption"
                            color={permissionsGranted ? colors.semantic.success : colors.semantic.error}
                            style={styles.statusText}
                        >
                            {permissionsGranted ? 'Granted' : 'Not Granted'}
                        </AccessibleText>
                    </View>
                </View>

                {!permissionsGranted && (
                    <AccessibleButton
                        title="Request Permissions"
                        onPress={handleRequestPermissions}
                        variant="primary"
                        size="small"
                        icon={<Ionicons name="key" size={16} color={colors.neutral.white} />}
                        iconPosition="left"
                    />
                )}

                <AccessibleButton
                    title="Send Test Notification"
                    onPress={handleTestNotification}
                    variant="secondary"
                    size="small"
                    disabled={!permissionsGranted}
                    icon={<Ionicons name="notifications-outline" size={16} color={colors.primary.purple} />}
                    iconPosition="left"
                />

                <AccessibleButton
                    title="View Scheduled Reminders"
                    onPress={handleViewScheduled}
                    variant="ghost"
                    size="small"
                    icon={<Ionicons name="list" size={16} color={colors.primary.purple} />}
                    iconPosition="left"
                />
            </Card>

            {/* App Info Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.primary.purple} />
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        App Information
                    </AccessibleText>
                </View>

                <View style={styles.infoRow}>
                    <AccessibleText variant="body" color={colors.neutral.gray700}>
                        Version
                    </AccessibleText>
                    <AccessibleText variant="body" style={styles.infoValue}>
                        1.0.0
                    </AccessibleText>
                </View>

                <View style={styles.infoRow}>
                    <AccessibleText variant="body" color={colors.neutral.gray700}>
                        Build
                    </AccessibleText>
                    <AccessibleText variant="body" style={styles.infoValue}>
                        Phase 4 - Modern UI
                    </AccessibleText>
                </View>
            </Card>

            {/* Developer Tools Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="code-slash" size={24} color={colors.primary.orange} />
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        Developer Tools
                    </AccessibleText>
                </View>

                <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.devNote}>
                    These tools are for testing and development purposes only.
                </AccessibleText>

                <AccessibleButton
                    title="Seed Database (Test Data)"
                    onPress={handleSeed}
                    variant="outline"
                    size="small"
                    icon={<Ionicons name="barcode-outline" size={16} color={colors.primary.orange} />}
                    iconPosition="left"
                />
            </Card>

            {/* About Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="heart" size={24} color={colors.primary.pink} />
                    <AccessibleText variant="h3" style={styles.sectionTitle}>
                        About
                    </AccessibleText>
                </View>

                <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.aboutText}>
                    SehatYaad helps you manage your medications and stay on track with your health routine.
                </AccessibleText>

                <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.copyright}>
                    © 2025 SehatYaad. All rights reserved.
                </AccessibleText>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    content: {
        paddingBottom: spacing.xxl,
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
    section: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    sectionTitle: {
        marginLeft: spacing.s,
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingVertical: spacing.s,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.neutral.gray100,
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        borderRadius: layout.borderRadius.full,
    },
    statusText: {
        marginLeft: spacing.xs,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    infoValue: {
        fontWeight: '600',
    },
    devNote: {
        marginBottom: spacing.m,
        fontStyle: 'italic',
    },
    aboutText: {
        lineHeight: 24,
        marginBottom: spacing.m,
    },
    copyright: {
        textAlign: 'center',
        marginTop: spacing.s,
    },
    settingRow: {
        marginBottom: spacing.m,
    },
    slider: {
        width: '100%',
        height: 40,
    },
});
