import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { FacebookAuthProvider } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = '774810235628808';

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
};

export function getFacebookCredential(accessToken: string) {
  return FacebookAuthProvider.credential(accessToken);
}

export function useFacebookAuth(includePostingPermissions = false) {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'intelliconn',
    path: 'redirect'
  });

  // Basic scopes for authentication
  const basicScopes = ['public_profile', 'email'];
  
  // Additional scopes for posting to Facebook Pages and Instagram
  const postingScopes = [
    'pages_show_list',           // List pages user manages
    'pages_read_engagement',     // Read page engagement data
    'pages_manage_posts',        // Create, edit, and delete posts on pages
    'instagram_basic',           // Access to Instagram account
    'instagram_content_publish', // Publish content to Instagram
  ];

  const scopes = includePostingPermissions 
    ? [...basicScopes, ...postingScopes]
    : basicScopes;

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes,
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    },
    discovery
  );

  return [request, response, promptAsync] as const;
}

export async function loginWithFacebook(includePostingPermissions = false) {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'intelliconn',
    path: 'redirect'
  });

  console.log('Facebook OAuth Redirect URI:', redirectUri);

  // Basic scopes for authentication
  const basicScopes = ['public_profile', 'email'];
  
  // Additional scopes for posting
  const postingScopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ];

  const scopes = includePostingPermissions 
    ? [...basicScopes, ...postingScopes]
    : basicScopes;

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scopes.join(',')}`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'success') {
    const params = new URLSearchParams(result.url.split('#')[1] || result.url.split('?')[1]);
    const accessToken = params.get('access_token');
    
    if (!accessToken) {
      console.error('No access token in response URL:', result.url);
      return {
        type: 'error',
        error: 'No access token received',
      };
    }
    
    return {
      type: 'success',
      token: accessToken,
    };
  } else if (result.type === 'cancel') {
    return {
      type: 'cancel',
    };
  } else {
    return {
      type: 'error',
      error: 'Authentication failed',
    };
  }
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=YOUR_APP_SECRET&fb_exchange_token=${shortLivedToken}`
    );
    
    const data = await response.json();
    
    if (data.access_token) {
      return data.access_token;
    }
    
    throw new Error('Failed to exchange token');
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
}

/**
 * Get Facebook pages that the user manages
 */
export async function getFacebookPages(accessToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,category,picture.type(square){url}&access_token=${accessToken}`
    );
    
    const data = await response.json();
    
    if (data.data) {
      return data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token, // Page-specific token
        category: page.category,
        profileImageUrl: page.picture?.data?.url || null,
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    throw error;
  }
}

/**
 * Get Instagram business accounts linked to Facebook pages
 */
export async function getInstagramAccounts(pageId: string, pageAccessToken: string) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    
    const data = await response.json();
    
    if (data.instagram_business_account) {
      // Get Instagram account details
      const igResponse = await fetch(
        `https://graph.facebook.com/v18.0/${data.instagram_business_account.id}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`
      );
      
      const igData = await igResponse.json();
      return {
        id: igData.id,
        username: igData.username,
        profileImageUrl: igData.profile_picture_url || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Instagram account:', error);
    return null;
  }
}
