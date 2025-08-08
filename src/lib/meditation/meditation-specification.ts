/**
 * Core data structures for the AI-driven meditation generation system
 */

export interface MeditationSpecification {
  // Parsed from user input
  intent: string; // What user wants to achieve
  originalPrompt: string; // Original user input
  inferredDuration: number; // In minutes, deduced if not provided
  guidanceLevel: 'beginner' | 'confirmed' | 'expert';
  goal: 'calm' | 'focus' | 'sleep' | 'energy' | 'healing' | 'stress' | 'anxiety';
  mood: string; // Emotional context from prompt
  background: 'silence' | 'nature' | 'ambient' | 'waves' | 'rain' | 'focus' | 'relax';
  voicePreferences: {
    gender: 'male' | 'female';
    style: 'calm' | 'energetic' | 'soothing' | 'focused';
  };
  constraints: {
    maxSilence: number; // Max silence ratio based on guidance (0.3-0.7)
    breathingStyle: 'deep' | 'gentle' | 'natural' | 'energizing';
    instructionDensity: 'minimal' | 'moderate' | 'detailed';
    pacePreference: 'slow' | 'medium' | 'dynamic';
  };
  personalContext?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    energyLevel?: 'low' | 'medium' | 'high';
    stressLevel?: 'low' | 'medium' | 'high';
    experience?: 'new' | 'regular' | 'advanced';
  };
}

export interface TimedMeditationPlan {
  specification: MeditationSpecification;
  totalDuration: number; // Exact duration in seconds
  segments: MeditationSegment[];
  timingValidation: {
    expectedTextTime: number; // Total speech time
    expectedSilenceTime: number; // Total pause time
    totalCalculated: number; // Should match totalDuration
    silenceRatio: number; // Percentage of silence vs speech
  };
  metadata: {
    contentWordCount: number;
    estimatedComplexity: number; // 1-5 scale
    breathingCycles: number;
    transitionPoints: number;
  };
}

export interface MeditationSegment {
  id: string;
  type: 'intro' | 'settling' | 'breathing' | 'body_scan' | 'visualization' | 'mindfulness' | 'integration' | 'closing';
  content: string; // AI-generated text
  estimatedSpeechTime: number; // Calculated based on word count and speech rate
  silenceAfter: number; // Calculated pause duration in seconds
  purpose: string; // Why this segment exists in the meditation
  breathingCues?: {
    inhale: number; // Duration in seconds
    hold?: number; // Optional hold duration
    exhale: number; // Duration in seconds
    pause: number; // Pause before next instruction
  };
  transitionType?: 'gentle' | 'natural' | 'guided' | 'silent';
  priority: number; // 1-5, importance for timing adjustments
}

export interface PromptAnalysis {
  extractedKeywords: string[];
  emotionalTone: 'stressed' | 'anxious' | 'tired' | 'energized' | 'neutral' | 'peaceful';
  urgencyLevel: 'low' | 'medium' | 'high';
  specificRequests: string[];
  impliedContext: {
    situation?: string; // "before work", "after difficult day", etc.
    timeConstraints?: boolean;
    specificTechniques?: string[]; // "breathing", "body scan", "visualization"
  };
  confidenceScore: number; // How confident the parser is (0-1)
}

export interface SpeechTimingConfig {
  wordsPerMinute: number; // Varies by voice and style
  pauseMultiplier: number; // Adjust for natural speech pauses
  breathingInstructionRate: number; // Slower for breathing cues
  visualizationRate: number; // Slower for complex imagery
}

export interface GuidanceLevelRules {
  beginner: {
    instructionDensity: number; // 0.7 - more instructions
    maxSilenceRatio: number; // 0.3 - less silence
    explanationDetail: 'high';
    encouragementFrequency: 'frequent';
    technicalTerms: false;
  };
  confirmed: {
    instructionDensity: number; // 0.5 - balanced
    maxSilenceRatio: number; // 0.5 - balanced silence
    explanationDetail: 'medium';
    encouragementFrequency: 'moderate';
    technicalTerms: boolean; // Some technical terms OK
  };
  expert: {
    instructionDensity: number; // 0.3 - minimal instructions
    maxSilenceRatio: number; // 0.7 - more silence for self-guidance
    explanationDetail: 'low';
    encouragementFrequency: 'minimal';
    technicalTerms: true; // Can use advanced concepts
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedAdjustments?: {
    duration?: number;
    guidanceLevel?: MeditationSpecification['guidanceLevel'];
    segments?: number;
  };
}

/**
 * Configuration constants for meditation generation
 */
export const MEDITATION_CONFIG = {
  // Speech timing (words per minute by style)
  SPEECH_RATES: {
    calm: 140,
    soothing: 130,
    focused: 150,
    energetic: 160,
  } as const,

  // Breathing timing standards (seconds)
  BREATHING_PATTERNS: {
    gentle: { inhale: 3, hold: 0, exhale: 4, pause: 2 },
    natural: { inhale: 4, hold: 0, exhale: 4, pause: 1 },
    deep: { inhale: 4, hold: 2, exhale: 6, pause: 2 },
    energizing: { inhale: 4, hold: 1, exhale: 4, pause: 0.5 },
  } as const,

  // Duration ranges for different meditation types
  DURATION_RANGES: {
    'quick relief': [2, 5],
    'standard': [5, 15],
    'deep practice': [15, 30],
    'extended': [30, 60],
  } as const,

  // Minimum and maximum segment counts by duration
  SEGMENT_GUIDELINES: {
    short: { min: 3, max: 5 }, // Under 5 minutes
    medium: { min: 5, max: 8 }, // 5-15 minutes
    long: { min: 7, max: 12 }, // Over 15 minutes
  } as const,

  // Guidance level configurations
  GUIDANCE_RULES: {
    beginner: {
      instructionDensity: 0.7,
      maxSilenceRatio: 0.3,
      explanationDetail: 'high',
      encouragementFrequency: 'frequent',
      technicalTerms: false,
    },
    confirmed: {
      instructionDensity: 0.5,
      maxSilenceRatio: 0.5,
      explanationDetail: 'medium',
      encouragementFrequency: 'moderate',
      technicalTerms: true,
    },
    expert: {
      instructionDensity: 0.3,
      maxSilenceRatio: 0.7,
      explanationDetail: 'low',
      encouragementFrequency: 'minimal',
      technicalTerms: true,
    },
  } as const,
} as const;
