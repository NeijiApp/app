/**
 * TTS Router - Switch between ElevenLabs and OpenAI TTS
 * Default: OpenAI TTS (more reliable, cheaper)
 * Fallback: ElevenLabs (higher quality when working)
 */

import { generateParagraphAudio } from "./generate-paragraph-audio"; // ElevenLabs
import { generateParagraphAudioOpenAI } from "./generate-paragraph-audio-openai"; // OpenAI

export type TTSProvider = "openai" | "elevenlabs";

export interface TTSGenerateOptions {
	voice_id?: string;
	next_text?: string;
	voice_style?: string;
	voice_gender?: "male" | "female";
}

// Type-safe conversion functions
function toElevenLabsOptions(options: TTSGenerateOptions): {
	voice_id: string;
	voice_style?: string;
	voice_gender?: "male" | "female";
} {
	return {
		voice_id: options.voice_id || "g6xIsTj2HwM6VR4iXFCw", // Default female voice
		voice_style: options.voice_style,
		voice_gender: options.voice_gender,
	};
}

function toOpenAIOptions(options: TTSGenerateOptions): {
	voice_id?: string;
	voice_style?: string;
	voice_gender?: "male" | "female";
} {
	return {
		voice_id: options.voice_id,
		voice_style: options.voice_style,
		voice_gender: options.voice_gender,
	};
}

/**
 * TTS Router Configuration
 */
export class TTSRouter {
	private currentProvider: TTSProvider;
	private fallbackProvider: TTSProvider;

	constructor(
		provider: TTSProvider = "openai", // Default to OpenAI
		fallback: TTSProvider = "elevenlabs",
	) {
		this.currentProvider = provider;
		this.fallbackProvider = fallback;
	}

	/**
	 * Switch TTS provider manually
	 */
	setProvider(provider: TTSProvider) {
		console.log(
			`🔄 [TTS Router] Switching from ${this.currentProvider} to ${provider}`,
		);
		this.currentProvider = provider;
	}

	/**
	 * Get current provider
	 */
	getCurrentProvider(): TTSProvider {
		return this.currentProvider;
	}

	/**
	 * Generate audio with current provider, fallback on failure
	 */
	async generateAudio(
		text: string,
		options: TTSGenerateOptions = {},
	): Promise<ReadableStream<Uint8Array>> {
		console.log(
			`🎙️ [TTS Router] Generating with ${this.currentProvider.toUpperCase()}: "${text.substring(0, 50)}..."`,
		);

		try {
			// Try current provider
			if (this.currentProvider === "openai") {
				return await generateParagraphAudioOpenAI(
					text,
					toOpenAIOptions(options),
				);
			} else {
				return await generateParagraphAudio(text, toElevenLabsOptions(options));
			}
		} catch (error) {
			console.warn(
				`⚠️ [TTS Router] ${this.currentProvider.toUpperCase()} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
			);

			// Try fallback provider
			console.log(
				`🔄 [TTS Router] Attempting fallback to ${this.fallbackProvider.toUpperCase()}`,
			);

			try {
				if (this.fallbackProvider === "openai") {
					return await generateParagraphAudioOpenAI(
						text,
						toOpenAIOptions(options),
					);
				} else {
					return await generateParagraphAudio(
						text,
						toElevenLabsOptions(options),
					);
				}
			} catch (fallbackError) {
				console.error(`❌ [TTS Router] Both providers failed!`);
				console.error(
					`   Primary (${this.currentProvider}): ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				console.error(
					`   Fallback (${this.fallbackProvider}): ${fallbackError instanceof Error ? fallbackError.message : "Unknown error"}`,
				);

				throw new Error(
					`TTS Router: Both ${this.currentProvider} and ${this.fallbackProvider} failed`,
				);
			}
		}
	}

	/**
	 * Test current provider
	 */
	async testCurrentProvider(
		testText = "Hello, this is a test.",
	): Promise<boolean> {
		try {
			console.log(
				`🧪 [TTS Router] Testing ${this.currentProvider.toUpperCase()}...`,
			);

			const stream = await this.generateAudio(testText, {
				voice_gender: "female",
			});

			// Verify stream has content
			const response = new Response(stream);
			const buffer = await response.arrayBuffer();

			if (buffer.byteLength > 1000) {
				// At least 1KB for valid audio
				console.log(
					`✅ [TTS Router] ${this.currentProvider.toUpperCase()} test passed: ${buffer.byteLength} bytes`,
				);
				return true;
			} else {
				console.warn(
					`⚠️ [TTS Router] ${this.currentProvider.toUpperCase()} test failed: only ${buffer.byteLength} bytes`,
				);
				return false;
			}
		} catch (error) {
			console.error(
				`❌ [TTS Router] ${this.currentProvider.toUpperCase()} test failed:`,
				error,
			);
			return false;
		}
	}

	/**
	 * Get provider info
	 */
	getProviderInfo() {
		return {
			current: this.currentProvider,
			fallback: this.fallbackProvider,
			available: ["openai", "elevenlabs"] as TTSProvider[],
		};
	}
}

/**
 * Global TTS Router instance
 * Configure via environment variable TTS_PROVIDER
 */
export const ttsRouter = new TTSRouter("elevenlabs", "openai");

console.log(
	`🎙️ [TTS Router] Initialized with provider: ${ttsRouter.getCurrentProvider().toUpperCase()}`,
);

/**
 * Convenience function for backward compatibility
 */
export async function generateParagraphAudioWithRouter(
	text: string,
	options: TTSGenerateOptions = {},
): Promise<ReadableStream<Uint8Array>> {
	return await ttsRouter.generateAudio(text, options);
}
