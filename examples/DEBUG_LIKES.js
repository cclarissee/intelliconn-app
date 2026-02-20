/**
 * Debug Script: Check Post Analytics and Likes
 * Run this to verify your likes are being tracked properly
 */

// ============================================
// PART 1: Check Post Data in Firestore
// ============================================

// Go to Firebase Console → Firestore
// Click on "posts" collection
// Find your post and check if it has this structure:

const examplePostWithAnalytics = {
  id: "your-post-id",
  title: "Your post title",
  content: "Your post content",
  platforms: ["facebook", "instagram"],
  userId: "your-user-id",
  createdAt: "timestamp",
  
  // IMPORTANT: These IDs are needed to fetch analytics
  platformPostIds: {
    facebook: "123456_789012",  // PageID_PostID format
    instagram: "17999876543210"  // Instagram Media ID
  },
  
  // IMPORTANT: This is where likes data is stored
  analytics: {
    facebook: {
      likes: 5,           // ← Likes from Facebook
      comments: 2,
      shares: 1,
      reach: 150,
      impressions: 200,
      engagement: 8,
      lastUpdated: "timestamp"
    },
    instagram: {
      likes: 12,          // ← Likes from Instagram
      comments: 4,
      shares: 0,
      reach: 300,
      impressions: 450,
      engagement: 16,
      lastUpdated: "timestamp"
    }
  },
  
  status: "published"
};

// ============================================
// PART 2: Check Connected Accounts
// ============================================

// Go to Firebase Console → Firestore
// Click on "connectedAccounts" collection
// Find your account and verify:

const exampleConnectedAccounts = {
  facebook: {
    connected: true,  // ← Must be true
    accessToken: "your-access-token-here",  // ← Must exist
    pageId: "123456789",
    userId: "fb-user-id"
  },
  instagram: {
    connected: true,
    accessToken: "your-access-token-here",
    pageId: "instagram-page-id"
  },
  twitter: {
    connected: true,
    accessToken: "your-access-token-here"
  }
};

// ============================================
// PART 3: Common Issues and Solutions
// ============================================

const issues = {
  "No platformPostIds": {
    cause: "Post wasn't actually published to the platform",
    fix: "Check CreatePost logs, verify tokens are valid"
  },
  
  "platformPostIds exist but no analytics": {
    cause: "Analytics haven't been fetched yet (API call delayed)",
    fix: "Wait 5-10 minutes, then refresh analytics"
  },
  
  "analytics field is empty": {
    cause: "API returned error when fetching likes",
    fix: "Check token expiration, verify API permissions"
  },
  
  "Wrong likes count": {
    cause: "Analytics data is cached from 5+ minutes ago",
    fix: "Manually trigger refresh or wait for auto-update"
  }
};

// ============================================
// PART 4: How to Manually Test
// ============================================

/*
1. CREATE A POST:
   - Go to "Create Post" in your app
   - Write something
   - Select only Facebook (easier to test)
   - Publish

2. CHECK FIRESTORE IMMEDIATELY:
   - Open Firebase Console
   - Go to posts collection
   - Find your new post
   - Should see: { id, title, content, platforms: ["facebook"], userId, createdAt, status: "published" }
   - Note: platformPostIds might not exist yet

3. WAIT 30-60 SECONDS:
   - Check the post again in Firestore
   - Should now have platformPostIds.facebook set

4. WAIT 5-10 MINUTES:
   - Check again
   - Should now have analytics.facebook with likes count

5. VIEW IN APP:
   - Go to Analytics tab
   - Should see your post in "Performance by Platform"
   - Should see the likes count
*/

// ============================================
// PART 5: Check API Responses
// ============================================

// If you want to debug API calls, check your:
// 1. Browser DevTools → Network tab (for client-side)
// 2. Firebase Functions logs (for server-side)
// 3. Console logs (search for "Insights" or "analytics")

// Look for API endpoints like:
// - https://graph.facebook.com/v18.0/{postId}?fields=insights...
// - https://graph.instagram.com/v18.0/{mediaId}/insights?...
// - https://api.twitter.com/2/tweets/{tweetId}?...

// ============================================
// PART 6: Code to Add Logging (Optional)
// ============================================

// Add this to your analyticsApi.ts to debug:

const debugLog = (message, data = {}) => {
  console.log(`[ANALYTICS] ${message}`, data);
  // Also log to Firestore for persistent debugging
  // db.collection('debug').add({
  //   timestamp: new Date(),
  //   message,
  //   data
  // });
};

// Then in getFacebookPostInsights:
// debugLog('Fetching Facebook insights for post:', { postId });
// debugLog('Facebook API Response:', data);
// debugLog('Parsed likes:', { likes });

// ============================================
// PART 7: Quick Checklist
// ============================================

const checklist = [
  "☐ Post published to social platform (appears on Facebook/Instagram/Twitter page)",
  "☐ platformPostIds has correct ID for that platform",
  "☐ Connected accounts show token is not expired",
  "☐ Waited at least 10 minutes after publishing",
  "☐ Analytics field exists with platform data",
  "☐ Likes count is > 0",
  "☐ Analytics tab in app shows the data",
  "☐ Browser console has no errors"
];

console.log("Likes Debugging Checklist:");
checklist.forEach(item => console.log(item));

// ============================================
// PART 8: Commands to Run in Firebase Console
// ============================================

/*
To view all your posts with analytics, run in Cloud Functions shell:

const postsRef = db.collection('posts');
const snapshot = await postsRef.where('userId', '==', 'YOUR_USER_ID').get();

snapshot.forEach(doc => {
  const post = doc.data();
  console.log({
    id: doc.id,
    title: post.title,
    platforms: post.platforms,
    platformPostIds: post.platformPostIds,
    analytics: post.analytics,
    status: post.status
  });
});
*/

