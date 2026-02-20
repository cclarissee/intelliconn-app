// Test script to verify Facebook access token and fetch pages
// Run with: node test-facebook-token.js

const accessToken = 'EAALAr5Dc7QgBQg5asUFycwJN524TSpGG2irib02OOnvIKhXsTobFfCPbzw8sOjSN2yaDXypSeQG3sMH7opuoVtEJdJ6LtH8vR0BL0Ak4lDttz63iZAtlZBZB587wbVxTrJ00giDEr08iAyCk706oe6F8ZAtjLmjE3Oqp91vhrW1M9qW6kGtDP0BPYZCEdV3hPS40w9dNXO0gKsnXk6jJmiUWG4SzNO2PYXymH';

async function testToken() {
  console.log('Testing Facebook Access Token...\n');
  console.log('Token (first 20 chars):', accessToken.substring(0, 20) + '...');
  console.log('\n1. Validating token with /me endpoint...');

  try {
    // Test 1: Validate token with /me endpoint
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    const meData = await meResponse.json();

    if (meData.error) {
      console.error('❌ Token validation failed:', meData.error.message);
      return;
    }

    console.log('✅ Token is valid!');
    console.log('User ID:', meData.id);
    console.log('Name:', meData.name || 'N/A');

    // Test 2: Fetch user's pages
    console.log('\n2. Fetching Facebook pages...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('❌ Failed to fetch pages:', pagesData.error.message);
      return;
    }

    if (!pagesData.data || pagesData.data.length === 0) {
      console.log('⚠️  No pages found. Make sure you have:');
      console.log('   - At least one Facebook page you manage');
      console.log('   - pages_show_list permission granted');
      return;
    }

    console.log(`✅ Found ${pagesData.data.length} page(s):\n`);
    
    pagesData.data.forEach((page, index) => {
      console.log(`Page ${index + 1}:`);
      console.log(`  Name: ${page.name}`);
      console.log(`  ID: ${page.id}`);
      console.log(`  Category: ${page.category || 'N/A'}`);
      console.log(`  Has Page Token: ${page.access_token ? '✅' : '❌'}`);
      console.log('');
    });

    // Test 3: Check token permissions
    console.log('3. Checking token permissions...');
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    );
    const permissionsData = await permissionsResponse.json();

    if (permissionsData.data) {
      console.log('✅ Granted permissions:');
      const granted = permissionsData.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission);
      
      granted.forEach(perm => {
        console.log(`  - ${perm}`);
      });

      // Check for required permissions
      const required = ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'];
      console.log('\nRequired permissions check:');
      required.forEach(perm => {
        const hasIt = granted.includes(perm);
        console.log(`  ${hasIt ? '✅' : '❌'} ${perm}`);
      });
    }

    // Test 4: Check token expiration
    console.log('\n4. Checking token expiration...');
    const debugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const debugData = await debugResponse.json();

    if (debugData.data) {
      console.log('Token type:', debugData.data.type);
      console.log('App ID:', debugData.data.app_id);
      console.log('Is valid:', debugData.data.is_valid ? '✅' : '❌');
      
      if (debugData.data.expires_at) {
        const expiryDate = new Date(debugData.data.expires_at * 1000);
        console.log('Expires at:', expiryDate.toLocaleString());
        
        const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        console.log(`Days until expiry: ${daysUntilExpiry}`);
      } else {
        console.log('Expiration: Never (long-lived token)');
      }
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Open the app and go to Settings');
    console.log('2. Tap "Manage Connected Accounts"');
    console.log('3. Tap "Connect" next to Facebook');
    console.log('4. Paste the token and select a page');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testToken();
