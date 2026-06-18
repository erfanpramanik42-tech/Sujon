import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  static async initialize() {
    if (Capacitor.isNativePlatform()) {
      const { display } = await LocalNotifications.checkPermissions();
      if (display !== 'granted') {
        const result = await LocalNotifications.requestPermissions();
        if (result.display !== 'granted') {
          console.warn('Push notification permission denied');
        }
      }

      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'SHOP_ARRIVAL',
            actions: [
              {
                id: 'view',
                title: 'View App',
              },
            ],
          },
        ],
      });
    }
  }

  static async showNotification({ title, body, id = Math.floor(Math.random() * 100000) }: { title: string, body: string, id?: number }) {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 1000) }, // Schedule 1 second from now
            actionTypeId: 'SHOP_ARRIVAL',
            sound: 'default',
          },
        ],
      });
    } else {
      // Fallback for web
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  }
}
