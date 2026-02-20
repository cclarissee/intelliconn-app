import { useEngagement } from '@/hooks/useEngagement';
import { Facebook, Heart, Instagram, Linkedin, MessageCircle, Share2, Twitter } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlatformEngagementProps {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

const PlatformEngagement: React.FC<PlatformEngagementProps> = ({
  platform,
  likes,
  comments,
  shares,
  engagement,
}) => {
  const getPlatformIcon = () => {
    switch (platform) {
      case 'facebook':
        return <Facebook size={20} color="#1877F2" />;
      case 'instagram':
        return <Instagram size={20} color="#E4405F" />;
      case 'twitter':
        return <Twitter size={20} color="#1DA1F2" />;
      case 'linkedin':
        return <Linkedin size={20} color="#0A66C2" />;
    }
  };

  const getPlatformColor = () => {
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
        return '#6B7280';
    }
  };

  return (
    <View style={styles.platformContainer}>
      <View style={styles.platformHeader}>
        {getPlatformIcon()}
        <Text style={[styles.platformName, { color: getPlatformColor() }]}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Text>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Heart size={16} color="#FF3B30" fill="#FF3B30" />
          <Text style={styles.metricValue}>{likes}</Text>
        </View>
        <View style={styles.metric}>
          <MessageCircle size={16} color="#007AFF" />
          <Text style={styles.metricValue}>{comments}</Text>
        </View>
        <View style={styles.metric}>
          <Share2 size={16} color="#34C759" />
          <Text style={styles.metricValue}>{shares}</Text>
        </View>
      </View>
      
      <View style={styles.totalEngagement}>
        <Text style={styles.totalLabel}>Total Engagement:</Text>
        <Text style={[styles.totalValue, { color: getPlatformColor() }]}>{engagement}</Text>
      </View>
    </View>
  );
};

const TodayEngagement: React.FC = () => {
  const { engagementData, loading, getTotalLikes, getTotalComments, getTotalShares, getEngagementByPlatform, refresh } = useEngagement(1); // Last 1 day

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Today's Engagement</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading engagement data...</Text>
        </View>
      </View>
    );
  }

  const totalLikes = getTotalLikes();
  const totalComments = getTotalComments();
  const totalShares = getTotalShares();
  
  // Get platform-specific data
  const platforms: Array<'facebook' | 'instagram' | 'twitter' | 'linkedin'> = [
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
  ];
  
  const platformData = platforms
    .map((platform) => {
      const posts = getEngagementByPlatform(platform);
      const likes = posts.reduce((sum, p) => sum + p.likes, 0);
      const comments = posts.reduce((sum, p) => sum + p.comments, 0);
      const shares = posts.reduce((sum, p) => sum + p.shares, 0);
      const engagement = posts.reduce((sum, p) => sum + p.engagement, 0);
      
      return {
        platform,
        likes,
        comments,
        shares,
        engagement,
      };
    })
    .filter((data) => data.engagement > 0); // Only show platforms with engagement

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Engagement</Text>
        <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Heart size={18} color="#FF3B30" fill="#FF3B30" />
          <Text style={styles.summaryLabel}>Likes</Text>
          <Text style={styles.summaryValue}>{totalLikes}</Text>
        </View>
        <View style={styles.summaryItem}>
          <MessageCircle size={18} color="#007AFF" />
          <Text style={styles.summaryLabel}>Comments</Text>
          <Text style={styles.summaryValue}>{totalComments}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Share2 size={18} color="#34C759" />
          <Text style={styles.summaryLabel}>Shares</Text>
          <Text style={styles.summaryValue}>{totalShares}</Text>
        </View>
      </View>

      {/* Platform-Specific Engagement */}
      {platformData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No engagement data for today</Text>
          <Text style={styles.emptySubtext}>Check back later or post new content</Text>
        </View>
      ) : (
        <FlatList
          data={platformData}
          keyExtractor={(item) => item.platform}
          renderItem={({ item }) => <PlatformEngagement {...item} />}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  refreshText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  list: {
    maxHeight: 300,
  },
  platformContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  totalEngagement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
    color: '#007AFF',
  },
});

export default TodayEngagement;
