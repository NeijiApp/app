import { findCachedAudioSegment, saveAudioSegmentToCache, incrementUsageCount, generateTextHash } from './audio-cache';
import { saveAudioToStorage, initializeAudioBucket, isStorageUrl } from './audio-storage';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error("The environement variable ELEVENLABS_API_KEY is not set");
}

type GenerateParagrapheAudioProps = {
	voice_id: string;
	next_text?: string | undefined;
	voice_style?: string;
	voice_gender?: 'male' | 'female';
};

const generateParagraphAudio = async (
	paragraph: string,
	{
		voice_id,
		next_text = ". With a calm and relaxing voice",
		voice_style = "calm",
		voice_gender,
	}: GenerateParagrapheAudioProps,
) => {
	// Déduire le genre de la voix à partir de l'ID si pas fourni
	const actualVoiceGender = voice_gender || (voice_id === 'g6xIsTj2HwM6VR4iXFCw' ? 'female' : 'male');
	// 1. Vérifier d'abord le cache
	console.log(`🔍 Checking cache for: "${paragraph.substring(0, 50)}..."`);
	const cachedSegment = await findCachedAudioSegment(paragraph, voice_id, voice_style);
	
	if (cachedSegment) {
		console.log(`✅ Found cached audio segment (ID: ${cachedSegment.id})`);
		
		// Vérifier si l'URL est valide (seulement HTTP pour l'instant)
		if (cachedSegment.audioUrl && 
			cachedSegment.audioUrl.startsWith('http') && 
			!cachedSegment.audioUrl.startsWith('elevenlabs://')) {
			
			// Incrémenter le compteur d'utilisation
			await incrementUsageCount(cachedSegment.id);
			
			// Récupérer l'audio depuis l'URL cachée
			try {
				const cachedResponse = await fetch(cachedSegment.audioUrl);
				if (cachedResponse.ok && cachedResponse.body) {
					console.log(`🎵 Serving cached audio from: ${cachedSegment.audioUrl}`);
					return cachedResponse.body;
				} else {
					console.warn(`⚠️ Cached audio URL not accessible: ${cachedSegment.audioUrl}`);
				}
			} catch (error) {
				console.warn(`⚠️ Error fetching cached audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		} else {
			console.warn(`⚠️ Cached segment has invalid URL, generating new audio: ${cachedSegment.audioUrl}`);
		}
	}

	// 2. Générer l'audio via ElevenLabs si pas en cache
	console.log(`🎙️ Generating new audio with ElevenLabs for: "${paragraph.substring(0, 50)}..."`);
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"xi-api-key": ELEVENLABS_API_KEY,
			"Content-Type": "application/json",
			Accept: "audio/mpeg",
		},
		body: JSON.stringify({
			text: paragraph,
			next_text,
			model_id: "eleven_multilingual_v2",
			voice_settings: {
				stability: 0.75,
				similarity_boost: 0.8,
				style: 0.2,
				use_speaker_boost: true
			}
		}),
	});

	if (!response.ok || !response.body) {
		throw new Error(
			`Failed to generate audio: ${response.status} ${response.statusText}`,
		);
	}

	// 3. Sauvegarder l'audio dans Supabase Storage et le cache
	try {
		// Initialiser le bucket si nécessaire
		await initializeAudioBucket();
		
		// Sauvegarder l'audio dans le Storage
		const textHash = paragraph.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '');
		const audioUrl = await saveAudioToStorage(response.body!, voice_id, textHash);
		
		// Sauvegarder dans le cache DB (gère automatiquement les doublons)
		await saveAudioSegmentToCache(paragraph, voice_id, actualVoiceGender, voice_style, audioUrl);
		
		console.log(`✅ Generated and saved new audio segment with voice: ${actualVoiceGender} (${voice_id}) to ${audioUrl}`);
		
		// Récupérer l'audio depuis l'URL sauvegardée
		const savedResponse = await fetch(audioUrl);
		return savedResponse.body!;
	} catch (storageError) {
		console.warn(`⚠️ Storage failed, returning stream directly: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
		
		// Fallback: sauvegarder seulement dans le cache avec URL temporaire
		const tempUrl = `elevenlabs://generated/${voice_id}/${Date.now()}`;
		await saveAudioSegmentToCache(paragraph, voice_id, actualVoiceGender, voice_style, tempUrl);
		
		console.log(`✅ Generated new audio segment with voice: ${actualVoiceGender} (${voice_id}) - Storage fallback`);
		return response.body!;
	}
};

export { generateParagraphAudio };
