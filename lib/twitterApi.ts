import { getOAuth, getOAuthToken, getTwitterCredentials } from './twitterAuth';

/**
 * Post a tweet to Twitter using OAuth 1.0a
 */
export async function postTweet(text: string, mediaIds?: string[]): Promise<any> {
  try {
    const oauth = await getOAuth();
    const token = await getOAuthToken();
    
    const body: any = { status: text };
    
    if (mediaIds && mediaIds.length > 0) {
      body.media_ids = mediaIds.join(',');
    }

    // Use Twitter API v1.1 for posting (more reliable with OAuth 1.0a)
    const requestData = {
      url: 'https://api.twitter.com/1.1/statuses/update.json',
      method: 'POST',
      data: body,
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    // Convert body to URL-encoded format
    const formBody = Object.keys(body)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
      .join('&');

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to post tweet: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
}

/**
 * Edit a tweet on Twitter/X (requires Twitter API v2 and paid tier - Basic or higher)
 * Note: Free tier does NOT support editing tweets
 * Only tweets created in the last 30 minutes can be edited
 * Each tweet can be edited up to 5 times within 1 hour of creation
 */
export async function editTweet(
  tweetId: string, 
  newText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { bearerToken } = await getTwitterCredentials();
    if (!bearerToken) {
      return {
        success: false,
        error: 'Twitter API bearer token not configured. Add it in Admin > Integrations.',
      };
    }

    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Failed to edit tweet',
      };
    }

    await response.json();
    return { success: true };
  } catch (error: any) {
    console.error('Error editing tweet:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * Delete a tweet from Twitter using OAuth 1.0a
 */
export async function deleteTweet(tweetId: string): Promise<any> {
  try {
    const oauth = await getOAuth();
    const token = await getOAuthToken();

    const requestData = {
      url: `https://api.twitter.com/1.1/statuses/destroy/${tweetId}.json`,
      method: 'POST',
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
      throw new Error(`Failed to delete tweet: ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting tweet:', error);
    throw error;
  }
}

/**
 * Upload media to Twitter
 */
export async function uploadTwitterMedia(mediaData: string, mediaType: 'image/jpeg' | 'image/png' | 'video/mp4'): Promise<string> {
  try {
    // Note: Twitter media upload requires OAuth 1.0a signing
    // For a complete implementation, you'll need to use a library like oauth-1.0a
    // This is a placeholder for the media upload endpoint
    
    throw new Error('Media upload requires OAuth 1.0a signing. Please implement with oauth-1.0a library.');
  } catch (error) {
    console.error('Error uploading media to Twitter:', error);
    throw error;
  }
}

/**
 * Get tweet analytics
 */
export async function getTweetAnalytics(tweetId: string): Promise<any> {
  try {
    const { bearerToken } = await getTwitterCredentials();

    const response = await fetch(
      `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,created_at`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get tweet analytics: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting tweet analytics:', error);
    throw error;
  }
}

/**
 * Get user's tweets
 */
export async function getUserTweets(userId: string, maxResults: number = 10): Promise<any> {
  try {
    const { bearerToken } = await getTwitterCredentials();

    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to get user tweets: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user tweets:', error);
    throw error;
  }
}
