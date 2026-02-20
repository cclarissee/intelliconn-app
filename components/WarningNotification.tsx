import { AlertCircle, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WarningNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // Auto-dismiss duration in ms, 0 = no auto-dismiss
}

/**
 * WarningNotification - Shows a warning banner for validation errors
 * Used for missing field validations, unsupported operations, etc.
 * Design matches SuccessNotification but with orange/amber warning color scheme
 */
export default function WarningNotification({
  visible,
  title,
  message,
  onDismiss,
  actionLabel,
  onAction,
  duration = 5000,
}: WarningNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    dismissNotification();
  };

  if (!visible) return null;

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
        <AlertCircle size={32} color="#F59E0B" style={styles.icon} />
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {actionLabel && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAction}
          >
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={dismissNotification}
          style={styles.closeButton}
        >
          <X size={20} color="#D97706" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#FEF3C7', // Vibrant amber background
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FCD34D', // Golden border
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    marginRight: 8,
    flexShrink: 0,
    backgroundColor: '#FEF9C3',
    borderRadius: 12,
    padding: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#92400E', // Dark amber text
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: '#D97706', // Amber text
    lineHeight: 20,
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#F59E0B', // Amber button
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 36,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#FEF9C3',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
