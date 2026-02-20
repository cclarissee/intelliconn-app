import * as CryptoJS from 'crypto-js';
import * as WebBrowser from 'expo-web-browser';
import OAuth from 'oauth-1.0a';
import { fetchTwitterApiKeys } from './twitterApiKeys';

WebBrowser.maybeCompleteAuthSession();

const buildOAuth = (consumerKey: string, consumerSecret: string) => new OAuth({
  consumer: {
    key: consumerKey,
    secret: consumerSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => CryptoJS.HmacSHA1(baseString, key).toString(CryptoJS.enc.Base64),
});

/**
 * Get Twitter credentials
 */
export async function getTwitterCredentials() {
  const keys = await fetchTwitterApiKeys();
  return {
    consumerKey: keys.consumerKey || '',
    consumerSecret: keys.consumerSecret || '',
    accessToken: keys.accessToken || '',
    accessTokenSecret: keys.accessTokenSecret || '',
    bearerToken: keys.bearerToken || '',
  };
}

/**
 * Get OAuth instance
 */
export async function getOAuth() {
  const { consumerKey, consumerSecret } = await getTwitterCredentials();
  if (!consumerKey || !consumerSecret) {
    throw new Error('Twitter API consumer key/secret not configured.');
  }
  return buildOAuth(consumerKey, consumerSecret);
}

/**
 * Get OAuth token for signing requests
 */
export async function getOAuthToken() {
  const { accessToken, accessTokenSecret } = await getTwitterCredentials();
  if (!accessToken || !accessTokenSecret) {
    throw new Error('Twitter API access token/secret not configured.');
  }
  return {
    key: accessToken,
    secret: accessTokenSecret,
  };
}

/**
 * Get Twitter user information using OAuth 1.0a
 */
export async function getTwitterUserInfo(): Promise<any> {
  try {
    const oauth = await getOAuth();
    const token = await getOAuthToken();
    const requestData = {
      url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
      method: 'GET',
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to get Twitter user info: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Twitter user info:', error);
    throw error;
  }
}
