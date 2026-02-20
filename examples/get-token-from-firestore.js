/**
 * Simple script to get your Facebook access token from Firestore
 * and test analytics
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getTokenAndTest() {
  console.log('🔍 Fetching Facebook token from Firestore...\n');

  try {
    // Check globalConnectedAccounts first (newer shared system)
    console.log('📱 Checking globalConnectedAccounts...');
    const globalDoc = await db.collection('globalConnectedAccounts').doc('main').get();
    
    if (globalDoc.exists) {
      const globalData = globalDoc.data();
      if (globalData.facebook?.connected && globalData.facebook?.accessToken) {
        console.log('✅ Found Facebook token in globalConnectedAccounts!');
        const token = globalData.facebook.accessToken;
        const pageId = globalData.facebook.pageId;
        const pageName = globalData.facebook.pageName;
        
        console.log(`   Page: ${pageName || 'N/A'}`);
        console.log(`   Page ID: ${pageId || 'N/A'}`);
        console.log(`   Token: ${token.substring(0, 20)}...`);
        
        await testPermissions(token);
        await testPagePosts(pageId, token);
        process.exit(0);
      }
    }
    
    console.log('⚠️  No token in globalConnectedAccounts');
    
    // Check old connectedAccounts collection
    console.log('\n📱 Checking old connectedAccounts collection...');
    const accountsDocs = await db.collection('connectedAccounts').get();
    
    if (accountsDocs.empty) {
      console.log('❌ No connected accounts found');
      console.log('\n💡 Next steps:');
      console.log('   1. Open your app');
      console.log('   2. Go to Settings');
      console.log('   3. Connect your Facebook account');
      console.log('   4. Run this script again');
      process.exit(1);
    }
    
    for (const doc of accountsDocs.docs) {
      const data = doc.data();
      if (data.facebook?.connected && data.facebook?.accessToken) {
        console.log(`✅ Found Facebook token for user: ${doc.id}`);
        const token = data.facebook.accessToken;
        const pageId = data.facebook.pageId;
        const pageName = data.facebook.pageName;
        
        console.log(`   Page: ${pageName || 'N/A'}`);
        console.log(`   Page ID: ${pageId || 'N/A'}`);
        console.log(`   Token: ${token.substring(0, 20)}...`);
        
        await testPermissions(token);
        await testPagePosts(pageId, token);
        process.exit(0);
      }
    }
    
    console.log('❌ No Facebook tokens found in any accounts');
    console.log('\n💡 You need to connect your Facebook account in the app first');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(1);
}

async function testPermissions(accessToken) {
  console.log('\n🔐 Testing permissions...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error.message);
      return;
    }
    
    const grantedPermissions = data.data
      .filter(p => p.status === 'granted')
      .map(p => p.permission);
    
    const requiredPermissions = ['read_insights', 'pages_read_engagement', 'pages_read_user_content'];
    
    console.log('   Required permissions for analytics:');
    requiredPermissions.forEach(perm => {
      const has = grantedPermissions.includes(perm);
      console.log(`   ${has ? '✅' : '❌'} ${perm}`);
    });
    
  } catch (error) {
    console.log('❌ Error checking permissions:', error.message);
  }
}

async function testPagePosts(pageId, accessToken) {
  if (!pageId) {
    console.log('\n⚠️  No page ID found, skipping post test');
    return;
  }
  
  console.log('\n📝 Fetching recent posts...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,created_time&limit=1&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error.message);
      return;
    }
    
    if (!data.data || data.data.length === 0) {
      console.log('⚠️  No posts found on this page');
      console.log('   Create a test post to see analytics');
      return;
    }
    
    const post = data.data[0];
    console.log(`✅ Found post: "${(post.message || 'No text').substring(0, 40)}..."`);
    
    await testPostInsights(post.id, accessToken);
    
  } catch (error) {
    console.log('❌ Error fetching posts:', error.message);
  }
}

async function testPostInsights(postId, accessToken) {
  console.log('\n📊 Testing insights retrieval...');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?fields=insights.metric(post_impressions,post_engaged_users),reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error.message);
      if (data.error.code === 190) {
        console.log('   → Token expired or invalid');
      }
      return;
    }
    
    const likes = data.reactions?.summary?.total_count || 0;
    const comments = data.comments?.summary?.total_count || 0;
    const shares = data.shares?.count || 0;
    
    let impressions = 0;
    let engagedUsers = 0;
    
    if (data.insights?.data) {
      data.insights.data.forEach(insight => {
        if (insight.name === 'post_impressions') {
          impressions = insight.values[0]?.value || 0;
        } else if (insight.name === 'post_engaged_users') {
          engagedUsers = insight.values[0]?.value || 0;
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📈 ANALYTICS RESULTS');
    console.log('='.repeat(60));
    console.log(`   👍 Likes/Reactions: ${likes}`);
    console.log(`   💬 Comments: ${comments}`);
    console.log(`   🔄 Shares: ${shares}`);
    console.log(`   👁️  Impressions: ${impressions}`);
    console.log(`   ✨ Engaged Users: ${engagedUsers}`);
    console.log('='.repeat(60));
    console.log('\n✅ Analytics are working! Likes can be retrieved.');
    
  } catch (error) {
    console.log('❌ Error fetching insights:', error.message);
  }
}

getTokenAndTest();
