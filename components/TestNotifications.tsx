import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { sendLocalNotification } from '../lib/notifications';

/**
 * TestNotifications - A component to test different notification types
 * Add this to any screen to test notifications
 */
export default function TestNotifications() {
  const testNotifications = [
    {
      title: '✅ Post Published',
      body: 'Your post has been published successfully!',
      label: 'Post Published',
    },
    {
      title: '🎉 Great Engagement!',
      body: 'Your post reached 100 likes!',
      label: 'Engagement Alert',
    },
    {
      title: '⏰ Scheduled Post',
      body: 'Your post will be published in 5 minutes',
      label: 'Scheduled Post',
    },
    {
      title: '🔗 Account Connected',
      body: 'Successfully connected to Facebook!',
      label: 'Account Connection',
    },
    {
      title: '📊 Weekly Report',
      body: 'Your weekly analytics report is ready',
      label: 'Analytics Report',
    },
  ];

  const handleTestNotification = async (title: string, body: string) => {
    await sendLocalNotification(title, body);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Test Notifications</Text>
        <Text style={styles.headerSubtitle}>
          Tap any button to trigger a notification
        </Text>
      </View>

      {testNotifications.map((notification, index) => (
        <TouchableOpacity
          key={index}
          style={styles.button}
          onPress={() => handleTestNotification(notification.title, notification.body)}
        >
          <Text style={styles.buttonLabel}>{notification.label}</Text>
          <Text style={styles.buttonPreview}>
            {notification.title}: {notification.body}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.info}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          • In Expo Go: Shows alert + banner{'\n'}
          • In Dev Build: Shows real push notification{'\n'}
          • Banner auto-dismisses after 5 seconds
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  buttonPreview: {
    fontSize: 12,
    color: '#E0E7FF',
    opacity: 0.9,
  },
  info: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
