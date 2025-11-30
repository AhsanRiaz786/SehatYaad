import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AccessibleText from '../components/AccessibleText';
import { colors, spacing } from '../utils/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const navigation = useNavigation<any>();
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo animation sequence
        Animated.sequence([
            // Scale in logo
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            // Fade in text
            Animated.timing(textOpacity, {
                toValue: 1,
                duration: 400,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();

        // Navigate after animation
        const timer = setTimeout(() => {
            navigation.replace('Main');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <LinearGradient
            colors={[colors.primary.teal, colors.primary.purple, colors.primary.pink]}
            locations={[0, 0.5, 1]}
            style={styles.container}
        >
            <View style={styles.content}>
                <Animated.View
                    style={[
                        styles.logoContainer,
                        {
                            opacity: logoOpacity,
                            transform: [{ scale: logoScale }],
                        },
                    ]}
                >
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </Animated.View>

                <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
                    <AccessibleText
                        variant="display"
                        color={colors.neutral.white}
                        style={styles.title}
                    >
                        SehatYaad
                    </AccessibleText>
                    <AccessibleText
                        variant="bodyLarge"
                        color={colors.neutral.white}
                        style={styles.subtitle}
                    >
                        Your Health Companion
                    </AccessibleText>
                </Animated.View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logoContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontWeight: '700',
        marginBottom: spacing.s,
        textAlign: 'center',
    },
    subtitle: {
        opacity: 0.9,
        textAlign: 'center',
    },
});
