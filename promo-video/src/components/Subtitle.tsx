import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { SubtitleItem } from "../data/content";

interface SubtitleProps {
  items: SubtitleItem[];
  customFrame?: number;
  style?: React.CSSProperties;
  bottomOffset?: number;
}

/**
 * Burned-in Arabic Subtitle component.
 * Automatically synchronizes with the video frame, displaying formal Modern Standard Arabic
 * captions with subtle 12-16 frame ease-out transitions.
 */
export const Subtitle: React.FC<SubtitleProps> = ({
  items,
  customFrame,
  style,
  bottomOffset = 60,
}) => {
  const frame = useCurrentFrame();
  const currentFrame = customFrame ?? frame;

  // Find the currently active subtitle item
  const activeItem = items.find(
    (item) => currentFrame >= item.startFrame && currentFrame <= item.endFrame
  );

  if (!activeItem) {
    return null;
  }

  // Smooth ease-out entrance (14 frames)
  const fadeIn = interpolate(
    currentFrame,
    [activeItem.startFrame, activeItem.startFrame + 14],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  // Smooth ease-out exit (14 frames)
  const fadeOut = interpolate(
    currentFrame,
    [activeItem.endFrame - 14, activeItem.endFrame],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }
  );

  const opacity = Math.min(fadeIn, fadeOut);
  const translateY = interpolate(fadeIn, [0, 1], [10, 0]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
        direction: theme.direction,
        opacity,
        transform: `translateY(${translateY}px)`,
        padding: "0 80px",
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(7, 13, 30, 0.88)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${theme.colors.borderMedium}`,
          borderRadius: 14,
          padding: "16px 36px",
          maxWidth: 1500,
          textAlign: "center",
          boxShadow: theme.shadows.panel,
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 38,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            lineHeight: 1.5,
            letterSpacing: 0.2,
          }}
        >
          {activeItem.arabicText}
        </span>
      </div>
    </div>
  );
};
