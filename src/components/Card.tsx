import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, layout, spacing } from '../utils/theme';

interface CardProps extends ViewProps {
    children: React.ReactNode;
}

export default function Card({ children, style, ...props }: CardProps) {
    return (
        <View style={[styles.card, style]} {...props}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: layout.borderRadius,
        padding: spacing.m,
        marginVertical: spacing.s,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Android shadow
    },
});
