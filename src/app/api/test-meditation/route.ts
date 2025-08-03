import { NextRequest, NextResponse } from "next/server";
// Use Node.js runtime for FFmpeg dynamic import support
export const runtime = 'nodejs';
import { z } from "zod";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";
import { env } from "~/env";

const testMeditationSchema = z.object({
  voiceId: z.string().optional().default('GUDYcgRAONiI1nXDcNQQ'), // Male voice par défaut
  gender: z.enum(['male', 'female']).optional().default('male'),
});

async function checkAssemblyServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${env.ASSEMBLY_SERVICE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch (error) {
    console.error('Assembly service health check failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Starting TEST meditation generation (single sentence)...');

    // Check assembly service health first
    const isAssemblyHealthy = await checkAssemblyServiceHealth();
    if (!isAssemblyHealthy) {
      return NextResponse.json(
        { 
          error: 'Assembly service unavailable', 
          details: `Please ensure the assembly service is running at ${env.ASSEMBLY_SERVICE_URL}.`
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { voiceId, gender } = testMeditationSchema.parse(body);

    console.log(`🧪 Test meditation: voice: ${voiceId}, gender: ${gender}`);

    // Create minimal meditation - just one sentence with minimal pause
    const testSegments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [
      {
        type: 'text',
        content: 'Welcome to your test meditation. Take a deep breath and relax.'
      },
      {
        type: 'pause',
        duration: 1
      }
    ];

    console.log(`🔧 Prepared ${testSegments.length} test segments for assembly`);

    // Generate the minimal meditation
    console.log(`🎤 Using voice ID for test generation: ${voiceId} (${gender})`);
    const meditationStream = await generateConcatenatedMeditation(testSegments, voiceId, gender);

    console.log('✅ TEST meditation generation successful');

    // Return the audio stream
    return new Response(meditationStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="test-meditation.mp3"',
        'Cache-Control': 'no-cache',
        'X-Test-Mode': 'true',
      },
    });

  } catch (error) {
    console.error('❌ Test meditation generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test meditation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}