import notifee, { TriggerType } from '@notifee/react-native';

export const syncLocalNotifications = async (reminders) => {
  try {
    // 1. Cancel all existing scheduled trigger notifications to start fresh
    const triggerNotificationIds = await notifee.getTriggerNotificationIds();
    for (const id of triggerNotificationIds) {
      await notifee.cancelNotification(id);
    }

    // 2. Loop through all reminders and schedule enabled ones
    for (const key of Object.keys(reminders)) {
      const item = reminders[key];
      if (item.enabled) {
        await scheduleLocalNotification(key, item);
      }
    }
  } catch (err) {
    console.error('[LocalNotifications] Failed to sync notifications:', err);
  }
};

const scheduleLocalNotification = async (mealType, item) => {
  try {
    // Request permission (required for Android 13+ and iOS)
    const settings = await notifee.requestPermission();
    if (settings.authorizationStatus === 0) { // 0 = AuthorizationStatus.DENIED
      console.warn(`[LocalNotifications] Notification permission is DENIED. Reminders will not display.`);
    }

    const date = new Date();
    let targetHour = Number(item.hour);
    const targetMin = Number(item.minute);
    
    if (item.ampm === 'PM' && targetHour < 12) targetHour += 12;
    if (item.ampm === 'AM' && targetHour === 12) targetHour = 0;

    date.setHours(targetHour);
    date.setMinutes(targetMin);
    date.setSeconds(0);
    date.setMilliseconds(0);

    if (mealType === 'Water') {
      // Create high importance channel for Android
      const channelId = await notifee.createChannel({
        id: 'water_reminder',
        name: 'Water Reminder',
        importance: 4, // HIGH
        sound: 'mixkit_sci_fi_reject_notification_896',
      });

      // Schedule 24 hourly reminders starting from the set time
      // Spacing it out to 24 separate daily recurring triggers ensures high reliability on iOS and Android,
      // and respects the exact start time.
      for (let i = 0; i < 24; i++) {
        const waterHour = (targetHour + i) % 24;

        const trigger = {
          type: TriggerType.CALENDAR,
          date: {
            hour: waterHour,
            minute: targetMin,
          },
        };

        await notifee.createTriggerNotification(
          {
            id: `Water_${i}`, // Unique ID per hour
            title: `Water Reminder! ⏰`,
            body: `Time to drink some water and stay hydrated! 💧`,
            android: {
              channelId,
              pressAction: {
                id: 'default',
              },
            },
            ios: {
              sound: 'mixkit_sci_fi_reject_notification_896.wav',
              foregroundPresentationOptions: {
                alert: true,
                badge: true,
                sound: true,
                banner: true,
                list: true,
              },
            },
          },
          trigger,
        );
      }
      console.log(`[LocalNotifications] Scheduled 24 hourly Water reminders starting at ${targetHour}:${targetMin} ${item.ampm}`);
    } else {
      let trigger;
      if (item.repeat) {
        trigger = {
          type: TriggerType.CALENDAR,
          date: {
            hour: targetHour,
            minute: targetMin,
          },
        };
      } else {
        // If scheduled time has already passed today, set for tomorrow
        if (date.getTime() <= Date.now() + 10000) {
          date.setDate(date.getDate() + 1);
        }
        trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: date.getTime(),
        };
      }

      // Create high importance channel for Android
      const channelId = await notifee.createChannel({
        id: 'reminders',
        name: 'Meal Reminders',
        importance: 4, // HIGH
        sound: 'default',
      });

      await notifee.createTriggerNotification(
        {
          id: mealType, // Unique ID per meal type (Breakfast, Lunch, etc.)
          title: `${mealType} Reminder! ⏰`,
          body: `Time to log your ${mealType.toLowerCase()}! Stay on track with your goals. 🥗`,
          android: {
            channelId,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
              banner: true,
              list: true,
            },
          },
        },
        trigger,
      );
      console.log(`[LocalNotifications] Scheduled ${mealType} at ${targetHour}:${targetMin} ${item.ampm}`);
    }
  } catch (err) {
    console.error(`[LocalNotifications] Failed to schedule ${mealType}:`, err);
  }
};
