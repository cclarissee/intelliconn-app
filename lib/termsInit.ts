import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { defaultTerms } from './terms';

export const initializeTermsOfService = async () => {
  try {
    const termsRef = doc(db, 'legal', 'termsOfService');
    const snapshot = await getDoc(termsRef);

    if (snapshot.exists()) {
      return { success: true, message: 'Already initialized' };
    }

    await setDoc(termsRef, defaultTerms);
    return { success: true, message: 'Terms of Service initialized' };
  } catch (error) {
    console.error('Error initializing Terms of Service:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
