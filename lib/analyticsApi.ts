import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { getGlobalConnectedAccounts } from './connectedAccounts';

export interface PostAnalytics {
  postId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement: number;
  createdAt: Date;
}

export interface PlatformAnalytics {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin';
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPost?: PostAnalytics;
}

/**
 * Get Facebook Post Insights
 */
export async function getFacebookPostInsights(
  userId: string,
  postId: string
): Promise<PostAnalytics | null> {
  try {
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount?.connected || !facebookAccount.accessToken) {
      throw new Error('Facebook account not connected');
    }

    const apiVersion = 'v18.0';
    
    // First, get basic engagement metrics (always available)
    const basicEndpoint = `https://graph.facebook.com/${apiVersion}/${postId}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${facebookAccount.accessToken}`;
    
    const basicResponse = await fetch(basicEndpoint);
    const basicData = await basicResponse.json();

    if (basicData.error) {
      console.error('Facebook Insights Error:', basicData.error);
      return null;
    }

    const likes = basicData.reactions?.summary?.total_count || 0;
    const comments = basicData.comments?.summary?.total_count || 0;
    const shares = basicData.shares?.count || 0;

    // Try to get insights (may not be available for recent posts)
    let impressions = 0;
    let engagedUsers = 0;
    let clicks = 0;

    try {
      const insightsEndpoint = `https://graph.facebook.com/${apiVersion}/${postId}/insights?metric=post_impressions,post_engaged_users&access_token=${facebookAccount.accessToken}`;
      const insightsResponse = await fetch(insightsEndpoint);
      const insightsData = await insightsResponse.json();

      if (!insightsData.error && insightsData.data) {
        insightsData.data.forEach((insight: any) => {
          if (insight.name === 'post_impressions') {
            impressions = insight.values[0]?.value || 0;
          } else if (insight.name === 'post_engaged_users') {
            engagedUsers = insight.values[0]?.value || 0;
          }
        });
      }
    } catch (e) {
      // Insights not available yet, that's okay
    }

    return {
      postId,
      platform: 'facebook',
      likes,
      comments,
      shares,
      reach: engagedUsers,
      impressions,
      engagement: likes + comments + shares,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error getting Facebook post insights:', error);
    return null;
  }
}

/**
 * Get Instagram Post Insights
 */
export async function getInstagramPostInsights(
  userId: string,
  mediaId: string
): Promise<PostAnalytics | null> {
  try {
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount?.connected || !facebookAccount.accessToken) {
      console.log('Instagram insights: Facebook account not connected');
      return null;
    }

    const apiVersion = 'v18.0';
    
    // Try to get basic engagement metrics first
    const basicEndpoint = `https://graph.facebook.com/${apiVersion}/${mediaId}?fields=like_count,comments_count&access_token=${facebookAccount.accessToken}`;
    
    try {
      const basicResponse = await fetch(basicEndpoint);
      const basicData = await basicResponse.json();

      if (basicData.error) {
        // If we get permission error, Instagram is not properly connected
        if (basicData.error.code === 10 || basicData.error.code === 190) {
          console.log('Instagram insights: Permission denied - Instagram Business account not connected or app lacks instagram_manage_insights permission');
          return null;
        }
        console.error('Instagram Insights Error:', basicData.error);
        return null;
      }

      const likes = basicData.like_count || 0;
      const comments = basicData.comments_count || 0;

      // Try to get insights (requires instagram_manage_insights permission)
      let impressions = 0;
      let reach = 0;
      let engagement = 0;

      try {
        const insightsEndpoint = `https://graph.facebook.com/${apiVersion}/${mediaId}/insights?metric=engagement,impressions,reach&access_token=${facebookAccount.accessToken}`;
        const insightsResponse = await fetch(insightsEndpoint);
        const insightsData = await insightsResponse.json();

        if (!insightsData.error && insightsData.data) {
          insightsData.data.forEach((metric: any) => {
            switch (metric.name) {
              case 'engagement':
                engagement = metric.values[0]?.value || 0;
                break;
              case 'impressions':
                impressions = metric.values[0]?.value || 0;
                break;
              case 'reach':
                reach = metric.values[0]?.value || 0;
                break;
            }
          });
        }
      } catch (e) {
        // Insights not available, use basic metrics only
        engagement = likes + comments;
      }

      return {
        postId: mediaId,
        platform: 'instagram',
        likes,
        comments,
        shares: 0, // Instagram doesn't have shares in the traditional sense
        reach,
        impressions,
        engagement: engagement || (likes + comments),
        createdAt: new Date(),
      };
    } catch (e) {
      console.log('Instagram insights: Unable to fetch - Instagram may not be connected');
      return null;
    }
  } catch (error) {
    console.error('Error getting Instagram post insights:', error);
    return null;
  }
}

/**
 * Get Twitter Tweet Metrics
 */
export async function getTwitterTweetMetrics(
  userId: string,
  tweetId: string
): Promise<PostAnalytics | null> {
  try {
    const accounts = await getGlobalConnectedAccounts();
    const twitterAccount = accounts?.twitter;

    if (!twitterAccount?.connected || !twitterAccount.accessToken) {
      throw new Error('Twitter account not connected');
    }

    const apiVersion = '2';
    const endpoint = `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,created_at`;

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${twitterAccount.accessToken}`,
      },
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Twitter Metrics Error:', data.errors);
      return null;
    }

    const metrics = data.data?.public_metrics || {};

    return {
      postId: tweetId,
      platform: 'twitter',
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      reach: metrics.impression_count || 0,
      impressions: metrics.impression_count || 0,
      engagement:
        (metrics.like_count || 0) +
        (metrics.reply_count || 0) +
        (metrics.retweet_count || 0) +
        (metrics.quote_count || 0),
      createdAt: new Date(data.data?.created_at || Date.now()),
    };
  } catch (error) {
    console.error('Error getting Twitter tweet metrics:', error);
    return null;
  }
}

/**
 * Get all platform analytics for a user
 */
export async function getAllPlatformAnalytics(
  userId: string
): Promise<PlatformAnalytics[]> {
  try {
    const accounts = await getGlobalConnectedAccounts();
    const analytics: PlatformAnalytics[] = [];

    // Get posts from Firestore
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const querySnapshot = await getDocs(q);
    const posts: any[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    console.log(`[Analytics] Found ${posts.length} total posts for user ${userId}`);

    // Process analytics per platform
    const platforms: Array<'facebook' | 'instagram' | 'twitter' | 'linkedin'> = [
      'facebook',
      'instagram',
      'twitter',
      'linkedin',
    ];

    for (const platform of platforms) {
      // Check both platforms array and platformPostIds object
      const platformPosts = posts.filter((p) => {
        // Check if platforms array includes this platform (case-insensitive)
        if (p.platforms?.some((plat: string) => plat.toLowerCase() === platform)) return true;
        // Or check if platformPostIds has this platform
        if (p.platformPostIds?.[platform]) return true;
        return false;
      });

      console.log(`[Analytics] ${platform}: ${platformPosts.length} posts`);

      if (platformPosts.length === 0) {
        continue;
      }

      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      let totalReach = 0;
      let totalImpressions = 0;
      let totalEngagement = 0;
      let postsWithAnalytics = 0;

      // Aggregate analytics from stored post data or fetch from API
      for (const post of platformPosts) {
        // Check if post has cached analytics
        if (post.analytics?.[platform]) {
          postsWithAnalytics++;
          const postAnalytics = post.analytics[platform];
          totalLikes += postAnalytics.likes || 0;
          totalComments += postAnalytics.comments || 0;
          totalShares += postAnalytics.shares || 0;
          totalReach += postAnalytics.reach || 0;
          totalImpressions += postAnalytics.impressions || 0;
          totalEngagement += postAnalytics.engagement || 0;
        }
      }

      console.log(`[Analytics] ${platform}: ${postsWithAnalytics}/${platformPosts.length} posts have analytics, Total likes: ${totalLikes}`);

      const averageEngagementRate =
        totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

      analytics.push({
        platform,
        totalPosts: platformPosts.length,
        totalLikes,
        totalComments,
        totalShares,
        totalReach,
        totalImpressions,
        totalEngagement,
        averageEngagementRate,
      });
    }

    console.log(`[Analytics] Returning ${analytics.length} platform analytics`);
    return analytics;
  } catch (error) {
    console.error('Error getting all platform analytics:', error);
    return [];
  }
}

/**
 * Get recent engagement activity across all platforms
 */
export async function getRecentEngagement(
  userId: string,
  days: number = 7
): Promise<PostAnalytics[]> {
  try {
    const postsRef = collection(db, 'posts');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      postsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const engagementData: PostAnalytics[] = [];

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      
      // Extract analytics from each platform
      if (post.analytics) {
        Object.keys(post.analytics).forEach((platform) => {
          const analytics = post.analytics[platform];
          if (analytics) {
            engagementData.push({
              postId: doc.id,
              platform: platform as any,
              likes: analytics.likes || 0,
              comments: analytics.comments || 0,
              shares: analytics.shares || 0,
              reach: analytics.reach || 0,
              impressions: analytics.impressions || 0,
              engagement: analytics.engagement || 0,
              createdAt: post.createdAt?.toDate() || new Date(),
            });
          }
        });
      }
    });

    return engagementData;
  } catch (error) {
    console.error('Error getting recent engagement:', error);
    return [];
  }
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  engagement: number,
  impressions: number
): number {
  if (impressions === 0) return 0;
  return (engagement / impressions) * 100;
}
