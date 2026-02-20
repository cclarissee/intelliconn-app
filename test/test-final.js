#!/usr/bin/env node

/**
 * Test the updated model name
 */

const apiKey = 'SyA98XFw_mLUeE33vkR_AGBf8H1hIuPsruw';

async function testModel() {
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
  console.log('🔍 Testing Gemini 2.0 Flash model...\n');
  console.log('📝 Prompt: "Write a short social media post about AI technology"\n');

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Write a short social media post about AI technology'
          }]
        }]
      }),
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log('✅ SUCCESS! Generated content:\n');
      console.log('═'.repeat(70));
      console.log(generatedText.trim());
      console.log('═'.repeat(70));
      console.log('\n✨ The Gemini API is working correctly with gemini-2.0-flash!\n');
    } else {
      console.log('⚠️  No content generated');
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testModel();
