/**
 * Script de test pour l'Agent IA de méditation
 * Test complet de l'orchestration intelligence
 */

// Import des modules (simulation Node.js)
const { MeditationAIAgent } = require('./src/lib/meditation/ai-agent');
const { MeditationParser } = require('./src/lib/meditation/ai-parser');
const { aiMetrics } = require('./src/lib/meditation/ai-metrics');

/**
 * Scénarios de test
 */
const TEST_SCENARIOS = [
    {
        name: "Méditation anti-stress rapide",
        prompt: "Je suis très stressé après ma journée de travail, j'ai besoin d'une méditation courte pour me détendre",
        expected: {
            goal: 'stress',
            duration: 5,
            voiceGender: 'female',
            voiceStyle: 'calm'
        }
    },
    {
        name: "Préparation au sommeil",
        prompt: "J'ai du mal à m'endormir, une méditation de 15 minutes avec une voix douce féminine pour le sommeil",
        expected: {
            goal: 'sleep',
            duration: 15,
            voiceGender: 'female',
            voiceStyle: 'warm'
        }
    },
    {
        name: "Concentration pour étudier",
        prompt: "Je dois me concentrer pour réviser mes examens, méditation focus de 8 minutes avec voix masculine professionnelle",
        expected: {
            goal: 'focus',
            duration: 8,
            voiceGender: 'male',
            voiceStyle: 'professional'
        }
    },
    {
        name: "Gestion de la douleur",
        prompt: "J'ai mal au dos depuis ce matin, méditation thérapeutique pour la douleur",
        expected: {
            goal: 'pain',
            duration: 12,
            voiceStyle: 'warm'
        }
    },
    {
        name: "Équilibre émotionnel",
        prompt: "Je me sens triste et anxieux, j'aimerais une méditation pour équilibrer mes émotions",
        expected: {
            goal: 'emotion',
            duration: 10,
            voiceStyle: 'warm'
        }
    }
];

/**
 * Tests unitaires
 */
async function runParserTests() {
    console.log('\n🧪 === TESTS DU PARSER INTELLIGENT ===\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    for (const scenario of TEST_SCENARIOS) {
        totalTests++;
        console.log(`📝 Test: ${scenario.name}`);
        console.log(`   Prompt: "${scenario.prompt}"`);
        
        try {
            // Parser la demande
            const request = MeditationParser.parseUserRequest(scenario.prompt, 1);
            
            // Vérifier les résultats
            const checks = [
                { field: 'goal', expected: scenario.expected.goal, actual: request.goal },
                { field: 'duration', expected: scenario.expected.duration, actual: request.duration },
                { field: 'voiceGender', expected: scenario.expected.voiceGender, actual: request.voiceGender },
                { field: 'voiceStyle', expected: scenario.expected.voiceStyle, actual: request.voiceStyle }
            ];
            
            let testPassed = true;
            for (const check of checks) {
                if (check.expected && check.expected !== check.actual) {
                    console.log(`   ❌ ${check.field}: attendu "${check.expected}", obtenu "${check.actual}"`);
                    testPassed = false;
                } else if (check.expected) {
                    console.log(`   ✅ ${check.field}: "${check.actual}"`);
                }
            }
            
            // Analyser la complexité
            const complexity = MeditationParser.analyzeComplexity(request);
            console.log(`   📊 Complexité: ${complexity.recommendation} (score: ${complexity.score})`);
            
            if (testPassed) {
                passedTests++;
                console.log(`   🎉 Test réussi!\n`);
            } else {
                console.log(`   💥 Test échoué!\n`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur: ${error.message}\n`);
        }
    }
    
    console.log(`📊 Résultats Parser: ${passedTests}/${totalTests} tests réussis (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);
    return { passed: passedTests, total: totalTests };
}

/**
 * Tests de l'Agent IA complet
 */
async function runAgentTests() {
    console.log('🤖 === TESTS DE L\'AGENT IA COMPLET ===\n');
    
    const agent = new MeditationAIAgent();
    let passedTests = 0;
    let totalTests = 0;
    
    for (const scenario of TEST_SCENARIOS) {
        totalTests++;
        console.log(`🎯 Test Agent: ${scenario.name}`);
        
        try {
            // Parser la demande
            const request = MeditationParser.parseUserRequest(scenario.prompt, 1);
            
            // Générer avec l'Agent IA
            const startTime = Date.now();
            const result = await agent.generateOptimizedMeditation(request);
            const endTime = Date.now();
            
            // Analyser les résultats
            console.log(`   ⏱️  Temps de génération: ${endTime - startTime}ms`);
            console.log(`   ✅ Succès: ${result.success}`);
            console.log(`   🎵 URL Audio: ${result.audioUrl ? 'Générée' : 'Manquante'}`);
            console.log(`   💰 Coût: $${result.actualCost.toFixed(4)}`);
            console.log(`   ⭐ Qualité: ${result.actualQuality.toFixed(1)}/5`);
            console.log(`   ♻️  Segments réutilisés: ${result.segmentsReused}/${result.segmentsReused + result.segmentsCreated}`);
            console.log(`   🚀 Optimisation: ${(result.optimizationAchieved * 100).toFixed(1)}%`);
            
            if (result.errors && result.errors.length > 0) {
                console.log(`   ⚠️  Erreurs: ${result.errors.join(', ')}`);
            }
            
            // Critères de réussite
            const testPassed = result.success && 
                              result.audioUrl && 
                              result.actualQuality >= 3.0 &&
                              endTime - startTime < 30000; // Moins de 30s
            
            if (testPassed) {
                passedTests++;
                console.log(`   🎉 Test Agent réussi!\n`);
            } else {
                console.log(`   💥 Test Agent échoué!\n`);
            }
            
        } catch (error) {
            console.log(`   ❌ Erreur Agent: ${error.message}\n`);
        }
    }
    
    console.log(`📊 Résultats Agent: ${passedTests}/${totalTests} tests réussis (${((passedTests/totalTests)*100).toFixed(1)}%)\n`);
    return { passed: passedTests, total: totalTests };
}

/**
 * Tests des métriques de performance
 */
async function runMetricsTests() {
    console.log('📊 === TESTS DES MÉTRIQUES ===\n');
    
    // Simuler quelques événements
    const mockEvents = [
        {
            timestamp: new Date(),
            requestId: 'test-1',
            userId: 1,
            goal: 'stress',
            duration: 10,
            generationTime: 5000,
            totalCost: 0.05,
            qualityScore: 4.2,
            segmentsTotal: 5,
            segmentsReused: 3,
            segmentsCreated: 2,
            cacheHitRate: 0.6,
            decisions: { reuse_exact: 2, reuse_similar: 1, create_new: 2 },
            success: true
        },
        {
            timestamp: new Date(),
            requestId: 'test-2',
            userId: 2,
            goal: 'sleep',
            duration: 15,
            generationTime: 7000,
            totalCost: 0.08,
            qualityScore: 4.5,
            segmentsTotal: 5,
            segmentsReused: 4,
            segmentsCreated: 1,
            cacheHitRate: 0.8,
            decisions: { reuse_exact: 3, reuse_similar: 1, create_new: 1 },
            success: true
        }
    ];
    
    try {
        // Enregistrer les événements
        for (const event of mockEvents) {
            await aiMetrics.recordOptimizationEvent(event);
        }
        
        // Obtenir les métriques
        const metrics = aiMetrics.getPerformanceMetrics();
        
        console.log('📈 Métriques de Performance:');
        console.log(`   📊 Requêtes totales: ${metrics.totalRequests}`);
        console.log(`   ✅ Taux de succès: ${(metrics.successRate * 100).toFixed(1)}%`);
        console.log(`   ⏱️  Temps moyen: ${metrics.averageGenerationTime.toFixed(0)}ms`);
        console.log(`   ⭐ Qualité moyenne: ${metrics.averageQualityScore.toFixed(1)}/5`);
        console.log(`   ♻️  Taux de réutilisation: ${(metrics.segmentReuseRate * 100).toFixed(1)}%`);
        console.log(`   💰 Économies moyennes: $${metrics.averageCostSaving.toFixed(4)}`);
        
        // Analyser les tendances
        const trends = await aiMetrics.analyzeTrends('day');
        
        console.log('\n📈 Analyse des Tendances:');
        console.log(`   📊 Période: ${trends.period}`);
        console.log(`   🎯 Insights: ${trends.insights.length > 0 ? trends.insights.join(', ') : 'Aucun insight significatif'}`);
        console.log(`   💡 Recommandations: ${trends.recommendations.length > 0 ? trends.recommendations.join(', ') : 'Aucune recommandation'}`);
        
        // Rapport détaillé
        const report = await aiMetrics.getDetailedReport();
        
        console.log('\n📋 Rapport Détaillé:');
        console.log(`   🏆 Top objectifs: ${report.topPerformers.goals.length > 0 ? report.topPerformers.goals[0]?.goal || 'Aucun' : 'Aucun'}`);
        console.log(`   🚧 Goulots d'étranglement: ${report.bottlenecks.length}`);
        console.log(`   🔮 Prédictions: ${report.predictions.length}`);
        
        console.log('   🎉 Tests métriques réussis!\n');
        return { passed: 1, total: 1 };
        
    } catch (error) {
        console.log(`   ❌ Erreur métriques: ${error.message}\n`);
        return { passed: 0, total: 1 };
    }
}

/**
 * Test de performance et de stress
 */
async function runPerformanceTests() {
    console.log('⚡ === TESTS DE PERFORMANCE ===\n');
    
    const agent = new MeditationAIAgent();
    const testCount = 5;
    const results = [];
    
    console.log(`🚀 Lancement de ${testCount} requêtes simultanées...\n`);
    
    const promises = TEST_SCENARIOS.slice(0, testCount).map(async (scenario, index) => {
        const request = MeditationParser.parseUserRequest(scenario.prompt, index + 1);
        const startTime = Date.now();
        
        try {
            const result = await agent.generateOptimizedMeditation(request);
            const endTime = Date.now();
            
            return {
                scenario: scenario.name,
                success: result.success,
                time: endTime - startTime,
                quality: result.actualQuality,
                optimization: result.optimizationAchieved,
                cost: result.actualCost
            };
        } catch (error) {
            return {
                scenario: scenario.name,
                success: false,
                time: Date.now() - startTime,
                error: error.message
            };
        }
    });
    
    try {
        const results = await Promise.all(promises);
        
        // Analyser les résultats
        const successfulResults = results.filter(r => r.success);
        const avgTime = successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length;
        const avgQuality = successfulResults.reduce((sum, r) => sum + r.quality, 0) / successfulResults.length;
        const avgOptimization = successfulResults.reduce((sum, r) => sum + r.optimization, 0) / successfulResults.length;
        const totalCost = successfulResults.reduce((sum, r) => sum + r.cost, 0);
        
        console.log('📊 Résultats de Performance:');
        console.log(`   ✅ Succès: ${successfulResults.length}/${results.length} (${(successfulResults.length/results.length*100).toFixed(1)}%)`);
        console.log(`   ⏱️  Temps moyen: ${avgTime.toFixed(0)}ms`);
        console.log(`   ⭐ Qualité moyenne: ${avgQuality.toFixed(1)}/5`);
        console.log(`   🚀 Optimisation moyenne: ${(avgOptimization * 100).toFixed(1)}%`);
        console.log(`   💰 Coût total: $${totalCost.toFixed(4)}`);
        
        // Détails par test
        console.log('\n📋 Détails par test:');
        results.forEach(result => {
            if (result.success) {
                console.log(`   ✅ ${result.scenario}: ${result.time}ms, qualité ${result.quality.toFixed(1)}, optimisation ${(result.optimization * 100).toFixed(1)}%`);
            } else {
                console.log(`   ❌ ${result.scenario}: Échec - ${result.error || 'Erreur inconnue'}`);
            }
        });
        
        const testPassed = successfulResults.length >= results.length * 0.8 && avgTime < 15000;
        
        if (testPassed) {
            console.log('\n   🎉 Tests de performance réussis!\n');
            return { passed: 1, total: 1 };
        } else {
            console.log('\n   💥 Tests de performance échoués!\n');
            return { passed: 0, total: 1 };
        }
        
    } catch (error) {
        console.log(`   ❌ Erreur performance: ${error.message}\n`);
        return { passed: 0, total: 1 };
    }
}

/**
 * Fonction principale de test
 */
async function runAllTests() {
    console.log('🧪 ======================================');
    console.log('🤖 TESTS COMPLETS DE L\'AGENT IA');
    console.log('======================================\n');
    
    const startTime = Date.now();
    
    // Exécuter tous les tests
    const parserResults = await runParserTests();
    const agentResults = await runAgentTests();
    const metricsResults = await runMetricsTests();
    const performanceResults = await runPerformanceTests();
    
    const endTime = Date.now();
    
    // Résumé global
    const totalPassed = parserResults.passed + agentResults.passed + metricsResults.passed + performanceResults.passed;
    const totalTests = parserResults.total + agentResults.total + metricsResults.total + performanceResults.total;
    const successRate = (totalPassed / totalTests) * 100;
    
    console.log('🎯 ======================================');
    console.log('📊 RÉSUMÉ GLOBAL DES TESTS');
    console.log('======================================');
    console.log(`⏱️  Durée totale: ${endTime - startTime}ms`);
    console.log(`✅ Tests réussis: ${totalPassed}/${totalTests}`);
    console.log(`📊 Taux de succès: ${successRate.toFixed(1)}%`);
    console.log('');
    console.log(`🧠 Parser: ${parserResults.passed}/${parserResults.total} (${(parserResults.passed/parserResults.total*100).toFixed(1)}%)`);
    console.log(`🤖 Agent IA: ${agentResults.passed}/${agentResults.total} (${(agentResults.passed/agentResults.total*100).toFixed(1)}%)`);
    console.log(`📊 Métriques: ${metricsResults.passed}/${metricsResults.total} (${(metricsResults.passed/metricsResults.total*100).toFixed(1)}%)`);
    console.log(`⚡ Performance: ${performanceResults.passed}/${performanceResults.total} (${(performanceResults.passed/performanceResults.total*100).toFixed(1)}%)`);
    
    if (successRate >= 80) {
        console.log('\n🎉 TESTS GLOBAUX RÉUSSIS! Agent IA prêt pour la production.');
    } else {
        console.log('\n⚠️  TESTS PARTIELLEMENT RÉUSSIS. Des améliorations sont nécessaires.');
    }
    
    if (successRate < 60) {
        console.log('❌ TESTS ÉCHOUÉS. L\'Agent IA nécessite des corrections importantes.');
    }
    
    console.log('======================================\n');
    
    return {
        success: successRate >= 80,
        totalPassed,
        totalTests,
        successRate,
        details: {
            parser: parserResults,
            agent: agentResults,
            metrics: metricsResults,
            performance: performanceResults
        }
    };
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    runAllTests,
    runParserTests,
    runAgentTests,
    runMetricsTests,
    runPerformanceTests,
    TEST_SCENARIOS
};