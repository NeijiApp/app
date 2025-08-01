/**
 * Optimized meditation segment generator that works within ElevenLabs credit limits
 */

/**
 * Split text into smaller segments to reduce credit usage per API call
 */
export function splitTextIntoSmallSegments(text: string, maxCharsPerSegment: number = 150): string[] {
  // Split by sentences first
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  
  const segments: string[] = [];
  let currentSegment = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // If adding this sentence would exceed the limit, save current segment and start new one
    if (currentSegment.length + trimmedSentence.length > maxCharsPerSegment && currentSegment.length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = trimmedSentence;
    } else {
      currentSegment += (currentSegment ? ' ' : '') + trimmedSentence;
    }
  }
  
  // Add the last segment
  if (currentSegment.trim()) {
    segments.push(currentSegment.trim());
  }
  
  return segments;
}

/**
 * Generate credit-efficient meditation segments for different durations
 */
export function generateCreditEfficientSegments(duration: number, goal: string) {
  const maxCharsPerSegment = 100; // Low credit usage (~100 credits per segment)
  
  // Shorter, more focused meditation content
  let template: Array<{ type: string; content: string; pauseAfter: number }>;
  
  if (duration <= 2) {
    template = [
      { type: 'intro', content: `Welcome to this ${duration}-minute meditation.`, pauseAfter: 2 },
      { type: 'breathing1', content: `Get comfortable and close your eyes.`, pauseAfter: 3 },
      { type: 'breathing2', content: `Focus your attention on your natural breathing.`, pauseAfter: 8 },
      { type: 'body1', content: `Relax your shoulders and release your tensions.`, pauseAfter: 6 },
      { type: 'visualization', content: `Imagine yourself in a peaceful and serene place.`, pauseAfter: 8 },
      { type: 'conclusion', content: `Gently return and open your eyes when you're ready.`, pauseAfter: 2 }
    ];
  } else if (duration <= 5) {
    template = [
      { type: 'intro', content: `Welcome to this ${duration}-minute meditation.`, pauseAfter: 3 },
      { type: 'setup', content: `Settle into a comfortable position that works for you.`, pauseAfter: 4 },
      { type: 'breathing1', content: `Close your eyes and focus on your breathing.`, pauseAfter: 8 },
      { type: 'breathing2', content: `Observe the air flowing in and out naturally.`, pauseAfter: 10 },
      { type: 'body1', content: `Relax your forehead, your eyes, your jaw.`, pauseAfter: 8 },
      { type: 'body2', content: `Release your shoulders, arms, and chest.`, pauseAfter: 8 },
      { type: 'body3', content: `Free your hips, legs, and feet.`, pauseAfter: 8 },
      { type: 'visualization', content: `Visualize your personal place of peace.`, pauseAfter: 15 },
      { type: 'conclusion', content: `Gradually return and open your eyes.`, pauseAfter: 3 }
    ];
  } else {
    template = [
      { type: 'intro', content: `Welcome to this ${duration}-minute meditation.`, pauseAfter: 4 },
      { type: 'setup1', content: `Take time to settle in comfortably.`, pauseAfter: 5 },
      { type: 'setup2', content: `Close your eyes and allow yourself this moment of peace.`, pauseAfter: 5 },
      { type: 'breathing1', content: `Let's connect to your natural breathing.`, pauseAfter: 10 },
      { type: 'breathing2', content: `Feel the cool air entering through your nostrils.`, pauseAfter: 10 },
      { type: 'breathing3', content: `And the warm air flowing out peacefully.`, pauseAfter: 10 },
      { type: 'body1', content: `Let's explore your body with kindness.`, pauseAfter: 8 },
      { type: 'body2', content: `Relax the crown of your head.`, pauseAfter: 8 },
      { type: 'body3', content: `Release all the muscles in your face.`, pauseAfter: 8 },
      { type: 'body4', content: `Free your shoulders and arms.`, pauseAfter: 8 },
      { type: 'body5', content: `Open your chest, relax your belly.`, pauseAfter: 8 },
      { type: 'body6', content: `Release your hips, thighs, and calves.`, pauseAfter: 8 },
      { type: 'visualization1', content: `Now visualize your inner sanctuary.`, pauseAfter: 15 },
      { type: 'visualization2', content: `A unique place that belongs only to you.`, pauseAfter: 15 },
      { type: 'conclusion', content: `Gradually return to your physical body.`, pauseAfter: 4 }
    ];
  }
  
  // Calculate durations to fit the total meditation time
  const totalDurationSeconds = duration * 60;
  const totalPauseTime = template.reduce((sum, seg) => sum + seg.pauseAfter, 0);
  const totalTextTime = template.length * 3; // Estimate ~3 seconds per short segment
  const totalPlannedTime = totalTextTime + totalPauseTime;
  
  // Adjust pauses if needed
  const adjustmentRatio = totalDurationSeconds / totalPlannedTime;
  
  console.log(`📊 Credit-efficient segments: ${template.length} segments, ~${template.reduce((sum, seg) => sum + seg.content.length, 0)} total chars`);
  console.log(`💰 Estimated credits needed: ~${template.length * 100} (vs ${template.reduce((sum, seg) => sum + seg.content.length, 0)} for single segments)`);
  
  return template.map(seg => ({
    ...seg,
    pauseAfter: Math.max(1, Math.round(seg.pauseAfter * adjustmentRatio))
  }));
}

/**
 * Estimate credit usage for a meditation
 */
export function estimateCreditUsage(segments: Array<{ content: string }>): number {
  return segments.reduce((total, seg) => total + seg.content.length, 0);
}

/**
 * Check if meditation can be generated within credit limit
 */
export function canGenerateWithinCredits(segments: Array<{ content: string }>, availableCredits: number): boolean {
  const estimatedUsage = estimateCreditUsage(segments);
  return estimatedUsage <= availableCredits;
}
