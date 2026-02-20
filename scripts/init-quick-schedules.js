/**
 * One-time script to initialize quick schedules in Firestore
 * Run this with: node scripts/init-quick-schedules.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const DEFAULT_QUICK_SCHEDULES = [
  { id: 'quick_10min', label: '10 min', minutes: 10, icon: 'timer-outline', color: '#1E40AF', order: 1 },
  { id: 'quick_30min', label: '30 min', minutes: 30, icon: 'timer-outline', color: '#1E40AF', order: 2 },
  { id: 'quick_1hour', label: '1 hour', hours: 1, icon: 'hourglass-outline', color: '#BE185D', order: 3 },
  { id: 'quick_2hours', label: '2 hours', hours: 2, icon: 'hourglass-outline', color: '#BE185D', order: 4 },
  { id: 'quick_tomorrow', label: 'Tomorrow', days: 1, icon: 'sunny', color: '#4338CA', order: 5 },
  { id: 'quick_nextweek', label: 'Next Week', days: 7, icon: 'calendar-sharp', color: '#4338CA', order: 6 }
];

async function initializeQuickSchedules() {
  try {
    const db = admin.firestore();

    console.log('Checking existing schedules...');
    const snapshot = await db.collection('quickSchedules').get();

    if (snapshot.size > 0) {
      console.log('✅ Quick schedules already initialized (' + snapshot.size + ' schedules found)');
      return;
    }

    console.log('Creating default quick schedules...');
    for (const schedule of DEFAULT_QUICK_SCHEDULES) {
      await db.collection('quickSchedules').doc(schedule.id).set(schedule);
      console.log('  ✓ Created:', schedule.label);
    }

    console.log('\n✅ Successfully initialized ' + DEFAULT_QUICK_SCHEDULES.length + ' quick schedules!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initializeQuickSchedules();
