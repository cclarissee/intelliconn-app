import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date | null;
  isHidden?: boolean;
  createdBy?: string;
}

export interface GetAnnouncementsOptions {
  includeExpired?: boolean;
  includeHidden?: boolean;
  onlyExpired?: boolean;
  now?: Date;
}

/**
 * Create a new announcement
 */
export async function createAnnouncement(announcementData: Omit<Announcement, 'id'>) {
  try {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      createdAt: announcementData.createdAt || new Date(),
      updatedAt: announcementData.updatedAt || new Date(),
      isHidden: announcementData.isHidden ?? false,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
}

/**
 * Get all announcements sorted by most recent
 */
export async function getAnnouncements(
  options: GetAnnouncementsOptions = {}
): Promise<Announcement[]> {
  const {
    includeExpired = false,
    includeHidden = false,
    onlyExpired = false,
    now = new Date(),
  } = options;
  try {
    const q = query(
      collection(db, 'announcements'),
      orderBy('updatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const announcements = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      expiresAt: doc.data().expiresAt?.toDate?.() || null,
      isHidden: doc.data().isHidden ?? false,
    } as Announcement));
    return announcements.filter((announcement) => {
      const expiresAt = announcement.expiresAt || null;
      const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;
      const isHidden = announcement.isHidden === true;

      if (!includeHidden && isHidden) return false;
      if (onlyExpired && !isExpired) return false;
      if (!includeExpired && isExpired) return false;
      return true;
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    throw error;
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncement(
  announcementId: string,
  updates: Partial<Omit<Announcement, 'id'>>
) {
  try {
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncement(announcementId: string) {
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
}
