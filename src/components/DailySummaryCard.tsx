import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from './Icon';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { getDailySummary } from '../database/helpers';
import { useLanguage } from '../context/LanguageContext';

interface DailySummaryCardProps {
    onRefresh?: () => void;
    refreshKey?: number;
}

export default function DailySummaryCard({ refreshKey }: DailySummaryCardProps) {
    const { language, isRTL, t } = useLanguage();
    const [summary, setSummary] = useState({
        total: 0,
        taken: 0,
        missed: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, [refreshKey]); // Reload when refreshKey changes

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await getDailySummary();
            console.log('📊 Daily Summary:', data);
            setSummary(data);
        } catch (error) {
            console.error('Error loading daily summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const adherencePercentage = summary.total > 0
        ? Math.round((summary.taken / summary.total) * 100)
        : 0;

    const getMotivationalMessage = () => {
        if (language === 'ur') {
            if (adherencePercentage === 100) return 'بہترین! آپ بہت اچھا کر رہے ہیں! 🎉';
            if (adherencePercentage >= 80) return 'بہت اچھا کام! جاری رکھیں! 💪';
            if (adherencePercentage >= 60) return 'آپ اچھا کر رہے ہیں! 👍';
            return 'آج بھی ٹریک پر رہیں! 💊';
        }
        if (adherencePercentage === 100) return "Perfect! You're crushing it! 🎉";
        if (adherencePercentage >= 80) return "Great job! Keep it up! 💪";
        if (adherencePercentage >= 60) return "You're doing well! 👍";
        return "Let's stay on track today! 💊";
    };

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <AccessibleText variant="h3" color={colors.text.charcoal}>
                        {language === 'ur' ? 'آج کی پیش رفت' : "Today's Progress"}
                    </AccessibleText>
                    <AccessibleText
                        variant="caption"
                        color={colors.text.charcoalLight}
                        style={styles.message}
                    >
                        {getMotivationalMessage()}
                    </AccessibleText>
                </View>

                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Icon 
                            name="checkmark" 
                            size={20} 
                            color={colors.semantic.success}
                            active={summary.taken > 0}
                        />
                        <AccessibleText variant="h3" color={colors.text.charcoal}>
                            {summary.taken}
                        </AccessibleText>
                        <AccessibleText variant="small" color={colors.text.charcoalLight} style={styles.statLabel}>
                            {language === 'ur' ? 'لیا' : 'Taken'}
                        </AccessibleText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <Icon 
                            name="time" 
                            size={20} 
                            color={colors.semantic.warning}
                            active={summary.pending > 0}
                        />
                        <AccessibleText variant="h3" color={colors.text.charcoal}>
                            {summary.pending}
                        </AccessibleText>
                        <AccessibleText variant="small" color={colors.text.charcoalLight} style={styles.statLabel}>
                            {language === 'ur' ? 'زیر التواء' : 'Pending'}
                        </AccessibleText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.statItem}>
                        <Icon 
                            name="close" 
                            size={20} 
                            color={colors.semantic.error}
                            active={summary.missed > 0}
                        />
                        <AccessibleText variant="h3" color={colors.text.charcoal}>
                            {summary.missed}
                        </AccessibleText>
                        <AccessibleText variant="small" color={colors.text.charcoalLight} style={styles.statLabel}>
                            {language === 'ur' ? 'چھوٹ گیا' : 'Missed'}
                        </AccessibleText>
                    </View>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${adherencePercentage}%`, backgroundColor: colors.primary.forestGreen }
                            ]}
                        />
                    </View>
                    <AccessibleText variant="caption" color={colors.text.charcoalLight}>
                        {summary.taken} {language === 'ur' ? 'از' : 'of'} {summary.total} {language === 'ur' ? 'خوری' : 'doses'}
                    </AccessibleText>
                </View>
            </View>

            <View style={styles.percentageCircle}>
                <AccessibleText
                    variant="h2"
                    color={colors.primary.forestGreen}
                    style={styles.percentage}
                >
                    {adherencePercentage}%
                </AccessibleText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: spacing.m,
        padding: spacing.l,
        borderRadius: layout.borderRadius.medium,
        backgroundColor: colors.background.white,
        ...layout.border.default,
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    header: {
        marginBottom: spacing.m,
    },
    message: {
        marginTop: spacing.xs,
    },
    percentageCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.background.cream,
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.border.default,
        borderColor: colors.primary.forestGreen,
        borderWidth: 2,
        marginLeft: spacing.m,
    },
    percentage: {
        fontWeight: 'bold',
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.m,
    },
    statItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    statLabel: {
        fontSize: 11,
    },
    divider: {
        width: 1,
        backgroundColor: colors.border.gray,
    },
    progressBarContainer: {
        gap: spacing.s,
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.border.grayLight,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
});
