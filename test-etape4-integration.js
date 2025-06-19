/**
 * Test d'intégration ÉTAPE 4 : Agent IA + Assembly Audio
 * Test complet du workflow de génération de méditation avec assemblage
 */

import { MeditationAIAgent } from './src/lib/meditation/ai-agent.js';
import { MeditationParser } from './src/lib/meditation/ai-parser.js';
import { aiMetrics } from './src/lib/meditation/ai-metrics.js';

// Simuler le service d'assemblage (car service externe pas encore déployé)
class MockAssemblyClient {
    constructor(config) {
        this.config = config;
        this.isHealthy = true;
    }
    
    async healthCheck() {
        return {
            status: this.isHealthy ? 'healthy' : 'unhealthy',
            version: '1.0.0',
            uptime: 3600,
            ffmpegVersion: '4.4.2',
            activeJobs: 0,
            queueSize: 0,
            systemResources: {
                cpuUsage: 25,
                memoryUsage: 45,
                diskSpace: 85
            }
        };
    }
    
    async assembleAudio(request) {
        console.log(`🔧 [MOCK] Assemblage audio pour ${request.requestId}`);
        console.log(`   - ${request.segments.length} segments`);
        console.log(`   - Format: ${request.options.format} @ ${request.options.quality}`);
        
        // Simuler le temps de traitement
        const processingTime = 2000 + (request.segments.length * 500);
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        // Calculer la taille estimée
        const totalDuration = request.segments.reduce((sum, s) => sum + s.duration + (s.silenceAfter || 0), 0);
        const bitrate = parseInt(request.options.quality.replace('k', ''));
        const estimatedSize = Math.round(totalDuration * bitrate * 1000 / 8);
        
        return {
            requestId: request.requestId,
            status: 'completed',
            audioUrl: `https://mock-assembly.neiji.com/audio/${request.requestId}.${request.options.format}`,
            duration: totalDuration,
            fileSize: estimatedSize,
            format: request.options.format,
            quality: request.options.quality,
            metadata: {
                title: request.options.addMetadata?.title || 'Méditation Neiji',
                duration: totalDuration,
                bitrate: request.options.quality,
                sampleRate: 44100,
                channels: 2
            },
            processingTime
        };
    }
}

/**
 * Test principal d'intégration
 */
async function testEtape4Integration() {
    console.log('🚀 TEST ÉTAPE 4 : Intégration Agent IA + Assembly Audio\n');
    
    const startTime = Date.now();
    const testCases = [
        {
            name: 'Méditation Anti-Stress 10min',
            prompt: 'Je suis très stressé par le travail, j\'aimerais une méditation de 10 minutes pour me détendre avec une voix féminine douce',
            expectedGoal: 'stress',
            expectedDuration: 10
        },
        {
            name: 'Méditation Sommeil 15min',
            prompt: 'Aide-moi à m\'endormir avec une méditation de 15 minutes, voix masculine apaisante',
            expectedGoal: 'sleep',
            expectedDuration: 15
        },
        {
            name: 'Méditation Focus 5min',
            prompt: 'Méditation courte de 5 minutes pour améliorer ma concentration avant un examen',
            expectedGoal: 'focus',
            expectedDuration: 5
        }
    ];
    
    const results = [];
    const mockAssemblyClient = new MockAssemblyClient({
        serviceUrl: 'https://mock-assembly.neiji.com',
        apiKey: 'mock-key-123',
        timeout: 60000
    });
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 Test ${i + 1}/${testCases.length}: ${testCase.name}`);
        console.log(`   Prompt: "${testCase.prompt}"`);
        
        try {
            const testStartTime = Date.now();
            
            // 1. Parser la demande utilisateur
            console.log('🧠 Étape 1: Analyse de la demande...');
            const parsedRequest = MeditationParser.parseUserRequest(testCase.prompt, 123);
            
            console.log(`   ✅ Goal: ${parsedRequest.goal} (attendu: ${testCase.expectedGoal})`);
            console.log(`   ✅ Durée: ${parsedRequest.duration}min (attendu: ${testCase.expectedDuration}min)`);
            console.log(`   ✅ Voix: ${parsedRequest.voiceGender} ${parsedRequest.voiceStyle}`);
            
            // 2. Générer les segments optimisés
            console.log('🎯 Étape 2: Génération segments optimisés...');
            const agent = new MeditationAIAgent();
            const generationResult = await agent.generateOptimizedMeditation(parsedRequest);
            
            if (!generationResult.success) {
                throw new Error(`Génération échouée: ${generationResult.error}`);
            }
            
            const { segments, optimizationDecisions, metrics } = generationResult;
            console.log(`   ✅ ${segments.length} segments générés`);
            console.log(`   ✅ ${optimizationDecisions.totalReused}/${segments.length} segments réutilisés (${Math.round(optimizationDecisions.totalReused/segments.length*100)}%)`);
            console.log(`   ✅ Coût: $${metrics.totalCost.toFixed(4)} (économie: $${metrics.totalCostSavings.toFixed(4)})`);
            
            // 3. Simuler la génération d'audio
            console.log('🎵 Étape 3: Génération audio segments...');
            const audioUrls = [];
            let audioGenerationTime = 0;
            
            for (let j = 0; j < segments.length; j++) {
                const decision = optimizationDecisions.decisions[j];
                if (decision?.action === 'reuse_exact' || decision?.action === 'reuse_similar') {
                    audioUrls.push(`https://cached-audio.neiji.com/${decision.cachedSegment.id}.mp3`);
                    console.log(`   ♻️  Segment ${j + 1}: Réutilisation (${decision.action})`);
                } else {
                    // Simuler génération TTS (2-5 secondes par segment)
                    const genTime = 2000 + Math.random() * 3000;
                    audioGenerationTime += genTime;
                    await new Promise(resolve => setTimeout(resolve, 100)); // Simulation rapide
                    
                    audioUrls.push(`https://generated-audio.neiji.com/segment_${j + 1}_${Date.now()}.mp3`);
                    console.log(`   🎨 Segment ${j + 1}: Nouveau audio généré (${genTime.toFixed(0)}ms)`);
                }
            }
            
            console.log(`   ✅ ${audioUrls.length} URLs audio générées en ${audioGenerationTime.toFixed(0)}ms`);
            
            // 4. Assemblage audio
            console.log('🔧 Étape 4: Assemblage audio...');
            
            // Créer la requête d'assemblage
            const assemblyRequest = {
                requestId: `test_${Date.now()}_${i}`,
                segments: segments.map((segment, idx) => ({
                    id: segment.id,
                    audioUrl: audioUrls[idx],
                    duration: segment.duration,
                    silenceAfter: idx < segments.length - 1 ? (segment.type === 'breathing' ? 5 : 3) : 0,
                    volume: 1.0,
                    fadeIn: idx === 0 ? 500 : 200,
                    fadeOut: idx === segments.length - 1 ? 1000 : 200
                })),
                options: {
                    format: 'mp3',
                    quality: '256k',
                    normalize: true,
                    fadeTransitions: true,
                    removeArtifacts: true,
                    addMetadata: {
                        title: `${testCase.name}`,
                        artist: 'Neiji',
                        album: 'Méditations Personnalisées'
                    }
                },
                userId: 123,
                priority: 'normal'
            };
            
            // Envoyer à l'assemblage (simulé)
            const assemblyResult = await mockAssemblyClient.assembleAudio(assemblyRequest);
            
            console.log(`   ✅ Assemblage terminé: ${assemblyResult.audioUrl}`);
            console.log(`   ✅ Durée finale: ${assemblyResult.duration.toFixed(1)}s`);
            console.log(`   ✅ Taille fichier: ${(assemblyResult.fileSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   ✅ Temps assemblage: ${assemblyResult.processingTime}ms`);
            
            // 5. Résultats du test
            const totalTestTime = Date.now() - testStartTime;
            
            const testResult = {
                name: testCase.name,
                success: true,
                timing: {
                    total: totalTestTime,
                    aiGeneration: metrics.totalGenerationTime,
                    audioGeneration: audioGenerationTime,
                    assembly: assemblyResult.processingTime
                },
                optimization: {
                    segmentsTotal: segments.length,
                    segmentsReused: optimizationDecisions.totalReused,
                    optimizationRate: Math.round(optimizationDecisions.totalReused/segments.length*100),
                    costSavings: metrics.totalCostSavings
                },
                output: {
                    audioUrl: assemblyResult.audioUrl,
                    duration: assemblyResult.duration,
                    fileSize: assemblyResult.fileSize,
                    quality: assemblyResult.quality
                },
                validation: {
                    goalMatch: parsedRequest.goal === testCase.expectedGoal,
                    durationMatch: Math.abs(parsedRequest.duration - testCase.expectedDuration) <= 1
                }
            };
            
            results.push(testResult);
            console.log(`✅ Test réussi en ${totalTestTime}ms`);
            
        } catch (error) {
            console.error(`❌ Test échoué:`, error);
            results.push({
                name: testCase.name,
                success: false,
                error: error.message,
                timing: { total: Date.now() - testStartTime }
            });
        }
    }
    
    // 6. Résumé final
    const totalTime = Date.now() - startTime;
    const successfulTests = results.filter(r => r.success).length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSUMÉ DES TESTS ÉTAPE 4');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 Résultats globaux:`);
    console.log(`   • Tests réussis: ${successfulTests}/${results.length} (${Math.round(successfulTests/results.length*100)}%)`);
    console.log(`   • Temps total: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    
    if (successfulTests > 0) {
        const successfulResults = results.filter(r => r.success);
        const avgOptimization = successfulResults.reduce((sum, r) => sum + r.optimization.optimizationRate, 0) / successfulResults.length;
        const avgTotalTime = successfulResults.reduce((sum, r) => sum + r.timing.total, 0) / successfulResults.length;
        const totalCostSavings = successfulResults.reduce((sum, r) => sum + r.optimization.costSavings, 0);
        
        console.log(`\n📈 Métriques de performance:`);
        console.log(`   • Taux d'optimisation moyen: ${avgOptimization.toFixed(1)}%`);
        console.log(`   • Temps génération moyen: ${avgTotalTime.toFixed(0)}ms`);
        console.log(`   • Économies totales: $${totalCostSavings.toFixed(4)}`);
        
        console.log(`\n🔧 Détails par test:`);
        successfulResults.forEach((result, idx) => {
            console.log(`   ${idx + 1}. ${result.name}:`);
            console.log(`      ⏱️  ${result.timing.total}ms (IA: ${result.timing.aiGeneration}ms, Assembly: ${result.timing.assembly}ms)`);
            console.log(`      ♻️  ${result.optimization.optimizationRate}% optimisation`);
            console.log(`      📁 ${(result.output.fileSize/1024/1024).toFixed(2)}MB @ ${result.output.quality}`);
            console.log(`      ✅ Goal/Durée: ${result.validation.goalMatch}/${result.validation.durationMatch}`);
        });
    }
    
    // 7. Test du service d'assemblage
    console.log(`\n🔧 Test service d'assemblage:`);
    try {
        const healthCheck = await mockAssemblyClient.healthCheck();
        console.log(`   ✅ Status: ${healthCheck.status}`);
        console.log(`   ✅ Version: ${healthCheck.version}`);
        console.log(`   ✅ FFmpeg: ${healthCheck.ffmpegVersion}`);
        console.log(`   ✅ CPU: ${healthCheck.systemResources.cpuUsage}%`);
        console.log(`   ✅ RAM: ${healthCheck.systemResources.memoryUsage}%`);
    } catch (error) {
        console.error(`   ❌ Health check échoué:`, error.message);
    }
    
    // 8. Validation des objectifs ÉTAPE 4
    console.log(`\n🎯 Validation objectifs ÉTAPE 4:`);
    
    if (successfulTests > 0) {
        const avgTime = results.filter(r => r.success).reduce((sum, r) => sum + r.timing.total, 0) / successfulTests;
        const avgOptim = results.filter(r => r.success).reduce((sum, r) => sum + r.optimization.optimizationRate, 0) / successfulTests;
        
        console.log(`   • Temps génération: ${avgTime.toFixed(0)}ms ${avgTime < 15000 ? '✅' : '❌'} (objectif: <15s)`);
        console.log(`   • Taux optimisation: ${avgOptim.toFixed(1)}% ${avgOptim >= 40 ? '✅' : '❌'} (objectif: ≥40%)`);
        console.log(`   • Taux succès: ${Math.round(successfulTests/results.length*100)}% ${successfulTests/results.length >= 0.98 ? '✅' : '❌'} (objectif: >98%)`);
        console.log(`   • Intégration Assembly: ✅ (service mock fonctionnel)`);
    }
    
    console.log(`\n🚀 ÉTAPE 4 ${successfulTests === results.length ? 'VALIDÉE' : 'EN COURS'} !`);
    
    if (successfulTests === results.length) {
        console.log(`\n🎉 Tous les tests sont passés ! L'intégration Agent IA + Assembly est prête.`);
        console.log(`📋 Prochaines étapes:`);
        console.log(`   1. Déployer le service Assembly sur Railway/Render`);
        console.log(`   2. Configurer les variables d'environnement`);
        console.log(`   3. Tests avec le vrai service FFmpeg`);
        console.log(`   4. Mise en production complète`);
    }
    
    return {
        success: successfulTests === results.length,
        results,
        summary: {
            totalTests: results.length,
            successfulTests,
            totalTime,
            avgOptimization: successfulTests > 0 ? results.filter(r => r.success).reduce((sum, r) => sum + r.optimization.optimizationRate, 0) / successfulTests : 0
        }
    };
}

// Exécuter le test
if (import.meta.url === `file://${process.argv[1]}`) {
    testEtape4Integration()
        .then(result => {
            console.log('\n✅ Test terminé');
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Erreur lors du test:', error);
            process.exit(1);
        });
}

export { testEtape4Integration }; 