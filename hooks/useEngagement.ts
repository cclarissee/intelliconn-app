import { useAuth } from '@/contexts/AuthContext';
import { getRecentEngagement, PostAnalytics } from '@/lib/analyticsApi';
import { useEffect, useState } from 'react';

interface EngagementActivity {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  type: 'like' | 'comment' | 'share';
  user?: string;
  content?: string;
  timestamp: Date;
  postId: string;
}

export function useEngagement(days: number = 7) {
  const { user } = useAuth();
  const [engagementData, setEngagementData] = useState<PostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEngagement();
  }, [user, days]);

  const loadEngagement = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRecentEngagement(user.uid, days);
      setEngagementData(data);
    } catch (err: any) {
      console.error('Error loading engagement:', err);
      setError(err.message || 'Failed to load engagement data');
    } finally {
      setLoading(false);
    }
  };

  const getTotalEngagement = () => {
    return engagementData.reduce((sum, post) => sum + post.engagement, 0);
  };

  const getTotalLikes = () => {
    return engagementData.reduce((sum, post) => sum + post.likes, 0);
  };

  const getTotalComments = () => {
    return engagementData.reduce((sum, post) => sum + post.comments, 0);
  };

  const getTotalShares = () => {
    return engagementData.reduce((sum, post) => sum + post.shares, 0);
  };

  const getEngagementByPlatform = (platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin') => {
    return engagementData.filter(post => post.platform === platform);
  };

  const refresh = () => {
    loadEngagement();
  };

  return {
    engagementData,
    loading,
    error,
    getTotalEngagement,
    getTotalLikes,
    getTotalComments,
    getTotalShares,
    getEngagementByPlatform,
    refresh,
  };
}
