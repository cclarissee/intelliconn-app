// Quick token validator
const accessToken = 'EAALAr5Dc7QgBQlJgW4EVuFtX2JX8uZC3zzElWmXCD2eAMB3OelZAmCa7ZAUjC8TEAqysFPRHsqhUyJpE5NlA3zMl6HLcagHeBMgiWy8L7Tut7Cs2bLQVebafgw5mAvrAbvGa0OAzZBHFXhLkNtHkmzCRICBq4sXBWei0ZC9KJXZBUU0MnLHV5FKM3AOS4HZC4KBM4TxwXeEYyjZAHYfWaQtkVGBpiO4uM5hwBIFwDygfy9HeddveXA1uxgZDZD';

async function validateToken() {
  console.log('Checking token validity...\n');
  
  // Test with Facebook Graph API
  console.log('1. Testing with Facebook Graph API /me...');
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
    );
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test debug token
  console.log('\n2. Testing debug_token...');
  try {
    const response = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const data = await response.json();
    console.log('Token Info:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test with Threads API
  console.log('\n3. Testing with Threads API...');
  try {
    const response = await fetch(
      `https://graph.threads.net/v1.0/me?access_token=${accessToken}`
    );
    const data = await response.json();
    console.log('Threads Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

validateToken();
