/**
 * Test different ElevenLabs API parameters to find the root cause
 */

import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const testText = `Bienvenue dans cette méditation de 5 minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix.`;

console.log(`🔬 Comprehensive ElevenLabs Parameter Testing`);
console.log(`📊 Test text: ${testText.length} characters`);

async function testElevenLabsAPI(config) {
    try {
        console.log(`\n🧪 Testing: ${config.name}`);
        console.log(`   Model: ${config.model_id}`);
        console.log(`   Voice: ${config.voice_id}`);
        console.log(`   Endpoint: ${config.endpoint_type}`);
        
        const voice_id = config.voice_id;
        const url = config.endpoint_type === 'streaming' 
            ? `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`
            : `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;
        
        const payload = {
            text: testText,
            model_id: config.model_id,
            voice_settings: config.voice_settings
        };
        
        // Add next_text only for streaming
        if (config.endpoint_type === 'streaming') {
            payload.next_text = ". With a calm and relaxing voice";
        }
        
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
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`   ❌ FAILED: ${response.status} ${response.statusText}`);
            console.log(`   Error: ${errorText}`);
            return { success: false, duration: 0, size: 0 };
        }
        
        if (!response.body) {
            console.log(`   ❌ FAILED: No response body`);
            return { success: false, duration: 0, size: 0 };
        }
        
        const audioBuffer = await response.arrayBuffer();
        const audioSize = audioBuffer.byteLength;
        const estimatedDuration = audioSize / (128 * 1024 / 8);
        
        console.log(`   ✅ SUCCESS: ${audioSize} bytes (${(audioSize / 1024).toFixed(2)} KB)`);
        console.log(`   ⏱️ Duration: ~${estimatedDuration.toFixed(2)}s (${requestTime}ms request)`);
        console.log(`   💰 Cost: ${response.headers.get('character-cost') || 'unknown'} characters`);
        
        // Save sample
        const filename = `test-${config.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.mp3`;
        writeFileSync(filename, Buffer.from(audioBuffer));
        console.log(`   💾 Saved: ${filename}`);
        
        return { 
            success: true, 
            duration: estimatedDuration, 
            size: audioSize, 
            filename,
            requestTime 
        };
        
    } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        return { success: false, duration: 0, size: 0 };
    }
}

async function runComprehensiveTests() {
    const testConfigs = [
        // Test 1: Original configuration (streaming)
        {
            name: "Original Streaming",
            voice_id: 'g6xIsTj2HwM6VR4iXFCw',
            model_id: "eleven_multilingual_v2",
            endpoint_type: 'streaming',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            }
        },
        
        // Test 2: Non-streaming endpoint
        {
            name: "Original Non-Streaming",
            voice_id: 'g6xIsTj2HwM6VR4iXFCw',
            model_id: "eleven_multilingual_v2",
            endpoint_type: 'non-streaming',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            }
        },
        
        // Test 3: Different model (Turbo v2)
        {
            name: "Turbo V2 Streaming",
            voice_id: 'g6xIsTj2HwM6VR4iXFCw',
            model_id: "eleven_turbo_v2",
            endpoint_type: 'streaming',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            }
        },
        
        // Test 4: Minimal voice settings
        {
            name: "Minimal Settings",
            voice_id: 'g6xIsTj2HwM6VR4iXFCw',
            model_id: "eleven_multilingual_v2",
            endpoint_type: 'streaming',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        },
        
        // Test 5: Different voice (male)
        {
            name: "Male Voice Test",
            voice_id: 'pNInz6obpgDQGcFmaJgB', // Male voice
            model_id: "eleven_multilingual_v2",
            endpoint_type: 'streaming',
            voice_settings: {
                stability: 0.75,
                similarity_boost: 0.8,
                style: 0.2,
                use_speaker_boost: true
            }
        }
    ];
    
    console.log(`\n🧪 Running ${testConfigs.length} test configurations...\n`);
    
    const results = [];
    
    for (const config of testConfigs) {
        const result = await testElevenLabsAPI(config);
        results.push({ config: config.name, ...result });
        
        // Wait between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log(`\n📊 TEST RESULTS SUMMARY:`);
    console.log(`${'='*60}`);
    
    for (const result of results) {
        const status = result.success ? '✅' : '❌';
        const duration = result.success ? `${result.duration.toFixed(2)}s` : 'FAILED';
        const size = result.success ? `${(result.size / 1024).toFixed(1)}KB` : '0KB';
        
        console.log(`${status} ${result.config.padEnd(20)} | ${duration.padEnd(8)} | ${size}`);
    }
    
    // Analysis
    const successful = results.filter(r => r.success && r.duration > 5);
    const truncated = results.filter(r => r.success && r.duration < 5);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n🔍 ANALYSIS:`);
    console.log(`   Working (>5s): ${successful.length} tests`);
    console.log(`   Truncated (<5s): ${truncated.length} tests`);
    console.log(`   Failed: ${failed.length} tests`);
    
    if (successful.length > 0) {
        console.log(`\n✅ SOLUTION FOUND! Working configurations:`);
        successful.forEach(r => {
            console.log(`   - ${r.config}: ${r.duration.toFixed(2)}s, ${(r.size / 1024).toFixed(1)}KB`);
        });
    } else if (truncated.length === results.length) {
        console.log(`\n⚠️ ALL TESTS TRUNCATED - This suggests an account-level or API-level limitation`);
    }
}

runComprehensiveTests().then(() => {
    console.log('\n🏁 Comprehensive parameter testing completed');
}).catch(console.error);
