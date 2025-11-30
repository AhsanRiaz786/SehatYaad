import React, { useState } from 'react';
import {
    TextInput,
    View,
    StyleSheet,
    TextInputProps,
    Animated,
    ViewStyle,
} from 'react-native';
import AccessibleText from './AccessibleText';
import { colors, spacing, layout, typography } from '../utils/theme';

interface AccessibleInputProps extends TextInputProps {
    label: string;
    error?: string;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    containerStyle?: ViewStyle;
}

export default function AccessibleInput({
    label,
    error,
    icon,
    iconPosition = 'left',
    containerStyle,
    style,
    onFocus,
    onBlur,
    value,
    ...props
}: AccessibleInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [labelPosition] = useState(new Animated.Value(value ? 1 : 0));

    const handleFocus = (e: any) => {
        setIsFocused(true);
        Animated.timing(labelPosition, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (!value) {
            Animated.timing(labelPosition, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }
        onBlur?.(e);
    };

    const labelStyle = {
        top: labelPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
        }),
        fontSize: labelPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: error
            ? colors.semantic.error
            : isFocused
                ? colors.primary.purple
                : colors.neutral.gray600,
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Animated.Text style={[styles.label, labelStyle]}>
                {label}
            </Animated.Text>

            <View
                style={[
                    styles.inputContainer,
                    isFocused && styles.inputContainerFocused,
                    error && styles.inputContainerError,
                ]}
            >
                {icon && iconPosition === 'left' && (
                    <View style={styles.iconLeft}>{icon}</View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        icon && iconPosition === 'left' ? styles.inputWithLeftIcon : undefined,
                        icon && iconPosition === 'right' ? styles.inputWithRightIcon : undefined,
                        style,
                    ]}
                    placeholderTextColor={colors.neutral.gray500}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={value}
                    accessibilityLabel={label}
                    accessibilityHint={error}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <View style={styles.iconRight}>{icon}</View>
                )}
            </View>

            {error && (
                <AccessibleText
                    variant="small"
                    color={colors.semantic.error}
                    style={styles.errorText}
                >
                    {error}
                </AccessibleText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
    },
    label: {
        position: 'absolute',
        left: spacing.m,
        zIndex: 1,
        backgroundColor: colors.neutral.white,
        paddingHorizontal: 4,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.neutral.gray300,
        borderRadius: layout.borderRadius.medium,
        backgroundColor: colors.neutral.white,
        marginTop: 8,
        ...layout.shadow.small,
    },
    inputContainerFocused: {
        borderColor: colors.primary.purple,
        ...layout.shadow.medium,
    },
    inputContainerError: {
        borderColor: colors.semantic.error,
    },
    input: {
        flex: 1,
        height: layout.touchableHeight,
        paddingHorizontal: spacing.m,
        fontSize: typography.body.fontSize,
        color: colors.neutral.gray900,
    },
    inputWithLeftIcon: {
        paddingLeft: spacing.s,
    },
    inputWithRightIcon: {
        paddingRight: spacing.s,
    },
    iconLeft: {
        marginLeft: spacing.m,
    },
    iconRight: {
        marginRight: spacing.m,
    },
    errorText: {
        marginTop: spacing.xs,
        marginLeft: spacing.m,
    },
});
