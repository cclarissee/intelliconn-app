import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';

/**
 * Share content using Facebook's Share Dialog
 * This opens Facebook app or web browser with a share dialog
 * No API access required!
 */
export async function shareToFacebookDialog(content: {
  url?: string;
  quote?: string;
}): Promise<boolean> {
  try {
    const { url, quote } = content;

    if (!url) {
      Alert.alert('Error', 'URL is required for Facebook sharing');
      return false;
    }

    // Encode the URL and quote
    const encodedUrl = encodeURIComponent(url);
    const encodedQuote = quote ? encodeURIComponent(quote) : '';

    // Facebook Share Dialog URL
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}${
      encodedQuote ? `&quote=${encodedQuote}` : ''
    }`;

    // Try to open Facebook app first, fallback to web browser
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      // Try Facebook app scheme
      const fbAppUrl = `fb://facewebmodal/f?href=${shareUrl}`;
      const canOpen = await Linking.canOpenURL(fbAppUrl);

      if (canOpen) {
        await Linking.openURL(fbAppUrl);
        return true;
      }
    }

    // Fallback to web browser
    const result = await WebBrowser.openBrowserAsync(shareUrl);
    return result.type === 'cancel' || result.type === 'dismiss' ? false : true;
  } catch (error) {
    console.error('Error sharing to Facebook:', error);
    Alert.alert('Error', 'Failed to open Facebook share dialog');
    return false;
  }
}

/**
 * Share to Facebook Messenger
 */
export async function shareToMessenger(content: {
  url: string;
}): Promise<boolean> {
  try {
    const { url } = content;

    if (!url) {
      Alert.alert('Error', 'URL is required for Messenger sharing');
      return false;
    }

    const encodedUrl = encodeURIComponent(url);
    const messengerUrl = `fb-messenger://share?link=${encodedUrl}`;

    const canOpen = await Linking.canOpenURL(messengerUrl);

    if (canOpen) {
      await Linking.openURL(messengerUrl);
      return true;
    } else {
      // Fallback to web
      const webUrl = `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=YOUR_APP_ID&redirect_uri=${encodedUrl}`;
      await WebBrowser.openBrowserAsync(webUrl);
      return true;
    }
  } catch (error) {
    console.error('Error sharing to Messenger:', error);
    Alert.alert('Error', 'Failed to open Messenger');
    return false;
  }
}

/**
 * Use native share functionality (shares to Facebook and other apps)
 */
export async function useNativeShare(content: {
  message: string;
  url?: string;
  title?: string;
}): Promise<boolean> {
  try {
    const Share = await import('react-native').then((m) => m.Share);

    const result = await Share.share(
      {
        message: content.message,
        url: content.url,
        title: content.title,
      },
      {
        // Android only
        dialogTitle: content.title || 'Share',
      }
    );

    if (result.action === Share.sharedAction) {
      return true;
    } else if (result.action === Share.dismissedAction) {
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error using native share:', error);
    return false;
  }
}
