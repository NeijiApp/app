import { type NextRequest, NextResponse } from "next/server";
// Use Node.js runtime for FFmpeg dynamic import support
export const runtime = "nodejs";
import { z } from "zod";
import { env } from "~/env";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";
import { meditationPromptParser } from "~/lib/meditation/meditation-prompt-parser";
import { meditationArchitect } from "~/lib/meditation/meditation-architect";

const meditationSchema = z.object({
  duration: z.number().min(0.5).max(30).optional().default(5),
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
    .enum(["calm", "focus", "sleep", "energy", "healing", "stress", "anxiety"])
    .optional()
    .default("calm"),
  gender: z.enum(["male", "female"]).optional().default("female"),
});

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
      `🧘 Starting AI-driven meditation generation: ${duration}min, goal: ${goal}, voice: ${voiceId}, background: ${background}, guidance: ${guidance}`,
    );

    // Parse user prompt with AI-driven intelligence
    console.log('🧠 Parsing user prompt with AI intelligence...');
    const specification = await meditationPromptParser.parsePrompt(prompt, {
      inferredDuration: duration,
      guidanceLevel: guidance,
      goal: goal,
      background: background,
      voicePreferences: {
        gender: gender,
        style: 'calm',
      },
    });

    console.log('✅ Meditation specification created:');
    console.log(`   Goal: ${specification.goal}`);
    console.log(`   Duration: ${specification.inferredDuration}min`);
    console.log(`   Guidance: ${specification.guidanceLevel}`);
    console.log(`   Intent: ${specification.intent}`);

    // Generate meditation plan with AI architect
    console.log('🏗️ Creating meditation plan with AI architect...');
    const meditationPlan = await meditationArchitect.createMeditationPlan(specification);

    console.log('✅ Meditation plan created:');
    console.log(`   Total duration: ${Math.round(meditationPlan.totalDuration)}s`);
    console.log(`   Segments: ${meditationPlan.segments.length}`);
    console.log(`   Silence ratio: ${Math.round(meditationPlan.timingValidation.silenceRatio * 100)}%`);
    console.log(`   Word count: ${meditationPlan.metadata.contentWordCount}`);

    // Convert meditation plan to assembly format
    const assemblySegments: Array<
      { type: "text"; content: string } | { type: "pause"; duration: number }
    > = [];

    meditationPlan.segments.forEach((segment, index) => {
      // Add text segment
      assemblySegments.push({
        type: "text",
        content: segment.content,
      });

      // Add silence segment if needed
      if (segment.silenceAfter > 0.5) {
        assemblySegments.push({
          type: "pause",
          duration: Math.round(segment.silenceAfter),
        });
      }
    });

    console.log(`🔧 Prepared ${assemblySegments.length} segments for assembly`);

    // Generate final meditation audio
    console.log(`🎤 Generating audio with voice: ${voiceId} (${gender})`);
    const meditationStream = await generateConcatenatedMeditation(
      assemblySegments,
      voiceId,
      gender,
    );

    console.log("✅ AI-driven meditation generation completed successfully");

    // Return audio stream with metadata
    return new Response(meditationStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="meditation.mp3"',
        "Cache-Control": "no-cache",
        "X-Meditation-Duration": meditationPlan.totalDuration.toString(),
        "X-Meditation-Segments": meditationPlan.segments.length.toString(),
        "X-Meditation-Words": meditationPlan.metadata.contentWordCount.toString(),
        "X-Meditation-Complexity": meditationPlan.metadata.estimatedComplexity.toString(),
      },
    });
  } catch (error) {
    console.error("❌ AI meditation generation failed:", error);
    return NextResponse.json(
      {
        error: "Meditation generation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
