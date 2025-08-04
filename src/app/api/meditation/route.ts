import { type NextRequest, NextResponse } from "next/server";
// Use Node.js runtime for FFmpeg dynamic import support
export const runtime = "nodejs";
import { z } from "zod";
import { env } from "~/env";
import { MeditationAIAgent } from "~/lib/meditation/ai-agent";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";
import {
	canGenerateWithinCredits,
	estimateCreditUsage,
	generateCreditEfficientSegments,
} from "~/lib/meditation/optimized-segments";

const meditationSchema = z.object({
	duration: z.number().min(0.5).max(30).optional().default(5), // Permet 0.5 minute (30 secondes) pour les tests
	prompt: z.string().min(1).max(500),
	voiceId: z.string().optional().default("g6xIsTj2HwM6VR4iXFCw"),
	background: z
		.enum(["silence", "waves", "rain", "focus", "relax"])
		.optional()
		.default("silence"),
	guidance: z
		.enum(["beginner", "confirmed", "expert"])
		.optional()
		.default("confirmed"),
	goal: z
		.enum(["morning", "focus", "calm", "sleep"])
		.optional()
		.default("calm"),
	gender: z.enum(["male", "female"]).optional().default("female"),
});

/**
 * Génère des segments de méditation optimisés pour la durée demandée
 */
function generateOptimizedSegments(duration: number, goal: string) {
	const totalDurationSeconds = duration * 60;

	// Templates optimisés selon la durée
	let template;
	if (duration <= 2) {
		// Short meditation: focus on essentials
		template = [
			{
				type: "intro",
				content: `Welcome to this ${duration}-minute meditation. Get comfortable and close your eyes.`,
				pauseAfter: 2,
			},
			{
				type: "breathing",
				content: `Focus your attention on your natural breathing. Breathe deeply through your nose, then exhale slowly through your mouth. Let your breath anchor you in the present moment.`,
				pauseAfter: 8,
			},
			{
				type: "body_scan",
				content: `Now, gradually relax each part of your body. Start from the top of your head, then your shoulders, arms, torso, and legs. Release all tensions.`,
				pauseAfter: 6,
			},
			{
				type: "visualization",
				content: `Imagine yourself in a peaceful and safe place. Perhaps a beach, a forest, or simply your favorite spot. Feel the peace and serenity of this place.`,
				pauseAfter: 8,
			},
			{
				type: "conclusion",
				content: `Gently return to the present moment. Wiggle your fingers and toes softly. When you're ready, open your eyes. You feel calm and relaxed.`,
				pauseAfter: 2,
			},
		];
	} else if (duration <= 5) {
		// Medium meditation: balance text/pauses
		template = [
			{
				type: "intro",
				content: `Welcome to this ${duration}-minute meditation. Settle into a comfortable position that works for you. Close your eyes and allow yourself this moment of peace.`,
				pauseAfter: 4,
			},
			{
				type: "breathing",
				content: `Focus your attention on your natural breathing, without trying to change it. Simply observe the air flowing in and out. With each exhale, release a little more of the day's tensions.`,
				pauseAfter: 12,
			},
			{
				type: "body_scan",
				content: `Now, scan through your body with kindness. Start from the top of your head, relax your forehead, your eyes, your jaw. Then your shoulders, arms, chest, belly, hips, legs, and feet.`,
				pauseAfter: 15,
			},
			{
				type: "visualization",
				content: `Imagine yourself in your personal place of peace. A place where you feel perfectly safe and relaxed. Explore this place with all your senses. Feel the tranquility it brings you.`,
				pauseAfter: 18,
			},
			{
				type: "conclusion",
				content: `It's time to gently return. Become aware of your body, your breathing. Gently move your hands and feet. When you feel ready, slowly open your eyes. Take this feeling of calm with you.`,
				pauseAfter: 3,
			},
		];
	} else {
		// Long meditation: more contemplative pauses
		template = [
			{
				type: "intro",
				content: `Welcome to this ${duration}-minute meditation. Take time to settle in comfortably. Close your eyes and let yourself be guided on this inner journey toward peace and serenity.`,
				pauseAfter: 6,
			},
			{
				type: "breathing",
				content: `Let's begin by connecting to our breath. Observe the natural rhythm of your breathing. Feel the cool air entering through your nostrils and the warm air flowing out. Let your breath become your anchor in the present moment.`,
				pauseAfter: 20,
			},
			{
				type: "body_scan",
				content: `Now, let's explore your body with attention and kindness. Start from the crown of your head. Relax each muscle in your face, release your shoulders, free your arms. Feel your chest opening, your belly softening. Release your hips, thighs, calves, down to the tips of your toes.`,
				pauseAfter: 25,
			},
			{
				type: "visualization",
				content: `Now visualize your inner sanctuary. A unique place that belongs only to you, where peace and harmony reign. Explore this magical place, feel its beauty, its tranquility. Let yourself be filled with the soothing energy of this sacred space.`,
				pauseAfter: 30,
			},
			{
				type: "conclusion",
				content: `Our journey is coming to an end. Gradually return to your physical body, to your breathing. Take with you the peace and serenity you have just cultivated. Gently move your limbs, and when you feel ready, open your eyes with a smile.`,
				pauseAfter: 4,
			},
		];
	}

	// Calculer les durées réelles pour respecter la durée totale
	const totalTextTime = template.reduce((sum, seg) => {
		const words = seg.content.split(/\s+/).length;
		const textDuration = (words / 120) * 60; // 120 mots/minute pour méditation
		return sum + textDuration;
	}, 0);

	const totalPauseTime = template.reduce((sum, seg) => sum + seg.pauseAfter, 0);
	const totalPlannedTime = totalTextTime + totalPauseTime;

	// Ajuster les pauses si nécessaire pour respecter la durée totale
	const adjustmentRatio = totalDurationSeconds / totalPlannedTime;

	console.log(
		`📊 Durée planifiée: ${Math.round(totalPlannedTime)}s, Durée cible: ${totalDurationSeconds}s, Ratio: ${adjustmentRatio.toFixed(2)}`,
	);

	return template.map((seg) => ({
		...seg,
		pauseAfter: Math.max(1, Math.round(seg.pauseAfter * adjustmentRatio)),
	}));
}

async function checkAssemblyServiceHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${env.ASSEMBLY_SERVICE_URL}/api/health`, {
			method: "GET",
			signal: AbortSignal.timeout(5000),
		});
		return response.ok;
	} catch (error) {
		console.error("Assembly service health check failed:", error);
		return false;
	}
}

export async function POST(request: NextRequest) {
	try {
		// Check assembly service health first
		const isAssemblyHealthy = await checkAssemblyServiceHealth();
		if (!isAssemblyHealthy) {
			return NextResponse.json(
				{
					error: "Assembly service unavailable",
					details: `Please ensure the assembly service is running at ${env.ASSEMBLY_SERVICE_URL}. Run 'pnpm run assembly:start' to start it.`,
				},
				{ status: 503 },
			);
		}

		const body = await request.json();
		const { duration, prompt, voiceId, background, guidance, goal, gender } =
			meditationSchema.parse(body);

		console.log(
			`🧘 Starting meditation generation with AI Agent: ${duration}min, goal: ${goal}, voice: ${voiceId}, background: ${background}, guidance: ${guidance}`,
		);

		// Initialiser l'Agent IA
		const aiAgent = new MeditationAIAgent();

		// Créer la requête pour l'agent IA
		const meditationRequest = {
			goal: goal,
			duration: duration,
			voiceGender: gender,
			voiceStyle: "calm", // Dérivé du guidance
			language: "fr-FR",
			prompt: prompt,
			guidance: guidance,
			background: background,
		};

		console.log(`🧠 Generating meditation with AI Agent...`);

		// Générer la méditation avec l'Agent IA (utilise embeddings, cache, optimisation)
		const aiResult =
			await aiAgent.generateOptimizedMeditation(meditationRequest);

		if (!aiResult.success) {
			throw new Error(
				`AI Agent failed: ${aiResult.errors?.join(", ") || "Unknown error"}`,
			);
		}

		console.log(`✅ AI Agent generated meditation successfully`);
		console.log(`💰 Cost: $${aiResult.actualCost.toFixed(4)}`);
		console.log(
			`♻️ Reused: ${aiResult.segmentsReused}/${aiResult.segmentsReused + aiResult.segmentsCreated} segments (${Math.round((aiResult.segmentsReused / (aiResult.segmentsReused + aiResult.segmentsCreated)) * 100)}%)`,
		);
		console.log(
			`⚡ Optimization achieved: ${aiResult.optimizationAchieved.toFixed(1)}%`,
		);

		// Générer des segments optimisés pour les crédits ElevenLabs
		const optimizedSegments = generateCreditEfficientSegments(duration, goal);

		// Vérifier si on peut générer avec les crédits disponibles
		const estimatedCredits = estimateCreditUsage(optimizedSegments);
		console.log(`💰 Estimated ElevenLabs credits needed: ${estimatedCredits}`);

		// Note: With 38 credits remaining, we can handle ~38 characters of text
		// Each segment is now ~100 chars max to stay within limits
		if (estimatedCredits > 500) {
			console.warn(
				`⚠️ High credit usage estimated: ${estimatedCredits}. Consider shorter segments.`,
			);
		}

		// Convertir en format attendu par generateConcatenatedMeditation
		const assemblySegments: Array<
			{ type: "text"; content: string } | { type: "pause"; duration: number }
		> = [];

		optimizedSegments.forEach((seg, index) => {
			// Ajouter le segment de texte
			assemblySegments.push({
				type: "text",
				content: seg.content,
			});

			// Ajouter la pause après (sauf pour le dernier segment s'il a une pause très courte)
			if (index < optimizedSegments.length - 1 || seg.pauseAfter > 2) {
				assemblySegments.push({
					type: "pause",
					duration: seg.pauseAfter,
				});
			}
		});

		console.log(`🔧 Prepared ${assemblySegments.length} segments for assembly`);

		// Générer la méditation assemblée avec le service assembly
		console.log(`🎤 Using voice ID for generation: ${voiceId} (${gender})`);
		const meditationStream = await generateConcatenatedMeditation(
			assemblySegments,
			voiceId,
			gender,
		);

		console.log("✅ Complete meditation generation with AI Agent successful");

		// Retourner le stream audio
		return new Response(meditationStream, {
			headers: {
				"Content-Type": "audio/mpeg",
				"Content-Disposition": 'attachment; filename="meditation.mp3"',
				"Cache-Control": "no-cache",
				"X-AI-Cost": aiResult.actualCost.toString(),
				"X-AI-Optimization": aiResult.optimizationAchieved.toString(),
				"X-AI-Reused": aiResult.segmentsReused.toString(),
				"X-AI-Created": aiResult.segmentsCreated.toString(),
			},
		});
	} catch (error) {
		console.error("❌ Meditation generation error:", error);
		return NextResponse.json(
			{
				error: "Failed to generate meditation",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
