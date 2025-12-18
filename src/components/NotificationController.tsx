import React, { useEffect } from 'react';
import { setupNotificationListeners } from '../services/notificationService';
import { useTTS } from '../context/TTSContext';

export const NotificationController: React.FC = () => {
  const { speak } = useTTS();

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // Extract medication name from notification data for TTS
        const data = notification.request.content.data;
        const medicationName = data?.medicationName as string;
        
        if (medicationName) {
            speak(`Time for ${medicationName}`);
        } else {
            // Fallback to title if medication name not available
            const title = notification.request.content.title;
            if (title) {
                speak(`Time for ${title.replace('Time for ', '')}`);
            }
        }
      },
      (response) => {
        console.log('User interacted with notification:', response);
        // TTS feedback is handled in notificationService for action buttons and default tap
      }
    );

    return cleanup;
  }, [speak]);

  return null;
};
