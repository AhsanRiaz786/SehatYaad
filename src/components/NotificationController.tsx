import React, { useEffect } from 'react';
import { setupNotificationListeners } from '../services/notificationService';
import { useTTS } from '../context/TTSContext';

export const NotificationController: React.FC = () => {
  const { speak } = useTTS();

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // Extract message to speak
        const title = notification.request.content.title;
        const body = notification.request.content.body;
        
        if (body) {
            speak(`Reminder: ${body}`);
        } else if (title) {
            speak(`Reminder: ${title}`);
        }
      },
      (response) => {
        console.log('User interacted with notification:', response);
      }
    );

    return cleanup;
  }, [speak]);

  return null;
};
