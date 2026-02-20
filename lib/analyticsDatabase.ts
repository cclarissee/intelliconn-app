import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Analytics Data Schema for Firestore
 * 
 * Collection: analytics
 * Documents contain platform-specific metrics with timestamps
 */

export interface AnalyticsData {
  id?: string;                      // Firestore document ID
  userId: string;                   // User who owns this analytics record
  postId: string;                   // Reference to the post
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'threads';
  
  // Engagement Metrics
  likes: number;
  comments: number;
  shares: number;
  saves?: number;                   // For Instagram/LinkedIn
  
  // Reach Metrics
  reach: number;                    // Unique users who saw the post
  impressions: number;              // Total views
  
  // Engagement Rate
  engagement: number;               // Total engagement (likes + comments + shares + saves)
  engagementRate?: number;          // (engagement / impressions) * 100
  
  // Platform-specific metrics
  clicks?: number;                  // Link clicks
  videoViews?: number;              // For video posts
  retweets?: number;                // For Twitter
  quotes?: number;                  // For Twitter
  reactions?: {                     // For Facebook
    like?: number;
    love?: number;
    haha?: number;
    wow?: number;
    sad?: number;
    angry?: number;
  };
  
  // Metadata
  createdAt: Timestamp | Date;      // When analytics was first recorded
  updatedAt: Timestamp | Date;      // Last update time
  lastFetchedAt?: Timestamp | Date; // When data was last fetched from API
  
  // Post Information (cached for quick access)
  postContent?: string;             // First 100 chars of post
  postType?: 'text' | 'image' | 'video' | 'link' | 'carousel';
  mediaUrl?: string;                // Primary media URL
  platformPostId?: string;          // Platform-specific post ID
}

/**
 * Save analytics data to Firestore
 */
export async function saveAnalyticsToDatabase(
  analyticsData: Omit<AnalyticsData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const analyticsRef = collection(db, 'analytics');
    
    const dataToSave = {
      ...analyticsData,
      engagementRate: analyticsData.impressions > 0 
        ? (analyticsData.engagement / analyticsData.impressions) * 100 
        : 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastFetchedAt: serverTimestamp(),
    };

    const docRef = await addDoc(analyticsRef, dataToSave);
    console.log(`[Analytics DB] Saved analytics for ${analyticsData.platform} post ${analyticsData.postId} with ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('[Analytics DB] Error saving analytics:', error);
    throw error;
  }
}

/**
 * Update existing analytics data in Firestore
 */
export async function updateAnalyticsInDatabase(
  analyticsId: string,
  updates: Partial<AnalyticsData>
): Promise<void> {
  try {
    const analyticsRef = doc(db, 'analytics', analyticsId);
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
      lastFetchedAt: serverTimestamp(),
    };

    // Recalculate engagement rate if metrics changed
    if (updates.engagement !== undefined || updates.impressions !== undefined) {
      const currentDoc = await getDoc(analyticsRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data() as AnalyticsData;
        const newEngagement = updates.engagement ?? currentData.engagement;
        const newImpressions = updates.impressions ?? currentData.impressions;
        updateData.engagementRate = newImpressions > 0 
          ? (newEngagement / newImpressions) * 100 
          : 0;
      }
    }

    await updateDoc(analyticsRef, updateData);
    console.log(`[Analytics DB] Updated analytics ${analyticsId}`);
  } catch (error) {
    console.error('[Analytics DB] Error updating analytics:', error);
    throw error;
  }
}

/**
 * Get analytics by post ID and platform
 */
export async function getAnalyticsByPostAndPlatform(
  postId: string,
  platform: string
): Promise<AnalyticsData | null> {
  try {
    const analyticsRef = collection(db, 'analytics');
    const q = query(
      analyticsRef,
      where('postId', '==', postId),
      where('platform', '==', platform)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const toMillis = (value: Timestamp | Date | undefined): number => {
      if (!value) return 0;
      if (value instanceof Timestamp) return value.toMillis();
      if (value instanceof Date) return value.getTime();
      return 0;
    };

    let latestDoc = querySnapshot.docs[0];
    let latestTime = toMillis(latestDoc.data().createdAt as Timestamp | Date | undefined);

    for (const doc of querySnapshot.docs) {
      const data = doc.data() as AnalyticsData;
      const createdAtMillis = toMillis(data.createdAt as Timestamp | Date | undefined);
      const updatedAtMillis = toMillis(data.updatedAt as Timestamp | Date | undefined);
      const candidateTime = Math.max(createdAtMillis, updatedAtMillis);

      if (candidateTime > latestTime) {
        latestTime = candidateTime;
        latestDoc = doc;
      }
    }

    return {
      id: latestDoc.id,
      ...(latestDoc.data() as AnalyticsData),
    } as AnalyticsData;
  } catch (error) {
    console.error('[Analytics DB] Error getting analytics by post and platform:', error);
    return null;
  }
}

/**
 * Get all analytics for a user
 */
export async function getUserAnalytics(
  userId: string,
  limitCount: number = 100
): Promise<AnalyticsData[]> {
  try {
    const analyticsRef = collection(db, 'analytics');
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const analytics: AnalyticsData[] = [];

    querySnapshot.forEach((doc) => {
      analytics.push({
        id: doc.id,
        ...doc.data(),
      } as AnalyticsData);
    });

    console.log(`[Analytics DB] Retrieved ${analytics.length} analytics records for user ${userId}`);
    return analytics;
  } catch (error) {
    console.error('[Analytics DB] Error getting user analytics:', error);
    return [];
  }
}

/**
 * Get analytics by platform for a user
 */
export async function getUserAnalyticsByPlatform(
  userId: string,
  platform: string,
  limitCount: number = 50
): Promise<AnalyticsData[]> {
  try {
    const analyticsRef = collection(db, 'analytics');
    const q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('platform', '==', platform),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const analytics: AnalyticsData[] = [];

    querySnapshot.forEach((doc) => {
      analytics.push({
        id: doc.id,
        ...doc.data(),
      } as AnalyticsData);
    });

    console.log(`[Analytics DB] Retrieved ${analytics.length} ${platform} analytics for user ${userId}`);
    return analytics;
  } catch (error) {
    console.error(`[Analytics DB] Error getting ${platform} analytics:`, error);
    return [];
  }
}

/**
 * Get analytics within a date range
 */
export async function getAnalyticsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  platform?: string
): Promise<AnalyticsData[]> {
  try {
    const analyticsRef = collection(db, 'analytics');
    
    let q = query(
      analyticsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );

    if (platform) {
      q = query(
        analyticsRef,
        where('userId', '==', userId),
        where('platform', '==', platform),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const analytics: AnalyticsData[] = [];

    querySnapshot.forEach((doc) => {
      analytics.push({
        id: doc.id,
        ...doc.data(),
      } as AnalyticsData);
    });

    return analytics;
  } catch (error) {
    console.error('[Analytics DB] Error getting analytics by date range:', error);
    return [];
  }
}

/**
 * Get aggregated platform statistics for a user
 */
export async function getPlatformStatistics(
  userId: string,
  platform: string
): Promise<{
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  bestPerformingPost?: AnalyticsData;
}> {
  try {
    const analytics = await getUserAnalyticsByPlatform(userId, platform, 1000);
    
    if (analytics.length === 0) {
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalEngagement: 0,
        averageEngagementRate: 0,
      };
    }

    const stats = analytics.reduce((acc, curr) => ({
      totalPosts: acc.totalPosts + 1,
      totalLikes: acc.totalLikes + curr.likes,
      totalComments: acc.totalComments + curr.comments,
      totalShares: acc.totalShares + curr.shares,
      totalReach: acc.totalReach + curr.reach,
      totalImpressions: acc.totalImpressions + curr.impressions,
      totalEngagement: acc.totalEngagement + curr.engagement,
    }), {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalEngagement: 0,
    });

    const averageEngagementRate = stats.totalImpressions > 0
      ? (stats.totalEngagement / stats.totalImpressions) * 100
      : 0;

    // Find best performing post by engagement
    const bestPerformingPost = analytics.reduce((best, current) => 
      current.engagement > (best?.engagement || 0) ? current : best
    , analytics[0]);

    return {
      ...stats,
      averageEngagementRate,
      bestPerformingPost,
    };
  } catch (error) {
    console.error('[Analytics DB] Error getting platform statistics:', error);
    return {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      averageEngagementRate: 0,
    };
  }
}

/**
 * Delete analytics by ID
 */
export async function deleteAnalytics(analyticsId: string): Promise<void> {
  try {
    const analyticsRef = doc(db, 'analytics', analyticsId);
    await deleteDoc(analyticsRef);
    console.log(`[Analytics DB] Deleted analytics ${analyticsId}`);
  } catch (error) {
    console.error('[Analytics DB] Error deleting analytics:', error);
    throw error;
  }
}

/**
 * Delete all analytics for a post
 */
export async function deleteAnalyticsByPost(postId: string): Promise<void> {
  try {
    const analyticsRef = collection(db, 'analytics');
    const q = query(analyticsRef, where('postId', '==', postId));
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`[Analytics DB] Deleted ${deletePromises.length} analytics records for post ${postId}`);
  } catch (error) {
    console.error('[Analytics DB] Error deleting analytics by post:', error);
    throw error;
  }
}

/**
 * Upsert analytics (update if exists, create if not)
 */
export async function upsertAnalytics(
  analyticsData: Omit<AnalyticsData, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Check if analytics already exists for this post and platform
    const existing = await getAnalyticsByPostAndPlatform(
      analyticsData.postId,
      analyticsData.platform
    );

    if (existing && existing.id) {
      // Update existing analytics
      await updateAnalyticsInDatabase(existing.id, analyticsData);
      return existing.id;
    } else {
      // Create new analytics
      return await saveAnalyticsToDatabase(analyticsData);
    }
  } catch (error) {
    console.error('[Analytics DB] Error upserting analytics:', error);
    throw error;
  }
}
