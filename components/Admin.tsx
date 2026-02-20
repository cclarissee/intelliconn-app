import { useLocalSearchParams } from 'expo-router';
import { BarChart3, Eye, FileText, Gift, Shield, Trash2, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';

import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Post } from '../types/Post';
import OccasionTemplatesButton from './OccasionTemplatesButton';
import SuperAdminAnalytics from './SuperAdminAnalytics';
import ViewPost from './ViewPost';

interface User {
    id: string;
    email: string;
    username?: string;
    role: string;
    createdAt: any;
    lastLogin?: any;
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

interface AdminPanelProps {
    colors: any;
    isLoading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    currentUserId: string;
    users: User[];
    posts: Post[];
    stats: SystemStats;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onDeleteUser: (userId: string) => void;
    onDeletePost: (postId: string) => void;
    onBack: () => void;
}

export default function AdminPanel({
    colors,
    isLoading,
    isAdmin,
    isSuperAdmin,
    currentUserId,
    users,
    posts,
    stats,
    activeTab,
    onTabChange,
    onDeleteUser,
    onDeletePost,
    onBack,
}: AdminPanelProps) {
    const searchParams = useLocalSearchParams<{ tab?: string }>();
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    useEffect(() => {
        if (searchParams.tab === 'analytics' && isSuperAdmin) {
            onTabChange('analytics');
        }
    }, [searchParams.tab, isSuperAdmin]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading...</Text>
            </View>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const renderOverview = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System Overview</Text>

            {/* User Stats */}
            <View style={[styles.statsGrid, { marginBottom: 20 }]}>
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }]}>
                        <Users size={24} color={colors.accent} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalUsers}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.warning + '20' }]}>
                        <Shield size={24} color={colors.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.adminUsers}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Admins</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: colors.success + '20' }]}>
                        <FileText size={24} color={colors.success} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalPosts}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
                </View>
            </View>
        </View>
    );
const renderUsers = () => (
    <View style={styles.tabContent}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            User Management
        </Text>

        {users.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No users found
            </Text>
        ) : (
            users.map(user => {
                const isSuperAdminRole = user.role === 'superAdmin';
                const isAdminRole = user.role === 'admin';
                const isYou = user.id === currentUserId;

                return (
                    <View
                        key={user.id}
                        style={[
                            styles.userCard,
                            {
                                backgroundColor:
                                    isSuperAdminRole
                                        ? colors.accent + '15'
                                        : isAdminRole
                                        ? colors.warning + '20'
                                        : colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.userInfo}>
                            {/* ROLE BADGE UNDER EMAIL */}
<View style={{ marginTop: 6 }}>
    <Text
        style={[
            styles.userRole,
            {
                color: isSuperAdminRole
                    ? colors.danger
                    : isAdminRole
                    ? colors.warning
                    : colors.accent,
            },
        ]}
    >
        {isSuperAdminRole
            ? 'Faculty Admin'
            : isAdminRole
            ? 'Student Leader'
            : 'User'}
    </Text>
</View>

                            <Text
                                style={[
                                    styles.userName,
                                    { color: colors.textPrimary },
                                ]}
                            >
                                {user.username || 'N/A'}
                                {isYou && (
                                    <Text style={{ color: colors.accent }}>
                                        {' '} (You)
                                    </Text>
                                )}
                            </Text>

                            <Text
                                style={[
                                    styles.userEmail,
                                    { color: colors.textSecondary },
                                ]}
                            >
                                {user.email}
                            </Text>
                        </View>



                        {/* DELETE — Only SuperAdmin can delete others */}
                        {isSuperAdmin &&
                            !isYou &&
                            !isSuperAdminRole && (
                                <TouchableOpacity
                                    onPress={() =>
                                        onDeleteUser(user.id)
                                    }
                                >
                                    <Trash2
                                        size={20}
                                        color={colors.danger}
                                    />
                                </TouchableOpacity>
                            )}
                    </View>
                );
            })
        )}
    </View>
);

    const renderPosts = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Post Management</Text>
            {posts.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No posts found</Text>
            ) : (
                posts.map(post => (
                    <View
                        key={post.id}
                        style={[
                            styles.postCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.postHeader}>
                            <Text style={[styles.postStatus, { color: colors.accent }]}>{post.status}</Text>
                        </View>
                        <Text
                            style={[styles.postContent, { color: colors.textPrimary }]}
                            numberOfLines={2}
                        >
                            {post.content}
                        </Text>
                        <View style={styles.postActions}>
                            <TouchableOpacity onPress={() => setSelectedPost(post)}>
                                <Eye size={20} color={colors.accent} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onDeletePost(post.id)}>
                                <Trash2 size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    const renderTemplates = () => (
        <View style={styles.tabContent}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Template Management</Text>
            <OccasionTemplatesButton />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                    <Shield size={28} color={colors.accent} />
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Admin Panel</Text>
                </View>
                <TouchableOpacity onPress={onBack}>
                    <Text style={[styles.backButton, { color: colors.accent }]}>Back</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'overview' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => onTabChange('overview')}
                    >
                        <BarChart3 size={20} color={activeTab === 'overview' ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'overview' ? colors.accent : colors.textSecondary }]}>
                            Overview
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => onTabChange('users')}
                    >
                        <Users size={20} color={activeTab === 'users' ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.accent : colors.textSecondary }]}>
                            Users
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'posts' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => onTabChange('posts')}
                    >
                        <FileText size={20} color={activeTab === 'posts' ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'posts' ? colors.accent : colors.textSecondary }]}>
                            Posts
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'templates' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                        onPress={() => onTabChange('templates')}
                    >
                        <Gift size={20} color={activeTab === 'templates' ? colors.accent : colors.textSecondary} />
                        <Text style={[styles.tabText, { color: activeTab === 'templates' ? colors.accent : colors.textSecondary }]}>
                            Templates
                        </Text>
                    </TouchableOpacity>

                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'analytics' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
                            onPress={() => onTabChange('analytics')}
                        >
                            <BarChart3 size={20} color={activeTab === 'analytics' ? colors.accent : colors.textSecondary} />
                            <Text style={[styles.tabText, { color: activeTab === 'analytics' ? colors.accent : colors.textSecondary }]}>
                                Analytics
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Content */}
            {activeTab === 'analytics' && isSuperAdmin ? (
                <SuperAdminAnalytics isVisible={activeTab === 'analytics'} />
            ) : (
                <ScrollView style={styles.content}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'users' && renderUsers()}
                    {activeTab === 'posts' && renderPosts()}
                    {activeTab === 'templates' && renderTemplates()}
                </ScrollView>
            )}

            {/* Post Modal */}
{selectedPost && (
    <Modal
        visible={!!selectedPost}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPost(null)}
    >
        <View style={styles.modalOverlay}>
           <ViewPost
    post={selectedPost}
    visible={!!selectedPost}
    onClose={() => setSelectedPost(null)}
    onEdit={() => {
        console.log('Edit post:', selectedPost);
    }}
    onDelete={() => {
        if (selectedPost) {
            onDeletePost(selectedPost.id);
            setSelectedPost(null);
        }
    }}
/>
        </View>
    </Modal>
)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    backButton: {
        fontSize: 16,
        fontWeight: '600',
    },
    tabs: {
        borderBottomWidth: 1,
    },
    tabsContainer: {
        paddingHorizontal: 16,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    tabContent: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        gap: 12,
    },
    statCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 12,
    },
    statIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        gap: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 12,
    },
    userRole: {
        fontSize: 12,
        fontWeight: '600',
        marginRight: 12,
    },
    postCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    postHeader: {
        marginBottom: 8,
    },
    postStatus: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    postContent: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    postActions: {
        flexDirection: 'row',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    loadingText: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
