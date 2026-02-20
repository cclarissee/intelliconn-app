// Example: How to update post analytics after publishing

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    getFacebookPostInsights,
    getInstagramPostInsights,
    getTwitterTweetMetrics,
} from './analyticsApi';
import { upsertAnalytics } from './analyticsDatabase';

/**
 * Fetch and update analytics for a published post
 * Call this function after a post is successfully published
 * or schedule it to run periodically
 * Now saves analytics to dedicated analytics collection
 */
export async function updatePostAnalytics(
  userId: string,
  postId: string,
  platformIds: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  }
): Promise<void> {
  try {
    const analytics: any = {};

    // Fetch Facebook analytics
    if (platformIds.facebook) {
      const fbInsights = await getFacebookPostInsights(userId, platformIds.facebook);
      if (fbInsights) {
        analytics.facebook = fbInsights;
        
        // Save to analytics collection in database
        await upsertAnalytics({
          userId,
          postId,
          platform: 'facebook',
          likes: fbInsights.likes,
          comments: fbInsights.comments,
          shares: fbInsights.shares,
          reach: fbInsights.reach,
          impressions: fbInsights.impressions,
          engagement: fbInsights.engagement,
          platformPostId: platformIds.facebook,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Fetch Instagram analytics
    if (platformIds.instagram) {
      const igInsights = await getInstagramPostInsights(userId, platformIds.instagram);
      if (igInsights) {
        analytics.instagram = igInsights;
        
        // Save to analytics collection in database
        await upsertAnalytics({
          userId,
          postId,
          platform: 'instagram',
          likes: igInsights.likes,
          comments: igInsights.comments,
          shares: igInsights.shares,
          reach: igInsights.reach,
          impressions: igInsights.impressions,
          engagement: igInsights.engagement,
          platformPostId: platformIds.instagram,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Fetch Twitter analytics
    if (platformIds.twitter) {
      const twitterMetrics = await getTwitterTweetMetrics(userId, platformIds.twitter);
      if (twitterMetrics) {
        analytics.twitter = twitterMetrics;
        
        // Save to analytics collection in database
        await upsertAnalytics({
          userId,
          postId,
          platform: 'twitter',
          likes: twitterMetrics.likes,
          comments: twitterMetrics.comments,
          shares: twitterMetrics.shares,
          reach: twitterMetrics.reach,
          impressions: twitterMetrics.impressions,
          engagement: twitterMetrics.engagement,
          platformPostId: platformIds.twitter,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Also update the post document for backward compatibility
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      analytics,
      lastAnalyticsUpdate: new Date(),
    });

    console.log('Analytics updated successfully for post:', postId);
  } catch (error) {
    console.error('Error updating post analytics:', error);
    throw error;
  }
}

/**
 * Schedule periodic analytics updates
 * This should be called from a background job or Cloud Function
 */
export async function scheduleAnalyticsUpdate(
  postId: string,
  userId: string,
  platformIds: any
): Promise<void> {
  // Update immediately
  await updatePostAnalytics(userId, postId, platformIds);

  // Schedule updates:
  // - After 1 hour
  // - After 24 hours
  // - After 7 days
  // You can use Firebase Cloud Functions with scheduled triggers
  // Or implement with React Native Background Tasks
}

/**
 * Bulk update analytics for all user's posts
 * Use this sparingly to respect API rate limits
 */
export async function bulkUpdateAnalytics(
  userId: string,
  posts: Array<{ id: string; platformIds: any }>
): Promise<void> {
  try {
    // If no posts provided, fetch them from Firestore
    if (posts.length === 0) {
      const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      console.log('[BulkUpdate] Fetching posts from Firestore...');
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(20) // Only update recent 20 posts
      );

      const querySnapshot = await getDocs(q);
      posts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.platformPostIds) {
          posts.push({
            id: doc.id,
            platformIds: data.platformPostIds
          });
        }
      });
      
      console.log(`[BulkUpdate] Found ${posts.length} posts with platform IDs to update`);
    }

    if (posts.length === 0) {
      console.log('[BulkUpdate] No posts to update - no posts have platform IDs');
      return;
    }

    console.log(`[BulkUpdate] Updating analytics for ${posts.length} posts...`);

    for (const post of posts) {
      try {
        console.log(`[BulkUpdate] Updating post ${post.id}...`);
        await updatePostAnalytics(userId, post.id, post.platformIds);
        // Add delay to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`[BulkUpdate] Failed to update analytics for post ${post.id}:`, error);
        // Continue with next post
      }
    }

    console.log('[BulkUpdate] Bulk analytics update completed');
  } catch (error) {
    console.error('[BulkUpdate] Error in bulk update:', error);
    throw error;
  }
}

/**
 * Test if Facebook analytics is working
 * Returns diagnostic information about the Facebook connection and API access
 */
export async function testFacebookAnalyticsConnection(
  userId: string
): Promise<{
  connected: boolean;
  hasToken: boolean;
  hasPageId: boolean;
  pageName?: string;
  apiTest?: {
    success: boolean;
    message: string;
    details?: any;
  };
}> {
  try {
    const { getConnectedAccounts } = await import('./connectedAccounts');
    const accounts = await getConnectedAccounts(userId);
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount) {
      return {
        connected: false,
        hasToken: false,
        hasPageId: false,
      };
    }

    const result = {
      connected: facebookAccount.connected || false,
      hasToken: !!facebookAccount.accessToken,
      hasPageId: !!facebookAccount.pageId,
      pageName: facebookAccount.pageName,
      apiTest: undefined as any,
    };

    // If we have all credentials, test the API
    if (result.connected && result.hasToken && result.hasPageId) {
      try {
        const apiVersion = 'v18.0';
        const endpoint = `https://graph.facebook.com/${apiVersion}/${facebookAccount.pageId}?fields=name,fan_count,followers_count&access_token=${facebookAccount.accessToken}`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.error) {
          result.apiTest = {
            success: false,
            message: data.error.message || 'API request failed',
            details: data.error,
          };
        } else {
          result.apiTest = {
            success: true,
            message: 'Facebook API is working correctly',
            details: {
              pageName: data.name,
              fanCount: data.fan_count,
              followersCount: data.followers_count,
            },
          };
        }
      } catch (error: any) {
        result.apiTest = {
          success: false,
          message: error.message || 'Network error',
        };
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error testing Facebook analytics connection:', error);
    throw error;
  }
}

// Example usage in CreatePost component:
/*
const createAndPublishPost = async () => {
  try {
    // ... existing post creation code ...
    
    // After post is successfully published
    const docRef = await addDoc(collection(db, 'posts'), {
      userId: user.uid,
      content: postContent,
      platforms: selectedPlatforms,
      createdAt: new Date(),
      platformIds: {}, // Will be filled with actual IDs
    });

    // Publish to each platform and collect IDs
    const platformIds: any = {};
    
    if (selectedPlatforms.includes('facebook')) {
      const fbResult = await postToFacebook(user.uid, postData);
      if (fbResult.success && fbResult.postId) {
        platformIds.facebook = fbResult.postId;
      }
    }
    
    if (selectedPlatforms.includes('twitter')) {
      const twitterResult = await postTweet(postContent);
      if (twitterResult.id_str) {
        platformIds.twitter = twitterResult.id_str;
      }
    }
    
    // Update post with platform IDs
    await updateDoc(doc(db, 'posts', docRef.id), {
      platformIds,
    });
    
    // Schedule analytics update (after a delay to let platforms process)
    setTimeout(async () => {
      try {
        await updatePostAnalytics(user.uid, docRef.id, platformIds);
      } catch (error) {
        console.error('Failed to fetch initial analytics:', error);
      }
    }, 60000); // Wait 1 minute
    
    Alert.alert('Success', 'Post published successfully!');
  } catch (error) {
    console.error('Error publishing post:', error);
    Alert.alert('Error', 'Failed to publish post');
  }
};
*/
