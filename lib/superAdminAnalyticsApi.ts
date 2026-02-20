import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Interface for aggregated analytics across all users
 */
export interface GlobalAnalytics {
  totalUsers: number;
  totalPosts: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalImpressions: number;
  averageEngagementRate: number;
  topPerformingPost?: UserPostAnalytic;
  platformBreakdown: Array<{
    platform: 'facebook' | 'instagram' | 'twitter';
    postCount: number;
    engagement: number;
    likes: number;
    reach: number;
  }>;
}

/**
 * Interface for user with their analytics
 */
export interface UserAnalyticsSummary {
  userId: string;
  email?: string;
  displayName?: string;
  totalPosts: number;
  totalEngagement: number;
  totalLikes: number;
  totalReach: number;
  platformCount: number;
  topPost?: UserPostAnalytic;
  role?: 'user' | 'admin' | 'superAdmin';
}

/**
 * Interface for individual post analytics with user info
 */
export interface UserPostAnalytic {
  postId: string;
  userId: string;
  userEmail?: string;
  title?: string;
  content?: string;
  platform: 'facebook' | 'instagram' | 'twitter';
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  createdAt?: Date;
}

/**
 * Get all posts from all users with their analytics
 */
export async function getAllUsersPosts(): Promise<any[]> {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc')
      // NO LIMIT - fetch ALL posts to ensure we get all analytics data
    );

    const querySnapshot = await getDocs(q);
    const posts: any[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    return posts;
  } catch (error) {
    console.error('[SuperAdminAnalytics] Error fetching all posts:', error);
    throw error;
  }
}

/**
 * Get all users from the system
 */
export async function getAllUsers(): Promise<any[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    // NO LIMIT - fetch ALL users

    const querySnapshot = await getDocs(q);
    const users: any[] = [];

    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    return users;
  } catch (error) {
    console.error('[SuperAdminAnalytics] Error fetching users:', error);
    throw error;
  }
}

/**
 * Get global analytics dashboard data
 */
export async function getGlobalAnalytics(): Promise<GlobalAnalytics> {
  try {
    console.log('[SuperAdminAnalytics] Loading global analytics...');

    const users = await getAllUsers();
    const posts = await getAllUsersPosts();

    // Aggregate data - process analytics from POST.ANALYTICS (not separate analytics collection)
    let totalEngagement = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalReach = 0;
    let totalImpressions = 0;

    // Count unique posts per platform from posts collection  
    const postsPerPlatform: Map<'facebook' | 'instagram' | 'twitter', Set<string>> = new Map();
    postsPerPlatform.set('facebook', new Set());
    postsPerPlatform.set('instagram', new Set());
    postsPerPlatform.set('twitter', new Set());

    posts.forEach((post) => {
      const platformPostIds = post.platformPostIds || {};
      if (platformPostIds.facebook) postsPerPlatform.get('facebook')?.add(post.id);
      if (platformPostIds.instagram) postsPerPlatform.get('instagram')?.add(post.id);
      if (platformPostIds.twitter) postsPerPlatform.get('twitter')?.add(post.id);
    });

    // Create maps to track platform analytics & unique posts per platform
    const platformBreakdown: Map<
      'facebook' | 'instagram' | 'twitter',
      {
        postCount: number;
        engagement: number;
        likes: number;
        reach: number;
      }
    > = new Map();

    const platforms: Array<'facebook' | 'instagram' | 'twitter'> = [
      'facebook',
      'instagram',
      'twitter',
    ];

    // Initialize with actual post counts from posts collection
    for (const platform of platforms) {
      platformBreakdown.set(platform, {
        postCount: postsPerPlatform.get(platform)?.size || 0,
        engagement: 0,
        likes: 0,
        reach: 0,
      });
    }

    // Process latest analytics from POST.ANALYTICS (same as Facebook uses)
    let topPost: UserPostAnalytic | undefined;
    let maxEngagement = 0;

    // Iterate through all posts and extract analytics from post.analytics field
    posts.forEach((post) => {
      const postAnalytics = post.analytics || {};
      
      // Process each platform's analytics in this post
      for (const platform of platforms) {
        if (postAnalytics[platform]) {
          const analytic = postAnalytics[platform];
          
          const engagement = (analytic.engagement || 0) +
            (analytic.likes || 0) +
            (analytic.comments || 0) +
            (analytic.shares || 0);

          totalEngagement += engagement;
          totalLikes += analytic.likes || 0;
          totalComments += analytic.comments || 0;
          totalShares += analytic.shares || 0;
          totalReach += analytic.reach || 0;
          totalImpressions += analytic.impressions || 0;

          // Track top post
          if (engagement > maxEngagement) {
            maxEngagement = engagement;
            const relatedUser = users.find((u) => u.id === post.userId);

            topPost = {
              postId: post.id,
              userId: post.userId || '',
              userEmail: relatedUser?.email,
              title: post.title,
              content: post.content,
              platform: platform as 'facebook' | 'instagram' | 'twitter',
              likes: analytic.likes || 0,
              comments: analytic.comments || 0,
              shares: analytic.shares || 0,
              reach: analytic.reach || 0,
              impressions: analytic.impressions || 0,
              engagement: engagement,
              engagementRate: analytic.engagementRate || 0,
              createdAt: post.createdAt?.toDate?.(),
            };
          }

          // Platform breakdown - accumulate metrics
          const platformData = platformBreakdown.get(platform);
          if (platformData) {
            platformData.engagement += engagement;
            platformData.likes += analytic.likes || 0;
            platformData.reach += analytic.reach || 0;
          }
        }
      }
    });

    const averageEngagementRate =
      totalImpressions > 0
        ? (totalEngagement / totalImpressions) * 100
        : 0;

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalEngagement,
      totalLikes,
      totalComments,
      totalShares,
      totalReach,
      totalImpressions,
      averageEngagementRate,
      topPerformingPost: topPost,
      platformBreakdown: Array.from(platformBreakdown.entries()).map(
        ([platform, data]) => ({
          platform,
          postCount: data.postCount,
          engagement: data.engagement,
          likes: data.likes,
          reach: data.reach,
        })
      ),
    };
  } catch (error) {
    console.error('[SuperAdminAnalytics] Error calculating global analytics:', error);
    throw error;
  }
}

/**
 * Get analytics summary for each user
 */
export async function getUsersAnalyticsSummary(): Promise<UserAnalyticsSummary[]> {
  try {
    console.log('[SuperAdminAnalytics] Loading user analytics summaries...');

    const users = await getAllUsers();
    const posts = await getAllUsersPosts();

    const userSummaries: UserAnalyticsSummary[] = users.map((user) => {
        // Get user's posts
        const userPosts = posts.filter((p) => p.userId === user.id);

        let totalEngagement = 0;
        let totalLikes = 0;
        let totalReach = 0;
        let topPost: UserPostAnalytic | undefined;
        let maxEngagement = 0;

        // Extract analytics from each user's post
        userPosts.forEach((post) => {
          const postAnalytics = post.analytics || {};
          
          // Process each platform's analytics
          Object.entries(postAnalytics).forEach(([platform, analytic]: [string, any]) => {
            const engagement = (analytic.engagement || 0) +
              (analytic.likes || 0) +
              (analytic.comments || 0) +
              (analytic.shares || 0);

            totalEngagement += engagement;
            totalLikes += analytic.likes || 0;
            totalReach += analytic.reach || 0;

            if (engagement > maxEngagement) {
              maxEngagement = engagement;
              topPost = {
                postId: post.id,
                userId: user.id,
                platform: platform as 'facebook' | 'instagram' | 'twitter',
                likes: analytic.likes || 0,
                comments: analytic.comments || 0,
                shares: analytic.shares || 0,
                reach: analytic.reach || 0,
                impressions: analytic.impressions || 0,
                engagement: engagement,
                engagementRate: analytic.engagementRate || 0,
              };
            }
          });
        });

        // Calculate platform count
        const platformCount = new Set(
          userPosts
            .flatMap((p) => Object.keys(p.platformPostIds || {}))
        ).size;

        return {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          totalPosts: userPosts.length,
          totalEngagement,
          totalLikes,
          totalReach,
          platformCount,
          topPost,
          role: user.role,
        };
    });

    // Sort by total engagement (descending)
    return userSummaries.sort((a, b) => b.totalEngagement - a.totalEngagement);
  } catch (error) {
    console.error('[SuperAdminAnalytics] Error calculating user summaries:', error);
    throw error;
  }
}

/**
 * Get top performing posts across all users
 */
export async function getTopPerformingPosts(
  limit_count: number = 20
): Promise<UserPostAnalytic[]> {
  try {
    console.log('[SuperAdminAnalytics] Loading top performing posts...');

    const posts = await getAllUsersPosts();
    const users = await getAllUsers();

    const postAnalytics: UserPostAnalytic[] = [];

    // Extract analytics from each post's analytics field
    posts.forEach((post) => {
      const postAnalyticsData = post.analytics || {};
      const user = users.find((u) => u.id === post.userId);

      // Process each platform's analytics
      Object.entries(postAnalyticsData).forEach(([platform, analytic]: [string, any]) => {
        const engagement = (analytic.engagement || 0) +
          (analytic.likes || 0) +
          (analytic.comments || 0) +
          (analytic.shares || 0);

        postAnalytics.push({
          postId: post.id,
          userId: post.userId,
          userEmail: user?.email,
          title: post.title,
          content: post.content?.substring(0, 50),
          platform: platform as 'facebook' | 'instagram' | 'twitter',
          likes: analytic.likes || 0,
          comments: analytic.comments || 0,
          shares: analytic.shares || 0,
          reach: analytic.reach || 0,
          impressions: analytic.impressions || 0,
          engagement: engagement,
          engagementRate: analytic.engagementRate || 0,
          createdAt: post.createdAt?.toDate?.(),
        });
      });
    });

    // Sort by engagement and return top posts
    return postAnalytics
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit_count);
  } catch (error) {
    console.error('[SuperAdminAnalytics] Error fetching top posts:', error);
    throw error;
  }
}
