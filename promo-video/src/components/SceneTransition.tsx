import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";

interface SceneTransitionProps {
  children: React.ReactNode;
  durationFrames?: number;
  type?: "fade" | "slide" | "zoom";
  style?: React.CSSProperties;
}

/**
 * SceneTransition component.
 * Implements subtle, government-grade transitions (12-20 frames) using clean ease-out curves.
 * No flashy 3D flips or jarring cuts.
 */
export const SceneTransition: React.FC<SceneTransitionProps> = ({
  children,
  durationFrames = theme.motion.defaultDurationFrames, // 16 frames
  type = "fade",
  style,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [0, durationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const opacity = progress;
  let transform = "none";

  if (type === "slide") {
    const translateY = interpolate(progress, [0, 1], [24, 0]);
    transform = `translateY(${translateY}px)`;
  } else if (type === "zoom") {
    const scale = interpolate(progress, [0, 1], [0.98, 1]);
    transform = `scale(${scale})`;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        opacity,
        transform,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
