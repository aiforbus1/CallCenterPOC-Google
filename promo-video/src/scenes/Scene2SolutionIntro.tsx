import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import { Emblem, LowerThird, PipelineDiagram, Badge, SceneTransition } from "../components";

/**
 * Scene 2: Solution Introduction (12 - 22s | Frames 360 - 660 | Duration: 300 frames)
 * Visuals:
 * - Neutral security emblem with sovereign presence.
 * - Product name placeholder with executive typography.
 * - One-sentence promise card.
 * - Horizontal architecture pipeline assembling in the center with sequential lighting.
 */
export const Scene2SolutionIntro: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrance animations
  const heroEntrance = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const cardEntrance = interpolate(frame, [14, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const pipelineEntrance = interpolate(frame, [25, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Emblem subtle halo pulse (pure mathematical cosine wave)
  const pulseScale = interpolate(Math.cos(frame * 0.08), [-1, 1], [0.98, 1.02]);

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "48px 80px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Header */}
        <LowerThird
          tag={content.lowerThirds.solutionIntro.tag}
          title={content.lowerThirds.solutionIntro.title}
          subtitle={content.lowerThirds.solutionIntro.subtitle}
          startFrame={0}
          durationFrames={300}
        />

        {/* Hero Product Announcement Section */}
        <div
          style={{
            marginTop: 110,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            opacity: heroEntrance,
            transform: `translateY(${interpolate(heroEntrance, [0, 1], [24, 0])}px)`,
            marginBottom: 28,
          }}
        >
          {/* Neutral Security Emblem */}
          <div
            style={{
              transform: `scale(${pulseScale})`,
              marginBottom: 16,
              filter: "drop-shadow(0 0 16px rgba(20, 184, 166, 0.25))",
            }}
          >
            <Emblem size={68} accentColor={theme.colors.teal.primary} />
          </div>

          {/* Product Name Placeholder Header */}
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 44,
              fontWeight: 800,
              color: theme.colors.textPrimary,
              lineHeight: 1.25,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span>[اسم المنظومة المعتمد]</span>
            <span
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 22,
                color: theme.colors.teal.primary,
                backgroundColor: theme.colors.teal.background,
                border: `1px solid ${theme.colors.teal.border}`,
                padding: "4px 14px",
                borderRadius: 8,
              }}
            >
              طوارئ النجدة 122
            </span>
          </div>

          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 22,
              fontWeight: 600,
              color: theme.colors.textSecondary,
              marginBottom: 16,
            }}
          >
            المنصة الوطنية للذكاء الاصطناعي السيادي لغرف عمليات شرطة النجدة
          </div>

          {/* Executive One-Sentence Promise Card */}
          <div
            style={{
              opacity: cardEntrance,
              transform: `translateY(${interpolate(cardEntrance, [0, 1], [16, 0])}px)`,
              backgroundColor: theme.colors.surfaceCard,
              border: `1.5px solid ${theme.colors.teal.border}`,
              borderRadius: 16,
              padding: "16px 36px",
              maxWidth: 1250,
              boxShadow: theme.shadows.tealGlow,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <Badge variant="verified" size="md" label="الوعد التقني السيادي" />
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 22,
                fontWeight: 700,
                color: theme.colors.textPrimary,
                lineHeight: 1.45,
                textAlign: "right",
              }}
            >
              «ذكاء اصطناعي سيادي يُعزز مأمور العمليات، يفهم اللهجة المصرية، ويُوثق أدق تفاصيل
              البلاغ دون خطأ أو تأخير.»
            </div>
          </div>
        </div>

        {/* Central Architecture Pipeline Assembly */}
        <div
          style={{
            opacity: pipelineEntrance,
            transform: `translateY(${interpolate(pipelineEntrance, [0, 1], [20, 0])}px)`,
            width: "100%",
            maxWidth: 1560,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingLeft: 8,
              paddingRight: 8,
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 18,
                fontWeight: 700,
                color: theme.colors.textSecondary,
                display: "flex",
                alignItems: "center",
                gap: 10,
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
              <span>المسار الهندسي المتكامل لمعالجة البلاغ (End-to-End Pipeline)</span>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Badge variant="verified" size="sm" label="معالجة فورية متزامنة" />
              <Badge variant="neutral" size="sm" label="جاهزية تشغيلية" />
            </div>
          </div>

          {/* Sequential Lighting Pipeline Component */}
          <PipelineDiagram
            stages={content.pipelineStages}
            startFrame={30}
            intervalPerStage={35}
          />
        </div>
      </SceneTransition>
    </AbsoluteFill>
  );
};
