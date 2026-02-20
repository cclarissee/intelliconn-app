import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type TwitterApiDoc = {
  consumerKey?: string;
  consumerSecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  bearerToken?: string;
};

const TWITTER_COLLECTION = 'TwitterApi';
const TWITTER_DOC_ID = 'current';

const extractKeys = (data?: TwitterApiDoc) => ({
  consumerKey: data?.consumerKey || '',
  consumerSecret: data?.consumerSecret || '',
  accessToken: data?.accessToken || '',
  accessTokenSecret: data?.accessTokenSecret || '',
  bearerToken: data?.bearerToken || '',
});

async function logApiKeyAccess(action: 'read' | 'write', success: boolean, error?: string) {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'ApiKeyAuditLog'), {
      action,
      success,
      error: error || null,
      userId: user?.uid || 'unknown',
      userEmail: user?.email || 'unknown',
      service: 'twitter',
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log API key access:', err);
  }
}

export async function fetchTwitterApiKeys(): Promise<TwitterApiDoc> {
  try {
    const namedDocRef = doc(db, TWITTER_COLLECTION, TWITTER_DOC_ID);
    const namedDocSnap = await getDoc(namedDocRef);

    let result: TwitterApiDoc;
    if (namedDocSnap.exists()) {
      result = extractKeys(namedDocSnap.data() as TwitterApiDoc);
    } else {
      const snapshot = await getDocs(query(collection(db, TWITTER_COLLECTION), limit(1)));
      const firstDocData = snapshot.docs[0]?.data() as TwitterApiDoc | undefined;
      result = extractKeys(firstDocData);
    }

    await logApiKeyAccess('read', true);
    return result;
  } catch (error) {
    await logApiKeyAccess('read', false, (error as Error).message);
    throw error;
  }
}

export async function persistTwitterApiKeys(keys: TwitterApiDoc): Promise<TwitterApiDoc> {
  const cleaned: TwitterApiDoc = {
    consumerKey: keys.consumerKey?.trim() || '',
    consumerSecret: keys.consumerSecret?.trim() || '',
    accessToken: keys.accessToken?.trim() || '',
    accessTokenSecret: keys.accessTokenSecret?.trim() || '',
    bearerToken: keys.bearerToken?.trim() || '',
  };

  try {
    const target = doc(db, TWITTER_COLLECTION, TWITTER_DOC_ID);
    await setDoc(target, { ...cleaned, updatedAt: serverTimestamp() }, { merge: true });
    await logApiKeyAccess('write', true);
    return cleaned;
  } catch (error) {
    await logApiKeyAccess('write', false, (error as Error).message);
    throw error;
  }
}
