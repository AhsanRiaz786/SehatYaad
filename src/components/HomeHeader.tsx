import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../utils/formatting';

const HomeHeader = () => {
    const navigation = useNavigation<any>();
    const { t, language } = useLanguage();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('goodMorning');
        else if (hour < 18) setGreeting('goodAfternoon');
        else setGreeting('goodEvening');
    }, []);

    const localizedGreeting = t(`greeting.${greeting}`) ||
        (greeting === 'goodMorning' ? 'Good Morning' :
            greeting === 'goodAfternoon' ? 'Good Afternoon' : 'Good Evening');

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <AccessibleText variant="caption" style={styles.date}>
                    {formatDate(new Date())}
                </AccessibleText>
                <AccessibleText variant="h1" style={styles.greeting}>
                    {localizedGreeting}
                </AccessibleText>
                <AccessibleText variant="body" style={styles.subtitle}>
                    {t('home.heroTitle') || 'Stay on track with your health'}
                </AccessibleText>
            </View>

            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => navigation.navigate('DoseHistory')}
                accessibilityLabel="View History"
                accessibilityRole="button"
            >
                <Ionicons name="calendar" size={24} color={colors.primary.main} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.m,
        paddingTop: spacing.xl, // Safe area buffer
        paddingBottom: spacing.l,
        backgroundColor: colors.background.default,
    },
    textContainer: {
        flex: 1,
    },
    date: {
        color: colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    greeting: {
        color: colors.primary.dark,
        marginBottom: spacing.xs,
    },
    subtitle: {
        color: colors.text.secondary,
    },
    historyButton: {
        padding: spacing.s,
        backgroundColor: colors.primary.main + '15', // 15% opacity
        borderRadius: layout.borderRadius.medium,
        marginLeft: spacing.m,
    }
});

export default HomeHeader;
