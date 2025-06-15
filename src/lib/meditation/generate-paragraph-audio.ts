const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
	throw new Error("The environement variable ELEVENLABS_API_KEY is not set");
}

type GenerateParagrapheAudioProps = {
	voice_id: string;
	next_text?: string | undefined;
};

const generateParagraphAudio = async (
	paragraph: string,
	{
		voice_id,
		next_text = ". With a calm and relaxing voice",
	}: GenerateParagrapheAudioProps,
) => {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream?output_format=mp3_44100_128`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"xi-api-key": ELEVENLABS_API_KEY,
			"Content-Type": "application/json",
			Accept: "audio/mpeg",
		},
		body: JSON.stringify({
			// Required field: the text to be synthesized
			text: paragraph,
			next_text,
			model_id: "eleven_multilingual_v2", // Using the latest stable model for meditation
			voice_settings: {
				stability: 0.75, // Higher stability for calm, consistent delivery
				similarity_boost: 0.8, // Clear, consistent voice
				style: 0.2, // Slight style variation for natural flow
				use_speaker_boost: true
			}
		}),
	});

	if (!response.ok || !response.body) {
		throw new Error(
			`Failed to generate audio: ${response.status} ${response.statusText}`,
		);
	}

	// 'response.body' will be a readable stream that yields audio data (MPEG)
	return response.body;
};

export { generateParagraphAudio };
