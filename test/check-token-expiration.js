// Check Facebook token expiration
const accessToken = 'EAALAr5Dc7QgBQvedDZBpU0OgfdT3RzqUBuO5SH0rGlVlZBKnptcxnzZBnZA9jypL6FlCf4OupX6ADXJVKLFZBZCO37ZAOtc1KlEqeQNKTKSG252LojROZAhsDigLpvRGXCtMvgYms9gFdJYJ2cwk2EvubvYIO5fsqZC9cec3VdNkJapkZCDSGVrhZBG7R2WZCPBTCTC07hh43CPh44CbSFG5A32jZAm3gvx8M6wprH4ZBjBZAxEzLTP';

async function checkExpiration() {
  console.log('Checking token expiration...\n');

  try {
    // Get page token first
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
      console.error('Could not fetch page info');
      return;
    }

    const page = pagesData.data[0];
    const pageToken = page.access_token;

    // Check user token expiration
    console.log('1️⃣  USER TOKEN:');
    const userDebugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const userDebugData = await userDebugResponse.json();

    if (userDebugData.data) {
      console.log(`   Type: ${userDebugData.data.type}`);
      console.log(`   Valid: ${userDebugData.data.is_valid ? '✅' : '❌'}`);
      
      if (userDebugData.data.expires_at) {
        const expiryDate = new Date(userDebugData.data.expires_at * 1000);
        const now = new Date();
        const daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        console.log(`   Expires: ${expiryDate.toLocaleString()}`);
        console.log(`   Days left: ${daysLeft} days`);
        
        if (daysLeft < 7) {
          console.log('   ⚠️  WARNING: Token expires soon!');
        }
      } else {
        console.log('   Expires: ♾️  Never (long-lived token)');
      }
    }

    // Check page token expiration
    console.log('\n2️⃣  PAGE TOKEN (for posting):');
    const pageDebugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${pageToken}&access_token=${accessToken}`
    );
    const pageDebugData = await pageDebugResponse.json();

    if (pageDebugData.data) {
      console.log(`   Type: ${pageDebugData.data.type}`);
      console.log(`   Valid: ${pageDebugData.data.is_valid ? '✅' : '❌'}`);
      
      if (pageDebugData.data.expires_at) {
        const expiryDate = new Date(pageDebugData.data.expires_at * 1000);
        const now = new Date();
        const daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        console.log(`   Expires: ${expiryDate.toLocaleString()}`);
        console.log(`   Days left: ${daysLeft} days`);
        
        if (daysLeft < 7) {
          console.log('   ⚠️  WARNING: Token expires soon!');
        }
      } else {
        console.log('   Expires: ♾️  Never (long-lived token)');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('WHAT THIS MEANS:');
    console.log('='.repeat(60));
    console.log('\n📌 Token Types:');
    console.log('   • Short-lived: 1-2 hours (rare)');
    console.log('   • Long-lived: 60 days');
    console.log('   • Never expires: Page tokens (if app is approved)');
    
    console.log('\n🔄 What happens when it expires:');
    console.log('   • You\'ll need to reconnect Facebook in the app');
    console.log('   • Go to Settings → Manage Connected Accounts');
    console.log('   • Disconnect and reconnect with a new token');
    
    console.log('\n💡 To get a non-expiring token:');
    console.log('   1. Exchange user token for long-lived token (60 days)');
    console.log('   2. Use that to get page token (never expires)');
    console.log('   3. Store the page token (that\'s what the app uses)');
    
    console.log('\n✅ Good news:');
    console.log('   • Page tokens often don\'t expire if app stays active');
    console.log('   • Your app is already using the page token');
    console.log('   • You only need to reconnect when/if it expires');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkExpiration();
