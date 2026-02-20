import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import CreatePost from './CreatePost';
import SideMenu from './side-menu';

export default function FloatingHeader() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    headerBg: isDark ? '#1E293B' : '#F9FAFB',
    menuBtnBg: isDark ? '#334155' : '#E5E7EB',
    textPrimary: isDark ? '#F9FAFB' : '#111827',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    buttonBg: '#2563EB',
    buttonText: '#FFFFFF',
  };

  const [menuVisible, setMenuVisible] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  return (
    <>
      {/* FLOATING HEADER */}
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        {/* LEFT */}
        <View style={styles.left}>
          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            style={[styles.menuBtn, { backgroundColor: colors.menuBtnBg }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.menuIcon, { color: colors.textPrimary }]}>
              ☰
            </Text>
          </TouchableOpacity>

          {/* LOGO IMAGE */}
          <Image
            source={require('@/assets/images/intelliconn-app.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          {/* TITLE */}
          <View>
            <Text style={[styles.logo, { color: colors.textPrimary }]}>
              Intelliconn
            </Text>
          </View>
        </View>

        {/* RIGHT */}
        <TouchableOpacity
          style={[styles.newPostBtn, { backgroundColor: colors.buttonBg }]}
          onPress={() => setShowCreatePostModal(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.newPostText, { color: colors.buttonText }]}>
            ＋ Create
          </Text>
        </TouchableOpacity>
      </View>

      {/* SIDE MENU */}
      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigate={(path: string) => {
          setMenuVisible(false);
          router.push(path as any);
        }}
      />

      {/* CREATE POST MODAL */}
      <CreatePost
        visible={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 33,
    left: 12,
    right: 12,
    height: 75,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 18,
    zIndex: 50,

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIcon: {
    fontSize: 20,
    fontWeight: '600',
  },

  logoImage: {
    width: 35,
    height: 35,
  },

  logo: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 18,
  },

  sub: {
    fontSize: 11,
    lineHeight: 14,
  },

  newPostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    elevation: 5,
  },

  newPostText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
