export const colors = {
    primary: '#007AFF', // Accessible Blue
    secondary: '#5856D6', // Purple
    background: '#F2F2F7', // Light Gray
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C7C7CC',
    notification: '#FF3B30', // Red
    success: '#34C759', // Green
    warning: '#FF9500', // Orange
    error: '#FF3B30', // Red
    white: '#FFFFFF',
    black: '#000000',
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 18, fontWeight: '400' }, // Minimum 18sp for accessibility
    caption: { fontSize: 14, fontWeight: '400' },
};

export const layout = {
    borderRadius: 12,
    touchableHeight: 60, // Minimum 60px height for accessibility
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
};
