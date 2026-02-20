import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, DocumentData, getDoc, getDocs, limit, onSnapshot, orderBy, query, QuerySnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from "firebase/functions";
import { AlertCircle, BarChart3, CheckCircle, Edit, Eye, FileText, MessageSquare, Plus, Settings, Shield, Trash2, TrendingUp, UserCheck, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Animated, Image, Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ConnectedAccountsModal from '../components/ConnectedAccountsModal';
import CreateAnnouncment, { AnnouncementFormValues } from '../components/CreateAnnouncment';
import ManualTokenModal from '../components/ManualTokenModal';
import SuperAdminAnalytics from '../components/SuperAdminAnalytics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { db, functions } from '../firebase';
import { useAnimatedRefresh } from '../hooks/useAnimatedRefresh';
import { deleteAnalyticsByPost } from '../lib/analyticsDatabase';
import { Announcement, createAnnouncement, getAnnouncements, updateAnnouncement } from '../lib/announcementsApi';
import { fetchGeminiApiKey, persistGeminiApiKey } from '../lib/geminiApi';
import { fetchTwitterApiKeys, persistTwitterApiKeys } from '../lib/twitterApiKeys';
import { fetchUnsplashApiKey, persistUnsplashApiKey } from '../lib/unsplashApi';
import styles from './/styles/adminStyles';
const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
  iconBg: '#E8F1FF',
};

interface User {
    id: string;
    email: string;
    username?: string;
    role: string;
    gender?: 'male' | 'female' | 'neutral';
    profilePicture?: string;  
    createdAt: any;
    lastLogin?: any;
}

interface AuthUser {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    disabled?: boolean;
    createdAt?: string | null;
    lastSignInTime?: string | null;
}

interface Post {
    id: string;
    content: string;
   status: 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'published' ;   
   userId: string;
    createdAt: any;
    platforms?: {
    facebook?: boolean;
    instagram?: boolean;
    twitter?: boolean;
  };

  publishedPlatforms?: string[];

}

interface SystemStats {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    pendingPosts: number;
}

interface AuditLog {
    id: string;
    action: 'read' | 'write';
    success: boolean;
    error: string | null;
    userId: string;
    userEmail: string;
    timestamp: any;
}

interface AdminRequest {
    id: string;
    targetUserId: string;
    targetUserEmail: string;
    targetUsername?: string;
    requestedRole: string;
    currentRole: string;
    requestedBy: string;
    requestedByEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
    processedAt?: any;
    processedBy?: string;
}

export default function AdminScreen() {
    const { user, role, loading, isAdmin, isSuperAdmin } = useAuth();
    const { theme } = useTheme();
    const { startAnimation: startRefreshAnimation, stopAnimation: stopRefreshAnimation } = useAnimatedRefresh();
    const colors = INTELLICONN;
    const [users, setUsers] = useState<User[]>([]);
    const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
    const [authUsersLoading, setAuthUsersLoading] = useState(false);
    const [authUsersError, setAuthUsersError] = useState<string | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<SystemStats>({
        totalUsers: 0,
        adminUsers: 0,
        regularUsers: 0,
        totalPosts: 0,
        publishedPosts: 0,
        scheduledPosts: 0,
        pendingPosts: 0,
    });
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'announcements' | 'analytics' | 'requests' | 'integrations'>('overview');
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [unsplashApiKey, setUnsplashApiKey] = useState('');
    const [twitterConsumerKey, setTwitterConsumerKey] = useState('');
    const [twitterConsumerSecret, setTwitterConsumerSecret] = useState('');
    const [twitterAccessToken, setTwitterAccessToken] = useState('');
    const [twitterAccessTokenSecret, setTwitterAccessTokenSecret] = useState('');
    const [twitterBearerToken, setTwitterBearerToken] = useState('');
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [settingsUnlocked, setSettingsUnlocked] = useState(false);
    const [adminPassword, setAdminPassword] = useState<string>('');
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [postStatusFilter, setPostStatusFilter] = useState< 'all' | 'pending' | 'approved' | 'rejected' | 'published' | 'scheduled' | 'draft'>('all');
    const [postUserFilter, setPostUserFilter] = useState<string>('all');
    const [postSearch, setPostSearch] = useState('');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
    const [announcementSaving, setAnnouncementSaving] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set());
    const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
    const [connectedAccountsModalVisible, setConnectedAccountsModalVisible] = useState(false);
    const [connectedAccounts, setConnectedAccounts] = useState({ facebook: false, instagram: false, twitter: false });
    const [facebookLoading, setFacebookLoading] = useState(false);
    const [twitterLoading, setTwitterLoading] = useState(false);
    const [manualTokenModalVisible, setManualTokenModalVisible] = useState(false);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);

    const handleApprovePost = async (postId: string) => {
  try {
    await updateDoc(doc(db, 'posts', postId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: user?.uid || '',
    });

    Alert.alert('Approved', 'Post has been approved.');
    await loadData();
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'Failed to approve post.');
  }
};

const handleRejectPost = async (postId: string) => {
  Alert.prompt(
    'Reject Post',
    'Enter rejection reason:',
    async (reason) => {
      if (!reason) return;

      try {
        await updateDoc(doc(db, 'posts', postId), {
          status: 'rejected',
          rejectionReason: reason,
        });

        Alert.alert('Rejected', 'Post has been rejected.');
        await loadData();
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to reject post.');
      }
    }
  );
};

const [publishingId, setPublishingId] = useState<string | null>(null);

const handlePublishPost = async (post: Post) => {
  if (publishingId === post.id) return;

  try {
    setPublishingId(post.id);

    // validations here...

    const publishPost = httpsCallable(functions, "publishPost");
    const result: any = await publishPost({ postId: post.id });

    Alert.alert(
      "Success",
      `Published to: ${result.data.platforms.join(", ")}`
    );

    await loadData();

  } catch (error: any) {
    Alert.alert("Error", error.message || "Failed to publish.");
  } finally {
    setPublishingId(null);
  }
};

    // Handle deep linking with tab parameter
    const searchParams = useLocalSearchParams<{ tab?: string }>();

    useEffect(() => {
  if (!isSuperAdmin) return;

  const unsubscribe = onSnapshot(
    collection(db, 'globalConnectedAccounts'),
    (snapshot) => {
      const data: any = {};

      snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });

      setConnectedAccounts({
        facebook: data.facebook?.connected ?? false,
        instagram: data.instagram?.connected ?? false,
        twitter: data.twitter?.connected ?? false,
      });
    },
    (error) => {
      console.error('Connected accounts listener error:', error);
    }
  );

  return unsubscribe;
}, [isSuperAdmin]);
 
    useEffect(() => {
        if (searchParams.tab === 'analytics' && isSuperAdmin) {
            setActiveTab('analytics');
        }
    }, [searchParams.tab, isSuperAdmin]);

    const userLookup = useMemo(() => {
        const lookup: Record<string, User> = {};
        users.forEach(u => {
            lookup[u.id] = u;
        });
        return lookup;
    }, [users]);

    const filteredPosts = useMemo(() => {
        const searchTerm = postSearch.trim().toLowerCase();
        return posts.filter(post => {
            const matchesStatus = postStatusFilter === 'all' || post.status === postStatusFilter;
            const matchesUser = postUserFilter === 'all' || post.userId === postUserFilter;
            const author = userLookup[post.userId];
            const contentText = post.content?.toLowerCase() || '';
            const authorName = (author?.username || author?.email || '').toLowerCase();
            const searchMatch = !searchTerm || contentText.includes(searchTerm) || authorName.includes(searchTerm);
            return matchesStatus && matchesUser && searchMatch;
        });
    }, [posts, postStatusFilter, postUserFilter, postSearch, userLookup]);

    const authorOptions = useMemo(() => {
        const base = [{ id: 'all', label: 'All authors' }];
        const mapped = users
            .map(u => ({ id: u.id, label: u.username || u.email || 'Unknown user' }))
            .sort((a, b) => a.label.localeCompare(b.label));
        return [...base, ...mapped];
    }, [users]);

    const formatAuthDate = (value?: string | null) => {
        if (!value) {
            return 'Never';
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }
        return parsed.toLocaleString();
    };

    useEffect(() => {
        if (isAdmin) {
            loadData();
            loadApiKey();
            loadAdminPassword();
            loadAuditLogs();
            loadPendingRequests();
            loadAnnouncements();
        }
    }, [isAdmin]);

useEffect(() => {
  if (!user?.uid) return;

  const q = query(
    collection(db, 'users', user.uid, 'notifications'),
    orderBy('createdAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const unreadNotifications = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((n: any) => n.read === false);

      setNotifications(unreadNotifications);
    },
    (error: Error) => {
      console.log('Notification listener error:', error);
    }
  );

  return unsubscribe;
}, [user?.uid]);

const markNotificationAsRead = async (id: string) => {
  if (!user?.uid) return;

  try {
    await updateDoc(
      doc(db, 'users', user.uid, 'notifications', id),
      { read: true }
    );
  } catch (error) {
    console.log('Mark as read error:', error);
  }
};

    const loadPendingRequests = async () => {
        try {
            const requestsQuery = query(
                collection(db, 'adminRequests'),
                orderBy('createdAt', 'desc')
            );
            const requestsSnapshot = await getDocs(requestsQuery);
            const requestsData = requestsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as AdminRequest[];
            // Only show pending requests
            setPendingRequests(requestsData.filter(r => r.status === 'pending'));
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const loadAnnouncements = async () => {
        try {
            const data = await getAnnouncements();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    };


    const handleUpdateAccounts = (updates: { facebook?: boolean; instagram?: boolean; twitter?: boolean }) => {
        setConnectedAccounts(prev => ({ ...prev, ...updates }));
    };

    const loadAuditLogs = async () => {
        try {
            const logsQuery = query(
                collection(db, 'ApiKeyAuditLog'),
                orderBy('timestamp', 'desc'),
                limit(20)
            );
            const logsSnapshot = await getDocs(logsQuery);
            const logsData = logsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as AuditLog[];
            setAuditLogs(logsData);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        }
    };

    const loadAdminPassword = async () => {
        try {
            const passwordDoc = await getDoc(doc(db, 'AdminSettings', 'password'));
            if (passwordDoc.exists()) {
                setAdminPassword(passwordDoc.data().value);
            } else {
                Alert.alert('Configuration Error', 'Admin password not found in database. Please contact system administrator.');
            }
        } catch (error) {
            console.error('Error loading admin password:', error);
            Alert.alert('Error', 'Failed to load admin password. Please check your connection and try again.');
        }
    };

    const loadApiKey = async () => {
        try {
            const key = await fetchGeminiApiKey();
            setGeminiApiKey(key);
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    };

    const loadUnsplashKey = async () => {
        try {
            const key = await fetchUnsplashApiKey();
            setUnsplashApiKey(key);
        } catch (error) {
            console.error('Error loading Unsplash API key:', error);
        }
    };

    const loadTwitterApiKeys = async () => {
        try {
            const keys = await fetchTwitterApiKeys();
            setTwitterConsumerKey(keys.consumerKey || '');
            setTwitterConsumerSecret(keys.consumerSecret || '');
            setTwitterAccessToken(keys.accessToken || '');
            setTwitterAccessTokenSecret(keys.accessTokenSecret || '');
            setTwitterBearerToken(keys.bearerToken || '');
        } catch (error) {
            console.error('Error loading Twitter API keys:', error);
        }
    };

    const saveApiKey = async () => {
        if (!geminiApiKey.trim()) {
            Alert.alert('Error', 'API key cannot be empty.');
            return;
        }
        try {
            await persistGeminiApiKey(geminiApiKey);
            Alert.alert('Success', 'Gemini API key saved successfully.');
        } catch (error) {
            console.error('Error saving API key:', error);
            Alert.alert('Error', 'Failed to save API key.');
        }
    };

    const saveUnsplashKey = async () => {
        if (!unsplashApiKey.trim()) {
            Alert.alert('Error', 'Unsplash API key cannot be empty.');
            return;
        }
        try {
            await persistUnsplashApiKey(unsplashApiKey);
            Alert.alert('Success', 'Unsplash API key saved successfully.');
        } catch (error) {
            console.error('Error saving Unsplash API key:', error);
            Alert.alert('Error', 'Failed to save Unsplash API key.');
        }
    };

    const saveTwitterApiKeys = async () => {
        if (!twitterConsumerKey.trim() || !twitterConsumerSecret.trim()) {
            Alert.alert('Error', 'Consumer key and secret are required.');
            return;
        }
        if (!twitterAccessToken.trim() || !twitterAccessTokenSecret.trim()) {
            Alert.alert('Error', 'Access token and secret are required.');
            return;
        }
        try {
            await persistTwitterApiKeys({
                consumerKey: twitterConsumerKey,
                consumerSecret: twitterConsumerSecret,
                accessToken: twitterAccessToken,
                accessTokenSecret: twitterAccessTokenSecret,
                bearerToken: twitterBearerToken,
            });
            Alert.alert('Success', 'Twitter API credentials saved successfully.');
        } catch (error) {
            console.error('Error saving Twitter API keys:', error);
            Alert.alert('Error', 'Failed to save Twitter API credentials.');
        }
    };

    const handleSettingsTabClick = () => {
        if (!settingsUnlocked) {
            setPasswordModalVisible(true);
        } else {
            setActiveTab('integrations');
        }
    };

    const verifyPassword = () => {
        if (!adminPassword) {
            Alert.alert('Error', 'Admin password not loaded. Please try again.');
            return;
        }
        if (passwordInput === adminPassword) {
            setSettingsUnlocked(true);
            setPasswordModalVisible(false);
            setPasswordInput('');
            setActiveTab('integrations');
            // Load integrations data
            loadApiKey();
            loadUnsplashKey();
            loadTwitterApiKeys();
            loadAuditLogs();
        } else {
            Alert.alert('Access Denied', 'Incorrect password. Please try again.');
            setPasswordInput('');
        }
    };

    const loadData = async () => {
        try {
            // Load users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
            setUsers(usersData);

            // Load posts
            const postsSnapshot = await getDocs(collection(db, 'posts'));
            const postsData = postsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Post[];
            setPosts(postsData);

            // Calculate stats
            const adminCount = usersData.filter(u => u.role === 'admin' || u.role === 'superAdmin').length;
            const regularCount = usersData.filter(u => u.role !== 'admin' && u.role !== 'superAdmin').length;
            const publishedCount = postsData.filter(p => p.status === 'published').length;
            const scheduledCount = postsData.filter(p => p.status === 'scheduled').length;
            const pendingCount = postsData.filter(p => p.status === 'pending').length;

            setStats({
                totalUsers: usersData.length,
                adminUsers: adminCount,
                regularUsers: regularCount,
                totalPosts: postsData.length,
                publishedPosts: publishedCount,
                scheduledPosts: scheduledCount,
                pendingPosts: pendingCount,
            });
        } catch (error) {
            console.error('Error loading admin data:', error);
            Alert.alert('Error', 'Failed to load admin data.');
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        startRefreshAnimation();
        await loadData();
        setRefreshing(false);
        stopRefreshAnimation();
    };

const handleDeleteUser = async (userId: string, userRole: string) => {
    // Prevent deleting superAdmin accounts
    if (userRole === 'superAdmin') {
        Alert.alert('Access Denied', 'Faculty Admin accounts cannot be deleted.');
        return;
    }

    // Only superAdmin can delete admins
    if (userRole === 'admin' && !isSuperAdmin) {
        Alert.alert('Access Denied', 'Only faculty admins can delete admin users.');
        return;
    }

    Alert.alert(
        'Delete User',
        'Are you sure you want to delete this user? This action cannot be undone.',
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    setDeletingUserIds((prev) => new Set([...prev, userId]));

                    try {
                        await deleteDoc(doc(db, 'users', userId));
                        await loadData();
                        Alert.alert('Success', 'User deleted successfully.');
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        Alert.alert('Error', 'Failed to delete user.');
                        setDeletingUserIds((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(userId);
                            return newSet;
                        });
                    }
                },
            },
        ]
    );
};

    const handleChangeUserRole = async (userId: string, newRole: string, currentRole: string) => {
        // If regular admin is trying to promote to admin, create a request instead
        if (!isSuperAdmin && newRole === 'admin') {
            try {
                const targetUserDoc = await getDoc(doc(db, 'users', userId));
                const targetUserData = targetUserDoc.data();
                
                await addDoc(collection(db, 'adminRequests'), {
                    targetUserId: userId,
                    targetUserEmail: targetUserData?.email || 'Unknown',
                    targetUsername: targetUserData?.username || null,
                    requestedRole: newRole,
                    currentRole: currentRole,
                    requestedBy: user?.uid || '',
                    requestedByEmail: user?.email || 'Unknown',
                    status: 'pending',
                    createdAt: serverTimestamp(),
                });
                
                setModalVisible(false);
                Alert.alert(
                    'Request Submitted', 
                    'Your request to promote this user to admin has been submitted to the super admin for approval.'
                );
                await loadPendingRequests();
            } catch (error) {
                console.error('Error creating admin request:', error);
                Alert.alert('Error', 'Failed to submit request.');
            }
            return;
        }

        // Super admins can directly change roles, or regular admins can demote users
        if (!isSuperAdmin && (newRole === 'admin' || newRole === 'superAdmin' || currentRole === 'admin' || currentRole === 'superAdmin')) {
            Alert.alert('Access Denied', 'Only super admins can manage admin roles.');
            return;
        }

        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            await loadData();
            setModalVisible(false);
            Alert.alert('Success', `User role updated to ${newRole}.`);
        } catch (error) {
            console.error('Error updating user role:', error);
            Alert.alert('Error', 'Failed to update user role.');
        }
    };

    const handleApproveRequest = async (request: AdminRequest) => {
        try {
            // Update the user's role
            await updateDoc(doc(db, 'users', request.targetUserId), { 
                role: request.requestedRole 
            });
            
            // Mark request as approved
            await updateDoc(doc(db, 'adminRequests', request.id), {
                status: 'approved',
                processedAt: serverTimestamp(),
                processedBy: user?.uid || '',
            });
            
            await loadData();
            await loadPendingRequests();
            Alert.alert('Success', `User ${request.targetUserEmail} has been promoted to ${request.requestedRole}.`);
        } catch (error) {
            console.error('Error approving request:', error);
            Alert.alert('Error', 'Failed to approve request.');
        }
    };

    const handleRejectRequest = async (request: AdminRequest) => {
        try {
            // Mark request as rejected
            await updateDoc(doc(db, 'adminRequests', request.id), {
                status: 'rejected',
                processedAt: serverTimestamp(),
                processedBy: user?.uid || '',
            });
            
            await loadPendingRequests();
            Alert.alert('Request Rejected', 'The admin promotion request has been rejected.');
        } catch (error) {
            console.error('Error rejecting request:', error);
            Alert.alert('Error', 'Failed to reject request.');
        }
    };

    const handleDeletePost = async (postId: string) => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        // Mark as deleting
                        setDeletingPostIds((prev) => new Set([...prev, postId]));
                        
                        setTimeout(async () => {
                            try {
                                await deleteDoc(doc(db, 'posts', postId));
                                // Delete associated analytics data
                                await deleteAnalyticsByPost(postId);
                                await loadData();
                                Alert.alert('Success', 'Post deleted successfully.');
                            } catch (error) {
                                console.error('Error deleting post:', error);
                                Alert.alert('Error', 'Failed to delete post.');
                                setDeletingPostIds((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(postId);
                                    return newSet;
                                });
                            }
                        }, 120);
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading...</Text>
            </View>
        );
    }

    const renderSettings = () => {
        const twitterConfigured = !!(
            twitterConsumerKey &&
            twitterConsumerSecret &&
            twitterAccessToken &&
            twitterAccessTokenSecret
        );

        return (
            <View style={styles.tabContent}>
            <View style={styles.settingsHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>API & Integrations</Text>
                <TouchableOpacity
                    style={[styles.lockButton, { backgroundColor: colors.danger }]}
                    onPress={() => {
                        setSettingsUnlocked(false);
                        setActiveTab('overview');
                        setGeminiApiKey('');
                        setUnsplashApiKey('');
                        setTwitterConsumerKey('');
                        setTwitterConsumerSecret('');
                        setTwitterAccessToken('');
                        setTwitterAccessTokenSecret('');
                        setTwitterBearerToken('');
                        setConnectedAccounts({ facebook: false, instagram: false, twitter: false });
                        Alert.alert('Locked', 'Settings have been locked. Password required for next access.');
                    }}
                >
                    <Shield size={16} color="#FFFFFF" />
                    <Text style={styles.lockButtonText}>Lock</Text>
                </TouchableOpacity>
            </View>
            
            {isSuperAdmin && (
                <>
                    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingsHeader}>
                            <Settings size={24} color={colors.accent} />
                            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>Twitter/X API Credentials</Text>
                        </View>

                        <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>
                            Add your X API keys to enable API posting, editing, and deleting tweets.
                        </Text>

                        <TextInput
                            style={[styles.apiKeyInput, {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                            }]}
                            placeholder="Consumer Key"
                            placeholderTextColor={colors.textSecondary}
                            value={twitterConsumerKey}
                            onChangeText={setTwitterConsumerKey}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={[styles.apiKeyInput, {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                            }]}
                            placeholder="Consumer Secret"
                            placeholderTextColor={colors.textSecondary}
                            value={twitterConsumerSecret}
                            onChangeText={setTwitterConsumerSecret}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={[styles.apiKeyInput, {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                            }]}
                            placeholder="Access Token"
                            placeholderTextColor={colors.textSecondary}
                            value={twitterAccessToken}
                            onChangeText={setTwitterAccessToken}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={[styles.apiKeyInput, {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                            }]}
                            placeholder="Access Token Secret"
                            placeholderTextColor={colors.textSecondary}
                            value={twitterAccessTokenSecret}
                            onChangeText={setTwitterAccessTokenSecret}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            style={[styles.apiKeyInput, {
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                borderColor: colors.border,
                            }]}
                            placeholder="Bearer Token (for edit/analytics)"
                            placeholderTextColor={colors.textSecondary}
                            value={twitterBearerToken}
                            onChangeText={setTwitterBearerToken}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.accent }]}
                            onPress={saveTwitterApiKeys}
                        >
                            <Text style={styles.saveButtonText}>Save Twitter Credentials</Text>
                        </TouchableOpacity>

                        {twitterConfigured && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                                <CheckCircle size={16} color={colors.success} />
                                <Text style={[styles.statusText, { color: colors.success }]}>Twitter API Configured</Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingsHeader}>
                            <Settings size={24} color={colors.accent} />
                            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>Gemini API Key</Text>
                        </View>
                        
                        <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>
                            Configure the Gemini API key used for AI-powered features throughout the application.
                        </Text>
                        
                        <TextInput
                            style={[styles.apiKeyInput, { 
                                backgroundColor: colors.background, 
                                color: colors.textPrimary,
                                borderColor: colors.border 
                            }]}
                            placeholder="Enter Gemini API Key"
                            placeholderTextColor={colors.textSecondary}
                            value={geminiApiKey}
                            onChangeText={setGeminiApiKey}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.accent }]}
                            onPress={saveApiKey}
                        >
                            <Text style={styles.saveButtonText}>Save API Key</Text>
                        </TouchableOpacity>
                        
                        {geminiApiKey && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                                <CheckCircle size={16} color={colors.success} />
                                <Text style={[styles.statusText, { color: colors.success }]}>API Key Configured</Text>
                            </View>
                        )}
                    </View>

                    {/* Unsplash API Key */}
                    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingsHeader}>
                            <Settings size={24} color={colors.accent} />
                            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>Unsplash API Key</Text>
                        </View>
                        
                        <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>
                            Configure the Unsplash API key to enable online image search functionality in the post creator.
                        </Text>
                        
                        <TextInput
                            style={[styles.apiKeyInput, { 
                                backgroundColor: colors.background, 
                                color: colors.textPrimary,
                                borderColor: colors.border 
                            }]}
                            placeholder="Enter Unsplash Access Key"
                            placeholderTextColor={colors.textSecondary}
                            value={unsplashApiKey}
                            onChangeText={setUnsplashApiKey}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.accent }]}
                            onPress={saveUnsplashKey}
                        >
                            <Text style={styles.saveButtonText}>Save Unsplash Key</Text>
                        </TouchableOpacity>
                        
                        {unsplashApiKey && (
                            <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                                <CheckCircle size={16} color={colors.success} />
                                <Text style={[styles.statusText, { color: colors.success }]}>Unsplash Key Configured</Text>
                            </View>
                        )}
                    </View>

                    {/* Manage Connected Accounts */}
                    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.settingsHeader}>
                            <Shield size={24} color={colors.accent} />
                            <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>Manage Connected Accounts</Text>
                        </View>
                        
                        <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>Configure social media accounts for system-wide post publishing.</Text>
                        
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: colors.accent }]}
                            onPress={() => setConnectedAccountsModalVisible(true)}
                        >
                            <Text style={styles.saveButtonText}>Open Account Manager</Text>
                        </TouchableOpacity>
                        
                        {/* Connected Accounts Status */}
                        <View style={{ marginTop: 16 }}>
                            <View style={[styles.statusBadge, { backgroundColor: connectedAccounts.facebook ? colors.success + '20' : colors.textSecondary + '20' }]}>
                                <CheckCircle size={16} color={connectedAccounts.facebook ? colors.success : colors.textSecondary} />
                                <Text style={[styles.statusText, { color: connectedAccounts.facebook ? colors.success : colors.textSecondary }]}>
                                    Facebook: {connectedAccounts.facebook ? 'Connected' : 'Not Connected'}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: connectedAccounts.instagram ? colors.success + '20' : colors.textSecondary + '20', marginTop: 8 }]}>
                                <CheckCircle size={16} color={connectedAccounts.instagram ? colors.success : colors.textSecondary} />
                                <Text style={[styles.statusText, { color: connectedAccounts.instagram ? colors.success : colors.textSecondary }]}>
                                    Instagram: {connectedAccounts.instagram ? 'Connected' : 'Not Connected'}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: connectedAccounts.twitter ? colors.success + '20' : colors.textSecondary + '20', marginTop: 8 }]}>
                                <CheckCircle size={16} color={connectedAccounts.twitter ? colors.success : colors.textSecondary} />
                                <Text style={[styles.statusText, { color: connectedAccounts.twitter ? colors.success : colors.textSecondary }]}>
                                    Twitter: {connectedAccounts.twitter ? 'Connected' : 'Not Connected'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* API Key Audit Log */}
                    <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.settingsHeader}>
                    <Eye size={24} color={colors.warning} />
                    <Text style={[styles.settingsTitle, { color: colors.textPrimary }]}>Security Audit Log</Text>
                </View>
                
                <Text style={[styles.settingsDescription, { color: colors.textSecondary }]}>
                    Recent API key access attempts (last 20 entries)
                </Text>
                
                {auditLogs.length === 0 ? (
                    <View style={styles.emptyAuditLog}>
                        <Text style={[styles.emptyAuditText, { color: colors.textSecondary }]}>No activity recorded</Text>
                    </View>
                ) : (
                    <View style={styles.auditLogContainer}>
                        {auditLogs.map((log, index) => (
                            <View 
                                key={log.id} 
                                style={[
                                    styles.auditLogItem,
                                    { 
                                        backgroundColor: log.success 
                                            ? colors.success + '10' 
                                            : colors.danger + '10',
                                        borderLeftColor: log.success ? colors.success : colors.danger,
                                    }
                                ]}
                            >
                                <View style={styles.auditLogHeader}>
                                    <View style={styles.auditLogAction}>
                                        {log.success ? (
                                            <CheckCircle size={14} color={colors.success} />
                                        ) : (
                                            <AlertCircle size={14} color={colors.danger} />
                                        )}
                                        <Text style={[
                                            styles.auditLogActionText,
                                            { color: log.success ? colors.success : colors.danger }
                                        ]}>
                                            {log.action === 'read' ? '👁️ Read' : '✏️ Write'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.auditLogTime, { color: colors.textSecondary }]}>
                                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                    </Text>
                                </View>
                                <Text style={[styles.auditLogUser, { color: colors.textPrimary }]}>
                                    {log.userEmail || log.userId}
                                </Text>
                                {!log.success && log.error && (
                                    <Text style={[styles.auditLogError, { color: colors.danger }]}>
                                        Error: {log.error}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}
                
                <TouchableOpacity
                    style={[styles.refreshLogButton, { backgroundColor: colors.textSecondary }]}
                    onPress={loadAuditLogs}
                >
                    <Text style={styles.refreshLogButtonText}>Refresh Log</Text>
                </TouchableOpacity>
            </View>

            </>
            )}
        </View>
    );
    };

const renderOverview = () => (
  <View style={[styles.tabContent, { paddingHorizontal: 20, paddingTop: 10 }]}>

    <Text
      style={{
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
        marginBottom: 20,
      }}
    >
      System Overview
    </Text>

    {/* USER STATS */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>

      {/* Total Users */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          marginRight: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.primary + '15',
            marginBottom: 12,
          }}
        >
          <Users size={24} color={colors.primary} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>
          {stats.totalUsers}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          Total Users
        </Text>
      </View>

      {/* Admins */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.card,
          borderRadius: 20,
          padding: 20,
          marginLeft: 10,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 20,
          elevation: 6,
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.warning + '15',
            marginBottom: 12,
          }}
        >
          <Shield size={24} color={colors.warning} />
        </View>

        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.warning }}>
          {stats.adminUsers}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          Admins
        </Text>
      </View>
    </View>

    {/* POST STATS GRID */}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>

      {[
        {
          value: stats.totalPosts,
          label: 'Total Posts',
          icon: <FileText size={24} color={colors.success} />,
          color: colors.success,
        },
        {
          value: stats.publishedPosts,
          label: 'Published',
          icon: <CheckCircle size={24} color={colors.primary} />,
          color: colors.primary,
        },
        {
          value: stats.scheduledPosts,
          label: 'Scheduled',
          icon: <TrendingUp size={24} color={colors.warning} />,
          color: colors.warning,
        },
        {
          value: stats.pendingPosts,
          label: 'Drafts',
          icon: <AlertCircle size={24} color={colors.danger} />,
          color: colors.danger,
        },
      ].map((item, index) => (
        <View
          key={index}
          style={{
            width: '48%',
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: item.color + '15',
              marginBottom: 12,
            }}
          >
            {item.icon}
          </View>

          <Text style={{ fontSize: 20, fontWeight: '800', color: item.color }}>
            {item.value}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const getProfileImage = (gender?: string, role?: string) => {

  // Keep gender-based avatar even if admin/superAdmin
  if (gender === 'male') {
    return require('../assets/profile/male.png');
  }

  if (gender === 'female') {
    return require('../assets/profile/female.png');
  }

  // Fallback
  return require('../assets/profile/neutral.png');
};

const renderUsers = () => {
    const sortedUsers = [...users].sort((a, b) => {
        if (a.id === user?.uid) return -1;
        if (b.id === user?.uid) return 1;
        return 0;
    });

    return (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                User Management
            </Text>

            {sortedUsers.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <Users size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                        No users found
                    </Text>
                </View>
            ) : (
                sortedUsers.map(userData => {
                    const isDeleting = deletingUserIds.has(userData.id);
                    const isCurrentUser = userData.id === user?.uid;

                    return (
                        <Animated.View key={userData.id}>
                            <View
                                style={[
                                    styles.userCard,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: isCurrentUser
                                            ? colors.accent
                                            : colors.border,
                                        borderWidth: isCurrentUser ? 2 : 1,
                                    },
                                ]}
                            >
{/* USER INFO */}
<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>

    {/* PROFILE IMAGE */}
    <View
        style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            backgroundColor: colors.iconBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
        }}
    >
        <Image
source={
  userData.profilePicture
    ? { uri: userData.profilePicture }
    : getProfileImage(userData.gender, userData.role)
}            style={{
                width: 60,
                height: 60,
                borderRadius: 30,
            }}
            resizeMode="cover"
        />
    </View>

    {/* USER DETAILS */}
    <View style={{ flex: 1, minWidth: 0 }}>

        {/* NAME (ALWAYS ONE LINE) */}
        <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.textPrimary,
            }}
        >
            {userData.username || userData.email}
            {isCurrentUser && (
                <Text style={{ color: colors.accent }}>
                    {' '} (You)
                </Text>
            )}
        </Text>

        {/* EMAIL (ALWAYS ONE LINE) */}
        {userData.username && (
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: 2,
                }}
            >
                {userData.email}
            </Text>
        )}

        {/* ROLE + ACTIVE ACCOUNT */}
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 6,
                flexWrap: 'nowrap',
            }}
        >
            {/* ROLE BADGE */}
            <View
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor:
                        userData.role === 'superAdmin'
                            ? colors.danger + '20'
                            : userData.role === 'admin'
                            ? colors.warning + '20'
                            : colors.accent + '20',
                }}
            >
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color:
                            userData.role === 'superAdmin'
                                ? colors.danger
                                : userData.role === 'admin'
                                ? colors.warning
                                : colors.accent,
                    }}
                >
                    {userData.role === 'superAdmin'
                        ? 'Faculty Admin'
                        : userData.role === 'admin'
                        ? 'Student Leader'
                        : 'User'}
                </Text>
            </View>

            {/* ACTIVE ACCOUNT BADGE */}
            {isCurrentUser && (
                <View
                    style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: colors.accent + '20',
                        marginLeft: 8,
                    }}
                >
                    <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: colors.accent,
                        }}
                    >
                        Active Account
                    </Text>
                </View>
            )}
        </View>

    </View>
</View>

{/* ACTION BUTTONS */}
<View style={styles.userActions}>
  {(() => {
    const isSuperAdminRole = userData.role === 'superAdmin';
    const isAdminRole = userData.role === 'admin';
    const isRegularUser = userData.role === 'user';

    if (isCurrentUser) return null;

    /* =========================
       🟣 SUPERADMIN LOGIC
       ========================= */
    if (isSuperAdmin) {
      // Can manage Student Leader + User
      if (!isSuperAdminRole) {
        return (
          <>
            {/* Shield */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                setSelectedUser(userData);
                setModalVisible(true);
              }}
            >
              <Shield size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.danger,
                  opacity: isDeleting ? 0.5 : 1,
                },
              ]}
              disabled={isDeleting}
              onPress={() =>
                handleDeleteUser(userData.id, userData.role)
              }
            >
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        );
      }
    }

    /* =========================
       🟡 ADMIN (Student Leader) 
       ========================= */
    if (isAdmin && !isSuperAdmin) {
      // Can manage ONLY regular users
      if (isRegularUser) {
        return (
          <>
            {/* Shield */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                setSelectedUser(userData);
                setModalVisible(true);
              }}
            >
              <Shield size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.danger,
                  opacity: isDeleting ? 0.5 : 1,
                },
              ]}
              disabled={isDeleting}
              onPress={() =>
                handleDeleteUser(userData.id, userData.role)
              }
            >
              <Trash2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        );
      }
    }
    return null;
  })()}
</View>
                            </View>
                        </Animated.View>
                    );
                })
            )}
        </View>
    );
};


    const renderPosts = () => {
const statusOptions: Array<{
  key: 'all' | 'pending' | 'approved' | 'rejected' | 'published' | 'scheduled' | 'draft';
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'published', label: 'Published' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'draft', label: 'Draft' },
];

        return (
            <View style={styles.tabContent}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Content Management</Text>

                <View style={styles.filterGroup}>
                    <TextInput
                        style={[styles.filterInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card }]}
                        placeholder="Search posts or authors"
                        placeholderTextColor={colors.textSecondary}
                        value={postSearch}
                        onChangeText={setPostSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterChipRow}
>
  {statusOptions.map(option => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.filterChip,
        option.key === postStatusFilter && { backgroundColor: colors.accent },
        option.key !== postStatusFilter && { backgroundColor: colors.iconBg },
      ]}
      onPress={() => setPostStatusFilter(option.key)}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: option.key === postStatusFilter ? '#FFFFFF' : colors.textPrimary },
        ]}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

                    <View style={styles.filterRow}>
                        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Author</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
                            {authorOptions.map(option => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.filterChip,
                                        option.id === postUserFilter && { backgroundColor: colors.accent },
                                        option.id !== postUserFilter && { backgroundColor: colors.iconBg },
                                    ]}
                                    onPress={() => setPostUserFilter(option.id)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: option.id === postUserFilter ? '#FFFFFF' : colors.textPrimary },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                {filteredPosts.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                        <FileText size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No posts found</Text>
                    </View>
                ) : (
                    filteredPosts.map(post => {
                        const author = userLookup[post.userId];
                        const createdAt = post.createdAt?.seconds
                            ? new Date(post.createdAt.seconds * 1000).toLocaleString()
                            : 'Date unknown';
                        const authorInitial = (author?.username || author?.email || '?').charAt(0).toUpperCase();
                        const isDeleting = deletingPostIds.has(post.id);

                        return (
                            <Animated.View
                                key={post.id}
                            >
                                <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.postHeader}>
                                        <View style={[
                                            styles.statusBadge,
                                            { 
                                                backgroundColor: 
                                                    post.status === 'published' ? colors.success + '20' :
                                                    post.status === 'scheduled' ? colors.warning + '20' :
                                                    colors.textSecondary + '20'
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                { 
                                                    color: 
                                                    post.status === 'published' ? colors.success :
post.status === 'scheduled' ? colors.warning :
post.status === 'approved' ? colors.accent :
post.status === 'pending' ? colors.warning :
post.status === 'rejected' ? colors.danger :
colors.textSecondary

                                                }
                                            ]}>
                                                {post.status}
                                            </Text>
                                        </View>

<View style={styles.postActions}>

  {/* Publish appears ONLY when approved */}
{post.status === 'approved' && (
  <TouchableOpacity
    style={[styles.viewPostButton, { backgroundColor: colors.accent }]}
    onPress={() => handlePublishPost(post)}
  >
    <Edit size={14} color="#FFFFFF" />
    <Text style={styles.viewPostButtonText}>Edit</Text>
  </TouchableOpacity>
)}

  <TouchableOpacity
    style={[styles.viewPostButton, { backgroundColor: colors.accent }]}
    onPress={() => setSelectedPost(post)}
  >
    <Eye size={14} color="#FFFFFF" />
    <Text style={styles.viewPostButtonText}>View</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.deletePostButton, { backgroundColor: colors.danger }]}
    onPress={() => handleDeletePost(post.id)}
  >
    <Trash2 size={16} color="#FFFFFF" />
  </TouchableOpacity>

</View>

                                    </View>

                                    <View style={styles.postMetaRow}>
                                        <View style={[styles.postAvatar, { backgroundColor: colors.iconBg }]}>
                                            <Text style={[styles.postAvatarText, { color: colors.accent }]}>{authorInitial}</Text>
                                        </View>
                                        <View style={styles.postAuthorInfo}>
                                            <Text style={[styles.postAuthorName, { color: colors.textPrimary }]}>
                                                {author?.username || author?.email || 'Unknown user'}
                                            </Text>
                                            <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>
                                                {(author?.email || 'Email not available') + ' | ' + createdAt}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text 
                                        style={[styles.postContent, { color: colors.textPrimary }]}
                                        numberOfLines={3}
                                    >
                                        {post.content}
                                    </Text>
                                    {/* ===== Selected Platforms ===== */}
{post.platforms && (
  <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>

    {post.platforms.facebook && (
      <View style={{
        backgroundColor: '#1877F2' + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 11, color: '#1877F2', fontWeight: '600' }}>
          Facebook
        </Text>
      </View>
    )}

    {post.platforms.instagram && (
      <View style={{
        backgroundColor: '#E4405F' + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 11, color: '#E4405F', fontWeight: '600' }}>
          Instagram
        </Text>
      </View>
    )}

    {post.platforms.twitter && (
      <View style={{
        backgroundColor: '#1DA1F2' + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
      }}>
        <Text style={{ fontSize: 11, color: '#1DA1F2', fontWeight: '600' }}>
          Twitter/X
        </Text>
      </View>
    )}

  </View>
)}
                                    {/* ===== Pending Actions (Below Content) ===== */}
{post.status === 'pending' && (
  <View
    style={{
      flexDirection: 'row',
      marginTop: 12,
      gap: 10,
    }}
  >
    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: colors.success,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
      }}
      onPress={() => handleApprovePost(post.id)}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        Approve
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={{
        flex: 1,
        backgroundColor: colors.danger,
        paddingVertical: 8,
        borderRadius: 10,
        alignItems: 'center',
      }}
      onPress={() => handleRejectPost(post.id)}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        Reject
      </Text>
    </TouchableOpacity>
  </View>
)}
                                </View>
                            </Animated.View>
                        );
                    })
                )}
            </View>
        );
    };

    const dayMs = 24 * 60 * 60 * 1000;
    const buildExpiresAt = (days?: number | null) => {
        if (days == null || !Number.isFinite(days) || days <= 0) return null;
        return new Date(Date.now() + days * dayMs);
    };
    const getExpiresInDays = (expiresAt?: Date | null) => {
        if (!expiresAt) return undefined;
        const diffMs = expiresAt.getTime() - Date.now();
        if (!Number.isFinite(diffMs)) return undefined;
        return Math.max(0, Math.ceil(diffMs / dayMs));
    };

    const handleSaveAnnouncement = async (values: AnnouncementFormValues) => {
        setAnnouncementSaving(true);
        try {
            const expiresAt = buildExpiresAt(values.expiresInDays);
            if (selectedAnnouncement?.id) {
                await updateAnnouncement(selectedAnnouncement.id, {
                    title: values.title,
                    message: values.message,
                    type: values.type,
                    expiresAt,
                });
                Alert.alert('Success', 'Announcement updated successfully');
            } else {
                await createAnnouncement({
                    title: values.title,
                    message: values.message,
                    type: values.type,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    expiresAt,
                    isHidden: false,
                });
                // Notify about new announcement
                Alert.alert('Success', 'Announcement created successfully');
            }

            await loadAnnouncements();
            setAnnouncementModalVisible(false);
            setSelectedAnnouncement(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to save announcement');
        } finally {
            setAnnouncementSaving(false);
        }
    };

    const renderAnnouncements = () => {
        const typeColors = {
            info: { bg: '#3B82F6', label: 'Info' },
            warning: { bg: '#F59E0B', label: 'Warning' },
            critical: { bg: '#EF4444', label: 'Critical' },
            success: { bg: '#10B981', label: 'Success' },
        };

        return (
            <View style={styles.tabContent}>
                <View style={styles.announcementHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Bulletin Management
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.accent }]}
                        onPress={() => {
                            setSelectedAnnouncement(null);
                            setAnnouncementModalVisible(true);
                        }}
                    >
                        <Plus size={15} color="#FFFFFF" />
                        <Text style={styles.createButtonText}>Create</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                    Create and manage announcements in here.
                </Text>

                {announcements.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                        <MessageSquare size={48} color={colors.textSecondary} />
                        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                            No announcements yet
                        </Text>
                        <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                            Create your first announcement to notify users
                        </Text>
                    </View>
                ) : (
                    announcements.map((announcement) => {
                        const typeConfig = typeColors[announcement.type];
                        return (
                            <View
                                key={announcement.id}
                                style={[
                                    styles.announcementCard,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: colors.border,
                                        borderLeftColor: typeConfig.bg,
                                    },
                                ]}
                            >
                                <View style={styles.announcementHeader}>
                                    <View style={styles.announcementTitleRow}>
                                        <View style={[styles.typeLabel, { backgroundColor: typeConfig.bg + '20' }]}>
                                            <Text style={[styles.typeLabelText, { color: typeConfig.bg }]}>
                                                {typeConfig.label}
                                            </Text>
                                        </View>
                                        <Text style={[styles.announcementTitle, { color: colors.textPrimary }]}>
                                            {announcement.title}
                                        </Text>
                                    </View>
                                    <View style={styles.announcementActions}>
                                        <TouchableOpacity
                                            style={[styles.iconButton, { backgroundColor: colors.accent + '20' }]}
                                            onPress={() => {
                                                setSelectedAnnouncement(announcement);
                                                setAnnouncementModalVisible(true);
                                            }}
                                        >
                                            <Edit size={16} color={colors.accent} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.iconButton, { backgroundColor: colors.danger + '20' }]}
                                            onPress={() => {
                                                Alert.alert(
                                                    'Delete Announcement',
                                                    'Are you sure you want to delete this announcement?',
                                                    [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        {
                                                            text: 'Delete',
                                                            style: 'destructive',
                                                            onPress: async () => {
                                                                try {
                                                                    const { deleteAnnouncement } = await import('../lib/announcementsApi');
                                                                    await deleteAnnouncement(announcement.id);
                                                                    await loadAnnouncements();
                                                                    Alert.alert('Success', 'Announcement deleted');
                                                                } catch (error) {
                                                                    Alert.alert('Error', 'Failed to delete announcement');
                                                                }
                                                            },
                                                        },
                                                    ]
                                                );
                                            }}
                                        >
                                            <Trash2 size={16} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <Text style={[styles.announcementMessage, { color: colors.textSecondary }]}>
                                    {announcement.message}
                                </Text>

                                <View style={styles.announcementFooter}>
                                    <Text style={[styles.announcementDate, { color: colors.textSecondary }]}>
                                        Updated: {new Date(announcement.updatedAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        );
    };

    const renderRequests = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Admin Role Requests</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Manage approval workflow for admin role status.            </Text>
            {pendingRequests.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <UserCheck size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>No pending requests</Text>
                </View>
            ) : (
                pendingRequests.map(request => (
                    <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.requestHeader}>
                            <View style={[styles.requestIconContainer, { backgroundColor: colors.warning + '20' }]}>
                                <UserCheck size={24} color={colors.warning} />
                            </View>
                            <View style={styles.requestInfo}>
                                <Text style={[styles.requestTitle, { color: colors.textPrimary }]}>
                                    Admin Promotion Request
                                </Text>
                                <Text style={[styles.requestTime, { color: colors.textSecondary }]}>
                                    {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.requestDetails}>
                            <View style={styles.requestRow}>
                                <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>Target User:</Text>
                                <Text style={[styles.requestValue, { color: colors.textPrimary }]}>
                                    {request.targetUsername || request.targetUserEmail}
                                </Text>
                            </View>
                            <View style={styles.requestRow}>
                                <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>Requested By:</Text>
                                <Text style={[styles.requestValue, { color: colors.textPrimary }]}>
                                    {request.requestedByEmail}
                                </Text>
                            </View>
                            <View style={styles.requestRow}>
                                <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>Current Role:</Text>
                                <Text style={[styles.requestValue, { color: colors.accent }]}>
                                    {request.currentRole}
                                </Text>
                            </View>
                            <View style={styles.requestRow}>
                                <Text style={[styles.requestLabel, { color: colors.textSecondary }]}>Requested Role:</Text>
                                <Text style={[styles.requestValue, { color: colors.warning }]}>
                                    {request.requestedRole}
                                </Text>
                            </View>
                        </View>
                        
                        <View style={styles.requestActions}>
                            <TouchableOpacity
                                style={[styles.requestButton, styles.approveButton, { backgroundColor: colors.success }]}
                                onPress={() => handleApproveRequest(request)}
                            >
                                <CheckCircle size={18} color="#FFFFFF" />
                                <Text style={styles.requestButtonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.requestButton, styles.rejectButton, { backgroundColor: colors.danger }]}
                                onPress={() => handleRejectRequest(request)}
                            >
                                <AlertCircle size={18} color="#FFFFFF" />
                                <Text style={styles.requestButtonText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    {notifications.length > 0 && (
    <View style={{
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: colors.danger,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    }}>
        <Text style={{ color: '#fff', fontSize: 10 }}>
            {notifications.length}
        </Text>
    </View>
)}
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <LinearGradient
  colors={[colors.primary, colors.secondary]}
  style={{
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  }}
>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
    <View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>
  {isSuperAdmin ? 'Faculty Admin Panel' : 'Student Leader Panel'}
</Text>
      <Text style={{ color: '#CFE3FF', marginTop: 4 }}>
        System management and control
      </Text>
    </View>
    <TouchableOpacity
  onPress={() => router.replace('/dashboard')}
  activeOpacity={0.7}
  style={{
    padding: 6,
  }}
>
  <Shield size={28} color="#fff" />
</TouchableOpacity>
  </View>
</LinearGradient>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('overview')}
                    >
                        <BarChart3 size={20} color={activeTab === 'overview' ? colors.accent : colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'overview' ? colors.accent : colors.textSecondary }
                        ]}>
                            Overview
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('users')}
                    >
                        <Users size={20} color={activeTab === 'users' ? colors.accent : colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'users' ? colors.accent : colors.textSecondary }
                        ]}>
                            Users
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('posts')}
                    >
                        <FileText size={20} color={activeTab === 'posts' ? colors.accent : colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'posts' ? colors.accent : colors.textSecondary }
                        ]}>
                            Posts
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'announcements' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('announcements')}
                    >
                        <MessageSquare size={20} color={activeTab === 'announcements' ? colors.accent : colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'announcements' ? colors.accent : colors.textSecondary }
                        ]}>
                            Announcements
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'analytics' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab('analytics')}
                    >
                        <BarChart3 size={20} color={activeTab === 'analytics' ? colors.accent : colors.textSecondary} />
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === 'analytics' ? colors.accent : colors.textSecondary }
                        ]}>
                            Analytics
                        </Text>
                    </TouchableOpacity>

                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'requests' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                            onPress={() => setActiveTab('requests')}
                        >
                            <UserCheck size={20} color={activeTab === 'requests' ? colors.accent : colors.textSecondary} />
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === 'requests' ? colors.accent : colors.textSecondary }
                            ]}>
                                Requests
                            </Text>
                            {pendingRequests.length > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                                    <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}

                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'integrations' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                            onPress={handleSettingsTabClick}
                        >
                            <Settings size={20} color={activeTab === 'integrations' ? colors.accent : colors.textSecondary} />
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === 'integrations' ? colors.accent : colors.textSecondary }
                            ]}>
                                Integrations
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Content */}
            {activeTab === 'analytics' ? (
                <SuperAdminAnalytics isVisible={activeTab === 'analytics'} />
            ) : (
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                    }
                >
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'posts' && renderPosts()}
                    {activeTab === 'announcements' && renderAnnouncements()}
                    {activeTab === 'requests' && isSuperAdmin && renderRequests()}
                    {activeTab === 'integrations' && isSuperAdmin && renderSettings()}
                </ScrollView>
            )}

            {/* User Role Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change User Role</Text>
                        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                            {selectedUser?.username || selectedUser?.email}
                        </Text>
                        {selectedUser?.username && (
                            <Text style={[styles.modalEmail, { color: colors.textSecondary, fontSize: 12 }]}>
                                {selectedUser?.email}
                            </Text>
                        )}

                        <TouchableOpacity
                            style={[styles.roleOption, { backgroundColor: colors.accent }]}
                            onPress={() => selectedUser && handleChangeUserRole(selectedUser.id, 'admin', selectedUser.role)}
                        >
                            <Text style={styles.roleOptionText}>Make Admin</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleOption, { backgroundColor: colors.textSecondary }]}
                            onPress={() => selectedUser && handleChangeUserRole(selectedUser.id, 'user', selectedUser.role)}
                        >
                            <Text style={styles.roleOptionText}>Make Regular User</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.roleOption, { backgroundColor: colors.danger }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.roleOptionText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
  visible={notificationModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setNotificationModalVisible(false)}
>
</Modal>

            {/* Password Protection Modal */}
            <Modal
                visible={passwordModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => {
                    setPasswordModalVisible(false);
                    setPasswordInput('');
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        {/* Icon Container with Gradient Background */}
                        <View style={[styles.passwordIconContainer, { backgroundColor: colors.accent + '20' }]}>
                            <Shield size={48} color={colors.accent} strokeWidth={1.5} />
                        </View>
                        
                        {/* Title */}
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                            🔐 Protected Access
                        </Text>
                        
                        {/* Description */}
                        <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                            This area requires admin authentication. Please enter your password to continue.
                        </Text>
                        
                        {/* Password Input */}
                        <View style={{ marginBottom: 24 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                                Admin Password
                            </Text>
                            <TextInput
                                style={[styles.passwordInput, { 
                                    backgroundColor: colors.background, 
                                    color: colors.textPrimary,
                                    borderColor: colors.border,
                                    borderWidth: 1.5,
                                }]}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textSecondary}
                                value={passwordInput}
                                onChangeText={setPasswordInput}
                                secureTextEntry
                                autoFocus
                                autoCapitalize="none"
                                autoCorrect={false}
                                onSubmitEditing={verifyPassword}
                            />
                        </View>
                        
                        {/* Unlock Button */}
                        <TouchableOpacity
                            style={[styles.roleOption, { 
                                backgroundColor: colors.accent,
                                marginBottom: 10,
                            }]}
                            onPress={verifyPassword}
                            activeOpacity={0.8}
                        >
                            <Shield size={18} color="#FFFFFF" />
                            <Text style={styles.roleOptionText}>Unlock Integrations</Text>
                        </TouchableOpacity>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={[styles.roleOption, { 
                                backgroundColor: colors.border ? colors.border + '40' : colors.textSecondary + '30',
                                borderWidth: 1.5,
                                borderColor: colors.border || colors.textSecondary,
                            }]}
                            onPress={() => {
                                setPasswordModalVisible(false);
                                setPasswordInput('');
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.roleOptionText, { color: colors.textPrimary }]}>Cancel</Text>
                        </TouchableOpacity>

                        {/* Security Info */}
                        <Text style={{ 
                            fontSize: 11, 
                            color: colors.textSecondary, 
                            textAlign: 'center', 
                            marginTop: 16,
                            fontStyle: 'italic'
                        }}>
                            🔒 Your password is encrypted and secure
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Post Detail Modal */}
            <Modal
                visible={!!selectedPost}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedPost(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Post Details</Text>
                            <TouchableOpacity onPress={() => setSelectedPost(null)}>
                                <Text style={[styles.closeButton, { color: colors.danger }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {selectedPost && (
                            <ScrollView style={{ flex: 1 }}>
                                <View style={{ padding: 16 }}>
                                    {/* Status Badge */}
                                    <View style={[styles.statusBadge, { 
                                        backgroundColor: 
                                            selectedPost.status === 'published' ? colors.success + '20' :
                                            selectedPost.status === 'scheduled' ? colors.warning + '20' :
                                            colors.textSecondary + '20'
                                    }]}>
                                        <Text style={[styles.statusBadgeText, { 
                                            color: 
                                                selectedPost.status === 'published' ? colors.success :
                                                selectedPost.status === 'scheduled' ? colors.warning :
                                                colors.textSecondary
                                        }]}>
                                            {selectedPost.status}
                                        </Text>
                                    </View>
                                    
                                    {/* Author Info */}
                                    <View style={{ marginTop: 16, marginBottom: 16 }}>
                                        <Text style={[{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }]}>Author</Text>
                                        <Text style={[{ fontSize: 16, color: colors.textPrimary }]}>
                                            {userLookup[selectedPost.userId]?.username || userLookup[selectedPost.userId]?.email || 'Unknown'}
                                        </Text>
                                    </View>
                                    
                                    {/* Created Date */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={[{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }]}>Created</Text>
                                        <Text style={[{ fontSize: 14, color: colors.textPrimary }]}>
                                            {selectedPost.createdAt?.seconds
                                                ? new Date(selectedPost.createdAt.seconds * 1000).toLocaleString()
                                                : 'Date unknown'}
                                        </Text>
                                    </View>
                                    
                                    {/* Content */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={[{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }]}>Content</Text>
                                        <Text style={[{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }]}>
                                            {selectedPost.content}
                                        </Text>
                                    </View>
                                    
                                    {/* Actions */}
                                    <TouchableOpacity
                                        style={[styles.roleOption, { backgroundColor: colors.danger, marginTop: 8 }]}
                                        onPress={() => {
                                            handleDeletePost(selectedPost.id);
                                            setSelectedPost(null);
                                        }}
                                    >
                                        <Text style={styles.roleOptionText}>Delete Post</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Connected Accounts Modal */}
            <ConnectedAccountsModal
                visible={connectedAccountsModalVisible}
                onClose={() => setConnectedAccountsModalVisible(false)}
                connectedAccounts={connectedAccounts}
                onUpdateAccounts={handleUpdateAccounts}
                onOpenManualToken={() => setManualTokenModalVisible(true)}
                facebookLoading={facebookLoading}
                twitterLoading={twitterLoading}
                setFacebookLoading={setFacebookLoading}
                setTwitterLoading={setTwitterLoading}
                user={user}
                db={db}
                isSuperAdmin={isSuperAdmin}
            />

            <ManualTokenModal
  visible={manualTokenModalVisible}
  onClose={() => setManualTokenModalVisible(false)}
  onSuccess={() => {
    setConnectedAccounts(prev => ({ ...prev, facebook: true }));
    setManualTokenModalVisible(false);
  }}
  user={user}
/>

            {/* Announcement Modal */}
            <Modal
                visible={announcementModalVisible}
                animationType="slide"
                onRequestClose={() => {
                    setAnnouncementModalVisible(false);
                    setSelectedAnnouncement(null);
                }}
            >
                <CreateAnnouncment
                    initialValues={
                        selectedAnnouncement
                            ? {
                                title: selectedAnnouncement.title,
                                message: selectedAnnouncement.message,
                                type: selectedAnnouncement.type,
                                expiresInDays: getExpiresInDays(selectedAnnouncement.expiresAt),
                            }
                            : undefined
                    }
                    onCancel={() => {
                        setAnnouncementModalVisible(false);
                        setSelectedAnnouncement(null);
                    }}
                    onSubmit={handleSaveAnnouncement}
                    isLoading={announcementSaving}
                />
            </Modal>
        </View>
    );
}