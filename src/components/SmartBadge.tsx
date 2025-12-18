import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from './Icon';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

interface SmartBadgeProps {
    message: string;
    explanation?: string;
    onPress?: () => void;
    variant?: 'info' | 'warning' | 'success';
}

export default function SmartBadge({
    message,
    explanation,
    onPress,
    variant = 'info',
}: SmartBadgeProps) {
    const { t, isRTL } = useLanguage();

    const getVariantColors = () => {
        switch (variant) {
            case 'success':
                return {
                    bg: '#ECFDF5',
                    border: colors.semantic.success,
                    icon: colors.semantic.success,
                };
            case 'warning':
                return {
                    bg: '#FFFBEB',
                    border: colors.semantic.warning,
                    icon: colors.semantic.warning,
                };
            default:
                return {
                    bg: '#EFF6FF',
                    border: colors.semantic.info,
                    icon: colors.semantic.info,
                };
        }
    };

    const variantColors = getVariantColors();

    const content = (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: variantColors.bg,
                    borderColor: variantColors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                },
            ]}
        >
            <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                <Icon
                    name="bulb"
                    size={20}
                    color={variantColors.icon}
                    active={true}
                />
            </View>
            <View style={styles.content}>
                <AccessibleText
                    variant="body"
                    color={colors.text.charcoal}
                    style={styles.message}
                >
                    {message}
                </AccessibleText>
                {explanation && (
                    <AccessibleText
                        variant="caption"
                        color={colors.text.charcoalLight}
                        style={styles.explanation}
                    >
                        {explanation}
                    </AccessibleText>
                )}
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        borderRadius: layout.borderRadius.medium,
        ...layout.border.default,
        alignItems: 'flex-start',
    },
    iconLeft: {
        marginRight: spacing.s,
    },
    iconRight: {
        marginLeft: spacing.s,
    },
    content: {
        flex: 1,
    },
    message: {
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    explanation: {
        lineHeight: 20,
    },
});

