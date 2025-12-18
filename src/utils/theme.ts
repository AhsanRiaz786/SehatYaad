// Healthcare Trust Theme System for SehatYaad
// Elder-first design with high contrast and cultural sensitivity

// Define primary colors first
const primaryColors = {
    forestGreen: '#064E3B', // Deep Forest Green for primary actions
    forestGreenLight: '#065F46',
    forestGreenDark: '#022C22',
    // Legacy aliases for backward compatibility
    teal: '#00B4D8',
    purple: '#064E3B', // Map purple to forest green
    pink: '#FF006E',
    orange: '#F59E0B',
    blue: '#3B82F6',
};

export const colors = {
    // Healthcare Trust Palette
    primary: primaryColors,

    // Background Colors
    background: {
        cream: '#FDFBF7', // Soft Cream for backgrounds
        white: '#FFFFFF',
    },

    // Text Colors
    text: {
        charcoal: '#1F2937', // High-contrast Charcoal for text
        charcoalLight: '#4B5563',
        charcoalDark: '#111827',
    },

    // Border Colors
    border: {
        gray: '#D1D5DB', // 1px borders instead of shadows
        grayLight: '#E5E7EB',
        grayDark: '#9CA3AF',
    },

    // Semantic Colors (for status indicators)
    semantic: {
        success: '#059669', // Green for taken doses
        warning: '#D97706', // Amber for pending
        error: '#DC2626', // Red for missed
        info: '#0284C7', // Blue for information
    },

    // Time Block Colors (subtle, no gradients)
    timeBlock: {
        morning: '#F59E0B', // Amber for morning
        noon: '#F97316', // Orange for noon
        evening: '#7C3AED', // Purple for evening
        night: '#1E40AF', // Deep blue for night
    },

    // Legacy support (mapped to new system for backward compatibility)
    neutral: {
        white: '#FFFFFF',
        gray100: '#FDFBF7',
        gray200: '#F3F4F6',
        gray300: '#E5E7EB',
        gray400: '#D1D5DB',
        gray500: '#9CA3AF',
        gray600: '#4B5563',
        gray700: '#374151',
        gray800: '#1F2937',
        gray900: '#111827',
        black: '#000000',
    },
    card: '#FFFFFF',
    textSecondary: '#4B5563',
    notification: '#DC2626',
    white: '#FFFFFF',
    black: '#1F2937',
    
    // Legacy color aliases for backward compatibility (will be deprecated)
    gradients: {
        primary: ['#064E3B', '#022C22'], // Forest green gradient
        sunset: ['#FF9E00', '#FF006E'],
        calm: ['#00B4D8', '#90E0EF'],
        vibrant: ['#7209B7', '#FF006E'],
        success: ['#059669', '#34D399'],
        danger: ['#DC2626', '#F87171'],
    },
};

// Typography System with Urdu Support
// Noto Nastaliq Urdu for headers, Naskh-style for body, Inter for English

export const typography = {
    // Display (for hero sections) - Noto Nastaliq Urdu
    display: {
        fontSize: 36,
        fontWeight: '700' as const,
        lineHeight: 48,
        letterSpacing: 0,
        fontFamily: 'NotoNastaliqUrdu', // Will be loaded via expo-font
    },

    // Headings - Noto Nastaliq Urdu for Urdu, Inter for English
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 38,
        letterSpacing: 0,
        fontFamily: 'NotoNastaliqUrdu',
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: 0,
        fontFamily: 'NotoNastaliqUrdu',
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0,
        fontFamily: 'NotoNastaliqUrdu',
    },

    // Body Text - Naskh-style for Urdu (better readability at small sizes), Inter for English
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0,
        fontFamily: 'System', // Will be set based on language context
    },
    bodyLarge: {
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 28,
        letterSpacing: 0,
        fontFamily: 'System',
    },

    // Small Text
    caption: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: 0,
        fontFamily: 'System',
    },
    small: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0,
        fontFamily: 'System',
    },

    // Button text - Inter for English, Naskh-style for Urdu
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0.3,
        fontFamily: 'System',
    },
};

// Font families mapping
export const fonts = {
    urdu: {
        display: 'NotoNastaliqUrdu',
        body: 'System', // Naskh-style will be handled via font loading
    },
    english: {
        display: 'Inter',
        body: 'Inter',
    },
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
};

export const layout = {
    // Border Radius
    borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
        xlarge: 24,
        full: 9999,
    },

    // Touch Targets - Fitts's Law: Minimum 56px height for primary buttons
    touchableHeight: 56, // Minimum for primary actions
    touchableHeightSmall: 44,
    touchableHeightLarge: 64,

    // Card Styling
    cardPadding: 20,
    cardMargin: 16,

    // Border Presets (replacing shadows with 1px borders)
    border: {
        default: {
            borderWidth: 1,
            borderColor: colors.border.gray,
        },
        thick: {
            borderWidth: 2,
            borderColor: colors.border.grayDark,
        },
    },

    // Legacy shadow support (for gradual migration)
    shadow: {
        none: {}, // No shadows - use borders instead
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
    },
};

// Animation Durations
export const animation = {
    fast: 200,
    normal: 300,
    slow: 500,
};

export default {
    colors,
    typography,
    spacing,
    layout,
    animation,
    fonts,
};
