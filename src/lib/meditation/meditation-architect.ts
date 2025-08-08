/**
 * Meditation Architect - Designs and generates complete meditation experiences
 * with precise timing and AI-generated content
 */

import type { 
  MeditationSpecification,
  TimedMeditationPlan,
  MeditationSegment 
} from './meditation-specification';
import { MEDITATION_CONFIG } from './meditation-specification';
import { timingCalculator, type TimingCalculation, type SegmentTiming } from './meditation-timing-calculator';

// Import AI service for content generation (we'll use OpenAI/Anthropic)
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface ContentGenerationPrompt {
  segmentType: MeditationSegment['type'];
  purpose: string;
  targetWordCount: number;
  context: {
    previousSegment?: string;
    overallTheme: string;
    userGoal: string;
    guidanceLevel: string;
    timeInMeditation: string; // "beginning", "middle", "end"
  };
  constraints: {
    includeBreathingCues?: boolean;
    visualizationElements?: string[];
    bodyParts?: string[]; // For body scan
    transitionNeeded?: boolean;
  };
}

export class MeditationArchitect {
  
  /**
   * Main entry point: Create complete meditation plan with AI-generated content
   */
  async createMeditationPlan(spec: MeditationSpecification): Promise<TimedMeditationPlan> {
    console.log(`🏗️ Creating meditation architecture for: "${spec.intent}"`);
    
    // Step 1: Calculate overall timing structure
    const timingCalc = timingCalculator.calculateOverallTiming(spec);
    const speechConfig = timingCalculator.getSpeechTimingConfig(spec);
    
    console.log(`⏱️ Timing: ${timingCalc.totalDurationSeconds}s total (${Math.round(timingCalc.targetSpeechTime)}s speech, ${Math.round(timingCalc.targetSilenceTime)}s silence)`);
    
    // Step 2: Design meditation flow structure
    const segmentPlan = this.designMeditationFlow(spec, timingCalc);
    
    // Step 3: Generate AI content for each segment with precise timing
    const segments = await this.generateSegmentContent(segmentPlan, spec, speechConfig);
    
    // Step 4: Validate and adjust timing
    const validation = timingCalculator.validateTiming(segments, spec);
    let finalSegments = segments;
    
    if (!validation.isValid) {
      console.warn(`⚠️ Timing adjustment needed. Variance: ${Math.round(validation.variance)}s`);
      finalSegments = await this.adjustTiming(segments, spec, validation.variance);
    }
    
    // Step 5: Calculate final metadata
    const metadata = this.calculateMetadata(finalSegments);
    
    const plan: TimedMeditationPlan = {
      specification: spec,
      totalDuration: spec.inferredDuration * 60,
      segments: finalSegments,
      timingValidation: {
        expectedTextTime: finalSegments.reduce((total, s) => total + s.estimatedSpeechTime, 0),
        expectedSilenceTime: finalSegments.reduce((total, s) => total + s.silenceAfter, 0),
        totalCalculated: finalSegments.reduce((total, s) => total + s.estimatedSpeechTime + s.silenceAfter, 0),
        silenceRatio: timingCalc.silenceRatio,
      },
      metadata,
    };
    
    console.log(`✅ Meditation plan created: ${plan.segments.length} segments, ${Math.round(plan.timingValidation.totalCalculated)}s total`);
    
    return plan;
  }

  /**
   * Design the overall meditation flow structure
   */
  private designMeditationFlow(
    spec: MeditationSpecification,
    timing: TimingCalculation
  ): Array<{
    type: MeditationSegment['type'];
    purpose: string;
    priority: number;
    allocatedSpeechTime: number;
    allocatedSilenceTime: number;
  }> {
    
    const segments: Array<{
      type: MeditationSegment['type'];
      purpose: string;
      priority: number;
      allocatedSpeechTime: number;
      allocatedSilenceTime: number;
    }> = [];

    // Base flow structure based on goal and duration
    const flow = this.selectMeditationFlow(spec);
    
    // Allocate time to each segment based on priority and flexibility
    const totalSegments = flow.length;
    const baseSpeechTime = timing.targetSpeechTime / totalSegments;
    const baseSilenceTime = timing.targetSilenceTime / totalSegments;
    
    for (const segment of flow) {
      // Adjust allocation based on segment importance and type
      const speechMultiplier = this.getSpeechTimeMultiplier(segment.type, spec);
      const silenceMultiplier = this.getSilenceTimeMultiplier(segment.type, spec);
      
      segments.push({
        ...segment,
        allocatedSpeechTime: baseSpeechTime * speechMultiplier,
        allocatedSilenceTime: baseSilenceTime * silenceMultiplier,
      });
    }

    // Normalize to ensure exact total time
    return this.normalizeTimeAllocations(segments, timing);
  }

  /**
   * Select appropriate meditation flow based on goal and duration
   */
  private selectMeditationFlow(spec: MeditationSpecification): Array<{
    type: MeditationSegment['type'];
    purpose: string;
    priority: number;
  }> {
    
    const duration = spec.inferredDuration;
    const goal = spec.goal;
    
    // Short meditation (≤5 minutes) - Essential only
    if (duration <= 5) {
      return [
        { type: 'intro' as const, purpose: 'Welcome and initial settling', priority: 5 },
        { type: 'breathing' as const, purpose: 'Core breathing practice', priority: 5 },
        { type: 'mindfulness' as const, purpose: 'Present moment awareness', priority: 4 },
        { type: 'closing' as const, purpose: 'Gentle return and closure', priority: 5 },
      ];
    }
    
    // Medium meditation (6-15 minutes) - Full experience
    if (duration <= 15) {
      const baseFlow: Array<{
        type: MeditationSegment['type'];
        purpose: string;
        priority: number;
      }> = [
        { type: 'intro' as const, purpose: 'Welcome and intention setting', priority: 5 },
        { type: 'settling' as const, purpose: 'Body and mind settling', priority: 4 },
        { type: 'breathing' as const, purpose: 'Breath awareness foundation', priority: 5 },
        { type: 'closing' as const, purpose: 'Integration and return', priority: 5 },
      ];

      // Add goal-specific middle segment
      if (goal === 'sleep') {
        baseFlow.splice(3, 0, { type: 'body_scan' as const, purpose: 'Progressive relaxation', priority: 5 });
      } else if (goal === 'focus') {
        baseFlow.splice(3, 0, { type: 'mindfulness' as const, purpose: 'Focused attention training', priority: 5 });
      } else if (goal === 'calm' || goal === 'stress') {
        baseFlow.splice(3, 0, { type: 'visualization' as const, purpose: 'Calming imagery', priority: 4 });
      }

      return baseFlow;
    }
    
    // Long meditation (16+ minutes) - Comprehensive journey
    return [
      { type: 'intro' as const, purpose: 'Welcome and deep intention setting', priority: 5 },
      { type: 'settling' as const, purpose: 'Complete body and mind preparation', priority: 4 },
      { type: 'breathing' as const, purpose: 'Foundational breath work', priority: 5 },
      { type: 'body_scan' as const, purpose: 'Systematic body awareness', priority: 4 },
      { type: 'visualization' as const, purpose: 'Transformative imagery', priority: 3 },
      { type: 'mindfulness' as const, purpose: 'Deep present moment practice', priority: 4 },
      { type: 'integration' as const, purpose: 'Insight integration', priority: 3 },
      { type: 'closing' as const, purpose: 'Complete return and dedication', priority: 5 },
    ];
  }

  /**
   * Generate AI content for each segment with precise timing constraints
   */
  private async generateSegmentContent(
    segmentPlan: Array<{
      type: MeditationSegment['type'];
      purpose: string;
      priority: number;
      allocatedSpeechTime: number;
      allocatedSilenceTime: number;
    }>,
    spec: MeditationSpecification,
    speechConfig: any
  ): Promise<MeditationSegment[]> {
    
    const segments: MeditationSegment[] = [];
    let segmentIndex = 0;
    
    for (const plan of segmentPlan) {
      segmentIndex++;
      
      console.log(`🤖 Generating AI content for ${plan.type} (${Math.round(plan.allocatedSpeechTime)}s speech)`);
      
      // Calculate target word count
      const targetWordCount = timingCalculator.calculateTargetWordCount(
        plan.allocatedSpeechTime,
        speechConfig,
        plan.type
      );
      
      // Create content generation prompt
      const prompt = this.createContentPrompt(plan, targetWordCount, spec, segmentIndex, segmentPlan.length);
      
      // Generate AI content
      const content = await this.generateAIContent(prompt);
      
      // Calculate actual timing
      const actualSpeechTime = timingCalculator.estimateSpeechTime(content, speechConfig);
      
      // Create segment with breathing cues if needed
      const segment: MeditationSegment = {
        id: `segment-${segmentIndex}`,
        type: plan.type,
        content,
        estimatedSpeechTime: actualSpeechTime,
        silenceAfter: plan.allocatedSilenceTime,
        purpose: plan.purpose,
        priority: plan.priority,
      };
      
      // Add breathing cues for breathing segments
      if (plan.type === 'breathing') {
        segment.breathingCues = this.createBreathingCues(plan.allocatedSilenceTime, spec);
      }
      
      segments.push(segment);
    }
    
    return segments;
  }

  /**
   * Create AI content generation prompt
   */
  private createContentPrompt(
    segment: { type: MeditationSegment['type']; purpose: string; allocatedSpeechTime: number; },
    targetWordCount: number,
    spec: MeditationSpecification,
    segmentIndex: number,
    totalSegments: number
  ): ContentGenerationPrompt {
    
    const timeInMeditation = segmentIndex === 1 ? 'beginning' : 
                            segmentIndex === totalSegments ? 'end' : 'middle';
    
    return {
      segmentType: segment.type,
      purpose: segment.purpose,
      targetWordCount,
      context: {
        overallTheme: spec.intent,
        userGoal: spec.goal,
        guidanceLevel: spec.guidanceLevel,
        timeInMeditation,
      },
      constraints: {
        includeBreathingCues: segment.type === 'breathing',
        visualizationElements: segment.type === 'visualization' ? this.getVisualizationElements(spec) : undefined,
        bodyParts: segment.type === 'body_scan' ? this.getBodyScanSequence(spec) : undefined,
        transitionNeeded: segmentIndex < totalSegments,
      },
    };
  }

  /**
   * Generate AI content using language model
   */
  private async generateAIContent(prompt: ContentGenerationPrompt): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(prompt);
    const userPrompt = this.buildUserPrompt(prompt);
    
    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxTokens: Math.min(prompt.targetWordCount * 2, 1000), // Rough token estimate
      });
      
      // Ensure content fits within word count (with small tolerance)
      return this.adjustContentLength(text, prompt.targetWordCount);
      
    } catch (error) {
      console.error('AI content generation failed:', error);
      
      // Fallback to template-based content
      return this.createFallbackContent(prompt);
    }
  }

  /**
   * Build system prompt for AI content generation
   */
  private buildSystemPrompt(prompt: ContentGenerationPrompt): string {
    return `You are an expert meditation guide creating personalized meditation content. 

Your role:
- Generate natural, flowing meditation guidance
- Speak directly to the meditator in second person ("you")
- Use calm, soothing, and encouraging language
- Create content that fits exactly within the specified word count
- Ensure smooth transitions between segments

Guidelines for ${prompt.context.guidanceLevel} level:
${prompt.context.guidanceLevel === 'beginner' 
  ? '- Provide detailed, clear instructions\n- Offer reassurance and encouragement\n- Explain techniques simply'
  : prompt.context.guidanceLevel === 'expert'
  ? '- Use minimal, precise instructions\n- Allow more space for self-guidance\n- Reference advanced concepts'
  : '- Balance instruction with independence\n- Provide moderate guidance\n- Trust the practitioner\'s experience'
}

Content must be exactly ${prompt.targetWordCount} words (+/- 10%). Never exceed this limit.`;
  }

  /**
   * Build user prompt for specific segment
   */
  private buildUserPrompt(prompt: ContentGenerationPrompt): string {
    let basePrompt = `Create meditation guidance for a ${prompt.segmentType} segment.

Purpose: ${prompt.purpose}
Goal: Help the user achieve ${prompt.context.userGoal}
Context: This is the ${prompt.context.timeInMeditation} of the meditation
Theme: ${prompt.context.overallTheme}

Target length: Exactly ${prompt.targetWordCount} words

Requirements:`;

    // Add segment-specific requirements
    if (prompt.constraints.includeBreathingCues) {
      basePrompt += '\n- Include specific breathing instructions (breathe in, breathe out)';
      basePrompt += '\n- Use phrases like "breathe in slowly" and "breathe out completely"';
      basePrompt += '\n- Leave natural pauses for breathing with phrases like "take a moment to breathe"';
    }

    if (prompt.constraints.visualizationElements) {
      basePrompt += `\n- Include visualization of: ${prompt.constraints.visualizationElements.join(', ')}`;
      basePrompt += '\n- Use vivid, calming imagery';
      basePrompt += '\n- Engage multiple senses in the visualization';
    }

    if (prompt.constraints.bodyParts) {
      basePrompt += `\n- Guide attention through: ${prompt.constraints.bodyParts.join(', ')}`;
      basePrompt += '\n- Use progressive relaxation techniques';
      basePrompt += '\n- Encourage release of tension';
    }

    if (prompt.constraints.transitionNeeded) {
      basePrompt += '\n- End with a smooth transition to the next part of the meditation';
    }

    return basePrompt;
  }

  /**
   * Helper methods
   */
  
  private getSpeechTimeMultiplier(type: MeditationSegment['type'], spec: MeditationSpecification): number {
    const multipliers: Record<MeditationSegment['type'], number> = {
      intro: spec.guidanceLevel === 'beginner' ? 1.3 : 0.8,
      settling: 1.0,
      breathing: 0.7, // Less talking, more doing
      body_scan: 1.2, // More detailed instructions
      visualization: 1.1, // Moderate instructions
      mindfulness: 0.9,
      integration: 1.0,
      closing: 1.0,
    };
    
    return multipliers[type] || 1.0;
  }

  private getSilenceTimeMultiplier(type: MeditationSegment['type'], spec: MeditationSpecification): number {
    const multipliers: Record<MeditationSegment['type'], number> = {
      intro: 0.5,
      settling: 1.0,
      breathing: 1.5, // More silence for breathing
      body_scan: 1.2,
      visualization: 1.3,
      mindfulness: 1.4,
      integration: 0.8,
      closing: 0.6,
    };
    
    return multipliers[type] || 1.0;
  }

  private normalizeTimeAllocations<T extends { allocatedSpeechTime: number; allocatedSilenceTime: number }>(
    segments: T[],
    timing: TimingCalculation
  ): T[] {
    // Calculate current totals
    const currentSpeechTotal = segments.reduce((sum, s) => sum + s.allocatedSpeechTime, 0);
    const currentSilenceTotal = segments.reduce((sum, s) => sum + s.allocatedSilenceTime, 0);
    
    // Calculate adjustment ratios
    const speechRatio = timing.targetSpeechTime / currentSpeechTotal;
    const silenceRatio = timing.targetSilenceTime / currentSilenceTotal;
    
    // Apply adjustments
    return segments.map(segment => ({
      ...segment,
      allocatedSpeechTime: segment.allocatedSpeechTime * speechRatio,
      allocatedSilenceTime: segment.allocatedSilenceTime * silenceRatio,
    }));
  }

  private createBreathingCues(silenceTime: number, spec: MeditationSpecification): MeditationSegment['breathingCues'] {
    const breathingTiming = timingCalculator.calculateBreathingTiming(
      spec.constraints.breathingStyle,
      Math.floor(silenceTime / 10) // Rough estimate of cycles
    );
    
    return {
      inhale: breathingTiming.pattern.inhale,
      hold: breathingTiming.pattern.hold,
      exhale: breathingTiming.pattern.exhale,
      pause: breathingTiming.pattern.pause,
    };
  }

  private getVisualizationElements(spec: MeditationSpecification): string[] {
    const goalElements = {
      calm: ['peaceful lake', 'gentle breeze', 'soft sunlight'],
      focus: ['clear mountain top', 'steady flame', 'bright light'],
      sleep: ['soft clouds', 'gentle rain', 'cozy nest'],
      energy: ['warm sun', 'flowing river', 'blooming flowers'],
      stress: ['releasing tensions', 'washing away worries', 'safe space'],
      anxiety: ['protective light', 'grounding earth', 'calm presence'],
      healing: ['warm healing light', 'nurturing energy', 'restoration'],
    };
    
    return goalElements[spec.goal] || goalElements.calm;
  }

  private getBodyScanSequence(spec: MeditationSpecification): string[] {
    if (spec.inferredDuration <= 8) {
      return ['feet', 'legs', 'torso', 'arms', 'shoulders', 'head'];
    }
    return ['toes', 'feet', 'ankles', 'calves', 'knees', 'thighs', 'hips', 'abdomen', 'chest', 'shoulders', 'arms', 'hands', 'neck', 'face', 'head'];
  }

  private adjustContentLength(content: string, targetWordCount: number): string {
    const words = content.trim().split(/\s+/);
    const currentCount = words.length;
    const tolerance = Math.ceil(targetWordCount * 0.1); // 10% tolerance
    
    if (Math.abs(currentCount - targetWordCount) <= tolerance) {
      return content;
    }
    
    if (currentCount > targetWordCount + tolerance) {
      // Trim content
      return words.slice(0, targetWordCount).join(' ') + '.';
    } else {
      // Content is too short - this should be handled by better prompting
      return content;
    }
  }

  private createFallbackContent(prompt: ContentGenerationPrompt): string {
    // Simple fallback content templates
    const templates = {
      intro: `Welcome to this meditation. Find a comfortable position and begin to settle in. Close your eyes gently and take a deep breath.`,
      settling: `Allow your body to relax and your mind to begin to quiet. Notice where you are and how you're feeling in this moment.`,
      breathing: `Turn your attention to your breath. Notice the natural rhythm of breathing in and breathing out. Follow each breath with gentle attention.`,
      body_scan: `Begin to notice your body. Starting with your feet, slowly move your attention up through your body, releasing any tension you find.`,
      visualization: `Imagine a peaceful place where you feel completely safe and relaxed. See this place clearly in your mind's eye.`,
      mindfulness: `Simply be present with whatever is here right now. Notice thoughts, feelings, and sensations without trying to change them.`,
      integration: `Take a moment to appreciate this time you've given yourself. Notice any insights or feelings that have emerged.`,
      closing: `Begin to bring your attention back to your surroundings. When you're ready, slowly open your eyes and carry this peace with you.`,
    };
    
    return templates[prompt.segmentType] || templates.mindfulness;
  }

  private async adjustTiming(
    segments: MeditationSegment[],
    spec: MeditationSpecification,
    variance: number
  ): Promise<MeditationSegment[]> {
    // Simple timing adjustment - modify silence periods
    const adjustmentPerSegment = variance / segments.length;
    
    return segments.map(segment => ({
      ...segment,
      silenceAfter: Math.max(0.5, segment.silenceAfter - adjustmentPerSegment),
    }));
  }

  private calculateMetadata(segments: MeditationSegment[]) {
    return {
      contentWordCount: segments.reduce((total, segment) => 
        total + segment.content.split(/\s+/).length, 0),
      estimatedComplexity: this.calculateComplexity(segments),
      breathingCycles: segments.filter(s => s.breathingCues).length,
      transitionPoints: segments.length - 1,
    };
  }

  private calculateComplexity(segments: MeditationSegment[]): number {
    // Calculate complexity based on segment types and content
    const complexityWeights = {
      intro: 1, settling: 2, breathing: 2, body_scan: 3,
      visualization: 4, mindfulness: 3, integration: 4, closing: 1,
    };
    
    const totalComplexity = segments.reduce((total, segment) => 
      total + (complexityWeights[segment.type] || 2), 0);
    
    return Math.min(5, Math.max(1, Math.round(totalComplexity / segments.length)));
  }
}

// Export singleton instance
export const meditationArchitect = new MeditationArchitect();
