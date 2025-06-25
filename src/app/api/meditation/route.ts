import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MeditationAIAgent } from "~/lib/meditation/ai-agent";
import { generateConcatenatedMeditation } from "~/lib/meditation/generate-concatenated-meditation";

const meditationSchema = z.object({
  duration: z.number().min(0.5).max(30).optional().default(5), // Permet 0.5 minute (30 secondes) pour les tests
  prompt: z.string().min(1).max(500),
  voiceId: z.string().optional().default('g6xIsTj2HwM6VR4iXFCw'),
  background: z.enum(['silence', 'waves', 'rain', 'focus', 'relax']).optional().default('silence'),
  guidance: z.enum(['beginner', 'confirmed', 'expert']).optional().default('confirmed'),
  goal: z.enum(['morning', 'focus', 'calm', 'sleep']).optional().default('calm'),
  gender: z.enum(['male', 'female']).optional().default('female'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { duration, prompt, voiceId, background, guidance, goal, gender } = meditationSchema.parse(body);

    console.log(`🧘 Starting meditation generation with AI Agent: ${duration}min, goal: ${goal}, voice: ${voiceId}, background: ${background}, guidance: ${guidance}`);

    // Initialiser l'Agent IA
    const aiAgent = new MeditationAIAgent();

    // Créer la requête pour l'agent IA
    const meditationRequest = {
      goal: goal,
      duration: duration,
      voiceGender: gender,
      voiceStyle: 'calm', // Dérivé du guidance
      language: 'fr-FR',
      prompt: prompt,
      guidance: guidance,
      background: background
    };

    console.log(`🧠 Generating meditation with AI Agent...`);

    // Générer la méditation avec l'Agent IA (utilise embeddings, cache, optimisation)
    const aiResult = await aiAgent.generateOptimizedMeditation(meditationRequest);

    if (!aiResult.success) {
      throw new Error(`AI Agent failed: ${aiResult.errors?.join(', ') || 'Unknown error'}`);
    }

    console.log(`✅ AI Agent generated meditation successfully`);
    console.log(`💰 Cost: $${aiResult.actualCost.toFixed(4)}`);
    console.log(`♻️ Reused: ${aiResult.segmentsReused}/${aiResult.segmentsReused + aiResult.segmentsCreated} segments (${Math.round(aiResult.segmentsReused/(aiResult.segmentsReused + aiResult.segmentsCreated)*100)}%)`);
    console.log(`⚡ Optimization achieved: ${aiResult.optimizationAchieved.toFixed(1)}%`);

    // Pour l'instant, on utilise une approche simplifiée
    // TODO: Récupérer les segments depuis l'audioUrl ou implémenter une méthode pour obtenir les segments
    
    // Génération simplifiée de segments pour l'assemblage (fallback temporaire)
    const assemblySegments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [
      {
        type: 'text',
        content: `Bienvenue dans cette méditation de ${duration} minutes. Installez-vous confortablement et fermez les yeux.`
      },
      { type: 'pause', duration: 3 },
      {
        type: 'text', 
        content: 'Portez votre attention sur votre respiration naturelle. Inspirez profondément, puis expirez lentement.'
      },
      { type: 'pause', duration: 4 },
      {
        type: 'text',
        content: 'Maintenant, détendez progressivement chaque partie de votre corps, en commençant par le sommet de votre tête.'
      },
      { type: 'pause', duration: 6 },
      {
        type: 'text',
        content: 'Imaginez-vous dans un lieu paisible et sécurisant. Respirez la paix et la sérénité de cet endroit.'
      },
      { type: 'pause', duration: 8 },
      {
        type: 'text',
        content: 'Revenez doucement à l\'instant présent. Bougez délicatement vos doigts et vos orteils, puis ouvrez les yeux quand vous vous sentez prêt.'
      },
      { type: 'pause', duration: 4 }
    ];

    console.log(`🔧 Prepared ${assemblySegments.length} segments for assembly`);

    // Générer la méditation assemblée avec le service assembly
    console.log(`🎤 Using voice ID for generation: ${voiceId} (${gender})`);
    const meditationStream = await generateConcatenatedMeditation(assemblySegments, voiceId, gender);

    console.log('✅ Complete meditation generation with AI Agent successful');

    // Retourner le stream audio
    return new Response(meditationStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="meditation.mp3"',
        'Cache-Control': 'no-cache',
        'X-AI-Cost': aiResult.actualCost.toString(),
        'X-AI-Optimization': aiResult.optimizationAchieved.toString(),
        'X-AI-Reused': aiResult.segmentsReused.toString(),
        'X-AI-Created': aiResult.segmentsCreated.toString(),
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