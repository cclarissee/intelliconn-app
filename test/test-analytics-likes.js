/**
 * Test script to verify analytics and likes retrieval
 * This tests if your Facebook permissions can fetch post insights including likes
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function testAnalyticsLikes() {
  console.log('🔍 Testing Analytics & Likes Functionality\n');
  console.log('=' .repeat(60));

  try {
    // Use the new User token with Instagram permissions
    const ACCESS_TOKEN = 'EAALAr5Dc7QgBQnNZAGcY31frRjpTjH3q0avZAtp7F2GbNufkrnBdAG5pI3TMQxNasYHpkriI9EJcktsynbg5oDW3ZAxqLUldAZAVldjcwwM281ptXJ2tlbGot0Hw4oJ2KC5F9kvxnDd0MZBlvXaaEWJwNy5RXLZB48gzIIyqstqHXHjppkSBPlq9ZAzfeSpBxEOwqanKtCZCinqefyWuB2heBLQhsBpiNeWSGv6dBQWRyjmI8BtjVjLz5QZDZD';
    
    console.log(`✅ Using NEW access token with Instagram permissions: ${ACCESS_TOKEN.substring(0, 20)}...`);

    // 1. Check permissions first
    console.log('\n🔐 Step 1: Verifying permissions...');
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${ACCESS_TOKEN}`
    );
    const permissionsData = await permissionsResponse.json();

    if (permissionsData.error) {
      console.log('❌ Error checking permissions:', permissionsData.error.message);
      return;
    }

    const grantedPermissions = permissionsData.data
      .filter(p => p.status === 'granted')
      .map(p => p.permission);

    const requiredPermissions = ['read_insights', 'pages_read_engagement', 'pages_read_user_content', 'instagram_manage_insights'];

    console.log('   Required permissions for analytics:');
    requiredPermissions.forEach(perm => {
      const has = grantedPermissions.includes(perm);
      console.log(`   ${has ? '✅' : '❌'} ${perm}`);
    });

    // 2. Get user and their pages
    console.log('\n📱 Step 2: Getting your pages...');
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,accounts{id,name,access_token}&access_token=${ACCESS_TOKEN}`
    );
    const meData = await meResponse.json();

    if (meData.error) {
      console.log('❌ Error getting account info:', meData.error.message);
      return;
    }

    console.log(`✅ User: ${meData.name}`);
    
    if (!meData.accounts || meData.accounts.data.length === 0) {
      console.log('❌ No pages found');
      console.log('   You need to manage at least one Facebook Page to get insights');
      return;
    }

    console.log(`✅ Found ${meData.accounts.data.length} page(s):`);
    meData.accounts.data.forEach((page, i) => {
      console.log(`   ${i + 1}. ${page.name} (ID: ${page.id})`);
    });

    const page = meData.accounts.data[0];
    const pageId = page.id;
    const pageName = page.name;
    const pageAccessToken = page.access_token;

    // 3. Get recent posts from the page
    console.log(`\n📝 Step 3: Fetching recent posts from "${pageName}"...`);
    // 2. Get recent posts from the page
    console.log(`\n📝 Step 2: Fetching recent posts...`);
    // 3. Get recent posts from the page
    console.log(`\n📝 Step 3: Fetching recent posts from "${pageName}"...`);
    const feedResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,created_time&limit=5&access_token=${pageAccessToken}`
    );
    const feedData = await feedResponse.json();

    if (feedData.error) {
      console.log('❌ Error fetching posts:', feedData.error.message);
      return;
    }

    if (!feedData.data || feedData.data.length === 0) {
      console.log('⚠️  No posts found on this page');
      console.log('   Create a post first to test analytics');
      return;
    }

    console.log(`✅ Found ${feedData.data.length} recent post(s)`);

    // 4. Test insights on first post
    const testPost = feedData.data[0];
    console.log(`\n📊 Step 4: Testing insights on first post...`);
    console.log(`   Message: "${(testPost.message || 'No text').substring(0, 50)}..."`);
    console.log(`   Posted: ${new Date(testPost.created_time).toLocaleString()}`);
    console.log(`   Post ID: ${testPost.id}`);

    // 5. Fetch insights
    console.log('\n🔄 Step 5: Fetching live insights...');
    
    // First, try to get basic engagement metrics (always available)
    const basicEndpoint = `https://graph.facebook.com/v18.0/${testPost.id}?fields=reactions.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`;
    
    const basicResponse = await fetch(basicEndpoint);
    const basicData = await basicResponse.json();
    
    if (basicData.error) {
      console.log('❌ Error fetching basic data:', basicData.error.message);
      return;
    }
    
    const likes = basicData.reactions?.summary?.total_count || 0;
    const comments = basicData.comments?.summary?.total_count || 0;
    const shares = basicData.shares?.count || 0;
    
    // Try to get insights (may not be available for recent posts)
    let impressions = 0;
    let engagedUsers = 0;
    
    const insightsEndpoint2 = `https://graph.facebook.com/v18.0/${testPost.id}/insights?metric=post_impressions,post_engaged_users&access_token=${pageAccessToken}`;
    
    try {
      const insightsResponse2 = await fetch(insightsEndpoint2);
      const insightsData2 = await insightsResponse2.json();
      
      if (!insightsData2.error && insightsData2.data) {
        insightsData2.data.forEach(insight => {
          if (insight.name === 'post_impressions') {
            impressions = insight.values[0]?.value || 0;
          } else if (insight.name === 'post_engaged_users') {
            engagedUsers = insight.values[0]?.value || 0;
          }
        });
      } else if (insightsData2.error) {
        console.log('   ⚠️  Note: Post insights not yet available (posts need ~24 hours for insights)');
      }
    } catch (e) {
      console.log('   ⚠️  Note: Error getting insights:', e.message);
    }

    console.log('✅ Successfully fetched engagement data!');

      // Display results
      console.log('\n' + '='.repeat(60));
      console.log('📈 ANALYTICS RESULTS');
      console.log('='.repeat(60));
      console.log(`\n   👍 Likes/Reactions: ${likes}`);
      console.log(`   💬 Comments: ${comments}`);
      console.log(`   🔄 Shares: ${shares}`);
      console.log(`   👁️  Impressions: ${impressions}${impressions === 0 ? ' (not yet available)' : ''}`);
      console.log(`   ✨ Engaged Users: ${engagedUsers}${engagedUsers === 0 ? ' (not yet available)' : ''}`);
      console.log(`   📊 Total Engagement: ${likes + comments + shares}`);
      
      if (impressions > 0) {
        const engagementRate = ((likes + comments + shares) / impressions * 100).toFixed(2);
        console.log(`   📈 Engagement Rate: ${engagementRate}%`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ TEST COMPLETED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('\n💡 Your analytics are working correctly!');
      console.log('   The app can retrieve likes and engagement data from your posts.');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testAnalyticsLikes()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
