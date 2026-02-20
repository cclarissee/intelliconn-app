import { useAuth } from '@/contexts/AuthContext';
import { useDashboardLoading } from '@/contexts/DashboardLoadingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { auth } from '@/firebase';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { signOut as firebaseSignOut } from 'firebase/auth';
import type { ComponentProps } from 'react';
import { useEffect, useRef } from 'react';

import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

type IconName = ComponentProps<typeof FontAwesome>['name'];

const NAV_ITEMS: {
  label: string;
  icon: IconName;
  path: string;
}[] = [
  { label: 'Dashboard', icon: 'home', path: '/dashboard' },
  { label: 'Posts', icon: 'file-text', path: '/post' },
  { label: 'Templates', icon: 'book', path: '/template' },
  { label: 'Schedule', icon: 'calendar', path: '/schedule' },
  { label: 'Analytics', icon: 'bar-chart', path: '/analytics' },
  { label: 'Settings', icon: 'cog', path: '/settings' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  navigate: (path: string) => void;
};

export default function SideMenu({ visible, onClose, navigate }: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setDashboardLoading, dashboardLoading } = useDashboardLoading();
  const pathname = usePathname();


  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
  if (!dashboardLoading) return;

  progressAnim.setValue(0);

  Animated.timing(progressAnim, {
    toValue: 1,
    duration: 1200,
    useNativeDriver: false,
  }).start();

  const timer = setTimeout(() => {
    navigate('/dashboard');   
    onClose();              
    setDashboardLoading(false);
  }, 3000);

  return () => clearTimeout(timer);
}, [dashboardLoading]);

  const colors =
    theme === 'dark'
      ? {
          overlay: 'rgba(0,0,0,0.7)',
          menuBg: '#1E293B',
          title: '#F9FAFB',
          subtitle: '#94A3B8',
          navItem: '#334155',
          navText: '#F9FAFB',
          navIcon: '#94A3B8',
          activeBg: '#3B82F6',
          activeText: '#fff',
          closeBtn: '#334155',
          closeText: '#F9FAFB',
          footerBorder: '#475569',
          signOutBg: '#EF4444',
          signOutText: '#fff',
        }
      : {
          overlay: 'rgba(15,23,42,0.55)',
          menuBg: '#fff',
          title: '#0F172A',
          subtitle: '#64748B',
          navItem: '#F8FAFC',
          navText: '#0F172A',
          navIcon: '#64748B',
          activeBg: '#3B82F6',
          activeText: '#fff',
          closeBtn: '#E2E8F0',
          closeText: '#0F172A',
          footerBorder: '#E5E7EB',
          signOutBg: '#EF4444',
          signOutText: '#fff',
        };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: visible ? 0 : -width,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    onClose();
    navigate('/login');
  };

  if (!visible) return null;

  return (
    <View style={styles.overlayRoot}>
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim, backgroundColor: colors.overlay }]}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: slideAnim }], backgroundColor: colors.menuBg },
        ]}
      >
        {/* HEADER */}
        <View style={styles.menuHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('@/assets/images/intelliconn-app.png')}
              style={{ width: 34, height: 34, marginRight: 10 }}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.menuTitle, { color: colors.title }]}>
                Intelliconn
              </Text>
              <Text style={{ color: colors.subtitle }}>
                Social Media AI
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.closeBtn }]}
          >
            <Text style={{ color: colors.closeText, fontWeight: '700' }}>✕</Text>
          </Pressable>
        </View>

{/* NAVIGATION */}
<ScrollView>
  {NAV_ITEMS.map((item) => {
    const active =
      pathname === item.path ||
      pathname.startsWith(item.path + '/');

    return (
      <TouchableOpacity
        key={item.path}
        style={[
          styles.navItem,
          {
            backgroundColor: active
              ? colors.activeBg
              : colors.navItem,
          },
        ]}
        onPress={() => {
          if (item.path === '/dashboard') {
            setDashboardLoading(true);
          } else {
            navigate(item.path);
            onClose();
          }
        }}
      >
        <FontAwesome
          name={item.icon}
          size={20}
          color={active ? colors.activeText : colors.navIcon}
        />

        <Text
          style={[
            styles.navText,
            {
              color: active
                ? colors.activeText
                : colors.navText,
            },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</ScrollView>


        {/* FOOTER */}
        <View style={[styles.menuFooter, { borderTopColor: colors.footerBorder }]}>
          {user && (
            <View style={styles.userCard}>
              {user.photoURL && (
                <Image source={{ uri: user.photoURL }} style={styles.avatar} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: colors.title }]}>
                  {user.displayName || user.email}
                </Text>
                <Text style={[styles.userEmail, { color: colors.subtitle }]}>
                  {user.email}
                </Text>
              </View>
            </View>
          )}

          {/* EXACT same spacing as second code */}
          <View style={{ marginTop: 70 }}>
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: colors.signOutBg }]}
              onPress={handleSignOut}
            >
              <Text style={{ color: colors.signOutText, fontWeight: '700' }}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* LOADING DASHBOARD OVERLAY */}
      {dashboardLoading && (
        <LinearGradient
          colors={['#BFDBFE', '#FFFFFF', '#FEF3C7']}
          style={styles.loaderOverlay}
        >
          <Animated.View
            style={[
              styles.loaderCard,
              {
                transform: [
                  {
                    scale: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: progressAnim.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0, 1, 1],
                }),
              },
            ]}
          >
            <Image
              source={require('@/assets/images/intelliconn-app.png')}
              style={styles.splashLogo}
            />
            <Text style={styles.splashTitle}>IntelliConn</Text>
            <Text style={styles.splashSubtitle}>
              AI-Powered Social Media{'\n'}Management for Schools
            </Text>
          </Animated.View>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: { position: 'absolute', inset: 0, zIndex: 999 },
  overlay: { ...StyleSheet.absoluteFillObject },

  menuContainer: {
    position: 'absolute',
    width: 280,
    height: '100%',
    paddingTop: 60,
    paddingHorizontal: 20,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
  },

  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  menuTitle: { fontSize: 26, fontWeight: '800' },
  closeButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  navItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10 },
  navText: { marginLeft: 14, fontSize: 16, fontWeight: '700' },

  menuFooter: { borderTopWidth: 1, paddingTop: 16, paddingBottom: 24 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 12, backgroundColor: 'rgba(148,163,184,0.08)' },
  userName: { fontSize: 15, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },

  signOutButton: { padding: 12, borderRadius: 14, bottom: 80 },

  loaderOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  loaderCard: { backgroundColor: '#fff', borderRadius: 22, padding: 32, alignItems: 'center' },
  splashLogo: { width: 80, height: 80, marginBottom: 16,  borderRadius: 20 },
  splashTitle: { fontSize: 26, fontWeight: '800', color: '#1E3A8A' },
  splashSubtitle: { textAlign: 'center', fontSize: 14, color: '#2563EB', marginTop: 6 },
});
