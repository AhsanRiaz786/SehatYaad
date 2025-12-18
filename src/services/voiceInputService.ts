import Voice from '@react-native-voice/voice';
import { Platform } from 'react-native';

export interface VoiceInputResult {
    text: string;
    isFinal: boolean;
    error?: string;
}

export class VoiceInputService {
    private static instance: VoiceInputService;
    private isListening: boolean = false;

    private constructor() {
        this.setupVoiceHandlers();
    }

    public static getInstance(): VoiceInputService {
        if (!VoiceInputService.instance) {
            VoiceInputService.instance = new VoiceInputService();
        }
        return VoiceInputService.instance;
    }

    private setupVoiceHandlers() {
        Voice.onSpeechStart = () => {
            console.log('Speech started');
            this.isListening = true;
        };

        Voice.onSpeechEnd = () => {
            console.log('Speech ended');
            this.isListening = false;
        };

        Voice.onSpeechError = (e) => {
            console.error('Speech error:', e);
            this.isListening = false;
        };
    }

    /**
     * Check if speech recognition is available
     * Note: Permissions are automatically requested when calling start()
     */
    public async checkAvailability(): Promise<boolean> {
        try {
            const isAvailable = await Voice.isAvailable();
            console.log('Voice service available:', isAvailable);
            return Boolean(isAvailable);
        } catch (error) {
            console.error('Availability check error:', error);
            return false;
        }
    }

    /**
     * Start listening for voice input
     * Note: Permissions are automatically requested when calling start()
     */
    public async startListening(
        onResult: (result: VoiceInputResult) => void,
        onError?: (error: string) => void
    ): Promise<void> {
        try {
            // Check if already listening
            const isRecognizing = await Voice.isRecognizing();
            if (isRecognizing || this.isListening) {
                console.warn('Already listening, stopping first...');
                await this.stopListening();
            }

            // Determine language based on platform
            const language = Platform.OS === 'android' ? 'en-US' : 'en-US';
            
            // Set up handlers before starting
            // Set up result handler
            Voice.onSpeechResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const text = e.value[0];
                    console.log('Final speech result:', text);
                    onResult({
                        text: text,
                        isFinal: true,
                    });
                }
            };

            // Set up partial results handler for real-time feedback
            Voice.onSpeechPartialResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const text = e.value[0];
                    console.log('Partial speech result:', text);
                    onResult({
                        text: text,
                        isFinal: false,
                    });
                }
            };

            // Set up error handler
            Voice.onSpeechError = (e) => {
                const errorObj = e.error;
                let errorMsg: string = 'Speech recognition error';
                let errorCode = '';
                
                if (typeof errorObj === 'string') {
                    errorMsg = errorObj;
                } else if (errorObj && typeof errorObj === 'object') {
                    errorMsg = errorObj.message || String(errorObj) || 'Speech recognition error';
                    errorCode = errorObj.code?.toString() || '';
                }
                
                const errorStr = errorMsg.toLowerCase();
                
                console.error('Voice error:', errorMsg, e);
                
                // Error codes 7 and 11 are transient - don't stop listening or call onError
                if (errorCode === '7' || errorStr.includes('no match')) {
                    console.log('Transient error (no match), continuing...');
                    return; // Don't stop listening or notify
                }
                
                if (errorCode === '11' || errorStr.includes("didn't understand")) {
                    console.log('Transient error (didn\'t understand), continuing...');
                    return; // Don't stop listening or notify
                }
                
                // For other errors, stop listening and notify
                this.isListening = false;
                onError?.(errorMsg);
            };
            
            // Also set up onSpeechStart and onSpeechEnd handlers
            Voice.onSpeechStart = () => {
                console.log('Speech recognition started');
                this.isListening = true;
            };
            
            Voice.onSpeechEnd = () => {
                console.log('Speech recognition ended');
                this.isListening = false;
            };
            
            // Start listening (permissions are requested automatically)
            console.log(`Starting voice recognition with language: ${language}`);
            await Voice.start(language);
            console.log('Voice.start() called successfully');
        } catch (error) {
            console.error('Start listening error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to start listening';
            this.isListening = false;
            onError?.(errorMsg);
            throw error;
        }
    }

    /**
     * Stop listening for voice input
     */
    public async stopListening(): Promise<void> {
        try {
            console.log('Stopping voice recognition...');
            const isRecognizing = await Voice.isRecognizing();
            if (isRecognizing || this.isListening) {
                await Voice.stop();
                console.log('Voice.stop() called');
                // Give it a moment before canceling
                await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
                await Voice.cancel();
                console.log('Voice.cancel() called');
            }
            this.isListening = false;
            console.log('Voice recognition stopped');
        } catch (error) {
            console.error('Stop listening error:', error);
            this.isListening = false;
        }
    }

    /**
     * Destroy voice service (cleanup)
     */
    public destroy(): void {
        Voice.destroy().then(() => {
            console.log('Voice service destroyed');
        }).catch((error) => {
            console.error('Error destroying voice service:', error);
        });
        this.isListening = false;
    }

    public getIsListening(): boolean {
        return this.isListening;
    }
}

export const voiceInputService = VoiceInputService.getInstance();

