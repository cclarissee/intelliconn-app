import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Notifications only if NOT in Expo Go
let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Configure how notifications are handled when the app is in the foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.log('Notification module not available:', error);
  }
}

// In-app notification queue for Expo Go fallback
interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
}

let notificationQueue: InAppNotification[] = [];
let notificationListeners: ((notification: InAppNotification) => void)[] = [];

/**
 * Subscribe to in-app notifications (for Expo Go fallback)
 */
export function subscribeToInAppNotifications(
  callback: (notification: InAppNotification) => void
): () => void {
  notificationListeners.push(callback);
  return () => {
    notificationListeners = notificationListeners.filter(cb => cb !== callback);
  };
}

/**
 * Show an in-app alert (fallback for Expo Go)
 */
function showInAppAlert(title: string, body: string): void {
  const notification: InAppNotification = {
    id: Date.now().toString(),
    title,
    body,
    timestamp: new Date(),
  };
  
  notificationQueue.push(notification);
  notificationListeners.forEach(listener => listener(notification));
  
  // Also show as Alert
  Alert.alert(title, body);
}

/**
 * Request notification permissions from the user
 * @returns {Promise<boolean>} True if permission is granted, false otherwise
 */
export async function registerForPushNotifications(): Promise<boolean> {
  // Skip in Expo Go
  if (isExpoGo) {
    console.log('Push notifications are not available in Expo Go. Use a development build for full notification support.');
    return false;
  }

  if (!Notifications) {
    console.log('Notifications module not available');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // On Android, configure the notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return false;
  }
}

/**
 * Send a local notification immediately
 * @param title - The notification title
 * @param body - The notification body text
 * @param data - Optional data to pass with the notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  // Use in-app alert in Expo Go
  if (isExpoGo || !Notifications) {
    console.log(`[In-app notification] ${title}: ${body}`);
    showInAppAlert(title, body);
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // null means send immediately
    });
  } catch (error) {
    console.error('Error sending local notification:', error);
    // Fallback to in-app alert
    showInAppAlert(title, body);
  }
}

/**
 * Send a notification when a post is published
 * @param postTitle - The title of the published post
 * @param platforms - The platforms where the post was published
 */
export async function notifyPostPublished(
  postTitle: string,
  platforms?: string[]
): Promise<void> {
  const platformText = platforms && platforms.length > 0 
    ? ` to ${platforms.join(', ')}` 
    : '';
  
  await sendLocalNotification(
    '✅ Post Published!',
    `"${postTitle}" has been published${platformText}`,
    { type: 'post_published', postTitle }
  );
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  if (isExpoGo || !Notifications) {
    console.log('Cancel notifications skipped (Expo Go)');
    return;
  }
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications() {
  if (isExpoGo || !Notifications) {
    return [];
  }
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}
