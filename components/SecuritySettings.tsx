import {
  AlertTriangle,
  CheckCircle,
  Shield,
  Smartphone,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  AppState,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';

/* -------------------------------------------------------------------------- */
/* INTELLICONN THEME */
/* -------------------------------------------------------------------------- */

const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  danger: '#DC2626',
  success: '#16A34A',
};

/* -------------------------------------------------------------------------- */
/* CONFIG */
/* -------------------------------------------------------------------------- */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/* SESSION MANAGER HOOK */
/* -------------------------------------------------------------------------- */

function useSessionManager() {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT_MS);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setLastActivity(Date.now());
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      setTimeLeft(Math.max(SESSION_TIMEOUT_MS - elapsed, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  return {
    timeLeft,
    registerActivity: () => setLastActivity(Date.now()),
  };
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT */
/* -------------------------------------------------------------------------- */

export default function SecuritySettings() {
  const { user } = useAuth();
  const { timeLeft, registerActivity } = useSessionManager();

  const lastLogin =
    user?.metadata?.lastSignInTime
      ? new Date(user.metadata.lastSignInTime).toLocaleString()
      : 'Unknown';

  /* ---------------- ACTIVE DEVICES ---------------- */

  const [activeDevices, setActiveDevices] = useState([
    {
      id: '1',
      deviceName: 'iPhone 14 Pro',
      platform: 'iOS 17',
      location: 'Manila, PH',
      ip: '192.168.1.24',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      deviceName: 'Chrome on Windows',
      platform: 'Windows 11',
      location: 'Quezon City, PH',
      ip: '203.177.45.10',
      lastActive: '1 hour ago',
      current: false,
    },
  ]);

  const handleLogoutDevice = (id: string) => {
    setActiveDevices((prev) =>
      prev.filter((device) => device.id !== id)
    );
  };

  const handleLogoutAllOtherDevices = () => {
    setActiveDevices((prev) =>
      prev.filter((device) => device.current)
    );
  };

  /* ---------------- RECENT ACTIVITY ---------------- */

  const [securityEvents] = useState([
    {
      id: '1',
      type: 'warning',
      message: '3 Failed Login Attempts',
      time: '2 hours ago',
    },
    {
      id: '2',
      type: 'info',
      message: 'New Device Login (Cebu, PH)',
      time: '1 day ago',
    },
    {
      id: '3',
      type: 'success',
      message: 'Password Successfully Updated',
      time: '3 days ago',
    },
  ]);

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  /* -------------------------------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------------------------------- */

  return (
    <ScrollView
      onTouchStart={registerActivity}
      style={{ backgroundColor: INTELLICONN.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* HEADER */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '800',
            color: INTELLICONN.primary,
          }}
        >
          Security Settings
        </Text>
        <Text
          style={{
            color: INTELLICONN.textSecondary,
            marginTop: 4,
          }}
        >
          Manage sessions and account protection.
        </Text>
      </View>

      {/* CURRENT SESSION */}
      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 20,
          padding: 20,
          marginBottom: 20,
          elevation: 6,
        }}
      >
        <Text style={{ fontWeight: '700', color: INTELLICONN.primary }}>
          Current Session
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <Text style={{ color: INTELLICONN.textSecondary }}>
            Timeout
          </Text>
          <Text style={{ fontWeight: '700' }}>
            {formatTime(timeLeft)}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <Text style={{ color: INTELLICONN.textSecondary }}>
            Last Login
          </Text>
          <Text>{lastLogin}</Text>
        </View>
      </View>

      {/* ACTIVE DEVICES */}
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 14,
          color: INTELLICONN.primary,
        }}
      >
        Active Devices
      </Text>

      {activeDevices.map((d) => (
        <View
          key={d.id}
          style={{
            backgroundColor: INTELLICONN.card,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            elevation: 4,
            borderWidth: d.current ? 2 : 0,
            borderColor: INTELLICONN.accent,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <Smartphone size={18} color={INTELLICONN.primary} />
            <Text style={{ marginLeft: 8, fontWeight: '700' }}>
              {d.deviceName}
            </Text>

            {d.current && (
              <View
                style={{
                  marginLeft: 10,
                  backgroundColor: INTELLICONN.accent,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: '#fff',
                    fontWeight: '700',
                  }}
                >
                  CURRENT
                </Text>
              </View>
            )}
          </View>

          <Text style={{ color: INTELLICONN.textSecondary }}>
            {d.platform} • {d.location}
          </Text>
          <Text style={{ color: INTELLICONN.textSecondary }}>
            IP: {d.ip}
          </Text>
          <Text style={{ color: INTELLICONN.textSecondary }}>
            Last Active: {d.lastActive}
          </Text>

          {!d.current && (
            <TouchableOpacity
              style={{
                marginTop: 12,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: INTELLICONN.danger,
                alignItems: 'center',
              }}
              onPress={() => handleLogoutDevice(d.id)}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Log Out This Device
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {activeDevices.length > 1 && (
        <TouchableOpacity
          style={{
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: INTELLICONN.primary,
            alignItems: 'center',
            marginBottom: 20,
          }}
          onPress={handleLogoutAllOtherDevices}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            Log Out All Other Devices
          </Text>
        </TouchableOpacity>
      )}

      {/* DEVICE PROTECTION */}
      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 20,
          padding: 20,
          elevation: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Shield size={20} color={INTELLICONN.primary} />
          <Text
            style={{
              marginLeft: 8,
              fontWeight: '700',
              color: INTELLICONN.primary,
            }}
          >
            Device Protection
          </Text>
        </View>

        <Text
          style={{
            marginTop: 10,
            color: INTELLICONN.textSecondary,
          }}
        >
          Your session automatically expires after 30 minutes of inactivity.
        </Text>
      </View>

      {/* RECENT SECURITY ACTIVITY */}
      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 20,
          padding: 20,
          marginTop: 16,
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontWeight: '700',
            color: INTELLICONN.primary,
            marginBottom: 14,
          }}
        >
          Recent Security Activity
        </Text>

        {securityEvents.map((e) => (
          <View
            key={e.id}
            style={{ flexDirection: 'row', marginBottom: 12 }}
          >
            {e.type === 'warning' ? (
              <AlertTriangle size={18} color={INTELLICONN.danger} />
            ) : e.type === 'success' ? (
              <CheckCircle size={18} color={INTELLICONN.success} />
            ) : (
              <Shield size={18} color={INTELLICONN.secondary} />
            )}

            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontWeight: '600' }}>
                {e.message}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: INTELLICONN.textSecondary,
                }}
              >
                {e.time}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
