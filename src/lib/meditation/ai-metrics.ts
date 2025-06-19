import { db } from '~/server/db';
import { meditationHistory } from '~/server/db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';

/**
 * Types pour les métriques de performance
 */
export interface PerformanceMetrics {
    // Métriques de génération
    totalRequests: number;
    successRate: number;
    averageGenerationTime: number;
    averageQualityScore: number;
    
    // Métriques d'optimisation
    cacheHitRate: number;
    averageCostSaving: number;
    averageTimeSaving: number;
    segmentReuseRate: number;
    
    // Métriques par objectif
    goalDistribution: Record<string, number>;
    goalPerformance: Record<string, {
        avgTime: number;
        avgQuality: number;
        successRate: number;
    }>;
    
    // Métriques temporelles
    requestsPerHour: number;
    peakUsageHours: number[];
    
    // Métriques de qualité
    userSatisfactionScore: number;
    audioQualityScore: number;
    contentRelevanceScore: number;
}

export interface OptimizationEvent {
    timestamp: Date;
    requestId: string;
    userId?: number;
    goal: string;
    duration: number;
    
    // Métriques de performance
    generationTime: number;
    totalCost: number;
    qualityScore: number;
    
    // Métriques d'optimisation
    segmentsTotal: number;
    segmentsReused: number;
    segmentsCreated: number;
    cacheHitRate: number;
    
    // Métriques de décision
    decisions: {
        reuse_exact: number;
        reuse_similar: number;
        create_new: number;
    };
    
    // Résultat final
    success: boolean;
    errors?: string[];
}

export interface TrendAnalysis {
    period: 'hour' | 'day' | 'week' | 'month';
    metrics: {
        requests: { current: number; previous: number; change: number };
        quality: { current: number; previous: number; change: number };
        efficiency: { current: number; previous: number; change: number };
        costs: { current: number; previous: number; change: number };
    };
    insights: string[];
    recommendations: string[];
}

/**
 * Gestionnaire de Métriques IA - Tracking et Analyse des Performances
 */
export class AIMetricsManager {
    private events: OptimizationEvent[] = [];
    private readonly maxEventsInMemory = 1000;
    
    /**
     * Enregistrer un événement d'optimisation
     */
    async recordOptimizationEvent(event: OptimizationEvent): Promise<void> {
        // Ajouter à la mémoire
        this.events.push(event);
        
        // Limiter la taille en mémoire
        if (this.events.length > this.maxEventsInMemory) {
            this.events = this.events.slice(-this.maxEventsInMemory);
        }
        
        // Persister en base de données (optionnel, pour l'historique long terme)
        try {
            await this.persistEvent(event);
        } catch (error) {
            console.warn('Erreur persistence métriques:', error);
        }
        
        console.log(`📊 Métrique enregistrée: ${event.goal} - ${event.generationTime}ms - ${event.segmentsReused}/${event.segmentsTotal} réutilisés`);
    }
    
    /**
     * Calculer les métriques de performance actuelles
     */
    getPerformanceMetrics(timeRange?: { start: Date; end: Date }): PerformanceMetrics {
        const filteredEvents = this.filterEventsByTimeRange(this.events, timeRange);
        
        if (filteredEvents.length === 0) {
            return this.getEmptyMetrics();
        }
        
        const successfulEvents = filteredEvents.filter(e => e.success);
        const totalRequests = filteredEvents.length;
        const successRate = successfulEvents.length / totalRequests;
        
        // Métriques de génération
        const avgGenerationTime = this.calculateAverage(successfulEvents, 'generationTime');
        const avgQualityScore = this.calculateAverage(successfulEvents, 'qualityScore');
        
        // Métriques d'optimisation
        const cacheHitRate = this.calculateAverage(filteredEvents, 'cacheHitRate');
        const avgCostSaving = this.calculateCostSaving(filteredEvents);
        const avgTimeSaving = this.calculateTimeSaving(filteredEvents);
        const segmentReuseRate = this.calculateSegmentReuseRate(filteredEvents);
        
        // Distribution par objectif
        const goalDistribution = this.calculateGoalDistribution(filteredEvents);
        const goalPerformance = this.calculateGoalPerformance(filteredEvents);
        
        // Métriques temporelles
        const requestsPerHour = this.calculateRequestsPerHour(filteredEvents);
        const peakUsageHours = this.calculatePeakUsageHours(filteredEvents);
        
        // Scores de qualité
        const userSatisfactionScore = this.calculateUserSatisfaction(successfulEvents);
        const audioQualityScore = this.calculateAudioQuality(successfulEvents);
        const contentRelevanceScore = this.calculateContentRelevance(successfulEvents);
        
        return {
            totalRequests,
            successRate,
            averageGenerationTime: avgGenerationTime,
            averageQualityScore: avgQualityScore,
            cacheHitRate,
            averageCostSaving: avgCostSaving,
            averageTimeSaving: avgTimeSaving,
            segmentReuseRate,
            goalDistribution,
            goalPerformance,
            requestsPerHour,
            peakUsageHours,
            userSatisfactionScore,
            audioQualityScore,
            contentRelevanceScore
        };
    }
    
    /**
     * Analyser les tendances sur différentes périodes
     */
    async analyzeTrends(period: 'hour' | 'day' | 'week' | 'month'): Promise<TrendAnalysis> {
        const now = new Date();
        const { currentPeriod, previousPeriod } = this.getPeriodRanges(now, period);
        
        const currentMetrics = this.getPerformanceMetrics(currentPeriod);
        const previousMetrics = this.getPerformanceMetrics(previousPeriod);
        
        const metrics = {
            requests: {
                current: currentMetrics.totalRequests,
                previous: previousMetrics.totalRequests,
                change: this.calculateChange(currentMetrics.totalRequests, previousMetrics.totalRequests)
            },
            quality: {
                current: currentMetrics.averageQualityScore,
                previous: previousMetrics.averageQualityScore,
                change: this.calculateChange(currentMetrics.averageQualityScore, previousMetrics.averageQualityScore)
            },
            efficiency: {
                current: currentMetrics.segmentReuseRate,
                previous: previousMetrics.segmentReuseRate,
                change: this.calculateChange(currentMetrics.segmentReuseRate, previousMetrics.segmentReuseRate)
            },
            costs: {
                current: currentMetrics.averageCostSaving,
                previous: previousMetrics.averageCostSaving,
                change: this.calculateChange(currentMetrics.averageCostSaving, previousMetrics.averageCostSaving)
            }
        };
        
        const insights = this.generateInsights(metrics, period);
        const recommendations = this.generateRecommendations(metrics, currentMetrics);
        
        return { period, metrics, insights, recommendations };
    }
    
    /**
     * Obtenir un rapport détaillé des performances
     */
    async getDetailedReport(timeRange?: { start: Date; end: Date }): Promise<{
        summary: PerformanceMetrics;
        trends: TrendAnalysis;
        topPerformers: {
            goals: Array<{ goal: string; performance: number }>;
            users: Array<{ userId: number; performance: number }>;
        };
        bottlenecks: Array<{ area: string; impact: number; suggestion: string }>;
        predictions: Array<{ metric: string; predicted: number; confidence: number }>;
    }> {
        const summary = this.getPerformanceMetrics(timeRange);
        const trends = await this.analyzeTrends('day');
        
        const topPerformers = {
            goals: this.identifyTopPerformingGoals(),
            users: this.identifyTopPerformingUsers()
        };
        
        const bottlenecks = this.identifyBottlenecks(summary);
        const predictions = this.generatePredictions(summary, trends);
        
        return {
            summary,
            trends,
            topPerformers,
            bottlenecks,
            predictions
        };
    }
    
    // === MÉTHODES UTILITAIRES ===
    
    private async persistEvent(event: OptimizationEvent): Promise<void> {
        // Sauvegarder dans meditation_history avec des métadonnées étendues
        const metadata = {
            ai_optimization: {
                generationTime: event.generationTime,
                totalCost: event.totalCost,
                qualityScore: event.qualityScore,
                segmentsTotal: event.segmentsTotal,
                segmentsReused: event.segmentsReused,
                segmentsCreated: event.segmentsCreated,
                cacheHitRate: event.cacheHitRate,
                decisions: event.decisions,
                success: event.success,
                errors: event.errors
            }
        };
        
        // Note: Adaptation nécessaire selon le schéma final de meditation_history
        // await db.insert(meditationHistory).values({
        //     userId: event.userId,
        //     content: `Méditation ${event.goal} - ${event.duration}min`,
        //     duration: event.duration * 60 * 1000, // Convertir en ms
        //     metadata: JSON.stringify(metadata),
        //     createdAt: event.timestamp
        // });
    }
    
    private filterEventsByTimeRange(events: OptimizationEvent[], timeRange?: { start: Date; end: Date }): OptimizationEvent[] {
        if (!timeRange) return events;
        
        return events.filter(event => 
            event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
        );
    }
    
    private calculateAverage(events: OptimizationEvent[], field: keyof OptimizationEvent): number {
        if (events.length === 0) return 0;
        
        const sum = events.reduce((acc, event) => {
            const value = event[field];
            return acc + (typeof value === 'number' ? value : 0);
        }, 0);
        
        return sum / events.length;
    }
    
    private calculateCostSaving(events: OptimizationEvent[]): number {
        if (events.length === 0) return 0;
        
        return events.reduce((acc, event) => {
            const reuseRate = event.segmentsReused / event.segmentsTotal;
            const estimatedSaving = event.totalCost * reuseRate * 0.6; // 60% économie sur segments réutilisés
            return acc + estimatedSaving;
        }, 0) / events.length;
    }
    
    private calculateTimeSaving(events: OptimizationEvent[]): number {
        if (events.length === 0) return 0;
        
        return events.reduce((acc, event) => {
            const reuseRate = event.segmentsReused / event.segmentsTotal;
            const estimatedSaving = event.generationTime * reuseRate * 0.8; // 80% économie temps sur segments réutilisés
            return acc + estimatedSaving;
        }, 0) / events.length;
    }
    
    private calculateSegmentReuseRate(events: OptimizationEvent[]): number {
        if (events.length === 0) return 0;
        
        const totalSegments = events.reduce((acc, event) => acc + event.segmentsTotal, 0);
        const reusedSegments = events.reduce((acc, event) => acc + event.segmentsReused, 0);
        
        return totalSegments > 0 ? reusedSegments / totalSegments : 0;
    }
    
    private calculateGoalDistribution(events: OptimizationEvent[]): Record<string, number> {
        const distribution: Record<string, number> = {};
        
        events.forEach(event => {
            distribution[event.goal] = (distribution[event.goal] || 0) + 1;
        });
        
        return distribution;
    }
    
    private calculateGoalPerformance(events: OptimizationEvent[]): Record<string, { avgTime: number; avgQuality: number; successRate: number }> {
        const performance: Record<string, { avgTime: number; avgQuality: number; successRate: number }> = {};
        
        const goalGroups = events.reduce((acc, event) => {
            if (!acc[event.goal]) acc[event.goal] = [];
            acc[event.goal]!.push(event);
            return acc;
        }, {} as Record<string, OptimizationEvent[]>);
        
        for (const [goal, goalEvents] of Object.entries(goalGroups)) {
            const successfulEvents = goalEvents.filter(e => e.success);
            
            performance[goal] = {
                avgTime: this.calculateAverage(successfulEvents, 'generationTime'),
                avgQuality: this.calculateAverage(successfulEvents, 'qualityScore'),
                successRate: successfulEvents.length / goalEvents.length
            };
        }
        
        return performance;
    }
    
    private calculateRequestsPerHour(events: OptimizationEvent[]): number {
        if (events.length === 0) return 0;
        
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const recentEvents = events.filter(e => e.timestamp >= oneHourAgo);
        
        return recentEvents.length;
    }
    
    private calculatePeakUsageHours(events: OptimizationEvent[]): number[] {
        const hourlyDistribution: Record<number, number> = {};
        
        events.forEach(event => {
            const hour = event.timestamp.getHours();
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        });
        
        const sortedHours = Object.entries(hourlyDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        return sortedHours;
    }
    
    private calculateUserSatisfaction(events: OptimizationEvent[]): number {
        // Score basé sur le succès et la qualité
        if (events.length === 0) return 0;
        
        const avgQuality = this.calculateAverage(events, 'qualityScore');
        const successRate = events.filter(e => e.success).length / events.length;
        
        return (avgQuality * 0.7 + successRate * 5 * 0.3); // Score sur 5
    }
    
    private calculateAudioQuality(events: OptimizationEvent[]): number {
        // Score basé sur la réutilisation et la cohérence
        const reuseRate = this.calculateSegmentReuseRate(events);
        const avgQuality = this.calculateAverage(events, 'qualityScore');
        
        return (reuseRate * 2 + avgQuality * 0.8); // Score sur 5
    }
    
    private calculateContentRelevance(events: OptimizationEvent[]): number {
        // Score basé sur la pertinence des décisions d'optimisation
        if (events.length === 0) return 0;
        
        const totalDecisions = events.reduce((acc, event) => 
            acc + event.decisions.reuse_exact + event.decisions.reuse_similar + event.decisions.create_new, 0
        );
        
        const smartDecisions = events.reduce((acc, event) => 
            acc + event.decisions.reuse_exact * 1.0 + event.decisions.reuse_similar * 0.8 + event.decisions.create_new * 0.6, 0
        );
        
        return totalDecisions > 0 ? (smartDecisions / totalDecisions) * 5 : 0; // Score sur 5
    }
    
    private getPeriodRanges(now: Date, period: 'hour' | 'day' | 'week' | 'month') {
        const ranges = {
            hour: { current: 1, previous: 2 },
            day: { current: 24, previous: 48 },
            week: { current: 24 * 7, previous: 24 * 14 },
            month: { current: 24 * 30, previous: 24 * 60 }
        };
        
        const { current, previous } = ranges[period];
        
        return {
            currentPeriod: {
                start: new Date(now.getTime() - current * 60 * 60 * 1000),
                end: now
            },
            previousPeriod: {
                start: new Date(now.getTime() - previous * 60 * 60 * 1000),
                end: new Date(now.getTime() - current * 60 * 60 * 1000)
            }
        };
    }
    
    private calculateChange(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }
    
    private generateInsights(metrics: any, period: string): string[] {
        const insights: string[] = [];
        
        if (metrics.requests.change > 20) {
            insights.push(`📈 Forte augmentation du trafic (+${metrics.requests.change.toFixed(1)}%) sur la dernière ${period}`);
        }
        
        if (metrics.quality.change > 10) {
            insights.push(`⭐ Amélioration significative de la qualité (+${metrics.quality.change.toFixed(1)}%)`);
        }
        
        if (metrics.efficiency.change > 15) {
            insights.push(`🚀 Optimisation remarquable (+${metrics.efficiency.change.toFixed(1)}% de réutilisation)`);
        }
        
        if (metrics.costs.change > 25) {
            insights.push(`💰 Excellentes économies réalisées (+${metrics.costs.change.toFixed(1)}% d'économies)`);
        }
        
        return insights;
    }
    
    private generateRecommendations(metrics: any, currentMetrics: PerformanceMetrics): string[] {
        const recommendations: string[] = [];
        
        if (currentMetrics.cacheHitRate < 0.6) {
            recommendations.push("🎯 Améliorer le cache : taux de réutilisation faible, enrichir la base de segments");
        }
        
        if (currentMetrics.averageGenerationTime > 15000) {
            recommendations.push("⚡ Optimiser les temps de génération : considérer plus d'optimisations");
        }
        
        if (currentMetrics.successRate < 0.95) {
            recommendations.push("🔧 Améliorer la robustesse : taux d'échec élevé, renforcer la gestion d'erreurs");
        }
        
        if (currentMetrics.averageQualityScore < 4.0) {
            recommendations.push("🎨 Améliorer la qualité : scores faibles, revoir les templates et contenus");
        }
        
        return recommendations;
    }
    
    private identifyTopPerformingGoals(): Array<{ goal: string; performance: number }> {
        const events = this.events.filter(e => e.success);
        const goalPerformance = this.calculateGoalPerformance(events);
        
        return Object.entries(goalPerformance)
            .map(([goal, perf]) => ({
                goal,
                performance: (perf.avgQuality * 0.4 + (1 - perf.avgTime / 20000) * 0.3 + perf.successRate * 0.3) * 100
            }))
            .sort((a, b) => b.performance - a.performance)
            .slice(0, 5);
    }
    
    private identifyTopPerformingUsers(): Array<{ userId: number; performance: number }> {
        const userEvents = this.events.reduce((acc, event) => {
            if (event.userId) {
                if (!acc[event.userId]) acc[event.userId] = [];
                acc[event.userId]!.push(event);
            }
            return acc;
        }, {} as Record<number, OptimizationEvent[]>);
        
        return Object.entries(userEvents)
            .map(([userId, events]) => {
                const successRate = events.filter(e => e.success).length / events.length;
                const avgQuality = this.calculateAverage(events.filter(e => e.success), 'qualityScore');
                const performance = (successRate * 0.6 + avgQuality / 5 * 0.4) * 100;
                
                return { userId: parseInt(userId), performance };
            })
            .sort((a, b) => b.performance - a.performance)
            .slice(0, 10);
    }
    
    private identifyBottlenecks(metrics: PerformanceMetrics): Array<{ area: string; impact: number; suggestion: string }> {
        const bottlenecks: Array<{ area: string; impact: number; suggestion: string }> = [];
        
        if (metrics.cacheHitRate < 0.5) {
            bottlenecks.push({
                area: "Cache Performance",
                impact: (0.5 - metrics.cacheHitRate) * 100,
                suggestion: "Augmenter la base de segments cachés et améliorer l'algorithme de similarité"
            });
        }
        
        if (metrics.averageGenerationTime > 10000) {
            bottlenecks.push({
                area: "Generation Speed",
                impact: (metrics.averageGenerationTime - 10000) / 100,
                suggestion: "Optimiser les appels API et implémenter la génération parallèle"
            });
        }
        
        return bottlenecks.sort((a, b) => b.impact - a.impact);
    }
    
    private generatePredictions(summary: PerformanceMetrics, trends: TrendAnalysis): Array<{ metric: string; predicted: number; confidence: number }> {
        const predictions: Array<{ metric: string; predicted: number; confidence: number }> = [];
        
        // Prédiction simple basée sur les tendances
        if (trends.metrics.requests.change !== 0) {
            const predictedRequests = summary.totalRequests * (1 + trends.metrics.requests.change / 100);
            predictions.push({
                metric: "Requests Next Period",
                predicted: Math.round(predictedRequests),
                confidence: Math.min(0.8, Math.abs(trends.metrics.requests.change) / 50)
            });
        }
        
        if (trends.metrics.efficiency.change !== 0) {
            const predictedEfficiency = summary.segmentReuseRate * (1 + trends.metrics.efficiency.change / 100);
            predictions.push({
                metric: "Cache Hit Rate",
                predicted: Math.min(1, Math.max(0, predictedEfficiency)),
                confidence: 0.7
            });
        }
        
        return predictions;
    }
    
    private getEmptyMetrics(): PerformanceMetrics {
        return {
            totalRequests: 0,
            successRate: 0,
            averageGenerationTime: 0,
            averageQualityScore: 0,
            cacheHitRate: 0,
            averageCostSaving: 0,
            averageTimeSaving: 0,
            segmentReuseRate: 0,
            goalDistribution: {},
            goalPerformance: {},
            requestsPerHour: 0,
            peakUsageHours: [],
            userSatisfactionScore: 0,
            audioQualityScore: 0,
            contentRelevanceScore: 0
        };
    }
}

/**
 * Instance singleton du gestionnaire de métriques
 */
export const aiMetrics = new AIMetricsManager();