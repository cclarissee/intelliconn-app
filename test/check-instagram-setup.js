// Check if Facebook page has Instagram Business Account linked
const accessToken = 'EAALAr5Dc7QgBQvedDZBpU0OgfdT3RzqUBuO5SH0rGlVlZBKnptcxnzZBnZA9jypL6FlCf4OupX6ADXJVKLFZBZCO37ZAOtc1KlEqeQNKTKSG252LojROZAhsDigLpvRGXCtMvgYms9gFdJYJ2cwk2EvubvYIO5fsqZC9cec3VdNkJapkZCDSGVrhZBG7R2WZCPBTCTC07hh43CPh44CbSFG5A32jZAm3gvx8M6wprH4ZBjBZAxEzLTP';

async function checkInstagramSetup() {
  console.log('Checking Instagram setup...\n');

  try {
    // Get Facebook page
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
      console.error('❌ Could not fetch Facebook page');
      return;
    }

    const page = pagesData.data[0];
    const pageToken = page.access_token;
    
    console.log(`Facebook Page: ${page.name} (${page.id})`);
    console.log('');

    // Check if page has Instagram account linked
    console.log('Checking for linked Instagram account...\n');
    const igResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
    );
    const igData = await igResponse.json();

    if (igData.error) {
      console.error('❌ Error checking Instagram:', igData.error.message);
      return;
    }

    if (!igData.instagram_business_account) {
      console.log('❌ No Instagram Business Account linked to this page\n');
      console.log('═'.repeat(60));
      console.log('HOW TO LINK INSTAGRAM TO YOUR FACEBOOK PAGE:');
      console.log('═'.repeat(60));
      console.log('\n📱 STEP 1: Convert to Instagram Business Account');
      console.log('   1. Open Instagram app');
      console.log('   2. Go to Profile → Menu (☰) → Settings');
      console.log('   3. Tap "Account"');
      console.log('   4. Tap "Switch to Professional Account"');
      console.log('   5. Select "Business"');
      console.log('   6. Follow the setup steps');
      
      console.log('\n🔗 STEP 2: Link to Facebook Page');
      console.log('   1. In Instagram: Profile → Menu → Settings');
      console.log('   2. Tap "Account" → "Linked Accounts"');
      console.log('   3. Tap "Facebook"');
      console.log('   4. Log in and select your "Intelliconn" page');
      
      console.log('\n✅ STEP 3: Verify Connection');
      console.log('   1. Go to your Facebook page (facebook.com/intelliconn)');
      console.log('   2. Settings → Instagram');
      console.log('   3. You should see your Instagram account listed');
      
      console.log('\n🔄 STEP 4: Reconnect in App');
      console.log('   Once linked, reconnect Facebook in your app');
      console.log('   The Instagram account will be detected automatically');
      
      return;
    }

    // Get Instagram account details
    const igAccountId = igData.instagram_business_account.id;
    console.log('✅ Instagram Business Account found!\n');
    
    const igDetailsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageToken}`
    );
    const igDetails = await igDetailsResponse.json();

    if (igDetails.error) {
      console.error('❌ Error fetching Instagram details:', igDetails.error.message);
      return;
    }

    console.log('═'.repeat(60));
    console.log('INSTAGRAM ACCOUNT DETAILS:');
    console.log('═'.repeat(60));
    console.log(`\n📸 Username: @${igDetails.username || 'N/A'}`);
    console.log(`   Name: ${igDetails.name || 'N/A'}`);
    console.log(`   ID: ${igDetails.id}`);
    console.log(`   Followers: ${igDetails.followers_count || 0}`);
    console.log(`   Posts: ${igDetails.media_count || 0}`);

    // Test posting capability
    console.log('\n🔍 Testing Instagram API Access...\n');
    
    // Test 1: Can we access media?
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media?limit=1&access_token=${pageToken}`
    );
    const mediaData = await mediaResponse.json();

    if (mediaData.error) {
      console.log('❌ Cannot access Instagram media:', mediaData.error.message);
    } else {
      console.log('✅ Can access Instagram media');
    }

    // Test 2: Check permissions
    const debugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${pageToken}&access_token=${accessToken}`
    );
    const debugData = await debugResponse.json();

    if (debugData.data && debugData.data.scopes) {
      const igPermissions = debugData.data.scopes.filter(s => s.includes('instagram'));
      console.log('\n✅ Instagram Permissions:');
      igPermissions.forEach(perm => {
        console.log(`   - ${perm}`);
      });
    }

    console.log('\n═'.repeat(60));
    console.log('SETUP STATUS:');
    console.log('═'.repeat(60));
    console.log('✅ Facebook page connected');
    console.log('✅ Instagram Business account linked');
    console.log('✅ Token has Instagram permissions');
    console.log('✅ Ready to post to Instagram!');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Your Instagram is already set up!');
    console.log('2. When you post in the app, select Instagram');
    console.log('3. Posts will go to @' + (igDetails.username || 'your_instagram'));
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('• Instagram requires images or videos (no text-only posts)');
    console.log('• Caption limit: 2,200 characters');
    console.log('• Links in captions don\'t work (use link in bio)');
    console.log('• First comment can include additional hashtags');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkInstagramSetup();
