// Sound Manager - Currently logs sounds, can be upgraded with expo-av and sound files later
type SoundType = 'success' | 'error' | 'alert' | 'notification';

class SoundManager {
    private static instance: SoundManager;
    private sounds: Map<SoundType, any> = new Map(); // Will use Audio.Sound when expo-av is added

    private constructor() {
        this.initializeSounds();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private async initializeSounds() {
        // Sound initialization placeholder
        // When adding actual sound files, setup expo-av here
    }

    /**
   * Play a sound effect
     * Placeholder implementation - sound files can be added with expo-av if needed
     * Currently silent to avoid unnecessary audio feedback
   */
    public async play(_type: SoundType) {
        try {
            // Sound implementation placeholder
            // To enable sounds: install expo-av and uncomment below
            // const sound = new Audio.Sound();
            // await sound.loadAsync(require(`../assets/sounds/${_type}.mp3`));
            // await sound.playAsync();
        } catch (_error) {
            // Silently handle sound errors - not critical for app functionality
        }
    }

    /**
     * Play success sound - short positive beep
     */
    public async playSuccess() {
        await this.play('success');
    }

    /**
     * Play error sound - double beep
     */
    public async playError() {
        await this.play('error');
    }

    /**
     * Play alert sound - attention beep
     */
    public async playAlert() {
        await this.play('alert');
    }

    /**
     * Play notification sound - gentle reminder
     */
    public async playNotification() {
        await this.play('notification');
    }

    /**
     * Cleanup sounds
     */
    public async cleanup() {
        try {
            for (const [_, sound] of this.sounds) {
                await sound.unloadAsync();
            }
            this.sounds.clear();
        } catch (error) {
            console.error('Error cleaning up sounds:', error);
        }
    }
}

export const soundManager = SoundManager.getInstance();

// Convenience exports
export const playSuccessSound = () => soundManager.playSuccess();
export const playErrorSound = () => soundManager.playError();
export const playAlertSound = () => soundManager.playAlert();
export const playNotificationSound = () => soundManager.playNotification();
