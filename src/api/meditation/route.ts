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
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Installez-vous confortablement et fermez les yeux.`, textRatio: 0.6, pauseAfter: 2 },
      { type: 'breathing', content: `Portez votre attention sur votre respiration naturelle. Inspirez profondément par le nez, puis expirez lentement par la bouche. Laissez votre souffle vous ancrer dans l'instant présent.`, textRatio: 0.5, pauseAfter: 8 },
      { type: 'body_scan', content: `Maintenant, détendez progressivement chaque partie de votre corps. Commencez par le sommet de votre tête, puis vos épaules, vos bras, votre torse, et vos jambes. Relâchez toutes les tensions.`, textRatio: 0.5, pauseAfter: 6 },
      { type: 'visualization', content: `Imaginez-vous dans un lieu paisible et sécurisant. Peut-être une plage, une forêt, ou simplement votre endroit préféré. Ressentez la paix et la sérénité de ce lieu.`, textRatio: 0.5, pauseAfter: 8 },
      { type: 'conclusion', content: `Revenez doucement à l'instant présent. Bougez délicatement vos doigts et vos orteils. Quand vous êtes prêt, ouvrez les yeux. Vous vous sentez calme et détendu.`, textRatio: 0.6, pauseAfter: 2 }
    ];
  } else if (duration <= 5) {
    // Méditation moyenne : équilibre texte/pauses
    template = [
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Installez-vous confortablement dans une position qui vous convient. Fermez les yeux et accordez-vous ce moment de paix.`, textRatio: 0.4, pauseAfter: 4 },
      { type: 'breathing', content: `Portez votre attention sur votre respiration naturelle, sans chercher à la modifier. Observez simplement l'air qui entre et qui sort. À chaque expiration, relâchez un peu plus les tensions de votre journée.`, textRatio: 0.3, pauseAfter: 12 },
      { type: 'body_scan', content: `Maintenant, parcourez votre corps avec bienveillance. Commencez par le sommet de votre tête, détendez votre front, vos yeux, votre mâchoire. Puis vos épaules, vos bras, votre poitrine, votre ventre, vos hanches, vos jambes et vos pieds.`, textRatio: 0.3, pauseAfter: 15 },
      { type: 'visualization', content: `Imaginez-vous dans votre lieu de paix personnel. Un endroit où vous vous sentez parfaitement en sécurité et détendu. Explorez ce lieu avec tous vos sens. Ressentez la tranquillité qu'il vous apporte.`, textRatio: 0.3, pauseAfter: 18 },
      { type: 'conclusion', content: `Il est maintenant temps de revenir doucement. Prenez conscience de votre corps, de votre respiration. Bougez délicatement vos mains et vos pieds. Quand vous vous sentez prêt, ouvrez doucement les yeux. Emportez avec vous cette sensation de calme.`, textRatio: 0.4, pauseAfter: 3 }
    ];
  } else {
    // Méditation longue : plus de pauses contemplatives
    template = [
      { type: 'intro', content: `Bienvenue dans cette méditation de ${duration} minutes. Prenez le temps de vous installer confortablement. Fermez les yeux et laissez-vous guider dans ce voyage intérieur vers la paix et la sérénité.`, textRatio: 0.3, pauseAfter: 6 },
      { type: 'breathing', content: `Commençons par nous connecter à notre respiration. Observez le rythme naturel de votre souffle. Sentez l'air frais qui entre par vos narines et l'air chaud qui en ressort. Laissez votre respiration devenir votre ancre dans l'instant présent.`, textRatio: 0.25, pauseAfter: 20 },
      { type: 'body_scan', content: `Maintenant, explorons votre corps avec attention et bienveillance. Commencez par le sommet de votre crâne. Détendez chaque muscle de votre visage, relâchez vos épaules, libérez vos bras. Sentez votre poitrine s'ouvrir, votre ventre se détendre. Relâchez vos hanches, vos cuisses, vos mollets, jusqu'à la pointe de vos orteils.`, textRatio: 0.25, pauseAfter: 25 },
      { type: 'visualization', content: `Visualisez maintenant votre sanctuaire intérieur. Un lieu unique qui n'appartient qu'à vous, où règnent la paix et l'harmonie. Explorez ce lieu magique, ressentez sa beauté, sa tranquillité. Laissez-vous imprégner par l'énergie apaisante de cet espace sacré.`, textRatio: 0.25, pauseAfter: 30 },
      { type: 'conclusion', content: `Notre voyage touche à sa fin. Revenez progressivement à votre corps physique, à votre respiration. Emportez avec vous la paix et la sérénité que vous venez de cultiver. Bougez doucement vos membres, et quand vous vous sentez prêt, ouvrez les yeux avec un sourire.`, textRatio: 0.3, pauseAfter: 4 }
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

    // Utiliser l'Agent IA pour une génération optimisée
    const aiAgent = new MeditationAIAgent();
    
    const meditationRequest = {
      prompt: `Create a ${duration}-minute ${goal} meditation. ${prompt}. Provide ${guidance} guidance. Use a ${gender} voice.`,
      duration,
      voiceGender: gender,
      voiceStyle: 'calm',
      goal,
      language: 'fr-FR',
      userId: 1
    };

    console.log('🧠 Generating meditation with AI Agent...');
    const result = await aiAgent.generateOptimizedMeditation(meditationRequest);
    
    if (!result.success) {
      throw new Error(`AI Agent generation failed: ${result.errors?.join(', ')}`);
    }

    console.log('✅ AI Agent generated meditation successfully');
    console.log(`💰 Cost: $${result.actualCost.toFixed(4)}`);
    console.log(`♻️ Reused: ${result.segmentsReused}/${result.segmentsReused + result.segmentsCreated} segments (${Math.round(result.optimizationAchieved * 100)}%)`);
    console.log(`⚡ Optimization achieved: ${(result.optimizationAchieved * 100).toFixed(1)}%`);

    // Fallback : si l'Agent IA échoue, utiliser la méthode optimisée
    if (!result.audioUrl) {
      console.log('🔧 Falling back to optimized generation...');
      
      const optimizedSegments = generateOptimizedSegments(duration, goal);
      
      console.log(`🔧 Prepared ${optimizedSegments.length * 2} segments for assembly`);
      console.log(`🎤 Using voice ID for generation: ${voiceId} (${gender})`);

      // Convertir en format attendu par generateConcatenatedMeditation
      const segments: Array<{ type: "text"; content: string } | { type: "pause"; duration: number }> = [];
      
      optimizedSegments.forEach((seg, index) => {
        // Ajouter le segment de texte
        segments.push({
          type: "text",
          content: seg.content
        });
        
        // Ajouter la pause après (sauf pour le dernier segment)
        if (index < optimizedSegments.length - 1 || seg.pauseAfter > 2) {
          segments.push({
            type: "pause",
            duration: seg.pauseAfter
          });
        }
      });

      const audioStream = await generateConcatenatedMeditation(
        segments,
        voiceId,
        gender
      );

      console.log('✅ Complete meditation generation with optimized segments successful');

      return new Response(audioStream, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="meditation_${goal}_${duration}min.mp3"`,
        },
      });
    }

    // Si l'Agent IA a réussi, retourner son résultat
    if (result.audioUrl) {
      const audioResponse = await fetch(result.audioUrl);
      if (audioResponse.ok && audioResponse.body) {
        return new Response(audioResponse.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Disposition": `attachment; filename="meditation_${goal}_${duration}min.mp3"`,
          },
        });
      }
    }

    throw new Error('No audio generated');

  } catch (error) {
    console.error("❌ Meditation generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate meditation", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
} 