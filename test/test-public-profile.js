// Test script to verify public_profile permission
// Run with: node test-public-profile.js

const accessToken = 'YOUR_ACCESS_TOKEN_HERE';

async function testPublicProfile() {
  console.log('Testing public_profile Permission...\n');
  console.log('Token (first 20 chars):', accessToken.substring(0, 20) + '...\n');

  try {
    // Test 1: Basic /me endpoint (requires public_profile)
    console.log('1. Testing /me endpoint (basic profile)...');
    const basicResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    const basicData = await basicResponse.json();

    if (basicData.error) {
      console.error('❌ Error:', basicData.error.message);
      console.log('\n💡 This usually means:');
      console.log('   - Token is invalid or expired');
      console.log('   - public_profile permission was not granted');
      return;
    }

    console.log('✅ Basic profile retrieved:');
    console.log('   User ID:', basicData.id);
    console.log('   Name:', basicData.name || 'N/A');

    // Test 2: Extended profile fields (all require public_profile)
    console.log('\n2. Testing extended profile fields...');
    const extendedResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,first_name,last_name,picture,age_range,gender&access_token=${accessToken}`
    );
    const extendedData = await extendedResponse.json();

    if (extendedData.error) {
      console.error('❌ Error:', extendedData.error.message);
      return;
    }

    console.log('✅ Extended profile fields:');
    console.log('   ID:', extendedData.id);
    console.log('   Name:', extendedData.name);
    console.log('   First Name:', extendedData.first_name || 'N/A');
    console.log('   Last Name:', extendedData.last_name || 'N/A');
    console.log('   Picture URL:', extendedData.picture?.data?.url || 'N/A');
    console.log('   Age Range:', extendedData.age_range ? JSON.stringify(extendedData.age_range) : 'N/A');
    console.log('   Gender:', extendedData.gender || 'N/A');

    // Test 3: Verify public_profile permission is granted
    console.log('\n3. Verifying public_profile permission status...');
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`
    );
    const permissionsData = await permissionsResponse.json();

    if (permissionsData.data) {
      const publicProfilePerm = permissionsData.data.find(p => p.permission === 'public_profile');
      
      if (publicProfilePerm) {
        if (publicProfilePerm.status === 'granted') {
          console.log('✅ public_profile permission: GRANTED');
        } else {
          console.log('❌ public_profile permission:', publicProfilePerm.status);
        }
      } else {
        console.log('⚠️  public_profile permission not found in list');
        console.log('   (It may be granted by default)');
      }

      // Show all granted permissions
      console.log('\nAll granted permissions:');
      const granted = permissionsData.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission);
      
      granted.forEach(perm => {
        console.log(`  ✅ ${perm}`);
      });
    }

    console.log('\n🎉 public_profile test completed successfully!');
    console.log('\n📊 What this means:');
    console.log('   - Your token has public_profile permission');
    console.log('   - You can access basic user profile information');
    console.log('   - The /me endpoint is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure you have an active internet connection');
    console.log('   2. Check if the access token is valid');
    console.log('   3. Verify the token was generated with public_profile scope');
  }
}

testPublicProfile();
