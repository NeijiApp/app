/**
 * Check ElevenLabs account status and API key details
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
    console.error('❌ ELEVENLABS_API_KEY not found in environment');
    process.exit(1);
}

console.log(`🔑 Using API Key: ${ELEVENLABS_API_KEY.substring(0, 10)}...${ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 4)}`);

async function checkElevenLabsAccount() {
    try {
        // Check user info and subscription
        console.log('\n📊 Checking ElevenLabs account status...');
        
        const userResponse = await fetch('https://api.elevenlabs.io/v1/user', {
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
            }
        });
        
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error(`❌ User API Error: ${userResponse.status} ${userResponse.statusText}`);
            console.error(`❌ Error details: ${errorText}`);
            return;
        }
        
        const userData = await userResponse.json();
        console.log('✅ Account Status:', JSON.stringify(userData, null, 2));
        
        // Check subscription details
        console.log('\n💳 Checking subscription...');
        
        const subResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
            }
        });
        
        if (!subResponse.ok) {
            const errorText = await subResponse.text();
            console.error(`❌ Subscription API Error: ${subResponse.status} ${subResponse.statusText}`);
            console.error(`❌ Error details: ${errorText}`);
            return;
        }
        
        const subData = await subResponse.json();
        console.log('✅ Subscription:', JSON.stringify(subData, null, 2));
        
        // Test with original long text again to see current behavior
        console.log('\n🎙️ Re-testing with original long text...');
        await testOriginalLongText();
        
    } catch (error) {
        console.error('❌ Account check failed:', error);
    }
}

async function testOriginalLongText() {
    const originalLongText = `Bienvenue dans cette méditation de 5 minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix. Portez votre attention sur votre respiration naturelle, sans chercher à la modifier. Observez simplement l'air qui entre et qui sort. À chaque expiration, relâchez un peu plus les tensions de votre journée.`;
    
    console.log(`📏 Testing with ${originalLongText.length} characters...`);
    
    try {
        const voice_id = 'g6xIsTj2HwM6VR4iXFCw';
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
            },
            body: JSON.stringify({
                text: originalLongText,
                next_text: ". With a calm and relaxing voice",
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                    stability: 0.75,
                    similarity_boost: 0.8,
                    style: 0.2,
                    use_speaker_boost: true
                }
            }),
        });
        
        console.log(`📋 Response status: ${response.status} ${response.statusText}`);
        console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Long text API Error: ${response.status} ${response.statusText}`);
            console.error(`❌ Error body: ${errorText}`);
            return;
        }
        
        if (response.body) {
            const audioBuffer = await response.arrayBuffer();
            const audioSize = audioBuffer.byteLength;
            const estimatedDuration = audioSize / (128 * 1024 / 8);
            
            console.log(`🎵 Long text result: ${audioSize} bytes (${(audioSize / 1024).toFixed(2)} KB)`);
            console.log(`⏱️ Estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
            
            if (estimatedDuration < 10) {
                console.log(`⚠️ Still truncated despite credits!`);
                console.log(`🔍 This suggests a different issue: API limits, model issues, or parameter problems`);
            } else {
                console.log(`✅ Long text works now! Previous issue may have been temporary.`);
            }
        }
        
    } catch (error) {
        console.error('❌ Long text test failed:', error);
    }
}

// Run the account check
checkElevenLabsAccount().then(() => {
    console.log('\n🏁 Account status check completed');
}).catch(console.error);
