// Healthcare Trust Theme System for SehatYaad
// Refactored Design System: Soft Medical Aesthetic
// Focus: Accessibility, Trust, Calmness

const palette = {
    // Primary Brand Colors (Forest Green - Trust)
    primary: {
        main: '#047857', // emerald-700
        light: '#10B981', // emerald-500
        dark: '#064E3B', // emerald-900
        contrastText: '#FFFFFF',
        // Legacy aliases
        forestGreen: '#047857',
        purple: '#7C3AED',
    },
    gradients: {
        primary: ['#047857', '#064E3B'],
        secondary: ['#0EA5E9', '#0369A1'],
    },
    // Secondary Brand Colors (Soft Blue - Calm)
    secondary: {
        main: '#0EA5E9', // sky-500
        light: '#38BDF8', // sky-400
        dark: '#0369A1', // sky-700
        contrastText: '#FFFFFF',
    },
    // Backgrounds (Cream/Off-White - Reduced Stain)
    background: {
        default: '#FAFAF9', // warm gray 50
        paper: '#FFFFFF',
        subtle: '#F5F5F4', // warm gray 100
        overlay: 'rgba(0,0,0,0.5)',
        // Legacy aliases
        cream: '#FAFAF9',
        white: '#FFFFFF',
    },
    // Text Colors (High Contrast)
    text: {
        primary: '#1C1917', // warm gray 900
        secondary: '#44403C', // warm gray 700
        tertiary: '#78716C', // warm gray 500
        disabled: '#A8A29E', // warm gray 400
        inverse: '#FFFFFF',
        // Legacy aliases
        charcoal: '#1C1917',
    },
    // Status Colors
    status: {
        success: { main: '#059669', bg: '#DCFCE7', text: '#166534' }, // Green
        warning: { main: '#D97706', bg: '#FEF3C7', text: '#92400E' }, // Amber
        error: { main: '#DC2626', bg: '#FEE2E2', text: '#991B1B' }, // Red
        info: { main: '#2563EB', bg: '#DBEAFE', text: '#1E40AF' }, // Blue
    },
    // Action Colors
    action: {
        active: '#047857',
        hover: 'rgba(4, 120, 87, 0.08)',
        selected: 'rgba(4, 120, 87, 0.16)',
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: 'rgba(0, 0, 0, 0.12)',
    }
};

export const colors = {
    ...palette,
    // Maintaining minimal backward compatibility for 'neutral' where absolutely necessary
    // checking logic during refactor
    neutral: {
        white: '#FFFFFF',
        gray100: '#F5F5F4',
        gray200: '#E7E5E4',
        gray300: '#D6D3D1',
        gray400: '#A8A29E',
        gray500: '#78716C',
        gray600: '#57534E',
        gray700: '#44403C',
        gray800: '#292524',
        gray900: '#1C1917',
    },
    // Legacy support for semantic colors
    semantic: {
        success: palette.status.success.main,
        warning: palette.status.warning.main,
        error: palette.status.error.main,
        info: palette.status.info.main,
    },
    // Time-based semantic colors
    timeBlock: {
        morning: '#F59E0B', // Amber
        noon: '#F97316', // Orange
        evening: '#7C3AED', // Violet
        night: '#1E40AF', // Indigo
    },
    // Border colors
    border: {
        primary: '#E7E5E4', // gray200
        secondary: '#F5F5F4', // gray100
        default: '#D6D3D1', // gray300
    }
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
    gutter: 16, // Standard horizontal padding
};

export const typography = {
    // Font Families handled via expo-font loading in App.tsx
    // Using system fonts as fallback
    families: {
        urdu: 'NotoNastaliqUrdu',
        english: 'System',
    },
    // Heading Styles
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
        letterSpacing: 0,
    },
    h3: {
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
        letterSpacing: 0,
    },
    // Body Styles
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    display: {
        fontSize: 36,
        fontWeight: '700' as const,
        lineHeight: 44,
    },
    small: {
        fontSize: 12,
        fontWeight: '400' as const,
        lineHeight: 16,
    },
    bodyLarge: {
        fontSize: 18,
        fontWeight: '400' as const,
        lineHeight: 28,
    },
    bodySmall: {
        fontSize: 14,
        fontWeight: '400' as const,
        lineHeight: 20,
    },
    // Initial/Button/Caption
    button: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        letterSpacing: 0.5,
        textTransform: 'none' as const, // Clearer readability
    },
    caption: {
        fontSize: 12,
        fontWeight: '500' as const,
        lineHeight: 16,
        color: palette.text.tertiary,
    },
};

export const layout = {
    borderRadius: {
        small: 8,
        medium: 12,
        large: 20, // More rounded, friendly look
        xlarge: 28,
        full: 9999,
    },
    // Shadows - moving to soft colored shadows for modern feel
    shadows: {
        none: {
            shadowColor: 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0,
            shadowRadius: 0,
            elevation: 0,
        },
        soft: {
            shadowColor: palette.primary.dark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 3, // Android
        },
        medium: {
            shadowColor: palette.primary.dark,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
            elevation: 6, // Android
        },
        hard: { // For floating buttons
            shadowColor: palette.primary.dark,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
        },
    },
    touchTargets: {
        minHeight: 48, // Minimum touchable height
    },
    // Legacy support for shadows (many components use layout.shadow.small)
    shadow: {
        small: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
        },
        none: {},
    },
    // Legacy support for touchableHeight
    touchableHeight: 56,
    touchableHeightSmall: 44,
    touchableHeightLarge: 64,
    border: {
        default: {
            borderWidth: 1,
            borderColor: '#D6D3D1',
        },
    },
    cardPadding: 16,
    cardMargin: 16,
};

export const animation = {
    scale: {
        pressed: 0.96,
    },
    duration: {
        short: 200,
        medium: 300,
    }
};

export default {
    colors,
    spacing,
    typography,
    layout,
    animation,
};
