import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tts } from '../utils/tts';
import * as Speech from 'expo-speech';

interface TTSContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  voice: string | null;
  setVoice: (voice: string | null) => void;
  speak: (text: string, force?: boolean) => void;
  stop: () => void;
  availableVoices: Speech.Voice[];
}

const TTSContext = createContext<TTSContextType | undefined>(undefined);

export const TTSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(true);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [voice, setVoice] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);

  useEffect(() => {
    loadSettings();
    loadVoices();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [enabled, rate, pitch, volume, voice]);

  const loadVoices = async () => {
    try {
      const voices = await tts.getAvailableVoices();
      setAvailableVoices(voices);
    } catch (error) {
      console.error('Failed to load voices', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('tts_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setEnabled(parsed.enabled ?? true);
        setRate(parsed.rate ?? 1.0);
        setPitch(parsed.pitch ?? 1.0);
        setVolume(parsed.volume ?? 1.0);
        setVoice(parsed.voice ?? null);
      }
    } catch (error) {
      console.error('Failed to load TTS settings', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        enabled,
        rate,
        pitch,
        volume,
        voice,
      };
      await AsyncStorage.setItem('tts_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save TTS settings', error);
    }
  };

  const speak = (text: string, force: boolean = false) => {
    if (!enabled && !force) return;
    
    tts.speak(text, {
      rate,
      pitch,
      volume,
      voice: voice || undefined,
    });
  };

  const stop = () => {
    tts.stop();
  };

  return (
    <TTSContext.Provider
      value={{
        enabled,
        setEnabled,
        rate,
        setRate,
        pitch,
        setPitch,
        volume,
        setVolume,
        voice,
        setVoice,
        speak,
        stop,
        availableVoices,
      }}
    >
      {children}
    </TTSContext.Provider>
  );
};

export const useTTS = () => {
  const context = useContext(TTSContext);
  if (context === undefined) {
    throw new Error('useTTS must be used within a TTSProvider');
  }
  return context;
};
