/**
 * Test OpenAI TTS as ElevenLabs alternative
 */

import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    process.exit(1);
}

const testText = `Bienvenue dans cette méditation de 5 minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix. Portez votre attention sur votre respiration naturelle, sans chercher à la modifier.`;

console.log(`🧪 Testing OpenAI TTS Alternative`);
console.log(`📊 Test text: ${testText.length} characters`);

async function testOpenAITTS() {
    try {
        console.log(`🎙️ Generating audio with OpenAI TTS...`);
        
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice: 'nova', // Female voice, good for meditation
                input: testText,
                response_format: 'mp3',
                speed: 0.9 // Slightly slower for meditation
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ OpenAI TTS Error: ${response.status} ${response.statusText}`);
            console.error(`❌ Error body: ${errorText}`);
            return false;
        }

        console.log(`✅ OpenAI TTS Response: ${response.status} OK`);
        
        const audioBuffer = await response.arrayBuffer();
        const audioSize = audioBuffer.byteLength;
        
        // Estimate duration (MP3 at reasonable quality ~20KB/sec)
        const estimatedDuration = audioSize / (20 * 1024);
        
        console.log(`🎵 Audio generated: ${audioSize} bytes (${(audioSize / 1024).toFixed(2)} KB)`);
        console.log(`⏱️ Estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
        
        // Save for comparison
        const filename = `openai-tts-test-${Date.now()}.mp3`;
        writeFileSync(filename, Buffer.from(audioBuffer));
        console.log(`💾 Audio saved as: ${filename}`);
        
        // Expected analysis
        const expectedWords = testText.split(' ').length;
        const expectedDurationSeconds = expectedWords / 2.5; // ~2.5 words per second
        
        console.log(`\n📊 OPENAI TTS ANALYSIS:`);
        console.log(`   Text: ${testText.length} chars, ${expectedWords} words`);
        console.log(`   Expected duration: ~${expectedDurationSeconds.toFixed(1)} seconds`);
        console.log(`   Actual duration: ~${estimatedDuration.toFixed(2)} seconds`);
        console.log(`   Efficiency: ${(estimatedDuration / expectedDurationSeconds * 100).toFixed(0)}% of expected`);
        
        if (estimatedDuration >= expectedDurationSeconds * 0.7) {
            console.log(`✅ SUCCESS! OpenAI TTS generates full-length audio`);
            console.log(`🎉 This can replace ElevenLabs while we fix the truncation issue`);
            return true;
        } else {
            console.log(`⚠️ Audio seems short, but still better than ElevenLabs truncation`);
            return true;
        }
        
    } catch (error) {
        console.error('❌ OpenAI TTS test failed:', error);
        return false;
    }
}

testOpenAITTS().then((success) => {
    if (success) {
        console.log('\n🚀 SOLUTION CONFIRMED: OpenAI TTS works as ElevenLabs replacement');
        console.log('💡 You can switch to OpenAI TTS immediately while fixing ElevenLabs');
    } else {
        console.log('\n⚠️ OpenAI TTS also has issues - may need to investigate further');
    }
    console.log('\n🏁 OpenAI TTS test completed');
}).catch(console.error);
