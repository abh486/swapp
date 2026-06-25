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
    await notifee.requestPermission();

    const date = new Date();
    let targetHour = Number(item.hour);
    const targetMin = Number(item.minute);
    
    if (item.ampm === 'PM' && targetHour < 12) targetHour += 12;
    if (item.ampm === 'AM' && targetHour === 12) targetHour = 0;

    date.setHours(targetHour);
    date.setMinutes(targetMin);
    date.setSeconds(0);
    date.setMilliseconds(0);

    // If scheduled time has already passed today, set for tomorrow (or next hour for Water reminder)
    // We add a 10-second safety buffer to avoid target times falling in the past during async execution
    if (date.getTime() <= Date.now() + 10000) {
      if (mealType === 'Water') {
        while (date.getTime() <= Date.now() + 10000) {
          date.setHours(date.getHours() + 1);
        }
      } else {
        date.setDate(date.getDate() + 1);
      }
    }

    const trigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: mealType === 'Water' ? RepeatFrequency.HOURLY : (item.repeat ? RepeatFrequency.DAILY : undefined),
    };

    // Create high importance channel for Android
    const channelId = await notifee.createChannel({
      id: mealType === 'Water' ? 'water_reminder' : 'reminders',
      name: mealType === 'Water' ? 'Water Reminder' : 'Meal Reminders',
      importance: 4, // HIGH
      sound: mealType === 'Water' ? 'mixkit_sci_fi_reject_notification_896' : 'default',
    });

    await notifee.createTriggerNotification(
      {
        id: mealType, // Unique ID per meal type (Breakfast, Lunch, etc.)
        title: `${mealType} Reminder! ⏰`,
        body: mealType === 'Water' 
          ? `Time to drink some water and stay hydrated! 💧`
          : `Time to log your ${mealType.toLowerCase()}! Stay on track with your goals. 🥗`,
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: mealType === 'Water' ? 'mixkit_sci_fi_reject_notification_896.wav' : 'default',
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
  } catch (err) {
    console.error(`[LocalNotifications] Failed to schedule ${mealType}:`, err);
  }
};
