/**
 * Utility to initialize quick schedules in Firestore
 * Call this once to set up the default quick schedule options
 */

import { collection, doc, getDocs, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_QUICK_SCHEDULES = [
  {
    id: 'quick_10min',
    label: '10 min',
    minutes: 10,
    icon: 'timer-outline',
    color: '#1E40AF',
    order: 1
  },
  {
    id: 'quick_30min',
    label: '30 min',
    minutes: 30,
    icon: 'timer-outline',
    color: '#1E40AF',
    order: 2
  },
  {
    id: 'quick_1hour',
    label: '1 hour',
    hours: 1,
    icon: 'hourglass-outline',
    color: '#BE185D',
    order: 3
  },
  {
    id: 'quick_2hours',
    label: '2 hours',
    hours: 2,
    icon: 'hourglass-outline',
    color: '#BE185D',
    order: 4
  },
  {
    id: 'quick_tomorrow',
    label: 'Tomorrow',
    days: 1,
    icon: 'sunny',
    color: '#4338CA',
    order: 5
  },
  {
    id: 'quick_nextweek',
    label: 'Next Week',
    days: 7,
    icon: 'calendar-sharp',
    color: '#4338CA',
    order: 6
  }
];

/**
 * Initialize quick schedules in Firestore
 * This creates the quickSchedules collection with default values
 */
export const initializeQuickSchedules = async () => {
  try {
    // Check if collection already exists
    const q = query(collection(db, 'quickSchedules'));
    const snapshot = await getDocs(q);
    
    // If already initialized, don't reinitialize
    if (snapshot.size > 0) {
      console.log('Quick schedules already initialized');
      return { success: true, message: 'Already initialized' };
    }

    // Create default quick schedules
    for (const schedule of DEFAULT_QUICK_SCHEDULES) {
      await setDoc(doc(db, 'quickSchedules', schedule.id), schedule);
    }

    console.log('Quick schedules initialized successfully');
    return { success: true, message: 'Quick schedules initialized' };
  } catch (error) {
    console.error('Error initializing quick schedules:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Add a new quick schedule to Firestore
 */
export const addQuickSchedule = async (
  id: string,
  label: string,
  scheduleConfig: { minutes?: number; hours?: number; days?: number },
  icon?: string,
  color?: string
) => {
  try {
    // Get the next order number
    const q = query(collection(db, 'quickSchedules'));
    const snapshot = await getDocs(q);
    const nextOrder = snapshot.size + 1;

    await setDoc(doc(db, 'quickSchedules', id), {
      id,
      label,
      ...scheduleConfig,
      icon: icon || 'timer-outline',
      color: color || '#1E40AF',
      order: nextOrder
    });

    return { success: true, message: 'Quick schedule added' };
  } catch (error) {
    console.error('Error adding quick schedule:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
