import { 
    findBestCachedSegment,
    saveAudioSegmentToCache,
    type SimilaritySearchResult
} from './audio-cache';
import {
    generateEmbedding,
    findSimilarSegmentsByEmbedding
} from './embeddings-service';

/**
 * Configuration de l'Agent IA
 */
const AI_CONFIG = {
    // Seuils de décision pour la réutilisation
    exactMatchThreshold: 0.98,      // 98%+ = utilisation directe
    highSimilarityThreshold: 0.90,  // 90%+ = réutilisation avec ajustement
    mediumSimilarityThreshold: 0.85, // 85%+ = considérer la réutilisation
    
    // Paramètres d'optimisation
    maxCacheSearchResults: 5,       // Nombre max de résultats à analyser
    qualityThreshold: 4.0,          // Score qualité minimum (sur 5)
    maxGenerationTime: 30000,       // Timeout génération (30s)
    
    // Métriques de performance
    targetCostReduction: 0.4,       // 40% de réduction visée
    targetSpeedImprovement: 3.0,    // 3x plus rapide visé
} as const;

/**
 * Types pour l'Agent IA
 */
export interface MeditationRequest {
    prompt: string;
    duration: number;          // en minutes
    voiceGender: 'male' | 'female';
    voiceStyle: string;        // 'calm', 'energetic', etc.
    goal: string;             // 'stress', 'sleep', 'focus', etc.
    language: string;         // 'fr-FR', 'en-US', etc.
    userId?: number;          // Pour la personnalisation
}

export interface SegmentPlan {
    id: string;
    type: 'intro' | 'breathing' | 'body_scan' | 'visualization' | 'conclusion';
    content: string;
    duration: number;         // en secondes
    priority: number;         // 1-5, importance du segment
    context: string;          // Contexte pour l'IA
}

export interface OptimizationDecision {
    action: 'reuse_exact' | 'reuse_similar' | 'create_new';
    confidence: number;       // 0-1, confiance dans la décision
    reasoning: string;        // Explication de la décision
    cachedSegment?: any;      // Segment trouvé si réutilisation
    similarity?: number;      // Score de similarité si applicable
    estimatedCost: number;    // Coût estimé de cette décision
    estimatedTime: number;    // Temps estimé de génération
}

export interface GenerationPlan {
    segments: SegmentPlan[];
    decisions: OptimizationDecision[];
    totalEstimatedCost: number;
    totalEstimatedTime: number;
    expectedQuality: number;
    optimizationScore: number; // Score global d'optimisation
}

export interface GenerationResult {
    success: boolean;
    audioUrl?: string;
    actualCost: number;
    actualTime: number;
    actualQuality: number;
    segmentsReused: number;
    segmentsCreated: number;
    optimizationAchieved: number; // % d'optimisation réelle
    errors?: string[];
}

/**
 * Agent IA Principal - Orchestrateur de l'intelligence
 */
export class MeditationAIAgent {
    private metrics: {
        totalRequests: number;
        totalCostSaved: number;
        totalTimeSaved: number;
        averageQuality: number;
        reuseRate: number;
    } = {
        totalRequests: 0,
        totalCostSaved: 0,
        totalTimeSaved: 0,
        averageQuality: 0,
        reuseRate: 0,
    };

    /**
     * Point d'entrée principal : Génère une méditation optimisée
     */
    async generateOptimizedMeditation(request: MeditationRequest): Promise<GenerationResult> {
        console.log('🧠 Agent IA démarré pour:', request.prompt);
        const startTime = Date.now();

        try {
            // Étape 1: Analyser et planifier
            const plan = await this.createGenerationPlan(request);
            console.log(`📋 Plan créé: ${plan.segments.length} segments, optimisation ${plan.optimizationScore.toFixed(1)}/5`);

            // Étape 2: Exécuter le plan
            const result = await this.executePlan(plan, request);
            
            // Étape 3: Mettre à jour les métriques
            await this.updateMetrics(result);
            
            result.actualTime = Date.now() - startTime;
            console.log(`✅ Méditation générée en ${result.actualTime}ms`);
            
            return result;

        } catch (error) {
            console.error('❌ Erreur Agent IA:', error);
            return {
                success: false,
                actualCost: 0,
                actualTime: Date.now() - startTime,
                actualQuality: 0,
                segmentsReused: 0,
                segmentsCreated: 0,
                optimizationAchieved: 0,
                errors: [error instanceof Error ? error.message : 'Erreur inconnue']
            };
        }
    }

    /**
     * Étape 1: Créer un plan de génération optimisé
     */
    private async createGenerationPlan(request: MeditationRequest): Promise<GenerationPlan> {
        console.log('📝 Création du plan de génération...');

        // 1. Parser la demande en segments
        const segments = await this.parseRequestToSegments(request);
        console.log(`🧩 ${segments.length} segments identifiés`);

        // 2. Pour chaque segment, décider de la stratégie optimale
        const decisions: OptimizationDecision[] = [];
        let totalCost = 0;
        let totalTime = 0;

        for (const segment of segments) {
            const decision = await this.makeOptimizationDecision(segment, request);
            decisions.push(decision);
            totalCost += decision.estimatedCost;
            totalTime += decision.estimatedTime;
            
            console.log(`⚙️ Segment "${segment.type}": ${decision.action} (${(decision.confidence * 100).toFixed(1)}% confiance)`);
        }

        // 3. Calculer le score d'optimisation global
        const reuseRate = decisions.filter(d => d.action !== 'create_new').length / decisions.length;
        const optimizationScore = this.calculateOptimizationScore(decisions, reuseRate);

        return {
            segments,
            decisions,
            totalEstimatedCost: totalCost,
            totalEstimatedTime: totalTime,
            expectedQuality: this.estimateQuality(decisions),
            optimizationScore
        };
    }

    /**
     * Parser intelligent : Convertit une demande en segments structurés
     */
    private async parseRequestToSegments(request: MeditationRequest): Promise<SegmentPlan[]> {
        const segments: SegmentPlan[] = [];
        const totalDuration = request.duration * 60; // Convertir en secondes

        // Template de base selon l'objectif
        const template = this.selectTemplate(request.goal, request.duration);
        
        // Générer les segments selon le template
        let currentTime = 0;
        for (const templateSegment of template) {
            const duration = Math.round(totalDuration * templateSegment.percentage);
            
            segments.push({
                id: `${templateSegment.type}_${currentTime}`,
                type: templateSegment.type,
                content: this.generateSegmentContent(templateSegment, request),
                duration,
                priority: templateSegment.priority,
                context: `${request.goal}_${request.duration}min_${templateSegment.type}`
            });
            
            currentTime += duration;
        }

        return segments;
    }

    /**
     * Prendre une décision d'optimisation pour un segment
     */
    private async makeOptimizationDecision(
        segment: SegmentPlan, 
        request: MeditationRequest
    ): Promise<OptimizationDecision> {
        
        // 1. Rechercher dans le cache (exact + sémantique)
        const cacheResult = await findBestCachedSegment(
            segment.content,
            this.getVoiceId(request.voiceGender),
            request.voiceStyle,
            {
                useSemanticSearch: true,
                semanticThreshold: AI_CONFIG.mediumSimilarityThreshold,
                language: request.language
            }
        );

        // 2. Analyser les résultats et prendre une décision
        if (cacheResult.recommendation === 'use_exact') {
            return {
                action: 'reuse_exact',
                confidence: 0.95,
                reasoning: 'Correspondance exacte trouvée dans le cache',
                cachedSegment: cacheResult.exact,
                similarity: 1.0,
                estimatedCost: 0,
                estimatedTime: 100 // Temps minimal pour récupération
            };
        }

        if (cacheResult.recommendation === 'use_similar' && cacheResult.similar.length > 0) {
            const bestMatch = cacheResult.similar[0];
            if (bestMatch && bestMatch.similarity >= AI_CONFIG.highSimilarityThreshold) {
                return {
                    action: 'reuse_similar',
                    confidence: bestMatch.similarity,
                    reasoning: `Segment similaire trouvé (${(bestMatch.similarity * 100).toFixed(1)}% similarité)`,
                    cachedSegment: bestMatch.segment,
                    similarity: bestMatch.similarity,
                    estimatedCost: this.estimateAdjustmentCost(bestMatch.similarity),
                    estimatedTime: 500 // Temps pour ajustement mineur
                };
            }
        }

        // 3. Décision de création
        return {
            action: 'create_new',
            confidence: 0.8,
            reasoning: 'Aucun segment approprié trouvé, création nécessaire',
            estimatedCost: this.estimateCreationCost(segment.content.length),
            estimatedTime: this.estimateCreationTime(segment.duration)
        };
    }

    /**
     * Exécuter le plan de génération
     */
    private async executePlan(plan: GenerationPlan, request: MeditationRequest): Promise<GenerationResult> {
        console.log('🎬 Exécution du plan de génération...');
        
        const audioSegments: string[] = [];
        let actualCost = 0;
        let segmentsReused = 0;
        let segmentsCreated = 0;
        const errors: string[] = [];

        for (let i = 0; i < plan.segments.length; i++) {
            const segment = plan.segments[i];
            const decision = plan.decisions[i];
            
            if (!segment || !decision) continue;

            try {
                let audioUrl: string;

                switch (decision.action) {
                    case 'reuse_exact':
                        audioUrl = decision.cachedSegment?.audioUrl;
                        segmentsReused++;
                        console.log(`♻️ Réutilisation exacte: ${segment.type}`);
                        break;

                    case 'reuse_similar':
                        audioUrl = decision.cachedSegment?.audioUrl;
                        segmentsReused++;
                        console.log(`🔄 Réutilisation similaire: ${segment.type} (${(decision.similarity! * 100).toFixed(1)}%)`);
                        break;

                    case 'create_new':
                        audioUrl = await this.createNewSegment(segment, request);
                        segmentsCreated++;
                        actualCost += decision.estimatedCost;
                        console.log(`🆕 Nouveau segment créé: ${segment.type}`);
                        break;

                    default:
                        throw new Error(`Action inconnue: ${decision.action}`);
                }

                if (audioUrl) {
                    audioSegments.push(audioUrl);
                } else {
                    errors.push(`Échec génération segment ${segment.type}`);
                }

            } catch (error) {
                console.error(`❌ Erreur segment ${segment.type}:`, error);
                errors.push(`Erreur ${segment.type}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
        }

        // Assembler l'audio final (placeholder pour maintenant)
        const finalAudioUrl = await this.assembleAudio(audioSegments);

        return {
            success: errors.length === 0,
            audioUrl: finalAudioUrl,
            actualCost,
            actualTime: 0, // Sera mis à jour par l'appelant
            actualQuality: this.calculateActualQuality(segmentsReused, segmentsCreated),
            segmentsReused,
            segmentsCreated,
            optimizationAchieved: segmentsReused / (segmentsReused + segmentsCreated),
            errors: errors.length > 0 ? errors : undefined
        };
    }

    // === MÉTHODES UTILITAIRES ===

    private selectTemplate(goal: string, duration: number) {
        // Template de base - sera enrichi plus tard
        return [
            { type: 'intro' as const, percentage: 0.15, priority: 5 },
            { type: 'breathing' as const, percentage: 0.25, priority: 4 },
            { type: 'body_scan' as const, percentage: 0.35, priority: 3 },
            { type: 'visualization' as const, percentage: 0.20, priority: 2 },
            { type: 'conclusion' as const, percentage: 0.05, priority: 5 }
        ];
    }

    private generateSegmentContent(templateSegment: any, request: MeditationRequest): string {
        // Génération de contenu basique - sera enrichie plus tard
        const baseContent = {
            intro: `Installez-vous confortablement pour cette méditation de ${request.duration} minutes`,
            breathing: "Prenez une profonde inspiration, puis expirez lentement",
            body_scan: "Portez votre attention sur votre corps, en commençant par le sommet de votre tête",
            visualization: "Imaginez-vous dans un lieu paisible et sécurisant",
            conclusion: "Revenez doucement à l'instant présent"
        };
        
        return baseContent[templateSegment.type as keyof typeof baseContent] || "Contenu de méditation";
    }

    private getVoiceId(gender: 'male' | 'female'): string {
        return gender === 'female' ? 'g6xIsTj2HwM6VR4iXFCw' : 'GUDYcgRAONiI1nXDcNQQ';
    }

    private estimateAdjustmentCost(similarity: number): number {
        // Coût proportionnel à la différence
        return (1 - similarity) * 0.1; // Max 0.1$ pour ajustement
    }

    private estimateCreationCost(textLength: number): number {
        // Estimation basée sur la longueur du texte
        return Math.max(0.05, textLength * 0.001); // Min 0.05$, +0.001$ par caractère
    }

    private estimateCreationTime(duration: number): number {
        // Temps proportionnel à la durée audio
        return duration * 100; // 100ms par seconde d'audio
    }

    private calculateOptimizationScore(decisions: OptimizationDecision[], reuseRate: number): number {
        const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
        return (reuseRate * 3 + avgConfidence * 2) / 2; // Score sur 5
    }

    private estimateQuality(decisions: OptimizationDecision[]): number {
        // Qualité basée sur la confiance et le type de décision
        return decisions.reduce((sum, d) => {
            let score = d.confidence;
            if (d.action === 'reuse_exact') score *= 1.1; // Bonus réutilisation exacte
            if (d.action === 'create_new') score *= 0.9;  // Malus création (incertitude)
            return sum + Math.min(5, score * 5);
        }, 0) / decisions.length;
    }

    private async createNewSegment(segment: SegmentPlan, request: MeditationRequest): Promise<string> {
        // Placeholder - sera implémenté avec l'intégration TTS
        console.log(`🎤 Création TTS pour: "${segment.content.substring(0, 50)}..."`);
        
        // Simuler la création et sauvegarde
        const mockAudioUrl = `https://mock-audio-${segment.id}.mp3`;
        
        // Sauvegarder dans le cache pour la prochaine fois
        await saveAudioSegmentToCache(
            segment.content,
            this.getVoiceId(request.voiceGender),
            request.voiceGender,
            request.voiceStyle,
            mockAudioUrl,
            segment.duration * 1000, // Convertir en ms
            undefined,
            request.language
        );
        
        return mockAudioUrl;
    }

    private async assembleAudio(audioSegments: string[]): Promise<string> {
        // Placeholder - sera implémenté avec FFmpeg
        console.log(`🎵 Assemblage de ${audioSegments.length} segments audio`);
        return `https://assembled-meditation-${Date.now()}.mp3`;
    }

    private calculateActualQuality(reused: number, created: number): number {
        // Qualité basée sur le ratio de réutilisation
        const total = reused + created;
        if (total === 0) return 0;
        return 3.5 + (reused / total) * 1.5; // Base 3.5, bonus jusqu'à 5
    }

    private async updateMetrics(result: GenerationResult): Promise<void> {
        this.metrics.totalRequests++;
        this.metrics.totalCostSaved += result.optimizationAchieved * result.actualCost;
        this.metrics.reuseRate = (this.metrics.reuseRate * (this.metrics.totalRequests - 1) + result.optimizationAchieved) / this.metrics.totalRequests;
        this.metrics.averageQuality = (this.metrics.averageQuality * (this.metrics.totalRequests - 1) + result.actualQuality) / this.metrics.totalRequests;
    }

    /**
     * Obtenir les métriques de performance
     */
    public getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Réinitialiser les métriques
     */
    public resetMetrics(): void {
        this.metrics = {
            totalRequests: 0,
            totalCostSaved: 0,
            totalTimeSaved: 0,
            averageQuality: 0,
            reuseRate: 0,
        };
    }
}

/**
 * Instance singleton de l'Agent IA
 */
export const meditationAI = new MeditationAIAgent();