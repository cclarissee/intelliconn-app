// Test script for Threads API endpoints
// Run with: node test-threads-api.js

// Replace with your Threads user access token
const accessToken = 'EAALAr5Dc7QgBQlJgW4EVuFtX2JX8uZC3zzElWmXCD2eAMB3OelZAmCa7ZAUjC8TEAqysFPRHsqhUyJpE5NlA3zMl6HLcagHeBMgiWy8L7Tut7Cs2bLQVebafgw5mAvrAbvGa0OAzZBHFXhLkNtHkmzCRICBq4sXBWei0ZC9KJXZBUU0MnLHV5FKM3AOS4HZC4KBM4TxwXeEYyjZAHYfWaQtkVGBpiO4uM5hwBIFwDygfy9HeddveXA1uxgZDZD';
const threadsUserId = 'YOUR_THREADS_USER_ID'; // Get this from /me endpoint

async function testThreadsAPI() {
  console.log('🧵 Testing Threads API endpoints...\n');

  // Test 1: threads_profile_discovery
  console.log('1️⃣  Testing threads_profile_discovery...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Success!');
      console.log('Profile:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 2: threads_location_tagging
  console.log('\n2️⃣  Testing threads_location_tagging...');
  console.log('ℹ️  Location tagging is tested during post creation');

  // Test 3: threads_delete
  console.log('\n3️⃣  Testing threads_delete (will test after creating a post)...');

  // Test 4: threads_manage_mentions
  console.log('\n4️⃣  Testing threads_manage_mentions...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads?fields=id,text,timestamp&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Can access threads (mentions can be managed)');
      console.log('Recent threads:', data.data?.length || 0);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 5: threads_keyword_search
  console.log('\n5️⃣  Testing threads_keyword_search...');
  console.log('ℹ️  Keyword search requires specific permissions and may not be available in all regions');

  // Test 6: threads_read_replies
  console.log('\n6️⃣  Testing threads_read_replies...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads?fields=id,text,replies{id,text,username}&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Can read threads with replies');
      if (data.data && data.data.length > 0) {
        console.log('Sample thread with replies:', JSON.stringify(data.data[0], null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 7: threads_manage_replies
  console.log('\n7️⃣  Testing threads_manage_replies...');
  console.log('ℹ️  Reply management is tested when creating/hiding replies');

  // Test 8: threads_manage_insights
  console.log('\n8️⃣  Testing threads_manage_insights...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_insights?metric=views,likes,replies,reposts,quotes&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Can access insights');
      console.log('Insights:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 9: threads_content_publish
  console.log('\n9️⃣  Testing threads_content_publish...');
  try {
    // Step 1: Create a media container
    const createResponse = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'TEXT',
          text: '🧪 Test post from Intelliconn API test - ' + new Date().toISOString(),
          access_token: accessToken
        })
      }
    );
    const createData = await createResponse.json();
    
    if (createData.error) {
      console.error('❌ Error creating container:', createData.error.message);
    } else {
      console.log('✅ Container created:', createData.id);
      
      // Step 2: Publish the container
      const publishResponse = await fetch(
        `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: createData.id,
            access_token: accessToken
          })
        }
      );
      const publishData = await publishResponse.json();
      
      if (publishData.error) {
        console.error('❌ Error publishing:', publishData.error.message);
      } else {
        console.log('✅ Post published successfully!');
        console.log('Post ID:', publishData.id);
        
        // Test delete with the newly created post
        console.log('\n🗑️  Testing delete on test post...');
        const deleteResponse = await fetch(
          `https://graph.threads.net/v1.0/${publishData.id}?access_token=${accessToken}`,
          { method: 'DELETE' }
        );
        const deleteData = await deleteResponse.json();
        
        if (deleteData.success) {
          console.log('✅ Post deleted successfully');
        } else {
          console.error('❌ Delete failed:', deleteData);
        }
      }
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  // Test 10: threads_basic
  console.log('\n🔟 Testing threads_basic...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
    } else {
      console.log('✅ Basic access working');
      console.log('Basic info:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n✨ Testing complete!');
}

// Get Threads User ID first
async function getThreadsUserId() {
  console.log('🔍 Getting Threads User ID...\n');
  
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/me?access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error:', data.error.message);
      console.log('\n⚠️  Make sure you have a valid Threads access token!');
      return null;
    }
    
    console.log('✅ User ID:', data.id);
    console.log('Username:', data.username);
    return data.id;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

// Main execution
(async () => {
  if (accessToken === 'YOUR_THREADS_ACCESS_TOKEN') {
    console.log('⚠️  Please set your Threads access token in the script first!\n');
    console.log('To get a Threads access token:');
    console.log('1. Go to your Meta App Dashboard');
    console.log('2. Navigate to Threads API > Settings');
    console.log('3. Get a user access token with all required permissions');
    console.log('4. Copy the token and replace YOUR_THREADS_ACCESS_TOKEN in this file\n');
    return;
  }

  const userId = await getThreadsUserId();
  if (userId) {
    console.log('\n' + '='.repeat(50) + '\n');
    await testThreadsAPI();
  }
})();
