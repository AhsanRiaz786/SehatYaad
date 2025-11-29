import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import { colors, spacing } from '../utils/theme';

export default function SplashScreen() {
    const navigation = useNavigation<any>();

    useEffect(() => {
        // Auto-navigate to Main screen after 2 seconds
        const timer = setTimeout(() => {
            navigation.replace('Main');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <AccessibleText variant="h1" style={styles.title}>SehatYaad</AccessibleText>
            <AccessibleText variant="body" style={styles.subtitle}>
                Your Health Companion
            </AccessibleText>
            <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loader}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary,
    },
    title: {
        color: colors.white,
        marginBottom: spacing.s,
    },
    subtitle: {
        color: colors.white,
        marginBottom: spacing.xl,
    },
    loader: {
        marginTop: spacing.l,
    },
});
