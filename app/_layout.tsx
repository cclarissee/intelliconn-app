import 'react-native-reanimated';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useRef } from 'react';

import NotificationBanner from '../components/NotificationBanner';
import AuthProvider, { useAuth } from '../contexts/AuthContext';
import { DashboardLoadingProvider } from '../contexts/DashboardLoadingContext';
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from '../contexts/ThemeContext';
import { db } from '../firebase';
import { registerForPushNotifications } from '../lib/notifications';
import { initializeQuickSchedules } from '../lib/quickSchedulesInit';
import { defaultTerms, normalizeTerms } from '../lib/terms';
import { initializeTermsOfService } from '../lib/termsInit';

/* Make index the entry screen */
export const unstable_settings = {
  anchor: undefined,
};

function RootLayoutContent() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const quickSchedulesInitialized = useRef(false);

  /* ===============================
     APP BOOT (RUN ONCE)
  =============================== */
  useEffect(() => {
    registerForPushNotifications().catch((err) => {
      console.log(
        'Notification registration skipped:',
        err.message || 'Running in Expo Go'
      );
    });
    if (user) {
  initializeTermsOfService().catch((err) => {
    console.log('Terms init skipped (not admin)');
  });
}
  }, []);

  /* ===============================
     INITIALIZE QUICK SCHEDULES
     (ONLY AFTER AUTH)
  =============================== */
  useEffect(() => {
    if (!user || quickSchedulesInitialized.current) return;

    quickSchedulesInitialized.current = true;

    initializeQuickSchedules()
      .then((result) => {
        console.log('Quick schedules:', result.message);
      })
      .catch((err) => {
        console.error('Quick schedules init error:', err);
      });
  }, [user]);

  /* ===============================
     TERMS CHECK (AFTER LOGIN)
  =============================== */
  useEffect(() => {
    if (loading || !user) return;

    let isMounted = true;

    const checkTermsAcceptance = async () => {
      try {
        const termsSnap = await getDoc(doc(db, 'legal', 'termsOfService'));
        const nextTerms = termsSnap.exists()
          ? normalizeTerms(termsSnap.data())
          : defaultTerms;

        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const acceptedVersion = userSnap.exists()
          ? userSnap.data().termsAcceptedVersion
          : null;

        if (!isMounted) return;

        if (
          acceptedVersion !== nextTerms.version &&
          pathname !== '/terms-accept'
        ) {
          router.replace('/terms-accept');
        }
      } catch (error) {
        console.warn('Terms acceptance check failed:', error);
      }
    };

    checkTermsAcceptance();

    return () => {
      isMounted = false;
    };
  }, [user, loading, pathname]);

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <NotificationBanner />

      <Stack
        screenOptions={{
          headerShown: false,
          animationDuration: 650,
        }}
      >
        {/* ================= ENTRY FLOW ================= */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />

        {/* ================= MAIN APP ================= */}
        <Stack.Screen name="(tabs)" />

        {/* ================= EXTRA ================= */}
        <Stack.Screen name="admin" />
        <Stack.Screen name="terms-accept" />

        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Modal',
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <DashboardLoadingProvider>
          <RootLayoutContent />
        </DashboardLoadingProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

