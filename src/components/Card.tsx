import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, layout } from '../utils/theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'default' | 'gradient' | 'glass';
    onPress?: () => void;
    style?: ViewStyle;
}

export default function Card({ children, variant = 'default', onPress, style }: CardProps) {
    const CardContainer = onPress ? TouchableOpacity : View;

    if (variant === 'gradient') {
        return (
            <CardContainer
                onPress={onPress}
                activeOpacity={onPress ? 0.8 : 1}
                style={[styles.card, styles.gradientCard, style]}
            >
                <LinearGradient
                    colors={colors.gradients.primary as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                >
                    {children}
                </LinearGradient>
            </CardContainer>
        );
    }

    if (variant === 'glass') {
        return (
            <CardContainer
                onPress={onPress}
                activeOpacity={onPress ? 0.8 : 1}
                style={[styles.card, styles.glassCard, style]}
            >
                {children}
            </CardContainer>
        );
    }

    return (
        <CardContainer
            onPress={onPress}
            activeOpacity={onPress ? 0.9 : 1}
            style={[styles.card, style]}
        >
            {children}
        </CardContainer>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.large,
        padding: layout.cardPadding,
        marginBottom: layout.cardMargin,
        ...layout.shadow.small,
    },
    gradientCard: {
        padding: 0,
        overflow: 'hidden',
    },
    gradientBackground: {
        padding: layout.cardPadding,
    },
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        ...layout.shadow.small,
    },
});
