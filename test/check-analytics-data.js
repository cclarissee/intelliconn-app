/**
 * Check Analytics Data in Firestore
 * This script checks what's actually stored in your database
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAnalyticsData() {
  console.log('🔍 Checking Analytics Data in Firestore\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check connected accounts
    console.log('\n📱 Step 1: Checking connected accounts...');
    const globalAccountsDoc = await db.collection('globalConnectedAccounts').doc('main').get();
    
    if (!globalAccountsDoc.exists) {
      console.log('❌ No globalConnectedAccounts found');
      console.log('   Checking old connectedAccounts...');
      
      const accountsDocs = await db.collection('connectedAccounts').get();
      if (accountsDocs.empty) {
        console.log('❌ No connected accounts at all!');
        console.log('   → You need to connect Facebook in your app first');
        process.exit(1);
      }
    } else {
      const accountsData = globalAccountsDoc.data();
      console.log('✅ Connected accounts found');
      if (accountsData.facebook?.connected) {
        console.log(`   Facebook: ${accountsData.facebook.pageName || 'Connected'}`);
      }
    }

    // 2. Get all users
    console.log('\n👤 Step 2: Getting users...');
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found!');
      process.exit(1);
    }
    
    console.log(`✅ Found ${usersSnapshot.size} user(s)`);
    const firstUser = usersSnapshot.docs[0];
    const userId = firstUser.id;
    console.log(`   Testing with user: ${userId}`);

    // 3. Get posts for this user
    console.log('\n📝 Step 3: Getting posts...');
    const postsSnapshot = await db.collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (postsSnapshot.empty) {
      console.log('❌ No posts found for this user!');
      console.log('   → Create a post in your app first');
      console.log('   → Make sure to publish it to Facebook');
      process.exit(1);
    }

    console.log(`✅ Found ${postsSnapshot.size} post(s)`);

    // 4. Check each post
    console.log('\n📊 Step 4: Analyzing posts...');
    let postsWithPlatformIds = 0;
    let postsWithAnalytics = 0;
    let totalLikes = 0;

    postsSnapshot.forEach((doc, index) => {
      const post = doc.data();
      console.log(`\n   Post ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Content: "${(post.content || post.message || 'No content').substring(0, 40)}..."`);
      console.log(`   Created: ${post.createdAt?.toDate?.() || 'Unknown'}`);
      console.log(`   Platforms: ${post.platforms?.join(', ') || 'None'}`);
      
      // Check platformPostIds
      if (post.platformPostIds) {
        postsWithPlatformIds++;
        console.log(`   Platform IDs: ✅`);
        if (post.platformPostIds.facebook) {
          console.log(`     Facebook ID: ${post.platformPostIds.facebook}`);
        }
        if (post.platformPostIds.instagram) {
          console.log(`     Instagram ID: ${post.platformPostIds.instagram}`);
        }
        if (post.platformPostIds.twitter) {
          console.log(`     Twitter ID: ${post.platformPostIds.twitter}`);
        }
      } else {
        console.log(`   Platform IDs: ❌ Missing`);
      }

      // Check analytics
      if (post.analytics) {
        postsWithAnalytics++;
        console.log(`   Analytics: ✅`);
        
        if (post.analytics.facebook) {
          const fbLikes = post.analytics.facebook.likes || 0;
          totalLikes += fbLikes;
          console.log(`     Facebook Likes: ${fbLikes}`);
          console.log(`     Facebook Comments: ${post.analytics.facebook.comments || 0}`);
          console.log(`     Facebook Shares: ${post.analytics.facebook.shares || 0}`);
        }
        
        if (post.analytics.instagram) {
          const igLikes = post.analytics.instagram.likes || 0;
          totalLikes += igLikes;
          console.log(`     Instagram Likes: ${igLikes}`);
        }
        
        if (post.analytics.twitter) {
          const twLikes = post.analytics.twitter.likes || 0;
          totalLikes += twLikes;
          console.log(`     Twitter Likes: ${twLikes}`);
        }
      } else {
        console.log(`   Analytics: ❌ Missing`);
      }
    });

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n   Total Posts: ${postsSnapshot.size}`);
    console.log(`   Posts with Platform IDs: ${postsWithPlatformIds}`);
    console.log(`   Posts with Analytics: ${postsWithAnalytics}`);
    console.log(`   Total Likes Found: ${totalLikes}`);

    // 6. Diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    
    if (postsWithPlatformIds === 0) {
      console.log('\n❌ PROBLEM: No posts have platform IDs');
      console.log('   This means posts were not successfully published to social platforms');
      console.log('   → Check if Facebook connection is working');
      console.log('   → Try publishing a new post');
      console.log('   → Check for errors in the app console');
    } else if (postsWithAnalytics === 0) {
      console.log('\n⚠️  PROBLEM: Posts have platform IDs but no analytics');
      console.log('   This means posts were published but analytics were not fetched');
      console.log('   → Run the refresh button in analytics tab');
      console.log('   → Or wait for automatic analytics update');
      console.log('   → Check if tokens are still valid');
    } else if (totalLikes === 0) {
      console.log('\n⚠️  INFO: Analytics exist but no likes yet');
      console.log('   This is normal for new posts');
      console.log('   → Get some people to like your posts');
      console.log('   → Refresh analytics to see updated counts');
    } else {
      console.log('\n✅ Everything looks good!');
      console.log('   Analytics should be visible in the app');
      console.log('   → If not showing, check the app code');
      console.log('   → Try reloading the analytics screen');
    }

    // 7. Test the query that analytics uses
    console.log('\n🧪 Step 5: Testing analytics query...');
    
    const testQuery = await db.collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    console.log(`   Query returned: ${testQuery.size} posts`);
    
    const testAnalytics = {};
    testQuery.forEach((doc) => {
      const post = doc.data();
      if (post.platforms && post.analytics) {
        post.platforms.forEach(platform => {
          if (!testAnalytics[platform]) {
            testAnalytics[platform] = { posts: 0, likes: 0, comments: 0, shares: 0 };
          }
          testAnalytics[platform].posts++;
          
          if (post.analytics[platform]) {
            testAnalytics[platform].likes += post.analytics[platform].likes || 0;
            testAnalytics[platform].comments += post.analytics[platform].comments || 0;
            testAnalytics[platform].shares += post.analytics[platform].shares || 0;
          }
        });
      }
    });

    console.log('\n   Calculated Analytics:');
    Object.keys(testAnalytics).forEach(platform => {
      console.log(`   ${platform}:`);
      console.log(`     Posts: ${testAnalytics[platform].posts}`);
      console.log(`     Likes: ${testAnalytics[platform].likes}`);
      console.log(`     Comments: ${testAnalytics[platform].comments}`);
      console.log(`     Shares: ${testAnalytics[platform].shares}`);
    });

    if (Object.keys(testAnalytics).length === 0) {
      console.log('\n❌ No analytics calculated - posts missing platforms or analytics data');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Check Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

checkAnalyticsData();
