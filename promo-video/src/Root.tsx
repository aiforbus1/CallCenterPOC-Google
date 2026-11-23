import React from "react";
import { Composition } from "remotion";
import {
  MainPromo,
  Scene3Standalone,
  Scene4Standalone,
  Scene5Standalone,
  Scene6Standalone,
} from "./Composition";
import { ComponentsShowcase, Teaser30s, Vertical9x16 } from "./scenes";
import { content } from "./data/content";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Full Promotional Video (100 seconds @ 30fps = 3000 frames) */}
      <Composition
        id="MainPromo"
        component={MainPromo}
        durationInFrames={content.metadata.totalFrames}
        fps={content.metadata.fps}
        width={1920}
        height={1080}
        defaultProps={{
          title: content.metadata.title,
        }}
      />

      {/* Standalone Scene 3 Preview (33 seconds @ 30fps = 990 frames) */}
      <Composition
        id="Scene3Preview"
        component={Scene3Standalone}
        durationInFrames={content.timings.liveDemo.durationFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Standalone Scene 4 Preview (17 seconds @ 30fps = 510 frames) */}
      <Composition
        id="Scene4Preview"
        component={Scene4Standalone}
        durationInFrames={content.timings.questionTree.durationFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Standalone Scene 5 Preview (18 seconds @ 30fps = 540 frames) */}
      <Composition
        id="Scene5Preview"
        component={Scene5Standalone}
        durationInFrames={content.timings.trustAndSafety.durationFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Standalone Scene 6 Preview (10 seconds @ 30fps = 300 frames) */}
      <Composition
        id="Scene6Preview"
        component={Scene6Standalone}
        durationInFrames={content.timings.closing.durationFrames}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Studio-Only Component Review Composition */}
      <Composition
        id="Components"
        component={ComponentsShowcase}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Teaser 30s Composition (30 seconds @ 30fps = 900 frames) */}
      <Composition
        id="Teaser30s"
        component={Teaser30s}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Vertical Composition (9:16 for Mobile & WhatsApp Sharing, 33 seconds = 990 frames) */}
      <Composition
        id="Vertical9x16"
        component={Vertical9x16}
        durationInFrames={990}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
