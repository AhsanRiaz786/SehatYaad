import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AccessibleText from '../components/AccessibleText';
import AccessibleInput from '../components/AccessibleInput';
import AccessibleButton from '../components/AccessibleButton';
import Card from '../components/Card';
import TimePicker from '../components/TimePicker';
import { addMedication } from '../database/helpers';
import { colors, spacing, layout } from '../utils/theme';
import { requestPermissions, scheduleMedicationNotifications } from '../services/notificationService';
import { useTTS } from '../context/TTSContext';
import { voiceInputService } from '../services/voiceInputService';
import { extractPrescriptionFromText } from '../services/prescriptionExtractor';

const FREQUENCIES = ['Daily', 'Twice Daily', 'Thrice Daily', 'Custom'];
const COLORS = [
    { name: 'Red', value: '#FF5733' },
    { name: 'Green', value: '#33FF57' },
    { name: 'Blue', value: '#3357FF' },
    { name: 'Purple', value: '#7209B7' },
    { name: 'Orange', value: '#FF9E00' },
    { name: 'Pink', value: '#FF006E' },
];

const NOTIFICATION_SOUNDS = [
    { name: 'Default', value: 'default' },
    { name: 'Gentle Bell', value: 'gentle_bell' },
    { name: 'Soft Chime', value: 'soft_chime' },
    { name: 'Alert', value: 'alert' },
];

export default function AddMedicationScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState(FREQUENCIES[0]);
    const [customTimes, setCustomTimes] = useState<string[]>(['09:00']);
    const [notes, setNotes] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[3].value); // Purple default
    const [selectedSound, setSelectedSound] = useState(NOTIFICATION_SOUNDS[0].value);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [isProcessingVoice, setIsProcessingVoice] = useState(false);
    const [extractedTimes, setExtractedTimes] = useState<string[] | null>(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);
    const { speak } = useTTS();

    // Cleanup voice service on unmount
    useEffect(() => {
        return () => {
            voiceInputService.destroy();
            if (pulseAnimation.current) {
                pulseAnimation.current.stop();
            }
        };
    }, []);

    const getTimesForFrequency = (freq: string): string[] => {
        if (freq === 'Custom') return customTimes;
        // If we have extracted times, use them; otherwise use defaults
        if (extractedTimes && extractedTimes.length > 0) {
            return extractedTimes;
        }
        switch (freq) {
            case 'Daily': return ['09:00'];
            case 'Twice Daily': return ['09:00', '21:00'];
            case 'Thrice Daily': return ['09:00', '14:00', '21:00'];
            default: return ['09:00'];
        }
    };

    const handleFrequencyChange = (freq: string) => {
        setFrequency(freq);
        if (freq === 'Custom' && customTimes.length === 0) {
            setCustomTimes(['09:00']);
        }
    };

    const addCustomTime = () => {
        setCustomTimes([...customTimes, '09:00']);
    };

    const removeCustomTime = (index: number) => {
        if (customTimes.length > 1) {
            setCustomTimes(customTimes.filter((_, i) => i !== index));
        }
    };

    const updateCustomTime = (index: number, time: string) => {
        const newTimes = [...customTimes];
        newTimes[index] = time;
        setCustomTimes(newTimes);
    };

    // Voice input handlers
    const handleStartVoiceInput = async () => {
        try {
            // Check if voice recognition is available
            const isAvailable = await voiceInputService.checkAvailability();
            if (!isAvailable) {
                Alert.alert(
                    'Voice Recognition Not Available',
                    'Speech recognition is not available on this device.',
                    [{ text: 'OK' }]
                );
                speak("Voice recognition is not available on this device");
                return;
            }

            setIsListening(true);
            setVoiceText('');
            
            // Start pulse animation
            pulseAnimation.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.current.start();

            // Speak the prompt BEFORE starting listening, and wait for it to complete
            console.log('🔊 Speaking prompt...');
            await speak("I'm listening. Please tell me about your medication.");
            
            // Small delay after TTS completes to ensure audio is fully stopped
            console.log('⏳ Waiting for audio to clear...');
            await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
            
            console.log('🎤 Starting voice recognition after TTS...');
            await voiceInputService.startListening(
                (result) => {
                    console.log('🎤 Voice result received:', result);
                    
                    // Filter out the TTS prompt if it's accidentally picked up (for both partial and final)
                    const promptWords = ["please", "tell", "me", "about", "your", "medication", "listening"];
                    const resultLower = result.text.toLowerCase().trim();
                    const resultWords = resultLower.split(/\s+/);
                    
                    // Check if the result is primarily composed of prompt words
                    const promptWordCount = resultWords.filter(word => promptWords.includes(word)).length;
                    const isPromptEcho = promptWordCount >= Math.min(3, resultWords.length) && resultWords.length <= 8;
                    
                    if (isPromptEcho) {
                        console.log('🎤 Ignoring TTS prompt echo:', result.text);
                        return; // Don't update state or process
                    }
                    
                    // Only update state and process if it's NOT a prompt echo
                    setVoiceText(result.text);
                    if (result.isFinal && result.text.trim()) {
                        console.log('✅ Final result received, auto-stopping...');
                        // Stop listening and process text directly (don't rely on state)
                        handleStopVoiceInput(result.text);
                    }
                },
                (error) => {
                    console.error('Voice input error:', error);
                    const errorStr = error.toString().toLowerCase();
                    const errorCode = errorStr.match(/code[":\s]*"?(\d+)/)?.[1] || '';
                    
                    // Error 7: No match - this is normal when no speech is detected yet
                    // Error 11: Recognition service didn't understand - also transient
                    // Don't stop listening or show alert for these transient errors
                    if (errorCode === '7' || errorStr.includes('no match')) {
                        console.log('🎤 No speech detected yet (error 7), continuing to listen...');
                        // Don't do anything - just continue listening
                        return;
                    }
                    
                    if (errorCode === '11' || errorStr.includes("didn't understand")) {
                        console.log('🎤 Recognition service error (error 11), continuing to listen...');
                        // Don't stop listening - service might recover or user can keep speaking
                        return;
                    }
                    
                    // Check if it's a permission error
                    if (errorStr.includes('permission') || errorStr.includes('denied')) {
                        Alert.alert(
                            'Microphone Permission Required',
                            'Please enable microphone access in your device settings to use voice input.',
                            [{ text: 'OK' }]
                        );
                        speak("Microphone permission is required");
                        setIsListening(false);
                        if (pulseAnimation.current) {
                            pulseAnimation.current.stop();
                        }
                        pulseAnim.setValue(1);
                    } else {
                        // Only show alert for non-transient errors
                        console.warn('🎤 Voice error occurred:', error);
                        // Don't automatically stop for transient errors
                        // The user can manually stop if needed
                    }
                }
            );
        } catch (error) {
            console.error('Voice input error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to start voice input';
            Alert.alert('Error', errorMsg);
            setIsListening(false);
            if (pulseAnimation.current) {
                pulseAnimation.current.stop();
            }
            pulseAnim.setValue(1);
        }
    };

    const handleStopVoiceInput = async (textToProcess?: string) => {
        try {
            console.log('🛑 User requested to stop voice input');
            
            // Ensure textToProcess is a string (not an event object)
            let textToUse: string | undefined;
            if (typeof textToProcess === 'string' && textToProcess.trim()) {
                textToUse = textToProcess;
            } else if (voiceText && typeof voiceText === 'string' && voiceText.trim()) {
                textToUse = voiceText;
            }
            
            console.log('🛑 Text to process:', textToUse);
            
            await voiceInputService.stopListening();
            setIsListening(false);
            if (pulseAnimation.current) {
                pulseAnimation.current.stop();
            }
            pulseAnim.setValue(1);
            
            // Wait a moment for any final results to come through
            await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
            
            // Check state again after waiting (final results might have updated it)
            const stateText = voiceText && typeof voiceText === 'string' ? voiceText.trim() : '';
            const finalText = textToUse || stateText;
            
            // Filter out TTS prompt if accidentally captured
            const promptPhrase = "please tell me about your medication";
            const isPromptEcho = finalText.toLowerCase().includes(promptPhrase) && 
                                finalText.toLowerCase().replace(/[^a-z]/g, '').length < 50;
            
            if (finalText && !isPromptEcho) {
                console.log('📝 Processing voice text:', finalText);
                processVoiceText(finalText);
            } else {
                console.log('⚠️ No valid speech captured');
                if (isPromptEcho) {
                    console.log('⚠️ Detected prompt echo, ignoring');
                }
                setVoiceText(''); // Clear any echo text
                speak("I didn't catch that. Please try again.");
            }
        } catch (error) {
            console.error('Stop voice error:', error);
            setIsListening(false);
            if (pulseAnimation.current) {
                pulseAnimation.current.stop();
            }
            pulseAnim.setValue(1);
        }
    };

    const processVoiceText = async (text: string) => {
        if (!text.trim()) {
            return;
        }

        setIsProcessingVoice(true);
        try {
            const result = await extractPrescriptionFromText(text);
            
            if (result.medications && result.medications.length > 0) {
                const med = result.medications[0]; // Take first medication
                
                // Auto-fill form
                setName(med.name || '');
                
                // Handle dosage with unit
                if (med.dosage && med.dosageUnit) {
                    setDosage(`${med.dosage} ${med.dosageUnit}`);
                } else if (med.dosage) {
                    setDosage(med.dosage);
                } else if (med.dosageUnit) {
                    setDosage(med.dosageUnit);
                }
                
                // Set frequency and times based on extracted data
                if (med.times && med.times.length > 0) {
                    // Store extracted times
                    setExtractedTimes(med.times);
                    
                    if (med.times.length === 1) {
                        setFrequency('Daily');
                    } else if (med.times.length === 2) {
                        setFrequency('Twice Daily');
                    } else if (med.times.length === 3) {
                        setFrequency('Thrice Daily');
                    } else {
                        setFrequency('Custom');
                        setCustomTimes(med.times);
                    }
                } else if (med.frequency) {
                    // Use frequency from extraction
                    if (FREQUENCIES.includes(med.frequency)) {
                        setFrequency(med.frequency);
                    }
                }
                
                if (med.instructions) {
                    setNotes(med.instructions);
                }
                
                speak(`I found ${med.name}. Please review and confirm.`);
            } else {
                Alert.alert(
                    'No Medication Found',
                    'Could not extract medication information from your voice input. Please try again or enter manually.',
                    [{ text: 'OK' }]
                );
                speak("Could not understand the medication information. Please try again.");
            }
        } catch (error) {
            console.error('Voice processing error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to process voice input';
            
            // Provide more helpful error messages
            let alertMessage = errorMsg;
            if (errorMsg.includes('500') || errorMsg.includes('Server error')) {
                alertMessage = 'Backend server error. Please check your internet connection and try again, or enter medication details manually.';
            } else if (errorMsg.includes('Network request failed') || errorMsg.includes('fetch')) {
                alertMessage = 'Cannot connect to server. Please check your internet connection and try again.';
            }
            
            Alert.alert(
                'Processing Error',
                alertMessage,
                [
                    { text: 'Try Again', onPress: () => handleStartVoiceInput(), style: 'default' },
                    { text: 'Enter Manually', style: 'cancel' }
                ]
            );
            speak("Failed to process voice input. Please try again or enter manually.");
        } finally {
            setIsProcessingVoice(false);
            setVoiceText('');
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !dosage.trim()) {
            Alert.alert('Missing Information', 'Please fill in Medication Name and Dosage.');
            speak("Please fill in Medication Name and Dosage.");
            return;
        }

        // Use extracted times if available, otherwise use frequency-based times
        const times = extractedTimes || getTimesForFrequency(frequency);
        if (times.length === 0) {
            Alert.alert('Missing Times', 'Please add at least one reminder time.');
            speak("Please add at least one reminder time.");
            return;
        }

        setLoading(true);
        try {
            const hasPermission = await requestPermissions();

            if (!hasPermission) {
                Alert.alert(
                    'Permissions Required',
                    'Notification permissions are needed for reminders. Enable in settings?',
                    [
                        { text: 'Skip', style: 'cancel', onPress: () => saveMedicationWithoutNotifications() },
                        { text: 'Save Anyway', onPress: () => saveMedicationWithoutNotifications() }
                    ]
                );
                setLoading(false);
                return;
            }

            const medicationData = {
                name,
                dosage,
                frequency,
                times,
                notes,
                color: selectedColor,
                notification_sound: selectedSound,
            };

            const medicationId = await addMedication(medicationData);

            try {
                await scheduleMedicationNotifications({
                    ...medicationData,
                    id: medicationId
                });
            } catch (notificationError) {
                console.error('Failed to schedule notifications:', notificationError);
            }

            Alert.alert('Success', 'Medication added with reminders!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
            speak("Medication added successfully");
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save medication');
        } finally {
            setLoading(false);
        }
    };

    const saveMedicationWithoutNotifications = async () => {
        try {
            await addMedication({
                name,
                dosage,
                frequency,
                times: getTimesForFrequency(frequency),
                notes,
                color: selectedColor,
                notification_sound: selectedSound,
            });
            Alert.alert('Success', 'Medication added (without reminders)', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save medication');
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
                <Ionicons name="medical" size={48} color={colors.neutral.white} />
                <AccessibleText variant="h1" color={colors.neutral.white} style={styles.headerTitle}>
                    Add Medication
                </AccessibleText>
                <AccessibleText variant="body" color={colors.neutral.white} style={{ opacity: 0.9 }}>
                    Fill in the details below
                </AccessibleText>
            </LinearGradient>

            {/* Voice Input Card */}
            <Card style={styles.voiceCard}>
                <View style={styles.voiceCardHeader}>
                    <Ionicons name="mic" size={24} color={colors.primary.purple} />
                    <AccessibleText variant="h3" style={styles.voiceCardTitle}>
                        Voice Input
                    </AccessibleText>
                </View>
                
                <AccessibleText variant="caption" color={colors.neutral.gray600} style={styles.voiceHint}>
                    Speak naturally: "I take 500mg Metformin every morning after breakfast"
                </AccessibleText>

                {voiceText && (
                    <View style={styles.voiceTextContainer}>
                        <AccessibleText variant="body" style={styles.voiceText}>
                            "{voiceText}"
                        </AccessibleText>
                    </View>
                )}

                {isProcessingVoice && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="small" color={colors.primary.purple} />
                        <AccessibleText variant="caption" color={colors.primary.purple} style={{ marginLeft: spacing.s }}>
                            Processing...
                        </AccessibleText>
                    </View>
                )}

                <TouchableOpacity
                    style={[
                        styles.voiceButton,
                        isListening && styles.voiceButtonActive
                    ]}
                    onPress={() => {
                        if (isListening) {
                            handleStopVoiceInput();
                        } else {
                            handleStartVoiceInput();
                        }
                    }}
                    disabled={isProcessingVoice}
                    accessibilityLabel={isListening ? "Stop recording" : "Start voice input"}
                    accessibilityRole="button"
                >
                    <Animated.View
                        style={[
                            styles.voiceButtonInner,
                            {
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={
                                isListening
                                    ? [colors.semantic.error, '#DC2626'] as [string, string, ...string[]]
                                    : colors.gradients.primary as [string, string, ...string[]]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.voiceButtonGradient}
                        >
                            <Ionicons
                                name={isListening ? 'stop' : 'mic'}
                                size={32}
                                color={colors.neutral.white}
                            />
                        </LinearGradient>
                    </Animated.View>
                </TouchableOpacity>

                {isListening && (
                    <AccessibleText variant="caption" color={colors.primary.purple} style={styles.listeningText}>
                        Listening... Tap to stop
                    </AccessibleText>
                )}
            </Card>

            {/* Form Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    Medication Information
                </AccessibleText>

                <AccessibleInput
                    label="Medication Name"
                    placeholder="e.g. Paracetamol"
                    value={name}
                    onChangeText={setName}
                    icon={<Ionicons name="medical-outline" size={20} color={colors.neutral.gray500} />}
                />

                <AccessibleInput
                    label="Dosage"
                    placeholder="e.g. 500mg"
                    value={dosage}
                    onChangeText={setDosage}
                    icon={<Ionicons name="flask-outline" size={20} color={colors.neutral.gray500} />}
                />
            </Card>

            {/* Frequency Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    <Ionicons name="time" size={20} color={colors.primary.purple} /> Frequency
                </AccessibleText>
                <View style={styles.chipContainer}>
                    {FREQUENCIES.map((freq) => (
                        <TouchableOpacity
                            key={freq}
                            style={[
                                styles.chip,
                                frequency === freq && styles.chipSelected
                            ]}
                            onPress={() => handleFrequencyChange(freq)}
                            accessibilityRole="button"
                            accessibilityLabel={`Frequency ${freq}`}
                        >
                            <AccessibleText
                                variant="caption"
                                color={frequency === freq ? colors.neutral.white : colors.neutral.gray700}
                                style={{ fontWeight: '600' }}
                            >
                                {freq}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Custom Times Card */}
            {frequency === 'Custom' && (
                <Card style={styles.formCard}>
                    <View style={styles.cardHeader}>
                        <AccessibleText variant="h3">
                            <Ionicons name="alarm" size={20} color={colors.primary.purple} /> Reminder Times
                        </AccessibleText>
                        <TouchableOpacity
                            style={styles.addTimeButton}
                            onPress={addCustomTime}
                            accessibilityLabel="Add another time"
                            accessibilityRole="button"
                        >
                            <Ionicons name="add-circle" size={28} color={colors.primary.purple} />
                        </TouchableOpacity>
                    </View>

                    {customTimes.map((time, index) => (
                        <TimePicker
                            key={index}
                            label={`Time ${index + 1}`}
                            value={time}
                            onChange={(newTime) => updateCustomTime(index, newTime)}
                            onRemove={customTimes.length > 1 ? () => removeCustomTime(index) : undefined}
                        />
                    ))}
                </Card>
            )}

            {/* Notification Sound Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    <Ionicons name="volume-high" size={20} color={colors.primary.purple} /> Notification Sound
                </AccessibleText>
                <View style={styles.chipContainer}>
                    {NOTIFICATION_SOUNDS.map((sound) => (
                        <TouchableOpacity
                            key={sound.value}
                            style={[
                                styles.chip,
                                selectedSound === sound.value && styles.chipSelected
                            ]}
                            onPress={() => setSelectedSound(sound.value)}
                            accessibilityRole="button"
                            accessibilityLabel={`Sound ${sound.name}`}
                        >
                            <AccessibleText
                                variant="caption"
                                color={selectedSound === sound.value ? colors.neutral.white : colors.neutral.gray700}
                                style={{ fontWeight: '600' }}
                            >
                                {sound.name}
                            </AccessibleText>
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Color Card */}
            <Card style={styles.formCard}>
                <AccessibleText variant="h3" style={styles.sectionTitle}>
                    <Ionicons name="color-palette" size={20} color={colors.primary.purple} /> Color Label
                </AccessibleText>
                <View style={styles.colorContainer}>
                    {COLORS.map((color) => (
                        <TouchableOpacity
                            key={color.value}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: color.value },
                                selectedColor === color.value && styles.colorSelected
                            ]}
                            onPress={() => setSelectedColor(color.value)}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${color.name}`}
                        >
                            {selectedColor === color.value && (
                                <Ionicons name="checkmark" size={24} color={colors.neutral.white} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </Card>

            {/* Notes Card */}
            <Card style={styles.formCard}>
                <AccessibleInput
                    label="Notes (Optional)"
                    placeholder="e.g. Take after food"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={{ height: 100, textAlignVertical: 'top', paddingTop: spacing.m }}
                    icon={<Ionicons name="document-text-outline" size={20} color={colors.neutral.gray500} />}
                />
            </Card>

            {/* Save Button */}
            <AccessibleButton
                title={loading ? "Saving..." : "Save Medication"}
                onPress={handleSave}
                disabled={loading}
                loading={loading}
                icon={<Ionicons name="checkmark-circle" size={20} color={colors.neutral.white} />}
                iconPosition="left"
                style={styles.saveButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral.gray100,
    },
    content: {
        paddingBottom: spacing.xl,
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
    formCard: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
        padding: spacing.m,
    },
    sectionTitle: {
        marginBottom: spacing.m,
        flexDirection: 'row',
        textAlign: 'center',
        color: colors.neutral.gray700,
        fontWeight: 'bold',
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    addTimeButton: {
        padding: spacing.xs,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    chip: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: layout.borderRadius.full,
        backgroundColor: colors.neutral.gray200,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: colors.primary.purple,
        borderColor: colors.primary.purple,
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.m,
    },
    colorCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadow.small,
    },
    colorSelected: {
        borderColor: colors.neutral.white,
        ...layout.shadow.medium,
        transform: [{ scale: 1.1 }],
    },
    saveButton: {
        alignSelf: 'center',
        width: '80%',
        marginTop: 20,
    },
    voiceCard: {
        marginHorizontal: spacing.m,
        marginBottom: spacing.m,
        padding: spacing.m,
        alignItems: 'center',
    },
    voiceCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
        alignSelf: 'flex-start',
    },
    voiceCardTitle: {
        marginLeft: spacing.s,
    },
    voiceHint: {
        marginBottom: spacing.m,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    voiceTextContainer: {
        width: '100%',
        backgroundColor: colors.neutral.gray100,
        padding: spacing.m,
        borderRadius: layout.borderRadius.medium,
        marginBottom: spacing.m,
    },
    voiceText: {
        fontStyle: 'italic',
        color: colors.neutral.gray700,
    },
    processingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    voiceButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: spacing.s,
    },
    voiceButtonInner: {
        width: '100%',
        height: '100%',
    },
    voiceButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        ...layout.shadow.large,
    },
    voiceButtonActive: {
        ...layout.shadow.colored,
    },
    listeningText: {
        fontWeight: '600',
    },
});
