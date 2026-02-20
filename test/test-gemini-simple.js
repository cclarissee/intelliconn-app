#!/usr/bin/env node

/**
 * Gemini API Tester
 * 
 * Usage:
 * 1. Get your Gemini API key from Google AI Studio (https://makersuite.google.com/app/apikey)
 * 2. Run: node test-gemini-simple.js
 * 3. Enter your API key when prompted
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testAPI(apiKey) {
  const trimmedKey = apiKey.trim();
  
  if (!trimmedKey) {
    console.log('❌ API key cannot be empty');
    process.exit(1);
  }

  console.log('\n🔍 Testing Gemini API endpoint...\n');
  
  // Test the /v1/ endpoint (current)
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${trimmedKey}`;
  
  console.log('📍 Endpoint: /v1/models/gemini-pro:generateContent');
  console.log('📝 Test prompt: "Say hello in one sentence."\n');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello in one sentence.'
          }]
        }]
      }),
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ API Request Failed!\n');
      console.error('Error Response:', errorText);
      
      if (response.status === 404) {
        console.error('\n💡 The endpoint returned 404. The API URL might be incorrect or the model name might have changed.');
        console.error('   Check the latest Gemini API documentation at: https://ai.google.dev/');
      } else if (response.status === 403) {
        console.error('\n💡 API key might be invalid or doesn\'t have permission to access Gemini API.');
      } else if (response.status === 400) {
        console.error('\n💡 Bad request. The request format might be incorrect.');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log('\n✅ SUCCESS! API is working correctly!\n');
      console.log('Generated response:');
      console.log('─'.repeat(60));
      console.log(generatedText.trim());
      console.log('─'.repeat(60));
      console.log('\n✨ Your Gemini API integration is working properly!\n');
    } else {
      console.log('\n⚠️  Response received but no content generated');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Network Error:', error.message);
    console.error('\nFull error:', error);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          Gemini API Integration Test                      ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

rl.question('Enter your Gemini API key: ', (apiKey) => {
  rl.close();
  testAPI(apiKey);
});
