import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { subscribeToInAppNotifications } from '../lib/notifications';

interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
}

/**
 * NotificationBanner - Shows in-app notifications as a banner at the top
 * Use this for notifications in Expo Go or as a fallback
 */
export default function NotificationBanner() {
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    const unsubscribe = subscribeToInAppNotifications((notif) => {
      setNotification(notif);
      
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissNotification();
      }, 5000);
    });

    return unsubscribe;
  }, []);

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setNotification(null);
    });
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          top: Platform.OS === 'ios' ? 50 : 10,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>
        <TouchableOpacity onPress={dismissNotification} style={styles.closeButton}>
          <X size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 9999,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
