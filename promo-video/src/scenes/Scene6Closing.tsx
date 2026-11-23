import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { metrics } from "../data/metrics";
import { Emblem, LowerThird, Badge, MetricDisplay, SceneTransition } from "../components";

/**
 * Scene 6: Closing & Proposed Pilot Deployment (90 - 100s | 10 seconds = 300 frames)
 *
 * Visuals:
 * - Proposed pilot framing: "مرحلة تجريبية محدودة تحت إشراف الوزارة"
 * - 3-stage timeline (تجهيز، تشغيل تجريبي، تقييم)
 * - Official contact block with placeholders (CONTACT_NAME, CONTACT_EMAIL, CONTACT_PHONE)
 * - Metrics block included ONLY if values in metrics.ts are non-null; otherwise skipped silently.
 * - NO claims of existing deployment, certification, or ministry endorsement anywhere.
 */
export const Scene6Closing: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance animations
  const heroEntrance = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const timelineEntrance = interpolate(frame, [15, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const contactEntrance = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Check if any certified performance metric is non-null
  // Per requirements: If null, skip the metrics block completely and silently.
  const hasCertifiedPerformanceMetrics =
    metrics.callAnswerTimeSeconds !== null ||
    metrics.transcriptionAccuracyPercent !== null ||
    metrics.dispatchTimeReductionPercent !== null;

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "36px 80px 24px 80px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Header */}
        <LowerThird
          tag={content.lowerThirds.closing.tag}
          title={content.lowerThirds.closing.title}
          subtitle={content.lowerThirds.closing.subtitle}
          startFrame={0}
          durationFrames={300}
        />

        {/* Center Presentation Layout */}
        <div
          style={{
            marginTop: 90,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Emblem & Pilot Title */}
          <div
            style={{
              opacity: heroEntrance,
              transform: `translateY(${interpolate(heroEntrance, [0, 1], [18, 0])}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Emblem size={56} accentColor={theme.colors.teal.primary} style={{ marginBottom: 14 }} />

            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 38,
                fontWeight: 800,
                color: theme.colors.textPrimary,
                lineHeight: 1.3,
                marginBottom: 6,
              }}
            >
              {content.closing.pilotTitle}
            </div>

            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 20,
                color: theme.colors.textSecondary,
                maxWidth: 900,
              }}
            >
              {content.closing.pilotSubtitle}
            </div>
          </div>

          {/* 3-Stage Timeline (تجهيز • تشغيل تجريبي • تقييم) */}
          <div
            style={{
              opacity: timelineEntrance,
              transform: `translateY(${interpolate(timelineEntrance, [0, 1], [16, 0])}px)`,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
              width: "100%",
              maxWidth: 1200,
              marginBottom: 28,
            }}
          >
            {content.closing.stages.map((stg) => (
              <div
                key={stg.order}
                style={{
                  backgroundColor: theme.colors.surfaceCard,
                  border: `1.5px solid ${theme.colors.borderMedium}`,
                  borderRadius: 16,
                  padding: "18px 24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  boxShadow: theme.shadows.subtle,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "rgba(20, 184, 166, 0.15)",
                    border: `1px solid ${theme.colors.teal.border}`,
                    color: theme.colors.teal.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: theme.typography.code.fontFamily,
                    fontSize: 15,
                    fontWeight: 800,
                    marginBottom: 10,
                  }}
                >
                  {stg.order}
                </div>

                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 22,
                    fontWeight: 800,
                    color: theme.colors.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  {stg.title}
                </div>

                <div style={{ fontSize: 15, color: theme.colors.textMuted, lineHeight: 1.3 }}>
                  {stg.subtitle}
                </div>

                <div style={{ marginTop: 10 }}>
                  <Badge variant="verified" size="sm" label={stg.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Conditional Metrics Block: ONLY rendered if non-null; otherwise skipped silently */}
          {hasCertifiedPerformanceMetrics && (
            <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
              <MetricDisplay
                label="زمن الاستجابة"
                value={metrics.callAnswerTimeSeconds}
                suffix=" ثوانٍ"
              />
              <MetricDisplay
                label="دقة التفريغ الصوتي"
                value={metrics.transcriptionAccuracyPercent}
                suffix="%"
              />
            </div>
          )}

          {/* Contact Details Block with Placeholders */}
          <div
            style={{
              opacity: contactEntrance,
              transform: `translateY(${interpolate(contactEntrance, [0, 1], [16, 0])}px)`,
              backgroundColor: theme.colors.surfaceCard,
              border: `1px solid ${theme.colors.borderMedium}`,
              borderRadius: 14,
              padding: "16px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 36,
              maxWidth: 960,
              width: "100%",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: theme.colors.teal.primary, fontSize: 16 }}>👤</span>
              <span style={{ fontSize: 16, color: theme.colors.textSecondary }}>
                مسؤول المتابعة الفنية:
              </span>
              <span
                style={{
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {content.closing.contact.name}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: theme.colors.teal.primary, fontSize: 16 }}>✉️</span>
              <span style={{ fontSize: 16, color: theme.colors.textSecondary }}>
                البريد الإلكتروني:
              </span>
              <span
                style={{
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {content.closing.contact.email}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: theme.colors.teal.primary, fontSize: 16 }}>📞</span>
              <span style={{ fontSize: 16, color: theme.colors.textSecondary }}>الهاتف:</span>
              <span
                style={{
                  fontFamily: theme.typography.code.fontFamily,
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.textPrimary,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  padding: "2px 8px",
                  borderRadius: 4,
                }}
              >
                {content.closing.contact.phone}
              </span>
            </div>
          </div>

          {/* Official National Motto */}
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 22,
              fontWeight: 800,
              color: theme.colors.teal.primary,
              letterSpacing: 0.5,
            }}
          >
            {content.closing.motto}
          </div>
        </div>
      </SceneTransition>
    </AbsoluteFill>
  );
};
