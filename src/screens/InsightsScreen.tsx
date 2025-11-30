import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import Card from '../components/Card';
import { colors, spacing, layout } from '../utils/theme';
import { getMedications } from '../database/helpers';

const { width } = Dimensions.get('window');

// Mock data for weekly adherence (until we have real history tracking)
const WEEKLY_DATA = [
    { day: 'Mon', value: 100, status: 'perfect' },
    { day: 'Tue', value: 80, status: 'good' },
    { day: 'Wed', value: 60, status: 'warning' },
    { day: 'Thu', value: 100, status: 'perfect' },
    { day: 'Fri', value: 90, status: 'good' },
    { day: 'Sat', value: 40, status: 'poor' },
    { day: 'Sun', value: 100, status: 'perfect' },
];

export default function InsightsScreen() {
    const [stats, setStats] = useState({
        totalMeds: 0,
        adherence: 85,
        streak: 5,
        missed: 2
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const meds = await getMedications();
        setStats(prev => ({
            ...prev,
            totalMeds: meds.length
        }));
    };

    const getBarColor = (value: number) => {
        if (value >= 90) return colors.semantic.success;
        if (value >= 70) return colors.primary.teal;
        if (value >= 50) return colors.primary.orange;
        return colors.semantic.error;
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
                <Ionicons name="bar-chart" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Health Insights
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Track your progress
                </AccessibleText>
            </LinearGradient>

            {/* Overview Cards */}
            <View style={styles.statsGrid}>
                <Card style={styles.statCard}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.primary.purple + '20' }]}>
                        <Ionicons name="flame" size={24} color={colors.primary.purple} />
                    </View>
                    <AccessibleText variant="h2" style={styles.statValue}>{stats.streak}</AccessibleText>
                    <AccessibleText variant="caption" color={colors.neutral.gray600}>Day Streak</AccessibleText>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.semantic.success + '20' }]}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
                    </View>
                    <AccessibleText variant="h2" style={styles.statValue}>{stats.adherence}%</AccessibleText>
                    <AccessibleText variant="caption" color={colors.neutral.gray600}>Adherence</AccessibleText>
                </Card>

                <Card style={styles.statCard}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.semantic.error + '20' }]}>
                        <Ionicons name="alert-circle" size={24} color={colors.semantic.error} />
                    </View>
                    <AccessibleText variant="h2" style={styles.statValue}>{stats.missed}</AccessibleText>
                    <AccessibleText variant="caption" color={colors.neutral.gray600}>Missed</AccessibleText>
                </Card>
            </View>

            {/* Weekly Chart */}
            <Card style={styles.chartCard}>
                <View style={styles.cardHeader}>
                    <AccessibleText variant="h3">Weekly Overview</AccessibleText>
                    <AccessibleText variant="caption" color={colors.neutral.gray600}>Last 7 Days</AccessibleText>
                </View>

                <View style={styles.chartContainer}>
                    {WEEKLY_DATA.map((item, index) => (
                        <View key={index} style={styles.barGroup}>
                            <View style={styles.barTrack}>
                                <LinearGradient
                                    colors={[getBarColor(item.value), getBarColor(item.value) + '80']}
                                    style={[styles.bar, { height: `${item.value}%` }]}
                                />
                            </View>
                            <AccessibleText variant="small" style={styles.dayLabel}>
                                {item.day}
                            </AccessibleText>
                        </View>
                    ))}
                </View>
            </Card>

            {/* Tips Section */}
            <Card style={styles.tipsCard}>
                <View style={styles.cardHeader}>
                    <Ionicons name="bulb" size={24} color={colors.primary.orange} />
                    <AccessibleText variant="h3" style={styles.cardTitle}>Health Tip</AccessibleText>
                </View>
                <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.tipText}>
                    Taking your medication at the same time every day helps create a consistent routine and improves adherence.
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
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: spacing.m,
        gap: spacing.s,
        marginBottom: spacing.m,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: spacing.m,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    statValue: {
        marginBottom: spacing.xs,
    },
    chartCard: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
        padding: spacing.m,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 150,
        alignItems: 'flex-end',
    },
    barGroup: {
        alignItems: 'center',
        flex: 1,
    },
    barTrack: {
        width: 12,
        height: '100%',
        backgroundColor: colors.neutral.gray200,
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
    },
    dayLabel: {
        marginTop: spacing.s,
        color: colors.neutral.gray600,
    },
    tipsCard: {
        marginHorizontal: spacing.m,
        padding: spacing.m,
    },
    cardTitle: {
        marginLeft: spacing.s,
    },
    tipText: {
        lineHeight: 24,
    },
});
