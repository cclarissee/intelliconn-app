import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Plus,
  TrendingUp,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import CreatePost from '../../components/CreatePost';
import FloatingHeader from '../../components/FloatingHeader';
import ShowPost from '../../components/ShowPost';

import { useAuth } from '../../contexts/AuthContext';
import { useDashboardLoading } from '../../contexts/DashboardLoadingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { db } from '../../firebase';
import { useEngagement } from '../../hooks/useEngagement';

const { width } = Dimensions.get('window');

/* ======================= */
/* BANNER IMAGES */
/* ======================= */

const bannerImages = [
  require('../../assets/banners/banner1.png'),
  require('../../assets/banners/banner2.png'),
  require('../../assets/banners/banner3.png'),
];

/* ======================= */
/* PROFILE IMAGE PATHS */
/* ======================= */

const profileImages = {
  male: require('../../assets/profile/male.png'),
  female: require('../../assets/profile/female.png'),
  neutral: require('../../assets/profile/neutral.png'),
};

export default function DashboardScreen() {
  const { user, role, username, loading } = useAuth();
  const { theme } = useTheme();
  const { getTotalEngagement } = useEngagement(30);
  const { setDashboardLoading } = useDashboardLoading();

  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('neutral');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const isAdmin = role === 'admin' || role === 'superAdmin';

  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    engagement: 0,
  });

  /* ======================= */
/* NOTIFICATION SYSTEM */
/* ======================= */

type DashboardNotification = {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  duration?: number;
};

const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

const scheduledNotified = useRef<Set<string>>(new Set());
const publishedNotified = useRef<Set<string>>(new Set());
const postTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

const addNotification = (notification: Omit<DashboardNotification, 'id'>) => {
  const id = Date.now().toString();

  const newNotification = { ...notification, id };

  setNotifications((prev) => [...prev, newNotification]);

  setTimeout(() => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, notification.duration ?? 5000);
};

  /* ======================= */
  /* AUTH REDIRECT */
  /* ======================= */

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  /* ======================= */
  /* FETCH USER GENDER */
  /* ======================= */

const [profilePicture, setProfilePicture] = useState<string | null>(null);

useEffect(() => {
  if (!user?.uid) return;

  const unsubscribe = onSnapshot(
    doc(db, 'users', user.uid),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGender(data.gender || 'neutral');
        setProfilePicture(data.profilePicture || null);
      }
    }
  );

  return () => unsubscribe();
}, [user]);


/* ======================= */
/* DASHBOARD LOADING START */
/* ======================= */

useEffect(() => {
  setDashboardLoading(true); // hide tabs immediately
}, []);

/* ======================= */
/* POSTS SNAPSHOT */
/* ======================= */

useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, 'posts'),
    where('userId', '==', user.uid)
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const posts = snap.docs.map(doc => doc.data());
    const now = new Date();

    const scheduled = posts.filter(
      (p: any) => p.scheduledDate?.toDate() > now
    ).length;

    setStats({
      totalPosts: posts.length,
      scheduledPosts: scheduled,
      publishedPosts: posts.length - scheduled,
      engagement: getTotalEngagement(),
    });

          /* ===== Notification Logic ===== */

      snap.docs.forEach((docSnap) => {
        const post: any = { id: docSnap.id, ...docSnap.data() };
        const scheduledTime = post.scheduledDate?.toDate?.();
        if (!scheduledTime) return;

        // Scheduled notification
        if (
          scheduledTime > now &&
          !scheduledNotified.current.has(post.id)
        ) {
          addNotification({
            type: 'success',
            title: '🗓️ Post Scheduled!',
            message: `Your post "${post.title || 'Your post'}" will be published at ${scheduledTime.toLocaleString()}`,
            duration: 10000,
          });

          scheduledNotified.current.add(post.id);
        }

        // Published timer
        if (
          scheduledTime > now &&
          !postTimeouts.current[post.id]
        ) {
          const delay = scheduledTime.getTime() - now.getTime();

          postTimeouts.current[post.id] = setTimeout(() => {
            if (publishedNotified.current.has(post.id)) return;

            addNotification({
              type: 'success',
              title: '🎉 Post Published!',
              message: `Your "${post.title || 'Your post'}" was published at ${scheduledTime.toLocaleString()}`,
              duration: 12000,
            });

            publishedNotified.current.add(post.id);
            delete postTimeouts.current[post.id];
          }, delay);
        }
      });

    setTimeout(() => {
      setDashboardReady(true);
      setDashboardLoading(false); 
    }, 3500);
  });

  return () => {
    unsubscribe();
    setDashboardLoading(false);
  };
}, [user]);

if (loading || !dashboardReady) {
  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0F172A', '#020617']
          : ['#BFDBFE', '#FFFFFF', '#FEF3C7']
      }
      style={styles.dashboardLoader}
    >
      <View style={styles.loaderCard}>
        <Image
          source={require('../../assets/images/intelliconn-app.png')}
          style={styles.loaderLogo}
        />

        <Text style={styles.loaderTitle}>IntelliConn</Text>

        <Text style={styles.loaderSubtitle}>
          Preparing your dashboard...
        </Text>
      </View>
    </LinearGradient>
  );
}

  if (!user) return null;

  
  return (
    <View style={{ flex: 1, backgroundColor: '#EFF6FF' }}>
      <FloatingHeader />

      {/* ================= Notifications Toast ================= */}
      <View
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          zIndex: 999,
          paddingHorizontal: 16,
        }}
      >
        {notifications.map((n) => (
          <View
            key={n.id}
            style={{
              backgroundColor:
                n.type === 'success' ? '#10B981' : '#EF4444',
              padding: 12,
              borderRadius: 12,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 2 }}>
              {n.title}
            </Text>
            <Text style={{ color: '#fff', fontSize: 14 }}>
              {n.message}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 110, paddingBottom: 90 }}>

        {/* ======= EVERYTHING ELSE REMAINS UNCHANGED ======= */}

        {/* HEADER */}
        <View style={{ height: 220, marginBottom: 24 }}>
          <FlatList
            horizontal
            data={bannerImages}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={item}
                style={{ width, height: 220 }}
                resizeMode="cover"
              />
            )}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            style={{ position: 'absolute' }}
          />

          <View
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          />

          <View
            style={{
              position: 'absolute',
              bottom: 20,
              left: 16,
              right: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
  source={
    profilePicture
      ? { uri: profilePicture }
      : profileImages[gender]
  }
  style={{
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  }}
/>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff' }}>
                Dashboard
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#fff', marginTop: 6 }}>
             Welcome back, {user.displayName || username}! Here's what's happening with your social media. Your latest engagement metrics and top posts are ready.
            </Text>
          </View>
        </View>

{(role === 'admin' || role === 'superAdmin') && (
  <TouchableOpacity
    style={styles.adminButton}
    onPress={() =>
      router.push(
        role === 'superAdmin'
          ? '/faculty-admin'
          : '/student-leader'
      )
    }
  >
    <Text style={styles.adminButtonText}>
      🛡️ {role === 'superAdmin'
        ? 'Faculty Admin Panel'
        : 'Student Leader Panel'}
    </Text>
  </TouchableOpacity>
)}

        <View style={styles.row}>
          <AdvancedStatCard
            title="Total Posts"
            value={stats.totalPosts}
            gradient={['#4F46E5', '#6366F1']}
            icon={<Eye color="#fff" />}
          />
          <AdvancedStatCard
            title="Scheduled"
            value={stats.scheduledPosts}
            gradient={['#F59E0B', '#F97316']}
            icon={<Clock color="#fff" />}
          />
        </View>

        <View style={styles.row}>
          <AdvancedStatCard
            title="Published"
            value={stats.publishedPosts}
            gradient={['#10B981', '#22C55E']}
            icon={<CheckCircle color="#fff" />}
          />
          <AdvancedStatCard
            title="Engagement"
            value={stats.engagement}
            gradient={['#EC4899', '#F43F5E']}
            icon={<Heart color="#fff" />}
          />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          <ShowPost />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          {/* ===== QUICK ACTION ROW ===== */}
<View style={{ paddingHorizontal: 16, marginTop: 20 }}>
  <Text style={styles.sectionTitle}>Quick Actions</Text>
</View>

          <QuickActionCard
            title="Create New Post"
            subtitle="Start with AI assistance"
            icon={<Plus color="#fff" />}
            gradient={['#4F46E5', '#6366F1']}
            onPress={() => setShowCreatePost(true)}
          />
          <QuickActionCard
            title="Schedule Posts"
            subtitle="Plan your content"
            icon={<Calendar color="#fff" />}
            gradient={['#10B981', '#22C55E']}
            onPress={() => router.push('/schedule')}
          />
          <QuickActionCard
            title="Analytics"
            subtitle="Track performance"
            icon={<TrendingUp color="#fff" />}
            gradient={['#8B5CF6', '#7C3AED']}
            onPress={() => router.push('/analytics')}
          />
        </View>
      </ScrollView>

      <CreatePost
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />
    </View>
  );

}

/* ======================= */
/* COMPONENTS */
/* ======================= */

function AdvancedStatCard({ title, value, icon, gradient }: any) {
  return (
    <LinearGradient colors={gradient} style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {icon}
    </LinearGradient>
  );
}

function QuickActionCard({ title, subtitle, icon, gradient, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickCard}>
      <LinearGradient colors={gradient} style={styles.quickIcon}>
        {icon}
      </LinearGradient>

      <View style={styles.quickContent}>
        <Text style={styles.quickTitle}>{title}</Text>
        <Text style={styles.quickSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ======================= */
/* STYLES */
/* ======================= */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  bannerContent: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },

  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },

  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 6,
  },

  adminButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4F46E5',
  },

  adminButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  row: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 17,
    padding: 18,
  },

  statTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  quickCard: {
    flexDirection: 'row',
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },

  quickIcon: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  quickContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
  },

  quickTitle: {
    fontWeight: '700',
    fontSize: 16,
  },

  quickSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  dashboardLoader: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

loaderCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 22,
  paddingVertical: 36,
  paddingHorizontal: 40,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 8,
},

loaderLogo: {
  width: 80,
  height: 80,
  marginBottom: 16,
   borderRadius: 20,
},

loaderTitle: {
  fontSize: 26,
  fontWeight: '800',
  color: '#1E3A8A',
},

loaderSubtitle: {
  marginTop: 8,
  fontSize: 14,
  color: '#2563EB',
  textAlign: 'center',
},

});
