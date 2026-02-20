#!/usr/bin/env node

/**
 * Fetch Real Analytics Data from Social Platforms
 * This script fetches real engagement data for your posts and stores it in Firebase
 * 
 * Usage: node scripts/fetch-real-analytics.js
 */

const admin = require('firebase-admin');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error('❌ Firebase service account not found. Create serviceAccountKey.json');
    process.exit(1);
  }
}

const db = admin.firestore();

async function fetchFacebookAnalytics() {
  console.log('\n📱 Fetching Facebook Analytics...');
  
  try {
    // Get global connected accounts
    const accountsDoc = await db.collection('globalConnectedAccounts').doc('main').get();
    if (!accountsDoc.exists) {
      console.log('❌ No connected accounts found');
      return [];
    }

    const accountsData = accountsDoc.data();
    if (!accountsData?.facebook?.connected || !accountsData?.facebook?.accessToken) {
      console.log('⚠️  Facebook not connected');
      return [];
    }

    const pageAccessToken = accountsData.facebook.accessToken;
    const pageId = accountsData.facebook.pageId;

    if (!pageId) {
      console.log('❌ Facebook page ID not found');
      return [];
    }

    // Get recent posts from this page
    const feedUrl = `https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,created_time&limit=10&access_token=${pageAccessToken}`;
    const feedResponse = await fetch(feedUrl);
    const feedData = await feedResponse.json();

    if (feedData.error) {
      console.error('Facebook API Error:', feedData.error.message);
      return [];
    }

    if (!feedData.data || feedData.data.length === 0) {
      console.log('⚠️  No posts found on Facebook page');
      return [];
    }

    const analyticsData = [];

    // Fetch insights for each post
    for (const post of feedData.data) {
      try {
        const insightsUrl = `https://graph.facebook.com/v18.0/${post.id}?fields=reactions.summary(true).as(likes),comments.summary(true),shares,insights.metric(post_impressions,post_engaged_users)&access_token=${pageAccessToken}`;
        const insightsResponse = await fetch(insightsUrl);
        const insightsData = await insightsResponse.json();

        if (insightsData.error) {
          console.warn(`  ⚠️  Could not fetch insights for post ${post.id}`);
          continue;
        }

        const likes = insightsData.likes?.summary?.total_count || 0;
        const comments = insightsData.comments?.summary?.total_count || 0;
        const shares = insightsData.shares?.data?.length || 0;

        let impressions = 0;
        let reach = 0;

        if (insightsData.insights?.data) {
          insightsData.insights.data.forEach(insight => {
            if (insight.name === 'post_impressions') {
              impressions = insight.values[0]?.value || 0;
            } else if (insight.name === 'post_engaged_users') {
              reach = insight.values[0]?.value || 0;
            }
          });
        }

        analyticsData.push({
          platform: 'facebook',
          likes,
          comments,
          shares,
          reach,
          impressions,
          engagement: likes + comments + shares,
          engagementRate: impressions > 0 ? ((likes + comments + shares) / impressions * 100).toFixed(2) : 0,
          createdAt: new Date(),
          postId: post.id,
          postMessage: post.message?.substring(0, 100) || 'No message'
        });

        console.log(`  ✅ Fetched: ${post.id.substring(0, 15)}... - Likes: ${likes}, Comments: ${comments}, Reach: ${reach}`);
      } catch (error) {
        console.error(`  Error fetching post insights:`, error.message);
      }
    }

    return analyticsData;
  } catch (error) {
    console.error('❌ Error fetching Facebook analytics:', error.message);
    return [];
  }
}

async function fetchInstagramAnalytics() {
  console.log('\n📷 Fetching Instagram Analytics...');
  
  try {
    const accountsDoc = await db.collection('globalConnectedAccounts').doc('main').get();
    if (!accountsDoc.exists) return [];

    const accountsData = accountsDoc.data();
    if (!accountsData?.instagram?.connected || !accountsData?.instagram?.accessToken) {
      console.log('⚠️  Instagram not connected');
      return [];
    }

    const accessToken = accountsData.instagram.accessToken;
    const igUserId = accountsData.instagram.instagramUserId;

    if (!igUserId) {
      console.log('❌ Instagram user ID not found');
      return [];
    }

    // Get recent media
    const mediaUrl = `https://graph.instagram.com/v18.0/${igUserId}/media?fields=id,caption,timestamp&limit=10&access_token=${accessToken}`;
    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    if (mediaData.error) {
      console.error('Instagram API Error:', mediaData.error.message);
      return [];
    }

    if (!mediaData.data || mediaData.data.length === 0) {
      console.log('⚠️  No posts found on Instagram');
      return [];
    }

    const analyticsData = [];

    // Fetch insights for each media
    for (const media of mediaData.data) {
      try {
        const insightsUrl = `https://graph.instagram.com/v18.0/${media.id}/insights?metric=engagement,impressions,reach&access_token=${accessToken}`;
        const insightsResponse = await fetch(insightsUrl);
        const insightsData = await insightsResponse.json();

        if (insightsData.error) {
          console.warn(`  ⚠️  Could not fetch insights for media ${media.id}`);
          continue;
        }

        let engagement = 0;
        let impressions = 0;
        let reach = 0;

        if (insightsData.data) {
          insightsData.data.forEach(insight => {
            const value = insight.values[0]?.value || 0;
            if (insight.name === 'engagement') engagement = value;
            else if (insight.name === 'impressions') impressions = value;
            else if (insight.name === 'reach') reach = value;
          });
        }

        analyticsData.push({
          platform: 'instagram',
          likes: engagement, // Instagram returns engagement metric
          comments: 0, // Not available in basic insights
          shares: 0,
          reach,
          impressions,
          engagement,
          engagementRate: impressions > 0 ? ((engagement / impressions) * 100).toFixed(2) : 0,
          createdAt: new Date(),
          mediaId: media.id,
          postCaption: media.caption?.substring(0, 100) || 'No caption'
        });

        console.log(`  ✅ Fetched: ${media.id} - Engagement: ${engagement}, Reach: ${reach}, Impressions: ${impressions}`);
      } catch (error) {
        console.error(`  Error fetching media insights:`, error.message);
      }
    }

    return analyticsData;
  } catch (error) {
    console.error('❌ Error fetching Instagram analytics:', error.message);
    return [];
  }
}

async function fetchTwitterAnalytics() {
  console.log('\n🐦 Fetching Twitter Analytics...');
  
  try {
    const accountsDoc = await db.collection('globalConnectedAccounts').doc('main').get();
    if (!accountsDoc.exists) return [];

    const accountsData = accountsDoc.data();
    if (!accountsData?.twitter?.connected || !accountsData?.twitter?.accessToken) {
      console.log('⚠️  Twitter not connected');
      return [];
    }

    const accessToken = accountsData.twitter.accessToken;

    // Get user ID first
    const userUrl = 'https://api.twitter.com/2/users/me';
    const userResponse = await fetch(userUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const userData = await userResponse.json();

    if (userData.errors) {
      console.error('Twitter API Error:', userData.errors[0]?.message);
      return [];
    }

    const userId = userData.data.id;

    // Get recent tweets
    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=created_at,public_metrics`;
    const tweetsResponse = await fetch(tweetsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const tweetsData = await tweetsResponse.json();

    if (tweetsData.errors) {
      console.error('Twitter API Error:', tweetsData.errors[0]?.message);
      return [];
    }

    if (!tweetsData.data || tweetsData.data.length === 0) {
      console.log('⚠️  No tweets found');
      return [];
    }

    const analyticsData = [];

    tweetsData.data.forEach(tweet => {
      const metrics = tweet.public_metrics;
      const engagement = metrics.like_count + metrics.reply_count + metrics.retweet_count + metrics.quote_count;

      analyticsData.push({
        platform: 'twitter',
        likes: metrics.like_count,
        comments: metrics.reply_count,
        shares: metrics.retweet_count + metrics.quote_count,
        reach: 0, // Twitter doesn't provide reach in basic API
        impressions: 0,
        engagement,
        engagementRate: 0,
        createdAt: new Date(tweet.created_at),
        tweetId: tweet.id
      });

      console.log(`  ✅ Fetched: ${tweet.id} - Likes: ${metrics.like_count}, Replies: ${metrics.reply_count}, Retweets: ${metrics.retweet_count}`);
    });

    return analyticsData;
  } catch (error) {
    console.error('❌ Error fetching Twitter analytics:', error.message);
    return [];
  }
}

async function storeAnalyticsInFirebase(allAnalytics) {
  console.log('\n💾 Storing analytics in Firebase...');
  
  try {
    // Get all posts
    const postsRef = admin.firestore().collection('posts');
    const postsSnapshot = await postsRef.get();
    
    const postMap = new Map();
    postsSnapshot.forEach(doc => {
      postMap.set(doc.id, doc.data());
    });

    if (postMap.size === 0) {
      console.log('ℹ️  No posts found in Firebase. Create some posts first.');
      return;
    }

    let storedCount = 0;

    for (const analytic of allAnalytics) {
      // Find matching post for this analytics
      const matchingPost = Array.from(postMap.entries()).find(([, post]) => {
        const platformPostIds = post.platformPostIds || {};
        if (analytic.platform === 'facebook' && platformPostIds.facebook === analytic.postId) return true;
        if (analytic.platform === 'instagram' && platformPostIds.instagram === analytic.mediaId) return true;
        if (analytic.platform === 'twitter' && platformPostIds.twitter === analytic.tweetId) return true;
        return false;
      });

      if (matchingPost) {
        const [postId] = matchingPost;
        
        // Store analytics in analytics collection
        await db.collection('analytics').add({
          postId,
          platform: analytic.platform,
          likes: analytic.likes,
          comments: analytic.comments,
          shares: analytic.shares,
          reach: analytic.reach,
          impressions: analytic.impressions,
          engagement: analytic.engagement,
          engagementRate: analytic.engagementRate,
          createdAt: admin.firestore.Timestamp.fromDate(analytic.createdAt),
          updatedAt: admin.firestore.Timestamp.now()
        });

        storedCount++;
        console.log(`  ✅ Stored analytics for post ${postId} (${analytic.platform})`);
      }
    }

    console.log(`\n✅ Stored ${storedCount} analytics records in Firebase`);
  } catch (error) {
    console.error('❌ Error storing analytics:', error.message);
  }
}

async function main() {
  console.log('🔄 Fetching Real Analytics Data from Social Platforms');
  console.log('=' .repeat(60));

  const allAnalytics = [];

  // Fetch from all platforms
  const facebookData = await fetchFacebookAnalytics();
  const instagramData = await fetchInstagramAnalytics();
  const twitterData = await fetchTwitterAnalytics();

  allAnalytics.push(...facebookData, ...instagramData, ...twitterData);

  if (allAnalytics.length === 0) {
    console.log('\n⚠️  No analytics data fetched. Make sure:');
    console.log('  1. Accounts are connected');
    console.log('  2. Access tokens are valid');
    console.log('  3. You have posts on the platforms');
    process.exit(1);
  }

  console.log(`\n📊 Total analytics records fetched: ${allAnalytics.length}`);

  // Store in Firebase
  await storeAnalyticsInFirebase(allAnalytics);

  console.log('\n✅ Done! Now go to the Super Admin Analytics tab to see the real data.');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
