import * as Speech from 'expo-speech';

export interface TTSSptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: string;
  language?: string;
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: Error) => void;
}

class TTSUtility {
  private static instance: TTSUtility;
  private isSpeaking: boolean = false;

  private constructor() {}

  public static getInstance(): TTSUtility {
    if (!TTSUtility.instance) {
      TTSUtility.instance = new TTSUtility();
    }
    return TTSUtility.instance;
  }

  public async speak(text: string, options: TTSSptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any current speech before starting new one if needed, 
        // or expo-speech might handle queueing. 
        // For this app, we probably want to interrupt or queue depending on urgency.
        // Default behavior of expo-speech is to queue if not stopped.
        // Let's stop first to ensure immediate feedback for things like "Marked as taken".
        
        // However, if we want to queue, we shouldn't stop. 
        // Let's make it configurable or default to stop.
        // For now, let's just wrap the basic functionality.
        
        const speechOptions: Speech.SpeechOptions = {
          rate: options.rate || 1.0,
          pitch: options.pitch || 1.0,
          volume: options.volume || 1.0,
          voice: options.voice,
          language: options.language,
          onStart: () => {
            this.isSpeaking = true;
            options.onStart?.();
          },
          onDone: () => {
            this.isSpeaking = false;
            options.onDone?.();
            resolve(); // Resolve when speech is done
          },
          onStopped: () => {
            this.isSpeaking = false;
            options.onStopped?.();
            resolve(); // Resolve when speech is stopped
          },
          onError: (error) => {
            this.isSpeaking = false;
            options.onError?.(error);
            reject(error); // Reject on error
          },
        };

        Speech.speak(text, speechOptions);
      } catch (error) {
        console.error('TTS Error:', error);
        reject(error);
      }
    });
  }

  public async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('TTS Stop Error:', error);
    }
  }

  public async getAvailableVoices() {
    return await Speech.getAvailableVoicesAsync();
  }

  public getIsSpeaking() {
    return this.isSpeaking;
  }
}

export const tts = TTSUtility.getInstance();
