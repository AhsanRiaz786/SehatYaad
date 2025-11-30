// Modern Theme System for SehatYaad
// Vibrant, contemporary design with gradients and premium feel

export const colors = {
    // Primary Brand Colors
    primary: {
        teal: '#00B4D8',
        purple: '#7209B7',
        pink: '#FF006E',
        orange: '#FF9E00',
    },

    // Gradient Definitions (for use with LinearGradient)
    gradients: {
        primary: ['#00B4D8', '#7209B7'], // Teal to Purple
        sunset: ['#FF9E00', '#FF006E'],  // Orange to Pink
        calm: ['#00B4D8', '#90E0EF'],    // Teal to Light Blue
        vibrant: ['#7209B7', '#FF006E'], // Purple to Pink
        success: ['#10B981', '#34D399'], // Green gradient
        danger: ['#EF4444', '#F87171'],  // Red gradient
    },

    // Neutral Palette
    neutral: {
        white: '#FFFFFF',
        gray100: '#F8F9FA',
        gray200: '#E9ECEF',
        gray300: '#DEE2E6',
        gray400: '#CED4DA',
        gray500: '#ADB5BD',
        gray600: '#6C757D',
        gray700: '#495057',
        gray800: '#343A40',
        gray900: '#212529',
        black: '#000000',
    },

    // Semantic Colors
    semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },

    // Legacy support (mapped to new system)
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    notification: '#EF4444',
    white: '#FFFFFF',
    black: '#212529',
};

export const typography = {
    // Display (for hero sections)
    display: {
        fontSize: 36,
        fontWeight: '700' as const,
        lineHeight: 44,
        letterSpacing: -0.5,
    },

    // Headings
    h1: {
        fontSize: 28,
        fontWeight: '700' as const,
        lineHeight: 36,
        letterSpacing: -0.3,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        lineHeight: 32,
        letterSpacing: -0.2,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },

    // Body Text
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
        letterSpacing: 0,
    },
    bodyLarge: {
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },

    // Small Text
    caption: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
        letterSpacing: 0,
    },
    small: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
        letterSpacing: 0,
    },

    // Button text
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0.5,
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

    // Touch Targets
    touchableHeight: 56,
    touchableHeightSmall: 44,
    touchableHeightLarge: 64,

    // Card Styling
    cardPadding: 20,
    cardMargin: 16,

    // Shadow Presets
    shadow: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        medium: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        large: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        colored: {
            shadowColor: '#7209B7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
        },
    },
};

// Animation Durations
export const animation = {
    fast: 200,
    normal: 300,
    slow: 500,
};

// Helper function to create gradient angle
export const gradientConfig = {
    primary: {
        colors: colors.gradients.primary,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    sunset: {
        colors: colors.gradients.sunset,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    calm: {
        colors: colors.gradients.calm,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
    vibrant: {
        colors: colors.gradients.vibrant,
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
    },
};

export default {
    colors,
    typography,
    spacing,
    layout,
    animation,
    gradientConfig,
};
