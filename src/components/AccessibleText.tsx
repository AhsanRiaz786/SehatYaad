import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '../utils/theme';

interface AccessibleTextProps extends TextProps {
    variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'caption' | 'small' | 'button';
    color?: string;
}

export default function AccessibleText({
    style,
    variant = 'body',
    color = colors.text,
    children,
    ...props
}: AccessibleTextProps) {
    return (
        <Text
            style={[
                styles.text,
                typography[variant] as any,
                { color },
                style
            ]}
            {...props}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    text: {
        fontFamily: 'System', // Use system font for now
    },
});
