/**
 * Precise timing calculations for meditation generation
 * Ensures final audio matches exact requested duration
 */

import type { 
  MeditationSpecification, 
  MeditationSegment, 
  SpeechTimingConfig 
} from './meditation-specification';
import { MEDITATION_CONFIG } from './meditation-specification';

export interface TimingCalculation {
  totalDurationSeconds: number;
  targetSpeechTime: number; // Total time for speaking
  targetSilenceTime: number; // Total time for pauses
  silenceRatio: number; // Percentage of meditation that is silence
  segmentAllowances: {
    averageSegmentSpeechTime: number;
    averageSegmentPauseTime: number;
    totalSegments: number;
  };
}

export interface SegmentTiming {
  estimatedWords: number;
  estimatedSpeechTime: number;
  requiredSilenceTime: number;
  breathingCycles?: number;
  flexibility: number; // How much this segment can be adjusted (0-1)
}

export class MeditationTimingCalculator {
  
  /**
   * Calculate overall timing structure for a meditation
   */
  calculateOverallTiming(spec: MeditationSpecification): TimingCalculation {
    const totalDurationSeconds = spec.inferredDuration * 60;
    
    // Determine silence ratio based on guidance level and goal
    const silenceRatio = this.calculateOptimalSilenceRatio(spec);
    
    // Calculate speech vs silence time
    const targetSilenceTime = totalDurationSeconds * silenceRatio;
    const targetSpeechTime = totalDurationSeconds - targetSilenceTime;
    
    // Determine optimal segment count
    const totalSegments = this.calculateOptimalSegmentCount(spec);
    
    return {
      totalDurationSeconds,
      targetSpeechTime,
      targetSilenceTime,
      silenceRatio,
      segmentAllowances: {
        averageSegmentSpeechTime: targetSpeechTime / totalSegments,
        averageSegmentPauseTime: targetSilenceTime / totalSegments,
        totalSegments,
      },
    };
  }

  /**
   * Calculate speech timing configuration based on voice and style
   */
  getSpeechTimingConfig(spec: MeditationSpecification): SpeechTimingConfig {
    const baseRate = MEDITATION_CONFIG.SPEECH_RATES[spec.voicePreferences.style] || 140;
    
    // Adjust based on guidance level
    let rateMultiplier = 1.0;
    if (spec.guidanceLevel === 'beginner') {
      rateMultiplier = 0.9; // Slower for beginners
    } else if (spec.guidanceLevel === 'expert') {
      rateMultiplier = 1.1; // Slightly faster for experts
    }

    // Adjust based on goal
    let goalMultiplier = 1.0;
    if (spec.goal === 'sleep') {
      goalMultiplier = 0.8; // Much slower for sleep
    } else if (spec.goal === 'energy') {
      goalMultiplier = 1.2; // Faster for energy
    }

    const finalRate = baseRate * rateMultiplier * goalMultiplier;

    return {
      wordsPerMinute: finalRate,
      pauseMultiplier: this.getPauseMultiplier(spec),
      breathingInstructionRate: finalRate * 0.7, // Slower for breathing cues
      visualizationRate: finalRate * 0.8, // Slower for complex imagery
    };
  }

  /**
   * Calculate timing for a specific segment
   */
  calculateSegmentTiming(
    segmentType: MeditationSegment['type'],
    targetSpeechTime: number,
    targetSilenceTime: number,
    spec: MeditationSpecification,
    speechConfig: SpeechTimingConfig
  ): SegmentTiming {
    
    // Adjust speech rate based on segment type
    let effectiveRate = speechConfig.wordsPerMinute;
    if (segmentType === 'breathing') {
      effectiveRate = speechConfig.breathingInstructionRate;
    } else if (segmentType === 'visualization') {
      effectiveRate = speechConfig.visualizationRate;
    }

    // Calculate estimated words that fit in target speech time
    const estimatedWords = Math.floor((targetSpeechTime / 60) * effectiveRate);
    
    // Calculate actual speech time for those words
    const estimatedSpeechTime = (estimatedWords / effectiveRate) * 60;
    
    // Calculate silence requirements
    const requiredSilenceTime = this.calculateSegmentSilence(
      segmentType, 
      targetSilenceTime, 
      spec
    );

    // Calculate breathing cycles if applicable
    const breathingCycles = segmentType === 'breathing' 
      ? this.calculateBreathingCycles(requiredSilenceTime, spec)
      : undefined;

    // Calculate flexibility (how much this segment can be adjusted)
    const flexibility = this.getSegmentFlexibility(segmentType);

    return {
      estimatedWords,
      estimatedSpeechTime,
      requiredSilenceTime,
      breathingCycles,
      flexibility,
    };
  }

  /**
   * Estimate speech time for given text
   */
  estimateSpeechTime(text: string, speechConfig: SpeechTimingConfig): number {
    const words = this.countWords(text);
    const minutes = words / speechConfig.wordsPerMinute;
    return minutes * 60; // Convert to seconds
  }

  /**
   * Generate target word count for specific speech duration
   */
  calculateTargetWordCount(
    targetSpeechTime: number, 
    speechConfig: SpeechTimingConfig,
    segmentType: MeditationSegment['type']
  ): number {
    let effectiveRate = speechConfig.wordsPerMinute;
    
    if (segmentType === 'breathing') {
      effectiveRate = speechConfig.breathingInstructionRate;
    } else if (segmentType === 'visualization') {
      effectiveRate = speechConfig.visualizationRate;
    }

    const minutes = targetSpeechTime / 60;
    return Math.floor(minutes * effectiveRate);
  }

  /**
   * Calculate breathing pattern timing
   */
  calculateBreathingTiming(
    style: MeditationSpecification['constraints']['breathingStyle'],
    cycles: number
  ): { totalTime: number; cycleTime: number; pattern: typeof MEDITATION_CONFIG.BREATHING_PATTERNS[keyof typeof MEDITATION_CONFIG.BREATHING_PATTERNS] } {
    const pattern = MEDITATION_CONFIG.BREATHING_PATTERNS[style];
    const cycleTime = pattern.inhale + (pattern.hold || 0) + pattern.exhale + pattern.pause;
    
    return {
      totalTime: cycleTime * cycles,
      cycleTime,
      pattern,
    };
  }

  /**
   * Validate timing calculations and suggest adjustments
   */
  validateTiming(
    segments: MeditationSegment[],
    spec: MeditationSpecification
  ): {
    isValid: boolean;
    actualDuration: number;
    targetDuration: number;
    variance: number;
    suggestions: string[];
  } {
    const targetDuration = spec.inferredDuration * 60;
    const actualDuration = segments.reduce((total, segment) => 
      total + segment.estimatedSpeechTime + segment.silenceAfter, 0);
    
    const variance = Math.abs(actualDuration - targetDuration);
    const toleranceSeconds = Math.max(5, targetDuration * 0.05); // 5 seconds or 5% tolerance
    
    const suggestions: string[] = [];
    
    if (variance > toleranceSeconds) {
      if (actualDuration > targetDuration) {
        suggestions.push('Reduce content length or silence duration');
        suggestions.push(`Consider removing ${Math.ceil(variance)}s of content/silence`);
      } else {
        suggestions.push('Add more content or extend silence periods');
        suggestions.push(`Consider adding ${Math.ceil(variance)}s of content/silence`);
      }
    }

    return {
      isValid: variance <= toleranceSeconds,
      actualDuration,
      targetDuration,
      variance,
      suggestions,
    };
  }

  /**
   * Private helper methods
   */
  
  private calculateOptimalSilenceRatio(spec: MeditationSpecification): number {
    let baseRatio = spec.constraints.maxSilence;
    
    // Adjust based on goal
    if (spec.goal === 'sleep') {
      baseRatio = Math.min(baseRatio + 0.2, 0.8); // More silence for sleep
    } else if (spec.goal === 'focus') {
      baseRatio = Math.max(baseRatio - 0.1, 0.2); // Less silence for focus
    }

    // Adjust based on duration
    if (spec.inferredDuration <= 3) {
      baseRatio = Math.max(baseRatio - 0.15, 0.15); // Less silence for short meditations
    } else if (spec.inferredDuration >= 20) {
      baseRatio = Math.min(baseRatio + 0.1, 0.8); // More silence for long meditations
    }

    return Math.max(0.1, Math.min(0.8, baseRatio));
  }

  private calculateOptimalSegmentCount(spec: MeditationSpecification): number {
    const duration = spec.inferredDuration;
    
    // Base segment count on duration
    let segmentCount: number;
    if (duration <= 5) {
      segmentCount = Math.max(3, Math.min(5, Math.floor(duration * 0.8)));
    } else if (duration <= 15) {
      segmentCount = Math.max(5, Math.min(8, Math.floor(duration * 0.6)));
    } else {
      segmentCount = Math.max(7, Math.min(12, Math.floor(duration * 0.5)));
    }

    // Adjust based on guidance level
    if (spec.guidanceLevel === 'beginner') {
      segmentCount = Math.min(segmentCount + 2, 10); // More segments for guidance
    } else if (spec.guidanceLevel === 'expert') {
      segmentCount = Math.max(segmentCount - 2, 3); // Fewer segments for experts
    }

    return segmentCount;
  }

  private getPauseMultiplier(spec: MeditationSpecification): number {
    let multiplier = 1.0;
    
    if (spec.constraints.pacePreference === 'slow') {
      multiplier = 1.3;
    } else if (spec.constraints.pacePreference === 'dynamic') {
      multiplier = 0.8;
    }

    if (spec.goal === 'sleep') {
      multiplier *= 1.5; // Extra pauses for sleep
    }

    return multiplier;
  }

  private calculateSegmentSilence(
    segmentType: MeditationSegment['type'],
    baseSilenceTime: number,
    spec: MeditationSpecification
  ): number {
    // Different segment types need different silence ratios
    const silenceMultipliers = {
      intro: 0.5, // Less silence, more talking
      settling: 0.8, // Moderate silence for settling in
      breathing: 1.2, // More silence for breathing practice
      body_scan: 1.0, // Balanced silence
      visualization: 1.1, // Slightly more silence for processing
      mindfulness: 1.0, // Balanced
      integration: 0.9, // Less silence, more integration talk
      closing: 0.6, // Less silence, more closing guidance
    };

    const multiplier = silenceMultipliers[segmentType] || 1.0;
    return baseSilenceTime * multiplier;
  }

  private calculateBreathingCycles(
    availableSilenceTime: number, 
    spec: MeditationSpecification
  ): number {
    const pattern = MEDITATION_CONFIG.BREATHING_PATTERNS[spec.constraints.breathingStyle];
    const cycleTime = pattern.inhale + (pattern.hold || 0) + pattern.exhale + pattern.pause;
    
    return Math.floor(availableSilenceTime / cycleTime);
  }

  private getSegmentFlexibility(segmentType: MeditationSegment['type']): number {
    // How flexible each segment type is for timing adjustments (0 = rigid, 1 = very flexible)
    const flexibilityMap = {
      intro: 0.3, // Intros need to be concise
      settling: 0.7, // Can be adjusted easily
      breathing: 0.5, // Moderate flexibility (cycles are structured)
      body_scan: 0.8, // Very flexible, can skip/add body parts
      visualization: 0.9, // Very flexible content
      mindfulness: 0.8, // Flexible observations
      integration: 0.6, // Moderate flexibility
      closing: 0.4, // Closings should be complete
    };

    return flexibilityMap[segmentType] || 0.5;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

// Export singleton instance
export const timingCalculator = new MeditationTimingCalculator();
