/**
 * Test Facebook post creation with detailed logging
 * Run this to check if posts are being created correctly
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAppyR_Kj9hAkiojv-U4eRE5YjwD4yRBcw",
  authDomain: "intelliconn-420218.firebaseapp.com",
  projectId: "intelliconn-420218",
  storageBucket: "intelliconn-420218.firebasestorage.app",
  messagingSenderId: "295291726094",
  appId: "1:295291726094:web:a50be3831ffd93e8e5d7d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFacebookPost() {
  try {
    console.log('🔍 Checking Facebook connection...\n');

    // Get global connected accounts
    const accountsRef = doc(db, 'globalConnectedAccounts', 'main');
    const accountsDoc = await getDoc(accountsRef);

    if (!accountsDoc.exists()) {
      console.error('❌ No global connected accounts found');
      return;
    }

    const data = accountsDoc.data();
    const fbAccount = data.facebook;

    if (!fbAccount || !fbAccount.connected) {
      console.error('❌ Facebook not connected');
      return;
    }

    console.log('✅ Facebook connected');
    console.log('   Page ID:', fbAccount.pageId);
    console.log('   Page Name:', fbAccount.pageName);
    console.log('   Token (first 20 chars):', fbAccount.accessToken?.substring(0, 20) + '...');
    console.log('   Permissions:', fbAccount.permissions);
    console.log();

    // Test post creation
    console.log('📝 Testing post creation...\n');

    const testMessage = `Test post from Intelliconn - ${new Date().toLocaleString()}`;
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${fbAccount.pageId}/feed`;

    const body = {
      message: testMessage,
      access_token: fbAccount.accessToken,
      published: true,
    };

    console.log('Request details:');
    console.log('  Endpoint:', endpoint);
    console.log('  Body:', { ...body, access_token: '***' });
    console.log();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    console.log();

    if (result.error) {
      console.error('❌ Post failed with error:');
      console.error('   Code:', result.error.code);
      console.error('   Type:', result.error.type);
      console.error('   Message:', result.error.message);
      console.error();
      console.log('🔧 Possible fixes:');
      console.log('   1. Check if the page token has pages_manage_posts permission');
      console.log('   2. Verify the page is not restricted');
      console.log('   3. Make sure the token hasn\'t expired');
      console.log('   4. Check page settings for post approval requirements');
    } else if (result.id) {
      console.log('✅ Post created successfully!');
      console.log('   Post ID:', result.id);
      console.log();
      
      // Try to fetch the post to verify it's public
      console.log('🔍 Verifying post visibility...\n');
      
      const verifyEndpoint = `https://graph.facebook.com/${apiVersion}/${result.id}?fields=message,is_published,status_type,created_time,permalink_url&access_token=${fbAccount.accessToken}`;
      
      const verifyResponse = await fetch(verifyEndpoint);
      const verifyData = await verifyResponse.json();
      
      console.log('Post details:', JSON.stringify(verifyData, null, 2));
      console.log();
      
      if (verifyData.is_published === false) {
        console.warn('⚠️  Post is NOT published (draft/pending)');
        console.log('   Check your Facebook Page settings for:');
        console.log('   - Post approval requirements');
        console.log('   - Content moderation rules');
        console.log('   - Page restrictions');
      } else {
        console.log('✅ Post is published and should be visible!');
        if (verifyData.permalink_url) {
          console.log('   URL:', verifyData.permalink_url);
        }
      }
    } else {
      console.log('⚠️  Unexpected response (no error, no post ID)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  process.exit(0);
}

testFacebookPost();
