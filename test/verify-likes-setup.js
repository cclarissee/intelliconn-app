#!/usr/bin/env node

/**
 * Quick Verification Script: Check if Like Tracking is Working
 * Run: node verify-likes-setup.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise(resolve => {
  rl.question(prompt, resolve);
});

async function verifySetup() {
  console.log('\n🔍 Intelliconn - Likes Tracking Verification\n');
  console.log('Answer the following questions to verify your setup:\n');

  // Question 1: Post published
  const postPublished = await question('1. Is your post visible on Facebook/Instagram/Twitter? (yes/no): ');
  
  if (postPublished.toLowerCase() !== 'yes') {
    console.log('\n❌ Your post is not published to the platform yet.');
    console.log('   → Check CreatePost logs for errors');
    console.log('   → Verify your Facebook/Instagram/Twitter account is connected\n');
    rl.close();
    return;
  }

  // Question 2: platformPostIds
  const hasPlatformIds = await question('2. Does your post have platformPostIds in Firestore? (yes/no): ');
  
  if (hasPlatformIds.toLowerCase() !== 'yes') {
    console.log('\n❌ Post was not properly recorded on platform.');
    console.log('   → Check if platforms were included in publishing\n');
    rl.close();
    return;
  }

  // Question 3: Analytics data
  const hasAnalytics = await question('3. Does your post have analytics field with likes in Firestore? (yes/no): ');
  
  if (hasAnalytics.toLowerCase() !== 'yes') {
    console.log('\n⏳ Analytics data is still loading.');
    console.log('   → Wait 5-10 minutes after publishing');
    console.log('   → Check if tokens are valid and not expired');
    console.log('   → Check Firebase Functions logs for errors\n');
    rl.close();
    return;
  }

  // Question 4: Time since posting
  const timeSince = await question('4. How long ago did you publish? (minutes): ');
  const minutes = parseInt(timeSince);

  if (minutes < 5) {
    console.log('\n⏳ Analytics data is fresh. May still be syncing.');
    console.log('   → Refresh the app\n');
  } else if (minutes >= 5 && minutes < 10) {
    console.log('\n✅ Analytics should be available.');
    console.log('   → Refresh your Analytics tab\n');
  } else {
    console.log('\n✅ Analytics should definitely be visible.');
  }

  // Question 5: Visible in app
  const visibleInApp = await question('5. Do you see the likes in the Analytics tab? (yes/no): ');

  if (visibleInApp.toLowerCase() === 'yes') {
    console.log('\n✅✅✅ SETUP IS WORKING CORRECTLY!');
    console.log('Your likes are being tracked properly.\n');
  } else {
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Hard refresh the Analytics tab (pull-to-refresh)');
    console.log('   2. Check that you have the correct Facebook/Instagram token permissions');
    console.log('   3. Verify connected accounts are valid');
    console.log('   4. Check browser console for errors');
    console.log('   5. Check Firebase Functions logs for API errors\n');
  }

  rl.close();
}

verifySetup().catch(console.error);

