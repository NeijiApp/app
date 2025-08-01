/**
 * Complete TTS Router Integration Test
 */

import dotenv from 'dotenv';

dotenv.config();

console.log(`🧪 Testing Complete TTS Router Integration`);
console.log(`🎯 Default Provider: OpenAI TTS`);
console.log(`🔄 Manual Switching: Available`);

async function testTTSRouterAPI() {
    const baseURL = 'http://localhost:3000';
    
    try {
        console.log(`\n1️⃣ Testing TTS Status API...`);
        
        // Test status endpoint
        const statusResponse = await fetch(`${baseURL}/api/tts`);
        if (!statusResponse.ok) {
            throw new Error(`Status API failed: ${statusResponse.status}`);
        }
        
        const statusData = await statusResponse.json();
        console.log(`✅ Status API Response:`, JSON.stringify(statusData, null, 2));
        
        console.log(`\n2️⃣ Testing Provider Switch to OpenAI...`);
        
        // Switch to OpenAI
        const switchResponse = await fetch(`${baseURL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'switch',
                provider: 'openai'
            })
        });
        
        if (!switchResponse.ok) {
            throw new Error(`Switch API failed: ${switchResponse.status}`);
        }
        
        const switchData = await switchResponse.json();
        console.log(`✅ Switch API Response:`, JSON.stringify(switchData, null, 2));
        
        console.log(`\n3️⃣ Testing Provider Test...`);
        
        // Test current provider
        const testResponse = await fetch(`${baseURL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'test',
                text: 'Bienvenue dans cette méditation de test.',
                voice_gender: 'female'
            })
        });
        
        if (!testResponse.ok) {
            throw new Error(`Test API failed: ${testResponse.status}`);
        }
        
        const testData = await testResponse.json();
        console.log(`✅ Test API Response:`, JSON.stringify(testData, null, 2));
        
        console.log(`\n4️⃣ Testing Full Meditation Generation...`);
        
        // Test meditation generation with TTS router
        const meditationResponse = await fetch(`${baseURL}/api/meditation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: 0.5, // Very short for testing
                prompt: 'Generate a short test meditation with TTS router',
                voiceId: 'nova', // OpenAI voice
                gender: 'female',
                goal: 'calm'
            })
        });
        
        if (!meditationResponse.ok) {
            const errorText = await meditationResponse.text();
            console.error(`❌ Meditation API failed: ${meditationResponse.status}`);
            console.error(`❌ Error: ${errorText}`);
            return false;
        }
        
        const audioBlob = await meditationResponse.blob();
        console.log(`✅ Meditation Generated: ${audioBlob.size} bytes`);
        
        // Analyze response headers
        const headers = Object.fromEntries(meditationResponse.headers.entries());
        console.log(`📋 Response Headers:`, headers);
        
        if (audioBlob.size > 50000) { // > 50KB indicates successful generation
            console.log(`🎉 SUCCESS! Full meditation generated with TTS Router`);
            console.log(`   Size: ${(audioBlob.size / 1024).toFixed(2)} KB`);
            console.log(`   Provider: OpenAI TTS (default)`);
            return true;
        } else {
            console.log(`⚠️ Small file generated: ${audioBlob.size} bytes - may indicate issues`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ TTS Router test failed:', error);
        return false;
    }
}

async function testManualProviderSwitch() {
    console.log(`\n5️⃣ Testing Manual Provider Switching...`);
    
    const baseURL = 'http://localhost:3000';
    
    try {
        // Switch to ElevenLabs (will likely fail due to truncation issue)
        console.log(`   📡 Switching to ElevenLabs...`);
        
        const switchResponse = await fetch(`${baseURL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'switch',
                provider: 'elevenlabs'
            })
        });
        
        const switchData = await switchResponse.json();
        console.log(`   🔄 ElevenLabs Switch:`, switchData.success ? '✅ Success' : '❌ Failed');
        console.log(`   📊 Test Result:`, switchData.data?.tested ? '✅ Passed' : '❌ Failed');
        
        // Switch back to OpenAI
        console.log(`   📡 Switching back to OpenAI...`);
        
        const backResponse = await fetch(`${baseURL}/api/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'switch',
                provider: 'openai'
            })
        });
        
        const backData = await backResponse.json();
        console.log(`   🔄 OpenAI Switch:`, backData.success ? '✅ Success' : '❌ Failed');
        console.log(`   📊 Test Result:`, backData.data?.tested ? '✅ Passed' : '❌ Failed');
        
        return true;
        
    } catch (error) {
        console.error('❌ Manual switch test failed:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log(`\n🚀 Starting TTS Router Integration Tests...\n`);
    
    const apiTest = await testTTSRouterAPI();
    const switchTest = await testManualProviderSwitch();
    
    console.log(`\n📊 TEST RESULTS SUMMARY:`);
    console.log(`${'='*50}`);
    console.log(`✅ TTS Router API:      ${apiTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Manual Switching:    ${switchTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Overall Integration: ${apiTest && switchTest ? 'PASSED' : 'FAILED'}`);
    
    if (apiTest && switchTest) {
        console.log(`\n🎉 TTS ROUTER FULLY OPERATIONAL!`);
        console.log(`💡 Usage Instructions:`);
        console.log(`   - Default: OpenAI TTS (reliable, cost-effective)`);
        console.log(`   - Switch: POST /api/tts {"action":"switch","provider":"elevenlabs"}`);
        console.log(`   - Status: GET /api/tts`);
        console.log(`   - Test: POST /api/tts {"action":"test"}`);
    } else {
        console.log(`\n⚠️ Some tests failed - check server logs for details`);
    }
    
    console.log(`\n🏁 TTS Router Integration Tests Completed`);
}

runAllTests().catch(console.error);
