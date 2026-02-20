/**
 * Function to initialize quick schedules in Firestore
 * Call this from your app when logged in as an admin
 */

import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_QUICK_SCHEDULES = [
  { id: 'quick_10min', label: '10 min', minutes: 10, icon: 'timer-outline', color: '#1E40AF', order: 1 },
  { id: 'quick_30min', label: '30 min', minutes: 30, icon: 'timer-outline', color: '#1E40AF', order: 2 },
  { id: 'quick_1hour', label: '1 hour', hours: 1, icon: 'hourglass-outline', color: '#BE185D', order: 3 },
  { id: 'quick_2hours', label: '2 hours', hours: 2, icon: 'hourglass-outline', color: '#BE185D', order: 4 },
  { id: 'quick_tomorrow', label: 'Tomorrow', days: 1, icon: 'sunny', color: '#4338CA', order: 5 },
  { id: 'quick_nextweek', label: 'Next Week', days: 7, icon: 'calendar-sharp', color: '#4338CA', order: 6 }
];

export async function initializeQuickSchedules() {
  try {
    console.log('Checking existing schedules...');
    const snapshot = await getDocs(collection(db, 'quickSchedules'));

    if (snapshot.size > 0) {
      console.log('✅ Quick schedules already initialized (' + snapshot.size + ' schedules found)');
      return { success: true, message: `Quick schedules already initialized (${snapshot.size} schedules found)` };
    }

    console.log('Creating default quick schedules...');
    for (const schedule of DEFAULT_QUICK_SCHEDULES) {
      await setDoc(doc(db, 'quickSchedules', schedule.id), schedule);
      console.log('  ✓ Created:', schedule.label);
    }

    console.log('\n✅ Successfully initialized ' + DEFAULT_QUICK_SCHEDULES.length + ' quick schedules!');
    return { success: true, message: `Successfully initialized ${DEFAULT_QUICK_SCHEDULES.length} quick schedules!` };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, message: error.message };
  }
}
