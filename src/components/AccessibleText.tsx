import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

interface AccessibleTextProps extends TextProps {
    variant?: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyLarge' | 'caption' | 'small' | 'button';
    color?: string;
}

export default function AccessibleText({
    style,
    variant = 'body',
    color = colors.text.primary,
    children,
    ...props
}: AccessibleTextProps) {
    const { language, isRTL } = useLanguage();

    // Determine font family based on language and variant
    const getFontFamily = () => {
        if (variant === 'display' || variant === 'h1' || variant === 'h2' || variant === 'h3') {
            // Headers use Noto Nastaliq Urdu for Urdu, Inter for English
            return language === 'ur' ? 'NotoNastaliqUrdu' : 'Inter';
        }
        // Body text uses Naskh-style for Urdu (System font), Inter for English
        return language === 'ur' ? 'System' : 'Inter';
    };

    return (
        <Text
            style={[
                styles.text,
                typography[variant] as any,
                {
                    color,
                    fontFamily: getFontFamily(),
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                },
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
        // Font family will be set dynamically
    },
});
