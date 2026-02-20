// Test Twitter API Integration with OAuth 1.0a
// Run with: node test-twitter-api.js

const OAuth = require('oauth-1.0a');
const CryptoJS = require('crypto-js');

const TWITTER_CONSUMER_KEY = 'dEEe5E6UWXZPoiUS71V6fNQsd';
const TWITTER_CONSUMER_SECRET = 'zn60N7Wz8GZYhLm4VJVq0xQ6ESD174aMDfXjidVBopPZJUO9tG';
const TWITTER_ACCESS_TOKEN = '1986371068781862914-BROZu8xyGtDH5h6G6aozpUxduj50C5';
const TWITTER_ACCESS_TOKEN_SECRET = 'nlcBjfUS7FC9yjeMMSNerxDgGZAedWorOoAREUBjNkhXh';

// Initialize OAuth 1.0a
const oauth = new OAuth({
  consumer: {
    key: TWITTER_CONSUMER_KEY,
    secret: TWITTER_CONSUMER_SECRET,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64),
});

const token = {
  key: TWITTER_ACCESS_TOKEN,
  secret: TWITTER_ACCESS_TOKEN_SECRET,
};

async function testTwitterConnection() {
  console.log('🔍 Testing Twitter API connection with OAuth 1.0a...\n');

  try {
    // Test 1: Get user info
    console.log('Test 1: Getting user information...');
    const userRequestData = {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
      method: 'GET',
    };

    const userAuthHeader = oauth.toHeader(oauth.authorize(userRequestData, token));

    const userResponse = await fetch(userRequestData.url, {
      method: userRequestData.method,
      headers: {
        ...userAuthHeader,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('❌ Failed to get user info:', errorData);
      return;
    }

    const userData = await userResponse.json();
    console.log('✅ User Info Retrieved!');
    console.log(`👤 Username: @${userData.screen_name}`);
    console.log(`📝 Name: ${userData.name}`);
    console.log(`👥 Followers: ${userData.followers_count}`);
    console.log(`📊 Tweets: ${userData.statuses_count}\n`);

    // Test 2: Post a test tweet
    console.log('Test 2: Posting a test tweet...');
    const tweetText = `🧪 Testing Intelliconn Twitter integration - ${new Date().toLocaleString()} 🚀`;
    
    const tweetRequestData = {
      url: 'https://api.twitter.com/1.1/statuses/update.json',
      method: 'POST',
      data: { status: tweetText },
    };

    const tweetAuthHeader = oauth.toHeader(oauth.authorize(tweetRequestData, token));
    
    const formBody = Object.keys(tweetRequestData.data)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(tweetRequestData.data[key]))
      .join('&');

    const tweetResponse = await fetch(tweetRequestData.url, {
      method: tweetRequestData.method,
      headers: {
        ...tweetAuthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.text();
      console.error('❌ Failed to post tweet:', errorData);
      
      if (errorData.includes('duplicate')) {
        console.log('💡 Tip: Twitter prevents duplicate tweets. The integration is working!');
      }
      return;
    }

    const tweetData = await tweetResponse.json();
    console.log('✅ Tweet Posted Successfully!');
    console.log(`🆔 Tweet ID: ${tweetData.id_str}`);
    console.log(`📝 Text: ${tweetData.text}`);
    console.log(`🔗 View at: https://twitter.com/${userData.screen_name}/status/${tweetData.id_str}\n`);

    console.log('✅ All tests passed! Twitter integration is working correctly with OAuth 1.0a.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testTwitterConnection();
