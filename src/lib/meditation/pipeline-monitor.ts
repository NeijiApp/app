import { performance } from 'perf_hooks';

export interface PipelineStep {
    step: string;
    substep?: string;
    status: 'started' | 'completed' | 'failed';
    timestamp: number;
    duration?: number;
    data?: any;
    cost?: number;
    tokens?: number;
    similarity?: number;
    cached?: boolean;
}

export interface PipelineMetrics {
    totalCost: number;
    totalTokens: number;
    cacheHits: number;
    cacheMisses: number;
    totalDuration: number;
    aiCalls: number;
    ttsCalls: number;
}

export class MeditationPipelineMonitor {
    private steps: PipelineStep[] = [];
    private startTime: number;
    private metrics: PipelineMetrics = {
        totalCost: 0,
        totalTokens: 0,
        cacheHits: 0,
        cacheMisses: 0,
        totalDuration: 0,
        aiCalls: 0,
        ttsCalls: 0
    };

    constructor(private sessionId: string) {
        this.startTime = performance.now();
        this.logStep('session', undefined, 'started', { sessionId });
    }

    logStep(step: string, substep: string | undefined, status: 'started' | 'completed' | 'failed', data?: any) {
        const timestamp = performance.now();
        const stepData: PipelineStep = {
            step,
            substep,
            status,
            timestamp,
            data
        };

        // Calculate duration if completing a step
        if (status === 'completed') {
            const startStep = this.steps.find(s => 
                s.step === step && 
                s.substep === substep && 
                s.status === 'started'
            );
            if (startStep) {
                stepData.duration = timestamp - startStep.timestamp;
            }
        }

        this.steps.push(stepData);
        this.updateMetrics(stepData);
        this.printStep(stepData);
    }

    logAICall(step: string, model: string, prompt: string, response: string, cost: number, tokens: number) {
        this.metrics.aiCalls++;
        this.metrics.totalCost += cost;
        this.metrics.totalTokens += tokens;
        
        this.logStep('ai_call', step, 'completed', {
            model,
            promptLength: prompt.length,
            responseLength: response.length,
            cost,
            tokens
        });
    }

    logSimilarityCheck(text: string, results: any[], bestSimilarity: number, cached: boolean) {
        if (cached) {
            this.metrics.cacheHits++;
        } else {
            this.metrics.cacheMisses++;
        }

        this.logStep('similarity_check', undefined, 'completed', {
            textLength: text.length,
            resultsCount: results.length,
            bestSimilarity,
            cached,
            decision: cached ? 'REUSE' : 'GENERATE'
        });
    }

    logTTSCall(text: string, voiceId: string, duration: number, cost: number, cached: boolean) {
        this.metrics.ttsCalls++;
        if (!cached) {
            this.metrics.totalCost += cost;
        }

        this.logStep('tts_call', undefined, 'completed', {
            textLength: text.length,
            voiceId,
            duration,
            cost: cached ? 0 : cost,
            cached
        });
    }

    logContextAnalysis(userPrompt: string, detectedContext: any) {
        this.logStep('context_analysis', 'analyze_prompt', 'completed', {
            promptLength: userPrompt.length,
            detectedIssue: detectedContext.primary_issue,
            emotionalState: detectedContext.emotional_state,
            intensity: detectedContext.intensity_level,
            approach: detectedContext.recommended_approach
        });
    }

    logProtocolGeneration(context: any, protocol: any) {
        this.logStep('protocol_generation', 'create_custom_protocol', 'completed', {
            protocolName: protocol.protocol_name,
            phasesCount: protocol.phases.length,
            totalDuration: protocol.total_duration_minutes,
            keyPrinciples: protocol.key_principles.length
        });
    }

    logContentGeneration(protocol: any, content: any) {
        const segments = content?.segments || [];
        this.logStep('content_generation', 'generate_therapeutic_content', 'completed', {
            segmentsCount: segments.length,
            theme: content?.overall_theme || 'Unknown',
            therapeuticGoals: content?.therapeutic_goals?.length || 0,
            avgSegmentLength: segments.length > 0 
                ? segments.reduce((sum: number, seg: any) => sum + (seg?.spoken_content?.length || 0), 0) / segments.length
                : 0
        });
    }

    complete() {
        const totalTime = performance.now() - this.startTime;
        this.metrics.totalDuration = totalTime;
        
        this.logStep('session', undefined, 'completed', {
            totalSteps: this.steps.length,
            metrics: this.metrics
        });

        this.printSummary();
    }

    private updateMetrics(step: PipelineStep) {
        if (step.data?.cost) {
            this.metrics.totalCost += step.data.cost;
        }
        if (step.data?.tokens) {
            this.metrics.totalTokens += step.data.tokens;
        }
    }

    private printStep(step: PipelineStep) {
        const timestamp = new Date(Date.now() - performance.now() + (step.timestamp || 0)).toISOString().split('T')[1]?.split('.')[0] || '00:00:00';
        const duration = step.duration ? `(${Math.round(step.duration)}ms)` : '';
        
        let icon = '';
        let color = '';
        
        switch (step.step) {
            case 'session': icon = '🚀'; break;
            case 'context_analysis': icon = '🧠'; break;
            case 'protocol_generation': icon = '⚙️'; break;
            case 'content_generation': icon = '📝'; break;
            case 'similarity_check': icon = step.data?.cached ? '♻️' : '🔍'; break;
            case 'ai_call': icon = '🤖'; break;
            case 'tts_call': icon = step.data?.cached ? '🎵' : '🎙️'; break;
            case 'audio_assembly': icon = '🔧'; break;
            default: icon = '📊';
        }

        // Status formatting
        switch (step.status) {
            case 'started': color = '\x1b[33m'; break; // Yellow
            case 'completed': color = '\x1b[32m'; break; // Green
            case 'failed': color = '\x1b[31m'; break; // Red
        }

        const resetColor = '\x1b[0m';
        const stepName = step.substep ? `${step.step}:${step.substep}` : step.step;
        
        console.log(`${color}[${timestamp}] ${icon} ${stepName.toUpperCase()} ${step.status.toUpperCase()} ${duration}${resetColor}`);
        
        // Print relevant data
        if (step.data && step.status === 'completed') {
            this.printStepData(step);
        }
    }

    private printStepData(step: PipelineStep) {
        const indent = '    ';
        
        switch (step.step) {
            case 'context_analysis':
                console.log(`${indent}📋 Issue: ${step.data.detectedIssue}`);
                console.log(`${indent}😰 State: ${step.data.emotionalState} (${step.data.intensity})`);
                console.log(`${indent}🎯 Approach: ${step.data.approach}`);
                break;
                
            case 'protocol_generation':
                console.log(`${indent}📜 Protocol: ${step.data.protocolName}`);
                console.log(`${indent}⏱️ Duration: ${step.data.totalDuration}min with ${step.data.phasesCount} phases`);
                break;
                
            case 'content_generation':
                console.log(`${indent}🎭 Theme: ${step.data.theme}`);
                console.log(`${indent}📝 Generated ${step.data.segmentsCount} segments (avg ${Math.round(step.data.avgSegmentLength)} chars)`);
                break;
                
            case 'similarity_check':
                const similarity = (step.data.bestSimilarity * 100).toFixed(1);
                console.log(`${indent}🔍 Found ${step.data.resultsCount} similar segments, best: ${similarity}%`);
                console.log(`${indent}🎯 Decision: ${step.data.decision} (${step.data.textLength} chars)`);
                break;
                
            case 'ai_call':
                console.log(`${indent}🤖 Model: ${step.data.model}`);
                console.log(`${indent}💰 Cost: $${step.data.cost.toFixed(4)} (${step.data.tokens} tokens)`);
                console.log(`${indent}📏 Input: ${step.data.promptLength} chars → Output: ${step.data.responseLength} chars`);
                break;
                
            case 'tts_call':
                const ttsStatus = step.data.cached ? 'CACHED' : 'GENERATED';
                console.log(`${indent}🎤 Voice: ${step.data.voiceId} (${ttsStatus})`);
                console.log(`${indent}⏱️ Duration: ${Math.round(step.data.duration/1000)}s`);
                if (!step.data.cached) {
                    console.log(`${indent}💰 TTS Cost: $${step.data.cost.toFixed(4)}`);
                }
                break;
        }
    }

    private printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 MEDITATION PIPELINE SUMMARY');
        console.log('='.repeat(80));
        
        const totalTime = (this.metrics.totalDuration / 1000).toFixed(2);
        
        console.log(`⏱️  Total Duration: ${totalTime}s`);
        console.log(`💰 Total Cost: $${this.metrics.totalCost.toFixed(4)}`);
        console.log(`🤖 AI Calls: ${this.metrics.aiCalls} (${this.metrics.totalTokens} tokens)`);
        console.log(`🎙️  TTS Calls: ${this.metrics.ttsCalls}`);
        console.log(`♻️  Cache Performance: ${this.metrics.cacheHits} hits, ${this.metrics.cacheMisses} misses`);
        
        const cacheRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0 
            ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(1)
            : '0';
        console.log(`📈 Cache Hit Rate: ${cacheRate}%`);
        
        console.log('\n🔄 PIPELINE BREAKDOWN:');
        const stepsByType = this.steps.reduce((acc, step) => {
            if (step.status === 'completed' && step.duration) {
                acc[step.step] = (acc[step.step] || 0) + step.duration;
            }
            return acc;
        }, {} as Record<string, number>);
        
        Object.entries(stepsByType).forEach(([stepType, totalDuration]) => {
            const percentage = ((totalDuration / this.metrics.totalDuration) * 100).toFixed(1);
            const seconds = (totalDuration / 1000).toFixed(2);
            console.log(`  ${stepType}: ${seconds}s (${percentage}%)`);
        });
        
        console.log('='.repeat(80));
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getSteps() {
        return [...this.steps];
    }
}

// Global monitor instance
let currentMonitor: MeditationPipelineMonitor | null = null;

export function startMonitoring(sessionId: string): MeditationPipelineMonitor {
    currentMonitor = new MeditationPipelineMonitor(sessionId);
    return currentMonitor;
}

export function getMonitor(): MeditationPipelineMonitor | null {
    return currentMonitor;
}

export function stopMonitoring() {
    if (currentMonitor) {
        currentMonitor.complete();
        currentMonitor = null;
    }
} 