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

/**
 * Génère des segments de méditation optimisés pour la durée demandée
 */
function generateOptimizedSegments(duration: number, goal: string) {
  const totalDurationSeconds = duration * 60;
  
  // Templates optimisés selon la durée
  let template;
  if (duration <= 2) {
    // Méditation courte : focus sur l'essentiel
    template = [
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Installez-vous confortablement et fermez les yeux.`, pauseAfter: 2 },
      { type: 'breathing', content: `Portez votre attention sur votre respiration naturelle. Inspirez profondément par le nez, puis expirez lentement par la bouche. Laissez votre souffle vous ancrer dans l'instant présent.`, pauseAfter: 8 },
      { type: 'body_scan', content: `Maintenant, détendez progressivement chaque partie de votre corps. Commencez par le sommet de votre tête, puis vos épaules, vos bras, votre torse, et vos jambes. Relâchez toutes les tensions.`, pauseAfter: 6 },
      { type: 'visualization', content: `Imaginez-vous dans un lieu paisible et sécurisant. Peut-être une plage, une forêt, ou simplement votre endroit préféré. Ressentez la paix et la sérénité de ce lieu.`, pauseAfter: 8 },
      { type: 'conclusion', content: `Revenez doucement à l'instant présent. Bougez délicatement vos doigts et vos orteils. Quand vous êtes prêt, ouvrez les yeux. Vous vous sentez calme et détendu.`, pauseAfter: 2 }
    ];
  } else if (duration <= 5) {
    // Méditation moyenne : équilibre texte/pauses
    template = [
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix.`, pauseAfter: 4 },
      { type: 'breathing', content: `Portez votre attention sur votre respiration naturelle, sans chercher à la modifier. Observez simplement l'air qui entre et qui sort. À chaque expiration, relâchez un peu plus les tensions de votre journée.`, pauseAfter: 12 },
      { type: 'body_scan', content: `Maintenant, parcourez votre corps avec bienveillance. Commencez par le sommet de votre tête, détendez votre front, vos yeux, votre mâchoire. Puis vos épaules, vos bras, votre poitrine, votre ventre, vos hanches, vos jambes et vos pieds.`, pauseAfter: 15 },
      { type: 'visualization', content: `Imaginez-vous dans votre lieu de paix personnel. Un endroit où vous vous sentez parfaitement en sécurité et détendu. Explorez ce lieu avec tous vos sens. Ressentez la tranquillité qu'il vous apporte.`, pauseAfter: 18 },
      { type: 'conclusion', content: `Il est maintenant temps de revenir doucement. Prenez conscience de votre corps, de votre respiration. Bougez délicatement vos mains et vos pieds. Quand vous vous sentez prêt, ouvrez doucement les yeux. Emportez avec vous cette sensation de calme.`, pauseAfter: 3 }
    ];
  } else {
    // Méditation longue : plus de pauses contemplatives
    template = [
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Prenez le temps de vous installer confortablement. Fermez les yeux et laissez-vous guider dans ce voyage intérieur vers la paix et la sérénité.`, pauseAfter: 6 },
      { type: 'breathing', content: `Commençons par nous connecter à notre respiration. Observez le rythme naturel de votre souffle. Sentez l'air frais qui entre par vos narines et l'air chaud qui en ressort. Laissez votre respiration devenir votre ancre dans l'instant présent.`, pauseAfter: 20 },
      { type: 'body_scan', content: `Maintenant, explorons votre corps avec attention et bienveillance. Commencez par le sommet de votre crâne. Détendez chaque muscle de votre visage, relâchez vos épaules, libérez vos bras. Sentez votre poitrine s'ouvrir, votre ventre se détendre. Relâchez vos hanches, vos cuisses, vos mollets, jusqu'à la pointe de vos orteils.`, pauseAfter: 25 },
      { type: 'visualization', content: `Visualisez maintenant votre sanctuaire intérieur. Un lieu unique qui n'appartient qu'à vous, où règnent la paix et l'harmonie. Explorez ce lieu magique, ressentez sa beauté, sa tranquillité. Laissez-vous imprégner par l'énergie apaisante de cet espace sacré.`, pauseAfter: 30 },
      { type: 'conclusion', content: `Notre voyage touche à sa fin. Revenez progressivement à votre corps physique, à votre respiration. Emportez avec vous la paix et la sérénité que vous venez de cultiver. Bougez doucement vos membres, et quand vous vous sentez prêt, ouvrez les yeux avec un sourire.`, pauseAfter: 4 }
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
  
  console.log(`📊 Durée planifiée: ${Math.round(totalPlannedTime)}s, Durée cible: ${totalDurationSeconds}s, Ratio: ${adjustmentRatio.toFixed(2)}`);
  
  return template.map(seg => ({
    ...seg,
    pauseAfter: Math.max(1, Math.round(seg.pauseAfter * adjustmentRatio))
  }));
}

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

    // Générer des segments optimisés pour la durée demandée
    const optimizedSegments = generateOptimizedSegments(duration, goal);
    
    // Convertir en format attendu par generateConcatenatedMeditation
    const assemblySegments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [];
    
    optimizedSegments.forEach((seg, index) => {
      // Ajouter le segment de texte
      assemblySegments.push({
        type: 'text',
        content: seg.content
      });
      
      // Ajouter la pause après (sauf pour le dernier segment s'il a une pause très courte)
      if (index < optimizedSegments.length - 1 || seg.pauseAfter > 2) {
        assemblySegments.push({
          type: 'pause',
          duration: seg.pauseAfter
        });
      }
    });

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