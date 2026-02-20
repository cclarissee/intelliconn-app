// Check Threads Account Status
const accessToken = 'EAALAr5Dc7QgBQlJgW4EVuFtX2JX8uZC3zzElWmXCD2eAMB3OelZAmCa7ZAUjC8TEAqysFPRHsqhUyJpE5NlA3zMl6HLcagHeBMgiWy8L7Tut7Cs2bLQVebafgw5mAvrAbvGa0OAzZBHFXhLkNtHkmzCRICBq4sXBWei0ZC9KJXZBUU0MnLHV5FKM3AOS4HZC4KBM4TxwXeEYyjZAHYfWaQtkVGBpiO4uM5hwBIFwDygfy9HeddveXA1uxgZDZD';

async function checkThreadsAccount() {
  console.log('🔍 Checking Threads Account Information...\n');
  
  // 1. Get Facebook user info
  console.log('1️⃣  Fetching Facebook/Meta user profile...');
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name,accounts,instagram_accounts,threads_username&access_token=${accessToken}`
    );
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    
    if (data.id) {
      console.log('\n✅ User ID:', data.id);
      console.log('✅ Name:', data.name);
      
      if (data.threads_username) {
        console.log('✅ Threads Username:', data.threads_username);
      } else {
        console.log('⚠️  Threads username not found - may not be connected');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // 2. Try accessing Threads with different endpoints
  console.log('\n2️⃣  Trying Threads API endpoints...');
  
  const endpoints = [
    { url: 'https://graph.threads.net/v1.0/me', name: 'Basic /me' },
    { url: 'https://graph.threads.net/v1.0/me?fields=id,username', name: '/me with fields' },
    { url: 'https://graph.facebook.com/v18.0/me?fields=threads_username', name: 'Facebook Threads field' },
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n   Testing: ${endpoint.name}`);
    try {
      const response = await fetch(
        `${endpoint.url}&access_token=${accessToken}`
      );
      const text = await response.text();
      
      if (text) {
        const data = JSON.parse(text);
        if (data.error) {
          console.log(`   ❌ Error:`, data.error.message);
        } else {
          console.log(`   ✅ Success:`, JSON.stringify(data, null, 2));
        }
      } else {
        console.log(`   ❌ Empty response from API`);
      }
    } catch (error) {
      console.error(`   ❌ ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 DIAGNOSIS:');
  console.log('If you see "Empty response from API", it means:');
  console.log('  • Your account may not have Threads enabled');
  console.log('  • Threads API may not be available in your region');
  console.log('  • You may not have a Threads business account');
  console.log('\nTo enable Threads:');
  console.log('  1. Go to threads.net/settings');
  console.log('  2. Create a Threads account');
  console.log('  3. Switch to a Creator or Business account');
  console.log('  4. Return and generate a new token');
}

checkThreadsAccount();
