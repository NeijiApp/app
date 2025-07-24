import { openai } from '../services/openrouter';
import { z } from 'zod';
import { 
    saveAudioSegmentToCache,
    type SimilaritySearchResult 
} from './audio-cache';
import { findSimilarSegmentsByEmbedding } from './embeddings-service';
import { startMonitoring, getMonitor, stopMonitoring } from './pipeline-monitor';

// Context Analysis Schema
const ContextAnalysisSchema = z.object({
    primary_issue: z.string(),
    emotional_state: z.enum(['anxious', 'stressed', 'overwhelmed', 'restless', 'tired', 'scattered', 'angry', 'sad', 'excited', 'neutral']),
    intensity_level: z.enum(['low', 'moderate', 'high', 'severe']),
    time_context: z.enum(['morning', 'midday', 'evening', 'night', 'anytime']),
    physical_state: z.enum(['tense', 'relaxed', 'tired', 'energetic', 'uncomfortable', 'neutral']),
    mental_state: z.enum(['racing_thoughts', 'foggy', 'clear', 'scattered', 'hyperfocused', 'empty']),
    desired_outcome: z.string(),
    specific_triggers: z.array(z.string()),
    recommended_approach: z.enum(['calming', 'grounding', 'energizing', 'focusing', 'releasing', 'accepting'])
});

// Dynamic Protocol Schema
const MeditationProtocolSchema = z.object({
    protocol_name: z.string(),
    total_duration_minutes: z.number(),
    phases: z.array(z.object({
        phase_name: z.string(),
        purpose: z.string(),
        duration_percentage: z.number(),
        technique: z.string(),
        breathing_pattern: z.string().optional(),
        focus_target: z.string(),
        pause_after_seconds: z.number(),
        transition_method: z.string().optional()
    })),
    key_principles: z.array(z.string()),
    adaptation_notes: z.string()
});

// Generated Content Schema
const GeneratedContentSchema = z.object({
    segments: z.array(z.object({
        phase_name: z.string(),
        spoken_content: z.string(),
        guidance_notes: z.string(),
        duration_seconds: z.number(),
        pause_after_seconds: z.number(),
        voice_tone: z.enum(['gentle', 'firm', 'warm', 'neutral', 'encouraging', 'soothing']),
        pacing: z.enum(['slow', 'moderate', 'natural', 'deliberate'])
    })),
    overall_theme: z.string(),
    therapeutic_goals: z.array(z.string()),
    follow_up_suggestions: z.array(z.string())
});

type ContextAnalysis = z.infer<typeof ContextAnalysisSchema>;
type MeditationProtocol = z.infer<typeof MeditationProtocolSchema>;
type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

interface GenerationRequest {
    userPrompt: string;
    duration: number;
    voiceGender: 'male' | 'female';
    voiceStyle?: string;
    goal?: string;
    guidance?: string;
    guidanceLevel?: 'beginner' | 'confirmed' | 'expert';
    language: string;
}

// Helper: convert text with [pause X] tags into manifest segments
function parseSentencesWithPauses(raw: string): Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> {
    const parts: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [];
    // Split on [pause N]
    const regex = /\[pause\s+(\d+)\]/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
        const textPart = raw.slice(lastIndex, match.index).trim();
        if (textPart) {
            parts.push({ type: 'text', content: textPart });
        }
        const pauseSeconds = Number(match[1] ?? '0');
        if (!Number.isNaN(pauseSeconds) && pauseSeconds > 0) {
            parts.push({ type: 'pause', duration: pauseSeconds });
        }
        lastIndex = regex.lastIndex;
    }
    // Remaining text
    const tail = raw.slice(lastIndex).trim();
    if (tail) {
        parts.push({ type: 'text', content: tail });
    }
    return parts;
}

export class ContextualMeditationAgent {
    private similarityThreshold = 0.75; // Lowered for more lenient matching
    private model = 'openai/gpt-4o-mini'; // Better reasoning and context understanding

    async generateMeditation(request: GenerationRequest): Promise<{
        segments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }>;
        context: ContextAnalysis;
        protocol: MeditationProtocol;
        content: GeneratedContent;
        cost: number;
        reusedCount: number;
        generatedCount: number;
    }> {
        // Start monitoring
        const sessionId = `meditation_${Date.now()}`;
        const monitor = startMonitoring(sessionId);
        
        try {
            console.log('🧠 Contextual Meditation Agent starting...');
            console.log(`📝 Analyzing context: "${request.userPrompt}"`);
            
            // Step 1: Deep context analysis
            monitor.logStep('context_analysis', 'analyze_prompt', 'started');
            const context = await this.analyzeContext(request);
            monitor.logContextAnalysis(request.userPrompt, context);
            console.log(`🎯 Detected: ${context.primary_issue} (${context.emotional_state}, ${context.intensity_level} intensity)`);
            
            // Step 2: Generate custom protocol
            monitor.logStep('protocol_generation', 'create_custom_protocol', 'started');
            const protocol = await this.generateProtocol(context, request);
            monitor.logProtocolGeneration(context, protocol);
            console.log(`⚙️ Protocol: ${protocol.protocol_name} with ${protocol.phases.length} phases`);
            
            // Step 3: Generate contextual content
            monitor.logStep('content_generation', 'generate_therapeutic_content', 'started');
            const content = await this.generateContent(context, protocol, request);
            monitor.logContentGeneration(protocol, content);
            console.log(`📜 Generated ${content.segments.length} contextual segments`);
            
            // Step 4: Check for similar existing segments
            monitor.logStep('similarity_analysis', 'check_existing_segments', 'started');
            const matchedSegments = await this.findSimilarSegments(content.segments, request.voiceGender, request.voiceStyle || 'calm');
            monitor.logStep('similarity_analysis', 'check_existing_segments', 'completed');
            
            // Step 5: Build final output with sentence-level pauses
            monitor.logStep('audio_assembly', 'prepare_segments', 'started');
            const outputSegments: Array<{ type: 'text'; content: string } | { type: 'pause'; duration: number }> = [];
            let cost = 0.003; // Base cost for 3 AI calls
            let reusedCount = 0;
            let generatedCount = 0;

            for (const match of matchedSegments) {
                const parsed = parseSentencesWithPauses(match.segment.spoken_content);
                for (const seg of parsed) {
                    if (seg.type === 'text') {
                        // Similarity reuse check only for text segments
                        if (match.similarity >= this.similarityThreshold && match.cachedAudioUrl) {
                            reusedCount++;
                            monitor.logSimilarityCheck(seg.content, [], match.similarity, true);
                        } else {
                            generatedCount++;
                            cost += 0.002; // Estimated TTS cost
                            monitor.logSimilarityCheck(seg.content, [], match.similarity, false);
                        }
                    }
                    outputSegments.push(seg);
                }
            }
            monitor.logStep('audio_assembly', 'prepare_segments', 'completed');

            console.log(`✅ Contextual meditation ready: ${reusedCount} reused, ${generatedCount} new segments`);
            
            return {
                segments: outputSegments,
                context,
                protocol,
                content,
                cost,
                reusedCount,
                generatedCount
            };
        } finally {
            // Complete monitoring
            stopMonitoring();
        }
    }

    private async analyzeContext(request: GenerationRequest): Promise<ContextAnalysis> {
        const systemPrompt = `You are an expert meditation therapist and mindfulness coach. Analyze the user's request to understand their psychological and emotional state.

Extract key insights about:
- What specific issue they're facing
- Their current emotional and mental state
- The intensity of their distress
- Physical manifestations they might be experiencing
- The specific outcome they need
- Any triggers or patterns mentioned

Respond with ONLY a valid JSON object following this exact schema:
{
    "primary_issue": "Clear description of the main problem",
    "emotional_state": "anxious|stressed|overwhelmed|restless|tired|scattered|angry|sad|excited|neutral",
    "intensity_level": "low|moderate|high|severe", 
    "time_context": "morning|midday|evening|night|anytime",
    "physical_state": "tense|relaxed|tired|energetic|uncomfortable|neutral",
    "mental_state": "racing_thoughts|foggy|clear|scattered|hyperfocused|empty",
    "desired_outcome": "What they want to achieve",
    "specific_triggers": ["trigger1", "trigger2"],
    "recommended_approach": "calming|grounding|energizing|focusing|releasing|accepting"
}`;

        const userPrompt = `Analyze this meditation request: "${request.userPrompt}"

Duration requested: ${request.duration} minutes
Experience level: ${request.guidanceLevel}

Provide deep psychological insight into their state and needs.`;

        try {
            const response = await openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3, // Lower for more consistent analysis
                max_tokens: 800
            });

            if ('choices' in response && response.choices[0]) {
                const content = response.choices[0].message?.content;
                if (!content) throw new Error('No analysis generated');

                // Log the AI call
                const monitor = getMonitor();
                if (monitor) {
                    monitor.logAICall('context_analysis', this.model, userPrompt, content, 0.001, 400);
                }

                const cleanedContent = this.extractJSON(content);
                const parsed = JSON.parse(cleanedContent);
                return ContextAnalysisSchema.parse(parsed);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Context analysis failed:', error);
            return this.createFallbackContext(request);
        }
    }

    private async generateProtocol(context: ContextAnalysis, request: GenerationRequest): Promise<MeditationProtocol> {
        const systemPrompt = `You are a meditation protocol designer. Create a custom meditation structure specifically for the user's situation.

Design a protocol that:
- Directly addresses their specific issue and state
- Uses appropriate techniques for their condition
- Adjusts timing based on their needs
- Follows evidence-based therapeutic approaches
- Adapts to their experience level

Respond with ONLY a valid JSON object:
{
    "protocol_name": "Descriptive name for this protocol",
    "total_duration_minutes": number,
    "phases": [
        {
            "phase_name": "Clear phase name",
            "purpose": "Why this phase helps their specific situation", 
            "duration_percentage": number (0-1, all phases should sum to 1.0),
            "technique": "Specific technique used",
            "breathing_pattern": "Optional breathing instruction",
            "focus_target": "What to focus attention on",
            "pause_after_seconds": number,
            "transition_method": "How to move to next phase"
        }
    ],
    "key_principles": ["principle1", "principle2"],
    "adaptation_notes": "How this protocol specifically helps their situation"
}`;

        const userPrompt = `Create a protocol for this context:

Primary Issue: ${context.primary_issue}
Emotional State: ${context.emotional_state} (${context.intensity_level} intensity)
Mental State: ${context.mental_state}
Physical State: ${context.physical_state}
Desired Outcome: ${context.desired_outcome}
Recommended Approach: ${context.recommended_approach}
Duration: ${request.duration} minutes
Experience Level: ${request.guidanceLevel}
Triggers: ${context.specific_triggers.join(', ')}

Design a protocol that specifically addresses "${context.primary_issue}" using "${context.recommended_approach}" techniques.`;

        try {
            const response = await openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7, // Allow some creativity
                max_tokens: 1200
            });

            if ('choices' in response && response.choices[0]) {
                const content = response.choices[0].message?.content;
                if (!content) throw new Error('No protocol generated');

                const cleanedContent = this.extractJSON(content);
                const parsed = JSON.parse(cleanedContent);
                return MeditationProtocolSchema.parse(parsed);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Protocol generation failed:', error);
            return this.createFallbackProtocol(context, request);
        }
    }

    private async generateContent(context: ContextAnalysis, protocol: MeditationProtocol, request: GenerationRequest): Promise<GeneratedContent> {
        const systemPrompt = `You are a meditation guide writing personalized scripts. Create specific spoken content for each phase of the protocol.

Guidelines:
- Speak directly to their specific situation and feelings
- Use language that resonates with their emotional state
- Be therapeutic and evidence-based
- Adjust tone and pacing for their needs
- Include specific techniques mentioned in the protocol
- Make transitions natural and supportive

Respond with ONLY a valid JSON object:
{
    "segments": [
        {
            "phase_name": "Phase name from protocol",
            "spoken_content": "Actual words to be spoken (2-4 sentences)",
            "guidance_notes": "Internal notes about delivery",
            "duration_seconds": number,
            "pause_after_seconds": number,
            "voice_tone": "gentle|firm|warm|neutral|encouraging|soothing",
            "pacing": "slow|moderate|natural|deliberate"
        }
    ],
    "overall_theme": "Central therapeutic theme",
    "therapeutic_goals": ["goal1", "goal2"],
    "follow_up_suggestions": ["suggestion1", "suggestion2"]
}`;

        const userPrompt = `
Create meditation content for this context:

Primary Issue: ${context.primary_issue}
Emotional State: ${context.emotional_state}
Intensity: ${context.intensity_level}
User's Words: "${request.userPrompt}"

Protocol to implement:
${JSON.stringify(protocol, null, 2)}

Duration: ${request.duration} minutes
Voice: ${request.voiceGender}

Generate specific, personalized content for each phase that directly addresses their ${context.primary_issue} with ${context.emotional_state} at ${context.intensity_level} intensity.`;

        try {
            const response = await openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8, // More creative for content
                max_tokens: 2000
            });

            if ('choices' in response && response.choices[0]) {
                const content = response.choices[0].message?.content;
                if (!content) throw new Error('No content generated');

                // Log the AI call if monitor exists
                const monitor = getMonitor();
                if (monitor) {
                    monitor.logAICall('content_generation', this.model, userPrompt, content, 0.001, 800);
                }

                const cleanedContent = this.extractJSON(content);
                const parsed = JSON.parse(cleanedContent);
                return GeneratedContentSchema.parse(parsed);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Content generation failed:', error);
            return this.createFallbackContent(context, protocol, request);
        }
    }

    private async findSimilarSegments(
        segments: GeneratedContent['segments'],
        voiceGender: 'male' | 'female',
        voiceStyle: string
    ): Promise<Array<{
        segment: GeneratedContent['segments'][0];
        similarity: number;
        cachedAudioUrl?: string;
        cachedSegmentId?: string;
    }>> {
        const matches: Array<{
            segment: GeneratedContent['segments'][0];
            similarity: number;
            cachedAudioUrl?: string;
            cachedSegmentId?: string;
        }> = [];

        const voiceId = voiceGender === 'female' ? 'g6xIsTj2HwM6VR4iXFCw' : 'onwK4e9ZLuTAKqWW03F9';
        for (const segment of segments) {
            // Search for similar segments
            const similar = await findSimilarSegmentsByEmbedding(
                segment.spoken_content,
                voiceId,
                voiceStyle,
                {
                    limit: 5,
                    threshold: this.similarityThreshold
                }
            );

            // Find best match
            let bestMatch: SimilaritySearchResult | null = null;
            let bestSimilarity = 0;

            for (const result of similar) {
                if (result.similarity > bestSimilarity) {
                    bestMatch = result;
                    bestSimilarity = result.similarity;
                }
            }

            matches.push({
                segment,
                similarity: bestSimilarity,
                cachedAudioUrl: bestMatch?.segment.audioUrl || undefined,
                cachedSegmentId: bestMatch?.segment.id?.toString()
            });
        }

        return matches;
    }

    private extractJSON(content: string): string {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return jsonMatch[0];
        }
        
        // If no JSON found, try to clean the content
        const cleaned = content
            .replace(/^```json\s*/, '')
            .replace(/```\s*$/, '')
            .replace(/^```\s*/, '')
            .trim();
        
        return cleaned;
    }

    private createFallbackContext(request: GenerationRequest): ContextAnalysis {
        // Simple keyword-based analysis
        const prompt = request.userPrompt.toLowerCase();
        
        let primaryIssue = 'general_stress';
        let emotionalState: ContextAnalysis['emotional_state'] = 'neutral';
        let intensity: ContextAnalysis['intensity_level'] = 'moderate';
        
        if (prompt.includes('racing') || prompt.includes('thoughts')) {
            primaryIssue = 'racing_thoughts';
            emotionalState = 'anxious';
            intensity = 'high';
        } else if (prompt.includes('sleep') || prompt.includes('insomnia')) {
            primaryIssue = 'sleep_difficulty';
            emotionalState = 'tired';
            intensity = 'moderate';
        } else if (prompt.includes('anxious') || prompt.includes('anxiety')) {
            primaryIssue = 'anxiety';
            emotionalState = 'anxious';
            intensity = 'high';
        }
        
        return {
            primary_issue: primaryIssue,
            emotional_state: emotionalState,
            physical_state: 'neutral',
            mental_state: prompt.includes('racing') ? 'racing_thoughts' : 'scattered',
            intensity_level: intensity,
            time_context: 'anytime',
            specific_triggers: [],
            desired_outcome: 'calm',
            recommended_approach: 'calming'
        };
    }

    private createFallbackProtocol(context: ContextAnalysis, request: GenerationRequest): MeditationProtocol {
        const duration = request.duration; // Already in minutes
        const phases: MeditationProtocol['phases'] = [
            {
                phase_name: 'Grounding',
                purpose: 'Establish presence and safety',
                duration_percentage: 0.2,
                technique: 'breathing',
                focus_target: 'breath awareness',
                pause_after_seconds: 3,
                breathing_pattern: '4-4-4 breathing'
            },
            {
                phase_name: 'Deepening',
                purpose: 'Address the primary issue',
                duration_percentage: 0.4,
                technique: 'progressive_relaxation',
                focus_target: context.primary_issue,
                pause_after_seconds: 5
            },
            {
                phase_name: 'Integration',
                purpose: 'Cultivate inner peace',
                duration_percentage: 0.3,
                technique: 'mindfulness',
                focus_target: 'inner calm',
                pause_after_seconds: 4
            },
            {
                phase_name: 'Closing',
                purpose: 'Gentle return to awareness',
                duration_percentage: 0.1,
                technique: 'grounding',
                focus_target: 'present moment',
                pause_after_seconds: 0
            }
        ];
        
        return {
            protocol_name: `${context.primary_issue} Relief Protocol`,
            total_duration_minutes: duration,
            phases,
            key_principles: ['gentleness', 'acceptance', 'presence'],
            adaptation_notes: 'Adjust pacing based on user response'
        };
    }

    private createFallbackContent(context: ContextAnalysis, protocol: MeditationProtocol, request: GenerationRequest): GeneratedContent {
        const totalSeconds = protocol.total_duration_minutes * 60;
        const segments: GeneratedContent['segments'] = protocol.phases.map(phase => ({
            phase_name: phase.phase_name,
            spoken_content: this.generateFallbackText(phase.phase_name, context),
            guidance_notes: `Deliver with ${phase.focus_target.toLowerCase()}`,
            duration_seconds: Math.floor(totalSeconds * phase.duration_percentage * 0.7), // Leave time for pauses
            pause_after_seconds: phase.pause_after_seconds,
            voice_tone: 'gentle' as const,
            pacing: 'slow' as const
        }));
        
        return {
            segments,
            overall_theme: `${context.primary_issue} relief through mindfulness`,
            therapeutic_goals: ['reduce_stress', 'increase_awareness'],
            follow_up_suggestions: ['practice_daily', 'journal_experience']
        };
    }

    private generateFallbackText(phaseName: string, context: ContextAnalysis): string {
        const texts: Record<string, string> = {
            'Grounding': 'Take a moment to settle into this space. Notice your breath naturally flowing in and out. Allow yourself to simply be present with whatever you\'re experiencing right now.',
            'Deepening': 'As you continue to breathe, begin to release any tension you\'re holding. With each exhale, let go a little more. You are safe here in this moment.',
            'Integration': 'Feel the sense of calm that\'s available to you. This peace is always within you, ready to be accessed whenever you need it.',
            'Closing': 'Begin to gently return your awareness to your surroundings. Take this sense of calm with you as you open your eyes when you\'re ready.'
        };
        
        return texts[phaseName] || 'Continue to breathe and rest in awareness.';
    }
}