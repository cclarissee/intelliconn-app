import { useCallback, useState } from 'react';

interface ShowSuccessOptions {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms, 0 = no auto-dismiss
}

interface SuccessNotificationState {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

const initialState: SuccessNotificationState = {
  visible: false,
  title: '',
  message: '',
  duration: 5000,
};

/**
 * Hook to show success notifications throughout the app
 * 
 * Usage:
 * ```tsx
 * const { showSuccess, notificationProps } = useSuccessNotification();
 * 
 * // Somewhere in your JSX:
 * <SuccessNotification {...notificationProps} />
 * 
 * // When you want to show a notification:
 * showSuccess({
 *   title: 'Success!',
 *   message: 'Like deleted successfully',
 *   actionLabel: 'Learn More',
 *   onAction: () => navigation.navigate('Help'),
 * });
 * ```
 */
export function useSuccessNotification() {
  const [notificationState, setNotificationState] = useState<SuccessNotificationState>(initialState);

  const showSuccess = useCallback((options: ShowSuccessOptions) => {
    setNotificationState({
      visible: true,
      title: options.title,
      message: options.message,
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      duration: options.duration ?? 5000,
    });
  }, []);

  const dismiss = useCallback(() => {
    setNotificationState((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    showSuccess,
    dismiss,
    notificationProps: {
      visible: notificationState.visible,
      title: notificationState.title,
      message: notificationState.message,
      actionLabel: notificationState.actionLabel,
      onAction: notificationState.onAction,
      duration: notificationState.duration,
      onDismiss: dismiss,
    },
  };
}
