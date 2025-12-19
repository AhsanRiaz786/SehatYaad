import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

interface AccessibleButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    style?: ViewStyle;
    textStyle?: object;
}

export default function AccessibleButton({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    loading = false,
    icon,
    iconPosition = 'left',
    style,
    textStyle,
    disabled,
    ...props
}: AccessibleButtonProps) {
    const { isRTL } = useLanguage();

    const getHeight = () => {
        switch (size) {
            case 'small':
                return layout.touchableHeightSmall;
            case 'large':
                return layout.touchableHeightLarge;
            default:
                return layout.touchableHeight; // Minimum 56px for primary actions (Fitts's Law)
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary.main,
                    borderColor: colors.primary.main,
                    textColor: colors.background.paper,
                };
            case 'success':
                return {
                    backgroundColor: colors.status.success.main,
                    borderColor: colors.status.success.main,
                    textColor: colors.background.paper,
                };
            case 'danger':
                return {
                    backgroundColor: colors.status.error.main,
                    borderColor: colors.status.error.main,
                    textColor: colors.background.paper,
                };
            case 'secondary':
                return {
                    backgroundColor: colors.background.paper,
                    borderColor: colors.primary.main,
                    textColor: colors.primary.main,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderColor: colors.border.default,
                    textColor: colors.text.primary,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                    textColor: colors.primary.main,
                };
            default:
                return {
                    backgroundColor: colors.primary.main,
                    borderColor: colors.primary.main,
                    textColor: colors.background.paper,
                };
        }
    };

    const variantStyles = getVariantStyles();
    const height = getHeight();
    const isOutlineVariant = variant === 'secondary' || variant === 'ghost' || variant === 'outline';

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variantStyles.textColor}
                />
            ) : (
                <View
                    style={[
                        styles.contentContainer,
                        {
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                        },
                    ]}
                >
                    {icon && iconPosition === 'left' && (
                        <View style={isRTL ? styles.iconRight : styles.iconLeft}>
                            {icon}
                        </View>
                    )}
                    <AccessibleText
                        variant="button"
                        color={variantStyles.textColor}
                        style={[styles.text, textStyle]}
                    >
                        {title}
                    </AccessibleText>
                    {icon && iconPosition === 'right' && (
                        <View style={isRTL ? styles.iconLeft : styles.iconRight}>
                            {icon}
                        </View>
                    )}
                </View>
            )}
        </>
    );

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    height,
                    backgroundColor: variantStyles.backgroundColor,
                    borderColor: variantStyles.borderColor,
                    borderWidth: variant === 'ghost' ? 0 : 1,
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={disabled || loading}
            {...props}
        >
            {buttonContent}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: layout.borderRadius.medium,
        width: '100%', // Full width as per Fitts's Law
        marginVertical: spacing.s,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        ...layout.border.default, // 1px border instead of shadow
    },
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
    iconLeft: {
        marginRight: spacing.s,
    },
    iconRight: {
        marginLeft: spacing.s,
    },
    disabled: {
        opacity: 0.5,
    },
});
