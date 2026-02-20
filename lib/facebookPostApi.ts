import { getGlobalConnectedAccounts } from './connectedAccounts';

interface PostData {
  message: string;
  images?: string[];
  link?: string;
}

/**
 * Post content to Facebook Page using Graph API
 */
export async function postToFacebook(
  userId: string,
  postData: PostData
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount || !facebookAccount.connected) {
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken, pageId } = facebookAccount;

    if (!accessToken || !pageId) {
      return { success: false, error: 'Missing Facebook credentials' };
    }

    // Prepare the post
    const apiVersion = 'v18.0';
    
    // If posting with an image
    if (postData.images && postData.images.length > 0) {
      return await postPhotoToFacebook(pageId, accessToken, postData.message, postData.images[0]);
    }
    
    // Text post or link post
    const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
    
    const body: any = {
      message: postData.message,
      access_token: accessToken,
      published: true,  // Make post publicly visible
      privacy: { value: 'EVERYONE' },  // Explicitly set to public
    };

    // Add link if provided
    if (postData.link) {
      body.link = postData.link;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Facebook API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Facebook API Error:', data.error);
      return { 
        success: false, 
        error: data.error.message || 'Failed to post to Facebook' 
      };
    }

    if (data.id) {
      // Verify post was actually published
      console.log('Post created with ID:', data.id);
      console.log('Verifying post publication status...');
      
      try {
        const verifyEndpoint = `https://graph.facebook.com/${apiVersion}/${data.id}?fields=is_published,permalink_url&access_token=${accessToken}`;
        const verifyResponse = await fetch(verifyEndpoint);
        const verifyData = await verifyResponse.json();
        
        console.log('Post verification:', verifyData);
        
        if (verifyData.is_published === false) {
          console.warn('⚠️ Post created but NOT published (may be pending approval)');
          return { 
            success: false, 
            error: 'Post created but not published. Check your Page settings for post approval requirements.' 
          };
        }
      } catch (verifyError) {
        console.log('Could not verify post status (post may still be valid):', verifyError);
      }
      
      return { success: true, postId: data.id };
    }

    return { success: false, error: 'Unexpected response from Facebook' };
  } catch (error: any) {
    console.error('Error posting to Facebook:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Post a photo to Facebook Page
 */
async function postPhotoToFacebook(
  pageId: string,
  accessToken: string,
  message: string,
  imageUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;

    // Create form data for image upload
    const formData = new FormData();
    formData.append('message', message);
    formData.append('access_token', accessToken);
    formData.append('published', 'true');  // Make post publicly visible

    // If imageUrl is a local file, we need to convert it
    if (imageUrl.startsWith('file://') || imageUrl.startsWith('content://')) {
      // For local files, we need to create a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      formData.append('source', blob as any);
    } else {
      // For remote URLs, Facebook can fetch it directly
      formData.append('url', imageUrl);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Facebook Photo API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Facebook Photo API Error:', data.error);
      return { 
        success: false, 
        error: data.error.message || 'Failed to post photo to Facebook' 
      };
    }

    if (data.id || data.post_id) {
      const photoPostId = data.post_id || data.id;
      console.log('Photo posted with ID:', photoPostId);
      
      // Verify photo post was published
      try {
        const verifyEndpoint = `https://graph.facebook.com/${apiVersion}/${photoPostId}?fields=is_published,permalink_url&access_token=${accessToken}`;
        const verifyResponse = await fetch(verifyEndpoint);
        const verifyData = await verifyResponse.json();
        
        console.log('Photo post verification:', verifyData);
        
        if (verifyData.is_published === false) {
          console.warn('⚠️ Photo posted but NOT published (may be pending approval)');
          return { 
            success: false, 
            error: 'Photo posted but not published. Check your Page settings for post approval requirements.' 
          };
        }
      } catch (verifyError) {
        console.log('Could not verify photo post status:', verifyError);
      }
      
      return { success: true, postId: photoPostId };
    }

    return { success: false, error: 'Unexpected response from Facebook' };
  } catch (error: any) {
    console.error('Error posting photo to Facebook:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Get list of Facebook Pages the user manages
 */
export async function getFacebookPages(
  accessToken: string
): Promise<Array<{ id: string; name: string; access_token: string }>> {
  try {
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${accessToken}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) {
      console.error('Facebook Pages API Error:', data.error);
      return [];
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return [];
  }
}

/**
 * Exchange short-lived token for long-lived token (requires app secret - do this server-side in production)
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ access_token?: string; error?: string }> {
  try {
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    return { access_token: data.access_token };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Get Instagram Business Account linked to Facebook Page
 */
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<{ id?: string; username?: string; error?: string }> {
  try {
    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) {
      return { error: data.error.message };
    }

    if (!data.instagram_business_account) {
      return { error: 'No Instagram Business Account linked to this page' };
    }

    const igAccountId = data.instagram_business_account.id;

    // Get Instagram account details
    const igDetailsResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${igAccountId}?fields=id,username&access_token=${pageAccessToken}`
    );
    const igDetails = await igDetailsResponse.json();

    if (igDetails.error) {
      return { error: igDetails.error.message };
    }

    return {
      id: igDetails.id,
      username: igDetails.username,
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Post to Instagram (requires image)
 */
export async function postToInstagram(
  userId: string,
  postData: PostData
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount || !facebookAccount.connected) {
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken, pageId } = facebookAccount;

    if (!accessToken || !pageId) {
      return { success: false, error: 'Missing Facebook credentials' };
    }

    // Get Instagram account
    const igAccount = await getInstagramAccount(pageId, accessToken);
    
    if (igAccount.error || !igAccount.id) {
      return { 
        success: false, 
        error: igAccount.error || 'Instagram account not found. Please link Instagram to your Facebook page.' 
      };
    }

    // Instagram requires at least one image
    if (!postData.images || postData.images.length === 0) {
      return { 
        success: false, 
        error: 'Instagram requires at least one image or video' 
      };
    }

    const apiVersion = 'v18.0';
    const igAccountId = igAccount.id;

    // Step 1: Create container (upload media)
    const containerEndpoint = `https://graph.facebook.com/${apiVersion}/${igAccountId}/media`;
    
    const containerBody: any = {
      image_url: postData.images[0],
      caption: postData.message,
      access_token: accessToken,
    };

    const containerResponse = await fetch(containerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(containerBody),
    });

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error('Instagram Container Error:', containerData.error);
      return { 
        success: false, 
        error: containerData.error.message || 'Failed to create Instagram post container' 
      };
    }

    const creationId = containerData.id;

    // Step 2: Publish the container
    const publishEndpoint = `https://graph.facebook.com/${apiVersion}/${igAccountId}/media_publish`;
    
    const publishBody = {
      creation_id: creationId,
      access_token: accessToken,
    };

    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishBody),
    });

    const publishData = await publishResponse.json();

    if (publishData.error) {
      console.error('Instagram Publish Error:', publishData.error);
      return { 
        success: false, 
        error: publishData.error.message || 'Failed to publish Instagram post' 
      };
    }

    if (publishData.id) {
      return { success: true, postId: publishData.id };
    }

    return { success: false, error: 'Unexpected response from Instagram' };
  } catch (error: any) {
    console.error('Error posting to Instagram:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Edit/Update an existing post on Facebook Page
 */
export async function editFacebookPost(
  userId: string,
  postId: string,
  newMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount || !facebookAccount.connected) {
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken } = facebookAccount;

    if (!accessToken) {
      return { success: false, error: 'Missing Facebook credentials' };
    }

    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}`;

    const body = {
      message: newMessage,
      access_token: accessToken,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Facebook Edit Error:', data.error);
      return { 
        success: false, 
        error: data.error.message || 'Failed to edit Facebook post' 
      };
    }

    // Facebook returns { success: true } on successful edit
    if (data.success === true) {
      return { success: true };
    }

    return { success: false, error: 'Unexpected response from Facebook' };
  } catch (error: any) {
    console.error('Error editing Facebook post:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Test function to delete a Facebook post - useful for debugging
 * You can call this with a known Facebook post ID to test the delete functionality
 * Example: testDeleteFacebookPost('123456789_987654321')
 */
export async function testDeleteFacebookPost(
  postId: string
): Promise<{ success: boolean; error?: string; response?: any }> {
  try {
    console.log('\n🧪 === TESTING FACEBOOK DELETE ===');
    console.log('Post ID to delete:', postId);
    
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    console.log('Facebook account found:', !!facebookAccount);

    if (!facebookAccount || !facebookAccount.connected) {
      console.log('❌ Facebook account not connected');
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken } = facebookAccount;

    if (!accessToken) {
      console.log('❌ Missing access token');
      return { success: false, error: 'Missing Facebook credentials' };
    }

    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}`;
    console.log('🔗 Endpoint:', endpoint);
    console.log('🔑 Access Token:', accessToken.substring(0, 20) + '...');

    console.log('📤 Sending DELETE request...');
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return { 
        success: false, 
        error: `Failed to delete from Facebook: ${response.status}`,
        response: errorText
      };
    }

    // Try to parse JSON response
    const responseText = await response.text();
    console.log('📨 Response text:', responseText);
    
    // If response is empty or just "true", it's successful
    if (!responseText || responseText === 'true') {
      console.log('✅ Delete successful (empty or true response)');
      return { success: true, response: responseText };
    }

    try {
      const data = JSON.parse(responseText);
      console.log('📦 Parsed response:', data);
      
      if (data.error) {
        console.error('❌ Facebook API Error:', data.error);
        return { 
          success: false, 
          error: data.error.message || 'Failed to delete from Facebook',
          response: data
        };
      }

      // Facebook returns { success: true } on successful delete
      if (data.success === true) {
        console.log('✅ Delete successful (success: true)');
        return { success: true, response: data };
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response, but status was OK');
      return { success: true, response: responseText };
    }

    console.log('⚠️ Unexpected response format');
    return { success: false, error: 'Unexpected response from Facebook', response: responseText };
  } catch (error: any) {
    console.error('❌ Error in testDeleteFacebookPost:', error);
    return { success: false, error: error.message || 'Unknown error', response: error };
  }
}

/**
 * Delete a post from Facebook Page
 */
export async function deleteFromFacebook(
  userId: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('=== DELETE FROM FACEBOOK ===');
    console.log('User ID:', userId);
    console.log('Post ID:', postId);
    
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    console.log('Facebook account:', facebookAccount ? 'Found' : 'Not found');

    if (!facebookAccount || !facebookAccount.connected) {
      console.log('ERROR: Facebook account not connected');
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken } = facebookAccount;

    if (!accessToken) {
      console.log('ERROR: Missing access token');
      return { success: false, error: 'Missing Facebook credentials' };
    }

    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}`;
    console.log('Endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook Delete Error Response:', errorText);
      return { 
        success: false, 
        error: `Failed to delete from Facebook: ${response.status}` 
      };
    }

    // Try to parse JSON response, but handle cases where response is just "true"
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // If response is empty or just "true", it's successful
    if (!responseText || responseText === 'true') {
      console.log('✅ Delete successful (empty or true response)');
      return { success: true };
    }

    try {
      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);
      
      if (data.error) {
        console.error('Facebook API Error:', data.error);
        return { 
          success: false, 
          error: data.error.message || 'Failed to delete from Facebook' 
        };
      }

      // Facebook returns { success: true } on successful delete
      if (data.success === true) {
        console.log('✅ Delete successful (success: true)');
        return { success: true };
      }
    } catch (parseError) {
      // If we can't parse but response was ok, assume success
      console.log('⚠️ Could not parse response, but status was OK - assuming success');
      return { success: true };
    }

    console.log('⚠️ Unexpected response format');
    return { success: false, error: 'Unexpected response from Facebook' };
  } catch (error: any) {
    console.error('Error deleting from Facebook:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Delete a post from Instagram
 */
export async function deleteFromInstagram(
  userId: string,
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get global connected account (shared by all users)
    const accounts = await getGlobalConnectedAccounts();
    const facebookAccount = accounts?.facebook;

    if (!facebookAccount || !facebookAccount.connected) {
      return { success: false, error: 'Facebook account not connected' };
    }

    const { accessToken } = facebookAccount;

    if (!accessToken) {
      return { success: false, error: 'Missing Facebook credentials' };
    }

    const apiVersion = 'v18.0';
    const endpoint = `https://graph.facebook.com/${apiVersion}/${postId}?access_token=${accessToken}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram Delete Error:', errorText);
      return { 
        success: false, 
        error: `Failed to delete from Instagram: ${response.status}` 
      };
    }

    // Try to parse JSON response, but handle cases where response is just "true"
    const responseText = await response.text();
    
    // If response is empty or just "true", it's successful
    if (!responseText || responseText === 'true') {
      return { success: true };
    }

    try {
      const data = JSON.parse(responseText);
      
      if (data.error) {
        console.error('Instagram Delete Error:', data.error);
        return { 
          success: false, 
          error: data.error.message || 'Failed to delete from Instagram' 
        };
      }

      // Instagram returns { success: true } on successful delete
      if (data.success === true) {
        return { success: true };
      }
    } catch (parseError) {
      // If we can't parse but response was ok, assume success
      console.log('Could not parse response, but status was OK');
      return { success: true };
    }

    return { success: false, error: 'Unexpected response from Instagram' };
  } catch (error: any) {
    console.error('Error deleting from Instagram:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}
