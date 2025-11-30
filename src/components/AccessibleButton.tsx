import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout, typography, animation } from '../utils/theme';

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
    const getGradientColors = () => {
        switch (variant) {
            case 'primary':
                return colors.gradients.primary;
            case 'success':
                return colors.gradients.success;
            case 'danger':
                return colors.gradients.danger;
            default:
                return colors.gradients.primary;
        }
    };

    const getHeight = () => {
        switch (size) {
            case 'small':
                return layout.touchableHeightSmall;
            case 'large':
                return layout.touchableHeightLarge;
            default:
                return layout.touchableHeight;
        }
    };

    const isOutlineVariant = variant === 'secondary' || variant === 'ghost' || variant === 'outline';

    const buttonContent = (
        <>
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={isOutlineVariant ? colors.primary.purple : colors.neutral.white}
                />
            ) : (
                <View style={styles.contentContainer}>
                    {icon && iconPosition === 'left' && (
                        <View style={styles.iconLeft}>{icon}</View>
                    )}
                    <AccessibleText
                        variant="button"
                        color={isOutlineVariant ? colors.primary.purple : colors.neutral.white}
                        style={[styles.text, textStyle]}
                    >
                        {title}
                    </AccessibleText>
                    {icon && iconPosition === 'right' && (
                        <View style={styles.iconRight}>{icon}</View>
                    )}
                </View>
            )}
        </>
    );

    if (isOutlineVariant) {
        // Outline or Ghost button - no gradient background
        return (
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        height: getHeight(),
                        borderWidth: variant === 'secondary' ? 2 : 0,
                        borderColor: colors.primary.purple,
                        backgroundColor: variant === 'ghost' ? 'transparent' : colors.neutral.white,
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

    // Gradient button (primary, success, danger)
    return (
        <TouchableOpacity
            style={[
                styles.button,
                { height: getHeight() },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={title}
            disabled={disabled || loading}
            {...props}
        >
            <LinearGradient
                colors={getGradientColors() as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {buttonContent}
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: layout.borderRadius.medium,
        width: '100%',
        marginVertical: spacing.s,
        overflow: 'hidden',
        ...layout.shadow.medium,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.l,
    },
    contentContainer: {
        flexDirection: 'row',
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
