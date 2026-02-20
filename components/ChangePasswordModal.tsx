import { Ionicons } from '@expo/vector-icons';
import { updatePassword } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  user,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor(
    { light: '#fff', dark: '#1F2937' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: '#E5E7EB', dark: '#374151' },
    'icon'
  );
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  /* ================= PASSWORD STRENGTH (FIXED TYPES) ================= */

  const getPasswordStrength = (password: string) => {
    if (!password)
      return { label: '', color: 'transparent', width: 0 };

    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    const mediumRegex =
      /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

    if (strongRegex.test(password)) {
      return { label: 'Strong', color: '#16A34A', width: 1 };
    } else if (mediumRegex.test(password)) {
      return { label: 'Medium', color: '#F59E0B', width: 0.6 };
    } else {
      return { label: 'Weak', color: '#DC2626', width: 0.3 };
    }
  };

  const strength = getPasswordStrength(newPassword);

  /* ================= SUCCESS FADE ANIMATION ================= */

  const showSuccessNotification = () => {
    setSuccessMessage('Password has been changed successfully.');

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setSuccessMessage(''));
      }, 4000);
    });
  };

  /* ===================================================== */

  const handleChangePassword = async () => {
    if (!user) return;

    setErrorMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (strength.label === 'Weak') {
      setErrorMessage('Password is too weak.');
      return;
    }

    setChangingPassword(true);

    try {
      await updatePassword(user, newPassword);

      setNewPassword('');
      setConfirmPassword('');
      showSuccessNotification();
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        setErrorMessage(
          'Session expired. Please log out and log back in.'
        );
      } else {
        setErrorMessage('Incorrect password or failed update.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancel = () => {
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    onClose();
  };

  if (!visible) return null;
return (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    }}
  >
    <View
      style={{
        backgroundColor: cardBackground,
        borderRadius: 18,
        padding: 24,
        width: '100%',
        maxWidth: 400,
      }}
    >
      {/* HEADER */}
      <View
        style={{
          position: 'relative',
          marginBottom: 22,
          paddingTop: 4,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: textColor,
            textAlign: 'center',
          }}
        >
          Change Password
        </Text>

        <TouchableOpacity
          onPress={handleCancel}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            padding: 6,
          }}
        >
          <Ionicons name="close" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* SUCCESS MESSAGE */}
      {successMessage !== '' && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            backgroundColor: '#DCFCE7',
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: '#166534',
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {successMessage}
          </Text>
        </Animated.View>
      )}

      {/* NEW PASSWORD */}
      <Text
        style={{
          fontSize: 14,
          color: textColor,
          marginBottom: 6,
        }}
      >
        New Password
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: backgroundColor,
          borderWidth: 1,
          borderColor: errorMessage ? '#DC2626' : borderColor,
          borderRadius: 10,
          paddingHorizontal: 14,
          marginBottom: 12,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 14,
            color: textColor,
          }}
          secureTextEntry={!showNewPassword}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            setErrorMessage('');
          }}
          placeholder="Enter new password"
          placeholderTextColor={iconColor}
        />

        <TouchableOpacity
          onPress={() => setShowNewPassword(!showNewPassword)}
        >
          <Ionicons
            name={showNewPassword ? 'eye-off' : 'eye'}
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* STRENGTH BAR */}
      {newPassword.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <View
            style={{
              height: 6,
              backgroundColor: '#E5E7EB',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: 6,
                width: `${strength.width * 100}%`,
                backgroundColor: strength.color,
              }}
            />
          </View>

          <Text
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: '600',
              color: strength.color,
            }}
          >
            {strength.label}
          </Text>
        </View>
      )}

      {/* CONFIRM PASSWORD */}
      <Text
        style={{
          fontSize: 14,
          color: textColor,
          marginBottom: 6,
        }}
      >
        Confirm New Password
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: backgroundColor,
          borderWidth: 1,
          borderColor: errorMessage ? '#DC2626' : borderColor,
          borderRadius: 10,
          paddingHorizontal: 14,
          marginBottom: 12,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingVertical: 14,
            color: textColor,
          }}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrorMessage('');
          }}
          placeholder="Confirm new password"
          placeholderTextColor={iconColor}
        />

        <TouchableOpacity
          onPress={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
        >
          <Ionicons
            name={showConfirmPassword ? 'eye-off' : 'eye'}
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* ERROR MESSAGE */}
      {errorMessage !== '' && (
        <Text
          style={{
            color: '#DC2626',
            fontSize: 13,
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {errorMessage}
        </Text>
      )}

      {/* CHANGE BUTTON */}
      <TouchableOpacity
        onPress={handleChangePassword}
        disabled={changingPassword}
        style={{
          backgroundColor: tintColor,
          paddingVertical: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 14,
          opacity: changingPassword ? 0.6 : 1,
        }}
      >
        {changingPassword ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            Change Password
          </Text>
        )}
      </TouchableOpacity>

      {/* CANCEL */}
      <TouchableOpacity onPress={handleCancel}>
        <Text
          style={{
            color: iconColor,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);
}
