import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { Badge } from "./Badge";

export interface WordToken {
  raw: string;
  corrected?: string;
  isChanged?: boolean;
}

interface TranscriptLineProps {
  tokens?: WordToken[];
  rawText?: string;
  correctedText?: string;
  startTransitionFrame?: number;
  transitionDurationFrames?: number;
  showComparison?: boolean;
  style?: React.CSSProperties;
}

/**
 * Animated TranscriptLine component.
 * Displays raw speech-to-text input, then animates the transition to the corrected
 * version, highlighting phonetically corrected tokens (e.g. "مشغرة" -> "مشاجرة")
 * while strictly preserving caller facts and numbers.
 */
export const TranscriptLine: React.FC<TranscriptLineProps> = ({
  rawText = "الو يا فندم في مشغرة جامدة في شارع التحرير جمب محطة المترو وفيه ناس اتصابت",
  correctedText = "ألو يا فندم في مشاجرة جامدة في شارع التحرير جنب محطة المترو وفيه ناس اتصابت",
  startTransitionFrame = 30,
  transitionDurationFrames = 18,
  showComparison = false,
  style,
}) => {
  const frame = useCurrentFrame();

  // Normalized transition progress: 0 (pure raw) to 1 (fully corrected)
  const progress = interpolate(
    frame,
    [startTransitionFrame, startTransitionFrame + transitionDurationFrames],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const isTransitioning = progress > 0 && progress < 1;
  const isCorrected = progress >= 1;

  // Split both texts to identify changed segments
  const rawWords = rawText.split(" ");
  const correctedWords = correctedText.split(" ");

  return (
    <div
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.surfaceCard,
        border: `1px solid ${
          isCorrected ? theme.colors.teal.border : theme.colors.borderMedium
        }`,
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: isCorrected ? theme.shadows.tealGlow : theme.shadows.panel,
        ...style,
      }}
    >
      {/* Top Meta Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          borderBottom: `1px solid ${theme.colors.borderSubtle}`,
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 24,
              fontWeight: 700,
              color: theme.colors.textPrimary,
            }}
          >
            معالجة البلاغ اللحظية
          </span>
          {isCorrected ? (
            <Badge variant="verified" size="md" label="تم التدقيق الصوتي المباشر" />
          ) : isTransitioning ? (
            <Badge variant="review" size="md" label="جارٍ المعالجة الصوتية..." />
          ) : (
            <Badge variant="neutral" size="md" label="تفريغ صوتي أولي" />
          )}
        </div>

        <div
          style={{
            fontFamily: theme.fonts.body,
            fontSize: 20,
            color: theme.colors.textMuted,
          }}
        >
          {isCorrected ? "تم حفظ الأصل الخام للأرشفة" : "النص الخام المباشر"}
        </div>
      </div>

      {/* Main Animated Text Area */}
      <div
        style={{
          fontFamily: theme.fonts.body,
          fontSize: 36,
          lineHeight: 1.6,
          color: theme.colors.textPrimary,
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 12px",
          alignItems: "center",
        }}
      >
        {rawWords.map((rawWord, idx) => {
          const corrWord = correctedWords[idx] || rawWord;
          const isChanged = rawWord !== corrWord;

          if (!isChanged) {
            return (
              <span key={idx} style={{ color: theme.colors.textPrimary }}>
                {rawWord}
              </span>
            );
          }

          // Conditional styling for changed words
          const currentWord = progress > 0.5 ? corrWord : rawWord;
          const highlightBg =
            progress > 0.5
              ? "rgba(20, 184, 166, 0.18)"
              : "rgba(245, 158, 11, 0.25)";

          const textColor = progress > 0.5 ? theme.colors.teal.light : theme.colors.amber.light;

          return (
            <span
              key={idx}
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: highlightBg,
                border: `1px solid ${
                  progress > 0.5 ? theme.colors.teal.border : theme.colors.amber.border
                }`,
                borderRadius: 8,
                padding: "2px 10px",
                color: textColor,
                fontWeight: 700,
                position: "relative",
              }}
            >
              <span>{currentWord}</span>
              {isChanged && isCorrected && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: theme.typography.code.fontFamily,
                    color: theme.colors.textMuted,
                    lineHeight: 1,
                    marginTop: 2,
                  }}
                >
                  أصل: {rawWord}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Comparison Drawer (if requested) */}
      {showComparison && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px dashed ${theme.colors.borderSubtle}`,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            fontSize: 15,
            fontFamily: theme.fonts.body,
          }}
        >
          <div style={{ color: theme.colors.textMuted }}>
            <span style={{ fontWeight: 600, color: theme.colors.amber.primary }}>الأصل: </span>
            {rawText}
          </div>
          <div style={{ color: theme.colors.textSecondary }}>
            <span style={{ fontWeight: 600, color: theme.colors.teal.primary }}>المصحح: </span>
            {correctedText}
          </div>
        </div>
      )}
    </div>
  );
};
