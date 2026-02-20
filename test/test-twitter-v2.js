// Test Twitter API v2 with OAuth 1.0a User Context
const OAuth = require('oauth-1.0a');
const CryptoJS = require('crypto-js');

const TWITTER_CONSUMER_KEY = 'dEEe5E6UWXZPoiUS71V6fNQsd';
const TWITTER_CONSUMER_SECRET = 'zn60N7Wz8GZYhLm4VJVq0xQ6ESD174aMDfXjidVBopPZJUO9tG';
const TWITTER_ACCESS_TOKEN = '1986371068781862914-BROZu8xyGtDH5h6G6aozpUxduj50C5';
const TWITTER_ACCESS_TOKEN_SECRET = 'nlcBjfUS7FC9yjeMMSNerxDgGZAedWorOoAREUBjNkhXh';

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

async function testV2WithOAuth1() {
  console.log('🔍 Testing Twitter API v2 with OAuth 1.0a User Context...\n');

  try {
    // Test posting with v2 API
    console.log('Attempting to post tweet using API v2...');
    const tweetText = `Testing Intelliconn v2 - ${Date.now()}`;
    
    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
      data: { text: tweetText },
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData.data),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.log('❌ API v2 Error:', JSON.stringify(responseData, null, 2));
      console.log('\n📋 Your app has Free tier access which includes:');
      console.log('   ✅ Read endpoints (get user info, tweets)');
      console.log('   ✅ OAuth authentication');  
      console.log('   ❌ POST tweets (requires Basic tier - $100/month)');
      console.log('\n💡 Solution: Use Twitter API v1.1 endpoints that are available in Free tier');
      console.log('   However, v1.1 write endpoints also require elevated access.');
      console.log('\n🔗 To upgrade: https://developer.x.com/en/portal/products');
    } else {
      console.log('✅ Success!', responseData);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testV2WithOAuth1();
