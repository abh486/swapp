import notifee, { TriggerType, RepeatFrequency } from '@notifee/react-native';

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
      if (item && item.enabled) {
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

    let targetHour = Number(item.hour);
    const targetMin = Number(item.minute);

    if (item.ampm === 'PM' && targetHour < 12) targetHour += 12;
    if (item.ampm === 'AM' && targetHour === 12) targetHour = 0;

    if (mealType === 'Water') {
      // Create high importance channel for Android
      const channelId = await notifee.createChannel({
        id: 'water_reminder',
        name: 'Water Reminder',
        importance: 4, // HIGH
        sound: 'mixkit_sci_fi_reject_notification_896',
      });

      // Schedule 24 hourly reminders starting from the set time
      for (let i = 0; i < 24; i++) {
        const waterHour = (targetHour + i) % 24;
        const waterDate = new Date();
        waterDate.setHours(waterHour, targetMin, 0, 0);

        if (waterDate.getTime() <= Date.now() + 1000) {
          waterDate.setDate(waterDate.getDate() + 1);
        }

        const trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: waterDate.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        };

        await notifee.createTriggerNotification(
          {
            id: `Water_${i}`,
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
      // Create high importance channel for Android
      const channelId = await notifee.createChannel({
        id: 'reminders',
        name: 'Meal Reminders',
        importance: 4, // HIGH
        sound: 'default',
      });

      const hasSpecificDays = item.repeat && Array.isArray(item.days) && item.days.length > 0 && item.days.length < 7;

      if (hasSpecificDays) {
        for (const dayIndex of item.days) {
          const dayDate = new Date();
          dayDate.setHours(targetHour, targetMin, 0, 0);
          const currentDay = dayDate.getDay();
          let daysDiff = (dayIndex - currentDay + 7) % 7;
          if (daysDiff === 0 && dayDate.getTime() <= Date.now() + 1000) {
            daysDiff = 7;
          }
          dayDate.setDate(dayDate.getDate() + daysDiff);

          const trigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: dayDate.getTime(),
            repeatFrequency: RepeatFrequency.WEEKLY,
          };

          await notifee.createTriggerNotification(
            {
              id: `${mealType}_day_${dayIndex}`,
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
        }
        console.log(`[LocalNotifications] Scheduled weekly ${mealType} on days [${item.days.join(',')}] at ${targetHour}:${targetMin} ${item.ampm}`);
      } else {
        const nextDate = new Date();
        nextDate.setHours(targetHour, targetMin, 0, 0);
        if (nextDate.getTime() <= Date.now() + 1000) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        const trigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: nextDate.getTime(),
          ...(item.repeat ? { repeatFrequency: RepeatFrequency.DAILY } : {}),
        };

        await notifee.createTriggerNotification(
          {
            id: mealType,
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
        console.log(`[LocalNotifications] Scheduled ${mealType} at ${targetHour}:${targetMin} ${item.ampm}${item.repeat ? ' (Daily)' : ''}`);
      }
    }
  } catch (err) {
    console.error(`[LocalNotifications] Failed to schedule ${mealType}:`, err);
  }
};
