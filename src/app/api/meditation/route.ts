import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateContent } from "~/lib/meditation/generate-content";
import { parseTextContent } from "~/lib/meditation/parse-text-content";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";
import { defaultSystemPrompt } from "~/lib/meditation/config";
import { injectDataToSystemPrompt } from "~/lib/meditation/inject-data-to-system-prompt";

const meditationSchema = z.object({
  duration: z.number().min(1).max(30).optional().default(5),
  prompt: z.string().min(1).max(500),
  voiceId: z.string().optional().default('g6xIsTj2HwM6VR4iXFCw'),
  background: z.enum(['silence', 'waves', 'rain', 'focus', 'relax']).optional().default('silence'),
  guidance: z.enum(['beginner', 'confirmed', 'expert']).optional().default('confirmed'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration, prompt, voiceId, background, guidance } = meditationSchema.parse(body);

    console.log(`🧘 Starting meditation generation: ${duration}min, voice: ${voiceId}, background: ${background}, guidance: ${guidance}`);

    const system_prompt = injectDataToSystemPrompt({
      template_system_prompt: defaultSystemPrompt,
      duration,
    });

    const text_content = generateContent({
      user_prompt: prompt,
      system_prompt,
    });

    // Collect all segments (text and pauses) first
    const segments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [];
    
    for await (const item of parseTextContent(text_content)) {
      if (typeof item === "string") {
        segments.push({ type: 'text', content: item });
      } else if (typeof item === "number") {
        segments.push({ type: 'pause', duration: item });
      }
    }

    console.log(`✅ Generated ${segments.length} segments`);

    // Generate concatenated meditation MP3 stream
    // TODO: Add support for custom voiceId and background sounds
    const meditationStream = await generateConcatenatedMeditation(segments);

    console.log('✅ Meditation generation complete');

    // Convert ReadableStream to Response
    return new Response(meditationStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="meditation.mp3"',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('❌ Meditation generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate meditation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 