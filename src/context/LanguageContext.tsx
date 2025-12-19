import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

export type Language = 'en' | 'ur';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
    isRTL: boolean;
    t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations: Record<Language, Record<string, string>> = {
    en: {
        'app.name': 'SehatYaad',
        'home.title': "Today's Meds",
        'home.addMedication': 'Add Medication',
        'home.scanPrescription': 'Scan Prescription',
        'home.heroTitle': 'Stay on track with your health',
        'home.voiceInput': 'Voice Input',
        'home.addManual': 'Add Manually',
        'greeting.goodMorning': 'Good Morning,',
        'greeting.goodAfternoon': 'Good Afternoon,',
        'greeting.goodEvening': 'Good Evening,',
        'medication.markAsTaken': 'Mark as Taken',
        'medication.name': 'Name',
        'medication.time': 'Time',
        'medication.dosage': 'Dosage',
        'timeBlock.morning': 'Morning',
        'timeBlock.noon': 'Noon',
        'timeBlock.evening': 'Evening',
        'timeBlock.night': 'Night',
        'status.taken': 'Taken',
        'status.pending': 'Pending',
        'status.missed': 'Missed',
        'smartHub.morningMeds': 'Morning Meds',
        'smartHub.voiceInput': 'Voice Input',
        'smartBadge.refillSuggested': 'Refill suggested based on your past 30 days of usage.',
    },
    ur: {
        'app.name': 'صحت یاد',
        'home.title': 'آج کی دوائیں',
        'home.addMedication': 'دوائی شامل کریں',
        'home.scanPrescription': 'نسخہ اسکین کریں',
        'home.heroTitle': 'اپنی صحت کا خیال رکھیں',
        'home.voiceInput': 'آواز ان پٹ',
        'home.addManual': 'دستی شامل کریں',
        'greeting.goodMorning': 'صبح بخیر،',
        'greeting.goodAfternoon': 'سہ پہر بخیر،',
        'greeting.goodEvening': 'شام بخیر،',
        'medication.markAsTaken': 'لیا ہوا نشان لگائیں',
        'medication.name': 'نام',
        'medication.time': 'وقت',
        'medication.dosage': 'خوری',
        'timeBlock.morning': 'صبح',
        'timeBlock.noon': 'دوپہر',
        'timeBlock.evening': 'شام',
        'timeBlock.night': 'رات',
        'status.taken': 'لیا',
        'status.pending': 'زیر التواء',
        'status.missed': 'چھوٹ گیا',
        'smartHub.morningMeds': 'صبح کی دوائیں',
        'smartHub.voiceInput': 'آواز ان پٹ',
        'smartBadge.refillSuggested': 'آپ کے پچھلے 30 دن کے استعمال کی بنیاد پر ریفل تجویز کیا گیا۔',
    },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');
    const [isRTL, setIsRTL] = useState(false);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem('app_language');
            if (savedLang === 'ur' || savedLang === 'en') {
                await setLanguage(savedLang as Language);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            setIsRTL(lang === 'ur');
            await AsyncStorage.setItem('app_language', lang);

            // Force RTL layout change
            if (I18nManager.isRTL !== (lang === 'ur')) {
                I18nManager.forceRTL(lang === 'ur');
                // Note: App restart may be required for RTL to take full effect
            }
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key: string, params?: Record<string, string>): string => {
        let translation = translations[language][key] || translations.en[key] || key;

        if (params) {
            Object.keys(params).forEach(paramKey => {
                translation = translation.replace(`{{${paramKey}}}`, params[paramKey]);
            });
        }

        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};


