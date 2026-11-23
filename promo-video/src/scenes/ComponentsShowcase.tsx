import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme/theme";
import { getOfflineFontFaceStyles } from "../theme/fonts";
import { content } from "../data/content";
import {
  Badge,
  Emblem,
  LowerThird,
  PhoneCall,
  PipelineDiagram,
  Subtitle,
  TranscriptLine,
  SceneTransition,
} from "../components";

/**
 * Studio-Only Showcase Composition: "Components"
 * Displays every design system component in a live preview environment
 * for design verification before scene assembly.
 */
export const ComponentsShowcase: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        direction: theme.direction,
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        overflow: "hidden",
        padding: "40px 60px",
      }}
    >
      <style>{getOfflineFontFaceStyles()}</style>

      <SceneTransition durationFrames={16} type="fade">
        {/* LowerThird Scene Label Demo */}
        <LowerThird
          tag="نظام المكونات الموحد"
          title="معرض المكونات الرقمية لمنظومة 122"
          subtitle="مكونات مرئية مصممة للبيئات الأمنية الحكومية"
          startFrame={0}
          durationFrames={9999}
        />

        {/* Studio Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <Emblem size={44} accentColor={theme.colors.teal.primary} />
          <div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 24,
                fontWeight: 800,
                color: theme.colors.textPrimary,
              }}
            >
              مكتبة المكونات الرسمية | Studio Showcase
            </div>
            <div
              style={{
                fontFamily: theme.fonts.body,
                fontSize: 15,
                color: theme.colors.textMuted,
              }}
            >
              النسق اللوني: كحلي داكن سيادي • لهجة تنبيه عنبرية (Amber) • حالة أمان تيل (Teal)
            </div>
          </div>
        </div>

        {/* Component Grid Showcase */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1.35fr",
            gap: 28,
            marginBottom: 24,
          }}
        >
          {/* Left Column: Phone Call + Badges + Emblem Showcase */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Phone Call Component */}
            <PhoneCall
              callerLabel={content.demoCall.callerLabel}
              phoneNumber={content.demoCall.callerNumber}
              location={content.demoCall.callerLocation}
              width="100%"
            />

            {/* Badges & Security Emblem Card */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: theme.shadows.subtle,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                حالات الأمان والشارات الرقمية (Badge System):
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <Badge variant="verified" size="md" label="تم التحقق" />
                <Badge variant="review" size="md" label="يحتاج مراجعة بشرية" />
                <Badge variant="neutral" size="md" label="نص خام محفوظ" />
                <Badge variant="verified" size="sm" label="عزل الأوامر" />
                <Badge variant="review" size="sm" label="فارق طول مريب" />
              </div>
            </div>
          </div>

          {/* Right Column: Transcript Line + Semantic Mapping */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* TranscriptLine Component with Active Morphing */}
            <TranscriptLine
              rawText={content.demoCall.rawTranscript}
              correctedText={content.demoCall.correctedTranscript}
              startTransitionFrame={30}
              transitionDurationFrames={20}
              showComparison={true}
            />

            {/* Semantic Matcher Card (from script.md) */}
            <div
              style={{
                backgroundColor: theme.colors.surfaceCard,
                border: `1px solid ${theme.colors.borderMedium}`,
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: theme.shadows.subtle,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: theme.fonts.heading,
                    fontSize: 17,
                    fontWeight: 700,
                    color: theme.colors.textPrimary,
                  }}
                >
                  المطابق الدلالي للبلاغات (Semantic Matcher)
                </div>
                <Badge variant="verified" size="sm" label="تطابق مؤكد" />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: 16,
                  backgroundColor: theme.colors.background,
                  padding: "14px 18px",
                  borderRadius: 10,
                  border: `1px solid ${theme.colors.borderSubtle}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: theme.colors.amber.primary, fontWeight: 600 }}>
                    اللفظ الصوتي المشوه:
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary }}>
                    «{content.demoCall.semanticMatch.garbledSpoken}»
                  </div>
                </div>

                <div style={{ color: theme.colors.teal.primary, fontSize: 22, fontWeight: 900 }}>
                  ←
                </div>

                <div>
                  <div style={{ fontSize: 13, color: theme.colors.teal.primary, fontWeight: 600 }}>
                    التصنيف العملياتي المستخلص:
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.teal.light }}>
                    {content.demoCall.semanticMatch.recognizedType}
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 13,
                  color: theme.colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: theme.colors.teal.primary }}>✓</span>
                <span>{content.demoCall.semanticMatch.clarificationRule}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Diagram Flow Across the Bottom Half */}
        <div style={{ marginBottom: 20 }}>
          <PipelineDiagram
            stages={content.pipelineStages}
            startFrame={0}
            intervalPerStage={28}
          />
        </div>

        {/* Burned-in Subtitles Component Synced to Frame */}
        <Subtitle
          items={content.subtitles}
          customFrame={frame}
          bottomOffset={28}
        />
      </SceneTransition>
    </AbsoluteFill>
  );
};
