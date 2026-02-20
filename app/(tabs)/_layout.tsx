import { router, Tabs, useSegments } from 'expo-router';
import { BookOpen, Calendar, File, Home } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';

import {
  useDashboardLoading
} from '@/contexts/DashboardLoadingContext';

/* ---------------- ICON ANIMATION ---------------- */

function AnimatedIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(focused ? 1.15 : 1, { duration: 180 }) },
    ],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/* =====================================================
   OUTER COMPONENT (ONLY PROVIDER HERE)
===================================================== */
export default function TabLayout() {
  return <TabLayoutContent />;
}


/* =====================================================
   INNER COMPONENT (SAFE TO USE CONTEXT HERE)
===================================================== */

function TabLayoutContent() {
  const { theme } = useTheme();
  const { user, loading } = useAuth();
  const { dashboardLoading } = useDashboardLoading();
  const segments = useSegments();

  const colorScheme = theme;
  const isDark = colorScheme === 'dark';

  useScheduledPosts(user?.uid);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  /* ---------- Entrance Animation ---------- */

  const tabBarTranslateY = useSharedValue(30);
  const tabBarOpacity = useSharedValue(0);

  useEffect(() => {
    tabBarTranslateY.value = withTiming(0, { duration: 400 });
    tabBarOpacity.value = withTiming(1, { duration: 400 });
  }, []);

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarTranslateY.value }],
    opacity: tabBarOpacity.value,
  }));

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <Animated.View style={[styles.wrapper, tabBarAnimatedStyle]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          animation: 'shift',

          tabBarShowLabel: true,
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',

          tabBarStyle: [
            styles.tabBarBase,
            isDark ? styles.tabBarDark : styles.tabBarLight,

            // 🔥 THIS HIDES TABS DURING DASHBOARD LOADING
            dashboardLoading ? { display: 'none' } : null,
          ],

          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
          },

          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 8,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon focused={focused}>
                <Home size={24} color={color} />
              </AnimatedIcon>
            ),
          }}
        />

        <Tabs.Screen
          name="post"
          options={{
            title: 'Post',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon focused={focused}>
                <File size={24} color={color} />
              </AnimatedIcon>
            ),
          }}
        />

        <Tabs.Screen
          name="template"
          options={{
            title: 'Template',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon focused={focused}>
                <BookOpen size={24} color={color} />
              </AnimatedIcon>
            ),
          }}
        />

        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon focused={focused}>
                <Calendar size={24} color={color} />
              </AnimatedIcon>
            ),
          }}
        />

        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </Animated.View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  wrapper: { flex: 1 },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabBarBase: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 20,
    borderTopWidth: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  tabBarLight: {
    backgroundColor: 'rgba(249,250,251,0.96)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },

  tabBarDark: {
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
});
