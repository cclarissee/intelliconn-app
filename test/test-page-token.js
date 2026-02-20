// Test if the page-specific token can post to Facebook
// This will test posting capability without actually posting

const userAccessToken = 'EAALAr5Dc7QgBQvedDZBpU0OgfdT3RzqUBuO5SH0rGlVlZBKnptcxnzZBnZA9jypL6FlCf4OupX6ADXJVKLFZBZCO37ZAOtc1KlEqeQNKTKSG252LojROZAhsDigLpvRGXCtMvgYms9gFdJYJ2cwk2EvubvYIO5fsqZC9cec3VdNkJapkZCDSGVrhZBG7R2WZCPBTCTC07hh43CPh44CbSFG5A32jZAm3gvx8M6wprH4ZBjBZAxEzLTP';

async function testPageToken() {
  console.log('Testing Page Token Permissions...\n');
  
  try {
    // Step 1: Get the page and its token
    console.log('1. Fetching page details and token...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('❌ Error:', pagesData.error.message);
      return;
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.log('❌ No pages found');
      return;
    }

    const page = pagesData.data[0];
    console.log(`✅ Found page: ${page.name} (${page.id})`);
    console.log(`   Page token available: ${page.access_token ? 'Yes' : 'No'}`);

    if (!page.access_token) {
      console.log('❌ No page token available');
      return;
    }

    const pageToken = page.access_token;

    // Step 2: Check what permissions the page token has
    console.log('\n2. Checking page token permissions...');
    const debugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${pageToken}&access_token=${userAccessToken}`
    );
    const debugData = await debugResponse.json();

    if (debugData.data) {
      console.log('Token type:', debugData.data.type);
      console.log('Is valid:', debugData.data.is_valid ? '✅' : '❌');
      
      if (debugData.data.scopes) {
        console.log('\n✅ Page token permissions:');
        debugData.data.scopes.forEach(scope => {
          console.log(`  - ${scope}`);
        });

        // Check for posting permission
        const canPost = debugData.data.scopes.some(s => 
          s.includes('publish') || 
          s.includes('manage_posts') || 
          s.includes('pages_manage_posts')
        );
        
        console.log(`\nCan post to page: ${canPost ? '✅ YES' : '❌ NO'}`);
      }
    }

    // Step 3: Test if we can get page fields (permission test)
    console.log('\n3. Testing page access...');
    const pageDetailsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=id,name,access_token,tasks&access_token=${pageToken}`
    );
    const pageDetails = await pageDetailsResponse.json();

    if (pageDetails.error) {
      console.error('❌ Error accessing page:', pageDetails.error.message);
    } else {
      console.log('✅ Page access successful');
      
      if (pageDetails.tasks) {
        console.log('\nPage tasks (permissions):');
        pageDetails.tasks.forEach(task => {
          console.log(`  - ${task}`);
        });

        const canManagePosts = pageDetails.tasks.includes('CREATE_CONTENT') || 
                               pageDetails.tasks.includes('MANAGE');
        console.log(`\nCan manage posts: ${canManagePosts ? '✅ YES' : '❌ NO'}`);
      }
    }

    // Step 4: Try to get feed endpoint (final test)
    console.log('\n4. Testing feed access...');
    const feedTestResponse = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}/feed?limit=1&access_token=${pageToken}`
    );
    const feedData = await feedTestResponse.json();

    if (feedData.error) {
      console.error('❌ Cannot access feed:', feedData.error.message);
      
      if (feedData.error.code === 200) {
        console.log('\n⚠️  This error means you need permissions approval.');
        console.log('The token works, but you need to:');
        console.log('1. Submit your app for review in Meta Developer Console');
        console.log('2. OR use the app in Development mode with test users/pages');
        console.log('3. OR add your account as a test user');
      }
    } else {
      console.log('✅ Feed access successful');
      console.log(`   Posts visible: ${feedData.data ? feedData.data.length : 0}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Page: ${page.name}`);
    console.log(`Page ID: ${page.id}`);
    console.log(`Has page token: ✅`);
    console.log('\nYou can try connecting this page in the app now!');
    console.log('The app will use the page token automatically.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPageToken();
