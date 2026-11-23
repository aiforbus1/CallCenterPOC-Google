import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { theme } from "./theme/theme";
import { getOfflineFontFaceStyles } from "./theme/fonts";
import { content } from "./data/content";
import { getDuckedMusicVolume } from "./data/audio";
import {
  Scene1Problem,
  Scene2SolutionIntro,
  Scene3LiveDemo,
  Scene4QuestionTree,
  Scene5TrustAndSafety,
  Scene6Closing,
} from "./scenes";
import { Subtitle } from "./components";

interface MainPromoProps {
  title?: string;
}

export const MainPromo: React.FC<MainPromoProps> = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      {/* Background Music Bed with Smooth ~12 dB Ducking Under Narration */}
      <Audio
        src={staticFile("audio/music/bed.mp3")}
        loop
        volume={(currentFrame) => getDuckedMusicVolume(currentFrame)}
      />

      {/* Voiceover Narration Tracks for Scenes 1 to 6 */}
      <Sequence
        from={content.timings.problem.startFrame}
        durationInFrames={content.timings.problem.durationFrames}
        name="VO: Scene 1 Problem"
      >
        <Audio src={staticFile("audio/vo/scene1.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        from={content.timings.solutionIntro.startFrame}
        durationInFrames={content.timings.solutionIntro.durationFrames}
        name="VO: Scene 2 Solution Intro"
      >
        <Audio src={staticFile("audio/vo/scene2.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        from={content.timings.liveDemo.startFrame}
        durationInFrames={content.timings.liveDemo.durationFrames}
        name="VO: Scene 3 Live Demo"
      >
        <Audio src={staticFile("audio/vo/scene3.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        from={content.timings.questionTree.startFrame}
        durationInFrames={content.timings.questionTree.durationFrames}
        name="VO: Scene 4 Question Tree"
      >
        <Audio src={staticFile("audio/vo/scene4.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        from={content.timings.trustAndSafety.startFrame}
        durationInFrames={content.timings.trustAndSafety.durationFrames}
        name="VO: Scene 5 Trust & Safety"
      >
        <Audio src={staticFile("audio/vo/scene5.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        from={content.timings.closing.startFrame}
        durationInFrames={content.timings.closing.durationFrames}
        name="VO: Scene 6 Closing"
      >
        <Audio src={staticFile("audio/vo/scene6.mp3")} volume={1.0} />
      </Sequence>

      {/* Visual Scene Sequences */}
      {/* Scene 1: Problem (0 - 12s | Frames 0 - 360) */}
      <Sequence
        from={content.timings.problem.startFrame}
        durationInFrames={content.timings.problem.durationFrames}
        name="Visual: Scene 1 Problem"
      >
        <Scene1Problem />
      </Sequence>

      {/* Scene 2: Solution Intro (12 - 26.7s | Frames 360 - 800) */}
      <Sequence
        from={content.timings.solutionIntro.startFrame}
        durationInFrames={content.timings.solutionIntro.durationFrames}
        name="Visual: Scene 2 Solution Intro"
      >
        <Scene2SolutionIntro />
      </Sequence>

      {/* Scene 3: Live Demo (26.7 - 59.7s | Frames 800 - 1790) */}
      <Sequence
        from={content.timings.liveDemo.startFrame}
        durationInFrames={content.timings.liveDemo.durationFrames}
        name="Visual: Scene 3 Live Demo"
      >
        <Scene3LiveDemo />
      </Sequence>

      {/* Scene 4: Question Tree (59.7 - 83.3s | Frames 1790 - 2500) */}
      <Sequence
        from={content.timings.questionTree.startFrame}
        durationInFrames={content.timings.questionTree.durationFrames}
        name="Visual: Scene 4 Question Tree"
      >
        <Scene4QuestionTree />
      </Sequence>

      {/* Scene 5: Trust & Safety (83.3 - 104.3s | Frames 2500 - 3130) */}
      <Sequence
        from={content.timings.trustAndSafety.startFrame}
        durationInFrames={content.timings.trustAndSafety.durationFrames}
        name="Visual: Scene 5 Trust & Safety"
      >
        <Scene5TrustAndSafety />
      </Sequence>

      {/* Scene 6: Closing (104.3 - 113.7s | Frames 3130 - 3410) */}
      <Sequence
        from={content.timings.closing.startFrame}
        durationInFrames={content.timings.closing.durationFrames}
        name="Visual: Scene 6 Closing"
      >
        <Scene6Closing />
      </Sequence>

      {/* Burned-in Arabic Subtitles Overlay across all 6 scenes */}
      <Subtitle items={content.subtitles} bottomOffset={32} />
    </AbsoluteFill>
  );
};

/**
 * Standalone Scene 3 Live Demo Composition with local subtitles
 */
export const Scene3Standalone: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <Audio src={staticFile("audio/vo/scene3.mp3")} volume={1.0} />
      <Scene3LiveDemo />
      <Subtitle
        items={content.subtitles
          .filter((s) => s.sceneId === "liveDemo")
          .map((s) => ({
            ...s,
            startFrame: s.startFrame - content.timings.liveDemo.startFrame,
            endFrame: s.endFrame - content.timings.liveDemo.startFrame,
          }))}
        bottomOffset={32}
      />
    </AbsoluteFill>
  );
};

/**
 * Standalone Scene 4 Question Tree Composition with local subtitles
 */
export const Scene4Standalone: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <Audio src={staticFile("audio/vo/scene4.mp3")} volume={1.0} />
      <Scene4QuestionTree />
      <Subtitle
        items={content.subtitles
          .filter((s) => s.sceneId === "questionTree")
          .map((s) => ({
            ...s,
            startFrame: s.startFrame - content.timings.questionTree.startFrame,
            endFrame: s.endFrame - content.timings.questionTree.startFrame,
          }))}
        bottomOffset={32}
      />
    </AbsoluteFill>
  );
};

/**
 * Standalone Scene 5 Trust & Safety Composition with local subtitles
 */
export const Scene5Standalone: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <Audio src={staticFile("audio/vo/scene5.mp3")} volume={1.0} />
      <Scene5TrustAndSafety />
      <Subtitle
        items={content.subtitles
          .filter((s) => s.sceneId === "trustAndSafety")
          .map((s) => ({
            ...s,
            startFrame: s.startFrame - content.timings.trustAndSafety.startFrame,
            endFrame: s.endFrame - content.timings.trustAndSafety.startFrame,
          }))}
        bottomOffset={32}
      />
    </AbsoluteFill>
  );
};

/**
 * Standalone Scene 6 Closing Composition with local subtitles
 */
export const Scene6Standalone: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        overflow: "hidden",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <Audio src={staticFile("audio/vo/scene6.mp3")} volume={1.0} />
      <Scene6Closing />
      <Subtitle
        items={content.subtitles
          .filter((s) => s.sceneId === "closing")
          .map((s) => ({
            ...s,
            startFrame: s.startFrame - content.timings.closing.startFrame,
            endFrame: s.endFrame - content.timings.closing.startFrame,
          }))}
        bottomOffset={32}
      />
    </AbsoluteFill>
  );
};

export const Teaser30sPlaceholder: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.surfaceDark,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <h2 style={{ fontFamily: theme.fonts.heading, fontSize: 44, color: theme.colors.teal.primary }}>
        {content.metadata.title} (نسخة الإيجاز 30 ثانية)
      </h2>
    </AbsoluteFill>
  );
};

export const Vertical9x16Placeholder: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
        color: theme.colors.textPrimary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>
      <h2 style={{ fontFamily: theme.fonts.heading, fontSize: 48, color: theme.colors.amber.primary }}>
        {content.metadata.title} (نسخة طولية 9:16)
      </h2>
    </AbsoluteFill>
  );
};
