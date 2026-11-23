import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { PipelineStage } from "../data/content";

interface PipelineDiagramProps {
  stages: PipelineStage[];
  startFrame?: number;
  intervalPerStage?: number;
  activeStageIndex?: number;
  width?: number | string;
  style?: React.CSSProperties;
}

/**
 * Horizontal architecture pipeline flow diagram:
 * Caller > STT > Correction > Semantic Matcher > Question Tree > Dispatch
 * Features sequential node illumination with government-grade precision.
 */
export const PipelineDiagram: React.FC<PipelineDiagramProps> = ({
  stages,
  startFrame = 0,
  intervalPerStage = 24, // ~0.8s per node
  activeStageIndex,
  width = "100%",
  style,
}) => {
  const frame = useCurrentFrame();

  // Determine current active stage if not explicitly passed
  const calculatedActiveIndex =
    activeStageIndex ??
    Math.min(
      stages.length - 1,
      Math.max(0, Math.floor((frame - startFrame) / intervalPerStage))
    );

  return (
    <div
      style={{
        direction: theme.direction,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width,
        backgroundColor: theme.colors.surfaceCard,
        border: `1px solid ${theme.colors.borderMedium}`,
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: theme.shadows.panel,
        ...style,
      }}
    >
      {stages.map((stage, index) => {
        // Stage progress animation (0 to 1)
        const stageStart = startFrame + index * intervalPerStage;
        const stageProgress = interpolate(
          frame,
          [stageStart, stageStart + 16],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }
        );

        const isActive = index === calculatedActiveIndex;
        const isPassed = index < calculatedActiveIndex || stageProgress >= 1;

        const nodeBg = isPassed
          ? "rgba(20, 184, 166, 0.12)"
          : isActive
          ? "rgba(245, 158, 11, 0.14)"
          : "rgba(255, 255, 255, 0.03)";

        const nodeBorder = isPassed
          ? theme.colors.teal.primary
          : isActive
          ? theme.colors.amber.primary
          : theme.colors.borderSubtle;

        const nodeGlow = isPassed
          ? theme.shadows.tealGlow
          : isActive
          ? theme.shadows.amberGlow
          : "none";

        return (
          <React.Fragment key={stage.id}>
            {/* Pipeline Stage Card */}
            <div
              style={{
                flex: 1,
                minWidth: 150,
                backgroundColor: nodeBg,
                border: `1.5px solid ${nodeBorder}`,
                borderRadius: 14,
                padding: "16px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                boxShadow: nodeGlow,
                opacity: isPassed || isActive ? 1 : 0.45,
                transform: isActive ? "scale(1.03)" : "scale(1)",
                position: "relative",
              }}
            >
              {/* Step indicator number */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  backgroundColor: isPassed
                    ? theme.colors.teal.primary
                    : isActive
                    ? theme.colors.amber.primary
                    : "rgba(255, 255, 255, 0.1)",
                  color: isPassed || isActive ? theme.colors.textInverse : theme.colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                {isPassed ? "✓" : stage.order}
              </div>

              {/* Stage Arabic Title */}
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 17,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  marginBottom: 4,
                  whiteSpace: "nowrap",
                }}
              >
                {stage.titleArabic}
              </div>

              {/* Subtitle / Tech Spec */}
              <div
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: 13,
                  color: isPassed
                    ? theme.colors.teal.light
                    : isActive
                    ? theme.colors.amber.light
                    : theme.colors.textMuted,
                  lineHeight: 1.3,
                  marginBottom: 6,
                }}
              >
                {stage.subtitleArabic}
              </div>

              {/* Tech Label Badge */}
              <div
                style={{
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {stage.technology}
              </div>
            </div>

            {/* Connecting Directional Arrow (if not last item) */}
            {index < stages.length - 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isPassed ? theme.colors.teal.primary : theme.colors.borderMedium,
                  fontSize: 22,
                  fontWeight: 900,
                  transform: "scaleX(-1)", // Directs from right-to-left in RTL
                  opacity: isPassed ? 1 : 0.4,
                  flexShrink: 0,
                }}
              >
                ➔
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
