import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type GeminiDoc = {
  apiKey?: string;
  key?: string;
  geminiApiKey?: string;
};

const GEMINI_COLLECTION = 'GeminiApi';
const GEMINI_DOC_ID = 'current';

const extractKey = (data?: GeminiDoc) => data?.apiKey || data?.key || data?.geminiApiKey || '';

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
      timestamp: serverTimestamp(),
      ipAddress: 'N/A', // Could be added with additional setup
    });
  } catch (err) {
    console.error('Failed to log API key access:', err);
  }
}

export async function fetchGeminiApiKey(): Promise<string> {
  try {
    // Prefer a well-known document ID to avoid extra reads when present
    const namedDocRef = doc(db, GEMINI_COLLECTION, GEMINI_DOC_ID);
    const namedDocSnap = await getDoc(namedDocRef);
    
    let result: string;
    if (namedDocSnap.exists()) {
      result = extractKey(namedDocSnap.data() as GeminiDoc);
    } else {
      const snapshot = await getDocs(query(collection(db, GEMINI_COLLECTION), limit(1)));
      const firstDocData = snapshot.docs[0]?.data() as GeminiDoc | undefined;
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

export async function persistGeminiApiKey(apiKey: string): Promise<string> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error('API key is empty');
  }

  try {
    const target = doc(db, GEMINI_COLLECTION, GEMINI_DOC_ID);
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
