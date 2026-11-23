import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { Emblem } from "./Emblem";

interface LowerThirdProps {
  tag?: string;
  title: string;
  subtitle?: string;
  startFrame?: number;
  durationFrames?: number;
  style?: React.CSSProperties;
}

/**
 * Official LowerThird component for scene labels and context headers.
 * Government-grade styling with subtle 16-frame ease-out entrance/exit.
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  tag,
  title,
  subtitle,
  startFrame = 0,
  durationFrames = 150,
  style,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0 || relativeFrame > durationFrames) {
    return null;
  }

  // Smooth entrance (16 frames)
  const enterProgress = interpolate(
    relativeFrame,
    [0, 16],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Smooth exit (16 frames)
  const exitProgress = interpolate(
    relativeFrame,
    [durationFrames - 16, durationFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const opacity = Math.min(enterProgress, exitProgress);
  const translateX = interpolate(enterProgress, [0, 1], [40, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        right: 80,
        direction: theme.direction,
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `translateX(${translateX}px)`,
        zIndex: 40,
        ...style,
      }}
    >
      {/* Neutral Security Emblem Badge */}
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 12,
          backgroundColor: theme.colors.surfaceElevated,
          border: `1px solid ${theme.colors.borderMedium}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: theme.shadows.subtle,
          flexShrink: 0,
        }}
      >
        <Emblem size={44} accentColor={theme.colors.teal.primary} />
      </div>

      {/* Text Container */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tag && (
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 20,
              fontWeight: 700,
              color: theme.colors.teal.primary,
              letterSpacing: 1.2,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: theme.colors.teal.primary,
              }}
            />
            <span>{tag}</span>
          </div>
        )}

        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: 36,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              fontFamily: theme.fonts.body,
              fontSize: 24,
              fontWeight: 400,
              color: theme.colors.textSecondary,
              lineHeight: 1.4,
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
