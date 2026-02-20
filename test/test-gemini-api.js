// Test script for Gemini API
// Run with: node test-gemini-api.js YOUR_API_KEY_HERE

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('Usage: node test-gemini-api.js YOUR_API_KEY');
  process.exit(1);
}

async function testGeminiAPI() {
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const testPrompt = 'Write a short social media post about innovation in technology.';

  console.log('Testing Gemini API...');
  console.log('Endpoint:', apiUrl.replace(apiKey, 'YOUR_API_KEY'));
  console.log('Prompt:', testPrompt);
  console.log('\n--- Sending request ---\n');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      }),
    });

    console.log('Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Error:');
      console.error('Status:', response.status);
      console.error('Response:', errorText);
      return;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log('\n✅ Success! Generated content:\n');
      console.log('─'.repeat(60));
      console.log(generatedText);
      console.log('─'.repeat(60));
    } else {
      console.log('\n⚠️ Response received but no content generated');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiAPI();
