import { z } from "zod";
import {
	type SimilaritySearchResult,
	saveAudioSegmentToCache,
} from "./audio-cache";
import { findSimilarSegmentsByEmbedding } from "./embeddings-service";

// Schema for meditation segment
const MeditationSegmentSchema = z.object({
	type: z.enum([
		"introduction",
		"breathing",
		"body_scan",
		"visualization",
		"mindfulness",
		"transition",
		"conclusion",
	]),
	text: z.string(),
	duration_seconds: z.number(),
	pause_after_seconds: z.number(),
	emotional_tone: z.enum([
		"calm",
		"peaceful",
		"energizing",
		"grounding",
		"healing",
		"focused",
	]),
	guidance_level: z.enum(["minimal", "moderate", "detailed"]),
});

const MeditationScriptSchema = z.object({
	segments: z.array(MeditationSegmentSchema),
	total_duration_seconds: z.number(),
	overall_theme: z.string(),
	key_benefits: z.array(z.string()),
});

type MeditationSegment = z.infer<typeof MeditationSegmentSchema>;
type MeditationScript = z.infer<typeof MeditationScriptSchema>;

interface GenerationRequest {
	duration: number; // in minutes
	goal: string; // e.g., 'stress', 'sleep', 'focus', 'pain', 'emotion'
	userPrompt: string;
	voiceGender: "male" | "female";
	guidanceLevel: "beginner" | "confirmed" | "expert";
	language: string;
}

interface SegmentMatch {
	segment: MeditationSegment;
	similarity: number;
	cachedAudioUrl?: string;
	cachedSegmentId?: number;
}

// Content generation templates organized by goal and component
const CONTENT_LIBRARY = {
	introduction: {
		sleep: [
			"Welcome to this peaceful sleep meditation. Find a comfortable position in your bed and allow yourself to fully relax.",
			"It's time to let go of the day and prepare for restful sleep. Settle into your bed and close your eyes gently.",
			"This meditation will guide you into deep, peaceful sleep. Make yourself comfortable and give yourself permission to rest.",
		],
		focus: [
			"Welcome to this concentration meditation. Sit comfortably with your spine straight and alert.",
			"This meditation will help sharpen your focus and clear mental distractions. Find a stable, comfortable position.",
			"Prepare to cultivate clear, focused attention. Sit with dignity and alertness, ready to train your mind.",
		],
		calm: [
			"Welcome to this calming meditation. Find a comfortable position and allow yourself this moment of peace.",
			"This is your time to pause and reconnect with inner calm. Settle in comfortably and breathe naturally.",
			"Give yourself the gift of this peaceful moment. Find a comfortable position and gently close your eyes.",
		],
		morning: [
			"Good morning. This meditation will help you start your day with clarity and intention.",
			"Welcome to your morning practice. Sit comfortably and prepare to greet the day with presence.",
			"Let's begin this day mindfully. Find a comfortable seated position and center yourself.",
		],
	},
	breathing: {
		sleep: [
			"Focus on your natural breath becoming slower and deeper. Each exhale releases the day's tension.",
			"Let your breathing naturally slow down. Breathe in calm, breathe out any restlessness or worry.",
			"Notice your breath becoming deeper and more relaxed. Each breath guides you toward peaceful sleep.",
		],
		focus: [
			"Bring your full attention to your breath. Use it as an anchor for your concentration.",
			"Focus precisely on the sensation of breathing. When your mind wanders, gently return to your breath.",
			"Your breath is your tool for developing focus. Observe each inhale and exhale with clear attention.",
		],
		calm: [
			"Simply observe your natural breathing. Let each breath bring you deeper into the present moment.",
			"Breathe naturally and let your breath calm your entire being. Each exhale releases tension.",
			"Follow your breath with gentle attention. Let it be your guide to inner peace.",
		],
		morning: [
			"Take energizing breaths to awaken your body and mind. Breathe in vitality and alertness.",
			"Use your breath to greet the day. Inhale fresh energy, exhale any sleepiness.",
			"Breathe consciously to prepare yourself for the day ahead. Each breath brings clarity and purpose.",
		],
	},
	body_scan: {
		sleep: [
			"Progressively relax your entire body. Start with your feet and slowly move upward, releasing all tension.",
			"Let your body melt into complete relaxation. Feel each part of your body becoming heavy and peaceful.",
			"Scan through your body and consciously relax each area. Allow your muscles to release and soften.",
		],
		focus: [
			"Ground yourself by feeling your body's connection to your seat and the floor. This stability supports mental clarity.",
			"Notice your body's posture and adjust to maintain alertness. Feel grounded and present in your physical form.",
			"Sense your body as a foundation for focused awareness. Feel stable, alert, and physically present.",
		],
		calm: [
			"Gently scan through your body with kindness. Notice areas of tension and breathe relaxation into them.",
			"Move your attention through your body like a warm, healing light. Allow each part to soften and relax.",
			"Explore your body with gentle curiosity. Notice sensations without judgment, simply observing with care.",
		],
		morning: [
			"Awaken your body gently by bringing awareness to each part. Feel your body preparing for the day.",
			"Energize your body through mindful attention. Notice how each part feels as you prepare for activity.",
			"Connect with your physical vitality by scanning through your body. Feel strength and readiness for the day.",
		],
	},
	visualization: {
		sleep: [
			"Imagine yourself floating on a soft cloud, drifting peacefully downward into deep sleep.",
			"Visualize a peaceful place where you feel completely safe and relaxed. Let this place embrace you.",
			"Picture yourself in a serene bedroom filled with soft, calming light. Feel the comfort surrounding you.",
		],
		focus: [
			"Visualize your mind as a clear, still lake. Thoughts may ripple the surface, but underneath remains calm and clear.",
			"Imagine your attention as a steady flame. It burns bright and focused, unaffected by distractions.",
			"Picture your mind like a clear blue sky. Thoughts pass like clouds, but your awareness remains spacious and clear.",
		],
		calm: [
			"Imagine yourself in a peaceful natural setting that brings you joy. Feel the tranquility of this place.",
			"Visualize healing light surrounding and filling your entire being. Let this light bring you deep peace.",
			"Picture yourself surrounded by a bubble of calm energy. Nothing can disturb your inner peace.",
		],
		morning: [
			"Visualize the day ahead unfolding with ease and purpose. See yourself moving through it with clarity.",
			"Imagine yourself radiating energy and positivity. Feel prepared to meet whatever the day brings.",
			"Picture yourself stepping into the day with confidence and intention. Feel ready and empowered.",
		],
	},
	conclusion: {
		sleep: [
			"Rest in this peaceful state. There's nothing more you need to do. Simply allow sleep to come naturally.",
			"You are ready for deep, restorative sleep. Let yourself drift off knowing you are safe and peaceful.",
			"Remain in this calm, relaxed state. Sleep will come when it's ready. You are prepared for rest.",
		],
		focus: [
			"Carry this clarity and focus with you. When you're ready, open your eyes and bring this attention to your tasks.",
			"You have cultivated clear, focused awareness. Take this concentration into your daily activities.",
			"Your mind is now calm and alert. When you open your eyes, maintain this quality of focused attention.",
		],
		calm: [
			"Take this sense of peace with you into your day. When you're ready, gently open your eyes.",
			"Rest in this calm state for as long as you wish. You can return to this peace whenever you need it.",
			"Carry this tranquility with you. When ready, slowly return to your surroundings with renewed calm.",
		],
		morning: [
			"You are now ready to begin your day with intention and presence. Open your eyes when you feel prepared.",
			"Carry this morning clarity into your day. You are centered, focused, and ready for whatever comes.",
			"Your day begins with this foundation of mindfulness. Open your eyes and step forward with purpose.",
		],
	},
};

export class SimpleDynamicAgent {
	private similarityThreshold = 0.85;

	async generateMeditation(request: GenerationRequest): Promise<{
		segments: Array<
			{ type: "text"; content: string } | { type: "pause"; duration: number }
		>;
		script: MeditationScript;
		cost: number;
		reusedCount: number;
		generatedCount: number;
	}> {
		console.log("🤖 Simple Dynamic Agent starting...");

		// Generate script using algorithmic intelligence
		const script = this.generateIntelligentScript(request);
		console.log(`📝 Generated script with ${script.segments.length} segments`);

		// Check for similar existing segments
		const matchedSegments = await this.findSimilarSegments(script.segments);

		// Build final segment array
		const outputSegments: Array<
			{ type: "text"; content: string } | { type: "pause"; duration: number }
		> = [];
		let cost = 0.0001; // Minimal cost for algorithmic generation
		let reusedCount = 0;
		let generatedCount = 0;

		for (const match of matchedSegments) {
			outputSegments.push({
				type: "text",
				content: match.segment.text,
			});

			if (
				match.similarity >= this.similarityThreshold &&
				match.cachedAudioUrl
			) {
				reusedCount++;
				console.log(
					`♻️ Reusing segment (${(match.similarity * 100).toFixed(1)}% match): ${match.segment.type}`,
				);
			} else {
				generatedCount++;
				cost += 0.002; // TTS cost
				console.log(`🆕 Generating new segment: ${match.segment.type}`);
			}

			if (match.segment.pause_after_seconds > 0) {
				outputSegments.push({
					type: "pause",
					duration: match.segment.pause_after_seconds,
				});
			}
		}

		console.log(
			`✅ Meditation ready: ${reusedCount} reused, ${generatedCount} new segments`,
		);

		return {
			segments: outputSegments,
			script,
			cost,
			reusedCount,
			generatedCount,
		};
	}

	private generateIntelligentScript(
		request: GenerationRequest,
	): MeditationScript {
		const totalSeconds = request.duration * 60;
		const goal = this.mapGoal(request.goal);

		// Intelligent segment structure based on duration and goal
		const structure = this.calculateSegmentStructure(request.duration, goal);
		const segments: MeditationSegment[] = [];

		for (const segment of structure) {
			const content = this.generateContextualContent(
				segment.type,
				goal,
				request,
			);
			const pauseDuration = this.calculateIntelligentPause(
				segment.type,
				goal,
				request.duration,
			);

			segments.push({
				type: segment.type as
					| "introduction"
					| "breathing"
					| "body_scan"
					| "visualization"
					| "mindfulness"
					| "transition"
					| "conclusion",
				text: content,
				duration_seconds: segment.duration,
				pause_after_seconds: pauseDuration,
				emotional_tone: this.selectEmotionalTone(goal, segment.type),
				guidance_level: this.mapGuidanceLevel(request.guidanceLevel),
			});
		}

		return {
			segments,
			total_duration_seconds: totalSeconds,
			overall_theme: this.generateTheme(goal, request.userPrompt),
			key_benefits: this.generateBenefits(goal),
		};
	}

	private mapGoal(goal: string): string {
		const goalMap: Record<string, string> = {
			calm: "calm",
			sleep: "sleep",
			focus: "focus",
			morning: "morning",
			stress: "calm",
			pain: "calm",
			emotion: "calm",
		};
		return goalMap[goal] || "calm";
	}

	private calculateSegmentStructure(duration: number, goal: string) {
		const totalSeconds = duration * 60;

		if (duration <= 2) {
			// Short meditation
			return [
				{
					type: "introduction" as const,
					duration: Math.round(totalSeconds * 0.15),
				},
				{
					type: "breathing" as const,
					duration: Math.round(totalSeconds * 0.35),
				},
				{
					type: "body_scan" as const,
					duration: Math.round(totalSeconds * 0.25),
				},
				{
					type: "visualization" as const,
					duration: Math.round(totalSeconds * 0.2),
				},
				{
					type: "conclusion" as const,
					duration: Math.round(totalSeconds * 0.05),
				},
			];
		} else if (duration <= 5) {
			// Medium meditation
			return [
				{
					type: "introduction" as const,
					duration: Math.round(totalSeconds * 0.12),
				},
				{
					type: "breathing" as const,
					duration: Math.round(totalSeconds * 0.28),
				},
				{
					type: "body_scan" as const,
					duration: Math.round(totalSeconds * 0.3),
				},
				{
					type: "visualization" as const,
					duration: Math.round(totalSeconds * 0.25),
				},
				{
					type: "conclusion" as const,
					duration: Math.round(totalSeconds * 0.05),
				},
			];
		} else {
			// Long meditation
			return [
				{
					type: "introduction" as const,
					duration: Math.round(totalSeconds * 0.1),
				},
				{
					type: "breathing" as const,
					duration: Math.round(totalSeconds * 0.25),
				},
				{
					type: "body_scan" as const,
					duration: Math.round(totalSeconds * 0.3),
				},
				{
					type: "mindfulness" as const,
					duration: Math.round(totalSeconds * 0.2),
				},
				{
					type: "visualization" as const,
					duration: Math.round(totalSeconds * 0.12),
				},
				{
					type: "conclusion" as const,
					duration: Math.round(totalSeconds * 0.03),
				},
			];
		}
	}

	private generateContextualContent(
		type: string,
		goal: string,
		request: GenerationRequest,
	): string {
		const library = CONTENT_LIBRARY[type as keyof typeof CONTENT_LIBRARY];
		if (!library) return `${type} content for ${goal}`;

		const goalContent =
			library[goal as keyof typeof library] ||
			library["calm" as keyof typeof library];
		if (!goalContent || !Array.isArray(goalContent))
			return `${type} content for ${goal}`;

		// Intelligent selection based on user prompt and request context
		const selectedContent = this.selectBestContent(
			goalContent,
			request.userPrompt,
			type,
		);

		// Personalize based on duration
		return this.personalizeContent(selectedContent, request);
	}

	private selectBestContent(
		options: string[],
		userPrompt: string,
		type: string,
	): string {
		// Simple keyword matching for now
		const prompt = userPrompt.toLowerCase();

		if (prompt.includes("racing thoughts") || prompt.includes("overthinking")) {
			return options[Math.floor(options.length * 0.6)] || options[0] || "calm"; // Prefer middle-end options
		}
		if (
			prompt.includes("work") ||
			prompt.includes("focus") ||
			prompt.includes("concentrate")
		) {
			return options[Math.floor(options.length * 0.3)] || options[0] || "focus"; // Prefer earlier options
		}
		if (prompt.includes("stress") || prompt.includes("overwhelm")) {
			return options[Math.floor(options.length * 0.8)] || options[0] || "calm"; // Prefer later options
		}

		// Default to first option with some randomness
		return (
			options[Math.floor(Math.random() * options.length)] ||
			options[0] ||
			"calm"
		);
	}

	private personalizeContent(
		content: string,
		request: GenerationRequest,
	): string {
		// Add duration awareness
		let personalized = content.replace(
			"this meditation",
			`this ${request.duration} minute meditation`,
		);

		// Add context from user prompt
		if (request.userPrompt.includes("work")) {
			personalized = personalized.replace("the day", "your work day");
		}
		if (
			request.userPrompt.includes("night") ||
			request.userPrompt.includes("sleep")
		) {
			personalized = personalized.replace("this moment", "this restful moment");
		}

		return personalized;
	}

	private calculateIntelligentPause(
		type: string,
		goal: string,
		duration: number,
	): number {
		const basePauses = {
			introduction: 2,
			breathing: goal === "sleep" ? 15 : 8,
			body_scan: goal === "sleep" ? 20 : 12,
			visualization: goal === "sleep" ? 25 : 15,
			mindfulness: 18,
			conclusion: goal === "sleep" ? 0 : 3,
		};

		const base = basePauses[type as keyof typeof basePauses] || 5;
		const durationMultiplier = Math.min(duration / 5, 2); // Max 2x for longer meditations

		return Math.round(base * durationMultiplier);
	}

	private selectEmotionalTone(
		goal: string,
		type: string,
	): "calm" | "peaceful" | "energizing" | "grounding" | "healing" | "focused" {
		const toneMap: Record<string, Record<string, any>> = {
			sleep: {
				introduction: "calm",
				breathing: "peaceful",
				body_scan: "peaceful",
				visualization: "peaceful",
				conclusion: "peaceful",
			},
			focus: {
				introduction: "focused",
				breathing: "focused",
				body_scan: "grounding",
				visualization: "focused",
				conclusion: "focused",
			},
			morning: {
				introduction: "energizing",
				breathing: "energizing",
				body_scan: "grounding",
				visualization: "focused",
				conclusion: "energizing",
			},
			calm: {
				introduction: "calm",
				breathing: "peaceful",
				body_scan: "healing",
				visualization: "peaceful",
				conclusion: "calm",
			},
		};

		return toneMap[goal]?.[type] || "calm";
	}

	private mapGuidanceLevel(level: string): "minimal" | "moderate" | "detailed" {
		const map: Record<string, "minimal" | "moderate" | "detailed"> = {
			beginner: "detailed",
			confirmed: "moderate",
			expert: "minimal",
		};
		return map[level] || "moderate";
	}

	private generateTheme(goal: string, userPrompt: string): string {
		const themes: Record<string, string> = {
			sleep: "Deep relaxation and peaceful sleep preparation",
			focus: "Concentration and mental clarity cultivation",
			morning: "Energizing mindfulness for day preparation",
			calm: "Stress relief and inner tranquility",
		};

		let theme = themes[goal] || "Mindful awareness and well-being";

		// Add context from user prompt
		if (userPrompt.includes("racing thoughts")) {
			theme += " with specific focus on quieting mental chatter";
		}
		if (userPrompt.includes("work")) {
			theme += " for workplace stress and concentration";
		}

		return theme;
	}

	private generateBenefits(goal: string): string[] {
		const benefitMap: Record<string, string[]> = {
			sleep: [
				"Deep relaxation",
				"Improved sleep quality",
				"Reduced nighttime anxiety",
			],
			focus: [
				"Enhanced concentration",
				"Mental clarity",
				"Reduced distractibility",
			],
			morning: [
				"Increased energy",
				"Clear intention setting",
				"Positive day preparation",
			],
			calm: ["Stress reduction", "Emotional balance", "Inner peace"],
		};

		return (
			benefitMap[goal] || [
				"Increased awareness",
				"Reduced stress",
				"Greater well-being",
			]
		);
	}

	private async findSimilarSegments(
		segments: MeditationSegment[],
	): Promise<SegmentMatch[]> {
		const matches: SegmentMatch[] = [];

		for (const segment of segments) {
			try {
				const similar = await findSimilarSegmentsByEmbedding(
					segment.text,
					"dynamic",
					"meditation",
					{
						limit: 5,
						threshold: this.similarityThreshold,
					},
				);

				let bestMatch: SimilaritySearchResult | null = null;
				let bestSimilarity = 0;

				for (const result of similar) {
					if (result.similarity > bestSimilarity) {
						bestMatch = result;
						bestSimilarity = result.similarity;
					}
				}

				matches.push({
					segment,
					similarity: bestSimilarity,
					cachedAudioUrl: bestMatch?.segment.audioUrl || undefined,
					cachedSegmentId: bestMatch?.segment.id,
				});
			} catch (error) {
				console.warn(`Error finding similar segments: ${error}`);
				matches.push({
					segment,
					similarity: 0,
					cachedAudioUrl: undefined,
					cachedSegmentId: undefined,
				});
			}
		}

		return matches;
	}

	async saveGeneratedSegment(
		text: string,
		audioUrl: string,
		duration: number,
		voiceId: string,
		voiceGender: "male" | "female",
		voiceStyle: string,
		language: string,
	): Promise<void> {
		try {
			await saveAudioSegmentToCache(
				text,
				voiceId,
				voiceGender,
				voiceStyle,
				audioUrl,
				duration,
				undefined,
				language,
			);
			console.log("💾 Saved segment to cache for future reuse");
		} catch (error) {
			console.error("Failed to save segment to cache:", error);
		}
	}
}
