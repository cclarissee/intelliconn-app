/**
 * Example: Analytics Screen with Success Notification
 * 
 * This file demonstrates how to integrate the SuccessNotification
 * component into the Analytics screen for like deletion feedback.
 */

import SuccessNotification from '@/components/SuccessNotification';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSuccessNotification } from '@/hooks/useSuccessNotification';
import { getAllPlatformAnalytics, PlatformAnalytics } from '@/lib/analyticsApi';
import { deleteAnalytics } from '@/lib/analyticsDatabase';
import { bulkUpdateAnalytics } from '@/lib/analyticsUpdater';
import { RefreshCw, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

/**
 * Example implementation of Analytics screen with success notifications
 */
export default function AnalyticsScreenExample() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize success notification hook
  const { showSuccess, notificationProps } = useSuccessNotification();

  const colors = theme === 'dark'
    ? {
        background: '#0F172A',
        textPrimary: '#F9FAFB',
        textSecondary: '#94A3B8',
        cardBg: '#1E293B',
        chartLabel: '#CBD5E1',
        chartLine: '#6366F1',
        shadow: '#000',
      }
    : {
        background: '#F9FAFB',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
        cardBg: '#fff',
        chartLabel: '#6B7280',
        chartLine: '#6366F1',
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
      console.log('[Analytics Screen] Refreshing analytics...');

      // Update analytics for all posts
      await bulkUpdateAnalytics(user.uid, []);

      // Reload analytics
      const analytics = await getAllPlatformAnalytics(user.uid);
      console.log('[Analytics Screen] Refreshed analytics:', analytics);
      setPlatformAnalytics(analytics);

      // Show success notification
      showSuccess({
        title: '✅ Analytics Updated',
        message: 'Your engagement data has been refreshed',
        duration: 3000,
      });
    } catch (error) {
      console.error('[Analytics Screen] Error refreshing analytics:', error);
      Alert.alert('Error', 'Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Delete an analytics record with success notification
   */
  const handleDeleteAnalytics = async (analyticsId: string, platform: string) => {
    Alert.alert(
      'Delete Analytics',
      `Are you sure you want to delete the ${platform} analytics record? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the analytics record
              await deleteAnalytics(analyticsId);

              // Show success notification with platform name
              showSuccess({
                title: '✅ Like Removed',
                message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} analytics deleted successfully`,
                duration: 4000,
              });

              // Reload analytics to reflect changes
              await loadAnalytics();
            } catch (error) {
              console.error('[Analytics Screen] Error deleting analytics:', error);
              Alert.alert('Error', 'Failed to delete analytics record');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.chartLine} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Success Notification */}
      <SuccessNotification {...notificationProps} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Refresh Button */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw
              size={20}
              color={colors.chartLine}
              style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}
            />
          </TouchableOpacity>
        </View>

        {/* Platform Analytics Cards */}
        {platformAnalytics.length > 0 ? (
          platformAnalytics.map((platform) => (
            <View key={platform.platform} style={[styles.card, { backgroundColor: colors.cardBg }]}>
              <View style={styles.platformHeader}>
                <Text style={[styles.platformName, { color: colors.textPrimary }]}>
                  {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                </Text>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAnalytics(platform.id, platform.platform)}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Analytics Stats */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {platform.totalPosts}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Likes</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {platform.totalLikes}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Comments</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {platform.totalComments}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Shares</Text>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {platform.totalShares}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No analytics data yet
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
};
