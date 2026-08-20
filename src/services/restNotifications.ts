import { Platform } from 'react-native';

/**
 * Rest-timer notifications: fire a local notification when rest ends so
 * the user can pocket the phone between sets. Loaded lazily and fully
 * optional — if the module or permission is unavailable (e.g. web,
 * Expo Go limitations, permission denied) the in-app timer still works.
 */

let scheduledId: string | undefined;

type NotificationsModule = typeof import('expo-notifications');

const loadModule = async (): Promise<NotificationsModule | undefined> => {
  if (Platform.OS === 'web') return undefined;
  try {
    return await import('expo-notifications');
  } catch {
    return undefined;
  }
};

export const scheduleRestEndNotification = async (seconds: number): Promise<void> => {
  const notifications = await loadModule();
  if (!notifications || seconds <= 0) return;
  try {
    const { status } = await notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const request = await notifications.requestPermissionsAsync();
      if (request.status !== 'granted') return;
    }
    await cancelRestEndNotification();
    scheduledId = await notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest complete',
        body: 'Time for your next set.',
        sound: true,
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
      },
    });
  } catch {
    // Notifications are an enhancement; never let them break logging.
  }
};

export const cancelRestEndNotification = async (): Promise<void> => {
  const notifications = await loadModule();
  if (!notifications || !scheduledId) return;
  try {
    await notifications.cancelScheduledNotificationAsync(scheduledId);
  } catch {
    // ignore
  }
  scheduledId = undefined;
};
