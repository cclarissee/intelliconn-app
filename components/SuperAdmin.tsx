import { useGlobalAnalytics } from '@/components/GlobalAnalytics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnimatedRefresh } from '@/hooks/useAnimatedRefresh';
import {
    BarChart3,
    Eye,
    FileText,
    Heart,
    RefreshCw,
    Share2,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const screenWidth = Dimensions.get('window').width;

interface SuperAdminPanelProps {
    isVisible: boolean;
}

export default function SuperAdminPanel({ isVisible }: SuperAdminPanelProps) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'posts' | 'account-api'>('overview');
    const { spinAnim, startAnimation, stopAnimation } = useAnimatedRefresh();
    const {
        globalAnalytics,
        usersSummary,
        topPosts,
        lastUpdated,
        loading,
        refreshing,
        error,
        refreshAnalytics,
    } = useGlobalAnalytics({ isVisible, topPostsLimit: 15 });

    const colors: Record<string, string> = theme === 'dark'
        ? {
            background: '#0F172A',
            textPrimary: '#F9FAFB',
            textSecondary: '#94A3B8',
            cardBg: '#1E293B',
            chartLabel: '#CBD5E1',
            chartLine: '#6366F1',
            accent: '#818CF8',
            danger: '#EF4444',
            warning: '#FCD34D',
            success: '#34D399',
            shadow: '#000',
            border: '#334155',
        }
        : {
            background: '#F9FAFB',
            textPrimary: '#0F172A',
            textSecondary: '#64748B',
            cardBg: '#fff',
            chartLabel: '#6B7280',
            chartLine: '#6366F1',
            accent: '#4F46E5',
            danger: '#EF5350',
            warning: '#FBC02D',
            success: '#66BB6A',
            shadow: '#000',
            border: '#E2E8F0',
        };

    const rotateInterpolate = useMemo(() => {
        return spinAnim.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
        });
    }, [spinAnim]);

    // Pre-calculate color variants to fix type issues
    const dangerBg = (colors.danger as string) + '15';
    const dangerBgLight = (colors.danger as string) + '10';

    const handleRefresh = async () => {
        if (refreshing) return;

        try {
            startAnimation();
            const ok = await refreshAnalytics();
            if (ok) {
                Alert.alert('Success', 'Analytics refreshed!');
            } else {
                Alert.alert('Error', 'Failed to refresh analytics');
            }
        } finally {
            stopAnimation();
        }
    };

    if (!isVisible || loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (!globalAnalytics) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.text, { color: colors.textPrimary }]}>
                    Failed to load analytics
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <BarChart3 color={colors.accent} size={24} />
                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                            Global Analytics
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleRefresh}
                        disabled={refreshing}
                    >
                        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                            <RefreshCw color={colors.accent} size={20} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                <View style={styles.headerMetaRow}>
                    <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                        Updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                    </Text>
                    {refreshing && (
                        <Text style={[styles.refreshingText, { color: colors.textSecondary }]}>
                            Refreshing...
                        </Text>
                    )}
                </View>

                {error && (
                    <View style={[styles.errorBanner, { backgroundColor: dangerBg, borderColor: colors.danger }] as any}>
                        <View style={styles.errorBannerContent}>
                            <Text style={[styles.errorBannerText, { color: colors.danger }]}>
                                Unable to load analytics. Pull to refresh.
                            </Text>
                            <TouchableOpacity
                                onPress={handleRefresh}
                                disabled={refreshing}
                                style={[
                                    styles.retryButton,
                                    {
                                        borderColor: colors.danger,
                                        backgroundColor: dangerBgLight,
                                        opacity: refreshing ? 0.6 : 1,
                                    },
                                ] as any}
                            >
                                <Text style={[styles.retryButtonText, { color: colors.danger }]}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {(['overview', 'users', 'posts', 'account-api'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tab,
                                activeTab === tab && [
                                    styles.activeTab,
                                    { borderBottomColor: colors.accent },
                                ],
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    {
                                        color: activeTab === tab ? colors.accent : colors.textSecondary,
                                    },
                                ]}
                            >
                                {tab === 'account-api' ? 'Account & API' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Content */}
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.accent}
                    />
                }
                style={styles.content}
            >
                {activeTab === 'overview' && (
                    <OverviewTab
                        globalAnalytics={globalAnalytics}
                        colors={colors}
                    />
                )}

                {activeTab === 'users' && (
                    <UsersTab
                        users={usersSummary}
                        colors={colors}
                    />
                )}

                {activeTab === 'posts' && (
                    <PostsTab
                        posts={topPosts}
                        colors={colors}
                    />
                )}

                {activeTab === 'account-api' && (
                    <AccountAndAPITab
                        colors={colors}
                    />
                )}
            </ScrollView>
        </View>
    );
}

/**
 * Account & API Settings Tab Component
 */
function AccountAndAPITab({ colors }: any) {
    return (
        <View style={styles.tabContent}>
            {/* API Keys Section */}
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Zap color={colors.accent} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        API Keys & Tokens
                    </Text>
                </View>

                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Facebook API
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            Connected & Active
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>●</Text>
                    </View>
                </View>

                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Instagram API
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            Connected & Active
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>●</Text>
                    </View>
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Threads API
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            Connected & Active
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>●</Text>
                    </View>
                </View>
            </View>

            {/* Account Section */}
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Users color={colors.accent} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Account Information
                    </Text>
                </View>

                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Email
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            admin@intelliconn.app
                        </Text>
                    </View>
                </View>

                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Role
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            Super Administrator
                        </Text>
                    </View>
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingLabel}>
                        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                            Account Status
                        </Text>
                        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                            Active & Verified
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.statusText, { color: colors.success }]}>●</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

/**
 * Overview Tab Component
 */
function OverviewTab({ globalAnalytics, colors }: any) {
    const metrics = [
        {
            label: 'Total Users',
            value: globalAnalytics.totalUsers,
            icon: Users,
            color: colors.accent,
        },
        {
            label: 'Total Posts',
            value: globalAnalytics.totalPosts,
            icon: FileText,
            color: colors.warning,
        },
        {
            label: 'Total Likes',
            value: globalAnalytics.totalLikes,
            icon: Heart,
            color: colors.danger,
        },
        {
            label: 'Total Engagement',
            value: globalAnalytics.totalEngagement,
            icon: Zap,
            color: colors.success,
        },
    ];

    const avgEngagementPerPost = globalAnalytics.totalPosts > 0 
        ? (globalAnalytics.totalEngagement / globalAnalytics.totalPosts).toFixed(1)
        : 0;

    return (
        <View style={styles.tabContent}>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                        <View
                            key={index}
                            style={[
                                styles.kpiCard,
                                {
                                    backgroundColor: colors.cardBg,
                                    borderColor: colors.border,
                                    shadowColor: colors.shadow,
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.kpiIconBg,
                                    { backgroundColor: metric.color + '20' },
                                ]}
                            >
                                <Icon color={metric.color} size={24} />
                            </View>
                            <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>
                                {metric.label}
                            </Text>
                            <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                                {metric.value.toLocaleString()}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Engagement Stats */}
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <TrendingUp color={colors.accent} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Engagement Summary
                    </Text>
                </View>

                <View style={styles.engagementStatsContainer}>
                    <View style={styles.engagementStatRow}>
                        <View style={styles.engagementStatLabel}>
                            <Text style={[styles.engagementStatText, { color: colors.textSecondary }]}>
                                Avg. Engagement/Post
                            </Text>
                        </View>
                        <Text style={[styles.engagementStatValue, { color: colors.success }]}>
                            {avgEngagementPerPost}
                        </Text>
                    </View>
                    <View style={[styles.engagementStatRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
                        <View style={styles.engagementStatLabel}>
                            <Text style={[styles.engagementStatText, { color: colors.textSecondary }]}>
                                Avg. Engagement Rate
                            </Text>
                        </View>
                        <Text style={[styles.engagementStatValue, { color: colors.warning }]}>
                            {globalAnalytics.averageEngagementRate.toFixed(2)}%
                        </Text>
                    </View>
                    <View style={[styles.engagementStatRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
                        <View style={styles.engagementStatLabel}>
                            <Text style={[styles.engagementStatText, { color: colors.textSecondary }]}>
                                Total Reach
                            </Text>
                        </View>
                        <Text style={[styles.engagementStatValue, { color: colors.accent }]}>
                            {globalAnalytics.totalReach.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Platform Breakdown */}
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <BarChart3 color={colors.accent} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Platform Breakdown
                    </Text>
                </View>

                {globalAnalytics.platformBreakdown.map((platform: any, index: number) => {
                    const totalPlatformEngagement = globalAnalytics.totalEngagement > 0
                        ? (platform.engagement / globalAnalytics.totalEngagement * 100)
                        : 0;

                    return (
                        <View key={index} style={[styles.platformRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.platformHeader}>
                                <Text style={[styles.platformName, { color: colors.textPrimary }]}>
                                    {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                                </Text>
                            </View>
                            
                            <View style={styles.platformProgress}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            backgroundColor: colors.border,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                width: `${totalPlatformEngagement}%`,
                                                backgroundColor: colors.accent,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.progressPercentage, { color: colors.textSecondary }]}>
                                    {totalPlatformEngagement.toFixed(1)}%
                                </Text>
                            </View>

                            <View style={styles.platformMetrics}>
                                <View style={styles.metricItem}>
                                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                                        Posts
                                    </Text>
                                    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                                        {platform.postCount}
                                    </Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                                        Engagement
                                    </Text>
                                    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                                        {platform.engagement.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                                        Likes
                                    </Text>
                                    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                                        {platform.likes.toLocaleString()}
                                    </Text>
                                </View>
                                <View style={styles.metricItem}>
                                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                                        Reach
                                    </Text>
                                    <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                                        {platform.reach.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Top Post */}
            {globalAnalytics.topPerformingPost && (
                <View
                    style={[
                        styles.section,
                        {
                            backgroundColor: colors.cardBg,
                            borderColor: colors.border,
                            borderWidth: 2,
                            borderLeftColor: colors.success,
                            borderLeftWidth: 4,
                            shadowColor: colors.shadow,
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                        },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <TrendingUp color={colors.success} size={20} />
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            🏆 Top Performing Post
                        </Text>
                    </View>

                    <View style={styles.topPostContent}>
                        <View style={styles.topPostMain}>
                            <View
                                style={[
                                    styles.topPostBadge,
                                    { backgroundColor: colors.accent },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.topPostBadgeText,
                                        { color: colors.cardBg },
                                    ]}
                                >
                                    {globalAnalytics.topPerformingPost.platform.toUpperCase()}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.topPostTextContent,
                                        { color: colors.textPrimary },
                                    ]}
                                    numberOfLines={2}
                                >
                                    {globalAnalytics.topPerformingPost.content ||
                                        globalAnalytics.topPerformingPost.title ||
                                        globalAnalytics.topPerformingPost.postId}
                                </Text>
                                <Text
                                    style={[
                                        styles.topPostEmail,
                                        { color: colors.textSecondary },
                                    ]}
                                    numberOfLines={1}
                                >
                                    By: {globalAnalytics.topPerformingPost.userEmail || 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.topPostMetricsContainer,
                                {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.topPostMetricRow}>
                                <View style={styles.topPostMetric}>
                                    <Heart color={colors.danger} size={16} />
                                    <View style={styles.topPostMetricRight}>
                                        <Text
                                            style={[
                                                styles.topPostMetricLabel,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Likes
                                        </Text>
                                        <Text
                                            style={[
                                                styles.topPostMetricValue,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {globalAnalytics.topPerformingPost.likes.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.topPostMetric}>
                                    <Share2 color={colors.accent} size={16} />
                                    <View style={styles.topPostMetricRight}>
                                        <Text
                                            style={[
                                                styles.topPostMetricLabel,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Shares
                                        </Text>
                                        <Text
                                            style={[
                                                styles.topPostMetricValue,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {globalAnalytics.topPerformingPost.shares.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.topPostMetricRow}>
                                <View style={styles.topPostMetric}>
                                    <Eye color={colors.warning} size={16} />
                                    <View style={styles.topPostMetricRight}>
                                        <Text
                                            style={[
                                                styles.topPostMetricLabel,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Reach
                                        </Text>
                                        <Text
                                            style={[
                                                styles.topPostMetricValue,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {globalAnalytics.topPerformingPost.reach.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.topPostMetric}>
                                    <Zap color={colors.success} size={16} />
                                    <View style={styles.topPostMetricRight}>
                                        <Text
                                            style={[
                                                styles.topPostMetricLabel,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Engagement
                                        </Text>
                                        <Text
                                            style={[
                                                styles.topPostMetricValue,
                                                { color: colors.textPrimary },
                                            ]}
                                        >
                                            {globalAnalytics.topPerformingPost.engagement.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

/**
 * Users Tab Component
 */
function UsersTab({ users, colors }: any) {
    return (
        <View style={styles.tabContent}>
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Users color={colors.accent} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        User Analytics ({users.length})
                    </Text>
                </View>

                {users.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No users found
                    </Text>
                ) : (
                    users.map((user: any, index: number) => {
                        const isTopUser = index < 3;
                        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.userRow,
                                    {
                                        borderBottomColor: colors.border,
                                        backgroundColor: isTopUser
                                            ? colors.accent + '10'
                                            : index % 2 === 0
                                                ? colors.cardBg
                                                : colors.background,
                                        borderLeftWidth: isTopUser ? 3 : 0,
                                        borderLeftColor: isTopUser ? colors.success : 'transparent',
                                        shadowColor: isTopUser ? colors.shadow : 'transparent',
                                        shadowOpacity: isTopUser ? 0.05 : 0,
                                        shadowRadius: isTopUser ? 4 : 0,
                                        elevation: isTopUser ? 1 : 0,
                                    },
                                ]}
                            >
                                <View style={styles.userRankContainer}>
                                    {medalEmoji ? (
                                        <Text style={styles.userMedal}>{medalEmoji}</Text>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.userRank,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            #{index + 1}
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.userInfo}>
                                    <View style={styles.userMainInfo}>
                                        <Text
                                            style={[
                                                styles.userName,
                                                { color: colors.textPrimary },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {user.displayName || user.email}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.userEmail,
                                                { color: colors.textSecondary },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {user.email}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.userRoleBadge,
                                            {
                                                backgroundColor:
                                                    user.role === 'superAdmin'
                                                        ? colors.danger + '20'
                                                        : user.role === 'admin'
                                                            ? colors.warning + '20'
                                                            : colors.success + '20',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.roleBadgeText,
                                                {
                                                    color:
                                                        user.role === 'superAdmin'
                                                            ? colors.danger
                                                            : user.role === 'admin'
                                                                ? colors.warning
                                                                : colors.success,
                                                },
                                            ]}
                                        >
                                            {user.role === 'superAdmin'
                                                ? 'Super Admin'
                                                : user.role === 'admin'
                                                    ? 'Admin'
                                                    : 'User'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.userStats}>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                            Posts
                                        </Text>
                                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                            {user.totalPosts}
                                        </Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                            Engagement
                                        </Text>
                                        <Text
                                            style={[
                                                styles.statValue,
                                                {
                                                    color:
                                                        user.totalEngagement > 100
                                                            ? colors.success
                                                            : user.totalEngagement > 50
                                                                ? colors.warning
                                                                : colors.textPrimary,
                                                },
                                            ]}
                                        >
                                            {user.totalEngagement.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                            Likes
                                        </Text>
                                        <Text style={[styles.statValue, { color: colors.danger }]}>
                                            {user.totalLikes.toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </View>
    );
}

/**
 * Posts Tab Component
 */
function PostsTab({ posts, colors }: any) {
    return (
        <View style={styles.tabContent}>
            <View
                style={[
                    styles.section,
                    {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 2,
                    },
                ]}
            >
                <View style={styles.sectionHeader}>
                    <TrendingUp color={colors.success} size={20} />
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Top Posts ({posts.length})
                    </Text>
                </View>

                {posts.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        No posts found
                    </Text>
                ) : (
                    posts.map((post: any, index: number) => {
                        const isTopPost = index < 3;
                        const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                        return (
                            <View
                                key={index}
                                style={[
                                    styles.postCard,
                                    {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                        borderLeftWidth: isTopPost ? 4 : 1,
                                        borderLeftColor: isTopPost ? colors.success : colors.border,
                                        shadowColor: isTopPost ? colors.shadow : 'transparent',
                                        shadowOpacity: isTopPost ? 0.08 : 0,
                                        shadowRadius: isTopPost ? 6 : 0,
                                        elevation: isTopPost ? 2 : 0,
                                    },
                                ]}
                            >
                                <View style={styles.postHeader}>
                                    <View style={styles.postBadgeContainer}>
                                        {medalEmoji ? (
                                            <Text style={styles.medalBadge}>{medalEmoji}</Text>
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.postBadge,
                                                    {
                                                        backgroundColor: colors.accent + '20',
                                                        color: colors.accent,
                                                    },
                                                ]}
                                            >
                                                #{index + 1}
                                            </Text>
                                        )}
                                        <Text
                                            style={[
                                                styles.platformBadge,
                                                {
                                                    backgroundColor: colors.warning + '20',
                                                    color: colors.warning,
                                                },
                                            ]}
                                        >
                                            {post.platform.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.postContent}>
                                    <Text
                                        style={[
                                            styles.postTitle,
                                            {
                                                color: colors.textPrimary,
                                                fontWeight: isTopPost ? '700' : '500',
                                            },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {post.content || post.title || post.postId}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.postAuthor,
                                            { color: colors.textSecondary },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        By: {post.userEmail || 'Unknown'}
                                    </Text>
                                </View>

                                <View
                                    style={[
                                        styles.postStats,
                                        { borderBottomColor: colors.border },
                                    ]}
                                >
                                    <View style={styles.postStatItem}>
                                        <Heart color={colors.danger} size={14} />
                                        <Text style={[styles.postStatValue, { color: colors.textPrimary }]}>
                                            {post.likes.toLocaleString()}
                                        </Text>
                                        <Text style={[styles.postStatLabel, { color: colors.textSecondary }]}>
                                            Likes
                                        </Text>
                                    </View>
                                    <View style={styles.postStatItem}>
                                        <MessageSquareEmoji color={colors.accent} size={14} />
                                        <Text style={[styles.postStatValue, { color: colors.textPrimary }]}>
                                            {post.comments?.toLocaleString() || '0'}
                                        </Text>
                                        <Text style={[styles.postStatLabel, { color: colors.textSecondary }]}>
                                            Comments
                                        </Text>
                                    </View>
                                    <View style={styles.postStatItem}>
                                        <Share2 color={colors.success} size={14} />
                                        <Text style={[styles.postStatValue, { color: colors.textPrimary }]}>
                                            {post.shares?.toLocaleString() || '0'}
                                        </Text>
                                        <Text style={[styles.postStatLabel, { color: colors.textSecondary }]}>
                                            Shares
                                        </Text>
                                    </View>
                                    <View style={styles.postStatItem}>
                                        <Eye color={colors.warning} size={14} />
                                        <Text style={[styles.postStatValue, { color: colors.textPrimary }]}>
                                            {post.reach?.toLocaleString() || '0'}
                                        </Text>
                                        <Text style={[styles.postStatLabel, { color: colors.textSecondary }]}>
                                            Reach
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.postEngagement}>
                                    <View style={styles.engagementContainer}>
                                        <Text
                                            style={[
                                                styles.engagementLabel,
                                                { color: colors.textSecondary },
                                            ]}
                                        >
                                            Engagement
                                        </Text>
                                        <Text
                                            style={[
                                                styles.engagementValue,
                                                {
                                                    color:
                                                        post.engagementRate > 5
                                                            ? colors.success
                                                            : post.engagementRate > 2
                                                                ? colors.warning
                                                                : colors.danger,
                                                },
                                            ]}
                                        >
                                            {post.engagementRate.toFixed(2)}%
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.engagementProgressBar,
                                            { backgroundColor: colors.border },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.engagementProgressFill,
                                                {
                                                    width: `${Math.min(
                                                        post.engagementRate * 20,
                                                        100
                                                    )}%`,
                                                    backgroundColor:
                                                        post.engagementRate > 5
                                                            ? colors.success
                                                            : post.engagementRate > 2
                                                                ? colors.warning
                                                                : colors.danger,
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </View>
    );
}

const MessageSquareEmoji = ({ color, size }: any) => (
    <Text style={{ fontSize: size || 14, color }}>💬</Text>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        paddingTop: 12,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerMetaText: {
        fontSize: 12,
    },
    refreshingText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    errorBanner: {
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    errorBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    errorBannerText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    retryButton: {
        borderWidth: 1,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    retryButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 0,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        padding: 12,
    },
    tabContent: {
        gap: 12,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    kpiCard: {
        width: '48%',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    kpiIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    kpiLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    engagementStatsContainer: {
        gap: 0,
    },
    engagementStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    engagementStatLabel: {
        flex: 1,
    },
    engagementStatText: {
        fontSize: 13,
    },
    engagementStatValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    section: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    platformRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    platformHeader: {
        marginBottom: 8,
    },
    platformName: {
        fontSize: 14,
        fontWeight: '500',
    },
    platformProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressPercentage: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 35,
        textAlign: 'right',
    },
    platformMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    topPostContent: {
        paddingVertical: 12,
    },
    topPostMain: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    topPostBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        justifyContent: 'center',
    },
    topPostBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    topPostTextContent: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    topPostEmail: {
        fontSize: 12,
        marginTop: 4,
    },
    topPostMetricsContainer: {
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        gap: 12,
    },
    topPostMetricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    topPostMetric: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    topPostMetricRight: {
        flex: 1,
    },
    topPostMetricLabel: {
        fontSize: 11,
        marginBottom: 2,
    },
    topPostMetricValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    userRankContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    userRank: {
        fontSize: 14,
        fontWeight: '700',
    },
    userMedal: {
        fontSize: 20,
    },
    userInfo: {
        flex: 1,
    },
    userMainInfo: {
        flex: 1,
        marginBottom: 4,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
    },
    userEmail: {
        fontSize: 12,
    },
    userRoleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    userStats: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 24,
        fontSize: 14,
    },
    postCard: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
        marginBottom: 8,
    },
    postHeader: {
        marginBottom: 8,
    },
    postBadgeContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    medalBadge: {
        fontSize: 18,
        marginRight: 4,
    },
    postBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    platformBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    postContent: {
        marginBottom: 10,
    },
    postTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    postAuthor: {
        fontSize: 12,
    },
    postStats: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    postStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    postStatLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    postStatValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    postEngagement: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    engagementContainer: {
        alignItems: 'flex-end',
    },
    engagementLabel: {
        fontSize: 12,
    },
    engagementValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    engagementProgressBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    engagementProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    text: {
        fontSize: 14,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    settingLabel: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 12,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 16,
    },
});
