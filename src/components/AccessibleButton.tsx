import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle } from 'react-native';
import AccessibleText from './AccessibleText';
import { colors, layout, spacing } from '../utils/theme';

interface AccessibleButtonProps extends TouchableOpacityProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: object;
}

export default function AccessibleButton({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    ...props
}: AccessibleButtonProps) {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'outline': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return colors.white;
            case 'secondary': return colors.white;
            case 'outline': return colors.primary;
            default: return colors.white;
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: variant === 'outline' ? colors.primary : 'transparent',
                    borderWidth: variant === 'outline' ? 2 : 0,
                },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={title}
            {...props}
        >
            <AccessibleText variant="h3" color={getTextColor()} style={[styles.text, textStyle]}>
                {title}
            </AccessibleText>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: layout.touchableHeight,
        borderRadius: layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        width: '100%',
        marginVertical: spacing.s,
    },
    text: {
        fontWeight: '600',
    },
});
