import { Menu, Settings, Steering } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  onToggle?: (isActive: boolean) => void;
  onSteeringPress?: () => void;
  onMenuPress?: () => void;
  onSettingsPress?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  onToggle,
  onSteeringPress,
  onMenuPress,
  onSettingsPress,
}) => {
  const { isDarkMode } = useTheme();
  const [isToggleActive, setIsToggleActive] = useState(false);

  const toggleSwitch = () => {
    setIsToggleActive(!isToggleActive);
    onToggle?.(!isToggleActive);
  };

  const theme = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderColor: isDarkMode ? '#334155' : '#E5E7EB',
    textColor: isDarkMode ? '#F9FAFB' : '#111827',
    iconColor: isDarkMode ? '#CBD5E1' : '#64748B',
    toggleActive: '#FF8C42',
    toggleInactive: '#E5E7EB',
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
      gap: 12,
    },
    toggleContainer: {
      width: 56,
      height: 32,
      borderRadius: 16,
      backgroundColor: isToggleActive ? theme.toggleActive : theme.toggleInactive,
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingHorizontal: 2,
    },
    toggleButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconButton: {
      flex: 1,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDarkMode ? '#334155' : '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    iconButtonActive: {
      backgroundColor: isDarkMode ? '#475569' : '#E5E7EB',
    },
  });

  return (
    <View style={styles.container}>
      {/* Toggle Switch */}
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={toggleSwitch}
        activeOpacity={0.7}
      >
        <Animated.View style={styles.toggleButton}>
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: isToggleActive ? theme.toggleActive : '#9CA3AF',
            }}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Steering Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onSteeringPress}
        activeOpacity={0.7}
      >
        <Steering size={20} color={theme.iconColor} strokeWidth={2} />
      </TouchableOpacity>

      {/* Menu Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Menu size={20} color={theme.iconColor} strokeWidth={2} />
      </TouchableOpacity>

      {/* Settings Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onSettingsPress}
        activeOpacity={0.7}
      >
        <Settings size={20} color={theme.iconColor} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

export default Navigation;
