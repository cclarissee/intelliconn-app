import { useCallback, useState } from 'react';

interface ShowWarningOptions {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface WarningNotificationState {
  visible: boolean;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
}

const initialState: WarningNotificationState = {
  visible: false,
  title: '',
  message: '',
  duration: 5000,
};

/**
 * Hook to show warning notifications throughout the app
 * 
 * Usage:
 * ```tsx
 * const { showWarning, notificationProps } = useWarningNotification();
 * 
 * // Somewhere in your JSX:
 * <WarningNotification {...notificationProps} />
 * 
 * // When you want to show a notification:
 * showWarning({
 *   title: '⚠️ Missing Fields',
 *   message: 'Title and content are required',
 *   actionLabel: 'Learn More',
 *   onAction: () => navigation.navigate('Help'),
 * });
 * ```
 */
export function useWarningNotification() {
  const [notificationState, setNotificationState] = useState<WarningNotificationState>(initialState);

  const showWarning = useCallback((options: ShowWarningOptions) => {
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
    showWarning,
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
