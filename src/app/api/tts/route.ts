/**
 * TTS Provider Control API
 * Allows manual switching between OpenAI and ElevenLabs
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { type TTSProvider, ttsRouter } from "~/lib/meditation/tts-router";

const switchProviderSchema = z.object({
	provider: z.enum(["openai", "elevenlabs"]),
});

const testProviderSchema = z.object({
	text: z
		.string()
		.optional()
		.default("Hello, this is a test of the TTS system."),
	voice_gender: z.enum(["male", "female"]).optional().default("female"),
});

/**
 * GET /api/tts - Get current TTS provider status
 */
export async function GET() {
	try {
		const info = ttsRouter.getProviderInfo();

		return NextResponse.json({
			success: true,
			data: {
				current: info.current,
				fallback: info.fallback,
				available: info.available,
				status: "ready",
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Failed to get TTS status",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

/**
 * POST /api/tts - Control TTS provider
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const action = body.action;

		switch (action) {
			case "switch":
				return await handleSwitchProvider(body);
			case "test":
				return await handleTestProvider(body);
			case "status":
				return await handleGetStatus();
			default:
				return NextResponse.json(
					{
						success: false,
						error: "Invalid action. Use 'switch', 'test', or 'status'",
					},
					{ status: 400 },
				);
		}
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Invalid request",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 400 },
		);
	}
}

async function handleSwitchProvider(body: any) {
	try {
		const { provider } = switchProviderSchema.parse(body);

		console.log(
			`🔄 [TTS API] Switching to provider: ${provider.toUpperCase()}`,
		);

		ttsRouter.setProvider(provider);

		// Test the new provider
		const testResult = await ttsRouter.testCurrentProvider();

		return NextResponse.json({
			success: true,
			data: {
				provider: provider,
				switched: true,
				tested: testResult,
				message: testResult
					? `Successfully switched to ${provider.toUpperCase()}`
					: `Switched to ${provider.toUpperCase()} but test failed - check configuration`,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Failed to switch provider",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function handleTestProvider(body: any) {
	try {
		const { text, voice_gender } = testProviderSchema.parse(body);

		console.log(
			`🧪 [TTS API] Testing current provider with: "${text.substring(0, 30)}..."`,
		);

		const startTime = Date.now();
		const testResult = await ttsRouter.testCurrentProvider(text);
		const duration = Date.now() - startTime;

		// Get detailed info
		const info = ttsRouter.getProviderInfo();

		return NextResponse.json({
			success: true,
			data: {
				provider: info.current,
				test_passed: testResult,
				test_duration_ms: duration,
				test_text: text,
				message: testResult
					? `${info.current.toUpperCase()} test passed in ${duration}ms`
					: `${info.current.toUpperCase()} test failed - audio generation issue`,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Failed to test provider",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

async function handleGetStatus() {
	const info = ttsRouter.getProviderInfo();

	return NextResponse.json({
		success: true,
		data: {
			current: info.current,
			fallback: info.fallback,
			available: info.available,
			status: "ready",
			environment: process.env.TTS_PROVIDER || "openai",
		},
	});
}
