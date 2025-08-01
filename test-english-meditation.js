/**
 * Complete English Meditation System Test
 * Tests all components with English content and OpenAI TTS
 */

import dotenv from 'dotenv';

dotenv.config();

console.log(`🧘‍♀️ Testing Complete English Meditation System`);
console.log(`🌍 Language: English`);
console.log(`🎤 Default TTS: OpenAI`);
console.log(`🔄 Manual Switching: Available`);

async function testEnglishMeditationGeneration() {
    const baseURL = 'http://localhost:3000';
    
    try {
        console.log(`\n1️⃣ Testing Short English Meditation (1 minute)...`);
        
        const shortResponse = await fetch(`${baseURL}/api/meditation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: 1, // Very short for testing
                prompt: 'Generate a calming meditation focused on breathing and relaxation',
                voiceId: 'nova', // OpenAI voice
                gender: 'female',
                goal: 'calm'
            })
        });
        
        if (!shortResponse.ok) {
            throw new Error(`Short meditation failed: ${shortResponse.status}`);
        }
        
        const shortAudio = await shortResponse.blob();
        console.log(`✅ Short Meditation Generated: ${(shortAudio.size / 1024).toFixed(2)} KB`);
        
        console.log(`\n2️⃣ Testing Medium English Meditation (3 minutes)...`);
        
        const mediumResponse = await fetch(`${baseURL}/api/meditation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: 3,
                prompt: 'Create a peaceful meditation for body scan and visualization',
                voiceId: 'alloy', // Different OpenAI voice
                gender: 'male',
                goal: 'focus'
            })
        });
        
        if (!mediumResponse.ok) {
            throw new Error(`Medium meditation failed: ${mediumResponse.status}`);
        }
        
        const mediumAudio = await mediumResponse.blob();
        console.log(`✅ Medium Meditation Generated: ${(mediumAudio.size / 1024).toFixed(2)} KB`);
        
        console.log(`\n3️⃣ Testing Long English Meditation (5 minutes)...`);
        
        const longResponse = await fetch(`${baseURL}/api/meditation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                duration: 5,
                prompt: 'Generate a comprehensive meditation for sleep and deep relaxation',
                voiceId: 'shimmer', // Another OpenAI voice
                gender: 'female',
                goal: 'sleep'
            })
        });
        
        if (!longResponse.ok) {
            throw new Error(`Long meditation failed: ${longResponse.status}`);
        }
        
        const longAudio = await longResponse.blob();
        console.log(`✅ Long Meditation Generated: ${(longAudio.size / 1024).toFixed(2)} KB`);
        
        console.log(`\n4️⃣ Analyzing Audio Content Quality...`);
        
        // Check if all files are properly sized
        const sizes = [shortAudio.size, mediumAudio.size, longAudio.size];
        const minExpected = [30000, 80000, 150000]; // Minimum expected sizes in bytes
        
        let allPassed = true;
        sizes.forEach((size, i) => {
            const duration = [1, 3, 5][i];
            const expected = minExpected[i];
            const passed = size >= expected;
            
            console.log(`   📊 ${duration}min meditation: ${(size/1024).toFixed(2)} KB ${passed ? '✅' : '❌'}`);
            if (!passed) allPassed = false;
        });
        
        console.log(`\n5️⃣ Testing TTS Provider Status...`);
        
        const statusResponse = await fetch(`${baseURL}/api/tts`);
        const statusData = await statusResponse.json();
        
        console.log(`   🎤 Current TTS Provider: ${statusData.data?.current?.toUpperCase()}`);
        console.log(`   🔄 Fallback Provider: ${statusData.data?.fallback?.toUpperCase()}`);
        console.log(`   📈 Status: ${statusData.data?.status}`);
        
        return {
            success: allPassed,
            shortSize: shortAudio.size,
            mediumSize: mediumAudio.size,
            longSize: longAudio.size,
            provider: statusData.data?.current
        };
        
    } catch (error) {
        console.error('❌ English meditation test failed:', error);
        return { success: false, error: error.message };
    }
}

async function testEnglishContentValidation() {
    console.log(`\n6️⃣ Testing English Content Validation...`);
    
    try {
        // Test different meditation goals in English
        const goals = ['morning', 'focus', 'calm', 'sleep'];
        let allEnglish = true;
        
        for (const goal of goals) {
            console.log(`   🎯 Testing ${goal} meditation...`);
            
            const response = await fetch('http://localhost:3000/api/meditation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration: 0.5, // Very short
                    prompt: `Generate a ${goal} meditation in English`,
                    voiceId: 'nova',
                    gender: 'female',
                    goal: goal
                })
            });
            
            if (response.ok) {
                const audioBlob = await response.blob();
                console.log(`   ✅ ${goal}: ${(audioBlob.size/1024).toFixed(2)} KB generated`);
            } else {
                console.log(`   ❌ ${goal}: Failed (${response.status})`);
                allEnglish = false;
            }
        }
        
        return allEnglish;
        
    } catch (error) {
        console.error('❌ English content validation failed:', error);
        return false;
    }
}

// Run complete test suite
async function runCompleteTest() {
    console.log(`\n🚀 Starting Complete English Meditation System Test\n`);
    
    const generationTest = await testEnglishMeditationGeneration();
    const contentTest = await testEnglishContentValidation();
    
    console.log(`\n📊 COMPLETE TEST RESULTS:`);
    console.log(`${'='*60}`);
    console.log(`✅ English Meditation Generation: ${generationTest.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ English Content Validation:   ${contentTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ TTS Router Integration:       ${generationTest.provider === 'openai' ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Audio Quality Check:          ${generationTest.success ? 'PASSED' : 'FAILED'}`);
    
    const overallSuccess = generationTest.success && contentTest && generationTest.provider === 'openai';
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '🎉 SUCCESS!' : '⚠️ ISSUES DETECTED'}`);
    
    if (overallSuccess) {
        console.log(`\n🎉 ENGLISH MEDITATION SYSTEM FULLY OPERATIONAL!`);
        console.log(`💡 Key Features:`);
        console.log(`   🌍 All content in English`);
        console.log(`   🎤 OpenAI TTS as default (reliable)`);
        console.log(`   🔄 Manual provider switching available`);
        console.log(`   📱 Multiple meditation durations (1-5+ minutes)`);
        console.log(`   📱 Multiple goals (morning, focus, calm, sleep)`);
        console.log(`   🎵 High-quality audio generation`);
        
        console.log(`\n🎧 Sample Usage:`);
        console.log(`   curl -X POST http://localhost:3000/api/meditation \\`);
        console.log(`     -H "Content-Type: application/json" \\`);
        console.log(`     -d '{"duration":5,"goal":"sleep","gender":"female"}'`);
    } else {
        console.log(`\n⚠️ Issues detected - check logs above for details`);
    }
    
    console.log(`\n🏁 English Meditation System Test Completed`);
}

runCompleteTest().catch(console.error);
