import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import AccessibleText from './AccessibleText';
import { colors } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

interface IconProps {
    name: keyof typeof LucideIcons | string;
    size?: number;
    color?: string;
    active?: boolean; // Filled for active, outlined for inactive
    label?: {
        en: string;
        ur: string;
    };
    style?: ViewStyle;
}

// Icon name mappings for specific requirements
const iconMappings: Record<string, keyof typeof LucideIcons> = {
    // Water reminder - traditional glass (not disposable cup)
    'water': 'GlassWater',
    'water-glass': 'GlassWater',
    'glass': 'GlassWater',

    // Morning - Fajr context (sunrise/prayer)
    'morning': 'Sunrise',
    'fajr': 'Sunrise',
    'sunrise': 'Sunrise',

    // Evening - Maghrib context (sunset/prayer)
    'evening': 'Sunset',
    'maghrib': 'Sunset',
    'sunset': 'Sunset',

    // Night
    'night': 'Moon',
    'moon': 'Moon',

    // Noon
    'noon': 'Sun',
    'sun': 'Sun',
    'sunny': 'Sun',

    // Caregiver - Family icon (multiple people, not single user)
    'caregiver': 'Users',
    'family': 'Users',
    'users': 'Users',
    'user': 'User', // Single user fallback

    // Common actions
    'checkmark': 'Check',
    'check': 'CheckCircle',
    'checkmark-circle': 'CheckCircle',
    'close': 'XCircle',
    'close-circle': 'XCircle',
    'x': 'X',
    'add': 'PlusCircle',
    'plus': 'PlusCircle',
    'calendar': 'Calendar',
    'time': 'Clock',
    'camera': 'Camera',
    'mic': 'Mic',
    'voice': 'Mic',
    'bulb': 'Lightbulb',
    'lightbulb': 'Lightbulb',
    'settings': 'Settings',
    'home': 'Home',
    'insights': 'BarChart',
    'bar-chart': 'BarChart',
    'history': 'History',
    'notification': 'Bell',
    'notifications': 'Bell',
    'remove-circle': 'MinusCircle',
    'skip': 'SkipForward',
    'help-circle': 'HelpCircle',
    'alarm': 'AlarmClock',
    'clock': 'Clock',

    // New additions for meaningful icons
    'cloud-sun': 'CloudSun',
    'cloud-moon': 'CloudMoon',
    'hourglass': 'Hourglass',
    'alert-circle': 'AlertCircle',
    'slash': 'Slash',
};

export default function Icon({
    name,
    size = 24,
    color,
    active = false,
    label,
    style,
}: IconProps) {
    const { language } = useLanguage();

    // Map icon name to Lucide icon name (case-insensitive)
    const normalizedName = name.toLowerCase();
    const iconName = iconMappings[normalizedName] || (name.charAt(0).toUpperCase() + name.slice(1)) as keyof typeof LucideIcons;

    // Get the icon component - try mapped name first, then original name
    let IconComponent = LucideIcons[iconName] as React.ComponentType<{
        size?: number;
        color?: string;
        strokeWidth?: number;
        fill?: string;
    }>;

    // If not found, try the original name with proper casing
    if (!IconComponent) {
        const pascalCaseName = name.split(/[-_]/).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('') as keyof typeof LucideIcons;
        IconComponent = LucideIcons[pascalCaseName] as React.ComponentType<{
            size?: number;
            color?: string;
            strokeWidth?: number;
            fill?: string;
        }>;
    }

    if (!IconComponent) {
        console.warn(`Icon "${name}" (mapped to "${iconName}") not found in Lucide`);
        // Return a placeholder
        IconComponent = LucideIcons.Circle as React.ComponentType<{
            size?: number;
            color?: string;
            strokeWidth?: number;
            fill?: string;
        }>;
    }

    // Determine colors - high contrast
    const iconColor = color || '#1A1A1A';
    const fillColor = active ? iconColor : 'none';
    const strokeWidth = 2.5; // For elderly visibility

    return (
        <View style={[styles.container, style]}>
            <IconComponent
                size={size}
                color={iconColor}
                strokeWidth={strokeWidth}
                fill={fillColor}
            />
            {label && (
                <AccessibleText
                    variant="small"
                    color={colors.text.primary}
                    style={styles.label}
                >
                    {language === 'ur' ? label.ur : label.en}
                </AccessibleText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
});

