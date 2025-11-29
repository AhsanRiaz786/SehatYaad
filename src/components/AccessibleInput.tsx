import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, ViewStyle } from 'react-native';
import AccessibleText from './AccessibleText';
import { colors, layout, spacing, typography } from '../utils/theme';

interface AccessibleInputProps extends TextInputProps {
    label: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export default function AccessibleInput({
    label,
    error,
    containerStyle,
    style,
    ...props
}: AccessibleInputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            <AccessibleText variant="body" style={styles.label}>{label}</AccessibleText>
            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && (
                <AccessibleText variant="caption" color={colors.error} style={styles.errorText}>
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
        marginBottom: spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: layout.borderRadius,
        padding: spacing.m,
        fontSize: typography.body.fontSize,
        color: colors.text,
        minHeight: layout.touchableHeight,
    },
    inputError: {
        borderColor: colors.error,
    },
    errorText: {
        marginTop: spacing.xs,
    },
});
