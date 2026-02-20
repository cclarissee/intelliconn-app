import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type UnsplashDoc = {
  apiKey?: string;
  accessKey?: string;
  unsplashApiKey?: string;
};

const UNSPLASH_COLLECTION = 'UnsplashApi';
const UNSPLASH_DOC_ID = 'current';

const extractKey = (data?: UnsplashDoc) => data?.apiKey || data?.accessKey || data?.unsplashApiKey || '';

// Log API key access for security audit
async function logApiKeyAccess(action: 'read' | 'write', success: boolean, error?: string) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'ApiKeyAuditLog'), {
      action,
      success,
      error: error || null,
      userId: user?.uid || 'unknown',
      userEmail: user?.email || 'unknown',
      service: 'unsplash',
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log API key access:', err);
  }
}

export async function fetchUnsplashApiKey(): Promise<string> {
  try {
    // Prefer a well-known document ID to avoid extra reads when present
    const namedDocRef = doc(db, UNSPLASH_COLLECTION, UNSPLASH_DOC_ID);
    const namedDocSnap = await getDoc(namedDocRef);
    
    let result: string;
    if (namedDocSnap.exists()) {
      result = extractKey(namedDocSnap.data() as UnsplashDoc);
    } else {
      const snapshot = await getDocs(query(collection(db, UNSPLASH_COLLECTION), limit(1)));
      const firstDocData = snapshot.docs[0]?.data() as UnsplashDoc | undefined;
      result = extractKey(firstDocData);
    }
    
    // Log successful read
    await logApiKeyAccess('read', true);
    return result;
  } catch (error) {
    // Log failed read
    await logApiKeyAccess('read', false, (error as Error).message);
    throw error;
  }
}

export async function persistUnsplashApiKey(apiKey: string): Promise<string> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('API key is empty');
  }

  try {
    const target = doc(db, UNSPLASH_COLLECTION, UNSPLASH_DOC_ID);
    await setDoc(target, { apiKey: trimmed, updatedAt: serverTimestamp() }, { merge: true });
    
    // Log successful write
    await logApiKeyAccess('write', true);
    return trimmed;
  } catch (error) {
    // Log failed write
    await logApiKeyAccess('write', false, (error as Error).message);
    throw error;
  }
}

// Debug function to check current API key and validate with Unsplash
export async function debugUnsplashApiKey(): Promise<{ hasKey: boolean; errorMessage?: string }> {
  try {
    const apiKey = await fetchUnsplashApiKey();
    
    if (!apiKey) {
      return { 
        hasKey: false, 
        errorMessage: 'No API key found in Firestore collection "UnsplashApi" document "current"' 
      };
    }

    // Test the API key with a simple request
    const testResponse = await fetch(
      'https://api.unsplash.com/search/photos?query=test&per_page=1',
      {
        headers: {
          Authorization: `Client-ID ${apiKey}`,
        },
      }
    );

    if (testResponse.status === 401) {
      return { 
        hasKey: true, 
        errorMessage: 'API key is invalid or expired (401 Unauthorized)' 
      };
    }

    if (!testResponse.ok) {
      return { 
        hasKey: true, 
        errorMessage: `API returned status ${testResponse.status}` 
      };
    }

    return { hasKey: true };
  } catch (error) {
    return { 
      hasKey: false, 
      errorMessage: `Error checking API key: ${(error as Error).message}` 
    };
  }
}
