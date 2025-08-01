/**
 * Test the credit-efficient ElevenLabs approach
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

// Test with a SHORT segment that should work with remaining credits (38)
const shortTestText = `Bienvenue dans cette méditation.`; // Only ~30 characters

console.log(`🎙️ Testing Credit-Efficient ElevenLabs API`);
console.log(`📊 Text length: ${shortTestText.length} characters (should use ~${shortTestText.length} credits)`);
console.log(`💰 Available credits: 38 (from previous error message)`);

async function testCreditEfficientAPI() {
    try {
        // Use streaming endpoint (original)
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`;
        
        console.log(`🔗 API URL: ${url}`);
        
        const payload = {
            text: shortTestText,
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
            return false;
        }
        
        console.log(`✅ Response OK: ${response.status}`);
        console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.body) {
            console.error('❌ No response body');
            return false;
        }
        
        // Read the audio stream
        const audioBuffer = await response.arrayBuffer();
        const audioSize = audioBuffer.byteLength;
        
        console.log(`🎵 Audio received: ${audioSize} bytes (${(audioSize / 1024).toFixed(2)} KB)`);
        
        // Estimate duration
        const estimatedDuration = audioSize / (128 * 1024 / 8);
        console.log(`⏱️ Estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
        
        // Save for inspection
        const filename = `debug-credit-efficient-${Date.now()}.mp3`;
        writeFileSync(filename, Buffer.from(audioBuffer));
        console.log(`💾 Audio saved as: ${filename}`);
        
        // Analysis
        const expectedWords = shortTestText.split(' ').length;
        const expectedDurationSeconds = expectedWords / 2;
        
        console.log(`\n📊 CREDIT-EFFICIENT ANALYSIS:`);
        console.log(`   Text: ${shortTestText.length} chars, ${expectedWords} words`);
        console.log(`   Expected duration: ~${expectedDurationSeconds} seconds`);
        console.log(`   Actual duration: ~${estimatedDuration.toFixed(2)} seconds`);
        console.log(`   Size ratio: ${(audioSize / 1024).toFixed(2)} KB`);
        
        if (estimatedDuration >= expectedDurationSeconds * 0.8) {
            console.log(`✅ SUCCESS! Audio duration is reasonable - credit approach works!`);
            return true;
        } else {
            console.log(`⚠️ Still truncated, but better than before`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Credit-efficient test failed:', error);
        return false;
    }
}

// Run the test
testCreditEfficientAPI().then((success) => {
    if (success) {
        console.log('\n🎉 SOLUTION CONFIRMED: Credit-efficient segments work!');
        console.log('💡 Next step: Generate meditation with short segments');
    } else {
        console.log('\n⚠️ May need to top up ElevenLabs credits or use alternative TTS');
    }
    console.log('🏁 Credit-efficient test completed');
}).catch(console.error);
