#!/usr/bin/env node

/**
 * List available Gemini models
 */

const apiKey = process.argv[2] || '';

async function listModels() {
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
  
  console.log('📋 Fetching available Gemini models...\n');

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Available models:\n');
    
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`Model: ${model.name}`);
        console.log(`  Display Name: ${model.displayName || 'N/A'}`);
        console.log(`  Description: ${model.description || 'N/A'}`);
        console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log('');
      });
      
      // Find models that support generateContent
      const contentGenerators = data.models.filter(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      console.log('\n🎯 Models that support generateContent:');
      contentGenerators.forEach(m => console.log(`  - ${m.name}`));
      
    } else {
      console.log('No models found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
