import FloatingHeader from '@/components/FloatingHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAnimatedRefresh } from '@/hooks/useAnimatedRefresh';
import { getAllPlatformAnalytics, PlatformAnalytics } from '@/lib/analyticsApi';
import { bulkUpdateAnalytics } from '@/lib/analyticsUpdater';
import { Facebook, Instagram, Linkedin, RefreshCw, Twitter } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { spinAnim, pulseAnim, scaleAnim, glowAnim, startAnimation, stopAnimation } = useAnimatedRefresh();

  const INTELLICONN = {
  primary: '#0A3D91',
  secondary: '#1565C0',
  accent: '#00C2FF',
  background: '#F4F7FB',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

  // Light / Dark theme colors
const colors =
  theme === 'dark'
    ? {
        background: '#0B1E3A',
        cardBg: '#132B4F',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0AEC0',
        chartLine: INTELLICONN.accent,
        chartLabel: '#CBD5E1',
        shadow: '#000',
      }
    : {
        background: INTELLICONN.background,
        cardBg: INTELLICONN.card,
        textPrimary: INTELLICONN.textPrimary,
        textSecondary: INTELLICONN.textSecondary,
        chartLine: INTELLICONN.primary,
        chartLabel: INTELLICONN.textSecondary,
        shadow: '#000',
      };


  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('[Analytics Screen] Loading analytics for user:', user.uid);
      const analytics = await getAllPlatformAnalytics(user.uid);
      console.log('[Analytics Screen] Loaded analytics:', analytics.length, 'platforms');
      setPlatformAnalytics(analytics);
    } catch (error) {
      console.error('[Analytics Screen] Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    if (!user || refreshing) return;
    
    try {
      setRefreshing(true);
      startAnimation();
      console.log('[Analytics Screen] Refreshing analytics...');
      
      // Update analytics for all posts
      await bulkUpdateAnalytics(user.uid, []);
      
      // Reload analytics
      const analytics = await getAllPlatformAnalytics(user.uid);
      console.log('[Analytics Screen] Refreshed analytics:', analytics);
      setPlatformAnalytics(analytics);
      
      Alert.alert('Success', `Analytics refreshed! Found data for ${analytics.length} platform(s).`);
    } catch (error) {
      console.error('[Analytics Screen] Error refreshing analytics:', error);
      Alert.alert('Error', 'Failed to refresh analytics. Check console for details.');
    } finally {
      setRefreshing(false);
      stopAnimation();
    }
  };

  // Calculate totals across all platforms
  const totalPosts = platformAnalytics.reduce((sum, p) => sum + p.totalPosts, 0);
  const totalEngagement = platformAnalytics.reduce((sum, p) => sum + p.totalEngagement, 0);
  const totalLikes = platformAnalytics.reduce((sum, p) => sum + p.totalLikes, 0);
  const totalReach = platformAnalytics.reduce((sum, p) => sum + p.totalReach, 0);

  const kpiData = [
    { title: 'Total Posts', value: totalPosts },
    { title: 'Engagement', value: totalEngagement },
    { title: 'Likes', value: totalLikes },
    { title: 'Reach', value: totalReach },
  ];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook size={24} color="#1877F2" />;
      case 'instagram':
        return <Instagram size={24} color="#E4405F" />;
      case 'twitter':
        return <Twitter size={24} color="#1DA1F2" />;
      case 'linkedin':
        return <Linkedin size={24} color="#0A66C2" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return '#1877F2';
      case 'instagram':
        return '#E4405F';
      case 'twitter':
        return '#1DA1F2';
      case 'linkedin':
        return '#0A66C2';
      default:
        return colors.chartLine;
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.chartLine} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading analytics...</Text>
      </View>
    );
  }

return (
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    {/* Floating Header */}
    <FloatingHeader />

    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 120, 
        paddingBottom: 90, 
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshAnalytics}
          tintColor={colors.chartLine}
          colors={[colors.chartLine]}
        />
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary }}>Analytics</Text>
        </View>
        <TouchableOpacity
          onPress={refreshAnalytics}
          disabled={refreshing}
          style={{
            backgroundColor: colors.cardBg,
            padding: 12,
            borderRadius: 12,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {refreshing ? (
            <Animated.View
              style={{
                transform: [
                  { rotate: spinAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) },
                  { scale: pulseAnim },
                ],
              }}
            >
              <RefreshCw size={20} color={colors.chartLine} strokeWidth={2.5} />
            </Animated.View>
          ) : (
            <RefreshCw size={20} color={colors.chartLine} />
          )}
        </TouchableOpacity>
      </View>
      <Text style={{ marginBottom: 16, fontSize: 14, color: colors.textSecondary }}>
        Overview of your social media performance.
      </Text>

      {/* KPI Boxes */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
        {kpiData.map((kpi, index) => (
<View
 key={kpi.title}
  style={{
    width: '48%',
    backgroundColor: INTELLICONN.card,
    padding: 20,
    borderRadius: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 6,
  }}
>
  <Text style={{ fontSize: 14, color: INTELLICONN.textSecondary }}>
    {kpi.title}
  </Text>

  <Text
    style={{
      fontSize: 26,
      fontWeight: '800',
      color: INTELLICONN.primary,
      marginTop: 8,
    }}
  >
    {kpi.value.toLocaleString()}
  </Text>
</View>

        ))}
      </View>

      {/* Line Chart */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.textPrimary }}>
        Engagement Over Time
      </Text>
      <LineChart
        data={{
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [30, 50, 45, 60, 70, 55, 80] }],
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundGradientFrom: colors.cardBg,
          backgroundGradientTo: colors.cardBg,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(10, 61, 145, ${opacity})`,
          labelColor: (opacity = 1) => colors.chartLabel,
          style: { borderRadius: 12 },
          propsForDots: { r: '6', strokeWidth: '2',  stroke: INTELLICONN.accent },
        }}
        style={{ borderRadius: 12, marginBottom: 24 }}
      />

      {/* Bar Chart */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.textPrimary }}>
        Posts Per Platform
      </Text>
      <BarChart
        data={{
          labels: platformAnalytics.length > 0 
            ? platformAnalytics.map(p => p.platform.charAt(0).toUpperCase() + p.platform.slice(1).slice(0, 3))
            : ['FB', 'IG', 'TW', 'LI'],
          datasets: [{ 
            data: platformAnalytics.length > 0 
              ? platformAnalytics.map(p => p.totalPosts)
              : [0, 0, 0, 1] // At least one value to prevent chart errors
          }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundGradientFrom: colors.cardBg,
          backgroundGradientTo: colors.cardBg,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          labelColor: (opacity = 1) => colors.chartLabel,
          style: { borderRadius: 12 },
        }}
        style={{ borderRadius: 12, marginBottom: 24 }}
        verticalLabelRotation={0}
      />

      {/* Platform-Specific Analytics */}
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
        Performance by Platform
      </Text>
      {platformAnalytics.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
            No analytics data available yet
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
            Start posting to see your analytics
          </Text>
        </View>
      ) : (
        platformAnalytics.map((platform, index) => (
          <View
            key={platform.platform}
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: colors.shadow,
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {/* Platform Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              {getPlatformIcon(platform.platform)}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: colors.textPrimary,
                  marginLeft: 8,
                  textTransform: 'capitalize',
                }}
              >
                {platform.platform}
              </Text>
              <View
                style={{
                  marginLeft: 'auto',
                  backgroundColor: getPlatformColor(platform.platform) + '20',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: getPlatformColor(platform.platform),
                  }}
                >
                  {platform.totalPosts} posts
                </Text>
              </View>
            </View>

            {/* Engagement Metrics */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Total Engagement</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 }}>
                  {platform.totalEngagement.toLocaleString()}
                </Text>
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Likes</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 }}>
                  {platform.totalLikes.toLocaleString()}
                </Text>
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Comments</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 }}>
                  {platform.totalComments.toLocaleString()}
                </Text>
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Shares</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 }}>
                  {platform.totalShares.toLocaleString()}
                </Text>
              </View>
              <View style={{ width: '48%', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Reach</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginTop: 4 }}>
                  {platform.totalReach.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Engagement Rate */}
            <View
              style={{
                marginTop: 8,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme === 'dark' ? '#334155' : '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Engagement Rate</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: getPlatformColor(platform.platform), marginTop: 4 }}>
                {platform.averageEngagementRate.toFixed(2)}%
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
    </View>
  );
}
