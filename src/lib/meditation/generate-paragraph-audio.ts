import { findCachedAudioSegment, saveAudioSegmentToCache, incrementUsageCount } from './audio-cache';

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
		voice_gender = "male",
	}: GenerateParagrapheAudioProps,
) => {
	// 1. Vérifier d'abord le cache
	console.log(`🔍 Checking cache for: "${paragraph.substring(0, 50)}..."`);
	const cachedSegment = await findCachedAudioSegment(paragraph, voice_id, voice_style);
	
	if (cachedSegment) {
		console.log(`✅ Found cached audio segment (ID: ${cachedSegment.id})`);
		
		// Incrémenter le compteur d'utilisation
		await incrementUsageCount(cachedSegment.id);
		
		// Récupérer l'audio depuis l'URL cachée
		const cachedResponse = await fetch(cachedSegment.audio_url);
		if (cachedResponse.ok && cachedResponse.body) {
			console.log(`🎵 Serving cached audio from: ${cachedSegment.audio_url}`);
			return cachedResponse.body;
		} else {
			console.warn(`⚠️ Cached audio URL not accessible: ${cachedSegment.audio_url}`);
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

	// 3. Sauvegarder dans le cache (optionnel - nécessite de stocker le fichier quelque part)
	// Pour l'instant, on retourne juste le stream
	// TODO: Implémenter la sauvegarde du fichier audio et l'ajout au cache
	
	console.log(`✅ Generated new audio segment`);
	return response.body;
};

export { generateParagraphAudio };
