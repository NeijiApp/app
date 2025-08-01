/**
 * OpenAI TTS fallback for ElevenLabs issues
 * Much more reliable and cost-effective
 */

import { openai } from '~/utils/openai';
import { findCachedAudioSegment, saveAudioSegmentToCache, incrementUsageCount } from './audio-cache';
import { saveAudioToStorage, initializeAudioBucket } from './audio-storage';

type GenerateAudioProps = {
	voice_id?: string; // For compatibility, but we'll map to OpenAI voices
	voice_style?: string;
	voice_gender?: 'male' | 'female';
};

// Map ElevenLabs voices to OpenAI voices
const VOICE_MAPPING = {
	'g6xIsTj2HwM6VR4iXFCw': 'nova',  // Female voice
	'pNInz6obpgDQGcFmaJgB': 'onyx',  // Male voice
	'female': 'nova',
	'male': 'onyx'
};

/**
 * Generate audio using OpenAI TTS instead of ElevenLabs
 */
export const generateParagraphAudioOpenAI = async (
	paragraph: string,
	{
		voice_id,
		voice_style = "calm",
		voice_gender = 'female',
	}: GenerateAudioProps,
) => {
	// 1. Check cache first
	console.log(`🔍 [OpenAI TTS] Checking cache for: "${paragraph.substring(0, 50)}..."`);
	const cachedSegment = await findCachedAudioSegment(paragraph, voice_id || 'openai-nova', voice_style);
	
	if (cachedSegment && cachedSegment.audioUrl && cachedSegment.audioUrl.startsWith('http')) {
		console.log(`✅ [OpenAI TTS] Found cached audio segment (ID: ${cachedSegment.id})`);
		
		try {
			await incrementUsageCount(cachedSegment.id);
			const cachedResponse = await fetch(cachedSegment.audioUrl);
			
			if (cachedResponse.ok && cachedResponse.body) {
				console.log(`🎵 [OpenAI TTS] Serving cached audio from: ${cachedSegment.audioUrl}`);
				return cachedResponse.body;
			}
		} catch (error) {
			console.warn(`⚠️ [OpenAI TTS] Cached audio not accessible: ${error}`);
		}
	}

	// 2. Generate with OpenAI TTS
	console.log(`🎙️ [OpenAI TTS] Generating new audio for: "${paragraph.substring(0, 50)}..."`);
	
	// Select appropriate voice
	const openaiVoice = VOICE_MAPPING[voice_id as keyof typeof VOICE_MAPPING] || 
					   VOICE_MAPPING[voice_gender] || 
					   'nova';

	try {
		const response = await openai.audio.speech.create({
			model: "tts-1", // High quality model
			voice: openaiVoice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
			input: paragraph,
			response_format: 'mp3',
			speed: 0.9 // Slightly slower for meditation
		});

		console.log(`✅ [OpenAI TTS] Generated audio with voice: ${openaiVoice}`);

		// Convert response to stream
		const audioArrayBuffer = await response.arrayBuffer();
		const audioStream = new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(audioArrayBuffer));
				controller.close();
			}
		});

		// 3. Save to storage and cache
		try {
			await initializeAudioBucket();
			
			// Create a copy for storage (since streams can only be read once)
			const storageBuffer = new Uint8Array(audioArrayBuffer);
			const storageStream = new ReadableStream({
				start(controller) {
					controller.enqueue(storageBuffer);
					controller.close();
				}
			});
			
			const textHash = paragraph.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '');
			const audioUrl = await saveAudioToStorage(storageStream, voice_id || 'openai-nova', textHash);
			
			// Save to cache
			await saveAudioSegmentToCache(
				paragraph, 
				voice_id || 'openai-nova', 
				voice_gender, 
				voice_style, 
				audioUrl,
				undefined, // duration
				audioArrayBuffer.byteLength // file size
			);
			
			console.log(`✅ [OpenAI TTS] Saved audio segment to ${audioUrl}`);
			
			// Return fresh stream for use
			return audioStream;
			
		} catch (storageError) {
			console.warn(`⚠️ [OpenAI TTS] Storage failed: ${storageError}`);
			
			// Fallback: save in cache with temp URL
			const tempUrl = `openai://generated/${openaiVoice}/${Date.now()}`;
			await saveAudioSegmentToCache(paragraph, voice_id || 'openai-nova', voice_gender, voice_style, tempUrl);
			
			return audioStream;
		}

	} catch (error) {
		console.error('❌ [OpenAI TTS] Generation failed:', error);
		throw new Error(`OpenAI TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
};

/**
 * Test OpenAI TTS directly
 */
export async function testOpenAITTS(text: string, voice: 'male' | 'female' = 'female') {
	console.log(`🧪 [OpenAI TTS] Testing with: "${text.substring(0, 50)}..."`);
	
	try {
		const stream = await generateParagraphAudioOpenAI(text, {
			voice_gender: voice,
			voice_style: 'calm'
		});
		
		// Calculate approximate size
		const response = new Response(stream);
		const buffer = await response.arrayBuffer();
		const sizeKB = buffer.byteLength / 1024;
		const estimatedDuration = buffer.byteLength / (128 * 1024 / 8); // Rough MP3 estimate
		
		console.log(`✅ [OpenAI TTS] Test successful:`);
		console.log(`   Size: ${sizeKB.toFixed(2)} KB`);
		console.log(`   Estimated duration: ${estimatedDuration.toFixed(2)} seconds`);
		
		return { success: true, size: buffer.byteLength, duration: estimatedDuration };
		
	} catch (error) {
		console.error(`❌ [OpenAI TTS] Test failed:`, error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
