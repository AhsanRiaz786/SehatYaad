import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleText from '../components/AccessibleText';
import { seedDatabase } from '../database/seed';
import { colors, spacing } from '../utils/theme';

export default function SettingsScreen() {
    const handleSeed = async () => {
        try {
            await seedDatabase();
            Alert.alert('Success', 'Database seeded with sample data');
        } catch (error) {
            Alert.alert('Error', 'Failed to seed database');
        }
    };

    return (
        <View style={styles.container}>
            <AccessibleText variant="h1" style={styles.title}>Settings</AccessibleText>

            <View style={styles.section}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>Developer Tools</AccessibleText>
                <AccessibleButton title="Seed Database (Test Data)" onPress={handleSeed} variant="secondary" />
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
});
