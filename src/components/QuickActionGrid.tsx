import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icon'; // Use our custom Icon wrapper
import AccessibleText from './AccessibleText';
import { colors, layout, spacing, animation } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

const QuickActionGrid = () => {
    const navigation = useNavigation<any>();
    const { t, language } = useLanguage();

    const handlePressIn = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: animation.scale.pressed,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const ActionButton = ({
        icon,
        label,
        color,
        onPress,
        variant = 'standard'
    }: {
        icon: string,
        label: string,
        color: string,
        onPress: () => void,
        variant?: 'hero' | 'standard'
    }) => {
        const scaleAnim = React.useRef(new Animated.Value(1)).current;

        const isHero = variant === 'hero';

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => handlePressIn(scaleAnim)}
                onPressOut={() => handlePressOut(scaleAnim)}
                onPress={onPress}
                style={[
                    styles.actionWrapper,
                    isHero ? styles.heroWrapper : styles.standardWrapper
                ]}
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                <Animated.View style={[
                    styles.cardBase,
                    isHero ? styles.heroCard : styles.standardCard,
                    { transform: [{ scale: scaleAnim }], backgroundColor: isHero ? color : colors.background.paper }
                ]}>
                    <View style={[
                        styles.iconContainer,
                        isHero ? { backgroundColor: 'rgba(255,255,255,0.2)' } : { backgroundColor: `${color}15` }
                    ]}>
                        <Icon // Using Custom Icon component
                            name={icon}
                            size={isHero ? 32 : 24}
                            color={isHero ? colors.text.inverse : color}
                        />
                    </View>
                    <AccessibleText
                        variant={isHero ? "h3" : "button"}
                        style={[
                            styles.label,
                            { color: isHero ? colors.text.inverse : colors.text.primary }
                        ]}
                    >
                        {label}
                    </AccessibleText>
                    {isHero && (
                        <AccessibleText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                            {language === 'ur' ? 'نسخہ اسکرین کریں' : 'Scan & Extract'}
                        </AccessibleText>
                    )}
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Hero Action: Camera/Scan */}
            <ActionButton
                icon="camera"
                label={t('home.scanPrescription') || "Scan Prescription"}
                color={colors.primary.main}
                variant="hero"
                onPress={() => navigation.navigate('Camera')}
            />

            <View style={styles.secondaryRow}>
                {/* Secondary: Voice Input */}
                <ActionButton
                    icon="mic"
                    label={t('home.voiceInput') || "Voice Input"}
                    color={colors.secondary.main}
                    onPress={() => {
                        navigation.navigate('AddMedication', { autoStartVoice: true });
                    }}
                />

                {/* Secondary: Manual Add */}
                <ActionButton
                    icon="plus" // Changed from add-circle to plus for consistency with Icon mappings
                    label={t('home.addManual') || "Add Manually"}
                    color={colors.timeBlock.morning}
                    onPress={() => navigation.navigate('AddMedication')}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.m,
        marginBottom: spacing.l,
        gap: spacing.m,
    },
    secondaryRow: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    actionWrapper: {
        flex: 1,
    },
    heroWrapper: {
        width: '100%',
    },
    standardWrapper: {
        flex: 1,
    },
    cardBase: {
        borderRadius: layout.borderRadius.large,
        padding: spacing.m,
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadows.soft,
    },
    heroCard: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: spacing.l,
        height: 120, // Prominent height
    },
    standardCard: {
        height: 100,
        backgroundColor: colors.background.paper,
    },
    iconContainer: {
        padding: spacing.s,
        borderRadius: layout.borderRadius.full,
        marginBottom: spacing.s,
    },
    label: {
        textAlign: 'center',
        fontWeight: '600',
    }
});

export default QuickActionGrid;
