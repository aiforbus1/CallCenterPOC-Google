import { content } from "./content";

/**
 * Egyptian Police Hotline 122 - Audio Ducking & Volume Utilities
 *
 * Implements a government-grade audio mix:
 * - Background music bed runs at baseline volume (~ -13 dBFS = 0.22)
 * - Whenever Arabic narration is active, music ducks smoothly by ~12 dB down to 0.055 (~ -25 dBFS)
 * - Features smooth 12-frame ramps (0.4s) into and out of ducking to prevent sudden volume jumps.
 */

export interface TimeRange {
  start: number;
  end: number;
}

// Active narration frame ranges across all 6 scenes (Voice: Charon - deep male)
export const NARRATION_FRAME_RANGES: TimeRange[] = [
  // Scene 1: Problem (Audio duration: 11.44s = ~343 frames)
  { start: content.timings.problem.startFrame + 5, end: content.timings.problem.startFrame + 343 },
  // Scene 2: Solution Intro (Audio duration: 14.88s = ~446 frames)
  { start: content.timings.solutionIntro.startFrame + 5, end: content.timings.solutionIntro.startFrame + 446 },
  // Scene 3: Live Demo (Audio duration: 30.48s = ~914 frames)
  { start: content.timings.liveDemo.startFrame + 5, end: content.timings.liveDemo.startFrame + 914 },
  // Scene 4: Question Tree (Audio duration: 19.84s = ~595 frames)
  { start: content.timings.questionTree.startFrame + 5, end: content.timings.questionTree.startFrame + 595 },
  // Scene 5: Trust & Safety (Audio duration: 20.00s = ~600 frames)
  { start: content.timings.trustAndSafety.startFrame + 5, end: content.timings.trustAndSafety.startFrame + 600 },
  // Scene 6: Closing (Audio duration: 9.00s = ~270 frames)
  { start: content.timings.closing.startFrame + 5, end: content.timings.closing.startFrame + 270 },
];

/**
 * Calculate dynamic music volume at any given frame with ~12 dB ducking
 */
export function getDuckedMusicVolume(currentFrame: number): number {
  const BASE_VOLUME = 0.22;
  const DUCKED_VOLUME = 0.055; // 20 * log10(0.055 / 0.22) = -12.04 dB
  const RAMP_FRAMES = 12; // 0.4s smooth ease in/out

  for (const range of NARRATION_FRAME_RANGES) {
    // Inside narration window
    if (currentFrame >= range.start && currentFrame <= range.end) {
      return DUCKED_VOLUME;
    }
    // Ramp down into ducking
    if (currentFrame >= range.start - RAMP_FRAMES && currentFrame < range.start) {
      const progress = (currentFrame - (range.start - RAMP_FRAMES)) / RAMP_FRAMES;
      return BASE_VOLUME - progress * (BASE_VOLUME - DUCKED_VOLUME);
    }
    // Ramp up out of ducking
    if (currentFrame > range.end && currentFrame <= range.end + RAMP_FRAMES) {
      const progress = (currentFrame - range.end) / RAMP_FRAMES;
      return DUCKED_VOLUME + progress * (BASE_VOLUME - DUCKED_VOLUME);
    }
  }

  return BASE_VOLUME;
}
