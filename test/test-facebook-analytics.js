/**
 * Test Facebook Analytics Integration
 * This script tests if Facebook analytics endpoints are working correctly
 */

// Test with a sample access token and page ID
// You can get these from your Firebase connectedAccounts collection

const TEST_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
const TEST_PAGE_ID = process.env.FB_PAGE_ID || 'YOUR_PAGE_ID_HERE';

// Or you can hardcode them here for testing (not recommended for production)
// const TEST_ACCESS_TOKEN = 'your_actual_token';
// const TEST_PAGE_ID = 'your_actual_page_id';

async function testFacebookPageInsights(pageId, accessToken) {
  try {
    console.log('\n📊 Testing Facebook Page Insights...');
    
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}?fields=name,fan_count,followers_count&access_token=${accessToken}`;
    
    const response = await fetch(endpoint);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Facebook Page Error:', data.error);
      return false;
    }
    
    console.log('✅ Page Info Retrieved:');
    console.log(`   Page Name: ${data.name}`);
    console.log(`   Fans: ${data.fan_count || 'N/A'}`);
    console.log(`   Followers: ${data.followers_count || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing page insights:', error.message);
    return false;
  }
}

async function testFacebookPostInsights(pageId, accessToken) {
  try {
    console.log('\n📝 Testing Facebook Post Insights...');
    
    const apiVersion = 'v18.0';
    
    // Get recent posts from the page
    const postsEndpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/posts?fields=id,message,created_time&limit=5&access_token=${accessToken}`;
    
    const postsResponse = await fetch(postsEndpoint);
    const postsData = await postsResponse.json();
    
    if (postsData.error) {
      console.error('❌ Error getting posts:', postsData.error);
      return false;
    }
    
    if (!postsData.data || postsData.data.length === 0) {
      console.log('⚠️  No posts found on the page');
      return true; // Not an error, just no posts
    }
    
    console.log(`✅ Found ${postsData.data.length} recent posts`);
    
    // Test insights for the first post
    const firstPost = postsData.data[0];
    console.log(`\n   Testing insights for post: ${firstPost.id}`);
    console.log(`   Message: ${firstPost.message?.substring(0, 50) || 'No message'}...`);
    
    const insightsEndpoint = `https://graph.facebook.com/${apiVersion}/${firstPost.id}?fields=insights.metric(post_impressions,post_engaged_users,post_clicks),reactions.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsEndpoint);
    const insightsData = await insightsResponse.json();
    
    if (insightsData.error) {
      console.error('❌ Error getting post insights:', insightsData.error);
      console.log('   This might be due to insufficient permissions or the post being too old');
      return false;
    }
    
    console.log('✅ Post Insights Retrieved:');
    
    // Parse insights
    let impressions = 0;
    let engagedUsers = 0;
    let clicks = 0;
    
    if (insightsData.insights?.data) {
      insightsData.insights.data.forEach((insight) => {
        if (insight.name === 'post_impressions') {
          impressions = insight.values[0]?.value || 0;
        } else if (insight.name === 'post_engaged_users') {
          engagedUsers = insight.values[0]?.value || 0;
        } else if (insight.name === 'post_clicks') {
          clicks = insight.values[0]?.value || 0;
        }
      });
    }
    
    const likes = insightsData.reactions?.summary?.total_count || 0;
    const comments = insightsData.comments?.summary?.total_count || 0;
    const shares = insightsData.shares?.count || 0;
    
    console.log(`   Impressions: ${impressions}`);
    console.log(`   Engaged Users: ${engagedUsers}`);
    console.log(`   Clicks: ${clicks}`);
    console.log(`   Likes: ${likes}`);
    console.log(`   Comments: ${comments}`);
    console.log(`   Shares: ${shares}`);
    console.log(`   Total Engagement: ${likes + comments + shares}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing post insights:', error.message);
    return false;
  }
}

async function testFacebookAnalytics() {
  console.log('🔍 Facebook Analytics Integration Test\n');
  console.log('=' .repeat(50));
  
  try {
    if (TEST_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE' || TEST_PAGE_ID === 'YOUR_PAGE_ID_HERE') {
      console.log('❌ Please set FB_ACCESS_TOKEN and FB_PAGE_ID environment variables');
      console.log('   Or edit the script to include your actual credentials\n');
      console.log('   You can find these in your Firebase connectedAccounts collection');
      console.log('   Or by running this in your app:\n');
      console.log('   const accounts = await getConnectedAccounts(userId);');
      console.log('   console.log(accounts.facebook);\n');
      return;
    }
    
    console.log(`📱 Testing Facebook Analytics`);
    console.log(`   Page ID: ${TEST_PAGE_ID}`);
    console.log(`   Has Access Token: Yes\n`);
    
    // Test page insights
    const pageTest = await testFacebookPageInsights(TEST_PAGE_ID, TEST_ACCESS_TOKEN);
    
    // Test post insights
    const postTest = await testFacebookPostInsights(TEST_PAGE_ID, TEST_ACCESS_TOKEN);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`   Page Insights: ${pageTest ? '✅ Working' : '❌ Failed'}`);
    console.log(`   Post Insights: ${postTest ? '✅ Working' : '❌ Failed'}`);
    
    if (pageTest && postTest) {
      console.log('\n🎉 Facebook Analytics is working correctly!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the errors above.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
testFacebookAnalytics()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
