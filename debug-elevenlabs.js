/**
 * Debug script to test ElevenLabs API directly
 */

import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const voice_id = 'g6xIsTj2HwM6VR4iXFCw'; // Female voice

if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not found in environment');
    process.exit(1);
}

// Test with a sample meditation text (should be ~30-45 seconds of audio)
const testText = `Bienvenue dans cette méditation de 5 minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix. Portez votre attention sur votre respiration naturelle, sans chercher à la modifier. Observez simplement l'air qui entre et qui sort. À chaque expiration, relâchez un peu plus les tensions de votre journée.`;

console.log(`🎙️ Testing ElevenLabs API with text: "${testText.substring(0, 50)}..."`);
console.log(`📊 Text length: ${testText.length} characters, ~${Math.round(testText.split(' ').length / 2)} words`);

async function testElevenLabsAPI() {
    try {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`;
        
        console.log(`🔗 API URL: ${url}`);
        
        const payload = {
            text: testText,
            next_text: ". With a calm and relaxing voice",
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            }
        };
        
        console.log(`📤 Request payload:`, JSON.stringify(payload, null, 2));
        
        const startTime = Date.now();
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            body: JSON.stringify(payload),
        });
        
        const requestTime = Date.now() - startTime;
        console.log(`⏱️ Request time: ${requestTime}ms`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            console.error(`❌ Error body: ${errorText}`);
            return;
        }
        
        console.log(`✅ Response OK: ${response.status}`);
        console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.body) {
            console.error('❌ No response body');
            return;
        }
        
        // Read the audio stream
        const audioBuffer = await response.arrayBuffer();
        const audioSize = audioBuffer.byteLength;
        
        console.log(`🎵 Audio received: ${audioSize} bytes (${(audioSize / 1024).toFixed(2)} KB)`);
        
        // Estimate duration (rough calculation: MP3 128kbps = ~16KB per second)
        const estimatedDuration = audioSize / (128 * 1024 / 8); // 128kbps in bytes per second
        console.log(`⏱️ Estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
        
        // Save for inspection
        const filename = `debug-elevenlabs-${Date.now()}.mp3`;
        writeFileSync(filename, Buffer.from(audioBuffer));
        console.log(`💾 Audio saved as: ${filename}`);
        
        // Expected vs actual analysis
        const expectedWords = testText.split(' ').length;
        const expectedDurationSeconds = expectedWords / 2; // ~2 words per second for meditation
        
        console.log(`\n📊 ANALYSIS:`);
        console.log(`   Text: ${testText.length} chars, ${expectedWords} words`);
        console.log(`   Expected duration: ~${expectedDurationSeconds} seconds`);
        console.log(`   Actual duration: ~${estimatedDuration.toFixed(2)} seconds`);
        console.log(`   Size ratio: ${(audioSize / 1024).toFixed(2)} KB`);
        
        if (estimatedDuration < 5) {
            console.log(`⚠️ WARNING: Audio appears truncated! Expected ~${expectedDurationSeconds}s, got ~${estimatedDuration.toFixed(2)}s`);
        } else {
            console.log(`✅ Audio duration looks reasonable`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testElevenLabsAPI().then(() => {
    console.log('🏁 Test completed');
}).catch(console.error);
