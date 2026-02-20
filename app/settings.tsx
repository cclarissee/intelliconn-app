import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import ChangePasswordModal from '@/components/ChangePasswordModal';
import ProfilePictureSection from '@/components/ProfilePictureSection';
import SecuritySettings from '@/components/SecuritySettings';
import { useAuth } from '@/contexts/AuthContext';
import { auth, db, storage } from '@/firebase';
import { Shield } from 'lucide-react-native';

/* ================= INTELLICONN THEME ================= */

const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5EAF2',
};

/* ===================================================== */

export default function SettingsScreen() {
  const { user, role, username, loading } = useAuth();
  const router = useRouter();

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState(false);

  const [activeTab, setActiveTab] = useState<
    'general' | 'notifications' | 'security'
  >('general');

  const [notifications, setNotifications] = useState({
  postPublished: true,
  approvalRequests: true,
  weeklyReports: true,
  monthlyReports: false,
});


  /* ================= FETCH USER ================= */

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserInfo(data);
        if (data.profilePicture) setProfilePicture(data.profilePicture);
      }
    };
    fetchUserData();
  }, [user]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /* ================= GENERAL TAB ================= */

  const renderGeneral = () => (
    <View style={{ marginTop: 20 }}>

      {/* HEADER */}
      <LinearGradient
        colors={[INTELLICONN.primary, INTELLICONN.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 26,
          borderRadius: 28,
          marginBottom: 24,
          shadowColor: INTELLICONN.primary,
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 14,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800' }}>
          {userInfo?.username || username}
        </Text>
        <Text
          style={{
            color: '#CFE3FF',
            marginTop: 6,
            fontSize: 14,
          }}
        >
          {user?.email}
        </Text>

        <View
          style={{
            marginTop: 18,
            alignSelf: 'flex-start',
            backgroundColor: INTELLICONN.accent,
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              color: '#003366',
              fontWeight: '700',
              fontSize: 12,
            }}
          >
            {role?.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>

      {/* ACCOUNT CARD */}
      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 24,
          padding: 22,
          marginBottom: 26,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 25,
          elevation: 8,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            marginBottom: 18,
            color: INTELLICONN.primary,
            textAlign: 'center',
          }}
        >
          Student Account Information
        </Text>

        {[
          {
            label: 'Gender',
            value: userInfo?.gender
              ? userInfo.gender.charAt(0).toUpperCase() +
                userInfo.gender.slice(1).toLowerCase()
              : '-',
          },
          { label: 'School', value: userInfo?.school || '-' },
          { label: 'Course', value: userInfo?.course || '-' },
          {
            label: 'Account Created',
            value: formatDate(userInfo?.createdAt),
          },
        ].map((item, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 14,
              borderBottomWidth: index !== 3 ? 1 : 0,
              borderColor: INTELLICONN.border,
            }}
          >
            <Text
              style={{
                color: INTELLICONN.textSecondary,
                fontWeight: '600',
              }}
            >
              {item.label}
            </Text>

            <Text
              style={{
                fontWeight: '700',
                color: INTELLICONN.textPrimary,
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {/* QUICK ACTIONS */}
      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 24,
          padding: 22,
          marginBottom: 26,
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            marginBottom: 16,
            color: INTELLICONN.primary,
          }}
        >
          Quick Actions
        </Text>

        <TouchableOpacity
          onPress={() => setShowChangePasswordModal(true)}
          style={{
            backgroundColor: '#E6F0FF',
            borderWidth: 1,
            borderColor: '#D0E3FF',
            padding: 16,
            borderRadius: 16,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontWeight: '700',
              color: INTELLICONN.primary,
            }}
          >
            🔐 Change Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/privacy')}
          style={{
            backgroundColor: '#F1F5F9',
            padding: 16,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontWeight: '700',
              color: INTELLICONN.textPrimary,
            }}
          >
            📄 Privacy Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  /* ================= NOTIFICATIONS TAB ================= */

  const renderNotifications = () => (
    <View style={{ marginTop: 20 }}>

      <View
        style={{
          backgroundColor: INTELLICONN.card,
          borderRadius: 24,
          padding: 22,
          marginBottom: 20,
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '800',
            color: INTELLICONN.primary,
            marginBottom: 10,
          }}
        >
          Notification Preferences
        </Text>

        <Text style={{ color: INTELLICONN.textSecondary }}>
          Manage how IntelliConn notifies you.
        </Text>
      </View>

      {[
        {
          key: 'postPublished',
          title: 'Post Published',
          desc: 'Notify when posts are published.',
        },
        {
          key: 'approvalRequests',
          title: 'Approval Requests',
          desc: 'Notify when approval is required.',
        },
        {
          key: 'weeklyReports',
          title: 'Weekly Reports',
          desc: 'Receive weekly analytics.',
        },
        {
          key: 'monthlyReports',
          title: 'Monthly Reports',
          desc: 'Receive monthly analytics.',
        },
      ].map((item) => (
        <View
          key={item.key}
          style={{
            backgroundColor: INTELLICONN.card,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            elevation: 4,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontWeight: '700', color: INTELLICONN.textPrimary }}>
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: INTELLICONN.textSecondary,
                marginTop: 2,
              }}
            >
              {item.desc}
            </Text>
          </View>

          <Switch
            value={notifications[item.key as keyof typeof notifications]}
            onValueChange={(value) =>
              setNotifications({
                ...notifications,
                [item.key]: value,
              })
            }
            trackColor={{
              false: '#CBD5E1',
              true: INTELLICONN.primary,
            }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );

return (
  <View style={{ flex: 1, backgroundColor: INTELLICONN.background }}>

    {/* ===== SETTINGS HEADER ===== */}
    <LinearGradient
      colors={[INTELLICONN.primary, INTELLICONN.secondary]}
      style={{
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontSize: 22,
            fontWeight: '800',
          }}
        >
          Settings
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: 10,
            borderRadius: 14,
          }}
        >
          <Shield size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>

    {/* ===== MAIN CONTENT ===== */}
    <ScrollView
      contentContainerStyle={{
        padding: 22,
      }}
      showsVerticalScrollIndicator={false}
    >
      <ProfilePictureSection
        user={user}
        username={username}
        profilePicture={profilePicture}
        onProfilePictureUpdate={setProfilePicture}
        db={db}
        storage={storage}
      />

      {/* TABS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 24, marginBottom: 14 }}
      >
        {[
          { id: 'general', label: 'General' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'security', label: 'Security' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 26,
              borderRadius: 20,
              marginRight: 10,
              backgroundColor:
                activeTab === tab.id
                  ? INTELLICONN.primary
                  : '#E3EAF5',
              elevation: activeTab === tab.id ? 6 : 0,
            }}
          >
            <Text
              style={{
                color:
                  activeTab === tab.id
                    ? '#fff'
                    : INTELLICONN.textPrimary,
                fontWeight: '700',
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'general' && renderGeneral()}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'security' && <SecuritySettings />}

      {/* LOGOUT */}
      <TouchableOpacity
        onPress={async () => {
          await signOut(auth);
          router.replace('/login');
        }}
        style={{
          backgroundColor: INTELLICONN.primary,
          paddingVertical: 18,
          borderRadius: 22,
          alignItems: 'center',
          marginVertical: 40,
          shadowColor: INTELLICONN.primary,
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 12,
        }}
      >
        <Text
          style={{
            color: '#fff',
            fontWeight: '800',
            fontSize: 16,
          }}
        >
          Sign Out
        </Text>
      </TouchableOpacity>

      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        user={user}
      />
    </ScrollView>
  </View>
);
  
}
