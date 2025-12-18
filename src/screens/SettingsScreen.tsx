import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { useTTS } from '../context/TTSContext';
import { useLanguage } from '../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AccessibleButton from '../components/AccessibleButton';
import AccessibleText from '../components/AccessibleText';
import AccessibleInput from '../components/AccessibleInput';
import Card from '../components/Card';
import { colors, spacing, layout } from '../utils/theme';
import { getCaregiverInfo, saveCaregiverInfo, CaregiverInfo } from '../services/caregiverService';
import { getSetting, updateSetting } from '../database/helpers';

type VoiceSpeed = 'slow' | 'medium' | 'fast';
type VoicePitch = 'low' | 'medium' | 'high';
type VoiceVolume = 'low' | 'medium' | 'high';

const VOICE_SPEED_MAP: Record<VoiceSpeed, number> = {
    slow: 0.75,
    medium: 1.0,
    fast: 1.5,
};

const VOICE_PITCH_MAP: Record<VoicePitch, number> = {
    low: 0.75,
    medium: 1.0,
    high: 1.25,
};

const VOICE_VOLUME_MAP: Record<VoiceVolume, number> = {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
};

export default function SettingsScreen() {
    const { enabled, setEnabled, rate, setRate, pitch: currentPitch, setPitch, volume: currentVolume, setVolume, speak } = useTTS();
    const { language, setLanguage } = useLanguage();

    // Voice Settings
    const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>('medium');
    const [voicePitch, setVoicePitch] = useState<VoicePitch>('medium');
    const [voiceVolume, setVoiceVolume] = useState<VoiceVolume>('high');

    // Caregiver Settings State
    const [caregiver, setCaregiver] = useState<CaregiverInfo>({
        name: '',
        phone: '',
        email: '',
        relationship: '',
        enabled: false,
        missThreshold: 3,
    });
    const [isSaving, setIsSaving] = useState(false);

    // Adaptive Reminders Settings
    const [adaptiveEnabled, setAdaptiveEnabled] = useState(true);
    const [prealertsEnabled, setPrealertsEnabled] = useState(true);

    useEffect(() => {
        loadCaregiverSettings();
        loadSettings();
        // Initialize voice settings from current values
        if (rate <= 0.85) {
            setVoiceSpeed('slow');
        } else if (rate <= 1.25) {
            setVoiceSpeed('medium');
        } else {
            setVoiceSpeed('fast');
        }

        if (currentPitch <= 0.85) {
            setVoicePitch('low');
        } else if (currentPitch <= 1.15) {
            setVoicePitch('medium');
        } else {
            setVoicePitch('high');
        }

        if (currentVolume <= 0.6) {
            setVoiceVolume('low');
        } else if (currentVolume <= 0.85) {
            setVoiceVolume('medium');
        } else {
            setVoiceVolume('high');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSpeedChange = (speed: VoiceSpeed) => {
        setVoiceSpeed(speed);
        setRate(VOICE_SPEED_MAP[speed]);
    };

    const handlePitchChange = (pitchValue: VoicePitch) => {
        setVoicePitch(pitchValue);
        setPitch(VOICE_PITCH_MAP[pitchValue]);
    };

    const handleVolumeChange = (vol: VoiceVolume) => {
        setVoiceVolume(vol);
        setVolume(VOICE_VOLUME_MAP[vol]);
    };

    const loadSettings = async () => {
        try {
            const adaptive = await getSetting('adaptive_enabled', 'true');
            const prealerts = await getSetting('prealerts_enabled', 'true');
            setAdaptiveEnabled(adaptive === 'true');
            setPrealertsEnabled(prealerts === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleAdaptiveToggle = async (value: boolean) => {
        setAdaptiveEnabled(value);
        await updateSetting('adaptive_enabled', value ? 'true' : 'false');
    };

    const handlePrealertsToggle = async (value: boolean) => {
        setPrealertsEnabled(value);
        await updateSetting('prealerts_enabled', value ? 'true' : 'false');
    };

    const loadCaregiverSettings = async () => {
        try {
            const info = await getCaregiverInfo();
            setCaregiver(info);
        } catch (error) {
            console.error('Error loading caregiver settings:', error);
        }
    };

    const handleSaveCaregiver = async () => {
        try {
            setIsSaving(true);
            await saveCaregiverInfo(caregiver);
            Alert.alert('Success', 'Caregiver settings saved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save caregiver settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLanguageChange = async (lang: 'en' | 'ur') => {
        try {
            await setLanguage(lang);
            Alert.alert('Success', 'Language changed. Please restart the app for changes to take effect.');
        } catch (error) {
            Alert.alert('Error', 'Failed to change language');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <LinearGradient
                colors={colors.gradients.primary as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Ionicons name="settings" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Settings
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={styles.headerSubtitle}>
                    Manage your preferences
                </AccessibleText>
            </LinearGradient>

            {/* Language Settings */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="language" size={24} color={colors.primary.forestGreen} />
                        </View>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            Language
                        </AccessibleText>
                    </View>
                </View>

                <View style={styles.languageRow}>
                    <TouchableOpacity
                        style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
                        onPress={() => handleLanguageChange('en')}
                        activeOpacity={0.7}
                    >
                        <AccessibleText
                            variant="body"
                            color={language === 'en' ? colors.neutral.white : colors.text.charcoal}
                            style={styles.languageText}
                        >
                            English
                        </AccessibleText>
                        {language === 'en' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.neutral.white} />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.languageOption, language === 'ur' && styles.languageOptionActive]}
                        onPress={() => handleLanguageChange('ur')}
                        activeOpacity={0.7}
                    >
                        <AccessibleText
                            variant="body"
                            color={language === 'ur' ? colors.neutral.white : colors.text.charcoal}
                            style={styles.languageText}
                        >
                            اردو
                        </AccessibleText>
                        {language === 'ur' && (
                            <Ionicons name="checkmark-circle" size={20} color={colors.neutral.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </Card>

            {/* Voice Feedback Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mic" size={24} color={colors.primary.orange} />
                        </View>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            Voice Feedback
                        </AccessibleText>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: colors.neutral.gray300, true: colors.primary.orange }}
                        thumbColor={colors.neutral.white}
                    />
                </View>

                {enabled && (
                    <View style={styles.voiceSettingsContent}>
                        <View style={styles.voiceSettingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.voiceSettingLabel}>
                                Speed
                            </AccessibleText>
                            <View style={styles.optionRow}>
                                {(['slow', 'medium', 'fast'] as VoiceSpeed[]).map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            voiceSpeed === option && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handleSpeedChange(option)}
                                        activeOpacity={0.7}
                                    >
                                        <AccessibleText
                                            variant="caption"
                                            color={voiceSpeed === option ? colors.neutral.white : colors.text.charcoal}
                                            style={styles.optionButtonText}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </AccessibleText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.voiceSettingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.voiceSettingLabel}>
                                Pitch
                            </AccessibleText>
                            <View style={styles.optionRow}>
                                {(['low', 'medium', 'high'] as VoicePitch[]).map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            voicePitch === option && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handlePitchChange(option)}
                                        activeOpacity={0.7}
                                    >
                                        <AccessibleText
                                            variant="caption"
                                            color={voicePitch === option ? colors.neutral.white : colors.text.charcoal}
                                            style={styles.optionButtonText}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </AccessibleText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.voiceSettingRow}>
                            <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.voiceSettingLabel}>
                                Volume
                            </AccessibleText>
                            <View style={styles.optionRow}>
                                {(['low', 'medium', 'high'] as VoiceVolume[]).map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            voiceVolume === option && styles.optionButtonActive,
                                        ]}
                                        onPress={() => handleVolumeChange(option)}
                                        activeOpacity={0.7}
                                    >
                                        <AccessibleText
                                            variant="caption"
                                            color={voiceVolume === option ? colors.neutral.white : colors.text.charcoal}
                                            style={styles.optionButtonText}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </AccessibleText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <AccessibleButton
                            title="Test Voice"
                            onPress={() => speak('This is a test of the voice settings.')}
                            variant="outline"
                            size="small"
                            icon={<Ionicons name="play-circle-outline" size={16} color={colors.primary.blue} />}
                            iconPosition="left"
                            style={styles.testButton}
                        />
                    </View>
                )}
            </Card>

            {/* Adaptive Reminders Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="bulb" size={24} color={colors.primary.orange} />
                        </View>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            Smart Reminders
                        </AccessibleText>
                    </View>
                </View>

                <View style={styles.switchRow}>
                    <View style={styles.switchRowContent}>
                        <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.switchLabel}>
                            Adaptive Scheduling
                        </AccessibleText>
                        <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.switchDescription}>
                            Automatically adjust reminder times based on your medication-taking patterns
                        </AccessibleText>
                    </View>
                    <Switch
                        value={adaptiveEnabled}
                        onValueChange={handleAdaptiveToggle}
                        trackColor={{ false: colors.neutral.gray300, true: colors.primary.orange }}
                        thumbColor={colors.neutral.white}
                    />
                </View>

                <View style={[styles.switchRow, styles.switchRowWithBorder]}>
                    <View style={styles.switchRowContent}>
                        <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.switchLabel}>
                            Pre-Alerts
                        </AccessibleText>
                        <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.switchDescription}>
                            Get advance reminders for medications you often miss or snooze
                        </AccessibleText>
                    </View>
                    <Switch
                        value={prealertsEnabled}
                        onValueChange={handlePrealertsToggle}
                        trackColor={{ false: colors.neutral.gray300, true: colors.primary.orange }}
                        thumbColor={colors.neutral.white}
                    />
                </View>
            </Card>

            {/* Caregiver Section */}
            <Card style={styles.section}>
                <View style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLeft}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="people" size={24} color={colors.primary.orange} />
                        </View>
                        <AccessibleText variant="h3" style={styles.sectionTitle}>
                            Caregiver Setup
                        </AccessibleText>
                    </View>
                    <Switch
                        value={caregiver.enabled}
                        onValueChange={(val: boolean) => setCaregiver(prev => ({ ...prev, enabled: val }))}
                        trackColor={{ false: colors.neutral.gray300, true: colors.primary.orange }}
                        thumbColor={colors.neutral.white}
                    />
                </View>

                <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.sectionDescription}>
                    Notifications will be sent to your caregiver if you miss doses consistently.
                </AccessibleText>

                {caregiver.enabled && (
                    <View style={styles.caregiverForm}>
                        <AccessibleInput
                            label="Caregiver Name"
                            value={caregiver.name}
                            onChangeText={(val: string) => setCaregiver(prev => ({ ...prev, name: val }))}
                            placeholder="e.g. Ali Khan"
                            icon={<Ionicons name="person-outline" size={20} color={colors.neutral.gray600} />}
                        />

                        <AccessibleInput
                            label="Phone Number"
                            value={caregiver.phone}
                            onChangeText={(val: string) => setCaregiver(prev => ({ ...prev, phone: val }))}
                            placeholder="e.g. +923001234567"
                            keyboardType="phone-pad"
                            icon={<Ionicons name="call-outline" size={20} color={colors.neutral.gray600} />}
                        />

                        <AccessibleInput
                            label="Email (Optional)"
                            value={caregiver.email}
                            onChangeText={(val: string) => setCaregiver(prev => ({ ...prev, email: val }))}
                            placeholder="e.g. caregiver@example.com"
                            keyboardType="email-address"
                            icon={<Ionicons name="mail-outline" size={20} color={colors.neutral.gray600} />}
                        />

                        <AccessibleInput
                            label="Relationship"
                            value={caregiver.relationship}
                            onChangeText={(val: string) => setCaregiver(prev => ({ ...prev, relationship: val }))}
                            placeholder="e.g. Son, Daughter, Spouse"
                            icon={<Ionicons name="heart-outline" size={20} color={colors.neutral.gray600} />}
                        />

                        <View style={styles.missThresholdRow}>
                            <View style={styles.missThresholdLabel}>
                                <AccessibleText variant="body" color={colors.neutral.gray700} style={styles.missThresholdLabelText}>
                                    Alert Threshold
                                </AccessibleText>
                                <AccessibleText variant="caption" color={colors.neutral.gray600}>
                                    Alert after {caregiver.missThreshold} missed {caregiver.missThreshold === 1 ? 'dose' : 'doses'}
                                </AccessibleText>
                            </View>
                            <View style={styles.missThresholdControls}>
                                <TouchableOpacity
                                    style={[
                                        styles.missThresholdButton,
                                        caregiver.missThreshold > 1 && styles.missThresholdButtonActive,
                                    ]}
                                    onPress={() => setCaregiver(prev => ({ ...prev, missThreshold: Math.max(1, prev.missThreshold - 1) }))}
                                    disabled={caregiver.missThreshold <= 1}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={20}
                                        color={caregiver.missThreshold > 1 ? colors.neutral.white : colors.neutral.gray400}
                                    />
                                </TouchableOpacity>
                                <View style={styles.missThresholdValue}>
                                    <AccessibleText variant="body" color={colors.text.charcoal} style={styles.missThresholdText}>
                                        {caregiver.missThreshold}
                                    </AccessibleText>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.missThresholdButton,
                                        caregiver.missThreshold < 10 && styles.missThresholdButtonActive,
                                    ]}
                                    onPress={() => setCaregiver(prev => ({ ...prev, missThreshold: Math.min(10, prev.missThreshold + 1) }))}
                                    disabled={caregiver.missThreshold >= 10}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="add"
                                        size={20}
                                        color={caregiver.missThreshold < 10 ? colors.neutral.white : colors.neutral.gray400}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <AccessibleButton
                            title={isSaving ? 'Saving...' : 'Save Settings'}
                            onPress={handleSaveCaregiver}
                            variant="primary"
                            size="small"
                            disabled={isSaving}
                            icon={<Ionicons name="save-outline" size={16} color={colors.neutral.white} />}
                            style={styles.saveButton}
                        />
                    </View>
                )}
            </Card>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.cream,
    },
    content: {
        paddingBottom: spacing.xxl,
    },
    header: {
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    headerTitle: {
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    headerSubtitle: {
        opacity: 0.9,
    },
    section: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: layout.borderRadius.small,
        backgroundColor: colors.neutral.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    sectionTitle: {
        flex: 1,
    },
    sectionDescription: {
        marginBottom: spacing.m,
        lineHeight: 20,
    },
    languageRow: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    languageOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
        borderRadius: layout.borderRadius.medium,
        backgroundColor: colors.neutral.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    languageOptionActive: {
        backgroundColor: colors.primary.forestGreen,
        borderColor: colors.primary.forestGreen,
    },
    languageText: {
        fontWeight: '600',
    },
    voiceSettingsContent: {
        paddingTop: spacing.s,
    },
    voiceSettingRow: {
        marginBottom: spacing.l,
    },
    voiceSettingLabel: {
        fontWeight: '600',
        marginBottom: spacing.s,
    },
    optionRow: {
        flexDirection: 'row',
        gap: spacing.s,
    },
    optionButton: {
        flex: 1,
        paddingVertical: spacing.m,
        paddingHorizontal: spacing.s,
        borderRadius: layout.borderRadius.small,
        backgroundColor: colors.neutral.gray100,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionButtonActive: {
        backgroundColor: colors.primary.forestGreen,
        borderColor: colors.primary.forestGreen,
    },
    optionButtonText: {
        fontWeight: '600',
    },
    testButton: {
        marginTop: spacing.s,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: spacing.m,
    },
    switchRowWithBorder: {
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
        paddingTop: spacing.m,
        marginTop: spacing.s,
    },
    switchRowContent: {
        flex: 1,
        marginRight: spacing.m,
    },
    switchLabel: {
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    switchDescription: {
        lineHeight: 20,
    },
    caregiverForm: {
        marginTop: spacing.s,
    },
    missThresholdRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.m,
        paddingVertical: spacing.m,
        paddingTop: spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.gray200,
    },
    missThresholdLabel: {
        flex: 1,
    },
    missThresholdLabelText: {
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    missThresholdControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    missThresholdButton: {
        width: 40,
        height: 40,
        borderRadius: layout.borderRadius.small,
        backgroundColor: colors.primary.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    missThresholdButtonActive: {
        opacity: 1,
    },
    missThresholdValue: {
        minWidth: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    missThresholdText: {
        fontWeight: '700',
        fontSize: 18,
    },
    saveButton: {
        marginTop: spacing.m,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.gray200,
    },
    infoRowLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    infoValue: {
        fontWeight: '600',
        color: colors.text.charcoal,
    },
    aboutText: {
        lineHeight: 24,
        marginBottom: spacing.m,
    },
    copyright: {
        textAlign: 'center',
        marginTop: spacing.s,
    },
});
