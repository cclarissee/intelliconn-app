import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface ConnectedAccount {
  platform: 'facebook' | 'instagram' | 'twitter';
  connected: boolean;
  accessToken?: string;
  tokenExpiry?: Date;
  pageId?: string; // For Facebook pages
  pageName?: string;
  profileImageUrl?: string;
  accountId?: string; // For Instagram business accounts
  accountName?: string;
  permissions?: string[];
  lastConnected?: Date;
}

export interface UserConnectedAccounts {
  userId: string;
  facebook?: ConnectedAccount;
  instagram?: ConnectedAccount;
  twitter?: ConnectedAccount;
  updatedAt?: Date;
}

export interface GlobalConnectedAccounts {
  facebook?: ConnectedAccount;
  instagram?: ConnectedAccount;
  twitter?: ConnectedAccount;
  updatedAt?: Date;
  managedBy?: string; // Admin user ID who set it up
}

/**
 * Save or update a connected account for a user
 */
export async function saveConnectedAccount(
  userId: string,
  platform: 'facebook' | 'instagram' | 'twitter',
  accountData: Partial<ConnectedAccount>
): Promise<void> {
  try {
    const userAccountsRef = doc(db, 'connectedAccounts', userId);
    const accountDoc = await getDoc(userAccountsRef);

    const accountInfo: ConnectedAccount = {
      platform,
      connected: true,
      ...accountData,
      lastConnected: new Date(),
    };

    if (accountDoc.exists()) {
      // Update existing document
      await updateDoc(userAccountsRef, {
        [platform]: accountInfo,
        updatedAt: new Date(),
      });
    } else {
      // Create new document
      await setDoc(userAccountsRef, {
        userId,
        [platform]: accountInfo,
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error saving connected account:', error);
    throw error;
  }
}

/**
 * Get all connected accounts for a user
 */
export async function getConnectedAccounts(userId: string): Promise<UserConnectedAccounts | null> {
  try {
    const userAccountsRef = doc(db, 'connectedAccounts', userId);
    const accountDoc = await getDoc(userAccountsRef);

    if (accountDoc.exists()) {
      return accountDoc.data() as UserConnectedAccounts;
    }
    return null;
  } catch (error) {
    console.error('Error fetching connected accounts:', error);
    throw error;
  }
}

/**
 * Remove a connected account
 */
export async function removeConnectedAccount(
  userId: string,
  platform: 'facebook' | 'instagram' | 'twitter'
): Promise<void> {
  try {
    const userAccountsRef = doc(db, 'connectedAccounts', userId);
    await updateDoc(userAccountsRef, {
      [platform]: {
        platform,
        connected: false,
        accessToken: null,
        tokenExpiry: null,
        pageId: null,
        pageName: null,
        profileImageUrl: null,
        accountId: null,
        accountName: null,
        permissions: [],
      },
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error removing connected account:', error);
    throw error;
  }
}

/**
 * Check if a connected account token is still valid
 */
export function isTokenValid(account?: ConnectedAccount): boolean {
  if (!account || !account.connected || !account.accessToken) {
    return false;
  }

  if (account.tokenExpiry) {
    return new Date() < new Date(account.tokenExpiry);
  }

  // If no expiry set, assume it's valid
  return true;
}

/**
 * Get a valid access token for posting to a platform
 */
export async function getValidAccessToken(
  userId: string,
  platform: 'facebook' | 'instagram' | 'twitter'
): Promise<string | null> {
  try {
    const accounts = await getConnectedAccounts(userId);
    if (!accounts) return null;

    const account = accounts[platform];
    if (isTokenValid(account)) {
      return account!.accessToken || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * ============================================
 * GLOBAL CONNECTED ACCOUNTS (SHARED SYSTEM)
 * ============================================
 * These functions manage social media accounts that are shared
 * across all users. Only admins can connect/disconnect accounts.
 */

/**
 * Save or update a global connected account (Admin only)
 */
export async function saveGlobalConnectedAccount(
  platform: 'facebook' | 'instagram' | 'twitter',
  accountData: Partial<ConnectedAccount>,
  adminUserId: string
): Promise<void> {
  try {
    const globalAccountsRef = doc(db, 'globalConnectedAccounts', 'main');
    const accountDoc = await getDoc(globalAccountsRef);

    const accountInfo: ConnectedAccount = {
      platform,
      connected: true,
      ...accountData,
      lastConnected: new Date(),
    };

    if (accountDoc.exists()) {
      // Update existing document
      await updateDoc(globalAccountsRef, {
        [platform]: accountInfo,
        updatedAt: new Date(),
        managedBy: adminUserId,
      });
    } else {
      // Create new document
      await setDoc(globalAccountsRef, {
        [platform]: accountInfo,
        updatedAt: new Date(),
        managedBy: adminUserId,
      });
    }
  } catch (error) {
    console.error('Error saving global connected account:', error);
    throw error;
  }
}

/**
 * Get global connected accounts (accessible by all authenticated users)
 */
export async function getGlobalConnectedAccounts(): Promise<GlobalConnectedAccounts | null> {
  try {
    const globalAccountsRef = doc(db, 'globalConnectedAccounts', 'main');
    const accountDoc = await getDoc(globalAccountsRef);

    if (accountDoc.exists()) {
      return accountDoc.data() as GlobalConnectedAccounts;
    }
    return null;
  } catch (error) {
    console.error('Error fetching global connected accounts:', error);
    throw error;
  }
}

/**
 * Remove a global connected account (Admin only)
 */
export async function removeGlobalConnectedAccount(
  platform: 'facebook' | 'instagram' | 'twitter'
): Promise<void> {
  try {
    const globalAccountsRef = doc(db, 'globalConnectedAccounts', 'main');
    await updateDoc(globalAccountsRef, {
      [platform]: {
        platform,
        connected: false,
        accessToken: null,
        tokenExpiry: null,
        pageId: null,
        pageName: null,
        profileImageUrl: null,
        accountId: null,
        accountName: null,
        permissions: [],
      },
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error removing global connected account:', error);
    throw error;
  }
}

/**
 * Get a valid access token for posting from global accounts
 * This is what all users will use for posting
 */
export async function getGlobalAccessToken(
  platform: 'facebook' | 'instagram' | 'twitter'
): Promise<string | null> {
  try {
    const accounts = await getGlobalConnectedAccounts();
    if (!accounts) return null;

    const account = accounts[platform];
    if (isTokenValid(account)) {
      return account!.accessToken || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting global access token:', error);
    return null;
  }
}
