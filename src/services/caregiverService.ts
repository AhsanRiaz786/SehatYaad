import { Linking, Platform } from 'react-native';
import { getSetting, updateSetting } from '../database/helpers';
import * as Notifications from 'expo-notifications';

export interface CaregiverInfo {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    enabled: boolean;
    missThreshold: number;
}

export const getCaregiverInfo = async (): Promise<CaregiverInfo> => {
    const name = await getSetting('caregiver_name');
    const phone = await getSetting('caregiver_phone');
    const email = await getSetting('caregiver_email');
    const relationship = await getSetting('caregiver_relationship');
    const enabledStr = await getSetting('caregiver_enabled', 'false');
    const thresholdStr = await getSetting('caregiver_miss_threshold', '3');

    return {
        name,
        phone,
        email,
        relationship,
        enabled: enabledStr === 'true',
        missThreshold: parseInt(thresholdStr, 10) || 3
    };
};

export const saveCaregiverInfo = async (info: CaregiverInfo) => {
    await updateSetting('caregiver_name', info.name);
    await updateSetting('caregiver_phone', info.phone);
    await updateSetting('caregiver_email', info.email);
    await updateSetting('caregiver_relationship', info.relationship);
    await updateSetting('caregiver_enabled', info.enabled ? 'true' : 'false');
    await updateSetting('caregiver_miss_threshold', info.missThreshold.toString());
};

export const callCaregiver = async (phone: string) => {
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
        await Linking.openURL(url);
    }
};

export const messageCaregiver = async (phone: string, message: string) => {
    const url = `sms:${phone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
        await Linking.openURL(url);
    }
};

export const testCaregiverAlert = async (info: CaregiverInfo) => {
    const message = `SehatYaad Test Alert: This is a test notification for ${info.name}. (Relationship: ${info.relationship})`;
    await messageCaregiver(info.phone, message);
};

export const checkAndNotifyCaregiver = async (consecutiveMisses: number, info: CaregiverInfo) => {
    if (!info.enabled || !info.phone) return false;

    if (consecutiveMisses >= info.missThreshold) {
        // Prepare local notification for the user to alert the caregiver
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Caregiver Alert Triggered',
                body: `You've missed ${consecutiveMisses} doses. Should we notify ${info.name}?`,
                data: { type: 'caregiver_alert', phone: info.phone, name: info.name },
            },
            trigger: null, // immediate
        });
        return true;
    }
    return false;
};
