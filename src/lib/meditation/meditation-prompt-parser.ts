/**
 * Intelligent prompt parser that analyzes user input and infers meditation parameters
 */

import type { 
  MeditationSpecification, 
  PromptAnalysis,
  ValidationResult 
} from './meditation-specification';
import { MEDITATION_CONFIG } from './meditation-specification';

export class MeditationPromptParser {
  
  /**
   * Main entry point: Parse user prompt and create complete meditation specification
   */
  async parsePrompt(
    prompt: string,
    explicitParams: Partial<MeditationSpecification> = {}
  ): Promise<MeditationSpecification> {
    
    // Step 1: Analyze the prompt for intent and context
    const analysis = await this.analyzePrompt(prompt);
    
    // Step 2: Infer missing parameters from analysis
    const inferredParams = this.inferParameters(analysis, explicitParams);
    
    // Step 3: Build complete specification
    const specification = this.buildSpecification(prompt, analysis, inferredParams, explicitParams);
    
    // Step 4: Validate and adjust if needed
    const validation = this.validateSpecification(specification);
    if (!validation.isValid) {
      console.warn('Specification validation issues:', validation.warnings);
      if (validation.suggestedAdjustments) {
        return this.applyAdjustments(specification, validation.suggestedAdjustments);
      }
    }
    
    return specification;
  }

  /**
   * Analyze prompt to extract keywords, emotional tone, and context
   */
  private async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Extract duration hints
    const durationKeywords = this.extractDurationKeywords(normalizedPrompt);
    
    // Extract goal/intent keywords
    const goalKeywords = this.extractGoalKeywords(normalizedPrompt);
    
    // Extract emotional tone
    const emotionalTone = this.detectEmotionalTone(normalizedPrompt);
    
    // Extract urgency level
    const urgencyLevel = this.detectUrgencyLevel(normalizedPrompt);
    
    // Extract specific techniques mentioned
    const techniques = this.extractTechniques(normalizedPrompt);
    
    // Extract contextual clues
    const situationalContext = this.extractSituationalContext(normalizedPrompt);
    
    // Calculate confidence based on specificity
    const confidenceScore = this.calculateConfidence(normalizedPrompt, goalKeywords, durationKeywords);

    return {
      extractedKeywords: [...goalKeywords, ...durationKeywords, ...techniques],
      emotionalTone,
      urgencyLevel,
      specificRequests: techniques,
      impliedContext: {
        situation: situationalContext,
        timeConstraints: this.hasTimeConstraints(normalizedPrompt),
        specificTechniques: techniques,
      },
      confidenceScore,
    };
  }

  /**
   * Extract duration-related keywords and phrases
   */
  private extractDurationKeywords(prompt: string): string[] {
    const durationPatterns = [
      // Explicit time mentions
      /(\d+)\s*(minute|min|hour|hr)s?/g,
      
      // Implicit duration hints
      /quick|fast|brief|short/g,
      /long|extended|deep|thorough/g,
      /standard|normal|regular/g,
    ];

    const matches: string[] = [];
    durationPatterns.forEach(pattern => {
      const found = prompt.match(pattern);
      if (found) matches.push(...found);
    });

    return matches;
  }

  /**
   * Extract goal and intent keywords
   */
  private extractGoalKeywords(prompt: string): string[] {
    const goalPatterns = {
      stress: /stress|tension|overwhelm|pressure|burden/g,
      anxiety: /anxiety|anxious|worry|nervous|panic|fear/g,
      sleep: /sleep|rest|bed|night|insomnia|tired/g,
      focus: /focus|concentration|attention|work|study|clarity/g,
      calm: /calm|peace|relax|tranquil|serenity|quiet/g,
      energy: /energy|energize|vitality|awake|alert/g,
      healing: /heal|recovery|pain|comfort|soothe/g,
    };

    const matches: string[] = [];
    Object.entries(goalPatterns).forEach(([goal, pattern]) => {
      if (pattern.test(prompt)) {
        matches.push(goal);
      }
    });

    return matches;
  }

  /**
   * Detect emotional tone from language patterns
   */
  private detectEmotionalTone(prompt: string): PromptAnalysis['emotionalTone'] {
    const tonePatterns = {
      stressed: /overwhelm|pressure|chaos|frantic|rush|burden/,
      anxious: /worry|fear|panic|nervous|uncertain|scared/,
      tired: /exhaust|drain|weary|fatigue|worn out|depleted/,
      energized: /energetic|motivated|excited|ready|pumped/,
      peaceful: /peace|calm|serene|tranquil|content/,
    };

    for (const [tone, pattern] of Object.entries(tonePatterns)) {
      if (pattern.test(prompt)) {
        return tone as PromptAnalysis['emotionalTone'];
      }
    }

    return 'neutral';
  }

  /**
   * Detect urgency level from language cues
   */
  private detectUrgencyLevel(prompt: string): PromptAnalysis['urgencyLevel'] {
    const urgencyPatterns = {
      high: /urgent|immediately|now|asap|emergency|crisis|desperate/,
      medium: /soon|today|need to|should|important/,
      low: /when possible|eventually|sometime|maybe|consider/,
    };

    for (const [level, pattern] of Object.entries(urgencyPatterns)) {
      if (pattern.test(prompt)) {
        return level as PromptAnalysis['urgencyLevel'];
      }
    }

    return 'medium'; // Default
  }

  /**
   * Extract specific meditation techniques mentioned
   */
  private extractTechniques(prompt: string): string[] {
    const techniques: string[] = [];
    
    const techniquePatterns = {
      'breathing': /breath|breathing|inhale|exhale/,
      'body scan': /body scan|body awareness|tension|muscles/,
      'visualization': /visualiz|imagine|picture|see yourself/,
      'mindfulness': /mindful|present|awareness|observe/,
      'mantra': /mantra|repeat|phrase|word/,
      'loving kindness': /loving|kindness|compassion|heart/,
      'walking': /walking|movement|steps/,
    };

    Object.entries(techniquePatterns).forEach(([technique, pattern]) => {
      if (pattern.test(prompt)) {
        techniques.push(technique);
      }
    });

    return techniques;
  }

  /**
   * Extract situational context clues
   */
  private extractSituationalContext(prompt: string): string | undefined {
    const contextPatterns = {
      'before work': /before work|morning routine|start day/,
      'after work': /after work|end of day|coming home/,
      'before sleep': /before bed|sleep|bedtime|night/,
      'break time': /break|lunch|pause|between/,
      'difficult day': /difficult|hard|tough|challenging day/,
      'stressful event': /meeting|presentation|exam|interview/,
    };

    for (const [context, pattern] of Object.entries(contextPatterns)) {
      if (pattern.test(prompt)) {
        return context;
      }
    }

    return undefined;
  }

  /**
   * Check if prompt indicates time constraints
   */
  private hasTimeConstraints(prompt: string): boolean {
    return /quick|fast|short|brief|only have|limited time|in a hurry/.test(prompt);
  }

  /**
   * Calculate confidence score based on prompt specificity
   */
  private calculateConfidence(
    prompt: string, 
    goalKeywords: string[], 
    durationKeywords: string[]
  ): number {
    let confidence = 0.3; // Base confidence
    
    // Length and detail
    if (prompt.length > 50) confidence += 0.2;
    if (prompt.length > 100) confidence += 0.2;
    
    // Specific goals mentioned
    confidence += goalKeywords.length * 0.1;
    
    // Duration specificity
    if (durationKeywords.length > 0) confidence += 0.2;
    
    // Specific techniques mentioned
    if (/breath|body|visual|mindful/.test(prompt)) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Infer missing parameters from prompt analysis
   */
  private inferParameters(
    analysis: PromptAnalysis,
    explicit: Partial<MeditationSpecification>
  ): Partial<MeditationSpecification> {
    const inferred: Partial<MeditationSpecification> = {};

    // Infer duration if not provided
    if (!explicit.inferredDuration) {
      inferred.inferredDuration = this.inferDuration(analysis);
    }

    // Infer guidance level
    if (!explicit.guidanceLevel) {
      inferred.guidanceLevel = this.inferGuidanceLevel(analysis);
    }

    // Infer goal
    if (!explicit.goal) {
      inferred.goal = this.inferGoal(analysis);
    }

    // Infer background preference
    if (!explicit.background) {
      inferred.background = this.inferBackground(analysis);
    }

    // Infer voice preferences
    if (!explicit.voicePreferences) {
      inferred.voicePreferences = this.inferVoicePreferences(analysis);
    }

    // Infer constraints
    inferred.constraints = this.inferConstraints(analysis, inferred.guidanceLevel);

    return inferred;
  }

  /**
   * Infer appropriate duration from analysis
   */
  private inferDuration(analysis: PromptAnalysis): number {
    // Check for explicit time mentions
    const timeMatch = analysis.extractedKeywords.find(k => /\d+\s*(min|hour)/.test(k));
    if (timeMatch) {
      const minutes = parseInt(timeMatch.match(/\d+/)?.[0] || '5');
      return Math.min(Math.max(minutes, 1), 60); // Clamp between 1-60 minutes
    }

    // Infer from urgency and context
    if (analysis.urgencyLevel === 'high' || analysis.impliedContext.timeConstraints) {
      return 3; // Quick session
    }

    if (analysis.emotionalTone === 'stressed' || analysis.emotionalTone === 'anxious') {
      return 8; // Moderate session for processing
    }

    const goal = this.inferGoal(analysis);
    if (goal === 'sleep') {
      return 15; // Longer for sleep preparation
    }

    if (analysis.extractedKeywords.some(k => /deep|extended|thorough/.test(k))) {
      return 20; // Extended session
    }

    if (analysis.extractedKeywords.some(k => /quick|brief|short/.test(k))) {
      return 5; // Quick session
    }

    return 10; // Default moderate session
  }

  /**
   * Infer guidance level from user language and context
   */
  private inferGuidanceLevel(analysis: PromptAnalysis): MeditationSpecification['guidanceLevel'] {
    // Check for experience indicators
    if (analysis.extractedKeywords.some(k => /beginner|new|first time|guide me/.test(k))) {
      return 'beginner';
    }

    if (analysis.extractedKeywords.some(k => /expert|advanced|minimal|less guidance/.test(k))) {
      return 'expert';
    }

    // Default to confirmed for most users
    return 'confirmed';
  }

  /**
   * Infer primary goal from analysis
   */
  private inferGoal(analysis: PromptAnalysis): MeditationSpecification['goal'] {
    const goalMapping = {
      stressed: 'calm' as const,
      anxious: 'calm' as const,
      tired: 'energy' as const,
      energized: 'focus' as const,
      peaceful: 'calm' as const,
    };

    if (analysis.emotionalTone in goalMapping) {
      return goalMapping[analysis.emotionalTone as keyof typeof goalMapping];
    }

    // Check extracted goal keywords
    if (analysis.extractedKeywords.includes('sleep')) return 'sleep';
    if (analysis.extractedKeywords.includes('focus')) return 'focus';
    if (analysis.extractedKeywords.includes('stress')) return 'stress';
    if (analysis.extractedKeywords.includes('anxiety')) return 'anxiety';

    return 'calm'; // Default
  }

  /**
   * Infer background preference
   */
  private inferBackground(analysis: PromptAnalysis): MeditationSpecification['background'] {
    const goal = this.inferGoal(analysis);
    if (goal === 'sleep') return 'rain';
    if (goal === 'focus') return 'focus';
    if (analysis.extractedKeywords.includes('nature')) return 'nature';
    
    return 'silence'; // Clean default for most meditations
  }

  /**
   * Infer voice preferences
   */
  private inferVoicePreferences(analysis: PromptAnalysis): MeditationSpecification['voicePreferences'] {
    return {
      gender: 'female', // Default to calm female voice
      style: this.inferVoiceStyle(analysis),
    };
  }

  private inferVoiceStyle(analysis: PromptAnalysis): MeditationSpecification['voicePreferences']['style'] {
    const goal = this.inferGoal(analysis);
    if (analysis.emotionalTone === 'energized' || goal === 'energy') return 'energetic';
    if (goal === 'focus') return 'focused';
    return 'calm'; // Default soothing style
  }

  /**
   * Infer constraints based on guidance level and context
   */
  private inferConstraints(
    analysis: PromptAnalysis,
    guidanceLevel?: MeditationSpecification['guidanceLevel']
  ): MeditationSpecification['constraints'] {
    const level = guidanceLevel || 'confirmed';
    const rules = MEDITATION_CONFIG.GUIDANCE_RULES[level];

    return {
      maxSilence: rules.maxSilenceRatio,
      breathingStyle: this.inferBreathingStyle(analysis),
      instructionDensity: rules.explanationDetail as 'minimal' | 'moderate' | 'detailed',
      pacePreference: this.inferPacePreference(analysis),
    };
  }

  private inferBreathingStyle(analysis: PromptAnalysis): MeditationSpecification['constraints']['breathingStyle'] {
    if (analysis.emotionalTone === 'stressed' || analysis.emotionalTone === 'anxious') return 'deep';
    if (analysis.emotionalTone === 'energized') return 'energizing';
    return 'natural';
  }

  private inferPacePreference(analysis: PromptAnalysis): MeditationSpecification['constraints']['pacePreference'] {
    const goal = this.inferGoal(analysis);
    if (analysis.urgencyLevel === 'high') return 'dynamic';
    if (goal === 'sleep') return 'slow';
    return 'medium';
  }

  /**
   * Build complete specification from all inputs
   */
  private buildSpecification(
    originalPrompt: string,
    analysis: PromptAnalysis,
    inferred: Partial<MeditationSpecification>,
    explicit: Partial<MeditationSpecification>
  ): MeditationSpecification {
    return {
      originalPrompt,
      intent: analysis.extractedKeywords.join(', ') || 'general meditation',
      inferredDuration: explicit.inferredDuration || inferred.inferredDuration || 10,
      guidanceLevel: explicit.guidanceLevel || inferred.guidanceLevel || 'confirmed',
      goal: explicit.goal || inferred.goal || 'calm',
      mood: analysis.emotionalTone,
      background: explicit.background || inferred.background || 'silence',
      voicePreferences: explicit.voicePreferences || inferred.voicePreferences || {
        gender: 'female',
        style: 'calm',
      },
      constraints: {
        ...inferred.constraints,
        ...explicit.constraints,
      } as MeditationSpecification['constraints'],
      personalContext: {
        timeOfDay: this.inferTimeOfDay(),
        energyLevel: this.mapEmotionalToneToEnergy(analysis.emotionalTone),
        stressLevel: this.mapEmotionalToneToStress(analysis.emotionalTone),
        experience: this.mapGuidanceLevelToExperience(inferred.guidanceLevel || 'confirmed'),
      },
    };
  }

  /**
   * Validation helpers
   */
  private validateSpecification(spec: MeditationSpecification): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Duration validation
    if (spec.inferredDuration < 1) {
      errors.push('Duration must be at least 1 minute');
    }
    if (spec.inferredDuration > 60) {
      warnings.push('Very long meditation (>60min) - consider breaking into sessions');
    }

    // Consistency checks
    if (spec.goal === 'energy' && spec.constraints.pacePreference === 'slow') {
      warnings.push('Energy goal with slow pace may be inconsistent');
    }

    if (spec.goal === 'sleep' && spec.constraints.pacePreference === 'dynamic') {
      warnings.push('Sleep goal with dynamic pace may be inconsistent');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply suggested adjustments
   */
  private applyAdjustments(
    spec: MeditationSpecification,
    adjustments: ValidationResult['suggestedAdjustments']
  ): MeditationSpecification {
    return {
      ...spec,
      ...adjustments,
    };
  }

  /**
   * Helper inference methods
   */
  private inferTimeOfDay(): NonNullable<MeditationSpecification['personalContext']>['timeOfDay'] {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  private mapEmotionalToneToEnergy(tone: PromptAnalysis['emotionalTone']): NonNullable<MeditationSpecification['personalContext']>['energyLevel'] {
    const mapping = {
      energized: 'high',
      neutral: 'medium',
      peaceful: 'medium',
      tired: 'low',
      stressed: 'medium',
      anxious: 'low',
    } as const;

    return mapping[tone] || 'medium';
  }

  private mapEmotionalToneToStress(tone: PromptAnalysis['emotionalTone']): NonNullable<MeditationSpecification['personalContext']>['stressLevel'] {
    const mapping = {
      stressed: 'high',
      anxious: 'high',
      tired: 'medium',
      energized: 'low',
      peaceful: 'low',
      neutral: 'medium',
    } as const;

    return mapping[tone] || 'medium';
  }

  private mapGuidanceLevelToExperience(level: MeditationSpecification['guidanceLevel']): NonNullable<MeditationSpecification['personalContext']>['experience'] {
    const mapping = {
      beginner: 'new',
      confirmed: 'regular',
      expert: 'advanced',
    } as const;

    return mapping[level];
  }
}

// Export singleton instance
export const meditationPromptParser = new MeditationPromptParser();
